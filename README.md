# CyberCast — AI-Driven Predictive Cybercrime Defense Platform

> **Ministry of Home Affairs (MHA) | Indian Cyber Crime Coordination Centre (I4C)**  
> **National Predictive Cyber Defense & Tactical Interdiction Initiative**  
> **Statutory Compliance**: Section 63 BSA 2023 | **CFCFRMS Real-time Integration**  
> **Command**: Directorate of Cyber Operations & Inter-State Taskforce

---

## Repository Structure

This monorepo contains both the frontend platform and the machine learning inference backend:

```
cybercrime/
├── 184-main/               # Next.js 14 Frontend Platform (Deploy on Vercel)
│   ├── src/
│   │   ├── app/            # App Router: /, /dashboard, /collab, /benchmarks, /verify
│   │   │   └── api/model/  # High-performance built-in model API routes
│   │   ├── components/     # UI components (SaaS light theme, ArcGIS maps, modals)
│   │   ├── data/           # 964-district risk table & landmark case records
│   │   └── lib/            # Auth gateway, hardware bridge, API service
│   ├── package.json
│   └── tailwind.config.ts
│
├── 184_model-main/         # Python 3.11 FastAPI ML Engine (Deploy on Railway)
│   ├── main.py             # FastAPI prediction service & endpoints
│   ├── models/             # Trained XGBoost & Scikit-Learn models (.pkl)
│   ├── data/               # Fixed district risk scores & landmark case records
│   ├── requirements.txt    # Python dependencies
│   ├── runtime.txt         # Python 3.11.9
│   ├── Procfile            # Uvicorn web process
│   └── railway.toml        # Railway build & deploy configuration
│
└── reqq.md                 # Project requirements & architectural guidelines
```

---

## Deployment Instructions

### 1. Deploy Frontend on Vercel (`184-main`)
1. Go to [vercel.com](https://vercel.com/) and click **Add New...** $\rightarrow$ **Project**.
2. Import this repository: `https://github.com/cozyysnow/cybercrime.git`.
3. Set **Root Directory** to `184-main`.
4. Framework Preset: **Next.js** (auto-detected).
5. Build Command: `npm run build`
6. Output Directory: `.next`
7. *(Optional)* Set Environment Variable:
   - `NEXT_PUBLIC_MODEL_API_URL`: `https://<your-railway-app>.up.railway.app`
   *(Note: The frontend includes built-in `/api/model` routes with all 964 NCRB districts so it works immediately even without an external backend!)*
8. Click **Deploy**.

### 2. Deploy Backend on Railway (`184_model-main`)
1. Go to [railway.app](https://railway.app/) and click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
2. Select this repository: `https://github.com/cozyysnow/cybercrime.git`.
3. In Railway settings:
   - Set **Root Directory** to `184_model-main`.
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1`
4. Under **Settings** $\rightarrow$ **Networking**, click **Generate Domain** to get your public API URL.
5. Verify health: `https://<your-railway-domain>/health`
