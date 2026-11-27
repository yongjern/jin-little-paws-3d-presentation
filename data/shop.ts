import { rearZones } from "./floorPlan";

export type RoomId =
  | "entrance" | "retail" | "service" | "waiting" | "grooming1" | "grooming2"
  | "breakroom" | "wc" | "secure" | "storage" | "boarding" | "enrichment" | "foodprep";

export type Room = {
  id: RoomId;
  name: string;
  short: string;
  purpose: string;
  center: [number, number, number];
  size: [number, number];
  camera: [number, number, number];
  target: [number, number, number];
  color: string;
  label?: string;
};

export { SHOP } from "./floorPlan";

function rearRoom(id:keyof typeof rearZones):Pick<Room,"center"|"size"> {
  const [west,east,north,south]=rearZones[id];
  return {center:[(west+east)/2,.03,(north+south)/2],size:[east-west,south-north]};
}

export const rooms: Room[] = [
  { id:"entrance", name:"Entrance / Exit", short:"A welcoming, centered threshold beneath the Little Paws wordmark.", purpose:"Primary customer arrival, departure and orientation point.", center:[0,0.03,9.95], size:[12,2.1], camera:[0,3.8,14], target:[0,0.6,9.8], color:"#d7a887" },
  { id:"retail", name:"Retail Product Zone", short:"Open sightlines connect four double-sided shelving runs, wall racks and two special-offer displays.", purpose:"Hamster food mixes, treats, bedding, water bottles, exercise wheels and daily care essentials.", center:[0,0.03,6.31], size:[12,5.18], camera:[0,8.8,12], target:[0,0.4,6.1], color:"#dbcaa2" },
  { id:"service", name:"Service & Grooming Zone", short:"An open-centered counter contains POS, grooming check-in and service check-in.", purpose:"Grooming check-in, service enquiries and clear customer wayfinding.", center:[-0.18,0.03,0.465], size:[5.94,6.53], camera:[0.3,6.2,6.7], target:[0,0.65,0], color:"#b7c3a0" },
  { id:"waiting", name:"Waiting Area", short:"An L-shaped perimeter lounge keeps the central route open beside the service counter.", purpose:"Comfortable wall-side seating with clear views toward check-in and an unobstructed customer path.", center:[4.39,0.03,-0.1], size:[3.22,5.4], camera:[7,4.8,5], target:[4.4,0.6,-0.25], color:"#c7d2bd" },
  { id:"grooming1", name:"Grooming Room 1", short:"An enclosed grooming bay with table, bath and storage.", purpose:"Quiet individual grooming with washable, hygienic finishes.", center:[-4.575,0.03,-3.625], size:[2.85,4.15], camera:[-7.4,4.8,0.1], target:[-4.58,0.65,-3.625], color:"#a2bece" },
  { id:"grooming2", name:"Grooming Room 2", short:"A second enclosed treatment room mirroring the first.", purpose:"Parallel grooming capacity with dedicated equipment and clearance.", center:[-4.575,0.03,0.55], size:[2.85,4.2], camera:[-7.1,4.9,4.1], target:[-4.58,0.65,0.55], color:"#a7c0d2" },
  { id:"breakroom", name:"Staff Breakroom", short:"A private staff retreat positioned behind the service counter.", purpose:"Rest, lockers, kitchenette and short staff breaks away from customers.", center:[-.24,0.03,-4.25], size:[3.32,2.9], camera:[-2.8,4.5,0.1], target:[-.24,0.7,-4.25], color:"#c9c3ad" },
  { id:"wc", name:"Staff WC", short:"Compact staff washroom with a toilet, hand basin, mirror and paper holder.", purpose:"Private staff amenity separated from animal-care spaces, with practical sanitary fixtures.", center:[2.25,0.03,-4.25], size:[1.66,2.9], camera:[.8,4.3,-0.6], target:[2.25,0.52,-4.25], color:"#b9cdc5" },
  { id:"secure", name:"Secure Hamster-Hotel Entrance", short:"A vestibule between the staff WC and storage leads through a controlled door into food preparation.", purpose:"Separates public circulation from the open care aisle serving boarding and enrichment.", ...rearRoom("secure"), camera:[4.6,4.2,-0.4], target:[3.78,0.7,-4.25], color:"#b0c8b3" },
  { id:"storage", name:"Storage", short:"Compact operational storage off the secure vestibule.", purpose:"Secure supplies, cleaning stock and overflow retail inventory.", ...rearRoom("storage"), camera:[6.75,4.2,-0.55], target:[5.24,0.7,-4.25], color:"#cbbba5" },
  { id:"boarding", name:"Hamster-Hotel Boarding Room", short:"Two rows of six two-level habitats face each other across an open care aisle.", purpose:"Secure short-stay hamster boarding with visual checks, easy-clean access and clear circulation.", ...rearRoom("boarding"), camera:[0,7.8,-2.5], target:[.16,0.8,-8.35], color:"#c8d6be" },
  { id:"enrichment", name:"Hamster Enrichment Area", short:"A playful corner of wheels, tunnels, hideouts and low platforms.", purpose:"Supervised exercise, foraging and enrichment for boarding hamsters.", ...rearRoom("enrichment"), camera:[-7,5.65,-4], target:[-4.38,0.7,-8.35], color:"#e2c49f" },
  { id:"foodprep", name:"Food Preparation & Cleaning", short:"A rear sink, right-hand worktop and fridge sit beside the open boarding aisle.", purpose:"Hygienic food portioning, bowl washing and daily hotel support.", ...rearRoom("foodprep"), camera:[7,5.7,-4], target:[4.54,0.7,-8.35], color:"#b7ceca" }
];

export const roomById = Object.fromEntries(rooms.map(r => [r.id, r])) as Record<RoomId, Room>;

// Full presentation route: every configured space appears exactly once.
export const tour: RoomId[] = [
  "entrance", "retail", "service", "waiting", "grooming1", "grooming2",
  "breakroom", "wc", "secure", "storage", "boarding", "enrichment", "foodprep"
];

export const palettes = {
  warm: { wall:"#f2eadc", floor:"#d7c7ae", wood:"#9a6747", accent:"#91a487" },
  sage: { wall:"#e9eee5", floor:"#c8bca8", wood:"#7c624f", accent:"#728d72" },
  clay: { wall:"#f2e3d5", floor:"#d1c1ae", wood:"#8d5d43", accent:"#b8755c" }
} as const;
export type PaletteName = keyof typeof palettes;
