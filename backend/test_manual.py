# Archivo: backend/test_manual.py
import sys
import os

# Truco para que Python encuentre la carpeta 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.data_provider import YFinanceProvider
from app.services.quant_engine import QuantService

def test():
    print("--- Iniciando Prueba ---")
    
    # 1. Inicializar proveedor
    print("1. Conectando con Yahoo Finance...")
    provider = YFinanceProvider()
    
    # 2. Inicializar servicio
    service = QuantService(provider)
    
    # 3. Probar descarga simple
    ticker = "SPY"
    print(f"2. Descargando datos para {ticker}...")
    
    # Probamos el cálculo de GEX
    print(f"3. Calculando GEX Profile para {ticker}...")
    data = service.compute_gex_profile(ticker, max_dte=30)
    
    if data:
        print(f"   ✅ ÉXITO!")
        print(f"   Precio Spot: ${data['spot']:.2f}")
        print(f"   Call Wall: ${data['call_wall']:.0f}")
        print(f"   Put Wall: ${data['put_wall']:.0f}")
        print(f"   Gamma Flip: ${data['gamma_flip']:.2f}")
        print(f"   Datos para gráfico: {len(data['gex_profile'])} niveles de strike encontrados.")
    else:
        print("   ❌ Error: No se recibieron datos.")

if __name__ == "__main__":
    test()