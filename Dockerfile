FROM node:16
WORKDIR /app/nodeAPI
RUN apt-get update && apt-get install -y curl
COPY ./nodeAPI/package*.json ./
RUN npm install
COPY ./nodeAPI ./
EXPOSE 8080
CMD ["npm", "start"]

FROM python:3.9-slim
WORKDIR /app/backend
ENV PYTHONPATH=/backend:$PYTHONPATH
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend ./
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python:3.9-slim
WORKDIR /app/gateway
COPY gateway/requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8889
CMD ["uvicorn", "gateway.main:app", "--host", "0.0.0.0", "--port", "8889"]