@echo off
echo Starting Recipe AI App...
echo.

REM Check if Docker is running
docker --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running.
    echo Please install Docker Desktop and start it.
    pause
    exit /b 1
)

echo Checking if Ollama container is running...
docker ps | findstr "recipe-ollama" > nul
if %errorlevel% neq 0 (
    echo Starting Ollama container...
    docker-compose up -d
    if %errorlevel% neq 0 (
        echo ERROR: Failed to start Docker containers.
        echo Please check Docker is running and try again.
        pause
        exit /b 1
    )
    echo Waiting for Ollama to be ready...
    timeout /t 10 /nobreak > nul
) else (
    echo Ollama container is already running.
)

echo.
echo Checking available Ollama models...
docker exec recipe-ollama ollama list 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Could not check Ollama models. Container might still be starting.
)

echo.
echo Checking Python installation...
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.9+ and add it to your PATH.
    pause
    exit /b 1
)

echo Starting FastAPI backend...
cd backend

REM Activate virtual environment if it exists
if exist ..\venv\Scripts\activate.bat (
    echo Activating virtual environment...
    call ..\venv\Scripts\activate.bat
)

REM Check if dependencies are installed
python -c "import fastapi" > nul 2>&1
if %errorlevel% neq 0 (
    echo Installing dependencies...
    pip install --upgrade pip
    pip install -r requirements.txt --timeout 60
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies.
        echo Try running: pip install -r requirements.txt
        echo Or check your internet connection.
        pause
        exit /b 1
    )
)

echo.
echo Starting the application...
python main.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to start the application.
    echo Check the error messages above.
    pause
)
