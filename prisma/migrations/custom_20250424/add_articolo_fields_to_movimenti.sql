-- Aggiunge campi id_articolo_inizio e id_articolo_fine alle tabelle movimenti
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
            AND column_name = 'id_articolo_inizio'
        ) THEN
            -- Aggiungi il campo id_articolo_inizio
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "id_articolo_inizio" INTEGER', r.table_name);
            
            -- Crea l'indice per performance
            EXECUTE format('CREATE INDEX "idx_%s_id_articolo_inizio" ON "%s"(id_articolo_inizio)', 
                         replace(r.table_name, '_movimenti', ''), r.table_name);
            
            RAISE NOTICE 'Campo id_articolo_inizio aggiunto alla tabella %', r.table_name;
        ELSE
            RAISE NOTICE 'Campo id_articolo_inizio già esistente nella tabella %', r.table_name;
        END IF;
        
        -- Verifica se il secondo nuovo campo esiste già
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = r.table_name 
            AND column_name = 'id_articolo_fine'
        ) THEN
            -- Aggiungi il campo id_articolo_fine
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "id_articolo_fine" INTEGER', r.table_name);
            
            -- Crea l'indice per performance
            EXECUTE format('CREATE INDEX "idx_%s_id_articolo_fine" ON "%s"(id_articolo_fine)', 
                         replace(r.table_name, '_movimenti', ''), r.table_name);
            
            RAISE NOTICE 'Campo id_articolo_fine aggiunto alla tabella %', r.table_name;
        ELSE
            RAISE NOTICE 'Campo id_articolo_fine già esistente nella tabella %', r.table_name;
        END IF;
    END LOOP;
END $$;