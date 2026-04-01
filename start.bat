@echo off
echo ==========================================
echo RuleWeaver - 规则怪谈创作辅助工具
echo ==========================================
echo.

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

echo [1/3] 正在安装依赖...
call npm install
if errorlevel 1 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)

echo.
echo [2/3] 依赖安装完成
echo.
echo [3/3] 启动开发服务器...
echo.
echo 应用将在浏览器中打开，地址：http://localhost:5173
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm run dev

pause
