@echo off
echo Starting AI Harvest frontend application...

:: Navigate to the frontend-react directory
cd frontend-react

:: Install dependencies if needed
echo Installing dependencies...
call npm install

:: Start the development server
echo Starting development server...
call npm start

pause 