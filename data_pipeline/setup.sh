#!/bin/bash
mkdir -p dags logs plugins ../data_lake/raw_trades ../data_lake/processed_trades
chmod -R 777 logs plugins ../data_lake
docker-compose up -d