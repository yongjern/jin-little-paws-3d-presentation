# The Jin Little Paws Co. — Interactive 3D Presentation

An interactive, presentation-ready reconstruction of a pet retail, grooming and
hamster-hotel floor plan. The project turns a single plan image into a navigable
procedural 3D environment without remote models or textures.

## Main functions

- **Three viewing modes:** orbiting dollhouse, true top-plan view, and
  first-person walkthrough.
- **13-stop guided tour:** entrance, retail, service, waiting, two grooming
  rooms, breakroom, staff WC, secure hamster-hotel entrance, storage, boarding,
  enrichment, and food preparation.
- **Room interaction:** hover over a room in Top plan to preview its details, or
  click or tap it to keep its details open. Click a room in Dollhouse, or
  double-click in Walk inside. The room index can also locate, isolate or hide rooms.
- **Fixture focus:** hover over a fixture in Dollhouse or aim at it in Walk inside
  to see its name. Press `P` in Walk inside to pick up or put down a hamster.
- **Detailed access:** visible hinged doors and walk-through openings for both
  grooming rooms, breakroom, staff WC, secure two-stage hamster-hotel entry,
  storage, enrichment, boarding and food-preparation circulation.
- **Presentation layers:** walls, transparent X-ray walls, ceiling, furniture,
  room zones, labels, hamsters and animations.
- **Design controls:** three coordinated material schemes, lighting intensity,
  and day/evening modes.
- **Responsive controls:** keyboard and mouse on desktop; swipe look and touch
  joystick on mobile.

## Plan interpretation

The submitted plan is treated as an approximately 12 m × 22 m, single-storey model with a 4 m estimated clear height. The length and small fixture dimensions are visual estimates from the annotated plan. The centred south entrance opens into the retail zone; service and grooming occupy the middle; grooming rooms sit west, waiting and storage east; staff amenities form a transition band; and enrichment, boarding, food preparation and cleaning occupy the north.

The secure vestibule between the staff WC and storage opens directly into food
preparation. The rear care aisle connects food preparation, two facing rows of
six boarding habitats, and enrichment without full-height dividers.

## Assumptions

- Dimensions are proportional estimates because the source plan has no scale.
- Doors, counters, aisles and equipment use typical commercial clearances.
- Wall thickness is 180 mm; interior doors are approximately 900 mm wide.
- The ceiling is flat and intentionally hidden by default.
- Materials and equipment are visualization concepts, not construction specifications.

## Architecture

- `app/`: Next.js App Router entry, metadata and responsive visual system.
- `components/Experience.tsx`: WebGL canvas, camera movement, collision, post-processing and app state.
- `components/ShopScene.tsx`: procedural architecture, rooms, furniture, products, hamsters and lighting.
- `components/Hud.tsx`: room browser, information panels, layers, materials, tour and touch controls.
- `data/shop.ts`: centralized room dimensions, metadata, colours and camera/tour positions.

## Run locally

```bash
npm install
npm run dev
```

## Production preview

```bash
npm run build
npm start
```

The `postbuild` script copies public and static assets into the standalone
Next.js bundle automatically.

## Vercel deployment

Import the repository in Vercel and keep the detected Next.js defaults. No
environment variables, remote assets or custom build command are required.

## Adjustment guide

- Shop width, length and height: `data/floorPlan.ts`
- Room centres, dimensions, names, descriptions and camera targets: `data/shop.ts` → `rooms`
- Guided tour sequence: `data/shop.ts` → `tour`
- Material colours: `data/shop.ts` → `palettes`
- Physical walls, door openings and fixture geometry: `components/ShopScene.tsx`
- Walls, door openings, walk spawn points and fixture collision footprints: `data/floorPlan.ts`

## Test checklist

- Orbit, pan, zoom and reset work with mouse and touch.
- Every labelled room opens the correct information panel.
- Search, hide, isolate and restore operate from the room drawer.
- Roof, walls, furniture, zones, labels and hamster layers toggle independently.
- Walk mode responds to keyboard, dragging and the mobile joystick without leaving the shell.
- Every modeled door opening is accessible in walk mode, including the staff WC.
- Top Plan enters a north-oriented overhead view with pan and zoom.
- The guided tour reaches all 13 spaces; previous, next, pause, replay and exit work.
- Day/evening modes, intensity and all three material presets update the scene.
- Fullscreen, keyboard focus, reduced motion and WebGL fallback behave correctly.
- Layout is usable at desktop, tablet and phone widths in Chromium.

## Credit
This project is created and maintenance by these people with :heart:
- Deployment : Vercel
- Coding by : Yongjern with AI (ChatGPT 5.2-sol, Mulerun, ChatGPT 6.2-sol)
- Plan Based by : Jacen
