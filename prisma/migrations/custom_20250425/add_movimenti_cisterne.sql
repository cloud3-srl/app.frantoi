-- Migration: Create movimenti_cisterne table
-- Questo SQL crea una tabella per tracciare la movimentazione delle cisterne

CREATE TABLE IF NOT EXISTS movimenti_cisterne (
    id SERIAL PRIMARY KEY,
    cisterna_id VARCHAR(50) NOT NULL,
    data DATE NOT NULL,
    tipo_movimento VARCHAR(20) NOT NULL CHECK (tipo_movimento IN ('Carico', 'Scarico', 'Travaso')),
    quantita NUMERIC(10, 2) NOT NULL,
    id_articolo INTEGER,
    id_codicesoggetto INTEGER,
    tipo_operazione VARCHAR(50),
    numero_documento VARCHAR(50),
    note TEXT,
    operatore VARCHAR(100),
    data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indici per ottimizzare le query
    CONSTRAINT movimenti_cisterne_tipo_check CHECK (tipo_movimento IN ('Carico', 'Scarico', 'Travaso'))
);

-- Creazione indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_movimenti_cisterne_cisterna_id ON movimenti_cisterne(cisterna_id);
CREATE INDEX IF NOT EXISTS idx_movimenti_cisterne_data ON movimenti_cisterne(data);