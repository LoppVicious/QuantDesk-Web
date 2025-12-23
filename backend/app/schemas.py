# Archivo: backend/app/schemas.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# --- MODELOS DE SALIDA (Lo que el frontend recibe) ---

class GexDataPoint(BaseModel):
    strike: float
    NetGEX: float
    TotalOI: float

class AssetProfileResponse(BaseModel):
    ticker: str
    price: float
    gex_profile: List[GexDataPoint]
    gamma_flip: float
    call_wall: float
    put_wall: float
    iv_atm: float
    
    # Datos para el gráfico de velas (simple por ahora)
    chart_data: List[Dict[str, Any]] = [] 

# --- MODELOS DE ENTRADA (Lo que el frontend envía) ---

class ScannerConfig(BaseModel):
    sector: str = "Todos"
    num_tickers: int = 50
    max_dte: int = 45
    lookback: int = 30

class ScanTaskResponse(BaseModel):
    task_id: str
    status: str
    message: str