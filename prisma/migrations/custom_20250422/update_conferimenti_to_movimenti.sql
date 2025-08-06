-- Questo file è di riferimento per l'aggiornamento del controller CompanyTablesController
-- che ora compila automaticamente la tabella movimenti quando viene inserito un conferimento

/*
Quando viene salvato un conferimento nella tabella xxxx_conferimenti,
i seguenti campi vengono compilati nella tabella xxxx_movimenti:

- campo01: 'IT02497740999'
- campo02: cod_sian del magazzino
- campo03: progressivo (ottenuto da xxxx_progressivo_operazioni)
- campo04: data_arrivo (data di entrata olive)
- campo05: num_documento
- campo06: data_documento
- campo07: 'T1'
- campo08: id_sian del cliente
- campo09: id_sian del committente (se presente, altrimenti del cliente)
- campo10: kg_olive_conferite
- campo11: 0
- campo17: macroarea delle olive
- campo18: origini specifiche delle olive (con spazi al posto delle virgole)
- campo30: 'X'
- campo35: 'X' se l'oliva è biologica, altrimenti vuoto
- campo49: 'I'
- descrizione_movimento: 'Carico di olive'
- flag_sono_conferimento: true
- costo_molitura_kg: prezzo_molitura_kg

Il progressivo viene gestito tramite la tabella xxxx_progressivo_operazioni:
- Se non esiste un record per la data e cod_sian, viene creato con progressivo = 1
- Se esiste, viene utilizzato il progressivo esistente

La tabella xxxx_progressivo_operazioni ha la seguente struttura:
- cod_sian: INTEGER
- data: TIMESTAMP
- progressivo: INTEGER
- PRIMARY KEY (cod_sian, data)
*/