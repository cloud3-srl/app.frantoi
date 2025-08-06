import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '../../utils/logger';

/**
 * Servizio per la creazione delle tabelle specifiche per azienda
 */
export class CompanyTablesCreator {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Crea tutte le tabelle specifiche per una nuova azienda
   * @param companyCode - Codice azienda di 5 caratteri
   */
  async createTables(companyCode: string): Promise<void> {
    try {
      this.logger.info(`Creazione tabelle per azienda: ${companyCode}`);
      console.log(`TRACE: Iniziando creazione tabelle per azienda: ${companyCode}`); // Debug aggiuntivo

      // Validazione del codice azienda
      if (!this.isValidCompanyCode(companyCode)) {
        throw new Error('Codice azienda non valido. Deve essere di 5 caratteri alfanumerici.');
      }

      // Definizione delle tabelle da creare
      const tables = this.getTableDefinitions(companyCode);
      console.log(`TRACE: Definite ${tables.length} tabelle da creare in ordine ottimizzato per rispettare le dipendenze`); // Debug aggiuntivo

      // Creazione delle tabelle con esecuzione diretta senza transazione
      // Utilizziamo la connessione diretta per eseguire le query SQL
      for (const table of tables) {
        console.log(`TRACE: Creazione tabella ${companyCode.toLowerCase()}_${table.name}...`); // Debug aggiuntivo
        try {
          await this.prisma.$executeRawUnsafe(table.query);
          console.log(`TRACE: Tabella ${companyCode.toLowerCase()}_${table.name} creata con successo`); // Debug aggiuntivo
        } catch (err: any) {
          const errorMessage = err.message || 'Errore sconosciuto';
          console.error(`ERRORE nella creazione della tabella ${companyCode.toLowerCase()}_${table.name}:`, errorMessage);
          
          // Log dettagliato per facilitare il debug
          if (errorMessage.includes('already exists')) {
            console.error(`La tabella ${companyCode.toLowerCase()}_${table.name} esiste già.`);
          } else if (errorMessage.includes('does not exist')) {
            console.error(`Riferimento a una tabella inesistente nella definizione di ${companyCode.toLowerCase()}_${table.name}.`);
            console.error(`Query SQL: ${table.query}`);
          } else if (errorMessage.includes('syntax error')) {
            console.error(`Errore di sintassi SQL nella definizione di ${companyCode.toLowerCase()}_${table.name}.`);
            console.error(`Query SQL: ${table.query}`);
          }
          
          // Verifica se continuare o interrompere in base al tipo di errore
          if (errorMessage.includes('already exists')) {
            console.warn(`Continuo con la creazione delle tabelle successive...`);
            continue; // Se la tabella esiste già, continua con le altre
          } else {
            // Per altri errori, interrompi la creazione
            this.logger.error(`Errore critico nella creazione della tabella ${companyCode.toLowerCase()}_${table.name}:`, err);
            throw new Error(`Errore nella creazione della tabella ${companyCode.toLowerCase()}_${table.name}: ${errorMessage}`);
          }
        }
      }

      // Creazione indici aggiuntivi
      const indices = this.getIndicesDefinitions(companyCode);
      for (const index of indices) {
        try {
          await this.prisma.$executeRawUnsafe(index);
          console.log(`TRACE: Indice creato con successo: ${index}`); // Debug aggiuntivo
        } catch (err: any) {
          const errorMessage = err.message || 'Errore sconosciuto';
          console.error(`ERRORE nella creazione dell'indice:`, index, errorMessage);
          
          // Se l'indice esiste già, continua
          if (errorMessage.includes('already exists')) {
            console.warn(`L'indice esiste già. Continuo con la creazione degli indici successivi...`);
            continue;
          } else {
            // Log l'errore ma continua con gli altri indici (gli indici non sono critici come le tabelle)
            this.logger.error(`Errore nella creazione dell'indice, continuo comunque:`, errorMessage);
            continue;
          }
        }
      }

      // Registrazione nella configurazione
      await this.prisma.config.create({
        data: {
          chiave: `COMPANY_${companyCode}_CREATED`,
          valore: 'TRUE',
          descrizione: `Tabelle create per azienda ${companyCode}`,
          categoria: 'COMPANY_SETUP',
          data_creazione: new Date(),
          data_modifica: new Date()
        }
      });

      console.log(`TRACE: Tutte le tabelle per l'azienda ${companyCode} create con successo`); // Debug aggiuntivo
      this.logger.info(`Tutte le tabelle per l'azienda ${companyCode} create con successo`);
    } catch (error: any) {
      this.logger.error(`Errore nella creazione delle tabelle per l'azienda ${companyCode}:`, error);
      throw new Error(`Errore nella creazione delle tabelle: ${error.message}`);
    }
  }

  /**
   * Verifica se il codice azienda è valido
   */
  private isValidCompanyCode(code: string): boolean {
    return /^[a-z0-9]{5}$/.test(code);
  }

  /**
   * Restituisce le definizioni di tutte le tabelle specifiche per azienda
   * Ordinate in modo da rispettare le dipendenze tra tabelle
   */
  private getTableDefinitions(companyCode: string): { name: string; query: string }[] {
    return [
      {
        name: 'soggetti',
        query: `CREATE TABLE "${companyCode.toLowerCase()}_soggetti" (
          id SERIAL PRIMARY KEY,
          descrizione VARCHAR(40) NOT NULL,
          indirizzo VARCHAR(60),
          cap VARCHAR(8),
          comune INTEGER REFERENCES "comuni"(id),
          provincia INTEGER REFERENCES "province"(id),
          nazione INTEGER REFERENCES "nazioni"(id),
          id_sian INTEGER,
          telefono VARCHAR(20),
          cellulare VARCHAR(20),
          mail VARCHAR(60),
          partiva VARCHAR(12),
          codfisc VARCHAR(16),
          "flagForn" BOOLEAN DEFAULT FALSE,
          "flagdoc" BOOLEAN DEFAULT FALSE,
          olivedef INTEGER REFERENCES "articoli"(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'magazzini',
        query: `CREATE TABLE "${companyCode.toLowerCase()}_magazzini" (
          id SERIAL PRIMARY KEY,
          descrizione VARCHAR(20) NOT NULL,
          cod_sian INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'articoli',
        query: `CREATE TABLE "${companyCode.toLowerCase()}_articoli" (
          id SERIAL PRIMARY KEY,
          tipologia CHAR(2),
          descrizione CHAR(60) NOT NULL,
          categ_olio INTEGER REFERENCES "categorie_olio"(id),
          macroarea INTEGER REFERENCES "macroaree"(id),
          origispeci CHAR(20),
          flag_ps BOOLEAN DEFAULT FALSE,
          flag_ef BOOLEAN DEFAULT FALSE,
          flag_bio BOOLEAN DEFAULT FALSE,
          flag_conv BOOLEAN DEFAULT FALSE,
          cod_iva INTEGER REFERENCES "codici_iva"(id),
          varieta CHAR(40),
          flag_in_uso BOOLEAN DEFAULT TRUE,
          unita_misura CHAR(3),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'linee',
        query: `CREATE TABLE "${companyCode.toLowerCase()}_linee" (
          id SERIAL PRIMARY KEY,
          descrizione VARCHAR(20) NOT NULL,
          id_magazzino INTEGER REFERENCES "${companyCode.toLowerCase()}_magazzini"(id),
          cap_oraria NUMERIC(10,2),
          id_oliva INTEGER REFERENCES "${companyCode.toLowerCase()}_articoli"(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'cisterne',
        query: `CREATE TABLE "${companyCode.toLowerCase()}_cisterne" (
          id VARCHAR(20) PRIMARY KEY,
          descrizione VARCHAR(40) NOT NULL,
          id_magazzino INTEGER REFERENCES "${companyCode.toLowerCase()}_magazzini"(id),
          capacita NUMERIC(10,2),
          giacenza NUMERIC(10,2),
          id_articolo INTEGER REFERENCES "articoli"(id),
          id_codicesoggetto INTEGER REFERENCES "${companyCode.toLowerCase()}_soggetti"(id),
          flagobso BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'terreni',
        query: `CREATE TABLE "${companyCode.toLowerCase()}_terreni" (
          id SERIAL PRIMARY KEY,
          cod_cli INTEGER REFERENCES "${companyCode.toLowerCase()}_soggetti"(id),
          annata VARCHAR(5),
          orig_spec INTEGER,
          cod_catastale VARCHAR(10),
          metriq NUMERIC,
          ettari NUMERIC,
          qtamaxq NUMERIC,
          num_alberi INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'calendario',
        query: `CREATE TABLE "${companyCode.toLowerCase()}_calendario" (
          id SERIAL PRIMARY KEY,
          id_cliente INTEGER REFERENCES "${companyCode.toLowerCase()}_soggetti"(id),
          tipologia_oliva INTEGER REFERENCES "articoli"(id),
          quantita_kg NUMERIC(10,2) NOT NULL,
          data_inizio TIMESTAMP NOT NULL,
          data_fine TIMESTAMP NOT NULL,
          id_linea INTEGER REFERENCES "${companyCode.toLowerCase()}_linee"(id),
          stato VARCHAR(15) CHECK (stato IN ('Provvisorio', 'Confermato', 'Modificato')),
          note TEXT,
          id_user INTEGER REFERENCES users(id),
          cellulare VARCHAR(20),
          mail VARCHAR(60),
          data_mail TIMESTAMP,
          data_whatsapp TIMESTAMP,
          flagcproprio BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'movimenti',
        query: `CREATE TABLE "${companyCode.toLowerCase()}_movimenti" (
          id SERIAL PRIMARY KEY,
          nome_file VARCHAR(50),
          campo01 VARCHAR(16),
          campo02 NUMERIC(10),
          campo03 NUMERIC(10),
          campo04 DATE,
          campo05 VARCHAR(10),
          campo06 DATE,
          campo07 VARCHAR(10),
          campo08 NUMERIC(10),
          campo09 NUMERIC(10),
          campo10 NUMERIC(13),
          campo11 NUMERIC(13),
          campo12 VARCHAR(10),
          campo13 VARCHAR(10),
          campo14 NUMERIC(10),
          campo15 NUMERIC(2),
          campo16 NUMERIC(2),
          campo17 NUMERIC(2),
          campo18 VARCHAR(80),
          campo19 NUMERIC(2),
          campo20 VARCHAR(80),
          campo21 NUMERIC(13),
          campo22 NUMERIC(13),
          campo23 NUMERIC(13),
          campo24 NUMERIC(13),
          campo25 NUMERIC(13),
          campo26 NUMERIC(13),
          campo27 NUMERIC(13),
          campo28 VARCHAR(20),
          campo29 VARCHAR(300),
          campo30 VARCHAR(1),
          campo31 VARCHAR(1),
          campo32 VARCHAR(1),
          campo33 VARCHAR(1),
          campo34 VARCHAR(1),
          campo35 VARCHAR(1),
          campo36 VARCHAR(1),
          campo37 VARCHAR(1),
          campo38 VARCHAR(1),
          campo39 VARCHAR(1),
          campo40 VARCHAR(1),
          campo41 TIMESTAMP,
          campo42 TIMESTAMP,
          campo43 NUMERIC(4),
          campo44 VARCHAR(10),
          campo45 VARCHAR(10),
          campo46 NUMERIC(13),
          campo47 DATE,
          campo48 VARCHAR(10),
          campo49 VARCHAR(1),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'listini',
        query: `CREATE TABLE "${companyCode.toLowerCase()}_listini" (
          id SERIAL PRIMARY KEY,
          descrizione VARCHAR(40) NOT NULL,
          anno VARCHAR(4),
          data_inizio DATE,
          data_fine DATE,
          cod_articolo INTEGER REFERENCES "articoli"(id),
          qta_da NUMERIC(10,2),
          qta_a NUMERIC(10,2),
          prezzo NUMERIC(10,2),
          um VARCHAR(5),
          cod_iva INTEGER REFERENCES "codici_iva"(id),
          note VARCHAR(100),
          "flagAttivo" BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'olive_linee',
        query: `CREATE TABLE "${companyCode.toLowerCase()}_olive_linee" (
          id SERIAL PRIMARY KEY,
          id_oliva INTEGER REFERENCES "articoli"(id),
          id_linea INTEGER REFERENCES "${companyCode.toLowerCase()}_linee"(id),
          priorita INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(id_oliva, id_linea)
        )`
      }
    ];
  }

  /**
   * Restituisce le definizioni degli indici aggiuntivi da creare
   */
  private getIndicesDefinitions(companyCode: string): string[] {
    return [
      `CREATE INDEX idx_${companyCode.toLowerCase()}_soggetti_descrizione ON "${companyCode.toLowerCase()}_soggetti"(descrizione)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_terreni_cod_cli ON "${companyCode.toLowerCase()}_terreni"(cod_cli)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_listini_cod_articolo ON "${companyCode.toLowerCase()}_listini"(cod_articolo)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_movimenti_campo01 ON "${companyCode.toLowerCase()}_movimenti"(campo01)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_cisterne_id_magazzino ON "${companyCode.toLowerCase()}_cisterne"(id_magazzino)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_cisterne_id_articolo ON "${companyCode.toLowerCase()}_cisterne"(id_articolo)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_cisterne_id_codicesoggetto ON "${companyCode.toLowerCase()}_cisterne"(id_codicesoggetto)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_articoli_tipologia ON "${companyCode.toLowerCase()}_articoli"(tipologia)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_articoli_descrizione ON "${companyCode.toLowerCase()}_articoli"(descrizione)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_articoli_categ_olio ON "${companyCode.toLowerCase()}_articoli"(categ_olio)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_linee_id_magazzino ON "${companyCode.toLowerCase()}_linee"(id_magazzino)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_linee_id_oliva ON "${companyCode.toLowerCase()}_linee"(id_oliva)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_calendario_id_cliente ON "${companyCode.toLowerCase()}_calendario"(id_cliente)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_calendario_data_inizio ON "${companyCode.toLowerCase()}_calendario"(data_inizio)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_calendario_data_fine ON "${companyCode.toLowerCase()}_calendario"(data_fine)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_calendario_stato ON "${companyCode.toLowerCase()}_calendario"(stato)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_calendario_id_user ON "${companyCode.toLowerCase()}_calendario"(id_user)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_calendario_id_linea ON "${companyCode.toLowerCase()}_calendario"(id_linea)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_olive_linee_id_oliva ON "${companyCode.toLowerCase()}_olive_linee"(id_oliva)`,
      `CREATE INDEX idx_${companyCode.toLowerCase()}_olive_linee_id_linea ON "${companyCode.toLowerCase()}_olive_linee"(id_linea)`
    ];
  }

  /**
   * Verifica se le tabelle per un'azienda esistono già
   * @returns Un oggetto con informazioni dettagliate su quali tabelle esistono
   */
  async tablesExist(companyCode: string): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw<{ table_name: string }[]>`
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name LIKE ${`${companyCode.toLowerCase()}_%`}`;
      
      const existingTables = result.map(row => row.table_name);
      
      if (existingTables.length > 0) {
        this.logger.info(`Trovate ${existingTables.length} tabelle con prefisso ${companyCode.toLowerCase()}_`);
        this.logger.info(`Tabelle esistenti: ${existingTables.join(', ')}`);
        
        // Verifica se esiste una configurazione per queste tabelle
        const configExists = await this.prisma.config.findFirst({
          where: { chiave: `COMPANY_${companyCode.toUpperCase()}_CREATED` }
        });
        
        if (!configExists) {
          this.logger.warn(`ATTENZIONE: Trovate tabelle con prefisso ${companyCode.toLowerCase()}_ ma senza record di configurazione associato`);
          
          // Opzione: se si vuole permettere di continuare comunque, modificare questa riga
          // in produzione, è più sicuro mantenere l'errore per evitare inconsistenze
          return true;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Errore nella verifica delle tabelle per l'azienda ${companyCode}:`, error);
      return false;
    }
  }
  
  /**
   * Verifica e corregge eventuali inconsistenze nelle tabelle dell'azienda
   * Utile per risolvere situazioni in cui le tabelle esistono ma manca la configurazione
   * @param companyCode Codice dell'azienda
   * @param option Opzione di risoluzione: 'drop' per eliminare tutte le tabelle, 'complete' per completare la creazione
   */
  async fixInconsistentTables(companyCode: string, option: 'drop' | 'complete'): Promise<void> {
    try {
      const result = await this.prisma.$queryRaw<{ table_name: string }[]>`
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name LIKE ${`${companyCode.toLowerCase()}_%`}`;
      
      const existingTables = result.map(row => row.table_name);
      
      // Verifica se esiste una configurazione per queste tabelle
      const configExists = await this.prisma.config.findFirst({
        where: { chiave: `COMPANY_${companyCode.toUpperCase()}_CREATED` }
      });
      
      // Verifica se esiste l'azienda
      const companyExists = await this.prisma.aziende.findFirst({
        where: { codice: companyCode }
      });
      
      if (existingTables.length > 0 && !configExists) {
        this.logger.warn(`CORREZIONE: Trovate ${existingTables.length} tabelle con prefisso ${companyCode.toLowerCase()}_ ma senza record di configurazione`);
        
        if (option === 'drop') {
          // Elimina tutte le tabelle esistenti
          this.logger.warn(`Eliminazione di tutte le tabelle con prefisso ${companyCode.toLowerCase()}_`);
          
          for (const tableName of existingTables) {
            this.logger.info(`Eliminazione tabella: ${tableName}`);
            try {
              await this.prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
              this.logger.info(`Tabella ${tableName} eliminata con successo`);
            } catch (err) {
              this.logger.error(`Errore nell'eliminazione della tabella ${tableName}:`, err);
            }
          }
          
          this.logger.info(`Tutte le tabelle inconsistenti con prefisso ${companyCode.toLowerCase()}_ sono state eliminate`);
        } else if (option === 'complete' && companyExists) {
          // Completa la creazione registrando la configurazione
          this.logger.info(`Completamento della configurazione per le tabelle esistenti con prefisso ${companyCode.toLowerCase()}_`);
          
          await this.prisma.config.create({
            data: {
              chiave: `COMPANY_${companyCode.toUpperCase()}_CREATED`,
              valore: 'TRUE',
              descrizione: `Tabelle create per azienda ${companyCode} (riparazione automatica)`,
              categoria: 'COMPANY_SETUP',
              data_creazione: new Date(),
              data_modifica: new Date()
            }
          });
          
          this.logger.info(`Configurazione completata per le tabelle con prefisso ${companyCode.toLowerCase()}_`);
        } else {
          this.logger.error(`Impossibile completare la configurazione per ${companyCode}: azienda non trovata`);
        }
      } else {
        this.logger.info(`Nessuna inconsistenza trovata per l'azienda ${companyCode}`);
      }
    } catch (error) {
      this.logger.error(`Errore nella riparazione delle tabelle inconsistenti per l'azienda ${companyCode}:`, error);
      throw error;
    }
  }

  /**
   * Elimina tutte le tabelle specifiche per un'azienda
   * ATTENZIONE: Operazione distruttiva, da usare solo in casi specifici
   */
  async dropTables(companyCode: string): Promise<void> {
    try {
      this.logger.warn(`Eliminazione tabelle per azienda: ${companyCode}`);
      
      if (!await this.tablesExist(companyCode)) {
        this.logger.info(`Nessuna tabella da eliminare per l'azienda ${companyCode}`);
        return;
      }

      // Lista delle tabelle da eliminare in ordine inverso rispetto alla creazione
      // per gestire correttamente le dipendenze
      const tables = [
        'listini',
        'movimenti',
        'terreni',
        'calendario',
        'olive_linee',
        'cisterne',
        'linee',
        'articoli',
        'magazzini',
        'soggetti'
      ];

      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        for (const table of tables) {
          this.logger.debug(`Eliminazione tabella ${companyCode.toLowerCase()}_${table}...`);
          await tx.$executeRawUnsafe(`DROP TABLE IF EXISTS "${companyCode.toLowerCase()}_${table}" CASCADE`);
          this.logger.debug(`Tabella ${companyCode.toLowerCase()}_${table} eliminata con successo`);
        }

        // Rimuovere la configurazione
        await tx.config.deleteMany({
          where: {
            chiave: `COMPANY_${companyCode}_CREATED`
          }
        });

        this.logger.warn(`Tutte le tabelle per l'azienda ${companyCode} eliminate con successo`);
      });
    } catch (error: any) {
      this.logger.error(`Errore nell'eliminazione delle tabelle per l'azienda ${companyCode}:`, error);
      throw new Error(`Errore nell'eliminazione delle tabelle: ${error.message}`);
    }
  }
}