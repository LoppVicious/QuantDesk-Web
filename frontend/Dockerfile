# frontend/Dockerfile

# ETAPA 1: Construcción (Build)
FROM node:18-alpine as build

WORKDIR /app

# Copiamos dependencias e instalamos
COPY package.json package-lock.json ./
RUN npm install

# Copiamos el código fuente y construimos la versión final
COPY . .
RUN npm run build

# ETAPA 2: Servidor Web Ligero (Nginx) para servir la app
FROM nginx:alpine

# Copiamos los archivos construidos desde la etapa anterior a la carpeta de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración básica de Nginx para React (Manejo de rutas SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]