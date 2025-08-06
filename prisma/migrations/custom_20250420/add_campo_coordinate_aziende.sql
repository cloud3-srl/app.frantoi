-- Aggiunge il campo coordinate alla tabella aziende
DO $$
BEGIN
    -- Verifica se il campo 'coordinate' esiste già
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'aziende' 
        AND column_name = 'coordinate'
    ) THEN
        -- Aggiunge il campo coordinate
        ALTER TABLE "aziende" 
        ADD COLUMN "coordinate" VARCHAR(20);
        
        RAISE NOTICE 'Campo coordinate aggiunto alla tabella aziende';
    ELSE
        RAISE NOTICE 'Campo coordinate già esistente nella tabella aziende';
    END IF;
END $$;