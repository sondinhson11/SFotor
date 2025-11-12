@echo off
echo Building project...
call npm run build

echo.
echo Deploying to GitHub Pages...
cd dist
git init
git add .
git commit -m "Deploy to GitHub Pages"

echo.
echo Pushing to gh-pages branch...
git branch -M gh-pages
git remote add origin https://github.com/sondinhson11/SFotor.git 2>nul
git remote set-url origin https://github.com/sondinhson11/SFotor.git
git push -f origin gh-pages

echo.
echo Deployment complete!
echo Website will be available at: https://sondinhson11.github.io/SFotor/
pause

