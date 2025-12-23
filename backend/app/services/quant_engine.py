# Archivo: backend/app/services/quant_engine.py
import numpy as np
import pandas as pd
import concurrent.futures
# Importación ajustada a la nueva estructura:
from app.core.engine import BlackScholes 

class QuantService:
    def __init__(self, provider):
        self.provider = provider

    def compute_gex_profile(self, ticker, max_dte, r_rate=0.045):
        """
        Calcula el perfil GEX, OI Total y Gamma Flip.
        Retorna un Diccionario puro (listo para convertir a JSON), no DataFrames complejos.
        """
        calls, puts, spot = self.provider.get_aggregated_options(ticker, max_dte)
        
        if calls is None or spot == 0: return None

        calls['sign'] = 1.0
        puts['sign'] = -1.0
        df_opts = pd.concat([calls, puts], ignore_index=True)

        df_opts = df_opts[
            (df_opts['openInterest'] > 0) & 
            (df_opts['impliedVolatility'] > 0) & 
            (df_opts['strike'] > 0)
        ].copy()

        if df_opts.empty: return None

        df_opts['T'] = df_opts['daysToEx'] / 365.0
        
        oi_calls = df_opts[df_opts['sign'] == 1].groupby('strike')['openInterest'].sum()
        oi_puts = df_opts[df_opts['sign'] == -1].groupby('strike')['openInterest'].sum()
        
        cw = float(oi_calls.idxmax()) if not oi_calls.empty else 0.0
        pw = float(oi_puts.idxmax()) if not oi_puts.empty else 0.0

        gammas = BlackScholes.get_gamma(
            spot, 
            df_opts['strike'].values, 
            df_opts['T'].values, 
            r_rate, 
            df_opts['impliedVolatility'].values
        )
        
        df_opts['GEX'] = gammas * df_opts['openInterest'].values * spot * 100 * df_opts['sign'].values
        
        grouped = df_opts.groupby('strike').agg(
            NetGEX=('GEX', 'sum'),
            TotalOI=('openInterest', 'sum')
        )
        
        strikes_view = grouped.index
        mask = (strikes_view >= spot * 0.4) & (strikes_view <= spot * 1.6)
        
        # Convertimos a JSON-friendly (lista de diccionarios)
        df_gex = grouped[mask].reset_index()
        gex_data = df_gex.to_dict(orient='records') 

        # Cálculo de Gamma Flip
        search_spots = np.linspace(spot * 0.7, spot * 1.3, 40)
        S_matrix = search_spots[:, np.newaxis]
        K_vec = df_opts['strike'].values
        T_vec = df_opts['T'].values
        IV_vec = df_opts['impliedVolatility'].values
        OI_vec = df_opts['openInterest'].values
        Sign_vec = df_opts['sign'].values

        gamma_matrix = BlackScholes.get_gamma(S_matrix, K_vec, T_vec, r_rate, IV_vec)
        net_gammas = np.sum(gamma_matrix * OI_vec * Sign_vec, axis=1) * S_matrix.flatten() * 100

        crosses = np.where(np.diff(np.sign(net_gammas)))[0]
        gamma_flip = None
        if len(crosses) > 0:
            idx = crosses[np.abs(search_spots[crosses] - spot).argmin()]
            y1, y2 = net_gammas[idx], net_gammas[idx+1]
            x1, x2 = search_spots[idx], search_spots[idx+1]
            if y2 != y1:
                gamma_flip = x1 - (y1 * (x2 - x1) / (y2 - y1))
            else:
                gamma_flip = x1
        else:
            gamma_flip = search_spots[np.abs(net_gammas).argmin()]

        return {
            "gex_profile": gex_data, # Datos para el gráfico
            "spot": spot,
            "gamma_flip": float(gamma_flip),
            "call_wall": cw,
            "put_wall": pw,
            "iv_atm": float(df_opts['impliedVolatility'].mean())
        }

    # Mantengo el analyze_ticker intacto por ahora
    def analyze_ticker(self, ticker, sector, rf_rate, lookback, max_dte):
        try:
            calls, puts, spot = self.provider.get_aggregated_options(ticker, max_dte)
            if calls is None: return None
            
            # Ajuste: usamos self.provider.get_history
            hist = self.provider.get_history(ticker, period=f"{max(lookback, 60) + 20}d")
            if len(hist) < 50: return None
            
            sma20 = float(hist["Close"].tail(20).mean())
            sma50 = float(hist["Close"].tail(50).mean())
            dist_sma20 = ((spot - sma20) / sma20) * 100
            dist_sma50 = ((spot - sma50) / sma50) * 100

            log_ret = np.log(hist["Close"] / hist["Close"].shift(1)).dropna()
            rv = float(log_ret.tail(lookback).std() * np.sqrt(252))

            cw = float(calls.groupby('strike')['openInterest'].sum().idxmax())
            pw = float(puts.groupby('strike')['openInterest'].sum().idxmax())

            calls_atm = calls[(calls["strike"] > spot * 0.9) & (calls["strike"] < spot * 1.1)]
            iv = float(calls_atm["impliedVolatility"].mean()) if not calls_atm.empty else float(calls["impliedVolatility"].mean())

            liq = np.nan
            if not calls_atm.empty:
                denom = calls_atm["lastPrice"].replace(0, np.nan)
                spread = (calls_atm["ask"] - calls_atm["bid"]) / denom
                liq = float(spread.mean()) * 100
            
            call_oi_sum = calls.groupby('strike')['openInterest'].sum()
            g_pow = BlackScholes.get_gamma(spot, cw, 30/365.0, rf_rate, iv) * call_oi_sum.max() * spot * 100

            return {
                "Ticker": ticker, "Sector": sector, "Price": spot,
                "Dist SMA20 %": dist_sma20, "Dist SMA50 %": dist_sma50,
                "RV": rv * 100, "IV": iv * 100, "VRP": (iv - rv) * 100,
                "Liquidity": liq, "Call Wall": cw, "Put Wall": pw,
                "Dist Call Wall %": (cw - spot)/spot*100,
                "Dist Put Wall %": (pw - spot)/spot*100,
                "Gamma Power": g_pow, 
                "Near Wall": (abs((cw - spot)/spot) < 0.02) or (abs((pw - spot)/spot) < 0.02),
                "SMA20_val": sma20, "SMA50_val": sma50
            }
        except Exception as e:
            return None

    def run_scan(self, tickers_df, rf_rate, lookback, max_dte):
        # He quitado progress_callback por ahora
        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = []
            for _, row in tickers_df.iterrows():
                futures.append(executor.submit(
                    self.analyze_ticker,
                    row["Symbol"],
                    row["GICS Sector"],
                    rf_rate,
                    lookback,
                    max_dte
                ))
            
            for future in concurrent.futures.as_completed(futures):
                res = future.result()
                if res:
                    results.append(res)
                    
        return pd.DataFrame(results)