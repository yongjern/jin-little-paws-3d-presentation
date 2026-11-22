"use client";

import { Html } from "@react-three/drei";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PaletteName, palettes, RoomId, rooms, SHOP } from "@/data/shop";

export type Layers = { walls:boolean; transparentWalls:boolean; roof:boolean; furniture:boolean; labels:boolean; zones:boolean; hamsters:boolean };
type Props = { selected:RoomId|null; labelFocus:RoomId|null; onSelect:(id:RoomId)=>void; walkMode:boolean; hidden:Set<RoomId>; isolated:RoomId|null; layers:Layers; palette:PaletteName; evening:boolean; light:number };

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

function RoomZones({selected,focus,onSelect,walkMode,hidden,isolated,show}:{selected:RoomId|null;focus:RoomId|null;onSelect:(id:RoomId)=>void;walkMode:boolean;hidden:Set<RoomId>;isolated:RoomId|null;show:boolean}) {
  const [hovered,setHovered]=useState<RoomId|null>(null);
  return <>{rooms.map(r=>{
    const excluded=hidden.has(r.id)||(isolated!==null&&isolated!==r.id);
    if(excluded) return null;
    const active=selected===r.id, over=hovered===r.id;
    return <mesh key={r.id} position={[r.center[0],0.025,r.center[2]]} rotation={[-Math.PI/2,0,0]}
      onPointerOver={(e:ThreeEvent<PointerEvent>)=>{e.stopPropagation();setHovered(r.id);document.body.style.cursor="pointer"}}
      onPointerOut={()=>{setHovered(null);document.body.style.cursor="default"}}
      onClick={(e)=>{e.stopPropagation();if(!walkMode)onSelect(r.id)}}
      onDoubleClick={(e)=>{e.stopPropagation();if(walkMode)onSelect(r.id)}}>
      <planeGeometry args={r.size}/>
      <meshStandardMaterial color={r.color} transparent opacity={show?(active?.9:over?.74:focus?.14:.6):.01} roughness={.82}/>
    </mesh>
  })}</>;
}

function RoomLabels({hidden,isolated,focus}:{hidden:Set<RoomId>;isolated:RoomId|null;focus:RoomId|null}) {
  return <>{rooms.map(r=>(hidden.has(r.id)||(isolated&&isolated!==r.id)||(focus&&focus!==r.id))?null:<Html key={r.id} center position={[r.center[0],.24,r.center[2]]} distanceFactor={18} style={{pointerEvents:"none",userSelect:"none"}}>
    <span className="room-label">{r.label||r.name}</span>
  </Html>)}</>;
}

// --- retail, service and care fixtures -------------------------------------------------
function FoodBag({p,color,label}:{p:[number,number,number];color:string;label:string}) {
  return <group position={p}>
    <mesh castShadow scale={[.72,1,.38]}><sphereGeometry args={[.25,18,12]}/><meshStandardMaterial color={color} roughness={.82}/></mesh>
    <Box p={[0,.01,.1]} s={[.28,.18,.035]} c="#f5ead3" rough={.7}/>
    <Html center position={[0,.01,.122]} distanceFactor={7} style={{pointerEvents:"none",userSelect:"none"}}><span style={{fontSize:"5px",fontWeight:800,color:"#473b31",letterSpacing:".04em"}}>{label}</span></Html>
  </group>;
}

function TreatJar({p,color}:{p:[number,number,number];color:string}) {
  return <group position={p}>
    <mesh castShadow><cylinderGeometry args={[.14,.14,.3,18]}/><meshPhysicalMaterial color="#f4ede0" transparent opacity={.72} roughness={.15}/></mesh>
    <mesh position={[0,.17,0]} castShadow><cylinderGeometry args={[.15,.15,.05,18]}/><meshStandardMaterial color={color} roughness={.45}/></mesh>
    {([[-.05,-.02],[.04,.03],[0,-.06]] as [number,number][]).map(([x,z],i)=><mesh key={i} position={[x,-.03,z]}><sphereGeometry args={[.035,10,8]}/><meshStandardMaterial color={i===1?"#c99b5d":"#8c6745"}/></mesh>)}
  </group>;
}

function WaterBottle({p,color}:{p:[number,number,number];color:string}) {
  return <group position={p}>
    <mesh castShadow><cylinderGeometry args={[.105,.125,.36,18]}/><meshPhysicalMaterial color="#c9e5e2" transparent opacity={.66} roughness={.12}/></mesh>
    <mesh position={[0,.2,0]}><cylinderGeometry args={[.07,.1,.06,18]}/><meshStandardMaterial color={color}/></mesh>
    <mesh position={[.03,-.2,.08]} rotation={[Math.PI*.35,0,0]}><cylinderGeometry args={[.018,.018,.22,10]}/><meshStandardMaterial color="#a9aaa5" metalness={.75}/></mesh>
  </group>;
}

function MiniWheel({p,color}:{p:[number,number,number];color:string}) {
  return <group position={p}>
    <mesh rotation={[0,Math.PI/2,0]} castShadow><torusGeometry args={[.18,.035,10,24]}/><meshStandardMaterial color={color}/></mesh>
    <Box p={[0,-.2,0]} s={[.06,.25,.06]} c="#806b59" metal={.25}/><Box p={[0,-.31,0]} s={[.34,.05,.22]} c="#806b59"/>
  </group>;
}

function RetailFixtures({wood,accent}:{wood:string;accent:string}) {
  const packs=["#c9826e","#79958a","#e5b75e","#8799ad","#b8a47d"];
  return <group>
    {[-4.5,-1.5,1.5,4.5].map((x,i)=><group key={x} position={[x,0,5.8]}>
      <Box p={[0,.58,0]} s={[1.25,1.12,4.15]} c={wood}/>
      {[-1.55,-.55,.45,1.45].map(z=><Box key={z} p={[0,1.18,z]} s={[1.32,.08,.82]} c="#eadfce" rough={.6}/>)}
      {[-1.55,-.55].flatMap((z,row)=>[-.38,0,.38].map((px,col)=><FoodBag key={`food-${z}-${px}`} p={[px,1.47,z]} color={packs[(i+row+col)%packs.length]} label={row?"BEDDING":"HAMSTER MIX"}/>))}
      {[-.38,0,.38].map((px,col)=><TreatJar key={`treat-${px}`} p={[px,1.4,.45]} color={packs[(i+col+2)%packs.length]}/>)}
      {[-.38,0,.38].map((px,col)=><WaterBottle key={`water-${px}`} p={[px,1.44,1.45]} color={packs[(i+col+1)%packs.length]}/>)}
    </group>)}
    {[-6.4,6.4].map(x=><group key={x} position={[x,0,7.8]}><Box p={[0,.45,0]} s={[1.25,.9,2.2]} c={accent}/>
      {[-.62,0,.62].map((z,i)=><MiniWheel key={z} p={[0,1.18,z]} color={packs[i]}/>)}
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
    {/* L-shaped lounge follows the north and east walls shown in the plan. */}
    {[5.35,6.55,7.55].map((x,i)=><group key={x} position={[x,0,-1.48]}>
      <Box p={[0,.43,0]} s={[1.02,.72,1.02]} c={i===1?accent:"#d9c4aa"}/><Box p={[0,.88,-.43]} s={[1.02,.72,.16]} c={wood}/>
    </group>)}
    {[-.25,.95,2.15].map((z,i)=><group key={z} position={[7.72,0,z]}>
      <Box p={[0,.43,0]} s={[1.02,.72,1.02]} c={i===1?accent:"#d9c4aa"}/><Box p={[.43,.88,0]} s={[.16,.72,1.02]} c={wood}/>
    </group>)}
    <Box p={[7.55,.34,3]} s={[1.12,.68,.66]} c={wood}/>
    <mesh position={[7.55,.73,3]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.23,.065,12,28]}/><meshStandardMaterial color="#f2eadc"/></mesh>
  </group>;
}

function Grooming({z,accent}:{z:number;accent:string}) { return <group position={[-6.3,0,z]}>
  {/* Wall cabinetry and wash station line the west wall; table stays central. */}
  {[-1.05,0,1.05].map(pz=><Box key={pz} p={[-1.22,.62,pz]} s={[.54,1.24,.82]} c="#ece6db"/>)}
  <Box p={[-1.18,1.29,0]} s={[.64,.1,2.95]} c={accent}/>
  <mesh position={[-1.12,1.39,-.9]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.2,.045,12,28]}/><meshStandardMaterial color="#a6a6a2" metalness={.7}/></mesh>
  <Box p={[.15,.79,0]} s={[1.55,.18,.86]} c="#dedbd2" metal={.1}/><Box p={[.15,.4,0]} s={[.14,.78,.14]} c="#7c7f7d" metal={.7}/>
  <mesh position={[.15,.96,.12]}><torusGeometry args={[.33,.032,10,30]}/><meshStandardMaterial color="#a6a6a2" metalness={.7}/></mesh>
  </group> }

function HotelSuites({wood,accent}:{wood:string;accent:string}) {
  const rows=[{z:-9.35,xs:[-3,-1.8,-.6,.6,1.8,3]},{z:-6.55,xs:[-2.4,-1.2,0,1.2,2.4]}];
  return <group>{rows.flatMap(row=>row.xs.map((x,i)=><group key={`${row.z}-${x}`} position={[x,0,row.z]}>
    <Box p={[0,1,0]} s={[1.05,1.9,1.15]} c={wood}/><Box p={[0,1.05,.585]} s={[.76,1.45,.035]} c="#dce6df" rough={.15}/>
    <mesh position={[0,.75,.64]}><circleGeometry args={[.18,24]}/><meshStandardMaterial color={accent}/></mesh>
    <Box p={[0,.18,.7]} s={[.7,.12,.55]} c="#e1c1a4"/>
  </group>))}</group>;
}

function BackFixtures({wood,accent}:{wood:string;accent:string}) {
  return <group>
    <HotelSuites wood={wood} accent={accent}/>
    {/* hamster enrichment: upright wheels, tunnels, hideouts and low forage beds */}
    {[-7.3,-5.75].map((x,i)=><group key={x} position={[x,0,-9.2+i*.4]}>
      <Box p={[0,.12,0]} s={[1.1,.24,.65]} c={wood}/>
      <mesh position={[0,.88,0]} rotation={[0,Math.PI/2,0]} castShadow><torusGeometry args={[.55,.075,14,36]}/><meshStandardMaterial color={i?accent:"#dca07a"} roughness={.65}/></mesh>
      <Box p={[0,.44,0]} s={[.08,.75,.08]} c="#8a755f" metal={.25}/>
    </group>)}
    <mesh position={[-7.25,.32,-7.25]} rotation={[Math.PI/2,0,Math.PI/2]} castShadow><cylinderGeometry args={[.34,.34,1.45,24,1,true]}/><meshStandardMaterial color="#dca07a" side={THREE.DoubleSide}/></mesh>
    <mesh position={[-7.75,.35,-6.3]} castShadow><cylinderGeometry args={[.62,.72,.7,28]}/><meshStandardMaterial color="#d9b697"/></mesh>
    <mesh position={[-7.75,.43,-5.92]} rotation={[Math.PI/2,0,0]}><circleGeometry args={[.22,24]}/><meshStandardMaterial color="#6f7e70"/></mesh>
    <Box p={[-5.75,.18,-6.2]} s={[1.35,.36,1.1]} c="#b9c69f"/>
    {/* Food prep uses an L-shaped stainless perimeter run and a central prep island. */}
    <Box p={[6.25,.72,-10.15]} s={[3.45,1.44,1]} c="#c9ccca" metal={.55}/><Box p={[7.75,.72,-8.45]} s={[.9,1.44,3.4]} c="#c9ccca" metal={.55}/>
    <mesh position={[6.15,1.48,-10.15]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.3,.055,12,28]}/><meshStandardMaterial color="#8c9994" metalness={.8}/></mesh>
    <Box p={[5.45,.62,-7.7]} s={[1.45,1.2,2.1]} c="#e6e0d5"/><Box p={[5.45,1.27,-7.7]} s={[1.5,.1,2.15]} c={wood}/>
    {/* Breakroom kitchenette, dining table and storage shelving follow the plan. */}
    <Box p={[-.2,.72,-4.78]} s={[3.7,1.44,.78]} c={wood}/><Box p={[-1.5,1.5,-4.78]} s={[.78,.58,.42]} c={accent}/>
    <Box p={[.2,.72,-3.55]} s={[1.35,.1,.82]} c="#e8e3d9"/><Box p={[.2,.36,-3.55]} s={[.12,.72,.12]} c="#7c7f7d" metal={.65}/>
    {[-.45,.85].map(x=><mesh key={x} position={[x,.35,-3.55]} castShadow><cylinderGeometry args={[.22,.25,.7,20]}/><meshStandardMaterial color={accent}/></mesh>)}
    {[6.05,7.2].map(x=><group key={x}>{[-4.7,-3.85,-3].map(z=><Box key={z} p={[x,.9,z]} s={[.85,.08,.68]} c="#c7b39b"/>)}<Box p={[x,.94,-3.85]} s={[.08,1.88,2.45]} c={wood}/></group>)}
    <StaffWC wood={wood}/>
  </group>;
}

function StaffWC({wood}:{wood:string}) {
  return <group>
    {/* floor-mounted toilet with cistern, seat, flush and plumbing */}
    <mesh position={[3.2,.3,-4.62]} scale={[1,.72,1.18]} castShadow><sphereGeometry args={[.34,24,16]}/><meshStandardMaterial color="#f4f2ec" roughness={.3}/></mesh>
    <mesh position={[3.2,.52,-4.55]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.25,.055,14,32]}/><meshStandardMaterial color="#f7f5ef" roughness={.25}/></mesh>
    <Box p={[3.2,.86,-4.9]} s={[.64,.72,.28]} c="#f1efe9" rough={.28}/>
    <mesh position={[3.2,1.25,-4.76]}><cylinderGeometry args={[.035,.035,.035,14]}/><meshStandardMaterial color="#a7aaa8" metalness={.8}/></mesh>
    <mesh position={[3.2,.11,-4.63]}><cylinderGeometry args={[.18,.23,.22,20]}/><meshStandardMaterial color="#eeeae1"/></mesh>
    {/* compact wall basin, chrome tap and mirror */}
    <mesh position={[3.7,.82,-3.05]} scale={[1.05,.32,.72]} castShadow><sphereGeometry args={[.3,24,16,0,Math.PI*2,0,Math.PI*.55]}/><meshStandardMaterial color="#f5f3ed" roughness={.25}/></mesh>
    <mesh position={[3.7,1.08,-3.13]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.11,.018,10,20,Math.PI]}/><meshStandardMaterial color="#9da4a3" metalness={.85} roughness={.2}/></mesh>
    <mesh position={[3.7,.94,-3.13]}><cylinderGeometry args={[.022,.022,.24,10]}/><meshStandardMaterial color="#9da4a3" metalness={.85}/></mesh>
    <Box p={[3.7,1.78,-2.98]} s={[.72,.86,.045]} c="#b8d0cf" rough={.08} metal={.25}/>
    <Box p={[3.7,1.78,-3.015]} s={[.82,.96,.055]} c={wood} rough={.55}/>
    <Box p={[2.48,1.15,-3.08]} s={[.1,.55,.34]} c="#e5ded0" rough={.6}/>
  </group>;
}

function Hamster({p,color="#c58b63",phase=0,held=false}:{p:[number,number,number];color?:string;phase?:number;held?:boolean}) {
  const g=useRef<THREE.Group>(null);
  useFrame(({clock,camera})=>{const t=clock.elapsedTime+phase;if(g.current){if(held){const forward=new THREE.Vector3();camera.getWorldDirection(forward);g.current.position.copy(camera.position).add(forward.multiplyScalar(1.05)).add(new THREE.Vector3(0,-.55,0));g.current.rotation.set(0,camera.rotation.y+Math.PI,0)}else{g.current.position.x=p[0]+Math.sin(t*.42)*.38;g.current.position.y=p[1]+Math.abs(Math.sin(t*2.2))*.025;g.current.position.z=p[2];g.current.rotation.y=Math.cos(t*.42)>0?Math.PI/2:-Math.PI/2}}});
  return <group ref={g} position={p} scale={.507}>
    {/* round body and cream belly */}
    <mesh castShadow position={[0,.34,0]} scale={[1,.9,1.24]}><sphereGeometry args={[.37,24,18]}/><meshStandardMaterial color={color} roughness={.9}/></mesh>
    <mesh position={[0,.33,.34]} scale={[.82,.9,.42]}><sphereGeometry args={[.25,20,16]}/><meshStandardMaterial color="#f1ddc2" roughness={1}/></mesh>
    {/* head, rounded ears and hamster cheeks */}
    <mesh castShadow position={[0,.55,.34]}><sphereGeometry args={[.3,24,18]}/><meshStandardMaterial color={color} roughness={.9}/></mesh>
    {[-.18,.18].map((x,i)=><group key={x}><mesh position={[x,.79,.3]}><sphereGeometry args={[.105,18,14]}/><meshStandardMaterial color={color}/></mesh><mesh position={[x,.79,.365]}><sphereGeometry args={[.062,16,12]}/><meshStandardMaterial color="#e6a89c"/></mesh></group>)}
    {[-.2,.2].map(x=><mesh key={x} position={[x,.5,.57]}><sphereGeometry args={[.105,18,14]}/><meshStandardMaterial color="#f0c6aa"/></mesh>)}
    {[-.11,.11].map(x=><mesh key={x} position={[x,.63,.61]}><sphereGeometry args={[.035,12,10]}/><meshStandardMaterial color="#171b19" roughness={.2}/></mesh>)}
    <mesh position={[0,.53,.66]}><sphereGeometry args={[.04,12,10]}/><meshStandardMaterial color="#7b4b43"/></mesh>
    {/* tiny paws and tail nub */}
    {[-.19,.19].map(x=><mesh key={x} position={[x,.12,.31]} scale={[1.2,.65,1]}><sphereGeometry args={[.09,14,10]}/><meshStandardMaterial color="#f1c7ad"/></mesh>)}
    <mesh position={[0,.35,-.47]}><sphereGeometry args={[.075,14,10]}/><meshStandardMaterial color="#eab8a4"/></mesh>
  </group>;
}

function Hamsters() {
  const {camera}=useThree();
  const [held,setHeld]=useState<number|null>(null);
  const [positions,setPositions]=useState<[number,number,number][]>([[-6.4,0,-6.8],[1.2,0,-7.5],[5.7,0,.8]]);
  useEffect(()=>{const press=(e:KeyboardEvent)=>{if(e.code!=="KeyP"||e.repeat)return;e.preventDefault();if(held!==null){const forward=new THREE.Vector3();camera.getWorldDirection(forward);const drop=camera.position.clone().add(forward.multiplyScalar(1.5));setPositions(old=>old.map((p,i)=>i===held?[THREE.MathUtils.clamp(drop.x,-8,8),0,THREE.MathUtils.clamp(drop.z,-10.4,10.4)]:p));setHeld(null);return}let nearest=0,best=Infinity;positions.forEach((p,i)=>{const distance=camera.position.distanceTo(new THREE.Vector3(...p));if(distance<best){nearest=i;best=distance}});setHeld(nearest)};window.addEventListener("keydown",press);return()=>window.removeEventListener("keydown",press)},[camera,held,positions]);
  const colors=["#bb765c","#9f8c76","#d1aa77"];
  return <>{positions.map((p,i)=><Hamster key={i} p={p} color={colors[i]} phase={i*2.4} held={held===i}/>)}</>;
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

export default function ShopScene({selected,labelFocus,onSelect,walkMode,hidden,isolated,layers,palette,evening,light}:Props) {
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
    <RoomZones selected={selected} focus={labelFocus} onSelect={onSelect} walkMode={walkMode} hidden={hidden} isolated={isolated} show={layers.zones}/>
    {layers.labels&&<RoomLabels hidden={hidden} isolated={isolated} focus={labelFocus}/>} 
    {layers.hamsters&&<Hamsters/>}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.24,0]} receiveShadow><planeGeometry args={[80,80]}/><meshStandardMaterial color={evening?"#1c2625":"#b8b8a7"} roughness={1}/></mesh>
  </>;
}
