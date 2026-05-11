@echo off
echo ===================================================
echo    BOOTING HOSPITRAX BY AARUGHA - MASTER SERVER
echo ===================================================

echo [1/2] Booting Python FastAPI Backend...
start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload"

echo [2/2] Booting React Vite Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting up in separate windows!
echo Hospital is going live at: http://localhost:5173/login
pause