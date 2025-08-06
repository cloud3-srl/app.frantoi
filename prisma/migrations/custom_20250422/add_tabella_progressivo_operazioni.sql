-- Crea tabelle progressivo_operazioni per tutte le aziende
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Ciclo su tutte le aziende
    FOR r IN (
        SELECT codice
        FROM aziende
    ) LOOP
        -- Nome tabella in lowercase
        DECLARE
            table_name TEXT := lower(r.codice) || '_progressivo_operazioni';
        BEGIN
            -- Verifica se la tabella esiste già
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_name = table_name
                AND table_schema = 'public'
            ) THEN
                -- Crea la tabella progressivo_operazioni con le chiavi richieste
                EXECUTE format('
                    CREATE TABLE "%s" (
                        cod_sian INTEGER NOT NULL,
                        data TIMESTAMP NOT NULL,
                        progressivo INTEGER NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (cod_sian, data)
                    )
                ', table_name);
                
                -- Crea indici per migliorare le performance
                EXECUTE format('
                    CREATE INDEX "idx_%s_progressivo_operazioni_cod_sian" 
                    ON "%s"(cod_sian)
                ', lower(r.codice), table_name);
                
                EXECUTE format('
                    CREATE INDEX "idx_%s_progressivo_operazioni_data" 
                    ON "%s"(data)
                ', lower(r.codice), table_name);
                
                RAISE NOTICE 'Creata tabella %', table_name;
            ELSE
                RAISE NOTICE 'Tabella % esiste già', table_name;
            END IF;
        END;
    END LOOP;
END $$;