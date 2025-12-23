import pandas as pd
import numpy as np
import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.services.data_provider import YFinanceProvider

provider = YFinanceProvider()

def analyze_single_ticker(item, lookback):
    ticker = item.get('Ticker')
    print(f"DEBUG [{ticker}]: Iniciando análisis...") # CHIVATO 1
    
    try:
        # 1. Histórico
        df = provider.get_history(ticker, period="6mo")
        if df.empty:
            print(f"DEBUG [{ticker}]: ❌ DataFrame vacío o fallo en descarga.")
            return None
        
        if len(df) < 50:
            print(f"DEBUG [{ticker}]: ❌ Pocos datos ({len(df)} filas).")
            return None

        # 2. Precios y Medias
        price = float(df['Close'].iloc[-1])
        sma20 = float(df['Close'].rolling(20).mean().iloc[-1])
        sma50 = float(df['Close'].rolling(50).mean().iloc[-1])
        
        # 3. Volatilidad
        try:
            log_ret = np.log(df['Close'] / df['Close'].shift(1))
            rv = float(log_ret.tail(lookback).std() * np.sqrt(252) * 100)
        except Exception as e:
            print(f"DEBUG [{ticker}]: Error cálculo RV: {e}")
            rv = 0.0
        
        # 4. Opciones
        iv = 0.0; vrp = 0.0; call_wall = 0.0; put_wall = 0.0
        dist_call = 0.0; dist_put = 0.0
        
        chain = provider.get_options_chain(ticker)
        if chain:
            try:
                calls = chain.calls
                puts = chain.puts
                
                # IV ATM
                mask = (calls['strike'] > price*0.95) & (calls['strike'] < price*1.05)
                atm = calls[mask]
                if not atm.empty:
                    iv = float(atm['impliedVolatility'].mean() * 100)
                else:
                    # Si no hay ATM, media de todo (fallback)
                    iv = float(calls['impliedVolatility'].mean() * 100)
                
                vrp = iv - rv
                
                # Walls
                if not calls.empty:
                    idx = calls['openInterest'].idxmax()
                    call_wall = float(calls.loc[idx, 'strike'])
                    dist_call = ((call_wall - price)/price)*100
                
                if not puts.empty:
                    idx = puts['openInterest'].idxmax()
                    put_wall = float(puts.loc[idx, 'strike'])
                    dist_put = ((put_wall - price)/price)*100
            except Exception as e:
                print(f"DEBUG [{ticker}]: Error procesando opciones: {e}")
        else:
            print(f"DEBUG [{ticker}]: ⚠️ No hay cadena de opciones.")

        # RESULTADO FINAL
        # Imprimimos valores clave para ver si llegan al Playbook
        print(f"DEBUG [{ticker}]: ✅ ÉXITO -> Precio:{price:.1f} SMA20:{sma20:.1f} VRP:{vrp:.1f}")
        
        return {
            "Ticker": ticker,
            "Sector": item.get('Sector'),
            "Price": price,
            "SMA20_val": sma20 if not pd.isna(sma20) else price,
            "SMA50_val": sma50 if not pd.isna(sma50) else price,
            "Dist SMA20 %": ((price - sma20)/sma20)*100 if sma20 else 0,
            "Dist SMA50 %": ((price - sma50)/sma50)*100 if sma50 else 0,
            "VRP": vrp,
            "IV": iv,
            "RV": rv,
            "Call Wall": call_wall,
            "Put Wall": put_wall,
            "Dist Call Wall %": dist_call,
            "Dist Put Wall %": dist_put
        }
        
    except Exception as e:
        print(f"DEBUG [{ticker}]: 💥 CRASH total en análisis: {e}")
        return None

async def scan_market(config, task_id: str):
    from app.routes import update_task_status
    print(f"\n--- 🏁 START SCAN (Task: {task_id}) ---")
    
    try:
        sp500 = provider.get_sp500_tickers()
        print(f"DEBUG: Lista SP500 descargada. Total: {len(sp500)}")
        
        candidates = []
        tgt = config.sector.lower() if config.sector else "todos"
        
        for i in sp500:
            s = i.get('Sector', 'Unknown')
            if tgt not in ['todos', 'all'] and str(s).lower() != tgt: continue
            candidates.append(i)
            
        candidates = candidates[:config.num_tickers]
        total = len(candidates)
        print(f"DEBUG: Candidatos finales a analizar: {total}")
        
        results = []
        loop = asyncio.get_running_loop()
        
        with ThreadPoolExecutor(max_workers=5) as executor: # Bajamos a 5 workers para ver mejor los logs
            tasks = [loop.run_in_executor(executor, analyze_single_ticker, c, config.lookback) for c in candidates]
            
            completed = 0
            for f in asyncio.as_completed(tasks):
                res = await f
                completed += 1
                if completed % 5 == 0:
                    prog = int(completed/total*90)
                    await update_task_status(task_id, "running", progress=prog)
                    print(f"--> Progreso Global: {completed}/{total}")
                if res: results.append(res)

        print(f"--- 🏁 FIN SCAN. Resultados válidos: {len(results)} ---")
        
        # Verificación final antes de enviar
        if len(results) > 0:
            print("DEBUG: Ejemplo de resultado 0:", results[0])
        else:
            print("DEBUG: ❌ ALERTA: La lista de resultados está vacía.")

        await update_task_status(task_id, "completed", data=results)

    except Exception as e:
        print(f"DEBUG: 💥 CRASH EN BUCLE PRINCIPAL: {e}")
        import traceback
        traceback.print_exc()
        await update_task_status(task_id, "failed", error=str(e))