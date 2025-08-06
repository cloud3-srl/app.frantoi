#!/bin/sh
set -e

# Se il file di lock non esiste, è il primo avvio 
if [ ! -f /app/.db_initialized ]; then
  echo "Prima inizializzazione dell'applicazione..."
  
  # Attendi che il database sia pronto
  echo "Attesa per il database..."
  until nc -z db 5432; do
    echo "Attesa postgres..."
    sleep 1
  done
  
  echo "Database disponibile, inizializzazione schema..."
  npx prisma db push --accept-data-loss
  
  # Se esiste script di seed, eseguilo
  if [ -f /app/scripts/create-admin-user.js ]; then
    echo "Creazione utente amministratore..."
    node /app/scripts/create-admin-user.js
  fi
  
  # Crea file di lock per non ripetere al riavvio
  touch /app/.db_initialized
  echo "Inizializzazione completata!"
fi

# Avvia l'applicazione
echo "Avvio dell'applicazione..."
exec npm start