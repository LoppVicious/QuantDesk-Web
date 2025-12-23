import yfinance as yf
import pandas as pd
import requests
from abc import ABC, abstractmethod
from typing import List, Dict

class MarketDataProvider(ABC):
    @abstractmethod
    def get_history(self, ticker: str, period: str = "1y") -> pd.DataFrame: pass
    @abstractmethod
    def get_options_chain(self, ticker: str, expiration: str): pass
    @abstractmethod
    def get_spot_price(self, ticker: str) -> float: pass
    @abstractmethod
    def get_aggregated_options(self, ticker: str) -> pd.DataFrame: pass
    @abstractmethod
    def get_sp500_tickers() -> List[Dict]: pass

class YFinanceProvider(MarketDataProvider):
    
    def get_history(self, ticker: str, period: str = "1y") -> pd.DataFrame:
        try:
            tk = yf.Ticker(ticker)
            # auto_adjust=True ayuda a evitar huecos raros en los datos
            df = tk.history(period=period, auto_adjust=True)
            return df
        except:
            return pd.DataFrame()

    def get_spot_price(self, ticker: str) -> float:
        try:
            tk = yf.Ticker(ticker)
            # Priorizamos fast_info que es más rápido en versiones nuevas de yfinance
            try:
                price = tk.fast_info['last_price']
                return float(price)
            except:
                pass
            
            # Fallback al historial
            hist = tk.history(period="1d")
            if not hist.empty:
                return float(hist['Close'].iloc[-1])
            return 0.0
        except:
            return 0.0

    def get_options_chain(self, ticker: str, expiration: str = None):
        try:
            tk = yf.Ticker(ticker)
            if not expiration:
                exps = tk.options
                if not exps: return None
                expiration = exps[0]
            return tk.option_chain(expiration)
        except:
            return None

    def get_aggregated_options(self, ticker: str) -> pd.DataFrame:
        # Vital para Single Asset View
        try:
            tk = yf.Ticker(ticker)
            exps = tk.options
            if not exps: return pd.DataFrame()
            
            all_opts = []
            # Descargamos primeras 4 fechas
            for d in exps[:4]:
                try:
                    c = tk.option_chain(d)
                    calls = c.calls.assign(type='call', expirationDate=d)
                    puts = c.puts.assign(type='put', expirationDate=d)
                    all_opts.extend([calls, puts])
                except: continue
            
            if not all_opts: return pd.DataFrame()
            df = pd.concat(all_opts, ignore_index=True)
            
            # Convertir a numérico para evitar errores en React
            cols = ['strike', 'lastPrice', 'openInterest', 'impliedVolatility']
            for c in cols:
                if c in df.columns:
                    df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0)
            return df
        except:
            return pd.DataFrame()

    @staticmethod
    def get_sp500_tickers() -> List[Dict]:
        try:
            # Lista robusta desde GitHub
            url = "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv"
            df = pd.read_csv(url)
            df = df.rename(columns={"Symbol": "Ticker", "GICS Sector": "Sector"})
            df['Ticker'] = df['Ticker'].str.replace('.', '-', regex=False)
            if "Sector" not in df.columns: df["Sector"] = "Unknown"
            return df[['Ticker', 'Sector']].to_dict('records')
        except:
            # Fallback mínimo para que no crashee
            return [{"Ticker": "SPY", "Sector": "ETF"}, {"Ticker": "AAPL", "Sector": "Tech"}]