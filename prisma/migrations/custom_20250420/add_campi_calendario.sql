-- Script per aggiungere nuovi campi alla tabella calendario di tutte le aziende esistenti
-- Autore: Claude
-- Data: 2025-04-20

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
            -- Verifica se i campi già esistono
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = (lower(azienda.codice) || '_calendario')
                AND column_name = 'cellulare'
            ) THEN
                -- Aggiungi campo cellulare
                query_text := format('
                    ALTER TABLE "%1$s_calendario" 
                    ADD COLUMN cellulare VARCHAR(20);
                ', lower(azienda.codice));
                
                EXECUTE query_text;
                RAISE NOTICE 'Aggiunto campo cellulare alla tabella calendario per azienda %', azienda.codice;
            END IF;
            
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = (lower(azienda.codice) || '_calendario')
                AND column_name = 'data_whatsapp'
            ) THEN
                -- Aggiungi campo data_whatsapp
                query_text := format('
                    ALTER TABLE "%1$s_calendario" 
                    ADD COLUMN data_whatsapp TIMESTAMP;
                ', lower(azienda.codice));
                
                EXECUTE query_text;
                RAISE NOTICE 'Aggiunto campo data_whatsapp alla tabella calendario per azienda %', azienda.codice;
            END IF;
            
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = (lower(azienda.codice) || '_calendario')
                AND column_name = 'mail'
            ) THEN
                -- Aggiungi campo mail
                query_text := format('
                    ALTER TABLE "%1$s_calendario" 
                    ADD COLUMN mail VARCHAR(60);
                ', lower(azienda.codice));
                
                EXECUTE query_text;
                RAISE NOTICE 'Aggiunto campo mail alla tabella calendario per azienda %', azienda.codice;
            END IF;
            
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = (lower(azienda.codice) || '_calendario')
                AND column_name = 'data_mail'
            ) THEN
                -- Aggiungi campo data_mail
                query_text := format('
                    ALTER TABLE "%1$s_calendario" 
                    ADD COLUMN data_mail TIMESTAMP;
                ', lower(azienda.codice));
                
                EXECUTE query_text;
                RAISE NOTICE 'Aggiunto campo data_mail alla tabella calendario per azienda %', azienda.codice;
            END IF;
        ELSE
            RAISE NOTICE 'La tabella calendario per azienda % non esiste', azienda.codice;
        END IF;
    END LOOP;
END $$;