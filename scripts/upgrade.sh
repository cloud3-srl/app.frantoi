#!/bin/bash
# upgrade.sh
set -e

echo "Avvio procedura di aggiornamento..."

# 1. Backup del database
echo "Backup del database..."
BACKUP_DIR="/opt/appfrantoi/backups"
mkdir -p $BACKUP_DIR
docker compose exec db pg_dump -U postgres -d appfrantoi > $BACKUP_DIR/appfrantoi_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull del nuovo codice (se da Git)
# git pull origin main

# 3. Ricostruzione dell'immagine con il nuovo codice
echo "Ricostruzione dell'immagine Docker..."
docker compose build app

# 4. Fermare solo l'app, lasciando il DB attivo
docker compose stop app

# 5. Eseguire le migrazioni
echo "Applicazione delle migrazioni al database..."
docker compose run --rm app npx prisma migrate deploy

# 6. Eseguire script di aggiornamento specifico per questa versione (se esiste)
if [ -f scripts/update-to-vX.Y.js ]; then
  echo "Esecuzione script di aggiornamento specifico..."
  docker compose run --rm app node scripts/update-to-vX.Y.js
fi

# 7. Riavviare l'applicazione
echo "Riavvio dell'applicazione..."
docker compose up -d app

echo "Aggiornamento completato con successo!"