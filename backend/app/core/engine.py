# Archivo: backend/app/core/engine.py
import numpy as np
from scipy.stats import norm

class BlackScholes:
    @staticmethod
    def get_gamma(S, K, T, r, sigma):
        """
        Calcula Gamma de forma vectorizada (acepta arrays numpy).
        """
        try:
            # Vectorización segura: np.maximum evita división por cero en T
            T = np.maximum(T, 1e-4)
            
            # Evitamos errores con inputs inválidos
            with np.errstate(divide='ignore', invalid='ignore'):
                d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
                gamma = norm.pdf(d1) / (S * sigma * np.sqrt(T))
            
            # Limpiamos resultados NaN o infinitos que puedan surgir
            return np.nan_to_num(gamma, nan=0.0, posinf=0.0, neginf=0.0)
        except Exception:
            return 0.0