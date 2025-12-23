import yfinance as yf
import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from typing import List, Dict
from collections import namedtuple

class MarketDataProvider(ABC):
    @abstractmethod
    def get_history(self, ticker: str, period: str = "1y") -> pd.DataFrame: pass
    @abstractmethod
    def get_spot_price(self, ticker: str) -> Dict: pass
    @abstractmethod
    def get_aggregated_options(self, ticker: str) -> pd.DataFrame: pass
    @abstractmethod
    def get_options_chain(self, ticker: str, expiration: str = None): pass
    @abstractmethod
    def get_sp500_tickers() -> List[Dict]: pass

class YFinanceProvider(MarketDataProvider):
    
    def _generate_mock_history(self, ticker: str, period: str) -> pd.DataFrame:
        periods = 100
        dates = pd.date_range(end=pd.Timestamp.now(), periods=periods)
        data = np.random.randn(periods).cumsum() + 150
        df = pd.DataFrame(data, index=dates, columns=['Close'])
        df['Open'] = df['Close'] * 0.99
        df['High'] = df['Close'] * 1.02
        df['Low'] = df['Close'] * 0.98
        df['Volume'] = np.random.randint(1000, 1000000, size=periods)
        return df

    def get_history(self, ticker: str, period: str = "1y") -> pd.DataFrame:
        try:
            tk = yf.Ticker(ticker)
            df = tk.history(period=period, auto_adjust=True)
            if df.empty: raise ValueError("Empty data")
            return df
        except:
            return self._generate_mock_history(ticker, period)

    def get_spot_price(self, ticker: str) -> Dict:
        try:
            tk = yf.Ticker(ticker)
            price = tk.fast_info.get('last_price')
            if price: return {"price": float(price), "is_mock": False}
            hist = tk.history(period="1d")
            if not hist.empty: return {"price": float(hist['Close'].iloc[-1]), "is_mock": False}
            raise ValueError("No price")
        except:
            return {"price": 150.25, "is_mock": True, "warning": "Datos simulados"}

    def get_options_chain(self, ticker: str, expiration: str = None):
        try:
            tk = yf.Ticker(ticker)
            if not expiration:
                exps = tk.options
                if not exps: raise ValueError("No options found")
                expiration = exps[0]
            return tk.option_chain(expiration)
        except:
            # Mock Chain para evitar crash
            MockChain = namedtuple('MockChain', ['calls', 'puts'])
            calls = pd.DataFrame({
                'strike': [100, 110, 120], 'lastPrice': [10, 5, 2],
                'openInterest': [1000, 500, 100], 'impliedVolatility': [0.2, 0.25, 0.3]
            })
            puts = pd.DataFrame({
                'strike': [80, 90, 100], 'lastPrice': [2, 5, 10],
                'openInterest': [100, 500, 1000], 'impliedVolatility': [0.3, 0.25, 0.2]
            })
            return MockChain(calls, puts)

    def get_aggregated_options(self, ticker: str) -> pd.DataFrame:
        try:
            tk = yf.Ticker(ticker)
            exps = tk.options
            if not exps: raise ValueError("No options")
            all_opts = []
            for d in exps[:2]:
                try:
                    c = tk.option_chain(d)
                    calls = c.calls.assign(type='call', expirationDate=d)
                    puts = c.puts.assign(type='put', expirationDate=d)
                    all_opts.extend([calls, puts])
                except: continue
            if not all_opts: raise ValueError("Empty")
            df = pd.concat(all_opts, ignore_index=True)
            for c in ['strike', 'lastPrice', 'openInterest', 'impliedVolatility']:
                if c in df.columns: df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0)
            return df
        except:
            return pd.DataFrame()

    @staticmethod
    def get_sp500_tickers() -> List[Dict]:
        try:
            # VOLVEMOS A LA LISTA REAL DE 500 EMPRESAS
            url = "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv"
            df = pd.read_csv(url)
            df = df.rename(columns={"Symbol": "Ticker", "GICS Sector": "Sector"})
            df['Ticker'] = df['Ticker'].str.replace('.', '-', regex=False)
            return df[['Ticker', 'Sector']].to_dict('records')
        except:
            return [{"Ticker": "SPY", "Sector": "ETF"}, {"Ticker": "AAPL", "Sector": "Tech"}]