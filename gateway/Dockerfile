FROM python:3.9-slim
WORKDIR /gateway
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
COPY .env.docker /gateway/.env
EXPOSE 8889
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8889"]
