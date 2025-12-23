# Archivo: backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router

app = FastAPI(title="QuantDesk API", version="2.0")

# --- CORS (Permisos de Seguridad) ---
# Esto permite que tu Frontend (React) hable con este Backend.
# "*" significa "permitir a todos" (útil para desarrollo local).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluimos las rutas que creamos antes
app.include_router(router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "QuantDesk API is running 🚀"}