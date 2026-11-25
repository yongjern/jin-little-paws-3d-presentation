"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, OrbitControls, Preload, useProgress } from "@react-three/drei";
import { EffectComposer, N8AO, SMAA } from "@react-three/postprocessing";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import ShopScene, { Layers } from "./ShopScene";
import Hud from "./Hud";
import { PaletteName, roomById, RoomId, tour } from "@/data/shop";
import { clearAt, type Footprint, SHOP, walkObstacles, walkSpawns } from "@/data/floorPlan";

type Mode="orbit"|"top"|"walk";

function CameraDirector({selected,mode,orbit}:{selected:RoomId|null;mode:Mode;orbit:React.RefObject<any>}) {
  const {camera,size}=useThree(); const goal=useRef(new THREE.Vector3()); const target=useRef(new THREE.Vector3()); const moving=useRef(false);
  useEffect(()=>{
    camera.up.set(0,mode==="top"?0:1,mode==="top"?-1:0);
    if(mode==="top"){
      const span=Math.max(SHOP.length,SHOP.width*size.height/size.width);
      goal.current.set(0,SHOP.height+span*.56/Math.tan(THREE.MathUtils.degToRad(21)),.01);
      target.current.set(0,0,0);moving.current=true;return;
    }
    if(!selected||mode!=="orbit"){moving.current=false;return}
    const r=roomById[selected]; goal.current.set(...r.camera);target.current.set(...r.target);moving.current=true;
  },[selected,mode,size.width,size.height]);
  useFrame(()=>{
    if(!moving.current||mode==="walk") return;
    camera.position.lerp(goal.current,.065);
    if(mode==="top")camera.lookAt(target.current);
    else if(orbit.current){orbit.current.target.lerp(target.current,.08);orbit.current.update()}
    if(camera.position.distanceTo(goal.current)<.06) moving.current=false;
  });
  return null;
}

function WalkController({active,move,selected,obstacles}:{active:boolean;move:React.MutableRefObject<[number,number]>;selected:RoomId|null;obstacles:Footprint[]}) {
  const {camera,gl}=useThree(); const keys=useRef<Record<string,boolean>>({}); const yaw=useRef(0);const pitch=useRef(0);const dragging=useRef(false);const last=useRef<[number,number]>([0,0]);
  useEffect(()=>{if(!active)return;const [x,z]=walkSpawns[selected||"entrance"];camera.position.set(x,1.62,z);yaw.current=0;pitch.current=0},[active,camera]);
  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{keys.current[e.code]=true};const up=(e:KeyboardEvent)=>{keys.current[e.code]=false};
    const pd=(e:PointerEvent)=>{if(!active)return;dragging.current=true;last.current=[e.clientX,e.clientY]};
    const pu=()=>dragging.current=false;const pm=(e:PointerEvent)=>{if(!active||!dragging.current)return;const dx=e.clientX-last.current[0],dy=e.clientY-last.current[1];yaw.current-=dx*.004;pitch.current=THREE.MathUtils.clamp(pitch.current-dy*.003,-1.15,1.15);last.current=[e.clientX,e.clientY]};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);gl.domElement.addEventListener("pointerdown",pd);window.addEventListener("pointerup",pu);window.addEventListener("pointermove",pm);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);gl.domElement.removeEventListener("pointerdown",pd);window.removeEventListener("pointerup",pu);window.removeEventListener("pointermove",pm)};
  },[active,gl]);
  useFrame((_,dt)=>{
    if(!active)return;camera.rotation.order="YXZ";camera.rotation.y=yaw.current;camera.rotation.x=pitch.current;camera.rotation.z=0;
    const forward=(keys.current.KeyW||keys.current.ArrowUp?1:0)-(keys.current.KeyS||keys.current.ArrowDown?1:0)+move.current[1];
    const side=(keys.current.KeyD||keys.current.ArrowRight?1:0)-(keys.current.KeyA||keys.current.ArrowLeft?1:0)+move.current[0];
    const speed=Math.min(dt,.04)*3.2;const dx=(-Math.sin(yaw.current)*forward+Math.cos(yaw.current)*side)*speed;const dz=(-Math.cos(yaw.current)*forward-Math.sin(yaw.current)*side)*speed;
    if(clearAt(camera.position.x+dx,camera.position.z,obstacles))camera.position.x+=dx;if(clearAt(camera.position.x,camera.position.z+dz,obstacles))camera.position.z+=dz;
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
  const obstacles=useMemo(()=>walkObstacles(layers.walls,layers.furniture,hidden,isolated),[layers.walls,layers.furniture,hidden,isolated]);
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
        <WalkController active={mode==="walk"} move={move} selected={selected} obstacles={obstacles}/>
        <OrbitControls ref={orbit} enabled={started&&mode==="orbit"} makeDefault minDistance={8} maxDistance={42} maxPolarAngle={Math.PI*.48} minPolarAngle={.18} target={[0,0,-.3]} enableDamping dampingFactor={.075}/>
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
