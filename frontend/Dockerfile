# frontend/Dockerfile
# CAMBIO: Subimos de node:18 a node:22-alpine para compatibilidad con Vite moderno
FROM node:22-alpine

WORKDIR /app

# Copiamos solo los manifiestos primero
COPY package.json package-lock.json ./

# Instalación limpia
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]