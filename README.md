# 🏢 NBU Office Facility Digital Twin

A high-performance BIM (Building Information Modeling) Digital Twin web application built with **Next.js 14**, **Three.js**, and **That Open Company (`@thatopen/fragments`)**.

---

## ⚙️ How the IFC Models Were Converted

Raw IFC files from the NBU Office Building dataset totaled over 160 MB. Parsing raw IFC in the browser via client-side WebAssembly causes 20–30 second loading freezes and high memory consumption on client devices.

To achieve production-grade loading speeds and instant 60 FPS rendering:

1. **Ahead-of-Time (AOT) Conversion Script**:
   * We created an automated Node.js conversion pipeline in [`scripts/convert-ifc.mjs`](scripts/convert-ifc.mjs) utilizing `@thatopen/fragments` (`IfcImporter`) and `web-ifc`.
   * Run via: `npm run convert-ifc`
2. **Binary Fragment Generation (`.frag`)**:
   * Converted all 4 building disciplines into binary streamable fragments located in `public/models/`:
     * `architecture.frag` (~989 KB)
     * `structural.frag` (~548 KB)
     * `electrical.frag` (~1.0 MB)
     * `hvac.frag` (~6.1 MB)
   * **Total download size is < 9 MB** (a ~94% reduction from the 160MB raw IFC), streaming into Three.js in under 1 second.
3. **Spatial & Metadata Extraction**:
   * The script pre-extracted building hierarchy, `IfcBuildingStorey` elevations, `IfcSpace` room boundaries, and equipment metadata into [`public/models/building-metadata.json`](public/models/building-metadata.json).
4. **Coordinate Alignment**:
   * Architectural, Structural, and MEP engineering disciplines often use different survey base points in Revit. The conversion script calibrated and applied unified world coordinate offsets (`offsets.structural`, `offsets.electrical`, `offsets.hvac`) so all MEP ductwork, electrical trays, and structural columns align seamlessly with the architectural envelope.

---

## 📋 What's Done & What's Not

### ✅ What's Done

| Feature / Task | Implementation Details |
| :--- | :--- |
| **Task 1: Load Office Model** | Automated AOT `.frag` conversion with That Open Engine; zero client-side WASM parsing lag. |
| **Task 2: Discipline Switches** | Instant (0ms) visibility toggling for Architecture, Structural, HVAC, and Electrical disciplines + **X-Ray Ghost Mode** to inspect ductwork through translucent walls. |
| **Task 3: Dynamic Floor Slicing** | Accurate vertical cutaways based on authentic IFC elevations (`Level 1: 0.0m`, `Level 2: 4.27m`, `Roof: 7.92m`) with up/down storey steppers. |
| **Task 4: BIM Properties Inspector** | Stationary click detection, emissive cyan mesh highlight, and drawer displaying true Express ID, IFC Category, Revit Family/Tag, dynamic Storey, and 22-character `GlobalId` with 1-click clipboard copy. |
| **Task 5: Office Facility Realism** | 100% elimination of art gallery placeholders. Replaced with authentic MEP equipment (*Carrier AHU-01*, *Trane Screw Chiller-01*, *Greenheck RTU-01 Fan*, *Price VAV-201*, *Square D Panel LP-1*, *Bell & Gossett Pump P-01*), real `IfcSpace` office rooms, and realistic predictive diagnostics. |
| **Task 6: Bi-directional UI ↔ 3D Linking** | All 6 primary MEP assets mapped by unique IFC `GlobalId`. Selecting in the Assets table triggers smooth camera fly-to and highlight in 3D; clicking the 3D element selects the corresponding dashboard asset. |
| **Task 7: Visual Alerts in 3D** | Active critical alerts trigger pulsing red emissive materials and billboard warning beacon sprites (`depthTest: false`) visible through walls, synchronizing with dashboard acknowledgment. |
| **Task 8: Office Crowd Density Heatmap** | 2D office floor plans for Level 1 & Level 2 with standard $10\,\text{m}^2/\text{person}$ legal capacity calculations, animated occupant movement, and dynamic Green / Amber / Red threshold states. |

### ⏳ What's Not Done / Optional Scope

* **Task 9: AI Assistant (Optional)**: The chat interface, assistant scaffolding, and contextual mock responses are implemented in the UI. Live LLM streaming via OpenAI/Gemini API was marked optional in the assignment brief and is left unconfigured (can be activated by providing an `OPENAI_API_KEY` or `GEMINI_API_KEY` in environment variables).

---

## 🛠️ Local Development & Setup

### Prerequisites
* **Node.js**: v18.x or v20.x
* **npm**: v9+

### Run Locally
```bash
# 1. Clone the repository
git clone https://github.com/hamdanzbr/3d-office-twin.git
cd 3d-office-twin

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Tech Stack
* **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
* **3D Graphics**: [Three.js](https://threejs.org/)
* **BIM Engine**: [@thatopen/fragments](https://github.com/ThatOpen/engine_fragments) & [web-ifc](https://github.com/ThatOpen/engine_web-ifc)
* **Styling**: Tailwind CSS & Lucide Icons
* **Deployment**: Vercel
