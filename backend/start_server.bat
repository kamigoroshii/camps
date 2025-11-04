@echo off
cd /d F:\camps\backend
F:\camps\backend\venv312\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
