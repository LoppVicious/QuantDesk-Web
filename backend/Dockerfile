# backend/Dockerfile

# 1. Usamos una imagen ligera de Python 3.11
FROM python:3.11-slim

# 2. Evitamos que Python genere archivos .pyc y buffer de salida
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Directorio de trabajo dentro del contenedor
WORKDIR /app

# 4. Instalamos dependencias del sistema necesarias para compilar (gcc)
RUN apt-get update && apt-get install -y gcc

# 5. Copiamos y instalamos las librerías
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# 6. Copiamos el código de la app
COPY ./app ./app

# 7. Exponemos el puerto 8000
EXPOSE 8000

# 8. Comando de arranque
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]