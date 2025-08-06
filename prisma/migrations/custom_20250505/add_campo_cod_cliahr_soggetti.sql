-- Aggiunta campo cod_cliahr alla tabella soggetti di ogni azienda

-- Funzione per aggiungere il campo a tutte le tabelle dei soggetti
CREATE OR REPLACE FUNCTION add_cod_cliahr_to_soggetti_tables() RETURNS void AS $$
DECLARE
    table_record RECORD;
    table_name TEXT;
BEGIN
    -- Itera su tutte le tabelle che terminano con _soggetti
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%_soggetti'
        AND table_schema = 'public'
    LOOP
        table_name := table_record.table_name;
        
        -- Verifica se il campo cod_cliahr esiste già
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = table_record.table_name 
            AND column_name = 'cod_cliahr'
        ) THEN
            -- Aggiungi il campo cod_cliahr alla tabella corrente
            EXECUTE format('ALTER TABLE %I ADD COLUMN cod_cliahr character(15)', table_name);
            RAISE NOTICE 'Aggiunto campo cod_cliahr alla tabella %', table_name;
        ELSE
            RAISE NOTICE 'Il campo cod_cliahr esiste già nella tabella %', table_name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Esegui la funzione
SELECT add_cod_cliahr_to_soggetti_tables();

-- Elimina la funzione temporanea
DROP FUNCTION add_cod_cliahr_to_soggetti_tables();