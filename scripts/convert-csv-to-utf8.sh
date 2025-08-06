#!/bin/bash
set -e

echo "Conversione file CSV in UTF-8..."
DOCUMENTS_DIR="/opt/appfrantoi/Documenti"

# Crea una directory temporanea per i file convertiti
TEMP_DIR="/tmp/csv_utf8"
mkdir -p $TEMP_DIR

# Verifica se iconv è installato
if ! command -v iconv &> /dev/null; then
    echo "iconv non trovato. Installazione in corso..."
    apt-get update
    apt-get install -y iconv || apt-get install -y libc-bin
fi

# Converti ogni file CSV in UTF-8
for file in $DOCUMENTS_DIR/*.CSV $DOCUMENTS_DIR/*.csv; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "Conversione $filename in UTF-8..."
        
        # Prova a rilevare la codifica e convertirla in UTF-8
        # Prima prova Windows-1252 (comune per file Windows)
        iconv -f WINDOWS-1252 -t UTF-8 "$file" -o "$TEMP_DIR/$filename" || \
        # Se fallisce, prova ISO-8859-1
        iconv -f ISO-8859-1 -t UTF-8 "$file" -o "$TEMP_DIR/$filename" || \
        # Se fallisce ancora, copia il file com'è
        cp "$file" "$TEMP_DIR/$filename"
        
        echo "File convertito: $TEMP_DIR/$filename"
    fi
done

echo "Conversione completata! I file convertiti sono in $TEMP_DIR"