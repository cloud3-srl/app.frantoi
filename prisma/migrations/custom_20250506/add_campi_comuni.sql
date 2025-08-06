-- Aggiunta campi id_provincia, descri_prov, targa, cap alla tabella comuni

-- Verifica se i campi esistono già
DO $$
BEGIN
    -- Aggiunta campo id_provincia
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'comuni' 
        AND column_name = 'id_provincia'
    ) THEN
        ALTER TABLE comuni ADD COLUMN id_provincia INTEGER;
        RAISE NOTICE 'Aggiunto campo id_provincia alla tabella comuni';
    ELSE
        RAISE NOTICE 'Il campo id_provincia esiste già nella tabella comuni';
    END IF;

    -- Aggiunta campo descri_prov
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'comuni' 
        AND column_name = 'descri_prov'
    ) THEN
        ALTER TABLE comuni ADD COLUMN descri_prov CHARACTER(30);
        RAISE NOTICE 'Aggiunto campo descri_prov alla tabella comuni';
    ELSE
        RAISE NOTICE 'Il campo descri_prov esiste già nella tabella comuni';
    END IF;

    -- Aggiunta campo targa
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'comuni' 
        AND column_name = 'targa'
    ) THEN
        ALTER TABLE comuni ADD COLUMN targa CHARACTER(2);
        RAISE NOTICE 'Aggiunto campo targa alla tabella comuni';
    ELSE
        RAISE NOTICE 'Il campo targa esiste già nella tabella comuni';
    END IF;

    -- Aggiunta campo cap
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'comuni' 
        AND column_name = 'cap'
    ) THEN
        ALTER TABLE comuni ADD COLUMN cap CHARACTER(8);
        RAISE NOTICE 'Aggiunto campo cap alla tabella comuni';
    ELSE
        RAISE NOTICE 'Il campo cap esiste già nella tabella comuni';
    END IF;

    -- Crea indice su id_provincia per migliorare le prestazioni delle query
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_comuni_id_provincia'
    ) THEN
        CREATE INDEX idx_comuni_id_provincia ON comuni(id_provincia);
        RAISE NOTICE 'Creato indice idx_comuni_id_provincia';
    ELSE
        RAISE NOTICE 'Indice idx_comuni_id_provincia esiste già';
    END IF;
END $$;