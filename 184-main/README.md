# CyberCast — AI-Driven Predictive Cybercrime Defense Platform

> **Ministry of Home Affairs (MHA) | Indian Cyber Crime Coordination Centre (I4C)**  
> **National Predictive Cyber Defense & Tactical Interdiction Initiative**  
> **Evidentiary Standard**: Section 63 BSA 2023 | **CFCFRMS Real-time Integration**  
> **Command**: Directorate of Cyber Operations & Inter-State Taskforce

---

## Overview

**CyberCast** transforms India's cybercrime response from reactive to proactive. In financial cyber fraud, stolen funds are systematically withdrawn from ATMs within a 2-to-6 hour critical window. CyberCast leverages machine learning, geospatial clustering, and banking network intelligence to predict likely cash withdrawal hotspots before fraudsters reach the ATM terminal, enabling proactive law enforcement deployment and rapid CFCFRMS account freezes.

---

## Core Platforms & Routes

### 1. Landing Page (`/`)
- High-fidelity command-center aesthetic inspired by `spur.us`.
- Interactive Three.js/WebGL geospatial globe with real-time risk nodes.
- Full problem-solution breakdown, technology stack, and institutional credibility badges (MHA, I4C, NCRB, CERT-In, RBI).

### 2. Predictive Risk Radar Dashboard (`/dashboard`)
- Multi-style base maps (Dark Mode, Street View, Satellite, Terrain) powered by enterprise ESRI ArcGIS CDN.
- Interactive ATM marker layers with pulsing high-risk alert zones.
- Real-time incident stream, temporal risk prediction, and tactical surveillance dispatch.

### 3. Report & Inter-State Collaboration Portal (`/collab`)
- **Authentication & 5 Role Tiers**: I4C Central Admin, State Nodal Officer, District Cyber Cell, Field Squad, and Bank Liaison with 15-minute auto-logout session timers.
- **National Case Dossier Management**: 6-Tab Master Dossier with victim privacy unmask, interactive Money Trail flowchart (*Victim $\rightarrow$ Mule Layer 1 $\rightarrow$ Mule Layer 2 $\rightarrow$ Predicted ATM*), and live CFCFRMS freeze buttons.
- **15+ Indian Languages Translation Engine**: Real-time cross-state communication bridge translating between Hindi, Tamil, Malayalam, Bengali, Marathi, Telugu, Gujarati, and English with voice message transcription.
- **National Intelligence Reports**: Case-specific AI intel and daily bilingual Situation Report (**SITREP**) in English and Hindi.
- **Digital Evidence Locker**: Cryptographic SHA-256 hash checksums, real-time re-verification, Section 65B IEA tamper-evident compliance, and regional script OCR parser.
- **Field Task Coordination**: 4-hour SLA auto-escalation protocol and rapid operational directives.
- **Search, AI Link Detection & Audit Trail**: Global omnibox search, syndicate nexus clustering, and immutable system audit ledger with CSV export.

---

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **3D & WebGL**: Three.js, React Three Fiber, Drei
- **GIS / Mapping**: Leaflet, ESRI ArcGIS CDN REST Layers
- **Motion**: GSAP, Lenis Smooth Scroll

---

## Local Development & Deployment

### Quick Start
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Vercel Deployment
This repository is pre-configured for zero-config Vercel deployment:
1. Connect this GitHub repository to Vercel.
2. Framework Preset: **Next.js** (Auto-detected).
3. Root Directory: `./` (Root).
4. Build Command: `npm run build` (or `next build`).
5. Output Directory: `.next`.
6. Click **Deploy**.
