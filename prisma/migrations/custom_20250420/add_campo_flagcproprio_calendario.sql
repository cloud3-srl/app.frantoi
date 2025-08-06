-- Script per aggiungere il campo flagcproprio alla tabella calendario di tutte le aziende esistenti
-- Autore: Claude
-- Data: 2025-04-21

DO $$
DECLARE
    azienda RECORD;
    query_text TEXT;
BEGIN
    -- Ottieni tutti i codici azienda
    FOR azienda IN 
        SELECT codice 
        FROM aziende
    LOOP
        -- Verifica se la tabella calendario esiste
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = (lower(azienda.codice) || '_calendario')
        ) THEN
            -- Verifica se il campo già esiste
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = (lower(azienda.codice) || '_calendario')
                AND column_name = 'flagcproprio'
            ) THEN
                -- Aggiungi campo flagcproprio
                query_text := format('
                    ALTER TABLE "%1$s_calendario" 
                    ADD COLUMN "flagcproprio" BOOLEAN DEFAULT FALSE;
                ', lower(azienda.codice));
                
                EXECUTE query_text;
                RAISE NOTICE 'Aggiunto campo flagcproprio alla tabella calendario per azienda %', azienda.codice;
            END IF;
        ELSE
            RAISE NOTICE 'La tabella calendario per azienda % non esiste', azienda.codice;
        END IF;
    END LOOP;
END $$;