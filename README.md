# মানবদেহ ৩ডি // Manobdeho 3D — Interactive Human Anatomy Atlas

Interactive 3D multi-system human anatomy dissection explorer built with **React**, **TypeScript**, **Three.js**, and **Vite**, featuring bilingual (Bengali & English) clinical profiles and *Terminologia Anatomica* Latin terminology.

## Key Features

- **Real 3D Skeletal GLB + Sculpted Multi-System Anatomy**: Combines a 20-mesh skeletal `GLB` assembly (`public/models/human-skeleton.glb`) with procedural PBR organs (gyral cerebrum, cerebellum & brainstem, beating multi-chamber heart, trachea & lungs, diaphragm, liver & gallbladder, stomach, kidneys & adrenals, haustrated colon & small intestines), fusiform musculature, vascular trees, and nervous pathways.
- **Dual Scroll-Driven Dissection Modes**:
  - **Regional Explode**: Smoothly separates cranial, thoracic, abdominal, upper limb, and lower limb structures along true anatomical axes as you scroll.
  - **Layer-by-Layer Peel**: Separates Integumentary, Muscular, Vascular, Skeletal, Visceral Organ, and Nervous systems side-by-side.
- **Direct 3D Raycasting & 360° Part Isolation**: Hover over any 3D structure for live identification, click to open its full Clinical Profile Inspector (morphology, physiological functions, arterial/venous supply, innervation, quantitative specs, and clinical pathology), and double-click (or use **360° Isolate Part**) to orbit/zoom around that isolated organ or bone.
- **Clinical Imaging & Physiological Controls**: Switch between `Realistic PBR`, `Clinical X-Ray`, and `Neuro-Vascular` shaders, toggle/solo layers with opacity sliders, adjust heart rate (`40–160 BPM`) with live SVG ECG trace, pause/play animations, and search all 40 structures via the native `<dialog>` Atlas Index (`Ctrl+K`).

## Tech Stack

- React 18 + TypeScript
- Three.js (`WebGLRenderer`, `OrbitControls`, `GLTFLoader`, `MeshPhysicalMaterial`, `Raycaster`)
- Lucide Icons + Vite 5

## Getting Started

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
```
