import { PrismaClient } from '@prisma/client';
import { Logger } from '../../utils/logger';

/**
 * Classe responsabile di verificare e aggiornare lo schema delle tabelle aziendali
 * quando necessario. Viene eseguita all'avvio dell'applicazione.
 */
export class SchemaUpdater {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.logger = new Logger('SchemaUpdater');
  }

  /**
   * Verifica e aggiorna lo schema delle tabelle aziendali se necessario
   */
  public async checkAndUpdateSchema(): Promise<void> {
    try {
      this.logger.info('Avvio verifica e aggiornamento dello schema del database...');
      
      // 1. Controllo se esiste la configurazione che indica lo schema aggiornato
      const schemaVersion = await this.getSchemaVersion();
      const currentVersion = 19; // Incrementato a 19 per l'aggiunta del campo colore alla tabella linee
      
      if (schemaVersion >= currentVersion) {
        this.logger.info(`Schema del database già aggiornato alla versione ${schemaVersion}`);
        return;
      }
      
      // 2. Esegui gli aggiornamenti necessari
      this.logger.info(`Aggiornamento schema dalla versione ${schemaVersion} alla versione ${currentVersion}`);
      
      // Aggiorna tutte le tabelle cisterne nelle aziende (per versione 1)
      if (schemaVersion < 1) {
        await this.updateCisterneSchema();
      }
      
      // Aggiorna o crea tabelle articoli per tutte le aziende (per versione 2)
      if (schemaVersion < 2) {
        await this.updateArticoliSchema();
      }
      
      // Aggiorna le tabelle soggetti aggiungendo il campo flagdoc (per versione 3)
      if (schemaVersion < 3) {
        await this.updateSoggettiSchema();
      }
      
      // Crea o aggiorna le tabelle linee per tutte le aziende (per versione 4)
      if (schemaVersion < 4) {
        await this.createLineeSchema();
      }
      
      // Aggiorna la tabella aziende aggiungendo i campi per la configurazione email (per versione 5)
      if (schemaVersion < 5) {
        await this.updateAziendeEmailFields();
      }
      
      // Crea o aggiorna le tabelle calendario per tutte le aziende (per versione 6)
      if (schemaVersion < 6) {
        await this.createCalendarioSchema();
      }
      
      // Crea o aggiorna le tabelle olive_linee per tutte le aziende (per versione 7)
      if (schemaVersion < 7) {
        await this.createOliveLineeSchema();
      }
      
      // Aggiorna le tabelle calendario con nuovi campi (per versione 8)
      if (schemaVersion < 8) {
        await this.updateCalendarioNotificationFields();
      }
      
      // Aggiorna la tabella aziende con il campo coordinate (per versione 9)
      if (schemaVersion < 9) {
        await this.updateAziendeCoordinateField();
      }
      
      // Aggiorna le tabelle calendario con il campo flagcproprio (per versione 10)
      if (schemaVersion < 10) {
        await this.updateCalendarioFlagCProprioField();
      }
      
      // Aggiorna le tabelle magazzini con il campo flag_default (per versione 11)
      if (schemaVersion < 11) {
        await this.updateMagazziniDefaultField();
      }
      
      // Aggiorna le tabelle movimenti con i nuovi campi (per versione 12)
      if (schemaVersion < 12) {
        await this.updateMovimentiFields();
      }
      
      // Crea le tabelle progressivo_operazioni per tutte le aziende (per versione 13)
      if (schemaVersion < 13) {
        await this.createProgressivoOperazioniSchema();
      }
      
      // Aggiorna le tabelle movimenti con i campi id_articolo_inizio e id_articolo_fine (per versione 14)
      if (schemaVersion < 14) {
        await this.updateMovimentiArticoliFields();
      }
      
      // Aggiorna le tabelle movimenti con il campo flag_sian_generato (per versione 15)
      if (schemaVersion < 15) {
        await this.updateMovimentiSianField();
      }
      
      // Aggiorna le tabelle calendario con i campi flag_chiuso e id_conferimento (per versione 16)
      if (schemaVersion < 16) {
        await this.updateCalendarioConferimentoFields();
      }
      
      // Aggiorna le tabelle soggetti con il campo cod_cliahr (per versione 17)
      if (schemaVersion < 17) {
        await this.updateSoggettiCodCliahrField();
      }
      
      // Aggiorna la tabella comuni con campi relativi alla provincia (per versione 18)
      if (schemaVersion < 18) {
        await this.updateComuniProvinciaFields();
      }
      
      // Aggiorna le tabelle linee con il campo colore (per versione 19)
      if (schemaVersion < 19) {
        await this.updateLineeColoreField();
      }
      
      // Aggiorna la versione dello schema nel database
      await this.setSchemaVersion(currentVersion);
      
      this.logger.info(`Schema del database aggiornato con successo alla versione ${currentVersion}`);
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento dello schema del database:', error);
      // Non blocchiamo l'avvio dell'applicazione in caso di errore
      // ma logghiamo l'errore per indagini successive
    }
  }

  /**
   * Ottiene la versione attuale dello schema dal database
   */
  private async getSchemaVersion(): Promise<number> {
    try {
      const config = await this.prisma.config.findUnique({
        where: { chiave: 'SCHEMA_VERSION' }
      });
      
      if (!config) {
        // Se non esiste, creiamola con la versione 0
        await this.prisma.config.create({
          data: {
            chiave: 'SCHEMA_VERSION',
            valore: '0',
            descrizione: 'Versione dello schema del database',
            categoria: 'SYSTEM',
            data_creazione: new Date(),
            data_modifica: new Date()
          }
        });
        return 0;
      }
      
      return parseInt(config.valore, 10);
    } catch (error) {
      this.logger.error('Errore nel recupero della versione dello schema:', error);
      return 0; // Fallback a versione 0 in caso di errore
    }
  }

  /**
   * Imposta la versione dello schema nel database
   */
  private async setSchemaVersion(version: number): Promise<void> {
    await this.prisma.config.update({
      where: { chiave: 'SCHEMA_VERSION' },
      data: {
        valore: version.toString(),
        data_modifica: new Date()
      }
    });
  }

  /**
   * Aggiorna lo schema delle tabelle cisterne per tutte le aziende
   */
  private async updateCisterneSchema(): Promise<void> {
    try {
      this.logger.info('Aggiornamento schema tabelle cisterne...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine aggiornamento tabelle cisterne.');
        return;
      }
      
      // Per ogni azienda, aggiorna la tabella cisterne
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const cisternTableName = `${companyCode}_cisterne`;
        
        this.logger.info(`Aggiornamento tabella ${cisternTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(cisternTableName);
        
        if (!tableExists) {
          this.logger.info(`La tabella ${cisternTableName} non esiste. Saltando...`);
          continue;
        }
        
        // Verifica se i campi esistono già per evitare errori
        const columnsInfo = await this.getTableColumns(cisternTableName);
        
        // Aggiungi i campi mancanti
        try {
          // id_magazzino
          if (!columnsInfo.some(col => col.column_name === 'id_magazzino')) {
            this.logger.info(`Aggiunta colonna id_magazzino a ${cisternTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${cisternTableName}" 
              ADD COLUMN "id_magazzino" INTEGER REFERENCES "${companyCode}_magazzini"(id)
            `);
          }
          
          // capacita
          if (!columnsInfo.some(col => col.column_name === 'capacita')) {
            this.logger.info(`Aggiunta colonna capacita a ${cisternTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${cisternTableName}" 
              ADD COLUMN "capacita" NUMERIC(10,2)
            `);
          }
          
          // giacenza
          if (!columnsInfo.some(col => col.column_name === 'giacenza')) {
            this.logger.info(`Aggiunta colonna giacenza a ${cisternTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${cisternTableName}" 
              ADD COLUMN "giacenza" NUMERIC(10,2)
            `);
          }
          
          // id_articolo
          if (!columnsInfo.some(col => col.column_name === 'id_articolo')) {
            this.logger.info(`Aggiunta colonna id_articolo a ${cisternTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${cisternTableName}" 
              ADD COLUMN "id_articolo" INTEGER REFERENCES "articoli"(id)
            `);
          }
          
          // id_codicesoggetto
          if (!columnsInfo.some(col => col.column_name === 'id_codicesoggetto')) {
            this.logger.info(`Aggiunta colonna id_codicesoggetto a ${cisternTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${cisternTableName}" 
              ADD COLUMN "id_codicesoggetto" INTEGER REFERENCES "${companyCode}_soggetti"(id)
            `);
          }
          
          // Crea gli indici per migliorare le prestazioni
          this.logger.info(`Creazione indici per ${cisternTableName}...`);
          
          // Indice su id_magazzino
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "idx_${companyCode}_cisterne_id_magazzino" 
            ON "${cisternTableName}"(id_magazzino)
          `);
          
          // Indice su id_articolo
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "idx_${companyCode}_cisterne_id_articolo" 
            ON "${cisternTableName}"(id_articolo)
          `);
          
          // Indice su id_codicesoggetto
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "idx_${companyCode}_cisterne_id_codicesoggetto" 
            ON "${cisternTableName}"(id_codicesoggetto)
          `);
          
          this.logger.info(`Aggiornamento della tabella ${cisternTableName} completato con successo.`);
        } catch (error) {
          this.logger.error(`Errore durante l'aggiornamento della tabella ${cisternTableName}:`, error);
        }
      }
      
      this.logger.info('Aggiornamento schema tabelle cisterne completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento delle tabelle cisterne:', error);
      throw error;
    }
  }

  /**
   * Aggiorna lo schema delle tabelle articoli per tutte le aziende
   */
  private async updateArticoliSchema(): Promise<void> {
    try {
      this.logger.info('Aggiornamento schema tabelle articoli...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine aggiornamento tabelle articoli.');
        return;
      }
      
      // Per ogni azienda, verifica e crea la tabella articoli se non esiste
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const articoliTableName = `${companyCode}_articoli`;
        
        this.logger.info(`Verifica tabella ${articoliTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(articoliTableName);
        
        if (tableExists) {
          this.logger.info(`La tabella ${articoliTableName} esiste già. Verificando struttura...`);
          
          // Verifica se i campi esistono già per evitare errori
          const columnsInfo = await this.getTableColumns(articoliTableName);
          
          // Aggiungi i campi mancanti se necessario
          try {
            // tipologia
            if (!columnsInfo.some(col => col.column_name === 'tipologia')) {
              this.logger.info(`Aggiunta colonna tipologia a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "tipologia" CHAR(2)
              `);
            }
            
            // descrizione
            if (!columnsInfo.some(col => col.column_name === 'descrizione')) {
              this.logger.info(`Aggiunta colonna descrizione a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "descrizione" CHAR(60) NOT NULL DEFAULT ''
              `);
            }
            
            // categ_olio
            if (!columnsInfo.some(col => col.column_name === 'categ_olio')) {
              this.logger.info(`Aggiunta colonna categ_olio a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "categ_olio" INTEGER REFERENCES "categorie_olio"(id)
              `);
            }
            
            // macroarea
            if (!columnsInfo.some(col => col.column_name === 'macroarea')) {
              this.logger.info(`Aggiunta colonna macroarea a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "macroarea" INTEGER REFERENCES "macroaree"(id)
              `);
            }
            
            // origispeci
            if (!columnsInfo.some(col => col.column_name === 'origispeci')) {
              this.logger.info(`Aggiunta colonna origispeci a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "origispeci" CHAR(20)
              `);
            }
            
            // flag_ps
            if (!columnsInfo.some(col => col.column_name === 'flag_ps')) {
              this.logger.info(`Aggiunta colonna flag_ps a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "flag_ps" BOOLEAN DEFAULT FALSE
              `);
            }
            
            // flag_ef
            if (!columnsInfo.some(col => col.column_name === 'flag_ef')) {
              this.logger.info(`Aggiunta colonna flag_ef a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "flag_ef" BOOLEAN DEFAULT FALSE
              `);
            }
            
            // flag_bio
            if (!columnsInfo.some(col => col.column_name === 'flag_bio')) {
              this.logger.info(`Aggiunta colonna flag_bio a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "flag_bio" BOOLEAN DEFAULT FALSE
              `);
            }
            
            // flag_conv
            if (!columnsInfo.some(col => col.column_name === 'flag_conv')) {
              this.logger.info(`Aggiunta colonna flag_conv a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "flag_conv" BOOLEAN DEFAULT FALSE
              `);
            }
            
            // cod_iva
            if (!columnsInfo.some(col => col.column_name === 'cod_iva')) {
              this.logger.info(`Aggiunta colonna cod_iva a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "cod_iva" INTEGER REFERENCES "codici_iva"(id)
              `);
            }
            
            // varieta
            if (!columnsInfo.some(col => col.column_name === 'varieta')) {
              this.logger.info(`Aggiunta colonna varieta a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "varieta" CHAR(40)
              `);
            }
            
            // flag_in_uso
            if (!columnsInfo.some(col => col.column_name === 'flag_in_uso')) {
              this.logger.info(`Aggiunta colonna flag_in_uso a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "flag_in_uso" BOOLEAN DEFAULT TRUE
              `);
            }
            
            // unita_misura
            if (!columnsInfo.some(col => col.column_name === 'unita_misura')) {
              this.logger.info(`Aggiunta colonna unita_misura a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "unita_misura" CHAR(3)
              `);
            }
            
            // created_at
            if (!columnsInfo.some(col => col.column_name === 'created_at')) {
              this.logger.info(`Aggiunta colonna created_at a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              `);
            }
            
            // updated_at
            if (!columnsInfo.some(col => col.column_name === 'updated_at')) {
              this.logger.info(`Aggiunta colonna updated_at a ${articoliTableName}...`);
              await this.prisma.$executeRawUnsafe(`
                ALTER TABLE "${articoliTableName}" 
                ADD COLUMN "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              `);
            }
            
            // Crea gli indici per migliorare le prestazioni
            this.logger.info(`Creazione indici per ${articoliTableName}...`);
            
            // Indice su tipologia
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX IF NOT EXISTS "idx_${companyCode}_articoli_tipologia" 
              ON "${articoliTableName}"(tipologia)
            `);
            
            // Indice su descrizione
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX IF NOT EXISTS "idx_${companyCode}_articoli_descrizione" 
              ON "${articoliTableName}"(descrizione)
            `);
            
            // Indice su categ_olio
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX IF NOT EXISTS "idx_${companyCode}_articoli_categ_olio" 
              ON "${articoliTableName}"(categ_olio)
            `);
            
            this.logger.info(`Aggiornamento della tabella ${articoliTableName} completato con successo.`);
          } catch (error) {
            this.logger.error(`Errore durante l'aggiornamento della tabella ${articoliTableName}:`, error);
          }
        } else {
          // La tabella non esiste, creala
          this.logger.info(`La tabella ${articoliTableName} non esiste. Creazione...`);
          
          try {
            // Crea la tabella articoli
            await this.prisma.$executeRawUnsafe(`
              CREATE TABLE "${articoliTableName}" (
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
              )
            `);
            
            // Crea gli indici
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX "idx_${companyCode}_articoli_tipologia" 
              ON "${articoliTableName}"(tipologia)
            `);
            
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX "idx_${companyCode}_articoli_descrizione" 
              ON "${articoliTableName}"(descrizione)
            `);
            
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX "idx_${companyCode}_articoli_categ_olio" 
              ON "${articoliTableName}"(categ_olio)
            `);
            
            this.logger.info(`Tabella ${articoliTableName} creata con successo.`);
          } catch (error) {
            this.logger.error(`Errore durante la creazione della tabella ${articoliTableName}:`, error);
          }
        }
      }
      
      this.logger.info('Aggiornamento schema tabelle articoli completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento delle tabelle articoli:', error);
      throw error;
    }
  }

  /**
   * Aggiorna le tabelle movimenti per tutte le aziende aggiungendo il campo flag_sian_generato
   */
  private async updateMovimentiSianField(): Promise<void> {
    try {
      this.logger.info('Aggiornamento tabelle movimenti con campo flag_sian_generato...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine aggiornamento tabelle movimenti.');
        return;
      }
      
      // Per ogni azienda, aggiorna la tabella movimenti
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const movimentiTableName = `${companyCode}_movimenti`;
        
        this.logger.info(`Aggiornamento tabella ${movimentiTableName} con campo flag_sian_generato...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(movimentiTableName);
        
        if (!tableExists) {
          this.logger.info(`La tabella ${movimentiTableName} non esiste. Saltando...`);
          continue;
        }
        
        // Verifica se il campo flag_sian_generato esiste già
        const columnsInfo = await this.getTableColumns(movimentiTableName);
        
        if (!columnsInfo.some(col => col.column_name === 'flag_sian_generato')) {
          this.logger.info(`Aggiunta colonna flag_sian_generato a ${movimentiTableName}...`);
          try {
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${movimentiTableName}" 
              ADD COLUMN "flag_sian_generato" BOOLEAN DEFAULT FALSE
            `);
            
            // Crea indice per migliorare le performance
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX "idx_${companyCode}_movimenti_flag_sian_generato" 
              ON "${movimentiTableName}"(flag_sian_generato)
            `);
            
            this.logger.info(`Colonna flag_sian_generato aggiunta con successo a ${movimentiTableName}.`);
          } catch (error) {
            this.logger.error(`Errore durante l'aggiunta della colonna flag_sian_generato a ${movimentiTableName}:`, error);
          }
        } else {
          this.logger.info(`Colonna flag_sian_generato già esistente in ${movimentiTableName}.`);
        }
      }
      
      this.logger.info('Aggiornamento tabelle movimenti con campo flag_sian_generato completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento delle tabelle movimenti con campo flag_sian_generato:', error);
      throw error;
    }
  }

  /**
   * Verifica se una tabella esiste
   */
  private async checkTableExists(tableName: string): Promise<boolean> {
    const result = await this.prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = ${tableName}
      ) as exists
    `;
    
    return result[0].exists;
  }

  /**
   * Ottiene le colonne di una tabella
   */
  private async getTableColumns(tableName: string): Promise<{ column_name: string }[]> {
    const columns = await this.prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = ${tableName}
    `;
    
    return columns;
  }

  /**
   * Aggiorna lo schema delle tabelle soggetti per tutte le aziende aggiungendo il campo flagdoc
   */
  private async updateSoggettiSchema(): Promise<void> {
    try {
      this.logger.info('Aggiornamento schema tabelle soggetti per aggiungere flagdoc...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine aggiornamento tabelle soggetti.');
        return;
      }
      
      // Per ogni azienda, aggiorna la tabella soggetti
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const soggettiTableName = `${companyCode}_soggetti`;
        
        this.logger.info(`Aggiornamento tabella ${soggettiTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(soggettiTableName);
        
        if (!tableExists) {
          this.logger.info(`La tabella ${soggettiTableName} non esiste. Saltando...`);
          continue;
        }
        
        // Verifica se il campo flagdoc esiste già
        const columnsInfo = await this.getTableColumns(soggettiTableName);
        
        if (!columnsInfo.some(col => col.column_name === 'flagdoc')) {
          this.logger.info(`Aggiunta colonna flagdoc a ${soggettiTableName}...`);
          try {
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${soggettiTableName}" 
              ADD COLUMN "flagdoc" BOOLEAN DEFAULT FALSE
            `);
            this.logger.info(`Colonna flagdoc aggiunta con successo a ${soggettiTableName}.`);
          } catch (error) {
            this.logger.error(`Errore durante l'aggiunta della colonna flagdoc a ${soggettiTableName}:`, error);
          }
        } else {
          this.logger.info(`Colonna flagdoc già esistente in ${soggettiTableName}.`);
        }
      }
      
      this.logger.info('Aggiornamento schema tabelle soggetti completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento delle tabelle soggetti:', error);
      throw error;
    }
  }
  
  /**
   * Crea o aggiorna le tabelle linee per tutte le aziende
   */
  private async createLineeSchema(): Promise<void> {
    try {
      this.logger.info('Creazione/aggiornamento schema tabelle linee...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine creazione tabelle linee.');
        return;
      }
      
      // Per ogni azienda, crea la tabella linee se non esiste
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const lineeTableName = `${companyCode}_linee`;
        
        this.logger.info(`Verifica tabella ${lineeTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(lineeTableName);
        
        if (tableExists) {
          this.logger.info(`La tabella ${lineeTableName} esiste già.`);
          
          // Verifica se ci sono campi da aggiungere
          const columnsInfo = await this.getTableColumns(lineeTableName);
          
          // Verifica e aggiungi eventuali campi mancanti
          if (!columnsInfo.some(col => col.column_name === 'id_magazzino')) {
            this.logger.info(`Aggiunta colonna id_magazzino a ${lineeTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${lineeTableName}" 
              ADD COLUMN "id_magazzino" INTEGER REFERENCES "${companyCode}_magazzini"(id)
            `);
          }
          
          if (!columnsInfo.some(col => col.column_name === 'cap_oraria')) {
            this.logger.info(`Aggiunta colonna cap_oraria a ${lineeTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${lineeTableName}" 
              ADD COLUMN "cap_oraria" NUMERIC(10,2)
            `);
          }
          
          if (!columnsInfo.some(col => col.column_name === 'id_oliva')) {
            this.logger.info(`Aggiunta colonna id_oliva a ${lineeTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${lineeTableName}" 
              ADD COLUMN "id_oliva" INTEGER REFERENCES "${companyCode}_articoli"(id)
            `);
          }
          
          // Assicurati che ci siano gli indici necessari
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "idx_${companyCode}_linee_id_magazzino" 
            ON "${lineeTableName}"(id_magazzino)
          `);
          
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "idx_${companyCode}_linee_id_oliva" 
            ON "${lineeTableName}"(id_oliva)
          `);
          
        } else {
          // La tabella non esiste, creala
          this.logger.info(`La tabella ${lineeTableName} non esiste. Creazione...`);
          
          await this.prisma.$executeRawUnsafe(`
            CREATE TABLE "${lineeTableName}" (
              id SERIAL PRIMARY KEY,
              descrizione VARCHAR(20) NOT NULL,
              id_magazzino INTEGER REFERENCES "${companyCode}_magazzini"(id),
              cap_oraria NUMERIC(10,2),
              id_oliva INTEGER REFERENCES "${companyCode}_articoli"(id),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Crea gli indici
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX "idx_${companyCode}_linee_id_magazzino" 
            ON "${lineeTableName}"(id_magazzino)
          `);
          
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX "idx_${companyCode}_linee_id_oliva" 
            ON "${lineeTableName}"(id_oliva)
          `);
          
          this.logger.info(`Tabella ${lineeTableName} creata con successo.`);
        }
      }
      
      this.logger.info('Creazione/aggiornamento schema tabelle linee completato.');
    } catch (error) {
      this.logger.error('Errore durante la creazione/aggiornamento delle tabelle linee:', error);
      throw error;
    }
  }
  
  /**
   * Crea o aggiorna le tabelle calendario per tutte le aziende
   */
  private async createCalendarioSchema(): Promise<void> {
    try {
      this.logger.info('Creazione/aggiornamento schema tabelle calendario...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine creazione tabelle calendario.');
        return;
      }
      
      // Per ogni azienda, crea la tabella calendario se non esiste
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const calendarioTableName = `${companyCode}_calendario`;
        
        this.logger.info(`Verifica tabella ${calendarioTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(calendarioTableName);
        
        if (tableExists) {
          this.logger.info(`La tabella ${calendarioTableName} esiste già.`);
        } else {
          // La tabella non esiste, creala
          this.logger.info(`La tabella ${calendarioTableName} non esiste. Creazione...`);
          
          try {
            // Crea la tabella calendario
            await this.prisma.$executeRawUnsafe(`
              CREATE TABLE "${calendarioTableName}" (
                id SERIAL PRIMARY KEY,
                data_ora TIMESTAMP NOT NULL,
                id_linea INTEGER REFERENCES "${companyCode}_linee"(id),
                id_soggetto INTEGER REFERENCES "${companyCode}_soggetti"(id),
                kg_olive NUMERIC(10,2),
                note TEXT,
                flag_confermata BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
            
            // Crea gli indici
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX "idx_${companyCode}_calendario_data_ora" 
              ON "${calendarioTableName}"(data_ora)
            `);
            
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX "idx_${companyCode}_calendario_id_linea" 
              ON "${calendarioTableName}"(id_linea)
            `);
            
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX "idx_${companyCode}_calendario_id_soggetto" 
              ON "${calendarioTableName}"(id_soggetto)
            `);
            
            this.logger.info(`Tabella ${calendarioTableName} creata con successo.`);
          } catch (error) {
            this.logger.error(`Errore durante la creazione della tabella ${calendarioTableName}:`, error);
          }
        }
      }
      
      this.logger.info('Creazione/aggiornamento schema tabelle calendario completato.');
    } catch (error) {
      this.logger.error('Errore durante la creazione/aggiornamento delle tabelle calendario:', error);
      throw error;
    }
  }
  
  /**
   * Crea o aggiorna le tabelle olive_linee per tutte le aziende
   */
  private async createOliveLineeSchema(): Promise<void> {
    try {
      this.logger.info('Creazione/aggiornamento schema tabelle olive_linee...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine creazione tabelle olive_linee.');
        return;
      }
      
      // Per ogni azienda, crea la tabella olive_linee se non esiste
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const oliveLineeTableName = `${companyCode}_olive_linee`;
        
        this.logger.info(`Verifica tabella ${oliveLineeTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(oliveLineeTableName);
        
        if (tableExists) {
          this.logger.info(`La tabella ${oliveLineeTableName} esiste già.`);
        } else {
          // La tabella non esiste, creala
          this.logger.info(`La tabella ${oliveLineeTableName} non esiste. Creazione...`);
          
          try {
            // Crea la tabella olive_linee
            await this.prisma.$executeRawUnsafe(`
              CREATE TABLE "${oliveLineeTableName}" (
                id SERIAL PRIMARY KEY,
                id_oliva INTEGER NOT NULL,
                id_olio INTEGER NOT NULL,
                descrizione VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
            
            // Crea gli indici
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX "idx_${companyCode}_olive_linee_id_oliva" 
              ON "${oliveLineeTableName}"(id_oliva)
            `);
            
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX "idx_${companyCode}_olive_linee_id_olio" 
              ON "${oliveLineeTableName}"(id_olio)
            `);
            
            this.logger.info(`Tabella ${oliveLineeTableName} creata con successo.`);
          } catch (error) {
            this.logger.error(`Errore durante la creazione della tabella ${oliveLineeTableName}:`, error);
          }
        }
      }
      
      this.logger.info('Creazione/aggiornamento schema tabelle olive_linee completato.');
    } catch (error) {
      this.logger.error('Errore durante la creazione/aggiornamento delle tabelle olive_linee:', error);
      throw error;
    }
  }
  
  /**
   * Aggiorna le tabelle calendario con nuovi campi per le notifiche
   */
  private async updateCalendarioNotificationFields(): Promise<void> {
    try {
      this.logger.info('Aggiornamento tabelle calendario con campi per notifiche...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine aggiornamento tabelle calendario.');
        return;
      }
      
      // Per ogni azienda, aggiorna la tabella calendario
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const calendarioTableName = `${companyCode}_calendario`;
        
        this.logger.info(`Aggiornamento tabella ${calendarioTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(calendarioTableName);
        
        if (!tableExists) {
          this.logger.info(`La tabella ${calendarioTableName} non esiste. Saltando...`);
          continue;
        }
        
        // Verifica se i campi esistono già
        const columnsInfo = await this.getTableColumns(calendarioTableName);
        
        // flag_notifica_inviata
        if (!columnsInfo.some(col => col.column_name === 'flag_notifica_inviata')) {
          this.logger.info(`Aggiunta colonna flag_notifica_inviata a ${calendarioTableName}...`);
          try {
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${calendarioTableName}" 
              ADD COLUMN "flag_notifica_inviata" BOOLEAN DEFAULT FALSE
            `);
            this.logger.info(`Colonna flag_notifica_inviata aggiunta con successo a ${calendarioTableName}.`);
          } catch (error) {
            this.logger.error(`Errore durante l'aggiunta della colonna flag_notifica_inviata a ${calendarioTableName}:`, error);
          }
        }
        
        // data_notifica
        if (!columnsInfo.some(col => col.column_name === 'data_notifica')) {
          this.logger.info(`Aggiunta colonna data_notifica a ${calendarioTableName}...`);
          try {
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${calendarioTableName}" 
              ADD COLUMN "data_notifica" TIMESTAMP
            `);
            this.logger.info(`Colonna data_notifica aggiunta con successo a ${calendarioTableName}.`);
          } catch (error) {
            this.logger.error(`Errore durante l'aggiunta della colonna data_notifica a ${calendarioTableName}:`, error);
          }
        }
        
        // email_notifica
        if (!columnsInfo.some(col => col.column_name === 'email_notifica')) {
          this.logger.info(`Aggiunta colonna email_notifica a ${calendarioTableName}...`);
          try {
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${calendarioTableName}" 
              ADD COLUMN "email_notifica" VARCHAR(100)
            `);
            this.logger.info(`Colonna email_notifica aggiunta con successo a ${calendarioTableName}.`);
          } catch (error) {
            this.logger.error(`Errore durante l'aggiunta della colonna email_notifica a ${calendarioTableName}:`, error);
          }
        }
      }
      
      this.logger.info('Aggiornamento tabelle calendario con campi per notifiche completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento delle tabelle calendario con campi per notifiche:', error);
      throw error;
    }
  }
  
  /**
   * Aggiorna la tabella aziende con il campo coordinate
   */
  private async updateAziendeCoordinateField(): Promise<void> {
    try {
      this.logger.info('Aggiornamento tabella aziende con campo coordinate...');
      
      // Verifica se il campo esiste già
      const columnsInfo = await this.getTableColumns('aziende');
      
      // coordinate
      if (!columnsInfo.some(col => col.column_name === 'coordinate')) {
        this.logger.info('Aggiunta colonna coordinate alla tabella aziende...');
        try {
          await this.prisma.$executeRawUnsafe(`
            ALTER TABLE "aziende" 
            ADD COLUMN "coordinate" VARCHAR(100)
          `);
          this.logger.info('Colonna coordinate aggiunta con successo alla tabella aziende.');
        } catch (error) {
          this.logger.error('Errore durante l\'aggiunta della colonna coordinate alla tabella aziende:', error);
        }
      } else {
        this.logger.info('Colonna coordinate già esistente nella tabella aziende.');
      }
      
      this.logger.info('Aggiornamento tabella aziende con campo coordinate completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento della tabella aziende con campo coordinate:', error);
      throw error;
    }
  }
  
  /**
   * Aggiorna le tabelle calendario con il campo flagcproprio
   */
  private async updateCalendarioFlagCProprioField(): Promise<void> {
    try {
      this.logger.info('Aggiornamento tabelle calendario con campo flagcproprio...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine aggiornamento tabelle calendario.');
        return;
      }
      
      // Per ogni azienda, aggiorna la tabella calendario
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const calendarioTableName = `${companyCode}_calendario`;
        
        this.logger.info(`Aggiornamento tabella ${calendarioTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(calendarioTableName);
        
        if (!tableExists) {
          this.logger.info(`La tabella ${calendarioTableName} non esiste. Saltando...`);
          continue;
        }
        
        // Verifica se il campo flagcproprio esiste già
        const columnsInfo = await this.getTableColumns(calendarioTableName);
        
        if (!columnsInfo.some(col => col.column_name === 'flagcproprio')) {
          this.logger.info(`Aggiunta colonna flagcproprio a ${calendarioTableName}...`);
          try {
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${calendarioTableName}" 
              ADD COLUMN "flagcproprio" BOOLEAN DEFAULT FALSE
            `);
            this.logger.info(`Colonna flagcproprio aggiunta con successo a ${calendarioTableName}.`);
          } catch (error) {
            this.logger.error(`Errore durante l'aggiunta della colonna flagcproprio a ${calendarioTableName}:`, error);
          }
        } else {
          this.logger.info(`Colonna flagcproprio già esistente in ${calendarioTableName}.`);
        }
      }
      
      this.logger.info('Aggiornamento tabelle calendario con campo flagcproprio completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento delle tabelle calendario con campo flagcproprio:', error);
      throw error;
    }
  }
  
  /**
   * Aggiorna le tabelle magazzini con il campo flag_default
   */
  private async updateMagazziniDefaultField(): Promise<void> {
    try {
      this.logger.info('Aggiornamento tabelle magazzini con campo flag_default...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine aggiornamento tabelle magazzini.');
        return;
      }
      
      // Per ogni azienda, aggiorna la tabella magazzini
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const magazziniTableName = `${companyCode}_magazzini`;
        
        this.logger.info(`Aggiornamento tabella ${magazziniTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(magazziniTableName);
        
        if (!tableExists) {
          this.logger.info(`La tabella ${magazziniTableName} non esiste. Saltando...`);
          continue;
        }
        
        // Verifica se il campo flag_default esiste già
        const columnsInfo = await this.getTableColumns(magazziniTableName);
        
        if (!columnsInfo.some(col => col.column_name === 'flag_default')) {
          this.logger.info(`Aggiunta colonna flag_default a ${magazziniTableName}...`);
          try {
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${magazziniTableName}" 
              ADD COLUMN "flag_default" BOOLEAN DEFAULT FALSE
            `);
            this.logger.info(`Colonna flag_default aggiunta con successo a ${magazziniTableName}.`);
          } catch (error) {
            this.logger.error(`Errore durante l'aggiunta della colonna flag_default a ${magazziniTableName}:`, error);
          }
        } else {
          this.logger.info(`Colonna flag_default già esistente in ${magazziniTableName}.`);
        }
      }
      
      this.logger.info('Aggiornamento tabelle magazzini con campo flag_default completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento delle tabelle magazzini con campo flag_default:', error);
      throw error;
    }
  }
  
  /**
   * Aggiorna la tabella aziende aggiungendo i campi per la configurazione email
   */
  private async updateAziendeEmailFields(): Promise<void> {
    try {
      this.logger.info('Aggiornamento tabella aziende con campi per configurazione email...');
      
      // Verifica se i campi esistono già
      const columnsInfo = await this.getTableColumns('aziende');
      
      // Aggiungi i campi mancanti per la configurazione email
      if (!columnsInfo.some(col => col.column_name === 'email_mittente')) {
        this.logger.info('Aggiunta colonna email_mittente alla tabella aziende...');
        await this.prisma.$executeRawUnsafe(`
          ALTER TABLE "aziende" 
          ADD COLUMN "email_mittente" VARCHAR(100)
        `);
      }
      
      if (!columnsInfo.some(col => col.column_name === 'email_password')) {
        this.logger.info('Aggiunta colonna email_password alla tabella aziende...');
        await this.prisma.$executeRawUnsafe(`
          ALTER TABLE "aziende" 
          ADD COLUMN "email_password" VARCHAR(100)
        `);
      }
      
      if (!columnsInfo.some(col => col.column_name === 'email_smtp_server')) {
        this.logger.info('Aggiunta colonna email_smtp_server alla tabella aziende...');
        await this.prisma.$executeRawUnsafe(`
          ALTER TABLE "aziende" 
          ADD COLUMN "email_smtp_server" VARCHAR(100)
        `);
      }
      
      if (!columnsInfo.some(col => col.column_name === 'email_smtp_port')) {
        this.logger.info('Aggiunta colonna email_smtp_port alla tabella aziende...');
        await this.prisma.$executeRawUnsafe(`
          ALTER TABLE "aziende" 
          ADD COLUMN "email_smtp_port" INTEGER
        `);
      }
      
      if (!columnsInfo.some(col => col.column_name === 'email_ssl')) {
        this.logger.info('Aggiunta colonna email_ssl alla tabella aziende...');
        await this.prisma.$executeRawUnsafe(`
          ALTER TABLE "aziende" 
          ADD COLUMN "email_ssl" BOOLEAN DEFAULT TRUE
        `);
      }
      
      if (!columnsInfo.some(col => col.column_name === 'email_default_oggetto')) {
        this.logger.info('Aggiunta colonna email_default_oggetto alla tabella aziende...');
        await this.prisma.$executeRawUnsafe(`
          ALTER TABLE "aziende" 
          ADD COLUMN "email_default_oggetto" VARCHAR(200)
        `);
      }
      
      if (!columnsInfo.some(col => col.column_name === 'email_firma')) {
        this.logger.info('Aggiunta colonna email_firma alla tabella aziende...');
        await this.prisma.$executeRawUnsafe(`
          ALTER TABLE "aziende" 
          ADD COLUMN "email_firma" TEXT
        `);
      }
      
      this.logger.info('Aggiornamento tabella aziende completato con successo.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento della tabella aziende:', error);
      throw error;
    }
  }

  /**
   * Aggiorna le tabelle movimenti con i nuovi campi
   */
  private async updateMovimentiFields(): Promise<void> {
    try {
      this.logger.info('Aggiornamento tabelle movimenti con nuovi campi...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine aggiornamento tabelle movimenti.');
        return;
      }
      
      // Per ogni azienda, aggiorna la tabella movimenti
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const movimentiTableName = `${companyCode}_movimenti`;
        
        this.logger.info(`Aggiornamento tabella ${movimentiTableName} con nuovi campi...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(movimentiTableName);
        
        if (!tableExists) {
          this.logger.info(`La tabella ${movimentiTableName} non esiste. Saltando...`);
          continue;
        }
        
        // Verifica se i campi esistono già
        const columnsInfo = await this.getTableColumns(movimentiTableName);
        
        // Aggiungi i campi richiesti
        try {
          // descrizione_movimento
          if (!columnsInfo.some(col => col.column_name === 'descrizione_movimento')) {
            this.logger.info(`Aggiunta colonna descrizione_movimento a ${movimentiTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${movimentiTableName}" 
              ADD COLUMN "descrizione_movimento" VARCHAR(30)
            `);
          }
          
          // id_soggetto
          if (!columnsInfo.some(col => col.column_name === 'id_soggetto')) {
            this.logger.info(`Aggiunta colonna id_soggetto a ${movimentiTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${movimentiTableName}" 
              ADD COLUMN "id_soggetto" INTEGER
            `);
          }
          
          // flag_sono_conferimento
          if (!columnsInfo.some(col => col.column_name === 'flag_sono_conferimento')) {
            this.logger.info(`Aggiunta colonna flag_sono_conferimento a ${movimentiTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${movimentiTableName}" 
              ADD COLUMN "flag_sono_conferimento" BOOLEAN DEFAULT FALSE
            `);
          }
          
          // flag_molito
          if (!columnsInfo.some(col => col.column_name === 'flag_molito')) {
            this.logger.info(`Aggiunta colonna flag_molito a ${movimentiTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${movimentiTableName}" 
              ADD COLUMN "flag_molito" BOOLEAN DEFAULT FALSE
            `);
          }
          
          // id_molitura
          if (!columnsInfo.some(col => col.column_name === 'id_molitura')) {
            this.logger.info(`Aggiunta colonna id_molitura a ${movimentiTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${movimentiTableName}" 
              ADD COLUMN "id_molitura" INTEGER
            `);
          }
          
          // flag_sono_molitura
          if (!columnsInfo.some(col => col.column_name === 'flag_sono_molitura')) {
            this.logger.info(`Aggiunta colonna flag_sono_molitura a ${movimentiTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${movimentiTableName}" 
              ADD COLUMN "flag_sono_molitura" BOOLEAN DEFAULT FALSE
            `);
          }
          
          // costo_molitura_kg
          if (!columnsInfo.some(col => col.column_name === 'costo_molitura_kg')) {
            this.logger.info(`Aggiunta colonna costo_molitura_kg a ${movimentiTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${movimentiTableName}" 
              ADD COLUMN "costo_molitura_kg" NUMERIC(10,2)
            `);
          }
          
          // flag_fatturato
          if (!columnsInfo.some(col => col.column_name === 'flag_fatturato')) {
            this.logger.info(`Aggiunta colonna flag_fatturato a ${movimentiTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${movimentiTableName}" 
              ADD COLUMN "flag_fatturato" BOOLEAN DEFAULT FALSE
            `);
          }
          
          // id_fattura
          if (!columnsInfo.some(col => col.column_name === 'id_fattura')) {
            this.logger.info(`Aggiunta colonna id_fattura a ${movimentiTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${movimentiTableName}" 
              ADD COLUMN "id_fattura" INTEGER
            `);
          }
          
          // Crea gli indici per migliorare le prestazioni
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "idx_${companyCode}_movimenti_id_soggetto" 
            ON "${movimentiTableName}"(id_soggetto)
          `);
          
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "idx_${companyCode}_movimenti_id_molitura" 
            ON "${movimentiTableName}"(id_molitura)
          `);
          
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "idx_${companyCode}_movimenti_id_fattura" 
            ON "${movimentiTableName}"(id_fattura)
          `);
          
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "idx_${companyCode}_movimenti_flag_sono_conferimento" 
            ON "${movimentiTableName}"(flag_sono_conferimento)
          `);
          
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "idx_${companyCode}_movimenti_flag_sono_molitura" 
            ON "${movimentiTableName}"(flag_sono_molitura)
          `);
          
          this.logger.info(`Aggiornamento della tabella ${movimentiTableName} completato con successo.`);
        } catch (error) {
          this.logger.error(`Errore durante l'aggiornamento della tabella ${movimentiTableName}:`, error);
        }
      }
      
      this.logger.info('Aggiornamento tabelle movimenti completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento delle tabelle movimenti:', error);
      throw error;
    }
  }

  /**
   * Aggiorna le tabelle movimenti con i campi id_articolo_inizio e id_articolo_fine
   */
  private async updateMovimentiArticoliFields(): Promise<void> {
    try {
      this.logger.info('Aggiornamento tabelle movimenti con campi id_articolo_inizio e id_articolo_fine...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine aggiornamento tabelle movimenti.');
        return;
      }
      
      // Per ogni azienda, aggiorna la tabella movimenti
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const movimentiTableName = `${companyCode}_movimenti`;
        
        this.logger.info(`Aggiornamento tabella ${movimentiTableName} con nuovi campi...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(movimentiTableName);
        
        if (!tableExists) {
          this.logger.info(`La tabella ${movimentiTableName} non esiste. Saltando...`);
          continue;
        }
        
        // Verifica se i campi esistono già
        const columnsInfo = await this.getTableColumns(movimentiTableName);
        
        // Aggiungi i campi richiesti
        try {
          // id_articolo_inizio
          if (!columnsInfo.some(col => col.column_name === 'id_articolo_inizio')) {
            this.logger.info(`Aggiunta colonna id_articolo_inizio a ${movimentiTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${movimentiTableName}" 
              ADD COLUMN "id_articolo_inizio" INTEGER
            `);
            
            // Crea indice per migliorare le performance
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX IF NOT EXISTS "idx_${companyCode}_movimenti_id_articolo_inizio" 
              ON "${movimentiTableName}"(id_articolo_inizio)
            `);
          }
          
          // id_articolo_fine
          if (!columnsInfo.some(col => col.column_name === 'id_articolo_fine')) {
            this.logger.info(`Aggiunta colonna id_articolo_fine a ${movimentiTableName}...`);
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${movimentiTableName}" 
              ADD COLUMN "id_articolo_fine" INTEGER
            `);
            
            // Crea indice per migliorare le performance
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX IF NOT EXISTS "idx_${companyCode}_movimenti_id_articolo_fine" 
              ON "${movimentiTableName}"(id_articolo_fine)
            `);
          }
          
          this.logger.info(`Aggiornamento della tabella ${movimentiTableName} completato con successo.`);
        } catch (error) {
          this.logger.error(`Errore durante l'aggiornamento della tabella ${movimentiTableName}:`, error);
        }
      }
      
      this.logger.info('Aggiornamento tabelle movimenti con nuovi campi completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento delle tabelle movimenti:', error);
      throw error;
    }
  }

  /**
   * Crea le tabelle progressivo_operazioni per tutte le aziende
   */
  private async createProgressivoOperazioniSchema(): Promise<void> {
    try {
      this.logger.info('Creazione tabelle progressivo_operazioni...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine creazione tabelle progressivo_operazioni.');
        return;
      }
      
      // Per ogni azienda, crea la tabella progressivo_operazioni se non esiste
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const progressivoTableName = `${companyCode}_progressivo_operazioni`;
        
        this.logger.info(`Verifica tabella ${progressivoTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(progressivoTableName);
        
        if (tableExists) {
          this.logger.info(`La tabella ${progressivoTableName} esiste già.`);
        } else {
          // La tabella non esiste, creala
          this.logger.info(`La tabella ${progressivoTableName} non esiste. Creazione...`);
          
          try {
            // Crea la tabella progressivo_operazioni con le chiavi richieste
            await this.prisma.$executeRawUnsafe(`
              CREATE TABLE "${progressivoTableName}" (
                cod_sian INTEGER NOT NULL,
                data TIMESTAMP NOT NULL,
                progressivo INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (cod_sian, data)
              )
            `);
            
            // Crea indici per migliorare le performance
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX "idx_${companyCode}_progressivo_operazioni_cod_sian" 
              ON "${progressivoTableName}"(cod_sian)
            `);
            
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX "idx_${companyCode}_progressivo_operazioni_data" 
              ON "${progressivoTableName}"(data)
            `);
            
            this.logger.info(`Tabella ${progressivoTableName} creata con successo.`);
          } catch (error) {
            this.logger.error(`Errore durante la creazione della tabella ${progressivoTableName}:`, error);
          }
        }
      }
      
      this.logger.info('Creazione tabelle progressivo_operazioni completata.');
    } catch (error) {
      this.logger.error('Errore durante la creazione delle tabelle progressivo_operazioni:', error);
      throw error;
    }
  }
  
  /**
   * Aggiorna le tabelle calendario con i campi flag_chiuso e id_conferimento
   */
  private async updateCalendarioConferimentoFields(): Promise<void> {
    try {
      this.logger.info('Aggiornamento tabelle calendario con campi flag_chiuso e id_conferimento...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine aggiornamento tabelle calendario.');
        return;
      }
      
      // Per ogni azienda, aggiorna la tabella calendario
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const calendarioTableName = `${companyCode}_calendario`;
        
        this.logger.info(`Aggiornamento tabella ${calendarioTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(calendarioTableName);
        
        if (!tableExists) {
          this.logger.info(`La tabella ${calendarioTableName} non esiste. Saltando...`);
          continue;
        }
        
        // Verifica se i campi esistono già
        const columnsInfo = await this.getTableColumns(calendarioTableName);
        
        // flag_chiuso
        if (!columnsInfo.some(col => col.column_name === 'flag_chiuso')) {
          this.logger.info(`Aggiunta colonna flag_chiuso a ${calendarioTableName}...`);
          try {
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${calendarioTableName}" 
              ADD COLUMN "flag_chiuso" BOOLEAN DEFAULT FALSE
            `);
            this.logger.info(`Colonna flag_chiuso aggiunta con successo a ${calendarioTableName}.`);
          } catch (error) {
            this.logger.error(`Errore durante l'aggiunta della colonna flag_chiuso a ${calendarioTableName}:`, error);
          }
        } else {
          this.logger.info(`Colonna flag_chiuso già esistente in ${calendarioTableName}.`);
        }
        
        // id_conferimento
        if (!columnsInfo.some(col => col.column_name === 'id_conferimento')) {
          this.logger.info(`Aggiunta colonna id_conferimento a ${calendarioTableName}...`);
          try {
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${calendarioTableName}" 
              ADD COLUMN "id_conferimento" INTEGER
            `);
            
            // Crea indice per migliorare le performance
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX IF NOT EXISTS "idx_${companyCode}_calendario_id_conferimento" 
              ON "${calendarioTableName}"(id_conferimento)
            `);
            
            this.logger.info(`Colonna id_conferimento aggiunta con successo a ${calendarioTableName}.`);
          } catch (error) {
            this.logger.error(`Errore durante l'aggiunta della colonna id_conferimento a ${calendarioTableName}:`, error);
          }
        } else {
          this.logger.info(`Colonna id_conferimento già esistente in ${calendarioTableName}.`);
        }
      }
      
      this.logger.info('Aggiornamento tabelle calendario con campi flag_chiuso e id_conferimento completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento delle tabelle calendario:', error);
      throw error;
    }
  }
  
  /**
   * Aggiorna tutte le tabelle soggetti con il campo cod_cliahr
   */
  private async updateSoggettiCodCliahrField(): Promise<void> {
    try {
      this.logger.info('Aggiornamento tabelle soggetti con campo cod_cliahr...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine aggiornamento tabelle soggetti.');
        return;
      }
      
      // Per ogni azienda, aggiorna la tabella soggetti
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const soggettiTableName = `${companyCode}_soggetti`;
        
        this.logger.info(`Aggiornamento tabella ${soggettiTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(soggettiTableName);
        
        if (!tableExists) {
          this.logger.info(`La tabella ${soggettiTableName} non esiste. Saltando...`);
          continue;
        }
        
        // Verifica se il campo cod_cliahr esiste già
        const columnsInfo = await this.getTableColumns(soggettiTableName);
        
        if (!columnsInfo.some(col => col.column_name === 'cod_cliahr')) {
          this.logger.info(`Aggiunta colonna cod_cliahr a ${soggettiTableName}...`);
          try {
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${soggettiTableName}" 
              ADD COLUMN "cod_cliahr" CHARACTER(15)
            `);
            
            // Creare un indice sulla colonna cod_cliahr
            await this.prisma.$executeRawUnsafe(`
              CREATE INDEX IF NOT EXISTS "idx_${companyCode}_soggetti_cod_cliahr" 
              ON "${soggettiTableName}"(cod_cliahr)
            `);
            
            this.logger.info(`Colonna cod_cliahr aggiunta con successo a ${soggettiTableName}.`);
          } catch (error) {
            this.logger.error(`Errore durante l'aggiunta della colonna cod_cliahr a ${soggettiTableName}:`, error);
          }
        } else {
          this.logger.info(`Colonna cod_cliahr già esistente in ${soggettiTableName}.`);
        }
      }
      
      this.logger.info('Aggiornamento tabelle soggetti con campo cod_cliahr completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento delle tabelle soggetti con campo cod_cliahr:', error);
      throw error;
    }
  }
  
  /**
   * Aggiorna la tabella comuni con i campi relativi alla provincia
   */
  private async updateComuniProvinciaFields(): Promise<void> {
    try {
      this.logger.info('Aggiornamento tabella comuni con campi relativi alla provincia...');
      
      // Verifica se la tabella esiste
      const tableExists = await this.checkTableExists('comuni');
      
      if (!tableExists) {
        this.logger.info('La tabella comuni non esiste. Saltando...');
        return;
      }
      
      // Verifica se i campi esistono già
      const columnsInfo = await this.getTableColumns('comuni');
      
      // id_provincia
      if (!columnsInfo.some(col => col.column_name === 'id_provincia')) {
        this.logger.info('Aggiunta colonna id_provincia alla tabella comuni...');
        try {
          await this.prisma.$executeRawUnsafe(`
            ALTER TABLE comuni 
            ADD COLUMN "id_provincia" INTEGER
          `);
          this.logger.info('Colonna id_provincia aggiunta con successo alla tabella comuni.');
          
          // Crea indice per migliorare le performance
          await this.prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "idx_comuni_id_provincia" 
            ON "comuni"(id_provincia)
          `);
        } catch (error) {
          this.logger.error('Errore durante l\'aggiunta della colonna id_provincia alla tabella comuni:', error);
        }
      } else {
        this.logger.info('Colonna id_provincia già esistente nella tabella comuni.');
      }
      
      // descri_prov
      if (!columnsInfo.some(col => col.column_name === 'descri_prov')) {
        this.logger.info('Aggiunta colonna descri_prov alla tabella comuni...');
        try {
          await this.prisma.$executeRawUnsafe(`
            ALTER TABLE comuni 
            ADD COLUMN "descri_prov" CHARACTER(30)
          `);
          this.logger.info('Colonna descri_prov aggiunta con successo alla tabella comuni.');
        } catch (error) {
          this.logger.error('Errore durante l\'aggiunta della colonna descri_prov alla tabella comuni:', error);
        }
      } else {
        this.logger.info('Colonna descri_prov già esistente nella tabella comuni.');
      }
      
      // targa
      if (!columnsInfo.some(col => col.column_name === 'targa')) {
        this.logger.info('Aggiunta colonna targa alla tabella comuni...');
        try {
          await this.prisma.$executeRawUnsafe(`
            ALTER TABLE comuni 
            ADD COLUMN "targa" CHARACTER(2)
          `);
          this.logger.info('Colonna targa aggiunta con successo alla tabella comuni.');
        } catch (error) {
          this.logger.error('Errore durante l\'aggiunta della colonna targa alla tabella comuni:', error);
        }
      } else {
        this.logger.info('Colonna targa già esistente nella tabella comuni.');
      }
      
      // cap
      if (!columnsInfo.some(col => col.column_name === 'cap')) {
        this.logger.info('Aggiunta colonna cap alla tabella comuni...');
        try {
          await this.prisma.$executeRawUnsafe(`
            ALTER TABLE comuni 
            ADD COLUMN "cap" CHARACTER(8)
          `);
          this.logger.info('Colonna cap aggiunta con successo alla tabella comuni.');
        } catch (error) {
          this.logger.error('Errore durante l\'aggiunta della colonna cap alla tabella comuni:', error);
        }
      } else {
        this.logger.info('Colonna cap già esistente nella tabella comuni.');
      }
      
      this.logger.info('Aggiornamento tabella comuni completato.');
      
      // Opzionalmente, popola i campi id_provincia, descri_prov, targa dalle province
      try {
        this.logger.info('Aggiornamento dei dati delle province nei comuni...');
        await this.prisma.$executeRawUnsafe(`
          UPDATE comuni c
          SET 
            id_provincia = p.id,
            descri_prov = p.descrizione,
            targa = p.targa
          FROM province p
          WHERE c.id_provincia IS NULL
          AND SUBSTRING(c.cod_istat FROM 1 FOR 3) = CAST(p.id AS TEXT)
        `);
        this.logger.info('Dati delle province aggiornati con successo nei comuni.');
      } catch (error) {
        this.logger.error('Errore durante l\'aggiornamento dei dati delle province nei comuni:', error);
      }
      
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento della tabella comuni:', error);
      throw error;
    }
  }
  
  /**
   * Aggiorna tutte le tabelle linee con il campo colore
   */
  private async updateLineeColoreField(): Promise<void> {
    try {
      this.logger.info('Aggiornamento tabelle linee con campo colore...');
      
      // Ottieni tutte le aziende
      const companies = await this.prisma.aziende.findMany();
      this.logger.info(`Trovate ${companies.length} aziende.`);
      
      if (companies.length === 0) {
        this.logger.info('Nessuna azienda trovata. Fine aggiornamento tabelle linee.');
        return;
      }
      
      // Per ogni azienda, aggiorna la tabella linee
      for (const company of companies) {
        const companyCode = company.codice.toLowerCase();
        const lineeTableName = `${companyCode}_linee`;
        
        this.logger.info(`Aggiornamento tabella ${lineeTableName}...`);
        
        // Verifica se la tabella esiste
        const tableExists = await this.checkTableExists(lineeTableName);
        
        if (!tableExists) {
          this.logger.info(`La tabella ${lineeTableName} non esiste. Saltando...`);
          continue;
        }
        
        // Verifica se il campo colore esiste già
        const columnsInfo = await this.getTableColumns(lineeTableName);
        
        if (!columnsInfo.some(col => col.column_name === 'colore')) {
          this.logger.info(`Aggiunta colonna colore a ${lineeTableName}...`);
          try {
            await this.prisma.$executeRawUnsafe(`
              ALTER TABLE "${lineeTableName}" 
              ADD COLUMN "colore" VARCHAR(7)
            `);
            this.logger.info(`Colonna colore aggiunta con successo a ${lineeTableName}.`);
            
            // Aggiunge colori predefiniti casuali per le linee esistenti
            await this.prisma.$executeRawUnsafe(`
              UPDATE "${lineeTableName}"
              SET colore = '#' || LPAD(TO_HEX(FLOOR(RANDOM() * 16777215)::INT), 6, '0')
              WHERE colore IS NULL
            `);
            this.logger.info(`Colori predefiniti aggiunti alle linee esistenti in ${lineeTableName}.`);
            
          } catch (error) {
            this.logger.error(`Errore durante l'aggiunta della colonna colore a ${lineeTableName}:`, error);
          }
        } else {
          this.logger.info(`Colonna colore già esistente in ${lineeTableName}.`);
        }
      }
      
      this.logger.info('Aggiornamento tabelle linee con campo colore completato.');
    } catch (error) {
      this.logger.error('Errore durante l\'aggiornamento delle tabelle linee con campo colore:', error);
      throw error;
    }
  }
}