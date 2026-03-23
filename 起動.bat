@echo off
chcp 65001 > nul
title Phantom City Atlas

echo.
echo  ██████╗ ██╗  ██╗ █████╗ ███╗  ██╗████████╗ ██████╗ ███╗   ███╗
echo  ██╔══██╗██║  ██║██╔══██╗████╗ ██║╚══██╔══╝██╔═══██╗████╗ ████║
echo  ██████╔╝███████║███████║██╔██╗██║   ██║   ██║   ██║██╔████╔██║
echo  ██╔═══╝ ██╔══██║██╔══██║██║╚████║   ██║   ██║   ██║██║╚██╔╝██║
echo  ██║     ██║  ██║██║  ██║██║ ╚███║   ██║   ╚██████╔╝██║ ╚═╝ ██║
echo  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚══╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝
echo.
echo  🏙  架空都市ジェネレータ  起動中...
echo.

:: プロジェクトフォルダに移動
cd /d "%~dp0"

:: node_modules がなければインストール
if not exist "node_modules\" (
    echo  📦 初回セットアップ中（少し時間がかかります）...
    call npm install
    echo.
)

:: ポート5173が使用中か確認し、空きポートを探す
set PORT=5173
netstat -ano | findstr ":5173 " > nul 2>&1
if %errorlevel% == 0 (
    set PORT=5174
    netstat -ano | findstr ":5174 " > nul 2>&1
    if %errorlevel% == 0 set PORT=5175
)

echo  🚀 http://localhost:%PORT% で起動します
echo  ❌ このウィンドウを閉じると停止します
echo.

:: 3秒待ってからブラウザを開く（サーバーが立ち上がる時間を確保）
start "" cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:%PORT%"

:: Vite 起動
npx vite --port %PORT%

pause
