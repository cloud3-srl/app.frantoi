/**
 * Controller MolituraCproprioController
 * ------------------------------------------------------------------------------------------------
 * Questo controller gestisce tutte le operazioni relative alla molitura conto proprio.
 * 
 * La molitura conto proprio si riferisce alla lavorazione delle olive di proprietà del frantoio,
 * a differenza della molitura conto terzi dove le olive appartengono a clienti esterni.
 * 
 * FUNZIONALITÀ PRINCIPALI:
 * 1. Registrazione di una nuova molitura conto proprio
 * 2. Aggiornamento del conferimento di origine con riferimento alla molitura creata
 * 3. Aggiornamento della giacenza della cisterna di destinazione
 * 
 * FLUSSO DATI:
 * - Seleziona uno o più conferimenti dello stesso tipo di oliva
 * - Registra i dati della molitura (data, olio ottenuto, resa, ecc.)
 * - Crea un nuovo record nella tabella movimenti con campo07='B3'
 * - Aggiorna i conferimenti di origine con l'ID della molitura creata
 * - Aggiorna la giacenza della cisterna di destinazione
 * 
 * IMPORTANTE:
 * Tutte le operazioni vengono eseguite in una transazione atomica.
 * Se una qualsiasi operazione fallisce, viene eseguito il rollback di tutte le modifiche.
 * 
 * @author CLOUD3 SRL
 * @modified 2025-04-25
 */

import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '../../utils/logger';
import { Sql } from '@prisma/client/runtime/library';

// Use the existing Prisma instance
const prisma = new PrismaClient();
const logger = new Logger('MolituraCProprioController');

// Debug log to check if the controller is loaded
logger.info('MolituraCProprioController module initialized');

export class MolituraCProprioController {
  /**
   * Gestisce la registrazione di una molitura conto proprio
   * 
   * Questo metodo processa una richiesta di creazione molitura conto proprio, includendo:
   * - Validazione dei dati in ingresso
   * - Recupero dei conferimenti selezionati
   * - Creazione del record di molitura con tutti i campi richiesti
   * - Aggiornamento dei conferimenti di origine con il riferimento alla molitura
   * - Aggiornamento della giacenza della cisterna di destinazione
   * 
   * @param {Request} req - L'oggetto request di Express
   * @param {Response} res - L'oggetto response di Express
   * @returns {Promise<Response>} Una risposta JSON con l'esito dell'operazione
   */
  static async processMolituraCproprio(req: Request, res: Response) {
    try {
      console.log('processMolituraCproprio called');
      const { companyId } = req.params;
      const molituraData = req.body;
      const userId = (req.user as any)?.id;
      
      // Log dettagliato per il debugging
      console.log('Parametri molitura conto proprio:', {
        companyId,
        userId,
        molituraData
      });
      
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
      
      // Manteniamo il case originale del codice azienda
      const companyCode = company.codice;
      
      // Implementazione transazione per molitura conto proprio
      const result = await prisma.$transaction(async (prismaClient) => {
        logger.info(`Avvio transazione per registrazione molitura conto proprio`);
        
        // Verifica se ci sono conferimenti selezionati
        if (!molituraData.conferimenti_ids || !Array.isArray(molituraData.conferimenti_ids) || molituraData.conferimenti_ids.length === 0) {
          throw new Error('Nessun conferimento selezionato per la molitura');
        }
        
        const conferimentiIds = molituraData.conferimenti_ids;
        logger.info(`Elaborazione di ${conferimentiIds.length} conferimenti per molitura conto proprio`);
        
        // Aggiorna i record dei conferimenti impostando flag_molito = true e flag_sono_molitura = true
        logger.info(`Aggiornamento flag_molito per ${conferimentiIds.length} conferimenti`);
        
        // Verifica se ci sono ID validi e crea una stringa con gli ID separati da virgola
        if (conferimentiIds.length > 0) {
          const idList = conferimentiIds.join(',');
          
          // Recupera informazioni dettagliate sui conferimenti
          const conferimentiInfo = await prismaClient.$queryRawUnsafe<any[]>(`
            SELECT * FROM ${companyCode}_movimenti
            WHERE id IN (${idList})
          `);
          
          if (conferimentiInfo.length === 0) {
            throw new Error('Nessun conferimento trovato con gli ID forniti');
          }
          
          // Ottieni informazioni sull'articolo olio
          let articoloOlio = null;
          if (molituraData.olio_id) {
            const olioResults = await prismaClient.$queryRawUnsafe<any[]>(`
              SELECT * FROM articoli WHERE id = ${molituraData.olio_id}
            `);
            if (olioResults.length > 0) {
              articoloOlio = olioResults[0];
            }
          }
          
          // Genera un progressivo per l'operazione
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
            
            logger.info(`Progressivo generato: ${progressivoNum}`);
          } catch (error) {
            logger.error("Errore nella generazione del progressivo:", error);
            // Continue with default progressivo = 1
          }
          
          // Marca tutti i conferimenti come moliti
          await prismaClient.$executeRawUnsafe(`
            UPDATE ${companyCode}_movimenti
            SET flag_molito = true,
                flag_sono_molitura = true,
                updated_at = NOW()
            WHERE id IN (${idList})
          `);
          
          logger.info(`Conferimenti aggiornati con flag_molito = true e flag_sono_molitura = true`);
          
          // Ottieni il primo conferimento per i dati di riferimento
          const primoConferimento = conferimentiInfo[0];
          let dataOp;
          try {
            // Formatta correttamente la data per evitare problemi di tipo
            if (molituraData.data_ora_molitura) {
              // Estrai solo la parte data (YYYY-MM-DD) per campo04 che è di tipo DATE
              const date = new Date(molituraData.data_ora_molitura);
              dataOp = date.toISOString().split('T')[0]; // Solo YYYY-MM-DD
            } else {
              // Usa la data corrente formattata correttamente
              const date = new Date();
              dataOp = date.toISOString().split('T')[0]; // Solo YYYY-MM-DD
            }
            logger.info(`Data operazione formattata: ${dataOp}`);
          } catch (dateError) {
            logger.error(`Errore nella formattazione della data:`, dateError);
            // Fallback su formato semplice YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];
            dataOp = today;
          }
          
          // Creazione record nella tabella movimenti per la molitura conto proprio
          try {
            // Ottieni le informazioni sulla categoria dell'olio
            let categoriaOlio = null;
            if (articoloOlio && articoloOlio.id_categoria) {
              const categoriaResults = await prismaClient.$queryRawUnsafe<any[]>(`
                SELECT * FROM categorie WHERE id = ${articoloOlio.id_categoria}
              `);
              if (categoriaResults.length > 0) {
                categoriaOlio = categoriaResults[0];
              }
            }
            
            // Ottieni la macroarea e origine specifica dell'olio
            const macroareaOlio = articoloOlio?.id_macroarea || null;
            const origineSpecificaOlio = articoloOlio?.origispeci || null;
            
            // Verifica flag per articolo olive e olio
            const flagBioOlive = primoConferimento.campo35 === 'X' ? 'X' : null;
            const flagBioOlio = articoloOlio?.flag_bio === true ? 'X' : null;
            const flagPsOlio = articoloOlio?.flag_ps === true ? 'X' : null;
            const flagEfOlio = articoloOlio?.flag_ef === true ? 'X' : null;
            
            // Imposta la descrizione del movimento come richiesto
            const descrizioneMovimento = "Molitura c/proprio";
            
            logger.info(`Descrizione movimento: ${descrizioneMovimento}`);
            
            const tableName = `${companyCode}_movimenti`;
            
            // Tutte le query vengono eseguite in una singola transazione
            // Se qualsiasi operazione fallisce, viene eseguito automaticamente il rollback di tutte le operazioni
            
            logger.info('Inizio della sequenza di operazioni di scrittura (tutto sarà in transazione)');
            
            try {
              // 1. Inseriamo il record principale di molitura
              await prismaClient.$executeRawUnsafe(`
                INSERT INTO "${tableName}" (
                  flag_sono_conferimento,
                  flag_sono_molitura,
                  campo01,
                  campo02,
                  campo03,
                  campo04,
                  campo07,
                  campo11,
                  campo12,
                  campo17,
                  campo18,
                  campo49,
                  descrizione_movimento,
                  id_articolo_inizio,
                  id_articolo_fine,
                  created_at,
                  updated_at
                ) VALUES (
                  true,
                  true,
                  'IT02497740999',
                  ${primoConferimento.campo02 ? `'${primoConferimento.campo02}'` : 'NULL'},
                  ${progressivoNum},
                  '${dataOp}'::date,
                  'B3',
                  ${molituraData.kg_olive_totali || 0},
                  ${molituraData.cisterna_id ? `'${molituraData.cisterna_id}'` : 'NULL'},
                  ${primoConferimento.campo17 || 'NULL'},
                  ${primoConferimento.campo18 ? `'${primoConferimento.campo18}'` : 'NULL'},
                  'I',
                  '${descrizioneMovimento}',
                  ${molituraData.oliva_id},
                  ${molituraData.olio_id || 'NULL'},
                  NOW(),
                  NOW()
                )
              `);
              
              // 2. Recuperiamo l'ID del record appena inserito
              let movimentoId = 0;
              const lastInsertIdResult = await prismaClient.$queryRawUnsafe(`
                  SELECT currval(pg_get_serial_sequence('${tableName}', 'id')) as last_id
              `);
              
              if (Array.isArray(lastInsertIdResult) && lastInsertIdResult.length > 0) {
                  movimentoId = lastInsertIdResult[0].last_id;
                  logger.info(`ID movimento inserito: ${movimentoId}`);
              } else {
                  throw new Error('Impossibile ottenere l\'ID del movimento appena inserito');
              }
              
              // 3. Aggiungiamo i campi aggiuntivi al record di molitura
              // Costruiamo una singola query per aggiornare tutti i campi aggiuntivi
              let updateFields = [];
              let hasUpdates = false;
              
              // Aggiungi campo16 (categoria olio)
              if (molituraData.olio_id && articoloOlio && articoloOlio.id_categoria) {
                  updateFields.push(`campo16 = ${articoloOlio.id_categoria}`);
                  hasUpdates = true;
              }
              
              // Aggiungi campo19 (macroarea olio)
              if (articoloOlio?.id_macroarea) {
                  updateFields.push(`campo19 = ${articoloOlio.id_macroarea}`);
                  hasUpdates = true;
              }
              
              // Aggiungi campo20 (origine specifica olio)
              if (articoloOlio?.origispeci) {
                  updateFields.push(`campo20 = '${articoloOlio.origispeci}'`);
                  hasUpdates = true;
              }
              
              // Aggiungi flag PS (campo32)
              if (articoloOlio?.flag_ps === true) {
                  updateFields.push(`campo32 = 'X'`);
                  hasUpdates = true;
              }
              
              // Aggiungi flag EF (campo34)
              if (articoloOlio?.flag_ef === true) {
                  updateFields.push(`campo34 = 'X'`);
                  hasUpdates = true;
              }
              
              // Aggiungi flag bio olive (campo35)
              if (primoConferimento.campo35 === 'X') {
                  updateFields.push(`campo35 = 'X'`);
                  hasUpdates = true;
              }
              
              // Aggiungi flag bio olio (campo36)
              if (articoloOlio?.flag_bio === true) {
                  updateFields.push(`campo36 = 'X'`);
                  hasUpdates = true;
              }
              
              // Aggiungi data raccolta olive (campo41)
              if (primoConferimento.campo41) {
                  try {
                      // Formato standard per date in PostgreSQL: 'YYYY-MM-DD'
                      const date = new Date(primoConferimento.campo41);
                      if (!isNaN(date.getTime())) {
                          const campo41Date = date.toISOString().split('T')[0];
                          updateFields.push(`campo41 = '${campo41Date}'::date`);
                          hasUpdates = true;
                      } else {
                          logger.warn(`Data campo41 non valida: ${primoConferimento.campo41}`);
                      }
                  } catch (dateError) {
                      logger.warn(`Errore nella conversione della data campo41:`, dateError);
                  }
              }
              
              // Esegui l'aggiornamento se ci sono campi da aggiornare
              if (hasUpdates) {
                  await prismaClient.$executeRawUnsafe(`
                      UPDATE "${tableName}"
                      SET ${updateFields.join(', ')}
                      WHERE id = ${movimentoId}
                  `);
                  logger.info(`Aggiornati campi aggiuntivi per il movimento ID ${movimentoId}`);
              }
              
              // 4. Aggiorna i conferimenti di provenienza con l'ID della molitura
              await prismaClient.$executeRawUnsafe(`
                UPDATE "${tableName}"
                SET id_molitura = ${movimentoId},
                    updated_at = NOW()
                WHERE id IN (${idList})
              `);
              logger.info(`Aggiornati ${conferimentiIds.length} conferimenti con id_molitura = ${movimentoId}`);
              
              // 5. Aggiorna la giacenza della cisterna e il riferimento all'articolo olio
              if (molituraData.cisterna_id && molituraData.kg_olio_ottenuto && molituraData.olio_id) {
                await prismaClient.$executeRawUnsafe(`
                  UPDATE "${companyCode}_cisterne"
                  SET giacenza = COALESCE(giacenza, 0) + ${molituraData.kg_olio_ottenuto},
                      id_articolo = ${molituraData.olio_id},
                      updated_at = NOW()
                  WHERE id = '${molituraData.cisterna_id}'
                `);
                logger.info(`Aggiornata cisterna ID '${molituraData.cisterna_id}' con olio: ${molituraData.kg_olio_ottenuto} kg e id_articolo: ${molituraData.olio_id}`);
              } else if (molituraData.cisterna_id && molituraData.kg_olio_ottenuto) {
                // Caso in cui manca l'id olio (improbabile ma gestito)
                await prismaClient.$executeRawUnsafe(`
                  UPDATE "${companyCode}_cisterne"
                  SET giacenza = COALESCE(giacenza, 0) + ${molituraData.kg_olio_ottenuto},
                      updated_at = NOW()
                  WHERE id = '${molituraData.cisterna_id}'
                `);
                logger.info(`Aggiornata solo giacenza cisterna ID '${molituraData.cisterna_id}' con olio: ${molituraData.kg_olio_ottenuto} kg (id_articolo non specificato)`);
              }
              
              logger.info(`Sequenza di operazioni completata con successo per molitura ID ${movimentoId}`);
              
            } catch (error) {
              // Se qualsiasi operazione fallisce, la transazione farà automaticamente rollback
              // Ma dobbiamo comunque loggare l'errore e rilanciarlo per gestirlo correttamente
              logger.error('Errore durante le operazioni di scrittura:', error);
              throw error; // Rilancio l'errore per farlo gestire dal meccanismo di transazione
            }
            
          } catch (error) {
            logger.error(`Errore nell'inserimento del record di molitura conto proprio:`, error);
            throw error;
          }
        }
        
        return { success: true };
      });
      
      logger.info(`Transazione completata con successo`);
      
      return res.status(200).json({
        success: true,
        message: 'Molitura conto proprio elaborata con successo',
        data: {
          companyId,
          userId: userId
        }
      });
    } catch (error: any) {
      logger.error(`Errore nella registrazione della molitura conto proprio:`, error);
      logger.error(`Stack trace:`, error.stack);
      return res.status(500).json({
        success: false,
        message: `Errore nella registrazione della molitura conto proprio: ${error.message}`,
        error: error.message,
        stack: error.stack
      });
    }
  }
}