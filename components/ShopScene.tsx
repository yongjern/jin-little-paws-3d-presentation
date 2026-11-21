"use client";

import { Html } from "@react-three/drei";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { PaletteName, palettes, RoomId, rooms, SHOP } from "@/data/shop";

export type Layers = { walls:boolean; transparentWalls:boolean; roof:boolean; furniture:boolean; labels:boolean; zones:boolean; cats:boolean };
type Props = { selected:RoomId|null; onSelect:(id:RoomId)=>void; hidden:Set<RoomId>; isolated:RoomId|null; layers:Layers; palette:PaletteName; evening:boolean; light:number };

const Box = ({p,s,c,rough=0.72,metal=0,rot=[0,0,0]}:{p:[number,number,number];s:[number,number,number];c:string;rough?:number;metal?:number;rot?:[number,number,number]}) => (
  <mesh position={p} rotation={rot} castShadow receiveShadow>
    <boxGeometry args={s}/><meshStandardMaterial color={c} roughness={rough} metalness={metal}/>
  </mesh>
);

function Wall({p,s,color,opacity}:{p:[number,number,number];s:[number,number,number];color:string;opacity:number}) {
  const transparent=opacity<1;
  return <mesh position={p} castShadow={!transparent} receiveShadow>
    <boxGeometry args={s}/><meshStandardMaterial color={color} roughness={0.86} transparent={transparent} opacity={opacity} depthWrite={!transparent}/>
  </mesh>;
}

function RoomZones({selected,onSelect,hidden,isolated,show}:{selected:RoomId|null;onSelect:(id:RoomId)=>void;hidden:Set<RoomId>;isolated:RoomId|null;show:boolean}) {
  const [hovered,setHovered]=useState<RoomId|null>(null);
  return <>{rooms.map(r=>{
    const excluded=hidden.has(r.id)||(isolated!==null&&isolated!==r.id);
    if(excluded) return null;
    const active=selected===r.id, over=hovered===r.id;
    return <mesh key={r.id} position={[r.center[0],0.025,r.center[2]]} rotation={[-Math.PI/2,0,0]}
      onPointerOver={(e:ThreeEvent<PointerEvent>)=>{e.stopPropagation();setHovered(r.id);document.body.style.cursor="pointer"}}
      onPointerOut={()=>{setHovered(null);document.body.style.cursor="default"}}
      onClick={(e)=>{e.stopPropagation();onSelect(r.id)}}>
      <planeGeometry args={r.size}/>
      <meshStandardMaterial color={r.color} transparent opacity={show?(active?.55:over?.38:.16):.01} roughness={.9}/>
    </mesh>
  })}</>;
}

function RoomLabels({hidden,isolated}:{hidden:Set<RoomId>;isolated:RoomId|null}) {
  return <>{rooms.map(r=>(hidden.has(r.id)||(isolated&&isolated!==r.id))?null:<Html key={r.id} center position={[r.center[0],.24,r.center[2]]} distanceFactor={18} style={{pointerEvents:"none",userSelect:"none"}}>
    <span className="room-label">{r.label||r.name}</span>
  </Html>)}</>;
}

function Product({p,color}:{p:[number,number,number];color:string}) {
  return <Box p={p} s={[.22,.48,.16]} c={color} rough={.65}/>;
}

// --- retail, service and care fixtures -------------------------------------------------
function RetailFixtures({wood,accent}:{wood:string;accent:string}) {
  const packs=["#c9826e","#79958a","#e5b75e","#8799ad","#d8d0b4"];
  return <group>
    {[-4.5,-1.5,1.5,4.5].map((x,i)=><group key={x} position={[x,0,5.8]}>
      <Box p={[0,.62,0]} s={[1.25,1.2,4.15]} c={wood}/>
      {[0,1,2,3,4].flatMap(row=>[-1,-.5,0,.5,1].map((z,col)=><Product key={`${row}-${col}`} p={[-.42+row*.21,1.42,-1+col*.5]} color={packs[(i+row+col)%packs.length]}/>))}
    </group>)}
    {[-6.4,6.4].map(x=><group key={x} position={[x,0,7.8]}><Box p={[0,.45,0]} s={[1.25,.9,2.2]} c={accent}/>
      {[0,1,2].map(i=><mesh key={i} position={[0,.98,-.55+i*.55]} castShadow><cylinderGeometry args={[.3,.36,.3,20]}/><meshStandardMaterial color={packs[i]}/></mesh>)}
      </group>)}
  </group>;
}

function ServiceCounter({wood,accent}:{wood:string;accent:string}) {
  return <group position={[0,0,.25]}>
    <mesh position={[0,.65,0]} castShadow receiveShadow><cylinderGeometry args={[2.45,2.45,1.3,48,1,false,0,Math.PI]}/><meshStandardMaterial color={wood}/></mesh>
    <Box p={[0,.72,-.7]} s={[4.8,1.45,1.4]} c={wood}/>
    <Box p={[0,1.48,-.7]} s={[4.8,.14,1.45]} c="#e8dfd1" rough={.38}/>
    {[-1.25,0,1.25].map(x=><group key={x} position={[x,0,0]}><Box p={[0,1.85,-.62]} s={[.65,.42,.08]} c="#263632" rough={.25}/><Box p={[0,1.55,-.62]} s={[.07,.28,.07]} c="#867e73" metal={.6}/></group>)}
    <Html center position={[0,1.12,.82]} distanceFactor={12} style={{pointerEvents:"none",userSelect:"none"}}><span className="counter-sign">SERVICE · CARE</span></Html>
    <mesh position={[-1.5,.38,1.55]} castShadow><cylinderGeometry args={[.35,.4,.76,24]}/><meshStandardMaterial color={accent}/></mesh>
    <mesh position={[1.5,.38,1.55]} castShadow><cylinderGeometry args={[.35,.4,.76,24]}/><meshStandardMaterial color={accent}/></mesh>
  </group>;
}

function Waiting({wood,accent}:{wood:string;accent:string}) {
  return <group>
    {[-2.1,-.7,.7,2.1].map((z,i)=><group key={z} position={[7.25,0,z]}><Box p={[0,.45,0]} s={[1.2,.85,1.05]} c={i%2?accent:"#d9c4aa"}/><Box p={[.48,.95,0]} s={[.18,.85,1.05]} c={wood}/></group>)}
    <mesh position={[5.25,.42,1.45]} castShadow><cylinderGeometry args={[.65,.72,.84,30]}/><meshStandardMaterial color="#dcb08e"/></mesh>
    <mesh position={[5.25,.87,1.45]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.35,.12,12,30]}/><meshStandardMaterial color="#f2eadc"/></mesh>
  </group>;
}

function Grooming({z,accent}:{z:number;accent:string}) { return <group position={[-6.1,0,z]}>
  <Box p={[0,.78,0]} s={[1.55,.16,.8]} c="#dedbd2" metal={.1}/><Box p={[0,.4,0]} s={[.14,.75,.14]} c="#7c7f7d" metal={.7}/>
  <Box p={[-1.1,.55,-.9]} s={[.75,1.1,1.15]} c="#ece6db"/><mesh position={[-1.1,1.12,-.9]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.27,.07,12,30]}/><meshStandardMaterial color={accent}/></mesh>
  <Box p={[1.15,.9,-1]} s={[.55,1.8,.34]} c={accent}/>
  <mesh position={[0,.95,.1]}><torusGeometry args={[.35,.035,10,30]}/><meshStandardMaterial color="#a6a6a2" metalness={.7}/></mesh>
  </group> }

function HotelSuites({wood,accent}:{wood:string;accent:string}) {
  return <group>{[-8.45,-6.5].map(z=>[-3,-1.8,-.6,.6,1.8,3].map((x,i)=><group key={`${z}-${x}`} position={[x,0,z]}>
    <Box p={[0,1,0]} s={[1.05,1.9,1.15]} c={wood}/><Box p={[0,1.05,.585]} s={[.76,1.45,.035]} c="#dce6df" rough={.15}/>
    <mesh position={[0,.75,.64]}><circleGeometry args={[.18,24]}/><meshStandardMaterial color={accent}/></mesh>
    <Box p={[0,.18,.7]} s={[.7,.12,.55]} c="#e1c1a4"/>
  </group>))}</group>;
}

function BackFixtures({wood,accent}:{wood:string;accent:string}) {
  return <group>
    <HotelSuites wood={wood} accent={accent}/>
    {/* enrichment */}
    <mesh position={[-6.5,.55,-7.5]} castShadow><cylinderGeometry args={[.55,.68,1.1,28]}/><meshStandardMaterial color="#dca07a"/></mesh>
    {[[-7.4,1.2,-8.4],[-5.5,1.7,-7.6],[-7,2.35,-6.45]].map((p,i)=><group key={i}>
      <Box p={[p[0],p[1]/2,p[2]] as [number,number,number]} s={[.12,p[1],.12]} c={wood}/>
      <mesh position={p as [number,number,number]}><cylinderGeometry args={[.58,.58,.14,28]}/><meshStandardMaterial color={i===1?accent:"#d9b697"}/></mesh>
    </group>)}
    <mesh position={[-5.8,.35,-8.8]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[.38,.14,16,30,Math.PI*1.65]}/><meshStandardMaterial color={accent}/></mesh>
    {/* prep and cleaning */}
    <Box p={[7.35,.75,-8.6]} s={[1.2,1.5,3.6]} c="#c9ccca" metal={.55}/><Box p={[6.2,.9,-9.1]} s={[1.2,1.8,1.2]} c="#d8dcd9" metal={.45}/>
    <mesh position={[6.2,1.83,-9.1]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.32,.06,12,28]}/><meshStandardMaterial color="#8c9994" metalness={.8}/></mesh>
    <Box p={[5.25,.62,-7.25]} s={[1.3,1.2,2.2]} c="#e6e0d5"/><Box p={[5.25,1.27,-7.25]} s={[1.34,.1,2.25]} c={wood}/>
    {/* break room, storage */}
    <Box p={[-.4,.74,-3.8]} s={[2.2,1.48,.8]} c={wood}/><Box p={[1.25,.45,-3.8]} s={[.8,.85,.8]} c={accent}/>
    {[6.3,7.25].map(x=><Box key={x} p={[x,1,-3.8]} s={[.75,1.9,1.75]} c="#c7b39b"/>)}
    <mesh position={[3.2,.42,-3.8]} castShadow><cylinderGeometry args={[.34,.34,.84,24]}/><meshStandardMaterial color="#e8e3d9"/></mesh>
    <Box p={[3.2,.85,-4.55]} s={[.95,.1,.55]} c="#e8e3d9"/>
  </group>;
}

function Cat({p,color="coral",phase=0}:{p:[number,number,number];color?:string;phase?:number}) {
  const g=useRef<THREE.Group>(null); const tail=useRef<THREE.Mesh>(null);
  useFrame(({clock})=>{const t=clock.elapsedTime+phase;if(g.current){g.current.position.x=p[0]+Math.sin(t*.35)*.45;g.current.rotation.y=Math.cos(t*.35)>0?Math.PI/2:-Math.PI/2}if(tail.current)tail.current.rotation.z=Math.sin(t*2.1)*.22});
  return <group ref={g} position={p} scale={.72}>
    <mesh castShadow position={[0,.34,0]}><capsuleGeometry args={[.22,.5,8,16]}/><meshStandardMaterial color={color}/></mesh>
    <mesh castShadow position={[0,.65,.3]}><sphereGeometry args={[.24,20,16]}/><meshStandardMaterial color={color}/></mesh>
    {[[-.15,.88,.31],[.15,.88,.31]].map((v,i)=><mesh key={i} position={v as [number,number,number]} rotation={[0,0,i?-.2:.2]}><coneGeometry args={[.1,.23,3]}/><meshStandardMaterial color={color}/></mesh>)}
    <mesh ref={tail} position={[0,.4,-.45]} rotation={[0,0,.3]}><capsuleGeometry args={[.055,.55,5,10]}/><meshStandardMaterial color={color}/></mesh>
    {[[-.15,.11,.2],[.15,.11,.2]].map((v,i)=><mesh key={i} position={v as [number,number,number]}><capsuleGeometry args={[.07,.28,5,10]}/><meshStandardMaterial color={color}/></mesh>)}
  </group>;
}

function Entrance({accent}:{accent:string}) {
  const left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null); const {camera}=useThree();
  useFrame(()=>{const near=camera.position.z>8&&Math.abs(camera.position.x)<3; const a=near?Math.PI*.38:0;if(left.current)left.current.rotation.y=THREE.MathUtils.lerp(left.current.rotation.y,a,.08);if(right.current)right.current.rotation.y=THREE.MathUtils.lerp(right.current.rotation.y,-a,.08)});
  return <group>
    <group ref={left} position={[-1.55,0,10.86]}><Box p={[.78,1.25,0]} s={[1.5,2.5,.08]} c="#aac4bc" rough={.18}/></group>
    <group ref={right} position={[1.55,0,10.86]}><Box p={[-.78,1.25,0]} s={[1.5,2.5,.08]} c="#aac4bc" rough={.18}/></group>
    <Box p={[0,3.15,10.82]} s={[7.5,.72,.22]} c={accent}/>
    <Html center position={[0,3.17,10.96]} distanceFactor={12} style={{pointerEvents:"none",userSelect:"none"}}><span className="entrance-sign">THE JIN LITTLE PAWS CO. <b>•</b></span></Html>
  </group>;
}

function InteriorDoor({p,width=.9,axis,wall,wood,opacity,swing=1}:{p:[number,number];width?:number;axis:"x"|"z";wall:string;wood:string;opacity:number;swing?:number}) {
  const [x,z]=p, thickness=SHOP.wall, doorHeight=2.42, lintelHeight=SHOP.height-doorHeight;
  const base=axis==="x"?0:Math.PI/2;
  const hinge: [number,number,number]=axis==="x"?[x-width/2,0,z]:[x,0,z-width/2];
  const lintelSize:[number,number,number]=axis==="x"?[width,lintelHeight,thickness]:[thickness,lintelHeight,width];
  return <group>
    <Wall p={[x,doorHeight+lintelHeight/2,z]} s={lintelSize} color={wall} opacity={opacity}/>
    <group position={hinge} rotation={[0,base+swing*Math.PI*.43,0]}>
      <Box p={[width/2,doorHeight/2,0]} s={[width,doorHeight,.065]} c={wood} rough={.5}/>
      <mesh position={[width*.82,1.12,.055]} castShadow><sphereGeometry args={[.055,12,10]}/><meshStandardMaterial color="#b7a182" metalness={.7} roughness={.3}/></mesh>
    </group>
  </group>;
}

function Architecture({wall,floor,wood,accent,wallOpacity,roof,walls}:{wall:string;floor:string;wood:string;accent:string;wallOpacity:number;roof:boolean;walls:boolean}) {
  const h=SHOP.height, y=h/2, w=SHOP.wall;
  return <group>
    <Box p={[0,-.11,0]} s={[SHOP.width,.22,SHOP.length]} c={floor} rough={.84}/>
    {walls&&<>{/* perimeter shell with centered glazed entrance */}
    <Wall p={[0,y,-11]} s={[17,h,w]} color={wall} opacity={wallOpacity}/>
    <Wall p={[-8.5,y,0]} s={[w,h,22]} color={wall} opacity={wallOpacity}/>
    <Wall p={[8.5,y,0]} s={[w,h,22]} color={wall} opacity={wallOpacity}/>
    <Wall p={[-5.6,y,11]} s={[5.8,h,w]} color={wall} opacity={wallOpacity}/>
    <Wall p={[5.6,y,11]} s={[5.8,h,w]} color={wall} opacity={wallOpacity}/>
    {/* grooming block: two walk-through doors match the east wall openings */}
    <Wall p={[-4.3,y,-2.1]} s={[w,h,2.5]} color={wall} opacity={wallOpacity}/>
    <Wall p={[-4.3,y,.25]} s={[w,h,.4]} color={wall} opacity={wallOpacity}/>
    <Wall p={[-4.3,y,2.4]} s={[w,h,2.1]} color={wall} opacity={wallOpacity}/>
    <InteriorDoor p={[-4.3,-.4]} axis="z" wall={wall} wood={wood} opacity={wallOpacity} swing={1}/>
    <InteriorDoor p={[-4.3,.9]} axis="z" wall={wall} wood={wood} opacity={wallOpacity} swing={1}/>
    <Wall p={[-6.4,y,-.25]} s={[4.2,h,w]} color={wall} opacity={wallOpacity}/>
    <Wall p={[-6.4,y,3.45]} s={[4.2,h,w]} color={wall} opacity={wallOpacity}/>
    <Wall p={[-6.4,y,-3.35]} s={[4.2,h,w]} color={wall} opacity={wallOpacity}/>
    {/* staff/service band: breakroom, WC, secure-entry and storage doors */}
    <Wall p={[-3.4,y,-2.15]} s={[1.8,h,w]} color={wall} opacity={wallOpacity}/>
    <Wall p={[.625,y,-2.15]} s={[4.25,h,w]} color={wall} opacity={wallOpacity}/>
    <Wall p={[3.975,y,-2.15]} s={[.65,h,w]} color={wall} opacity={wallOpacity}/>
    <Wall p={[5.65,y,-2.15]} s={[.9,h,w]} color={wall} opacity={wallOpacity}/>
    <Wall p={[7.75,y,-2.15]} s={[1.5,h,w]} color={wall} opacity={wallOpacity}/>
    <InteriorDoor p={[-2,-2.15]} width={1} axis="x" wall={wall} wood={wood} opacity={wallOpacity} swing={1}/>
    <InteriorDoor p={[3.2,-2.15]} axis="x" wall={wall} wood={wood} opacity={wallOpacity} swing={1}/>
    <InteriorDoor p={[4.75,-2.15]} axis="x" wall={wall} wood={wood} opacity={wallOpacity} swing={1}/>
    <InteriorDoor p={[6.55,-2.15]} axis="x" wall={wall} wood={wood} opacity={wallOpacity} swing={1}/>
    {/* second secure threshold into animal-care spaces */}
    <Wall p={[-2.125,y,-5.35]} s={[12.75,h,w]} color={wall} opacity={wallOpacity}/>
    <Wall p={[6.875,y,-5.35]} s={[3.25,h,w]} color={wall} opacity={wallOpacity}/>
    <InteriorDoor p={[4.75,-5.35]} width={1} axis="x" wall={wall} wood={wood} opacity={wallOpacity} swing={1}/>
    {[-2.35,2.3,4.15,5.5].map(x=><Wall key={x} p={[x,y,-3.75]} s={[w,h,3.2]} color={wall} opacity={wallOpacity}/>)}
    {/* hotel, enrichment and preparation inter-room doors */}
    <Wall p={[-4.3,y,-8.825]} s={[w,h,4.35]} color={wall} opacity={wallOpacity}/>
    <Wall p={[-4.3,y,-5.55]} s={[w,h,.4]} color={wall} opacity={wallOpacity}/>
    <InteriorDoor p={[-4.3,-6.2]} axis="z" wall={wall} wood={wood} opacity={wallOpacity} swing={1}/>
    <Wall p={[4.3,y,-8.825]} s={[w,h,4.35]} color={wall} opacity={wallOpacity}/>
    <Wall p={[4.3,y,-5.55]} s={[w,h,.4]} color={wall} opacity={wallOpacity}/>
    <InteriorDoor p={[4.3,-6.2]} axis="z" wall={wall} wood={wood} opacity={wallOpacity} swing={-1}/>
    <Entrance accent={accent}/></>}
    {roof&&<mesh position={[0,4.03,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[17,22]}/><meshStandardMaterial color="#f1eadf" transparent opacity={.94}/></mesh>}
    {/* little threshold paw medallions */}
    {[-.72,0,.72].map((x,i)=><mesh key={x} position={[x,.015,9.75+i*.08]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.14,24]}/><meshStandardMaterial color={i===1?wood:accent}/></mesh>)}
  </group>;
}

export default function ShopScene({selected,onSelect,hidden,isolated,layers,palette,evening,light}:Props) {
  const p=palettes[palette]; const isVisible=(id:RoomId)=>!hidden.has(id)&&(!isolated||isolated===id);
  const env=evening?"#25302f":"#e8eee6";
  const wallOpacity=selected?(layers.transparentWalls?.13:.18):(layers.transparentWalls?.26:1);
  return <>
    <color attach="background" args={[env]}/>
    <fog attach="fog" args={[env,24,44]}/>
    <ambientLight intensity={(evening?.24:.54)*light}/>
    <hemisphereLight args={[evening?"#778aa0":"#fff7e6","#6f7668",(evening?.38:.8)*light]}/>
    <directionalLight position={[-8,15,9]} intensity={(evening?.75:1.75)*light} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={15} shadow-camera-bottom={-15}/>
    {evening&&<pointLight position={[0,3,-1]} color="#ffd8a8" intensity={22*light} distance={18}/>} 
    <Architecture wall={p.wall} floor={p.floor} wood={p.wood} accent={p.accent} wallOpacity={wallOpacity} roof={layers.roof} walls={layers.walls}/>
    {layers.furniture&&<>
      {isVisible("retail")&&<RetailFixtures wood={p.wood} accent={p.accent}/>} 
      {isVisible("service")&&<ServiceCounter wood={p.wood} accent={p.accent}/>} 
      {isVisible("waiting")&&<Waiting wood={p.wood} accent={p.accent}/>} 
      {isVisible("grooming1")&&<Grooming z={-1.55} accent={p.accent}/>} 
      {isVisible("grooming2")&&<Grooming z={2.2} accent={p.accent}/>} 
      <BackFixtures wood={p.wood} accent={p.accent}/>
    </>}
    <RoomZones selected={selected} onSelect={onSelect} hidden={hidden} isolated={isolated} show={layers.zones}/>
    {layers.labels&&<RoomLabels hidden={hidden} isolated={isolated}/>} 
    {layers.cats&&<><Cat p={[-6.4,0,-6.8]} color="#bb765c"/><Cat p={[1.2,0,-7.5]} color="#9da59b" phase={2.4}/><Cat p={[5.7,0,.8]} color="#d1aa77" phase={4.7}/></>}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.24,0]} receiveShadow><planeGeometry args={[80,80]}/><meshStandardMaterial color={evening?"#1c2625":"#b8b8a7"} roughness={1}/></mesh>
  </>;
}
