# Archivo: backend/app/services/interface.py
from abc import ABC, abstractmethod
import pandas as pd

class MarketDataProvider(ABC):
    @abstractmethod
    def get_risk_free_rate(self) -> float: pass
    
    @abstractmethod
    def get_sp500_tickers(self) -> pd.DataFrame: pass
    
    @abstractmethod
    def get_aggregated_options(self, ticker: str, max_dte: int): 
        """Retorna (calls_df, puts_df, spot_price)"""
        pass
        
    @abstractmethod
    def get_history(self, ticker: str, period: str = "6mo") -> pd.DataFrame: pass