Product Requirement Document (PRD)

1. Project Overview & Core ObjectiveProduct Name: GridSnap (Auto-Fit Photo Collage Maker)Goal: Ek high-performance web app jahan users alag-alag grid layouts (2×2, 3×3, 1×4, 2×4, 5×5) select karke photos upload kar sakein.Key Visual Rule: Photos kisi bhi aspect ratio ki hon, frame me bina stretch/squish hue cleanly fit honi chahiye (object-fit: cover with pan/drag support).Resource Constraint: Client-side compute, minimal dependencies, direct browser rendering via HTML5 Canvas (zero API token cost).

2. Grid Specifications & SlotsGrid LayoutRows × ColumnsTotal Image SlotsPrimary Use Case2 × 22 Rows, 2 Cols4 ImagesClassic square mini-album3 × 33 Rows, 3 Cols9 ImagesInstagram grid style1 × 41 Row, 4 Cols (or 4×1 vertical)4 ImagesPhotobooth strip format2 × 42 Rows, 4 Cols8 ImagesWide landscape collage5 × 55 Rows, 5 Cols25 ImagesHigh-density mosaic

3. Functional Requirements
3.1 Upload & Slot ManagementBatch Upload: User ek sath multiple photos select kar sake, jo sequentially empty slots me load ho jayein.Single Slot Upload/Replace: Kisi bhi individual slot par click/tap karke specific image replace ki ja sake.Drag & Drop: Local storage se direct grid slots me drop support.
3.2 Auto-Fit & Framing EngineNo Distortion Rule: Har cell me image object-fit: cover aur object-position: center ke sath load hogi.Micro-Adjustment (Repositioning): User image ko slot ke andar drag karke focal point adjust kar sake (pan horizontally/vertically).Zoom Slider (Optional per slot): 1x se 2x digital zoom within the slot boundary.
3.3 Canvas CustomizationSpacing / Gap: Grid border aur cells ke beech spacing slider (0px to 24px).Background Color: Canvas border/gap ka color picker (Default: #FFFFFF, Black, Transparent).Corner Radius: Slot borders ke liye smooth border-radius slider (0px to 20px).
3.4 Export & OutputClient-Side Rendering: HTML5 Canvas API ka use karke high-resolution image render karna.Export Formats: PNG aur JPEG (Quality slider: Standard vs High-Res 300 DPI for print).Instant Download: Browser blob download trigger (<a> tag with download attribute).

4. Technical Architecture (Zero Token / Minimal Resources)[Browser UI] 
   │
   ├── Grid Container (CSS Grid: dynamic template columns & rows)
   │     └── Cell Slots (overflow: hidden; object-fit: cover)
   │
   ├── Image Processor (HTML FileReader API -> Local Base64 / Blob URL)
   │
   └── Export Engine (Offscreen HTML5 Canvas -> canvas.toBlob() -> Download)
Frontend Framework: Vanilla JavaScript (ES6+) ya lightweight Vite + React.CSS Engine: Pure CSS Grid. Zero external CSS libraries (No heavy Tailwind runtime needed if optimizing for absolute minimum footprint).Memory Optimization: Uploaded images ko URL.createObjectURL() se handle karein taaki base64 memory overhead na ho, aur image replace/remove hone par URL.revokeObjectURL() call ho.

5. UI / Layout Implementation BlueprintCSS Grid Rules (Dynamic Switcher)CSS.collage-frame {
  display: grid;
  width: 100%;
  max-width: 800px;
  aspect-ratio: 1 / 1; /* For square layouts */
  gap: var(--grid-gap, 8px);
  background-color: var(--bg-color, #ffffff);
  overflow: hidden;
}

/* Layout Classes */
.grid-2x2 { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); }
.grid-3x3 { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); }
.grid-1x4 { grid-template-columns: repeat(4, 1fr); grid-template-rows: 1fr; aspect-ratio: 4 / 1; }
.grid-2x4 { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 1fr); aspect-ratio: 2 / 1; }
.grid-5x5 { grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(5, 1fr); }

.slot {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  user-select: none;
}

6. Token & Compute Optimization Strategy (Anti-Gravity IDE)Self-Contained Single File Prototype: Shuruat me pure project ko ek single file (index.html jisme inline CSS aur JS ho) ke roop me build karein. Isse IDE context window aur build tokens 90% tak kam ho jate hain.Zero Backend Requirement: Server, Node endpoints, ya Cloudinary jaisi services ko bypass karein. Saara image scaling aur file rendering user ke local browser CPU/GPU par chalega.No Heavy Packages: Fabric.js ya Konva.js jaise heavy canvas libraries load karne ki zaroorat nahi hai; basic dynamic CSS Grid preview ke liye aur direct Canvas 2D Context export ke liye kaafi hai.