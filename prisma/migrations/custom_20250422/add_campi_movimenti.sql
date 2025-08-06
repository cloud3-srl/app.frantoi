-- Aggiunge nuovi campi alle tabelle movimenti di tutte le aziende
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Ciclo su tutte le tabelle con suffisso _movimenti
    FOR r IN (
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_name LIKE '%_movimenti'
        AND table_schema = 'public'
    ) LOOP
        -- Verifica se il primo nuovo campo esiste già
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = r.table_name 
            AND column_name = 'descrizione_movimento'
        ) THEN
            -- Aggiungi i nuovi campi
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "descrizione_movimento" VARCHAR(30)', r.table_name);
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "id_soggetto" INTEGER', r.table_name);
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "flag_sono_conferimento" BOOLEAN DEFAULT FALSE', r.table_name);
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "flag_molito" BOOLEAN DEFAULT FALSE', r.table_name);
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "id_molitura" INTEGER', r.table_name);
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "flag_sono_molitura" BOOLEAN DEFAULT FALSE', r.table_name);
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "costo_molitura_kg" NUMERIC(10,2)', r.table_name);
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "flag_fatturato" BOOLEAN DEFAULT FALSE', r.table_name);
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "id_fattura" INTEGER', r.table_name);
            
            -- Crea indici per migliorare le performance
            EXECUTE format('CREATE INDEX "idx_%s_id_soggetto" ON "%s"(id_soggetto)', 
                          replace(r.table_name, '_movimenti', ''), r.table_name);
            EXECUTE format('CREATE INDEX "idx_%s_id_molitura" ON "%s"(id_molitura)', 
                          replace(r.table_name, '_movimenti', ''), r.table_name);
            EXECUTE format('CREATE INDEX "idx_%s_id_fattura" ON "%s"(id_fattura)', 
                          replace(r.table_name, '_movimenti', ''), r.table_name);
            EXECUTE format('CREATE INDEX "idx_%s_flag_sono_conferimento" ON "%s"(flag_sono_conferimento)', 
                          replace(r.table_name, '_movimenti', ''), r.table_name);
            EXECUTE format('CREATE INDEX "idx_%s_flag_sono_molitura" ON "%s"(flag_sono_molitura)', 
                          replace(r.table_name, '_movimenti', ''), r.table_name);
            
            RAISE NOTICE 'Campi aggiunti alla tabella %', r.table_name;
        ELSE
            RAISE NOTICE 'Campi già esistenti nella tabella %', r.table_name;
        END IF;
    END LOOP;
END $$;