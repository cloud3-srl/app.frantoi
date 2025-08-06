import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../../utils/logger';
import { transformSpecialFields } from './tables-helpers';
import { specialFieldMappings } from './tables-helpers';

const prisma = new PrismaClient();
const logger = new Logger('CompanyTablesController');

// Funzione di supporto per ottenere i dati dell'azienda (a partire dall'ID o dal codice)
async function getCompanyAndCheckAccess(
  companyId: string, 
  userId: number, 
  isAdmin: boolean
): Promise<{ company: any, userHasAccess: boolean, companyCode: string } | null> {
  try {
    // Verifica se companyId è un numero (id) o una stringa (codice)
    let company;
    const isNumeric = /^\d+$/.test(companyId);
    
    if (isNumeric) {
      // Se è un ID numerico
      company = await prisma.aziende.findUnique({
        where: { id: parseInt(companyId) }
      });
    } else {
      // Se è un codice azienda (stringa)
      company = await prisma.aziende.findFirst({
        where: { codice: companyId }
      });
    }
    
    if (!company) {
      return null;
    }
    
    // Verifica che l'utente abbia accesso all'azienda
    const userHasAccess = await prisma.user_aziende.findFirst({
      where: {
        user_id: userId,
        azienda_id: company.id
      }
    });
    
    const companyCode = company.codice.toLowerCase();
    
    return { company, userHasAccess: !!userHasAccess, companyCode };
  } catch (error) {
    logger.error('Errore durante il controllo dell\'accesso all\'azienda:', error);
    return null;
  }
}

export class CompanyTablesController {
  /**
   * Ottiene tutti i record di una tabella specifica per l'azienda
   */
  static async getAll(req: Request, res: Response) {
    const { companyId, tableName } = req.params;
    const userId = (req.user as any)?.id;
    const isAdmin = (req.user as any)?.isAdmin === true;
    
    try {
      // Ottieni i dati dell'azienda e verifica l'accesso
      const result = await getCompanyAndCheckAccess(companyId, userId, isAdmin);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: `Azienda con ID o codice ${companyId} non trovata`
        });
      }
      
      const { company, userHasAccess, companyCode } = result;
      
      // Se l'utente non è admin e non ha accesso all'azienda, ritorna errore
      if (!isAdmin && !userHasAccess) {
        return res.status(403).json({
          success: false,
          message: `Non hai accesso a questa azienda`
        });
      }
      
      // Costruisci il nome completo della tabella
      const fullTableName = `${companyCode}_${tableName}`;
      
      // Esegui una query raw per ottenere i dati dalla tabella dinamica
      const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${fullTableName}" ORDER BY id`);
      
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error(`Errore nel recupero dati dalla tabella ${tableName} per l'azienda ${companyId}:`, error);
      return res.status(500).json({
        success: false,
        message: `Errore nel recupero dati dalla tabella ${tableName}`,
        error: error.message
      });
    }
  }
  
  /**
   * Ottiene un record specifico di una tabella per l'azienda
   */
  static async getById(req: Request, res: Response) {
    const { companyId, tableName, id } = req.params;
    const userId = (req.user as any)?.id;
    const isAdmin = (req.user as any)?.isAdmin === true;
    
    try {
      // Ottieni i dati dell'azienda e verifica l'accesso
      const result = await getCompanyAndCheckAccess(companyId, userId, isAdmin);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: `Azienda con ID o codice ${companyId} non trovata`
        });
      }
      
      const { company, userHasAccess, companyCode } = result;
      
      // Se l'utente non è admin e non ha accesso all'azienda, ritorna errore
      if (!isAdmin && !userHasAccess) {
        return res.status(403).json({
          success: false,
          message: `Non hai accesso a questa azienda`
        });
      }
      
      // Costruisci il nome completo della tabella
      const fullTableName = `${companyCode}_${tableName}`;
      
      // Esegui una query raw per ottenere il record specifico
      const data = await prisma.$queryRawUnsafe(`
        SELECT * FROM "${fullTableName}" WHERE id = ${tableName === 'cisterne' ? `'${id}'` : id}
      `);
      
      // Se il risultato è un array vuoto, il record non è stato trovato
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return res.status(404).json({
          success: false,
          message: `Record con ID ${id} non trovato nella tabella ${tableName}`
        });
      }
      
      return res.status(200).json({
        success: true,
        data: Array.isArray(data) ? data[0] : data
      });
    } catch (error: any) {
      logger.error(`Errore nel recupero record dalla tabella ${tableName} per l'azienda ${companyId}:`, error);
      return res.status(500).json({
        success: false,
        message: `Errore nel recupero record dalla tabella ${tableName}`,
        error: error.message
      });
    }
  }
  
  /**
   * Crea un nuovo record in una tabella specifica per l'azienda
   */
  static async create(req: Request, res: Response) {
    const { companyId, tableName } = req.params;
    const data = req.body;
    const userId = (req.user as any)?.id;
    
    try {
      // Verifica che l'utente abbia accesso all'azienda
      const userHasAccess = await prisma.user_aziende.findFirst({
        where: {
          user_id: userId,
          azienda_id: parseInt(companyId)
        }
      });
      
      const isAdmin = (req.user as any)?.isAdmin === true;
      
      // Se l'utente non è admin e non ha accesso all'azienda, ritorna errore
      if (!isAdmin && !userHasAccess) {
        return res.status(403).json({
          success: false,
          message: `Non hai accesso a questa azienda`
        });
      }
      
      // Ottieni il codice azienda dal database
      const company = await prisma.aziende.findUnique({
        where: { id: parseInt(companyId) }
      });
      
      if (!company) {
        return res.status(404).json({
          success: false,
          message: `Azienda con ID ${companyId} non trovata`
        });
      }
      
      const companyCode = company.codice.toLowerCase();
      
      // Caso speciale per conferimenti - salva direttamente nella tabella movimenti
      if (tableName === 'conferimenti') {
        logger.info(`Richiesta di salvataggio conferimento: salva direttamente in ${companyCode}_movimenti`);
        
        try {
          const conferimento = data;
          
          // Recuperare il magazzino con i dati necessari
          const magazzino = await prisma.$queryRawUnsafe(`
            SELECT * FROM "${companyCode}_magazzini" 
            WHERE id = ${conferimento.magazzino_id || 1}
            LIMIT 1
          `);
          
          let magazzinoObj = null;
          if (Array.isArray(magazzino) && magazzino.length > 0) {
            magazzinoObj = magazzino[0];
          }
          
          // Recuperare il cliente
          const cliente = await prisma.$queryRawUnsafe(`
            SELECT * FROM "${companyCode}_soggetti" 
            WHERE id = ${conferimento.cliente_id}
            LIMIT 1
          `);
          
          let clienteObj = null;
          if (Array.isArray(cliente) && cliente.length > 0) {
            clienteObj = cliente[0];
          }
          
          // Recuperare il committente (se presente)
          let committenteObj = null;
          if (conferimento.committente_id) {
            const committente = await prisma.$queryRawUnsafe(`
              SELECT * FROM "${companyCode}_soggetti" 
              WHERE id = ${conferimento.committente_id}
              LIMIT 1
            `);
            
            if (Array.isArray(committente) && committente.length > 0) {
              committenteObj = committente[0];
            }
          }
          
          // Cercare o creare il progressivo
          let progressivo = 1;
          const dataRegistrazione = conferimento.data_arrivo || new Date().toISOString().slice(0, 10);
          const codSian = magazzinoObj?.cod_sian || 1;
          
          // Cerchiamo se esiste già un progressivo per questa data e cod_sian
          const progressivoQuery = await prisma.$queryRawUnsafe(`
            SELECT progressivo FROM "${companyCode}_progressivo_operazioni"
            WHERE cod_sian = ${codSian} AND data::date = '${dataRegistrazione}'::date
            LIMIT 1
          `);
          
          if (Array.isArray(progressivoQuery) && progressivoQuery.length > 0) {
            // Usiamo il progressivo esistente
            progressivo = progressivoQuery[0].progressivo;
          } else {
            // Creiamo un nuovo record con progressivo = 1
            await prisma.$queryRawUnsafe(`
              INSERT INTO "${companyCode}_progressivo_operazioni" (cod_sian, data, progressivo)
              VALUES (${codSian}, '${dataRegistrazione}'::date, 1)
            `);
          }
          
          // Trattamento speciale per origispeci, che può essere un elenco separato da virgole
          let origineSpecifica = '';
          if (conferimento.origispeci) {
            origineSpecifica = conferimento.origispeci.replace(/,/g, ' '); // Sostituiamo le virgole con spazi
          }
          
          // Compila i dati per movimenti secondo i requisiti
          const movimentiData: Record<string, any> = {
            campo01: 'IT02497740999', // Valore fisso
            campo02: magazzinoObj?.cod_sian || 1,
            campo03: progressivo,
            campo04: conferimento.data_arrivo, // Data entrata olive
            campo05: conferimento.num_documento,
            campo06: conferimento.data_documento,
            campo07: 'T1', // Valore fisso
            campo08: clienteObj?.id_sian || 0, // Codice SIAN del cliente
            campo09: committenteObj?.id_sian || clienteObj?.id_sian || 0, // Codice SIAN del committente o cliente
            campo10: conferimento.kg_olive_conferite, // Quantitativo olive
            campo11: 0, // Valore fisso
            campo17: conferimento.macroarea, // Macroarea delle olive
            campo18: origineSpecifica, // Origine specifica delle olive con spazi
            campo30: 'X', // Valore fisso
            campo35: conferimento.flag_bio ? 'X' : '', // X se l'oliva è biologica
            campo49: 'I', // Valore fisso
            descrizione_movimento: 'Carico di olive',
            flag_sono_conferimento: true,
            costo_molitura_kg: conferimento.prezzo_molitura_kg,
            id_articolo_inizio: conferimento.olive_id, // ID dell'articolo olive
            id_soggetto: conferimento.cliente_id // ID del cliente
          };
          
          // Costruisci la query per inserire i dati nella tabella movimenti
          const fieldsMovimenti = Object.keys(movimentiData);
          const fieldsStringMovimenti = fieldsMovimenti.join(', ');
          
          // Costruisci la parte di query per i valori
          const valuesPlaceholdersMovimenti = fieldsMovimenti.map((field) => {
            // Per i campi booleani, convertiamo in true/false per PostgreSQL
            if (typeof movimentiData[field] === 'boolean') {
              return movimentiData[field] ? 'true' : 'false';
            }
            
            // Per le stringhe, aggiungiamo gli apici singoli
            if (typeof movimentiData[field] === 'string') {
              return `'${movimentiData[field].replace(/'/g, "''")}'`; // Escape degli apici singoli
            }
            
            // Per i valori null o undefined
            if (movimentiData[field] === null || movimentiData[field] === undefined) {
              return 'NULL';
            }
            
            // Per i numeri, li lasciamo così come sono
            return movimentiData[field];
          }).join(', ');
          
          // Costruisci la query completa
          const movimentiQuery = `
            INSERT INTO "${companyCode}_movimenti" (${fieldsStringMovimenti})
            VALUES (${valuesPlaceholdersMovimenti})
            RETURNING *
          `;
          
          // Log per debug
          logger.info(`Query di inserimento movimenti: ${movimentiQuery}`);
          
          // Esegui la query di inserimento movimenti
          const movimentiResult = await prisma.$queryRawUnsafe(movimentiQuery);
          
          // Otteniamo l'ID del movimento/conferimento appena creato
          const nuovoConferimentoId = Array.isArray(movimentiResult) && movimentiResult.length > 0 
            ? movimentiResult[0].id 
            : null;
          
          // Aggiorniamo la prenotazione nella tabella calendario se abbiamo sia l'ID prenotazione che l'ID conferimento
          if (nuovoConferimentoId && conferimento.id_prenotazione) {
            try {
              logger.info(`Aggiornamento prenotazione ID ${conferimento.id_prenotazione} con conferimento ID ${nuovoConferimentoId}`);
              
              const updateCalendarioQuery = `
                UPDATE "${companyCode}_calendario" 
                SET 
                  flag_chiuso = TRUE, 
                  id_conferimento = ${nuovoConferimentoId},
                  updated_at = CURRENT_TIMESTAMP
                WHERE id = ${conferimento.id_prenotazione}
              `;
              
              // Esegui la query di aggiornamento
              await prisma.$queryRawUnsafe(updateCalendarioQuery);
              
              logger.info(`Prenotazione ID ${conferimento.id_prenotazione} aggiornata con successo`);
            } catch (updateError) {
              logger.error(`Errore nell'aggiornamento della prenotazione:`, updateError);
              // Non facciamo fallire l'intera operazione se questo aggiornamento fallisce
            }
          }
          
          // Restituisci il risultato del salvataggio
          return res.status(201).json({
            success: true,
            data: Array.isArray(movimentiResult) ? movimentiResult[0] : movimentiResult,
            message: `Conferimento registrato con successo nella tabella movimenti${conferimento.id_prenotazione ? ' e prenotazione aggiornata' : ''}`
          });
        } catch (error: any) {
          logger.error(`Errore nel salvataggio conferimento nella tabella movimenti:`, error);
          return res.status(500).json({
            success: false,
            message: `Errore nel salvataggio del conferimento`,
            error: error.message
          });
        }
      }
      
      // Per le altre tabelle, continua normalmente
      
      // Costruisci il nome completo della tabella
      const fullTableName = `${companyCode}_${tableName}`;
      
      // Aggiungiamo la gestione di alcuni campi specifici per articoli
      let processedData = {...data};
      
      if (tableName === 'articoli') {
        // Verifichiamo prima le colonne effettivamente disponibili nella tabella
        try {
          // Query per ottenere le colonne della tabella specifica per l'azienda
          const tableColumns = await prisma.$queryRaw<{column_name: string}[]>`
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = ${`${companyCode}_${tableName}`}
          `;
          
          // Ottieni un elenco di nomi di colonne
          const columnNames = tableColumns.map(col => col.column_name.toLowerCase());
          logger.info(`Colonne disponibili in ${companyCode}_${tableName}: ${columnNames.join(', ')}`);
          
          // Filtra i dati per includere solo le colonne esistenti
          const filteredData: Record<string, any> = {};
          Object.keys(processedData).forEach(key => {
            if (columnNames.includes(key.toLowerCase())) {
              filteredData[key] = processedData[key];
            } else {
              logger.warn(`Colonna "${key}" non trovata nella tabella ${companyCode}_${tableName}, viene ignorata`);
            }
          });
          
          processedData = filteredData;
          
          // Se non c'è unità di misura ma la colonna esiste, impostiamo un default
          if (columnNames.includes('unita_misura')) {
            if (!processedData.unita_misura) {
              const tipoVal = processedData.tipologia || 'OL';
              processedData.unita_misura = tipoVal === 'SF' ? 'KG' : 'QT';
            }
          }
          
          // Ensure origispeci è una stringa vuota se la colonna esiste
          if (columnNames.includes('origispeci')) {
            if (processedData.origispeci === null || processedData.origispeci === undefined) {
              processedData.origispeci = '';
            }
          }
        } catch (columnError) {
          logger.error(`Errore nel recupero delle colonne per ${companyCode}_${tableName}:`, columnError);
          // Procediamo comunque con i dati originali in caso di errore
        }
        
        // Log per debug
        logger.info(`Dati articolo processati: ${JSON.stringify(processedData)}`);
      }
      
      // Caso speciale per flagObso nelle cisterne
      if (tableName === 'cisterne' && 'flagObso' in processedData) {
        // Rinomina il campo da flagObso a flagobso (senza maiuscole)
        logger.info(`Convertendo flagObso a flagobso per la tabella cisterne`);
        processedData.flagobso = processedData.flagObso;
        delete processedData.flagObso;
      }
      
      // Verifica che la descrizione sia presente per le cisterne
      if (tableName === 'cisterne' && (!processedData.descrizione || processedData.descrizione.trim() === '')) {
        return res.status(400).json({
          success: false,
          message: 'Il campo Descrizione è obbligatorio per le cisterne'
        });
      }
      
      // Prepara i campi e i valori per l'inserimento - includi anche valori 0
      const fields = Object.keys(processedData).filter(key => 
        processedData[key] !== null && 
        processedData[key] !== undefined && 
        (processedData[key] !== '' || key === 'descrizione') // mantieni descrizione anche se vuoto, sarà validato sopra
      );
      
      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nessun dato valido fornito per la creazione del record'
        });
      }
      
      // Costruisci la parte di query per i campi
      const fieldsString = fields.join(', ');
      
      // Costruisci la parte di query per i valori
      const valuesPlaceholders = fields.map((field) => {
        // Per i campi booleani, convertiamo in true/false per PostgreSQL
        if (typeof processedData[field] === 'boolean') {
          return processedData[field] ? 'true' : 'false';
        }
        
        // Per le stringhe, aggiungiamo gli apici singoli
        if (typeof processedData[field] === 'string') {
          return `'${processedData[field].replace(/'/g, "''")}'`; // Escape degli apici singoli
        }
        
        // Per i valori null
        if (processedData[field] === null) {
          return 'NULL';
        }
        
        // Per i numeri, li lasciamo così come sono
        return processedData[field];
      }).join(', ');
      
      // Costruisci la query con RETURNING per ottenere l'oggetto inserito
      const query = `
        INSERT INTO "${fullTableName}" (${fieldsString})
        VALUES (${valuesPlaceholders})
        RETURNING *
      `;
      
      // Log la query per debug
      logger.info(`Query di inserimento: ${query}`);
      
      // Esegui la query di inserimento
      const result = await prisma.$queryRawUnsafe(query);
      
      return res.status(201).json({
        success: true,
        data: Array.isArray(result) ? result[0] : result,
        message: `Record creato con successo nella tabella ${tableName}`
      });
    } catch (error: any) {
      logger.error(`Errore nella creazione record nella tabella ${tableName} per l'azienda ${companyId}:`, error);
      return res.status(500).json({
        success: false,
        message: `Errore nella creazione record nella tabella ${tableName}`,
        error: error.message
      });
    }
  }
  
  /**
   * Aggiorna un record esistente in una tabella specifica per l'azienda
   */
  static async update(req: Request, res: Response) {
    const { companyId, tableName, id } = req.params;
    const data = req.body;
    const userId = (req.user as any)?.id;
    
    // Log per debug
    logger.info(`Aggiornamento record in ${tableName}, dati ricevuti:`, JSON.stringify(data));
    
    try {
      // Verifica che l'utente abbia accesso all'azienda
      const userHasAccess = await prisma.user_aziende.findFirst({
        where: {
          user_id: userId,
          azienda_id: parseInt(companyId)
        }
      });
      
      const isAdmin = (req.user as any)?.isAdmin === true;
      
      // Se l'utente non è admin e non ha accesso all'azienda, ritorna errore
      if (!isAdmin && !userHasAccess) {
        return res.status(403).json({
          success: false,
          message: `Non hai accesso a questa azienda`
        });
      }
      
      // Ottieni il codice azienda dal database
      const company = await prisma.aziende.findUnique({
        where: { id: parseInt(companyId) }
      });
      
      if (!company) {
        return res.status(404).json({
          success: false,
          message: `Azienda con ID ${companyId} non trovata`
        });
      }
      
      const companyCode = company.codice.toLowerCase();
      
      // Costruisci il nome completo della tabella
      const fullTableName = `${companyCode}_${tableName}`;
      
      // Aggiungiamo la gestione di alcuni campi specifici per articoli
      let processedData = {...data};
      
      if (tableName === 'articoli') {
        // Verifichiamo prima le colonne effettivamente disponibili nella tabella
        try {
          // Query per ottenere le colonne della tabella specifica per l'azienda
          const tableColumns = await prisma.$queryRaw<{column_name: string}[]>`
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = ${`${companyCode}_${tableName}`}
          `;
          
          // Ottieni un elenco di nomi di colonne
          const columnNames = tableColumns.map(col => col.column_name.toLowerCase());
          logger.info(`Colonne disponibili in ${companyCode}_${tableName}: ${columnNames.join(', ')}`);
          
          // Filtra i dati per includere solo le colonne esistenti
          const filteredData: Record<string, any> = {};
          Object.keys(processedData).forEach(key => {
            if (columnNames.includes(key.toLowerCase())) {
              filteredData[key] = processedData[key];
            } else {
              logger.warn(`Colonna "${key}" non trovata nella tabella ${companyCode}_${tableName} per l'aggiornamento, viene ignorata`);
            }
          });
          
          processedData = filteredData;
          
          // Se non c'è unità di misura ma la colonna esiste, impostiamo un default
          if (columnNames.includes('unita_misura')) {
            if (!processedData.unita_misura) {
              const tipoVal = processedData.tipologia || 'OL';
              processedData.unita_misura = tipoVal === 'SF' ? 'KG' : 'QT';
            }
          }
          
          // Ensure origispeci è una stringa vuota se la colonna esiste
          if (columnNames.includes('origispeci')) {
            if (processedData.origispeci === null || processedData.origispeci === undefined) {
              processedData.origispeci = '';
            }
          }
        } catch (columnError) {
          logger.error(`Errore nel recupero delle colonne per ${companyCode}_${tableName}:`, columnError);
          // Procediamo comunque con i dati originali in caso di errore
        }
        
        // Log per debug
        logger.info(`Dati articolo per aggiornamento: ${JSON.stringify(processedData)}`);
      }
      
      // Rimuoviamo il trattamento speciale di flagObso
      
      // Assicuriamoci di rimuovere updated_at dai dati di input
      // per evitare conflitti quando viene aggiunto automaticamente
      if ('updated_at' in processedData) {
        logger.info(`Rimuovo updated_at dai dati di input per evitare duplicazioni`);
        delete processedData.updated_at;
      }
      
      const updateFields = Object.keys(processedData)
        .filter(key => key !== 'id' && processedData[key] !== undefined) // Escludiamo l'ID dai campi da aggiornare
        .map(key => {
          // Controlla se questo è un campo speciale che richiede una mappatura
          let fieldName = key;
          
          // Il campo flagObso deve essere trattato come un campo normale
          if (specialFieldMappings[tableName] && specialFieldMappings[tableName][key]) {
            fieldName = specialFieldMappings[tableName][key];
            logger.info(`Campo speciale mappato: ${key} -> ${fieldName}`);
          } 
          else if (key.startsWith('"') && key.endsWith('"')) {
            // Se è già un campo con virgolette, usalo così com'è
            fieldName = key;
            logger.info(`Campo già con virgolette: ${key}`);
          } 
          else {
            fieldName = `"${key}"`;
          }
          
          // Per i campi booleani, convertiamo in true/false per PostgreSQL
          if (typeof processedData[key] === 'boolean') {
            return `${fieldName} = ${processedData[key] ? 'true' : 'false'}`;
          }
          
          // Per i valori null
          if (processedData[key] === null) {
            return `${fieldName} = NULL`;
          }
          
          // Per le stringhe, aggiungiamo gli apici singoli
          if (typeof processedData[key] === 'string') {
            return `${fieldName} = '${processedData[key].replace(/'/g, "''")}'`; // Escape degli apici singoli
          }
          
          // Per i numeri, li lasciamo così come sono
          return `${fieldName} = ${processedData[key]}`;
        });
        
      // Log per debug della generazione dei campi
      logger.info(`Campi di aggiornamento generati: ${updateFields.join(', ')}`);
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nessun dato valido fornito per l\'aggiornamento del record'
        });
      }
      
      // Verifica se la tabella ha il campo updated_at
      const hasUpdatedAt = await prisma.$queryRaw<any[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = ${`${companyCode}_${tableName}`}
          AND column_name = 'updated_at'
        )
      `;
      
      // Costruisci la query di aggiornamento
      let updateClause = updateFields.join(', ');
      if (hasUpdatedAt[0].exists) {
        updateClause += `, "updated_at" = CURRENT_TIMESTAMP`;
      }
      
      // Rimuoviamo questa parte per evitare problemi con le virgolette
      
      const query = `
        UPDATE "${fullTableName}"
        SET ${updateClause}
        WHERE id = ${tableName === 'cisterne' ? `'${id}'` : id}
        RETURNING *
      `;
      
      // Log la query per debug
      logger.info(`Query di aggiornamento: ${query}`);
      
      // Esegui la query di aggiornamento
      const result = await prisma.$queryRawUnsafe(query);
      
      // Se il risultato è un array vuoto, il record non è stato trovato
      if (!result || (Array.isArray(result) && result.length === 0)) {
        return res.status(404).json({
          success: false,
          message: `Record con ID ${id} non trovato nella tabella ${tableName}`
        });
      }
      
      return res.status(200).json({
        success: true,
        data: Array.isArray(result) ? result[0] : result,
        message: `Record aggiornato con successo nella tabella ${tableName}`
      });
    } catch (error: any) {
      logger.error(`Errore nell'aggiornamento record nella tabella ${tableName} per l'azienda ${companyId}:`, error);
      return res.status(500).json({
        success: false,
        message: `Errore nell'aggiornamento record nella tabella ${tableName}`,
        error: error.message
      });
    }
  }
  
  /**
   * Elimina un record esistente da una tabella specifica per l'azienda
   */
  static async delete(req: Request, res: Response) {
    const { companyId, tableName, id } = req.params;
    const userId = (req.user as any)?.id;
    
    try {
      // Verifica che l'utente abbia accesso all'azienda
      const userHasAccess = await prisma.user_aziende.findFirst({
        where: {
          user_id: userId,
          azienda_id: parseInt(companyId)
        }
      });
      
      const isAdmin = (req.user as any)?.isAdmin === true;
      
      // Se l'utente non è admin e non ha accesso all'azienda, ritorna errore
      if (!isAdmin && !userHasAccess) {
        return res.status(403).json({
          success: false,
          message: `Non hai accesso a questa azienda`
        });
      }
      
      // Ottieni il codice azienda dal database
      const company = await prisma.aziende.findUnique({
        where: { id: parseInt(companyId) }
      });
      
      if (!company) {
        return res.status(404).json({
          success: false,
          message: `Azienda con ID ${companyId} non trovata`
        });
      }
      
      const companyCode = company.codice.toLowerCase();
      
      // Costruisci il nome completo della tabella
      const fullTableName = `${companyCode}_${tableName}`;
      
      // Costruisci la query di eliminazione
      const query = `
        DELETE FROM "${fullTableName}"
        WHERE id = ${tableName === 'cisterne' ? `'${id}'` : id}
        RETURNING *
      `;
      
      // Esegui la query di eliminazione
      const result = await prisma.$queryRawUnsafe(query);
      
      // Se il risultato è un array vuoto, il record non è stato trovato
      if (!result || (Array.isArray(result) && result.length === 0)) {
        return res.status(404).json({
          success: false,
          message: `Record con ID ${id} non trovato nella tabella ${tableName}`
        });
      }
      
      return res.status(200).json({
        success: true,
        data: Array.isArray(result) ? result[0] : result,
        message: `Record eliminato con successo dalla tabella ${tableName}`
      });
    } catch (error: any) {
      logger.error(`Errore nell'eliminazione record dalla tabella ${tableName} per l'azienda ${companyId}:`, error);
      return res.status(500).json({
        success: false,
        message: `Errore nell'eliminazione record dalla tabella ${tableName}`,
        error: error.message
      });
    }
  }
}