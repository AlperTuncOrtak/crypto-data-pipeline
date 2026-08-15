FROM python:3.11-slim

WORKDIR /app

COPY data_pipeline/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the ingestion folder for the consumer
COPY data_pipeline/ingestion /app/data_pipeline/ingestion

CMD ["python", "data_pipeline/ingestion/ws_consumer.py"]
