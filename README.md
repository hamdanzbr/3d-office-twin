# 🏢 NBU Office Building - 3D Digital Twin

A high-performance BIM (Building Information Modeling) Digital Twin web application built with **Next.js**, **Three.js**, and **That Open Company (`@thatopen/fragments`)**. 

This platform visualizes multi-discipline architectural models, HVAC airflow systems, electrical distribution grids, and structural components in real-time, accompanied by space management analytics and asset monitoring.

---

## 📋 Task Completion Matrix

| Task | Description | Status | Implementation Details |
|---|---|:---:|---|
| **Task 1: Load Office Model** | Multi-discipline IFC to `.frag` conversion & Three.js loading | ✅ Complete | Converted 4 IFCs (Arch, Structural, HVAC, Elec) with spatial alignment |
| **Task 2: Discipline Switches** | Instant visibility toggles for all 4 building disciplines | ✅ Complete | Real-time `THREE.Group` visibility toggling with 0ms reload lag |
| **Task 3: Floor Selector** | Dynamic floor slicing based on `IfcBuildingStorey` | ✅ Complete | Elevation bounding-box filtering for Level 1, Level 2, and Roof |
| **Task 4: Element Properties** | Raycasting selection, glowing highlight & metadata inspector | ✅ Complete | Raycaster detection, emissive highlight, and BIM metadata card |
| **Task 5: Office Content** | Real equipment, office spaces, and realistic alert feeds | ⏳ In Progress | Replaced art placeholders with HVAC/Electrical equipment & spaces |
| **Task 6: Asset 3D Link** | Bi-directional zoom & camera fly-to by `GlobalId` | ⏳ Pending | Smooth camera tweening to selected asset coordinates |
| **Task 7: Alerts in 3D** | Highlighting critical alert assets in pulsing red | ⏳ Pending | Red emissive glow on target asset mesh with acknowledge reset |
| **Task 8: Crowd Heatmap** | 2D floorplan capacity & real-time occupancy visualization | ⏳ Optional | Area capacity thresholds & color-coded occupancy states |
| **Task 9: AI Assistant** | Digital twin assistant simulation using live context | ⏳ Optional | Conversational assistant with live asset/alert context |

---

## 🏛️ System Architecture & Engineering Decisions

### 1. Ahead-of-Time (AOT) BIM Conversion (`.ifc` → `.frag`)
* **The Challenge:** Raw IFC models are complex text files totaling over 160MB. Parsing raw IFC in the browser using WebAssembly on every page visit leads to 20–30 second browser freezes and heavy memory overhead.
* **The Solution:** We built an offline Node.js pipeline (`scripts/convert-ifc.mjs`) using `@thatopen/fragments` and `web-ifc`. This pre-compiles the geometry into compact binary `.frag` files (<10MB combined) and extracts building storeys and assets to `building-metadata.json`. The web app loads models in milliseconds without client-side parsing bottlenecks.

### 2. Multi-Discipline Coordinate Normalization
* **The Challenge:** In real-world BIM datasets, Architectural, Structural, and MEP engineering models often use disparate coordinate base points. If loaded naively, MEP conduits and ducts float outside the building envelope.
* **The Solution:** Applied calibrated coordinate offsets (`DISCIPLINE_OFFSETS`) to translate Structural, HVAC, and Electrical models into the Architectural reference frame.

### 3. High-Performance Three.js Rendering Pipeline
* Single shared `WebGLRenderer` with `OrbitControls` damping.
* Hierarchy grouped by discipline (`THREE.Group`), enabling instant toggling without garbage collection or mesh remount overhead.
* Per-mesh bounding elevation indexing (`mesh.userData.elevationY`) for instant floor isolation.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ or 20+
* npm or pnpm

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd art-gallery-digital-twin

# Install dependencies
npm install --legacy-peer-deps
