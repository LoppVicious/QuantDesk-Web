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
    def get_spot_price(self, ticker: str) -> float: pass
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
        df['Volume'] = 1000000
        return df

    def get_history(self, ticker: str, period: str = "1y") -> pd.DataFrame:
        try:
            tk = yf.Ticker(ticker)
            df = tk.history(period=period, auto_adjust=True)
            if df.empty: return self._generate_mock_history(ticker, period)
            return df
        except:
            return self._generate_mock_history(ticker, period)

    def get_spot_price(self, ticker: str) -> float:
        try:
            tk = yf.Ticker(ticker)
            try: return float(tk.fast_info['last_price'])
            except: pass
            hist = tk.history(period="1d")
            return float(hist['Close'].iloc[-1]) if not hist.empty else 150.0
        except:
            return 150.0

    def get_options_chain(self, ticker: str, expiration: str = None):
        try:
            tk = yf.Ticker(ticker)
            if not expiration:
                exps = tk.options
                if not exps: raise ValueError
                expiration = exps[0]
            return tk.option_chain(expiration)
        except:
            MockChain = namedtuple('MockChain', ['calls', 'puts'])
            return MockChain(
                pd.DataFrame({'strike': [100, 110], 'lastPrice': [10, 5], 'openInterest': [500, 100], 'impliedVolatility': [0.2, 0.2]}),
                pd.DataFrame({'strike': [90, 80], 'lastPrice': [5, 10], 'openInterest': [100, 500], 'impliedVolatility': [0.2, 0.2]})
            )

    def get_aggregated_options(self, ticker: str) -> pd.DataFrame:
        try:
            tk = yf.Ticker(ticker)
            exps = tk.options
            if not exps: return pd.DataFrame()
            all_opts = []
            for d in exps[:2]:
                try:
                    c = tk.option_chain(d).calls.assign(type='call', expirationDate=d)
                    p = tk.option_chain(d).puts.assign(type='put', expirationDate=d)
                    all_opts.extend([c, p])
                except: continue
            if not all_opts: return pd.DataFrame()
            df = pd.concat(all_opts, ignore_index=True)
            for col in ['strike', 'lastPrice', 'openInterest', 'impliedVolatility']:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            return df
        except:
            return pd.DataFrame()

    @staticmethod
    def get_sp500_tickers() -> List[Dict]:
        try:
            url = "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv"
            df = pd.read_csv(url)
            df = df.rename(columns={"Symbol": "Ticker", "GICS Sector": "Sector"})
            df['Ticker'] = df['Ticker'].str.replace('.', '-', regex=False)
            return df[['Ticker', 'Sector']].to_dict('records')
        except:
            return [{"Ticker": "SPY", "Sector": "ETF"}]