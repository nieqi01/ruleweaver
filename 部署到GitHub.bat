@echo off
chcp 65001 >nul
title RuleWeaver GitHub Pages 部署
echo ==========================================
echo    RuleWeaver GitHub Pages 部署工具
echo ==========================================
echo.

REM 进入 dist 目录
cd /d "%~dp0dist"

REM 检查 git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] 未检测到 Git
    echo 请访问 https://git-scm.com/download/win 下载安装
    pause
    exit /b 1
)

echo [✓] Git 已安装
echo.

REM 获取 GitHub 用户名
set /p username=请输入你的 GitHub 用户名: 
if "%username%"=="" (
    echo [X] 用户名不能为空
    pause
    exit /b 1
)

echo.
echo [1/3] 配置远程仓库...
git remote remove origin 2>nul
git remote add origin https://github.com/%username%/ruleweaver.git

echo [2/3] 切换到 gh-pages 分支...
git branch -M gh-pages

echo [3/3] 推送到 GitHub...
echo.
echo 如果提示输入密码，请输入你的 GitHub Token
echo 或先在命令行运行: git config --global credential.helper store
echo.
git push -u origin gh-pages --force

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo        部署成功！🎉
    echo ==========================================
    echo.
    echo 接下来请完成以下步骤:
    echo.
    echo 1. 访问 GitHub 仓库设置 Pages:
    echo    https://github.com/%username%/ruleweaver/settings/pages
    echo.
    echo 2. 在 Pages 设置中:
    echo    - Source 选择 "Deploy from a branch"
    echo    - Branch 选择 "gh-pages" / "/ (root)"
    echo    - 点击 Save
    echo.
    echo 3. 等待 2-3 分钟后访问:
    echo    https://%username%.github.io/ruleweaver
    echo.
    echo ==========================================
) else (
    echo.
    echo [X] 推送失败
    echo.
    echo 可能的原因:
    echo 1. GitHub 仓库未创建
    echo 2. 用户名错误
    echo 3. 未配置 Git 凭据
    echo.
    echo 解决方法:
    echo 1. 访问 https://github.com/new 创建仓库
    echo 2. 运行以下命令配置 Git:
    echo    git config --global user.name "你的名字"
    echo    git config --global user.email "你的邮箱"
    echo.
)

pause
