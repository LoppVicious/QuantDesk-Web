/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0e1117", // Fondo oscuro (estilo Streamlit)
        panel: "#1e293b",      // Color de las tarjetas
        primary: "#00D4AA",    // Tu verde característico
        danger: "#FF4B4B",     // Tu rojo característico
        text: "#e5e7eb",       // Texto claro
        muted: "#9ca3af"       // Texto grisáceo
      }
    },
  },
  plugins: [],
}