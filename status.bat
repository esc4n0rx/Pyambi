@echo off
setlocal EnableDelayedExpansion

echo =========================================
echo  AMBILIGHT PLAYER - DIAGNOSTICO
echo =========================================
echo.

echo [1/5] Verificando estrutura de diretorios...
set ERROR=0

:: Verificando diretórios necessários
set DIRS=app static\css static\js static\img templates uploads instance
for %%d in (%DIRS%) do (
    if not exist %%d (
        echo [ERRO] Diretorio %%d nao encontrado!
        set ERROR=1
    ) else (
        echo [OK] Diretorio %%d encontrado.
    )
)

echo.
echo [2/5] Verificando arquivos principais...
set FILES=app\__init__.py app\routes.py app\ambilight.py app\models.py app\utils.py app\websocket.py static\css\tailwind.src.css templates\index.html templates\settings.html templates\about.html run.py
for %%f in (%FILES%) do (
    if not exist %%f (
        echo [ERRO] Arquivo %%f nao encontrado!
        set ERROR=1
    ) else (
        echo [OK] Arquivo %%f encontrado.
    )
)

echo.
echo [3/5] Verificando banco de dados...
if exist instance\config.sqlite (
    echo [OK] Banco de dados encontrado.
) else (
    echo [INFO] Banco de dados nao encontrado (sera criado automaticamente).
)

echo.
echo [4/5] Verificando CSS compilado...
if exist static\css\tailwind.css (
    echo [OK] CSS compilado encontrado.
) else (
    echo [ERRO] CSS compilado nao encontrado!
    echo       Tente executar: npm run build:css
    set ERROR=1
)

echo.
echo [5/5] Verificando modulos Python...
python -c "import flask, flask_socketio, cv2, numpy" 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Algumas dependencias Python nao estao instaladas!
    echo       Tente executar: pip install -r requirements.txt
    set ERROR=1
) else (
    echo [OK] Modulos Python basicos encontrados.
)

echo.
echo =========================================
if %ERROR% equ 0 (
    echo [SUCESSO] Todos os requisitos verificados!
    echo.
    echo Voce pode iniciar o aplicativo com:
    echo python run.py
) else (
    echo [ATENCAO] Foram encontrados problemas!
    echo.
    echo Para resolver os problemas:
    echo 1. Execute setup.bat para criar os arquivos necessarios
    echo 2. Execute npm install para instalar as dependencias do npm
    echo 3. Execute npm run build:css para compilar o CSS
    echo 4. Execute pip install -r requirements.txt para instalar as dependencias Python
    echo 5. Execute novamente este diagnostico para verificar
)
echo =========================================

pause