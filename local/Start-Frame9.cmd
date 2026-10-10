@echo off
cd /d "%~dp0"
set "NODE=%~dp0runtime\win\node.exe"
if not exist "%NODE%" set "NODE=node"
"%NODE%" "%~dp0serve.mjs"
pause
