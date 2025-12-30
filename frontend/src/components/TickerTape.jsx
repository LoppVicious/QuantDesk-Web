import React, { useEffect, useRef } from 'react';

const TickerTape = () => {
  const container = useRef();

  useEffect(() => {
    if (container.current) {
        container.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "CAPITALCOM:US500", "title": "S&P 500" },
        { "proName": "CAPITALCOM:US100", "title": "Nasdaq 100" },
        { "proName": "CMCMARKETS:EURUSD", "title": "EUR/USD" },
        { "proName": "BINANCE:BTCUSDT", "title": "Bitcoin" },
        { "proName": "BINANCE:ETHUSDT", "title": "Ethereum" },
        { "description": "VIX", "proName": "CBOE:VIX" },
        { "description": "Gold", "proName": "OANDA:XAUUSD" }
      ],
      "showSymbolLogo": true,
      "colorTheme": "dark",
      "isTransparent": true, // Fondo transparente para fusionarse
      "displayMode": "adaptive", // Se adapta al tamaño
      "locale": "en"
    });
    
    container.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
};

export default TickerTape;