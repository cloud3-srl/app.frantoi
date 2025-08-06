-- Script per eliminare le tabelle xxxxx_calendario e reimpostare la versione dello schema a 5
-- Autore: Claude
-- Data: 2025-04-20

DO $$
DECLARE
    azienda RECORD;
    table_name TEXT;
BEGIN
    -- Ottieni tutti i codici azienda
    FOR azienda IN 
        SELECT codice 
        FROM aziende
    LOOP
        -- Costruisci il nome della tabella calendario
        table_name := lower(azienda.codice) || '_calendario';
        
        -- Verifica se la tabella calendario esiste
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) THEN
            -- Elimina la tabella calendario per questa azienda
            EXECUTE format('DROP TABLE IF EXISTS "%s" CASCADE;', table_name);
            RAISE NOTICE 'Eliminata tabella calendario per azienda %', azienda.codice;
        ELSE
            RAISE NOTICE 'La tabella calendario per azienda % non esiste', azienda.codice;
        END IF;
    END LOOP;

    -- Aggiorna la versione dello schema a 5
    UPDATE config SET valore = '5', data_modifica = CURRENT_TIMESTAMP WHERE chiave = 'SCHEMA_VERSION';
    RAISE NOTICE 'Versione dello schema reimpostata a 5';

    -- Verifica se l'update è andato a buon fine
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Impossibile aggiornare la versione dello schema. La chiave SCHEMA_VERSION non esiste nella tabella config.';
    END IF;
END $$;