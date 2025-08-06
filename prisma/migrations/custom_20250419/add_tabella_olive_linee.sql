-- Crea la tabella di relazione tra olive e linee per ogni azienda
DO $$
DECLARE
    company_record RECORD;
    company_code VARCHAR;
    table_exists BOOLEAN;
BEGIN
    -- Cicla su tutte le aziende
    FOR company_record IN SELECT codice FROM aziende LOOP
        company_code := company_record.codice;
        
        -- Verifica se la tabella esiste già
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = company_code || '_olive_linee'
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            -- Crea la tabella olive_linee per questa azienda
            EXECUTE format('
                CREATE TABLE %I_olive_linee (
                    id SERIAL PRIMARY KEY,
                    id_oliva INTEGER REFERENCES articoli(id),
                    id_linea INTEGER REFERENCES %I_linee(id),
                    priorita INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(id_oliva, id_linea)
                )', company_code, company_code);
                
            -- Crea indici per migliorare le performance
            EXECUTE format('
                CREATE INDEX idx_%I_olive_linee_id_oliva ON %I_olive_linee(id_oliva);
                CREATE INDEX idx_%I_olive_linee_id_linea ON %I_olive_linee(id_linea)
            ', company_code, company_code, company_code, company_code);
            
            -- Popola la tabella con dati esistenti (se ci sono relazioni in linee.id_oliva)
            EXECUTE format('
                INSERT INTO %I_olive_linee (id_oliva, id_linea, priorita)
                SELECT id_oliva, id, 1 FROM %I_linee 
                WHERE id_oliva IS NOT NULL AND id_oliva > 0
                ON CONFLICT DO NOTHING
            ', company_code, company_code);
            
            RAISE NOTICE 'Creata tabella %_olive_linee per azienda %', company_code, company_code;
        ELSE
            RAISE NOTICE 'La tabella %_olive_linee esiste già per azienda %', company_code, company_code;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migrazione completata con successo';
END $$;