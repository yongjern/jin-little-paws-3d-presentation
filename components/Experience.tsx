"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, OrbitControls, Preload, useProgress } from "@react-three/drei";
import { EffectComposer, N8AO, SMAA } from "@react-three/postprocessing";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import ShopScene, { Layers } from "./ShopScene";
import Hud from "./Hud";
import { PaletteName, roomById, RoomId, rooms, SHOP, tour } from "@/data/shop";

type Mode="orbit"|"top"|"walk";

function CameraDirector({selected,mode,orbit}:{selected:RoomId|null;mode:Mode;orbit:React.RefObject<any>}) {
  const {camera}=useThree(); const goal=useRef(new THREE.Vector3()); const target=useRef(new THREE.Vector3()); const moving=useRef(false);
  useEffect(()=>{
    if(mode==="top"){
      camera.up.set(0,0,-1);goal.current.set(0,31.5,.01);target.current.set(0,0,0);moving.current=true;return;
    }
    camera.up.set(0,1,0);
    if(!selected||mode!=="orbit"){moving.current=false;return}
    const r=roomById[selected]; goal.current.set(...r.camera);target.current.set(...r.target);moving.current=true;
  },[selected,mode,camera]);
  useFrame(()=>{
    if(!moving.current||mode==="walk") return;
    camera.position.lerp(goal.current,.065); if(orbit.current){orbit.current.target.lerp(target.current,.08);orbit.current.update()}
    if(camera.position.distanceTo(goal.current)<.06) moving.current=false;
  });
  return null;
}

const blocks=[
  // thin room partitions; gaps intentionally align with doorways
  {x:-4.3,z:-2.1,w:.18,d:2.5},{x:-4.3,z:.25,w:.18,d:.4},{x:-4.3,z:2.4,w:.18,d:2.1},
  {x:-6.4,z:-3.35,w:4.2,d:.18},{x:-6.4,z:-.25,w:4.2,d:.18},{x:-6.4,z:3.45,w:4.2,d:.18},
  {x:-3.4,z:-2.15,w:1.8,d:.18},{x:.625,z:-2.15,w:4.25,d:.18},{x:3.975,z:-2.15,w:.65,d:.18},{x:5.65,z:-2.15,w:.9,d:.18},{x:7.75,z:-2.15,w:1.5,d:.18},
  {x:-2.125,z:-5.35,w:12.75,d:.18},{x:6.875,z:-5.35,w:3.25,d:.18},
  {x:-2.35,z:-3.75,w:.18,d:3.2},{x:2.3,z:-3.75,w:.18,d:3.2},{x:4.15,z:-3.75,w:.18,d:3.2},{x:5.5,z:-3.75,w:.18,d:3.2},
  {x:-4.3,z:-8.825,w:.18,d:4.35},{x:-4.3,z:-5.55,w:.18,d:.4},{x:4.3,z:-8.825,w:.18,d:4.35},{x:4.3,z:-5.55,w:.18,d:.4},
  // customer-facing fixtures
  {x:0,z:.1,w:4.9,d:2.2},{x:-4.5,z:5.8,w:1.4,d:4.3},{x:-1.5,z:5.8,w:1.4,d:4.3},{x:1.5,z:5.8,w:1.4,d:4.3},{x:4.5,z:5.8,w:1.4,d:4.3},
  {x:-6.4,z:7.8,w:1.4,d:2.3},{x:6.4,z:7.8,w:1.4,d:2.3},{x:0,z:1.55,w:3.8,d:.9},
  {x:6.45,z:-1.48,w:3.7,d:1.15},{x:7.72,z:.95,w:1.15,d:4.1},{x:7.55,z:3,w:1.2,d:.75},
  // grooming cabinetry and tables
  {x:-7.52,z:-1.55,w:.65,d:3},{x:-6.15,z:-1.55,w:1.7,d:1},{x:-7.52,z:2.2,w:.65,d:3},{x:-6.15,z:2.2,w:1.7,d:1},
  // boarding habitats and enrichment equipment
  {x:0,z:-9.35,w:7.4,d:1.3},{x:0,z:-6.55,w:6.2,d:1.3},{x:-6.5,z:-9,w:2.5,d:1.3},
  {x:-7.25,z:-7.25,w:1.8,d:.8},{x:-7.75,z:-6.3,w:1.35,d:1},{x:-5.75,z:-6.2,w:1.45,d:1.2},
  // food preparation, breakroom, WC and storage
  {x:6.25,z:-10.15,w:3.55,d:1.1},{x:7.75,z:-8.45,w:1,d:3.5},{x:5.45,z:-7.7,w:1.6,d:2.25},
  {x:-.2,z:-4.78,w:3.8,d:.9},{x:.2,z:-3.55,w:1.5,d:1},
  {x:3.2,z:-4.65,w:.8,d:1},{x:3.7,z:-3.05,w:.75,d:.7},{x:6.62,z:-3.85,w:2.1,d:2.5}
];
function clearAt(x:number,z:number){
  if(x<-8.05||x>8.05||z<-10.55||z>10.55) return false;
  return !blocks.some(b=>Math.abs(x-b.x)<b.w/2+.35&&Math.abs(z-b.z)<b.d/2+.35);
}

const walkSpawns:Partial<Record<RoomId,[number,number,number]>>={entrance:[0,1.62,9.3],retail:[0,1.62,8.6],service:[-3.1,1.62,1.5],waiting:[5.2,1.62,0],grooming1:[-5.15,1.62,-2.7],grooming2:[-5.15,1.62,3],breakroom:[1.55,1.62,-3.25],wc:[3.2,1.62,-3.5],secure:[4.75,1.62,-3.5],storage:[6.7,1.62,-2.65],boarding:[0,1.62,-7.95],enrichment:[-5.15,1.62,-7.7],foodprep:[6.8,1.62,-6.3]};

function WalkController({active,move,selected}:{active:boolean;move:React.MutableRefObject<[number,number]>;selected:RoomId|null}) {
  const {camera,gl}=useThree(); const keys=useRef<Record<string,boolean>>({}); const yaw=useRef(0);const pitch=useRef(0);const dragging=useRef(false);const last=useRef<[number,number]>([0,0]);
  useEffect(()=>{if(!active)return;const spawn=walkSpawns[selected||"entrance"]||walkSpawns.entrance!;camera.position.set(...spawn);yaw.current=0;pitch.current=0},[active,camera]);
  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{keys.current[e.code]=true};const up=(e:KeyboardEvent)=>{keys.current[e.code]=false};
    const pd=(e:PointerEvent)=>{if(!active)return;dragging.current=true;last.current=[e.clientX,e.clientY]};
    const pu=()=>dragging.current=false;const pm=(e:PointerEvent)=>{if(!active||!dragging.current)return;const dx=e.clientX-last.current[0],dy=e.clientY-last.current[1];yaw.current-=dx*.004;pitch.current=THREE.MathUtils.clamp(pitch.current-dy*.003,-1.15,1.15);last.current=[e.clientX,e.clientY]};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);gl.domElement.addEventListener("pointerdown",pd);window.addEventListener("pointerup",pu);window.addEventListener("pointermove",pm);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);gl.domElement.removeEventListener("pointerdown",pd);window.removeEventListener("pointerup",pu);window.removeEventListener("pointermove",pm)};
  },[active,gl]);
  useFrame((_,dt)=>{
    if(!active)return;camera.rotation.order="YXZ";camera.rotation.y=yaw.current;camera.rotation.x=pitch.current;
    const forward=(keys.current.KeyW||keys.current.ArrowUp?1:0)-(keys.current.KeyS||keys.current.ArrowDown?1:0)+move.current[1];
    const side=(keys.current.KeyD||keys.current.ArrowRight?1:0)-(keys.current.KeyA||keys.current.ArrowLeft?1:0)+move.current[0];
    const speed=Math.min(dt,.04)*3.2;const dx=(-Math.sin(yaw.current)*forward+Math.cos(yaw.current)*side)*speed;const dz=(-Math.cos(yaw.current)*forward-Math.sin(yaw.current)*side)*speed;
    if(clearAt(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(clearAt(camera.position.x,camera.position.z+dz))camera.position.z+=dz;
  }); return null;
}

function Loader(){const {progress}=useProgress();const [ready,setReady]=useState(false);useEffect(()=>{const t=setTimeout(()=>setReady(true),1400);return()=>clearTimeout(t)},[]);const shown=ready?100:Math.max(8,progress);return <div className={`loader ${ready?"done":""}`}><div className="loader-mark"><i/><i/><i/><b/></div><p>Building the little paws world</p><div className="load-track"><span style={{width:`${shown}%`}}/></div><small>{Math.round(shown)}% · procedural scene</small></div>}

function supportsWebGL(){try{const c=document.createElement("canvas");return Boolean(c.getContext("webgl2")||c.getContext("webgl"))}catch{return false}}

export default function Experience(){
  const [started,setStarted]=useState(false);
  const [selected,setSelected]=useState<RoomId|null>(null);const [mode,setMode]=useState<Mode>("orbit");const [hidden,setHidden]=useState<Set<RoomId>>(new Set());const [isolated,setIsolated]=useState<RoomId|null>(null);
  const [layers,setLayers]=useState<Layers>({walls:true,transparentWalls:false,roof:false,furniture:true,labels:true,zones:true,hamsters:true});const [palette,setPalette]=useState<PaletteName>("warm");const [evening,setEvening]=useState(false);const [light,setLight]=useState(1);
  const [touring,setTouring]=useState(false);const [tourIndex,setTourIndex]=useState(0);const [paused,setPaused]=useState(false);const orbit=useRef<any>(null);const move=useRef<[number,number]>([0,0]);const [webgl,setWebgl]=useState<boolean|null>(null);const [visible,setVisible]=useState(true);
  useEffect(()=>{setWebgl(supportsWebGL());const onVisibility=()=>setVisible(!document.hidden);document.addEventListener("visibilitychange",onVisibility);return()=>document.removeEventListener("visibilitychange",onVisibility)},[]);
  const choose=useCallback((id:RoomId)=>{setSelected(id);setMode(current=>current==="walk"?"walk":"orbit")},[]);
  useEffect(()=>{if(!touring||paused)return;setSelected(tour[tourIndex]);const t=window.setTimeout(()=>setTourIndex(i=>i===tour.length-1?i:i+1),6500);return()=>clearTimeout(t)},[touring,tourIndex,paused]);
  const resetView=()=>{setSelected(null);setMode("orbit");if(orbit.current){orbit.current.reset()}};
  if(webgl===false)return <main className="fallback"><div><span>●</span><h1>A 3D-capable browser is needed</h1><p>Please open this presentation in a current Chromium browser with WebGL enabled.</p></div></main>;
  return <main className="experience">
    <a className="skip" href="#controls">Skip to controls</a>
    <Canvas shadows frameloop={visible?"always":"never"} camera={{position:[16,17,22],fov:42,near:.1,far:100}} dpr={[1,1.75]} gl={{antialias:true,powerPreference:"high-performance"}}>
      <Suspense fallback={null}>
        <ShopScene selected={selected} labelFocus={touring?selected:null} onSelect={choose} walkMode={mode==="walk"} hidden={hidden} isolated={isolated} layers={{...layers,labels:started&&layers.labels,zones:started&&layers.zones}} palette={palette} evening={evening} light={light}/>
        <CameraDirector selected={selected} mode={mode} orbit={orbit}/>
        <WalkController active={mode==="walk"} move={move} selected={selected}/>
        <OrbitControls ref={orbit} enabled={started&&mode!=="walk"} enableRotate={mode==="orbit"} makeDefault minDistance={8} maxDistance={42} maxPolarAngle={Math.PI*.48} minPolarAngle={.18} target={[0,0,-.3]} enableDamping dampingFactor={.075}/>
        <EffectComposer multisampling={0}><N8AO aoRadius={1.7} intensity={1.15}/><SMAA/></EffectComposer>
        <AdaptiveDpr pixelated/><Preload all/>
      </Suspense>
    </Canvas>
    <Loader/>
    <Hud started={started} setStarted={setStarted} selected={selected} onSelect={choose} onClose={()=>setSelected(null)} mode={mode} setMode={setMode} resetView={resetView}
      layers={layers} setLayers={setLayers} hidden={hidden} setHidden={setHidden} isolated={isolated} setIsolated={setIsolated}
      palette={palette} setPalette={setPalette} evening={evening} setEvening={setEvening} light={light} setLight={setLight}
      touring={touring} setTouring={setTouring} tourIndex={tourIndex} setTourIndex={setTourIndex} paused={paused} setPaused={setPaused} move={move}/>
  </main>;
}
