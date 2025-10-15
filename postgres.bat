@echo off
SETLOCAL

REM Argument prüfen: start oder stop
IF "%1"=="start" (
    echo Prüfe PostgreSQL Status...
    "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" -D "C:\PostgresData" status >nul 2>&1
    IF ERRORLEVEL 1 (
        echo PostgreSQL ist nicht aktiv. Starte PostgreSQL...
        "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" -D "C:\PostgresData" start
    ) ELSE (
        echo PostgreSQL läuft bereits.
    )
) ELSE IF "%1"=="stop" (
    echo Stoppe PostgreSQL...
    "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" -D "C:\PostgresData" stop -m fast
) ELSE (
    echo Ungueltiger Parameter: %1
    echo Bitte 'start' oder 'stop' verwenden.
)

ENDLOCAL
exit
