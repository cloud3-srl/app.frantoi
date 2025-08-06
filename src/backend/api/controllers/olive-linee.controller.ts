import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../../utils/logger';

const prisma = new PrismaClient();
const logger = new Logger('OliveLineeController');

/**
 * Controller per gestire le relazioni tra tipi di olive e linee di lavorazione
 */
export class OliveLineeController {

  /**
   * Ottiene tutte le relazioni olive-linee per un'azienda
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      
      // Ottieni il codice dell'azienda dal database
      const company = await prisma.aziende.findUnique({
        where: { id: Number(companyId) }
      });
      
      if (!company) {
        res.status(404).json({ success: false, message: 'Azienda non trovata' });
        return;
      }
      
      const tableName = `${company.codice.toLowerCase()}_olive_linee`;
      
      // Verifica se la tabella esiste
      const tableExists = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )`;
      
      if (!tableExists[0].exists) {
        res.status(404).json({ 
          success: false, 
          message: 'Tabella olive_linee non trovata per questa azienda',
          tableExists: tableExists[0].exists
        });
        return;
      }
      
      // Ottieni tutte le relazioni con informazioni estese
      const query = `
        SELECT ol.id, ol.id_oliva, ol.id_linea, ol.priorita, 
               a.descrizione as olive_descrizione, 
               l.descrizione as linea_descrizione,
               l.cap_oraria
        FROM "${tableName}" ol
        JOIN "articoli" a ON ol.id_oliva = a.id
        JOIN "${company.codice.toLowerCase()}_linee" l ON ol.id_linea = l.id
        ORDER BY ol.priorita, a.descrizione
      `;
      
      const data = await prisma.$queryRawUnsafe(query);
      
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error('Errore nel recupero delle relazioni olive-linee:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero delle relazioni olive-linee',
        error: error.message 
      });
    }
  }

  /**
   * Ottiene le linee compatibili per un determinato tipo di oliva
   */
  async getLinesForOliveType(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, oliveTypeId } = req.params;
      
      // Ottieni il codice dell'azienda dal database
      const company = await prisma.aziende.findUnique({
        where: { id: Number(companyId) }
      });
      
      if (!company) {
        res.status(404).json({ success: false, message: 'Azienda non trovata' });
        return;
      }
      
      const tableName = `${company.codice.toLowerCase()}_olive_linee`;
      
      // Verifica se la tabella esiste
      const tableExists = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )`;
      
      if (!tableExists[0].exists) {
        // Se la tabella non esiste, usa il vecchio metodo (campo id_oliva nella tabella linee)
        const oldMethodQuery = `
          SELECT l.id, l.descrizione, l.cap_oraria
          FROM "${company.codice.toLowerCase()}_linee" l
          WHERE l.id_oliva = ${Number(oliveTypeId)}
          ORDER BY l.descrizione
        `;
        
        const oldMethodData = await prisma.$queryRawUnsafe(oldMethodQuery);
        
        if (Array.isArray(oldMethodData) && oldMethodData.length > 0) {
          res.status(200).json({ 
            success: true, 
            data: oldMethodData,
            method: 'legacy'
          });
        } else {
          // Se non ci sono linee specifiche, restituisci tutte le linee
          const allLinesQuery = `
            SELECT l.id, l.descrizione, l.cap_oraria
            FROM "${company.codice.toLowerCase()}_linee" l
            ORDER BY l.descrizione
          `;
          
          const allLines = await prisma.$queryRawUnsafe(allLinesQuery);
          
          res.status(200).json({ 
            success: true, 
            data: allLines,
            method: 'all_lines'
          });
        }
        return;
      }
      
      // Usa la nuova tabella olive_linee per trovare le linee compatibili
      const query = `
        SELECT l.id, l.descrizione, l.cap_oraria, ol.priorita
        FROM "${company.codice.toLowerCase()}_linee" l
        JOIN "${tableName}" ol ON l.id = ol.id_linea
        WHERE ol.id_oliva = ${Number(oliveTypeId)}
        ORDER BY ol.priorita, l.descrizione
      `;
      
      const data = await prisma.$queryRawUnsafe(query);
      
      if (Array.isArray(data) && data.length > 0) {
        res.status(200).json({ 
          success: true, 
          data,
          method: 'olive_linee'
        });
      } else {
        // Se non ci sono relazioni specifiche, restituisci tutte le linee
        const allLinesQuery = `
          SELECT l.id, l.descrizione, l.cap_oraria
          FROM "${company.codice.toLowerCase()}_linee" l
          ORDER BY l.descrizione
        `;
        
        const allLines = await prisma.$queryRawUnsafe(allLinesQuery);
        
        res.status(200).json({ 
          success: true, 
          data: allLines,
          method: 'all_lines'
        });
      }
    } catch (error: any) {
      logger.error('Errore nel recupero delle linee compatibili:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero delle linee compatibili',
        error: error.message 
      });
    }
  }

  /**
   * Crea una nuova relazione oliva-linea
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { id_oliva, id_linea, priorita = 1 } = req.body;
      
      if (!id_oliva || !id_linea) {
        res.status(400).json({ 
          success: false, 
          message: 'id_oliva e id_linea sono campi obbligatori' 
        });
        return;
      }
      
      // Ottieni il codice dell'azienda dal database
      const company = await prisma.aziende.findUnique({
        where: { id: Number(companyId) }
      });
      
      if (!company) {
        res.status(404).json({ success: false, message: 'Azienda non trovata' });
        return;
      }
      
      const tableName = `${company.codice.toLowerCase()}_olive_linee`;
      
      // Verifica se la tabella esiste
      const tableExists = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )`;
      
      if (!tableExists[0].exists) {
        res.status(404).json({ 
          success: false, 
          message: 'Tabella olive_linee non trovata per questa azienda' 
        });
        return;
      }
      
      // Verifica se la relazione esiste già
      const existingQuery = `
        SELECT id FROM "${tableName}"
        WHERE id_oliva = ${Number(id_oliva)} AND id_linea = ${Number(id_linea)}
      `;
      
      const existingRelation = await prisma.$queryRawUnsafe(existingQuery);
      
      if (Array.isArray(existingRelation) && existingRelation.length > 0) {
        // Aggiorna la relazione esistente
        const updateQuery = `
          UPDATE "${tableName}"
          SET priorita = ${Number(priorita)}, updated_at = NOW()
          WHERE id = ${(existingRelation[0] as any).id}
          RETURNING *
        `;
        
        const updatedData = await prisma.$queryRawUnsafe(updateQuery);
        
        res.status(200).json({ 
          success: true, 
          message: 'Relazione oliva-linea aggiornata',
          data: Array.isArray(updatedData) && updatedData.length > 0 ? updatedData[0] : null,
          updated: true
        });
      } else {
        // Crea una nuova relazione
        const insertQuery = `
          INSERT INTO "${tableName}" (id_oliva, id_linea, priorita)
          VALUES (${Number(id_oliva)}, ${Number(id_linea)}, ${Number(priorita)})
          RETURNING *
        `;
        
        const insertedData = await prisma.$queryRawUnsafe(insertQuery);
        
        res.status(201).json({ 
          success: true, 
          message: 'Relazione oliva-linea creata',
          data: Array.isArray(insertedData) && insertedData.length > 0 ? insertedData[0] : null,
          created: true
        });
      }
    } catch (error: any) {
      logger.error('Errore nella creazione della relazione oliva-linea:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nella creazione della relazione oliva-linea',
        error: error.message 
      });
    }
  }

  /**
   * Elimina una relazione oliva-linea
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, relationId } = req.params;
      
      // Ottieni il codice dell'azienda dal database
      const company = await prisma.aziende.findUnique({
        where: { id: Number(companyId) }
      });
      
      if (!company) {
        res.status(404).json({ success: false, message: 'Azienda non trovata' });
        return;
      }
      
      const tableName = `${company.codice.toLowerCase()}_olive_linee`;
      
      // Verifica se la tabella esiste
      const tableExists = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )`;
      
      if (!tableExists[0].exists) {
        res.status(404).json({ 
          success: false, 
          message: 'Tabella olive_linee non trovata per questa azienda' 
        });
        return;
      }
      
      // Elimina la relazione
      const deleteQuery = `
        DELETE FROM "${tableName}"
        WHERE id = ${Number(relationId)}
        RETURNING *
      `;
      
      const deletedData = await prisma.$queryRawUnsafe(deleteQuery);
      
      if (Array.isArray(deletedData) && deletedData.length > 0) {
        res.status(200).json({ 
          success: true, 
          message: 'Relazione oliva-linea eliminata',
          data: deletedData[0]
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: 'Relazione oliva-linea non trovata' 
        });
      }
    } catch (error: any) {
      logger.error('Errore nell\'eliminazione della relazione oliva-linea:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nell\'eliminazione della relazione oliva-linea',
        error: error.message 
      });
    }
  }
}