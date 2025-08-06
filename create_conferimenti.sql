-- Script per creare la tabella conferimenti per l'azienda con codice 'frant'
CREATE TABLE IF NOT EXISTS "frant_conferimenti" (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES "frant_soggetti"(id),
  committente_id INTEGER REFERENCES "frant_soggetti"(id),
  data_arrivo DATE NOT NULL,
  data_raccolta DATE,
  ora_raccolta TIME,
  num_documento VARCHAR(20),
  data_documento DATE,
  flag_privato_senza_doc BOOLEAN DEFAULT FALSE,
  olive_id INTEGER REFERENCES "articoli"(id),
  olio_id INTEGER REFERENCES "articoli"(id),
  macroarea INTEGER REFERENCES "macroaree"(id),
  origispeci VARCHAR(50),
  flag_bio BOOLEAN DEFAULT FALSE,
  flag_dop BOOLEAN DEFAULT FALSE,
  flag_igp BOOLEAN DEFAULT FALSE,
  kg_olive_conferite NUMERIC(10,2) NOT NULL,
  prezzo_molitura_kg NUMERIC(10,2),
  prezzo_molitura NUMERIC(10,2),
  kg_olio_ottenuto NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crea indice sulla colonna cliente_id
CREATE INDEX IF NOT EXISTS idx_frant_conferimenti_cliente_id ON "frant_conferimenti"(cliente_id);

-- Crea indice sulla colonna data_arrivo
CREATE INDEX IF NOT EXISTS idx_frant_conferimenti_data_arrivo ON "frant_conferimenti"(data_arrivo);

-- Messaggio di conferma
SELECT 'Tabella frant_conferimenti creata con successo' AS message;