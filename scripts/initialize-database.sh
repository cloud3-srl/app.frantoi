#!/bin/bash
set -e

echo "Inizializzazione del database..."

# Nome del container del database e dell'app
DB_CONTAINER=$(docker ps -qf "name=db" | head -n 1)
APP_CONTAINER=$(docker ps -qf "name=app" | head -n 1)

if [ -z "$DB_CONTAINER" ]; then
  echo "Container del database non trovato!"
  exit 1
fi

if [ -z "$APP_CONTAINER" ]; then
  echo "Container dell'applicazione non trovato!"
  exit 1
fi

echo "Container DB: $DB_CONTAINER"
echo "Container APP: $APP_CONTAINER"

# 1. Attesa che il database sia pronto
echo "Attesa per il database..."
docker exec $DB_CONTAINER sh -c 'until pg_isready; do sleep 1; done'

# 2. Applicazione dello schema con Prisma
echo "Creazione delle tabelle con Prisma..."
docker exec $APP_CONTAINER npx prisma db push --accept-data-loss

# 2.1. Modifica manuale della struttura delle tabelle per accogliere testi più lunghi
echo "Modifica della struttura delle tabelle per testi più lunghi..."
docker exec $DB_CONTAINER psql -U postgres -d frantoio -c "
ALTER TABLE categorie_olio ALTER COLUMN descrizione TYPE VARCHAR(200);
ALTER TABLE macroaree ALTER COLUMN descrizione TYPE VARCHAR(200);
ALTER TABLE origini_specifiche ALTER COLUMN descrizione TYPE VARCHAR(200);
"

# 3. Importazione dei dati CSV
echo "Importazione dati iniziali..."

# Crea directory temporanea per i file CSV
docker exec $DB_CONTAINER mkdir -p /tmp/csv_import

# Prepara directory per conversione CSV
mkdir -p /tmp/csv_utf8

echo "Elenco dei file nella directory Documenti:"
ls -la /opt/appfrantoi/Documenti/

# Conversione manuale dei CSV
for file in /opt/appfrantoi/Documenti/*.CSV /opt/appfrantoi/Documenti/*.csv; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "Elaborazione del file $filename"
    
    # Visualizza le prime righe
    head -n 3 "$file"
    
    # Converti da Windows a UTF-8, cambia delimitatore da "," a ";" e converti S/N in true/false
    iconv -f WINDOWS-1252 -t UTF-8 "$file" | 
    sed 's/,/;/g' | 
    sed 's/;S;/;true;/g' | 
    sed 's/;N;/;false;/g' | 
    sed 's/;S$/;true/g' | 
    sed 's/;N$/;false/g' > "/tmp/csv_utf8/$filename"
    
    echo "File convertito: /tmp/csv_utf8/$filename"
    echo "Prime righe del file convertito:"
    head -n 3 "/tmp/csv_utf8/$filename"
    
    # Copia il file nel container
    docker cp "/tmp/csv_utf8/$filename" $DB_CONTAINER:/tmp/csv_import/
  fi
done

# Controlla la struttura delle tabelle prima dell'importazione
echo "Verifica struttura tabelle..."
docker exec $DB_CONTAINER psql -U postgres -d frantoio -c "\d comuni"
docker exec $DB_CONTAINER psql -U postgres -d frantoio -c "\d province"
docker exec $DB_CONTAINER psql -U postgres -d frantoio -c "\d categorie_olio"
docker exec $DB_CONTAINER psql -U postgres -d frantoio -c "\d macroaree"
docker exec $DB_CONTAINER psql -U postgres -d frantoio -c "\d origini_specifiche"

# Verifica i file nel container
echo "Verifica dei file nel container:"
docker exec $DB_CONTAINER ls -la /tmp/csv_import/

# Importazione dei dati forzando il delimitatore ";"
echo "Importazione dati CSV..."

# Prima modifichiamo la lunghezza del campo descrizione nella tabella categorie_olio
echo "Modifica lunghezza campo descrizione in categorie_olio..."
docker exec $DB_CONTAINER psql -U postgres -d frantoio -c "
ALTER TABLE categorie_olio ALTER COLUMN descrizione TYPE character(100);
"

# Poi importiamo i dati
echo "Importazione categorie olio..."
docker exec $DB_CONTAINER psql -U postgres -d frantoio -c "
-- Importazione categorie olio
COPY categorie_olio(id, acronimo, descrizione) 
FROM '/tmp/csv_import/CATEG_OLIO.CSV' 
DELIMITER ';' 
CSV HEADER;
"

echo "Importazione macroaree con conversione booleani..."
docker exec $DB_CONTAINER psql -U postgres -d frantoio -c "
-- Importazione macroaree con conversione booleani
CREATE TEMP TABLE temp_macroaree AS
SELECT 
  id::integer, 
  acronimo::character(3), 
  descrizione::varchar(200), 
  CASE WHEN flag_orig = 'S' THEN true WHEN flag_orig = 'true' THEN true ELSE false END as flag_orig
FROM 
  (COPY (
    SELECT id, acronimo, descrizione, flag_orig
    FROM '/tmp/csv_import/MACROAREA.CSV'
  ) TO STDOUT WITH (FORMAT CSV, DELIMITER ';', HEADER)) as t (id, acronimo, descrizione, flag_orig);

-- Ora inseriamo i dati convertiti
INSERT INTO macroaree
SELECT * FROM temp_macroaree;

-- Verifica
SELECT count(*) FROM macroaree;
"

docker exec $DB_CONTAINER psql -U postgres -d frantoio -c "
-- Importazione province
COPY province(id, descrizione, targa) 
FROM '/tmp/csv_import/PROVINCE.CSV' 
DELIMITER ';' 
CSV HEADER;
"

docker exec $DB_CONTAINER psql -U postgres -d frantoio -c "
-- Importazione comuni
COPY comuni(id, descrizione, cod_istat, cod_cf) 
FROM '/tmp/csv_import/COMUNI.csv' 
DELIMITER ';' 
CSV HEADER;
"

echo "Importazione origini specifiche con conversione booleani..."
docker exec $DB_CONTAINER psql -U postgres -d frantoio -c "
-- Importazione origine specifica
-- Usiamo un approccio diverso con CASE WHEN per convertire al volo
CREATE TEMP TABLE temp_origini AS
SELECT 
  id::integer, 
  acronimo::character(3), 
  descrizione::varchar(200), 
  CASE WHEN flag_dop = 'S' THEN true WHEN flag_dop = 'true' THEN true ELSE false END as flag_dop,
  CASE WHEN flag_raccolta = 'S' THEN true WHEN flag_raccolta = 'true' THEN true ELSE false END as flag_raccolta,
  CASE WHEN flag_molitura = 'S' THEN true WHEN flag_molitura = 'true' THEN true ELSE false END as flag_molitura,
  CASE WHEN flag_annata = 'S' THEN true WHEN flag_annata = 'true' THEN true ELSE false END as flag_annata,
  CASE WHEN flag_colla_da = 'S' THEN true WHEN flag_colla_da = 'true' THEN true ELSE false END as flag_colla_da,
  CASE WHEN flag_colla_a = 'S' THEN true WHEN flag_colla_a = 'true' THEN true ELSE false END as flag_colla_a,
  CASE WHEN flag_capacita = 'S' THEN true WHEN flag_capacita = 'true' THEN true ELSE false END as flag_capacita,
  CASE WHEN flag_certifi = 'S' THEN true WHEN flag_certifi = 'true' THEN true ELSE false END as flag_certifi
FROM 
  (COPY (
    SELECT id, acronimo, descrizione, flag_dop, flag_raccolta, flag_molitura, flag_annata, flag_colla_da, flag_colla_a, flag_capacita, flag_certifi
    FROM '/tmp/csv_import/ORIGISPEC.csv'
  ) TO STDOUT WITH (FORMAT CSV, DELIMITER ';', HEADER)) as t (id, acronimo, descrizione, flag_dop, flag_raccolta, flag_molitura, flag_annata, flag_colla_da, flag_colla_a, flag_capacita, flag_certifi);

-- Ora inseriamo i dati convertiti
INSERT INTO origini_specifiche
SELECT * FROM temp_origini;

-- Verifica
SELECT count(*) FROM origini_specifiche;
"

# 4. Creazione utente amministratore
echo "Creazione utente amministratore..."
docker exec $APP_CONTAINER node scripts/create-admin-user.js

echo "Inizializzazione database completata!"