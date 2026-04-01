@echo off
chcp 65001 >nul
echo ==========================================
echo RuleWeaver GitHub Pages 部署脚本
echo ==========================================
echo.

REM 检查是否安装了 git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Git，请先安装 Git
    echo 下载地址: https://git-scm.com/download/win
    pause
    exit /b 1
)

REM 进入 dist 目录
cd /d "%~dp0dist"

REM 初始化 git 仓库（如果不存在）
if not exist .git (
    echo [1/5] 初始化 Git 仓库...
    git init
    git config user.email "deploy@ruleweaver.app"
    git config user.name "Deploy"
)

REM 添加所有文件
echo [2/5] 添加文件...
git add .

REM 提交
echo [3/5] 提交更改...
git commit -m "Deploy to GitHub Pages" --allow-empty

REM 设置远程仓库
echo [4/5] 配置远程仓库...
echo.
echo 请确保你已经在 GitHub 创建了仓库: https://github.com/new
echo 仓库名建议: ruleweaver
echo.
set /p github_username=请输入你的 GitHub 用户名: 
git remote remove origin 2>nul
git remote add origin https://github.com/%github_username%/ruleweaver.git

REM 推送到 GitHub
echo [5/5] 推送到 GitHub...
git branch -M gh-pages
git push -u origin gh-pages --force

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo 部署成功！
    echo ==========================================
    echo.
    echo 请访问 GitHub 仓库设置 Pages:
    echo https://github.com/%github_username%/ruleweaver/settings/pages
    echo.
    echo 设置步骤:
    echo 1. Source 选择 "Deploy from a branch"
    echo 2. Branch 选择 "gh-pages" /root
    echo 3. 点击 Save
    echo.
    echo 等待几分钟后访问:
    echo https://%github_username%.github.io/ruleweaver
    echo.
) else (
    echo.
    echo [错误] 推送失败，请检查:
    echo 1. 是否已创建 GitHub 仓库
    echo 2. 用户名是否正确
    echo 3. 网络连接是否正常
    echo.
    echo 如果提示需要登录，请运行:
    echo git config --global user.name "你的名字"
    echo git config --global user.email "你的邮箱"
    echo.
)

pause
