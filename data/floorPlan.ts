import type { RoomId } from "./shop";

export const SHOP={width:12,length:22,height:4,wall:.16} as const;
export type Point=[number,number];
export type Footprint={x:number;z:number;w:number;d:number;angle:number};
const footprint=(x:number,z:number,w:number,d:number,angle=0):Footprint=>({x,z,w,d,angle});
const entranceWidth=2.5;
export const secureDoorX=3.72;
const rear=-5.7, staffFront=-2.8, boardingWest=-2.75, boardingEast=3.08, storageWest=4.48;
export const rearZones={
  enrichment:[-6,boardingWest,-11,rear],
  boarding:[boardingWest,boardingEast,-11,rear],
  foodprep:[boardingEast,6,-11,rear],
  secure:[boardingEast,storageWest,rear,staffFront],
  storage:[storageWest,6,rear,staffFront],
} as const;
export const entrance={z:SHOP.length/2,width:entranceWidth};

const partition=(axis:"x"|"z",fixed:number,start:number,end:number,gaps:Point[]=[])=>({axis,fixed,start,end,gaps});
const partitions=[
  partition("x",-11,-6,6), partition("x",11,-6,6,[[0,entranceWidth]]),
  partition("z",-6,-11,11), partition("z",6,-11,11),
  partition("x",rear,-6,6,[[secureDoorX,1.1]]),
  partition("z",-3.15,rear,2.65,[[-2.05,1.05],[1.64,1.05]]),
  partition("x",-1.55,-6,-3.15), partition("x",2.65,-6,-3.15),
  partition("x",staffFront,-1.9,boardingEast), partition("x",staffFront,storageWest,6),
  partition("z",-1.9,rear,staffFront,[[-4.02,1.05]]),
  partition("z",1.42,rear,staffFront,[[-4.13,.96]]),
  partition("z",boardingEast,rear,staffFront),
  partition("z",storageWest,rear,staffFront,[[-4.95,1.02]]),
];

const segment=(axis:"x"|"z",fixed:number,start:number,end:number)=>axis==="x"
  ?footprint((start+end)/2,fixed,end-start,SHOP.wall)
  :footprint(fixed,(start+end)/2,SHOP.wall,end-start);
export const walls=partitions.flatMap(({axis,fixed,start,end,gaps})=>{
  let cursor=start;
  const pieces=gaps.map(([center,width])=>{
    const piece=segment(axis,fixed,cursor,center-width/2);
    cursor=center+width/2;
    return piece;
  });
  return [...pieces,segment(axis,fixed,cursor,end)];
});
export const doors=partitions.flatMap(({axis,fixed,gaps})=>gaps.map(([center,width])=>{
  const p:Point=axis==="x"?[center,fixed]:[fixed,center];
  const leaf=axis==="x"
    ?footprint(p[0]+(fixed===rear?1:-1)*width/2,p[1]-width/2,width,.065,Math.PI/2)
    :footprint(p[0]+(fixed===storageWest?1:-1)*width/2,p[1]-width/2,width,.065);
  return {axis,p,width,leaf,exterior:fixed===entrance.z&&axis==="x"};
}));

const retailRuns=[-3.85,-1.28,1.28,3.85].map(x=>footprint(x,6.42,.91,4.35));
const offers=[-3.85,3.85].map(x=>footprint(x,8.98,.91,.69));
const retailWalls=[footprint(-5.65,6.37,.48,4.78),footprint(5.65,6.37,.48,4.78,Math.PI),footprint(-4.15,10.61,.48,3.15,-Math.PI/2)];
const counter=Array.from({length:15},(_,i)=>{
  const t=(i+.5)/15*Math.PI;
  return footprint(1.72*Math.cos(t)-.17,.02+1.12*Math.sin(t),.46,.44,Math.atan2(1.12*Math.cos(t),-1.72*Math.sin(t))*-1);
});
const seats=[footprint(4.75,-2.28,.8,.78),footprint(5.49,-2.28,.8,.78),...[-1.44,-.47,.5].map(z=>footprint(5.46,z,.8,.78,-Math.PI/2))];
const grooming=(tableZ:number,cabinetZ:number)=>({table:footprint(-4.65,tableZ,1.2,.73),cabinet:footprint(-5.67,cabinetZ,.46,2.43),locker:footprint(-3.62,cabinetZ-.95,.62,.48)});
const grooming1=grooming(-3.69,-3.72),grooming2=grooming(.31,.53);
const suites=[-10.21,-6.48].flatMap((z,row)=>Array.from({length:6},(_,i)=>
  footprint(boardingWest+(i+.5)*(boardingEast-boardingWest)/6,z,.91,1.24,row*Math.PI)));

export const fixtures={
  retailRuns,offers,retailWalls,scale:footprint(-1.8,9.94,.64,.54),
  counter,rearShelf:footprint(-.98,-2.42,1.34,.42),wash:footprint(2.37,.65,.67,.57),water:footprint(5.47,1.47,.54,.55),seats,
  grooming1,grooming2,stairs:footprint(-5.39,3.42,.98,1.28),
  staffCounter:footprint(-.25,-5.27,2.97,.61),staffTable:footprint(.5,-3.22,1.18,.54),
  toilet:footprint(2.2,-5.04,.68,.95),basin:footprint(2.75,-3.59,.39,.54),
  storage:[footprint(5.57,-4.27,.62,2.52),footprint(4.96,-3.35,.6,.7)],
  suites,enrichment:[footprint(-4.55,-10.35,2.64,.87),footprint(-5.47,-8.72,.8,2.15),footprint(-5.15,-6.5,1.45,.94)],
  prep:[footprint(4.51,-10.47,2.78,.73),footprint(5.54,-8.63,.75,2.95)],fridge:footprint(5.42,-6.42,.91,1.02),
};

const roomFixtures:Record<RoomId,Footprint[]>={
  entrance:[fixtures.scale],retail:[...retailRuns,...offers,...retailWalls],
  service:[...counter,fixtures.rearShelf,fixtures.wash],waiting:[...seats,fixtures.water],
  grooming1:Object.values(grooming1),grooming2:[...Object.values(grooming2),fixtures.stairs],
  breakroom:[fixtures.staffCounter,fixtures.staffTable],wc:[fixtures.toilet,fixtures.basin],secure:[],storage:fixtures.storage,
  boarding:suites,enrichment:fixtures.enrichment,foodprep:[...fixtures.prep,fixtures.fridge],
};
export const walkSpawns:Record<RoomId,Point>={
  entrance:[0,9.8],retail:[0,6.5],service:[-.2,1.99],waiting:[3.98,.03],
  grooming1:[-3.84,-2.09],grooming2:[-3.85,1.68],breakroom:[-.7,-4.1],wc:[2.03,-3.78],
  secure:[3.75,-4.17],storage:[4.96,-4.61],boarding:[.16,-8.35],enrichment:[-4.06,-8.62],foodprep:[4.18,-8.65],
};

export function walkObstacles(showWalls:boolean,showFurniture:boolean,hidden:ReadonlySet<RoomId>,isolated:RoomId|null){
  return [...(showWalls?[...walls,...doors.filter(d=>!d.exterior).map(d=>d.leaf)]:[]),...(showFurniture?(Object.keys(roomFixtures) as RoomId[])
    .filter(id=>!hidden.has(id)&&(!isolated||id===isolated)).flatMap(id=>roomFixtures[id]):[])];
}

export function clearAt(x:number,z:number,obstacles:Footprint[],radius=.2){
  if(Math.abs(x)>SHOP.width/2-radius||Math.abs(z)>SHOP.length/2-radius) return false;
  return !obstacles.some(b=>{
    const dx=x-b.x,dz=z-b.z,c=Math.cos(b.angle),s=Math.sin(b.angle);
    const ox=Math.max(0,Math.abs(c*dx-s*dz)-b.w/2),oz=Math.max(0,Math.abs(s*dx+c*dz)-b.d/2);
    return ox*ox+oz*oz<radius*radius;
  });
}
