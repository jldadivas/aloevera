# Aloe Vera ML Service

FastAPI-based microservice for:
- YOLOv8 disease detection
- Plant age estimation

## Setup

```bash
cd ml_service
pip install -r requirements.txt
```

## Run

```bash
python main.py
```

Server will start at `http://localhost:8000`

## Endpoints

- `POST /scan` - Full scan (disease + age)
- `POST /detect-disease` - Disease detection only
- `POST /estimate-age` - Age estimation only
- `GET /health` - Health check
- `GET /info` - Service info
