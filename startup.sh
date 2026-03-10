#!/usr/bin/env bash
# Vera ML System Startup Script
# Starts all services in correct order

set -e

echo "🌿 Vera - ML System Startup"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python3 found${NC}"

# Check Node
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"

# Check MongoDB
if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}⚠ MongoDB not found in PATH (may still be running)${NC}"
fi

# Step 1: Start ML Service
echo -e "\n${YELLOW}Starting ML Service...${NC}"
cd ml_service

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null

echo -e "${YELLOW}Installing/updating ML dependencies...${NC}"
pip install -q -r requirements.txt

echo -e "${GREEN}✓ ML Service dependencies ready${NC}"
echo -e "${YELLOW}Starting FastAPI server (port 8000)...${NC}"
python main.py &
ML_PID=$!
sleep 3

# Check if ML service is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ ML Service started (PID: $ML_PID)${NC}"
else
    echo -e "${RED}❌ ML Service failed to start${NC}"
    kill $ML_PID 2>/dev/null || true
    exit 1
fi

# Step 2: Start Backend
cd ../backend
echo -e "\n${YELLOW}Starting Backend Server...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found in backend directory${NC}"
    echo -e "${YELLOW}Please create .env with required variables${NC}"
    kill $ML_PID 2>/dev/null || true
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install -q
fi

echo -e "${GREEN}✓ Backend dependencies ready${NC}"
echo -e "${YELLOW}Starting Node.js server (port 5000)...${NC}"
npm start &
BACKEND_PID=$!
sleep 3

# Check if backend is running
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    kill $ML_PID $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Step 3: Start Frontend
cd ../frontend
echo -e "\n${YELLOW}Starting Frontend...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install -q
fi

echo -e "${GREEN}✓ Frontend dependencies ready${NC}"
echo -e "${YELLOW}Starting Vite dev server (port 5173)...${NC}"
npm run dev &
FRONTEND_PID=$!
sleep 3

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}🚀 All Services Started!${NC}"
echo -e "${GREEN}================================${NC}"

echo -e "\n${YELLOW}Service Endpoints:${NC}"
echo -e "  ML Service:  ${GREEN}http://localhost:8000${NC}"
echo -e "  Backend:     ${GREEN}http://localhost:5000${NC}"
echo -e "  Frontend:    ${GREEN}http://localhost:5173${NC}"

echo -e "\n${YELLOW}Ctrl+C to stop all services${NC}"

# Handle cleanup on exit
trap "
    echo -e '\n${YELLOW}Stopping services...${NC}'
    kill $ML_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo -e '${GREEN}All services stopped${NC}'
    exit 0
" SIGINT SIGTERM

# Wait for all processes
wait
