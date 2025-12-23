from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
import pandas as pd
import numpy as np
import math
from scipy.stats import norm

from app.services.data_provider import YFinanceProvider
from app.services.screener import scan_market

router = APIRouter()
provider = YFinanceProvider()

# --- LIMPIEZA DE DATOS (Anti-Error 500) ---
def sanitize_json(data):
    if isinstance(data, dict):
        return {k: sanitize_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_json(v) for v in data]
    elif isinstance(data, float):
        if math.isnan(data) or math.isinf(data): return 0.0
        return data
    elif isinstance(data, (np.int64, np.int32)):
        return int(data)
    elif isinstance(data, (np.float64, np.float32)):
        val = float(data)
        if math.isnan(val) or math.isinf(val): return 0.0
        return val
    elif isinstance(data, pd.Timestamp):
        return data.strftime('%Y-%m-%d')
    return data

class ScannerConfig(BaseModel):
    sector: str
    num_tickers: int
    max_dte: int
    lookback: int

tasks = {}

async def update_task_status(task_id, status, progress=None, data=None, error=None):
    if task_id not in tasks: tasks[task_id] = {}
    tasks[task_id]["status"] = status
    if progress is not None: tasks[task_id]["progress"] = progress
    if data is not None: tasks[task_id]["data"] = sanitize_json(data)
    if error is not None: tasks[task_id]["error"] = error

@router.post("/scanner/start")
async def start_scanner_endpoint(config: ScannerConfig):
    import uuid
    import asyncio
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "pending", "progress": 0, "data": []}
    asyncio.create_task(scan_market(config, task_id))
    return {"task_id": task_id}

@router.get("/scanner/status/{task_id}")
async def get_scanner_status(task_id: str):
    if task_id not in tasks: raise HTTPException(status_code=404)
    return tasks[task_id]

@router.get("/asset/{ticker}")
# ... (manten tus imports y sanitize_json arriba) ...

@router.get("/asset/{ticker}")
async def get_asset_details(ticker: str):
    print(f"\n--- 🔍 DEBUG ASSET: {ticker} ---")
    try:
        # 1. Precio Spot
        price = provider.get_spot_price(ticker)
        print(f"DEBUG: Precio spot obtenido: {price}")
        
        if price == 0:
            print("DEBUG: ❌ Precio es 0. Abortando.")
            raise HTTPException(status_code=404, detail="Ticker not found or price 0")

        # 2. Histórico
        print("DEBUG: Solicitando histórico 6mo...")
        df_hist = provider.get_history(ticker, period="6mo")
        
        history_data = []
        if df_hist.empty:
            print("DEBUG: ❌ DataFrame de histórico VACÍO.")
        else:
            print(f"DEBUG: ✅ Histórico OK. Filas: {len(df_hist)}")
            # Log de la primera fila para ver formato
            print(f"DEBUG: Muestra fila 0: {df_hist.iloc[0].to_dict()}")
            
            df_hist['SMA20'] = df_hist['Close'].rolling(20).mean()
            df_hist['SMA50'] = df_hist['Close'].rolling(50).mean()
            df_hist = df_hist.reset_index()
            
            for _, row in df_hist.iterrows():
                # Fix fecha
                try:
                    d_str = row['Date'].strftime('%Y-%m-%d')
                except:
                    d_str = str(row['Date'])
                
                history_data.append({
                    "date": d_str,
                    "close": float(row['Close']),
                    "sma20": float(row['SMA20']) if not pd.isna(row['SMA20']) else None,
                    "sma50": float(row['SMA50']) if not pd.isna(row['SMA50']) else None
                })
        
        if len(history_data) == 0:
            print("DEBUG: ⚠️ Alerta: El array final 'history_data' está vacío.")

        # 3. GEX
        print("DEBUG: Calculando GEX...")
        df_opts = provider.get_aggregated_options(ticker)
        call_wall = 0; put_wall = 0; gex_data = []
        
        if df_opts.empty:
            print("DEBUG: ⚠️ No hay opciones agregadas.")
        else:
            print(f"DEBUG: ✅ Opciones OK. Filas: {len(df_opts)}")
            calls = df_opts[df_opts['type'] == 'call']
            puts = df_opts[df_opts['type'] == 'put']
            
            if not calls.empty:
                call_wall = float(calls.loc[calls['openInterest'].idxmax(), 'strike'])
            if not puts.empty:
                put_wall = float(puts.loc[puts['openInterest'].idxmax(), 'strike'])
            
            # GEX Loop simple
            strikes = df_opts[(df_opts['strike'] > price*0.8) & (df_opts['strike'] < price*1.2)]['strike'].unique()
            strikes.sort()
            if len(strikes) > 60: strikes = strikes[::int(len(strikes)/60)]
            
            for k in strikes:
                c = calls[calls['strike']==k]['openInterest'].sum()
                p = puts[puts['strike']==k]['openInterest'].sum()
                gex_data.append({"strike": float(k), "gex": float((c-p)*100)})

        response = {
            "ticker": ticker,
            "price": price,
            "call_wall": call_wall,
            "put_wall": put_wall,
            "gamma_flip": price,
            "history": history_data,
            "gex_profile": gex_data
        }
        
        return sanitize_json(response)

    except Exception as e:
        print(f"DEBUG: 💥 CRASH EN /ASSET: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))