# backend/Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalamos dependencias de compilación para librerías científicas y XML
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libxml2-dev \
    libxslt-dev \
    musl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copiamos el código
COPY . .

EXPOSE 8000

# El CMD se sobreescribe en docker-compose, pero este es el default prod
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]