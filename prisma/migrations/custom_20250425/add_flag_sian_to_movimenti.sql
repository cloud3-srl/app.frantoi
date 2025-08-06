-- Aggiunge il campo flag_sian_generato alle tabelle movimenti di tutte le aziende
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
        -- Verifica se il campo flag_sian_generato esiste già
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = r.table_name 
            AND column_name = 'flag_sian_generato'
        ) THEN
            -- Aggiungi il campo flag_sian_generato con valore predefinito FALSE
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "flag_sian_generato" BOOLEAN DEFAULT FALSE', r.table_name);
            
            -- Crea un indice per migliorare le performance
            EXECUTE format('CREATE INDEX "idx_%s_flag_sian_generato" ON "%s"(flag_sian_generato)', 
                          replace(r.table_name, '_movimenti', ''), r.table_name);
            
            RAISE NOTICE 'Campo flag_sian_generato aggiunto alla tabella %', r.table_name;
        ELSE
            RAISE NOTICE 'Campo flag_sian_generato già esistente nella tabella %', r.table_name;
        END IF;
    END LOOP;
END $$;