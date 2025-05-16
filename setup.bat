@echo off

echo ======================================
echo  Ambilight Player - Instalacao
echo ======================================
echo.

:: Cria a estrutura de diretorios
echo Criando estrutura de diretorios...
mkdir app 2>nul
mkdir static\css 2>nul
mkdir static\js 2>nul
mkdir static\img 2>nul
mkdir templates 2>nul
mkdir uploads 2>nul
mkdir instance 2>nul

:: Verifica se o arquivo CSS existe
if not exist static\css\tailwind.src.css (
    echo Criando arquivo tailwind.src.css...
    echo @tailwind base; > static\css\tailwind.src.css
    echo @tailwind components; >> static\css\tailwind.src.css
    echo @tailwind utilities; >> static\css\tailwind.src.css
    
    echo. >> static\css\tailwind.src.css
    echo /* Estilos personalizados */ >> static\css\tailwind.src.css
    echo @layer components { >> static\css\tailwind.src.css
    echo   .btn { >> static\css\tailwind.src.css
    echo     @apply px-4 py-2 rounded font-semibold text-white shadow-md transition-all duration-300; >> static\css\tailwind.src.css
    echo   } >> static\css\tailwind.src.css
    echo. >> static\css\tailwind.src.css
    echo   .btn-primary { >> static\css\tailwind.src.css
    echo     @apply bg-primary hover:bg-primary-dark; >> static\css\tailwind.src.css
    echo   } >> static\css\tailwind.src.css
    echo. >> static\css\tailwind.src.css
    echo   .btn-secondary { >> static\css\tailwind.src.css
    echo     @apply bg-secondary hover:bg-amber-600; >> static\css\tailwind.src.css
    echo   } >> static\css\tailwind.src.css
    echo } >> static\css\tailwind.src.css
)

:: Limpa o banco de dados se estiver corrompido
echo Verificando banco de dados...
if exist instance\config.sqlite (
    echo Removendo banco de dados antigo...
    del /Q instance\config.sqlite
)

:: Compila o Tailwind CSS
echo Compilando CSS...
npx postcss static\css\tailwind.src.css -o static\css\tailwind.css

echo.
echo Instalacao concluida com sucesso!
echo.
echo Para iniciar o aplicativo, execute: python run.py
echo.

pause