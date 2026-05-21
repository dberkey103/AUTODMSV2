# AutoDMS v2

## Stack
- **Backend:** FastAPI (Python)
- **Frontend:** React + Vite + Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Deploy:** Backend → Render | Frontend → Vercel

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
Runs on http://localhost:8000

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Runs on http://localhost:5173

## Deploy

### Backend → Render
1. Create new Web Service on render.com
2. Connect to GitHub repo, set root to `/backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (SUPABASE_URL, SUPABASE_KEY, etc.)

### Frontend → Vercel
1. Import GitHub repo on vercel.com
2. Set root to `/frontend`
3. Add env var: VITE_API_URL = your Render backend URL
4. Deploy

## Environment Variables

### Backend
- SUPABASE_URL
- SUPABASE_KEY
- ZIPTAX_KEY
- CARSXE_KEY

### Frontend
- VITE_API_URL (backend URL)
- VITE_GOOGLE_MAPS_KEY
