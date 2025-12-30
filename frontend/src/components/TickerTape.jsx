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
        { "proName": "FOREXCOM:SPXUSD", "title": "S&P 500" },
        { "proName": "FOREXCOM:NSXUSD", "title": "Nasdaq 100" },
        { "proName": "FX_IDC:EURUSD", "title": "EUR/USD" },
        { "proName": "BITSTAMP:BTCUSD", "title": "Bitcoin" },
        { "proName": "BITSTAMP:ETHUSD", "title": "Ethereum" },
        { "description": "VIX", "proName": "CBOE:VIX" },
        { "description": "Apple", "proName": "NASDAQ:AAPL" },
        { "description": "Nvidia", "proName": "NASDAQ:NVDA" },
        { "description": "Tesla", "proName": "NASDAQ:TSLA" },
        { "description": "Gold", "proName": "TVC:GOLD" }
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