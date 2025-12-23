from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
import pandas as pd
import numpy as np
import math
from app.services.data_provider import YFinanceProvider
from app.services.screener import scan_market

router = APIRouter()
provider = YFinanceProvider()

def sanitize_json(data):
    if isinstance(data, dict): return {k: sanitize_json(v) for k, v in data.items()}
    elif isinstance(data, list): return [sanitize_json(v) for v in data]
    elif isinstance(data, float):
        if math.isnan(data) or math.isinf(data): return 0.0
        return data
    elif isinstance(data, (np.int64, np.int32)): return int(data)
    elif isinstance(data, pd.Timestamp): return data.strftime('%Y-%m-%d')
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
async def get_asset_details(ticker: str):
    try:
        spot_data = provider.get_spot_price(ticker)
        # Fix crítico para SingleAsset
        price = spot_data.get('price', 0.0) if isinstance(spot_data, dict) else float(spot_data)
        
        if price == 0: raise HTTPException(status_code=404, detail="Price not found")

        df_hist = provider.get_history(ticker, period="6mo")
        history_data = []
        if not df_hist.empty:
            df_hist['SMA20'] = df_hist['Close'].rolling(20).mean()
            df_hist['SMA50'] = df_hist['Close'].rolling(50).mean()
            df_hist = df_hist.reset_index()
            for _, row in df_hist.iterrows():
                d_str = str(row['Date']) if not hasattr(row['Date'], 'strftime') else row['Date'].strftime('%Y-%m-%d')
                history_data.append({
                    "date": d_str,
                    "close": float(row['Close']),
                    "sma20": float(row['SMA20']) if not pd.isna(row['SMA20']) else None,
                    "sma50": float(row['SMA50']) if not pd.isna(row['SMA50']) else None
                })

        # GEX
        call_wall = 0; put_wall = 0; gex_data = []
        try:
            df_opts = provider.get_aggregated_options(ticker)
            if not df_opts.empty:
                calls = df_opts[df_opts['type'] == 'call']
                puts = df_opts[df_opts['type'] == 'put']
                if not calls.empty: call_wall = float(calls.loc[calls['openInterest'].idxmax(), 'strike'])
                if not puts.empty: put_wall = float(puts.loc[puts['openInterest'].idxmax(), 'strike'])
                
                strikes = df_opts['strike'].unique()
                strikes = [k for k in strikes if price * 0.7 < k < price * 1.3]
                strikes.sort()
                if len(strikes) > 50: strikes = strikes[::2]
                for k in strikes:
                    c = calls[calls['strike'] == k]['openInterest'].sum()
                    p = puts[puts['strike'] == k]['openInterest'].sum()
                    gex_data.append({"strike": float(k), "gex": float(c - p)})
        except: pass

        return sanitize_json({
            "ticker": ticker, "price": price, 
            "call_wall": call_wall, "put_wall": put_wall, "gamma_flip": price,
            "history": history_data, "gex_profile": gex_data
        })
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))