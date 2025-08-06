-- Script per aggiungere la tabella calendario a tutte le aziende esistenti
-- Autore: Claude
-- Data: 2025-04-19

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
        -- Verifica se la tabella calendario esiste già
        IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = (lower(azienda.codice) || '_calendario')
        ) THEN
            -- Crea la tabella calendario per questa azienda
            query_text := format('
                CREATE TABLE "%1$s_calendario" (
                    id SERIAL PRIMARY KEY,
                    id_cliente INTEGER REFERENCES "%1$s_soggetti"(id),
                    tipologia_oliva INTEGER REFERENCES "articoli"(id),
                    quantita_kg NUMERIC(10,2) NOT NULL,
                    data_inizio TIMESTAMP NOT NULL,
                    data_fine TIMESTAMP NOT NULL,
                    id_linea INTEGER REFERENCES "%1$s_linee"(id),
                    stato VARCHAR(15) CHECK (stato IN (''Provvisorio'', ''Confermato'', ''Modificato'')),
                    note TEXT,
                    id_user INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                -- Crea indici per migliorare le performance
                CREATE INDEX idx_%1$s_calendario_id_cliente ON "%1$s_calendario"(id_cliente);
                CREATE INDEX idx_%1$s_calendario_data_inizio ON "%1$s_calendario"(data_inizio);
                CREATE INDEX idx_%1$s_calendario_data_fine ON "%1$s_calendario"(data_fine);
                CREATE INDEX idx_%1$s_calendario_stato ON "%1$s_calendario"(stato);
                CREATE INDEX idx_%1$s_calendario_id_user ON "%1$s_calendario"(id_user);
                CREATE INDEX idx_%1$s_calendario_id_linea ON "%1$s_calendario"(id_linea);
            ', lower(azienda.codice));
            
            EXECUTE query_text;
            RAISE NOTICE 'Creata tabella calendario per azienda %', azienda.codice;
        ELSE
            RAISE NOTICE 'La tabella calendario per azienda % esiste già', azienda.codice;
        END IF;
    END LOOP;
END $$;