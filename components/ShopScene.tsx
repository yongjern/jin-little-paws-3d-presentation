"use client";

import SceneLabel from "./SceneLabel";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { type ReactNode, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PaletteName, palettes, RoomId, rooms } from "@/data/shop";

import { clearAt, doors, entrance, fixtures, type Footprint, secureDoorX, SHOP, walkObstacles, walls as planWalls } from "@/data/floorPlan";

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
  return <>{rooms.map(r=>(hidden.has(r.id)||(isolated&&isolated!==r.id)||(focus&&focus!==r.id))?null:
    <SceneLabel key={r.id} position={[r.center[0],.24,r.center[2]]} distanceFactor={18} className="room-label" text={r.label||r.name}/>
  )}</>;
}

// --- retail, service and care fixtures -------------------------------------------------
function FoodBag({p,color,label}:{p:[number,number,number];color:string;label:string}) {
  return <group position={p}>
    <mesh castShadow scale={[.72,1,.38]}><sphereGeometry args={[.25,18,12]}/><meshStandardMaterial color={color} roughness={.82}/></mesh>
    <Box p={[0,.01,.1]} s={[.28,.18,.035]} c="#f5ead3" rough={.7}/>
    <SceneLabel position={[0,.01,.122]} distanceFactor={7} className="product-label" text={label}/>
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

function Placed({f,children}:{f:Footprint;children:ReactNode}) {
  return <group position={[f.x,0,f.z]} rotation={[0,f.angle,0]}>{children}</group>;
}

function Sign({p,children}:{p:[number,number,number];children:string}) {
  return <SceneLabel position={p} distanceFactor={8} className="counter-sign" text={children}/>;
}

function Cabinet({f,h=1,c,top=c}:{f:Footprint;h?:number;c:string;top?:string}) {
  return <Placed f={f}><Box p={[0,h/2,0]} s={[f.w,h,f.d]} c={c}/><Box p={[0,h-.034,0]} s={[f.w,.07,f.d]} c={top}/></Placed>;
}

function Sink({f,c="#bfcbcb"}:{f:Footprint;c?:string}) {
  return <><Cabinet f={f} h={.93} c={c} top="#d5dcda"/><Placed f={f}>
    <mesh position={[0,.94,.03]} rotation={[-Math.PI/2,0,0]} scale={[1,.75,1]}><circleGeometry args={[Math.min(f.w,f.d)*.36,28]}/><meshStandardMaterial color="#6e7c7d" metalness={.65}/></mesh>
    <mesh position={[0,1.025,-.11]}><torusGeometry args={[.086,.015,10,20,Math.PI]}/><meshStandardMaterial color="#bdc4c5" metalness={.86}/></mesh>
  </Placed></>;
}

function RetailFixtures({wood,accent}:{wood:string;accent:string}) {
  const packs=["#c9826e","#79958a","#e5b75e","#8799ad","#b8a47d"];
  return <>
    {[...fixtures.retailRuns,...fixtures.retailWalls].map((f,i)=>{
      const double=i<4,count=Math.floor(f.d/.65);
      return <Placed key={i} f={f}>
        <Box p={[double?0:-f.w/2+.03,.86,0]} s={[.06,1.72,f.d]} c={wood}/>
        {[.14,.67,1.2,1.72].map(y=><Box key={y} p={[0,y,0]} s={[f.w,.075,f.d]} c="#eadfce"/>)}
        {(double?[-1,1]:[1]).map(side=><group key={side} rotation={[0,side*Math.PI/2,0]}>
          {[.42,.95,1.48].flatMap((y,row)=>Array.from({length:count},(_,col)=>{
            const p:[number,number,number]=[(col-(count-1)/2)*.64,y,double?.23:0];
            const color=packs[(i+row+col)%packs.length], key=row*count+col;
            const kind=i===4?2:i===5?3:i===6?1:(i+row)%4;
            if(kind===0)return <FoodBag key={key} p={p} color={color} label={row?"BEDDING":"HAMSTER MIX"}/>;
            if(kind===1)return <TreatJar key={key} p={[p[0],y-.08,p[2]]} color={color}/>;
            if(kind===2)return <WaterBottle key={key} p={[p[0],y+.035,p[2]]} color={color}/>;
            return <MiniWheel key={key} p={[p[0],y+.075,p[2]]} color={color}/>;
          }))}
        </group>)}
      </Placed>;
    })}
    {fixtures.offers.map(f=><Placed key={f.x} f={f}><Box p={[0,.4,0]} s={[f.w,.8,f.d]} c={accent}/>
      {[-.22,.22].map((x,i)=><FoodBag key={x} p={[x,1.02,0]} color={packs[i]} label="HAMSTER MIX"/>)}
      <Sign p={[0,.54,.37]}>SPECIAL OFFER</Sign>
    </Placed>)}
  </>;
}

function PetScale() {
  const f=fixtures.scale;
  return <Placed f={f}><Box p={[0,.054,0]} s={[f.w,.108,f.d]} c="#718487" metal={.55}/>
    <Box p={[0,.122,-.035]} s={[.52,.028,.39]} c="#bec8ca" metal={.65}/><Box p={[0,.126,.21]} s={[.2,.038,.085]} c="#253d37"/>
    <Sign p={[0,.17,.33]}>PET SCALE</Sign>
  </Placed>;
}

function ServiceCounter({wood,accent}:{wood:string;accent:string}) {
  return <>
    {fixtures.counter.map((f,i)=><Placed key={i} f={f}><Box p={[0,.55,0]} s={[f.w,1.1,f.d]} c={wood}/>
      <Box p={[0,1.095,0]} s={[f.w,.085,f.d]} c="#e8dfd1" rough={.38}/>
      {[2,7,12].includes(i)&&<><Box p={[0,1.32,0]} s={[.28,.25,.065]} c="#263632"/><Box p={[0,1.16,0]} s={[.07,.15,.09]} c="#727a79"/></>}
    </Placed>)}
    <Sign p={[-1.65,1.2,.65]}>POS</Sign><Sign p={[-.77,1.19,1.23]}>GROOMING CHECK-IN</Sign><Sign p={[.74,1.19,1.14]}>SERVICE CHECK-IN</Sign>
    <Cabinet f={fixtures.rearShelf} h={.9} c={wood} top={accent}/>
    <Placed f={fixtures.rearShelf}>{[1.18,1.57].map(y=><Box key={y} p={[0,y,-.06]} s={[1.34,.07,.3]} c={wood}/>)}</Placed>
    <Sink f={fixtures.wash}/>
  </>;
}

function Waiting({wood,accent}:{wood:string;accent:string}) {
  return <>
    {fixtures.seats.map((f,i)=><Placed key={i} f={f}><Box p={[0,.23,0]} s={[.73,.46,.68]} c={wood}/><Box p={[0,.48,0]} s={[f.w,.13,f.d]} c={i%2?accent:"#d9c4aa"}/><Box p={[0,.75,-.32]} s={[f.w,.55,.14]} c={i%2?accent:"#d9c4aa"}/></Placed>)}
    <Cabinet f={fixtures.water} h={.83} c="#becbd0"/><Placed f={fixtures.water}><WaterBottle p={[0,1.08,0]} color="#789d9e"/><Sign p={[0,.64,.31]}>WATER</Sign></Placed>
  </>;
}

function Grooming({id,accent}:{id:"grooming1"|"grooming2";accent:string}) {
  const {table,cabinet,locker}=fixtures[id];
  const f=fixtures.stairs;
  return <><Sink f={cabinet} c="#d1d9d9"/><Cabinet f={locker} h={1.54} c="#8da9b7"/>
    <Placed f={locker}><Sign p={[0,1.15,.26]}>EQUIPMENT</Sign></Placed>
    <Placed f={table}><Box p={[0,.8,0]} s={[table.w,.12,table.d]} c={accent}/><Box p={[0,.38,0]} s={[.14,.76,.14]} c="#7c7f7d" metal={.7}/>
      <Box p={[-.53,1.14,-.3]} s={[.05,.68,.05]} c="#a5adad" metal={.7}/><Box p={[-.24,1.46,-.3]} s={[.62,.05,.05]} c="#a5adad" metal={.7}/>
    </Placed>
    {id==="grooming2"&&<Placed f={f}>{[0,1,2,3,4,5].map(i=><Box key={i} p={[0,(i+1)*.08,(5-2*i)*f.d/12]} s={[f.w,(i+1)*.16,f.d/6]} c="#b5a591"/>)}</Placed>}
  </>;
}

function HotelSuites({wood,accent}:{wood:string;accent:string}) {
  return <>{fixtures.suites.map((f,i)=><Placed key={i} f={f}>
    <Box p={[0,.99,-.37]} s={[f.w,1.98,.06]} c={wood}/>{[-.36,.36].map(x=><Box key={x} p={[x,.99,0]} s={[.07,1.98,.8]} c={wood}/>)}
    {[.09,1.01].map(y=><group key={y} position={[0,y,0]}>
      <Box p={[0,.02,0]} s={[.73,.085,.8]} c={wood}/><Box p={[0,.1,-.01]} s={[.62,.08,.67]} c="#ddbe96"/>
      <Box p={[-.17,.23,-.15]} s={[.24,.23,.28]} c={accent}/><Box p={[.15,.32,-.13]} s={[.28,.05,.29]} c={wood}/><Box p={[.16,.23,.01]} s={[.23,.04,.29]} c={wood} rot={[-.57,0,0]}/>
      <mesh position={[0,.48,.391]}><boxGeometry args={[.65,.8,.02]}/><meshStandardMaterial color="#c3ddd7" roughness={.16} transparent opacity={.2} depthWrite={false}/></mesh>
      <Box p={[.25,.45,.401]} s={[.085,.045,.02]} c="#576864" metal={.55}/>
    </group>)}
    <Box p={[0,1.96,0]} s={[f.w,.08,f.d]} c={wood}/><Sign p={[0,1.85,.415]}>{String(i+1).padStart(2,"0")}</Sign>
  </Placed>)}</>;
}

function BackFixtures({wood,accent,visible}:{wood:string;accent:string;visible:(id:RoomId)=>boolean}) {
  return <>
    {visible("boarding")&&<HotelSuites wood={wood} accent={accent}/>}
    {visible("enrichment")&&fixtures.enrichment.map((f,i)=><Placed key={i} f={f}>
      <Box p={[0,.11,0]} s={[f.w,.22,f.d]} c={wood}/>
      {i===0&&[-.85,0,.85].map((x,j)=><group key={x}><Box p={[x,.3+j*.11,0]} s={[.7,.17,.67]} c={accent}/><Box p={[x,.22+j*.06,.22]} s={[.39,.19,.43]} c="#d6b78b" rot={[.38,0,0]}/></group>)}
      {i===1&&<><mesh position={[0,.48,-.45]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.25,.25,1.02,24,1,true]}/><meshStandardMaterial color="#dca07a" side={THREE.DoubleSide}/></mesh><Box p={[0,.39,.58]} s={[.69,.42,.78]} c={accent}/></>}
      {i===2&&<><mesh position={[.28,.67,0]}><torusGeometry args={[.38,.056,12,28]}/><meshStandardMaterial color={accent}/></mesh><Box p={[.28,.4,.07]} s={[.08,.52,.08]} c={wood}/><Box p={[-.4,.28,0]} s={[.45,.15,.73]} c="#d6b78b"/></>}
    </Placed>)}
    {visible("foodprep")&&<><Sink f={fixtures.prep[0]}/><Cabinet f={fixtures.prep[1]} h={.93} c="#b7bfc1" top="#d5dcda"/>
      <Cabinet f={fixtures.fridge} h={1.92} c="#c8cece"/><Placed f={fixtures.fridge}><Box p={[0,1.28,0]} s={[.802,.035,.913]} c="#8c999a"/>{[1.12,1.45].map(y=><Box key={y} p={[-.41,y,.19]} s={[.055,.22,.045]} c="#747e80"/>)}</Placed>
    </>}
    {visible("breakroom")&&<><Sink f={fixtures.staffCounter} c={wood}/><Cabinet f={fixtures.staffTable} h={.77} c={accent} top="#e8e3d9"/></>}
    {visible("wc")&&<StaffWC wood={wood}/>}
    {visible("storage")&&fixtures.storage.map((f,i)=><Placed key={i} f={f}>
      {[.14,.93,1.76].map(y=><Box key={y} p={[0,y,0]} s={[f.w,.075,f.d]} c={wood}/>)}<Box p={[0,.94,0]} s={[i?f.w:.07,1.85,i?.07:f.d]} c={wood}/>
      {[-1,1].map(k=><Box key={k} p={[i?k*.43:0,1.08,i?0:k*.58]} s={[.28,.25,.31]} c="#cbb99b"/>)}
    </Placed>)}
  </>;
}

function StaffWC({wood}:{wood:string}) {
  return <>
    <Placed f={fixtures.toilet}>
      <Box p={[0,.73,-.29]} s={[.56,.62,.28]} c="#f3f1ec" rough={.24}/><Box p={[0,1.054,-.29]} s={[.085,.023,.044]} c="#adb3b2" metal={.8}/>
      <mesh position={[0,.28,.12]} scale={[1,.84,1.17]} castShadow><sphereGeometry args={[.276,24,16]}/><meshStandardMaterial color="#f3f1ec" roughness={.26}/></mesh>
      <mesh position={[0,.493,.14]} rotation={[-Math.PI/2,0,0]} scale={[1,1.18,1]}><torusGeometry args={[.206,.048,14,32]}/><meshStandardMaterial color="#f7f5ef" roughness={.25}/></mesh>
      <mesh position={[0,.481,.14]} rotation={[-Math.PI/2,0,0]} scale={[1,1.18,1]}><circleGeometry args={[.159,24]}/><meshStandardMaterial color="#b1c3c2"/></mesh>
      <mesh position={[0,.11,.13]}><cylinderGeometry args={[.17,.21,.22,20]}/><meshStandardMaterial color="#eeeae1"/></mesh>
      <Box p={[.25,.52,-.15]} s={[.16,.1,.125]} c="#e8e3da"/>
    </Placed>
    <Sink f={fixtures.basin}/>
    <Placed f={fixtures.basin}><Box p={[.184,1.59,0]} s={[.029,.58,.48]} c={wood}/><Box p={[.159,1.59,0]} s={[.024,.51,.41]} c="#becfd0" rough={.08} metal={.35}/></Placed>
  </>;
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

const hamsterObstacles=walkObstacles(true,true,new Set<RoomId>(),null);

function Hamsters({walkMode}:{walkMode:boolean}) {
  const {camera}=useThree();
  const [held,setHeld]=useState<number|null>(null);
  const [positions,setPositions]=useState<[number,number,number][]>([[-4.15,0,-8.62],[.1,0,-8.8],[3.96,0,.56]]);
  useEffect(()=>{const press=(e:KeyboardEvent)=>{if(e.code!=="KeyP"||e.repeat)return;e.preventDefault();if(held!==null){const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const drop=[.85,.55,.25,0].map(d=>camera.position.clone().addScaledVector(forward,d)).find(p=>clearAt(p.x,p.z,hamsterObstacles,.48));if(!drop&&walkMode)return;if(drop)setPositions(old=>old.map((p,i)=>i===held?[drop.x,0,drop.z]:p));setHeld(null);return}let nearest=0,best=Infinity;positions.forEach((p,i)=>{const distance=camera.position.distanceTo(new THREE.Vector3(...p));if(distance<best){nearest=i;best=distance}});setHeld(nearest)};window.addEventListener("keydown",press);return()=>window.removeEventListener("keydown",press)},[camera,held,positions,walkMode]);
  const colors=["#bb765c","#9f8c76","#d1aa77"];
  return <>{positions.map((p,i)=><Hamster key={i} p={p} color={colors[i]} phase={i*2.4} held={held===i}/>)}</>;
}

function Entrance({accent}:{accent:string}) {
  const left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null);
  const {camera}=useThree();
  const {width,z}=entrance, leaf=width/2;
  useFrame(()=>{
    const near=camera.position.z>8&&Math.abs(camera.position.x)<2.6;
    const offset=near?leaf:0;
    if(left.current)left.current.position.x=THREE.MathUtils.lerp(left.current.position.x,-leaf/2-offset,.13);
    if(right.current)right.current.position.x=THREE.MathUtils.lerp(right.current.position.x,leaf/2+offset,.13);
  });
  return <>
    {[left,right].map((ref,i)=><group key={i} ref={ref} position={[(i?1:-1)*leaf/2,0,z+.095]}>
      <mesh position={[0,1.25,0]}><boxGeometry args={[leaf-.06,2.45,.06]}/><meshStandardMaterial color="#b8d4d1" transparent opacity={.48} roughness={.2}/></mesh>
      {[-1,1].map(k=><Box key={k} p={[k*(leaf/2-.036),1.25,0]} s={[.045,2.47,.07]} c="#586b64"/>)}
      {[.035,2.47].map(y=><Box key={y} p={[0,y,0]} s={[leaf-.025,.055,.07]} c="#586b64"/>)}
    </group>)}
    <Box p={[0,3.13,z+.05]} s={[5.5,.65,.22]} c={accent}/>
    <SceneLabel position={[0,3.15,z+.18]} distanceFactor={12} className="entrance-sign" text="THE JIN LITTLE PAWS CO." accent="?"/>
  </>;
}

function Architecture({wall,floor,wood,accent,wallOpacity,roof,walls}:{wall:string;floor:string;wood:string;accent:string;wallOpacity:number;roof:boolean;walls:boolean}) {
  const h=SHOP.height, y=h/2, t=SHOP.wall, dh=2.42;
  return <>
    <Box p={[0,-.11,0]} s={[SHOP.width,.22,SHOP.length]} c={floor} rough={.84}/>
    <Box p={[4.52,.004,-.1]} s={[2.79,.008,5.22]} c="#aeb8aa" rough={.83}/>
    {walls&&<>
      {planWalls.map((f,i)=><Wall key={i} p={[f.x,y,f.z]} s={[f.w,h,f.d]} color={wall} opacity={wallOpacity}/>)}
      {doors.map(({axis,p:[x,z],width,exterior,leaf},i)=><group key={i}>
        <Wall p={[x,(h+dh)/2,z]} s={axis==="x"?[width,h-dh,t]:[t,h-dh,width]} color={wall} opacity={wallOpacity}/>
        {!exterior&&<><Placed f={leaf}><Box p={[0,dh/2,0]} s={[leaf.w,dh,leaf.d]} c={wood}/>
          <Box p={[leaf.w*.32,1.05,.044]} s={[.1,.035,.04]} c="#b7a182" metal={.7}/></Placed>
          {[-1,1].map(k=><Box key={k} p={axis==="x"?[x+k*width/2,dh/2,z]:[x,dh/2,z+k*width/2]} s={axis==="x"?[.045,dh,t]:[t,dh,.045]} c={wood}/>)}
          {axis==="x"&&x===secureDoorX&&<>
            <Box p={[x+width/2+.12,1.2,z+t/2+.02]} s={[.11,.18,.045]} c="#394846"/>
            <Box p={[x+width/2+.12,1.25,z+t/2+.046]} s={[.043,.018,.009]} c="#8bb592"/>
          </>}
        </>}
      </group>)}
      <Entrance accent={accent}/>
    </>}
    {roof&&<Box p={[0,h+.03,0]} s={[SHOP.width,.06,SHOP.length]} c="#f1eadf"/>}
    {[-.64,0,.64].map((x,i)=><mesh key={x} position={[x,.015,10.37+i*.08]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.14,24]}/><meshStandardMaterial color={i===1?wood:accent}/></mesh>)}
  </>;
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
      {isVisible("entrance")&&<PetScale/>}
      {isVisible("retail")&&<RetailFixtures wood={p.wood} accent={p.accent}/>} 
      {isVisible("service")&&<ServiceCounter wood={p.wood} accent={p.accent}/>} 
      {isVisible("waiting")&&<Waiting wood={p.wood} accent={p.accent}/>} 
      {isVisible("grooming1")&&<Grooming id="grooming1" accent={p.accent}/>}
      {isVisible("grooming2")&&<Grooming id="grooming2" accent={p.accent}/>}
      <BackFixtures wood={p.wood} accent={p.accent} visible={isVisible}/>
    </>}
    <RoomZones selected={selected} focus={labelFocus} onSelect={onSelect} walkMode={walkMode} hidden={hidden} isolated={isolated} show={layers.zones}/>
    {layers.labels&&<RoomLabels hidden={hidden} isolated={isolated} focus={labelFocus}/>} 
    {layers.hamsters&&<Hamsters walkMode={walkMode}/>}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.24,0]} receiveShadow><planeGeometry args={[80,80]}/><meshStandardMaterial color={evening?"#1c2625":"#b8b8a7"} roughness={1}/></mesh>
  </>;
}
