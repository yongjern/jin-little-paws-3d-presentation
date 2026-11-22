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

// All estimated dimensions live here. Units are metres; origin is shop centre.
// Width ≈ 17 m, length ≈ 22 m, clear internal height ≈ 4 m.
export const SHOP = { width: 17, length: 22, height: 4, wall: 0.18 } as const;

export const rooms: Room[] = [
  { id:"entrance", name:"Entrance / Exit", short:"A welcoming, centered threshold beneath the Little Paws wordmark.", purpose:"Primary customer arrival, departure and orientation point.", center:[0,0.03,9.9], size:[4.2,2.1], camera:[0,4.2,14], target:[0,0.7,9], color:"#d7a887" },
  { id:"retail", name:"Retail Product Zone", short:"Open sightlines connect four stocked aisles and two enrichment displays.", purpose:"Hamster food mixes, treats, bedding, water bottles, exercise wheels and daily care essentials.", center:[0,0.03,6.2], size:[15.8,6.4], camera:[0,8.8,12], target:[0,0,5.6], color:"#dbcaa2" },
  { id:"service", name:"Service & Grooming Zone", short:"A curved central counter anchors the transition from retail to care services.", purpose:"Grooming check-in, service enquiries and clear customer wayfinding.", center:[0,0.03,0.5], size:[8.6,5.1], camera:[0,6.2,7.2], target:[0,0.8,0], color:"#b7c3a0" },
  { id:"waiting", name:"Waiting Area", short:"An L-shaped perimeter lounge keeps the central route open beside the service counter.", purpose:"Comfortable wall-side seating with clear views toward check-in and an unobstructed customer path.", center:[5.5,0.03,0], size:[5,6], camera:[8.7,4.8,5], target:[5.8,0.7,.2], color:"#c7d2bd" },
  { id:"grooming1", name:"Grooming Room 1", short:"An enclosed grooming bay with table, bath and storage.", purpose:"Quiet individual grooming with washable, hygienic finishes.", center:[-6.2,0.03,-1.5], size:[3.5,3.3], camera:[-9,4.6,1.8], target:[-6.2,0.7,-1.5], color:"#d8b2a1" },
  { id:"grooming2", name:"Grooming Room 2", short:"A second enclosed treatment room mirroring the first.", purpose:"Parallel grooming capacity with dedicated equipment and clearance.", center:[-6.2,0.03,2.2], size:[3.5,3.3], camera:[-9,4.6,5], target:[-6.2,0.7,2.2], color:"#e2c2b3" },
  { id:"breakroom", name:"Staff Breakroom", short:"A private staff retreat positioned behind the service counter.", purpose:"Rest, lockers, kitchenette and short staff breaks away from customers.", center:[0,0.03,-3.7], size:[4.5,3.1], camera:[0,5.1,0], target:[0,0.7,-3.7], color:"#c9c3ad" },
  { id:"wc", name:"Staff WC", short:"Compact staff washroom with a toilet, hand basin, mirror and paper holder.", purpose:"Private staff amenity separated from animal-care spaces, with practical sanitary fixtures.", center:[3.2,0.03,-3.7], size:[1.7,3.1], camera:[3.2,4.2,-0.6], target:[3.2,0.5,-3.7], color:"#b9cdc5" },
  { id:"secure", name:"Secure Hamster-Hotel Entrance", short:"A controlled transition vestibule protects the boarding environment.", purpose:"Prevents escapes and separates public and small-animal care circulation.", center:[4.7,0.03,-3.7], size:[1.5,3.1], camera:[5.5,4,-0.5], target:[4.7,0.7,-3.7], color:"#b0c8b3" },
  { id:"storage", name:"Storage", short:"Compact operational storage near both waiting and hotel areas.", purpose:"Secure supplies, cleaning stock and overflow retail inventory.", center:[6.8,0.03,-3.7], size:[2.7,3.1], camera:[8.8,4,-0.5], target:[6.8,0.6,-3.7], color:"#cbbba5" },
  { id:"boarding", name:"Hamster-Hotel Boarding Room", short:"Two staggered rows of individual habitats preserve a central care aisle.", purpose:"Secure short-stay hamster boarding with visual checks, easy-clean access and clear circulation.", center:[0,0.03,-7.4], size:[8.6,4.6], camera:[0,7.4,-1.8], target:[0,0.8,-7.8], color:"#c8d6be" },
  { id:"enrichment", name:"Hamster Enrichment Area", short:"A playful corner of wheels, tunnels, hideouts and low platforms.", purpose:"Supervised exercise, foraging and enrichment for boarding hamsters.", center:[-6.4,0.03,-7.4], size:[4.2,4.6], camera:[-8.8,5.8,-2.5], target:[-6.4,0.7,-7.4], color:"#e2c49f" },
  { id:"foodprep", name:"Food Preparation & Cleaning", short:"A stainless work zone with sink, prep bench and washable surfaces.", purpose:"Hygienic food portioning, bowl washing and daily hotel support.", center:[6.2,0.03,-7.4], size:[4.2,4.6], camera:[8.8,5.6,-2.4], target:[6.2,0.8,-7.4], color:"#b7ceca" }
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
