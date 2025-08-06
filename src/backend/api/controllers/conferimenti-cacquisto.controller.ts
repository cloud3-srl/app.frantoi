import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../../utils/logger';

// Inizializza Prisma client e logger
const prisma = new PrismaClient();
const logger = new Logger('ConferimentiCAcquistoController');

/**
 * Controller per la gestione dei conferimenti in conto acquisto
 * Gestisce il salvataggio dei dati nella tabella xxxxx_movimenti
 * 
 * Dettaglio campi SIAN:
 * campo01 = 'IT02497740999'
 * campo02 = codice sian del magazzino del conferimento associato
 * campo03 = calcola il progressivo
 * campo04 = data arrivo
 * campo05 = numero documento
 * campo06 = data documento
 * campo07 = A1
 * campo08 = codice sian del soggetto/cliente
 * campo09 = codice committente
 * campo10 = quantitativo kg olive
 * campo17 = macroarea delle olive
 * campo19 = origine specifica delle olive
 * campo35 = 'X' se olive hanno flag_bio true
 * campo41 = data e ora raccolta olive
 * descrizione_movimento = 'Carico di olive da ditta Italia'
 * id_articolo_inizio = id dell'articolo olive
 * flag_sono_conferimento = true
 */
export class ConferimentiCAcquistoController {
  
  /**
   * Registra un nuovo conferimento in conto acquisto
   */
  static async createConferimento(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const conferimentoData = req.body;
      const userId = (req.user as any)?.id;
      
      // Log dei dati ricevuti
      logger.info(`Registrazione nuovo conferimento c/acquisto per azienda ${companyId}`);
      logger.debug('Dati conferimento:', conferimentoData);
      
      // Recupera informazioni sull'azienda
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
      
      // Esegui la transazione per garantire l'integrità dei dati
      const result = await prisma.$transaction(async (prismaClient) => {
        // Ottieni ulteriori informazioni necessarie
        
        // Recupera informazioni sul magazzino
        let codSianMagazzino = '';
        if (conferimentoData.magazzino_id) {
          const magazzino = await prismaClient.$queryRawUnsafe(`
            SELECT cod_sian FROM ${companyCode}_magazzini WHERE id = ${conferimentoData.magazzino_id}
          `);
          if (magazzino && Array.isArray(magazzino) && magazzino.length > 0) {
            codSianMagazzino = magazzino[0].cod_sian || '';
          }
        }
        
        // Recupera informazioni sul cliente (fornitore)
        let codSianCliente = '';
        if (conferimentoData.cliente_id) {
          const cliente = await prismaClient.$queryRawUnsafe(`
            SELECT id_sian FROM ${companyCode}_soggetti WHERE id = ${conferimentoData.cliente_id}
          `);
          if (cliente && Array.isArray(cliente) && cliente.length > 0) {
            codSianCliente = cliente[0].id_sian || '';
          }
        }
        
        // Recupera informazioni sul committente (se diverso dal cliente)
        let codSianCommittente = codSianCliente; // Default: stesso del cliente
        if (conferimentoData.committente_id && conferimentoData.committente_id !== conferimentoData.cliente_id) {
          const committente = await prismaClient.$queryRawUnsafe(`
            SELECT id_sian FROM ${companyCode}_soggetti WHERE id = ${conferimentoData.committente_id}
          `);
          if (committente && Array.isArray(committente) && committente.length > 0) {
            codSianCommittente = committente[0].id_sian || '';
          }
        }
        
        // Recupera informazioni sulla macroarea
        let macroarea = conferimentoData.macroarea || null; // Usa direttamente l'ID numerico
        
        // Recupera informazioni sulle origini specifiche
        let originiSpecifiche = '';
        if (conferimentoData.origispeci) {
          // Converti la stringa di ID in array
          const originiIds = conferimentoData.origispeci.split(',').map((id: string) => id.trim());
          
          // Per ogni ID, recupera la descrizione
          const originiDescriptions = [];
          for (const id of originiIds) {
            if (id) {
              const origineInfo = await prismaClient.$queryRawUnsafe(`
                SELECT descrizione FROM origini_specifiche WHERE id = ${parseInt(id)}
              `);
              if (origineInfo && Array.isArray(origineInfo) && origineInfo.length > 0) {
                originiDescriptions.push(origineInfo[0].descrizione);
              }
            }
          }
          
          // Unisci le descrizioni con spazi (come richiesto per SIAN)
          originiSpecifiche = originiDescriptions.join(' ');
        }
        
        // Genera un progressivo per l'operazione SIAN
        let progressivoNum = 1;
        try {
          // Get the current date
          const today = new Date().toISOString().split('T')[0];
          
          // Insert or update the progressivo
          await prismaClient.$executeRawUnsafe(`
            INSERT INTO ${companyCode}_progressivo_operazioni (cod_sian, data, progressivo, updated_at)
            VALUES (0, '${today}', 1, NOW())
            ON CONFLICT (cod_sian, data) DO UPDATE
            SET progressivo = ${companyCode}_progressivo_operazioni.progressivo + 1,
                updated_at = NOW()
          `);
          
          // Get the last inserted progressivo
          const progressivoQuery = await prismaClient.$queryRawUnsafe(`
            SELECT progressivo FROM ${companyCode}_progressivo_operazioni
            WHERE cod_sian = 0 AND data = '${today}'
          `);
          
          // Check if we have results and set progressivoNum
          if (progressivoQuery && Array.isArray(progressivoQuery) && progressivoQuery.length > 0) {
            progressivoNum = progressivoQuery[0].progressivo || 1;
          }
          
          logger.info(`Progressivo SIAN generato: ${progressivoNum}`);
        } catch (error) {
          logger.error("Errore nella generazione del progressivo SIAN:", error);
          // Continue with default progressivo = 1
        }
        
        // Formatta le date per la query SQL
        const dataArrivo = new Date(conferimentoData.data_arrivo).toISOString();
        const dataDocumento = conferimentoData.data_documento ? new Date(conferimentoData.data_documento).toISOString() : null;
        
        // Prepara i campi per il raccoglimento delle olive
        let dataRaccolta = null;
        let oraRaccolta = null;
        let dataOraRaccolta = null;
        if (conferimentoData.data_raccolta && conferimentoData.ora_raccolta) {
          dataRaccolta = new Date(conferimentoData.data_raccolta);
          const [hours, minutes] = conferimentoData.ora_raccolta.split(':');
          dataRaccolta.setHours(parseInt(hours), parseInt(minutes));
          dataOraRaccolta = dataRaccolta.toISOString();
        }
        
        // Inserisci il record nella tabella _movimenti con i campi SIAN richiesti
        const insertQuery = `
          INSERT INTO ${companyCode}_movimenti (
            flag_sono_conferimento,
            id_soggetto,
            id_articolo_inizio,
            campo01,
            campo02,
            campo03,
            campo04,
            campo05,
            campo06,
            campo07,
            campo08,
            campo09,
            campo10,
            campo17,
            campo19,
            campo35,
            campo41,
            campo49,
            descrizione_movimento,
            created_at,
            updated_at
          ) VALUES (
            true,
            ${conferimentoData.cliente_id},
            ${conferimentoData.olive_id},
            'IT02497740999',
            ${codSianMagazzino ? `'${codSianMagazzino}'` : 'NULL'},
            ${progressivoNum},
            '${dataArrivo}',
            '${conferimentoData.num_documento || ''}',
            ${dataDocumento ? `'${dataDocumento}'` : 'NULL'},
            'A1',
            ${codSianCliente ? `'${codSianCliente}'` : 'NULL'},
            ${codSianCommittente ? `'${codSianCommittente}'` : 'NULL'},
            ${conferimentoData.kg_olive_conferite || 0},
            ${macroarea ? `${macroarea}` : 'NULL'},
            ${originiSpecifiche ? `'${originiSpecifiche}'` : 'NULL'},
            ${conferimentoData.flag_bio ? "'X'" : "''"},
            ${dataOraRaccolta ? `'${dataOraRaccolta}'` : 'NULL'},
            'I',
            'Carico olive da ditta Italia',
            NOW(),
            NOW()
          ) RETURNING id`;
        
        const insertResult = await prismaClient.$queryRawUnsafe(insertQuery);
        const newId = Array.isArray(insertResult) && insertResult.length > 0 ? insertResult[0].id : null;
        
        return { success: true, id: newId };
      });
      
      return res.status(201).json({
        success: true,
        message: 'Conferimento c/acquisto registrato con successo',
        data: {
          id: result.id,
          companyId
        }
      });
    } catch (error: any) {
      logger.error('Errore durante la registrazione del conferimento c/acquisto:', error);
      return res.status(500).json({
        success: false,
        message: `Errore durante la registrazione del conferimento c/acquisto: ${error.message}`,
        error: error.message
      });
    }
  }
}