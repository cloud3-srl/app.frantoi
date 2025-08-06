import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../../utils/logger';

const prisma = new PrismaClient();
const logger = new Logger('TablesController');

export class TablesController {
  // Metodi generici per le tabelle comuni
  static async getAll(req: Request, res: Response) {
    const { tableName } = req.params;
    const { where } = req.query;
    
    try {
      let data;
      
      // Seleziona dinamicamente la tabella corretta
      switch(tableName) {
        case 'articoli':
          // Controllo se ci sono filtri
          let whereClause = {};
          if (where) {
            try {
              if (typeof where === 'string') {
                whereClause = JSON.parse(where);
              } else if (typeof where === 'object') {
                whereClause = where;
              }
            } catch (e) {
              logger.error('Errore nel parsing del filtro where:', e);
            }
          }
          
          // Costruisci la clausola where in base ai filtri
          let whereCondition: any = {};
          
          // Filtro per tipologia
          if (whereClause && 'tipologia' in whereClause) {
            const tipologiaValue = whereClause.tipologia as string;
            whereCondition.tipologia = tipologiaValue;
          }
          
          // Filtro per descrizione (anche contenuta, case insensitive)
          if (whereClause && 'descrizione' in whereClause) {
            const descrizioneValue = whereClause.descrizione as string;
            whereCondition.descrizione = {
              contains: descrizioneValue,
              mode: 'insensitive'
            };
          }
          
          // Se ci sono condizioni di filtro, le applichiamo
          if (Object.keys(whereCondition).length > 0) {
            data = await prisma.articoli.findMany({
              where: whereCondition,
              include: {
                categoria: true,
                area: true,
                iva: true
              }
            });
          } else {
            data = await prisma.articoli.findMany({
              include: {
                categoria: true,
                area: true,
                iva: true
              }
            });
          }
          break;
        case 'categorie_olio':
          data = await prisma.categorie_olio.findMany();
          break;
        case 'macroaree':
          data = await prisma.macroaree.findMany();
          break;
        case 'origini_specifiche':
          data = await prisma.origini_specifiche.findMany();
          break;
        case 'nazioni':
          data = await prisma.nazioni.findMany();
          break;
        case 'province':
          data = await prisma.province.findMany();
          break;
        case 'comuni':
          data = await prisma.comuni.findMany();
          break;
        case 'codici_iva':
          data = await prisma.codici_iva.findMany();
          break;
        case 'olive_to_oli':
          data = await prisma.olive_to_oli.findMany({
            include: {
              olive: true,
              olio: true
            }
          });
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Tabella '${tableName}' non supportata`
          });
      }
      
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error(`Errore nel recupero dati da ${tableName}:`, error);
      return res.status(500).json({
        success: false,
        message: `Errore nel recupero dati dalla tabella ${tableName}`,
        error: error.message
      });
    }
  }
  
  static async getById(req: Request, res: Response) {
    const { tableName, id } = req.params;
    
    try {
      let data;
      const recordId = parseInt(id);
      
      // Seleziona dinamicamente la tabella corretta
      switch(tableName) {
        case 'articoli':
          data = await prisma.articoli.findUnique({ 
            where: { id: recordId },
            include: {
              categoria: true,
              area: true,
              iva: true
            }
          });
          break;
        case 'categorie_olio':
          data = await prisma.categorie_olio.findUnique({ where: { id: recordId } });
          break;
        case 'macroaree':
          data = await prisma.macroaree.findUnique({ where: { id: recordId } });
          break;
        case 'origini_specifiche':
          data = await prisma.origini_specifiche.findUnique({ where: { id: recordId } });
          break;
        case 'nazioni':
          data = await prisma.nazioni.findUnique({ where: { id: recordId } });
          break;
        case 'province':
          data = await prisma.province.findUnique({ where: { id: recordId } });
          break;
        case 'comuni':
          data = await prisma.comuni.findUnique({ where: { id: recordId } });
          break;
        case 'codici_iva':
          data = await prisma.codici_iva.findUnique({ where: { id: recordId } });
          break;
        case 'olive_to_oli':
          data = await prisma.olive_to_oli.findUnique({ 
            where: { id: recordId },
            include: {
              olive: true,
              olio: true
            }
          });
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Tabella '${tableName}' non supportata`
          });
      }
      
      if (!data) {
        return res.status(404).json({
          success: false,
          message: `Record con ID ${id} non trovato nella tabella ${tableName}`
        });
      }
      
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error(`Errore nel recupero record da ${tableName}:`, error);
      return res.status(500).json({
        success: false,
        message: `Errore nel recupero record dalla tabella ${tableName}`,
        error: error.message
      });
    }
  }
  
  static async create(req: Request, res: Response) {
    const { tableName } = req.params;
    const data = req.body;
    
    try {
      let result;
      
      // Seleziona dinamicamente la tabella corretta
      switch(tableName) {
        case 'articoli':
          // Rimuovi i campi relazionali che non devono essere inclusi nella creazione diretta
          const { id, categoria, area, iva, olive_olio, olio_olive, ...createData } = data;
          
          // Gestione dei campi opzionali per gli articoli
          const articoloData = {
            ...createData,
            // Assicurati che il campo origispeci non sia mai null ma stringa vuota
            origispeci: createData.origispeci || '',
            // Assicurati che unita_misura abbia un valore predefinito
            unita_misura: createData.unita_misura || 'KG'
          };
          result = await prisma.articoli.create({ data: articoloData });
          break;
        case 'categorie_olio':
          result = await prisma.categorie_olio.create({ data });
          break;
        case 'macroaree':
          result = await prisma.macroaree.create({ data });
          break;
        case 'origini_specifiche':
          result = await prisma.origini_specifiche.create({ data });
          break;
        case 'nazioni':
          result = await prisma.nazioni.create({ data });
          break;
        case 'province':
          result = await prisma.province.create({ data });
          break;
        case 'comuni':
          result = await prisma.comuni.create({ data });
          break;
        case 'codici_iva':
          result = await prisma.codici_iva.create({ data });
          break;
        case 'olive_to_oli':
          // Rimuovi eventuali oggetti relazionali nidificati che Prisma non accetta
          const { olive, olio, ...olivaOlioData } = data;
          
          // Validazione: assicurati che cod_olive e cod_olio siano presenti e validi
          if (!olivaOlioData.cod_olive || !olivaOlioData.cod_olio) {
            return res.status(400).json({
              success: false,
              message: "I campi cod_olive e cod_olio sono obbligatori"
            });
          }
          
          // Se sta impostando questa relazione come predefinita, verifichiamo che non ci siano altre predefinite per la stessa oliva
          if (olivaOlioData.flag_default) {
            const existingDefault = await prisma.olive_to_oli.findFirst({
              where: {
                cod_olive: olivaOlioData.cod_olive,
                flag_default: true
              }
            });
            
            if (existingDefault) {
              return res.status(400).json({
                success: false,
                message: "Esiste già una relazione predefinita per questa oliva. Disattiva prima quella esistente."
              });
            }
          }
          
          result = await prisma.olive_to_oli.create({ 
            data: {
              ...olivaOlioData,
              flag_default: olivaOlioData.flag_default || false
            } 
          });
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Tabella '${tableName}' non supportata`
          });
      }
      
      return res.status(201).json({
        success: true,
        data: result,
        message: `Record creato con successo nella tabella ${tableName}`
      });
    } catch (error: any) {
      logger.error(`Errore nella creazione record in ${tableName}:`, error);
      return res.status(500).json({
        success: false,
        message: `Errore nella creazione record nella tabella ${tableName}`,
        error: error.message
      });
    }
  }
  
  static async update(req: Request, res: Response) {
    const { tableName, id } = req.params;
    const data = req.body;
    
    try {
      let result;
      const recordId = parseInt(id);
      
      // Seleziona dinamicamente la tabella corretta
      switch(tableName) {
        case 'articoli':
          // Gestione dei campi opzionali per gli articoli nell'aggiornamento
          // Rimuovi i campi che non devono essere aggiornati (id e gli oggetti relazionali)
          const { id, categoria, area, iva, olive_olio, olio_olive, ...updateData } = data;
          
          const articoloData = {
            ...updateData,
            // Assicurati che il campo origispeci non sia mai null ma stringa vuota se fornito
            ...(updateData.origispeci !== undefined && { origispeci: updateData.origispeci || '' }),
            // Assicurati che unita_misura abbia un valore se fornito
            ...(updateData.unita_misura !== undefined && { unita_misura: updateData.unita_misura || 'KG' })
          };
          result = await prisma.articoli.update({ 
            where: { id: recordId },
            data: articoloData 
          });
          break;
        case 'categorie_olio':
          result = await prisma.categorie_olio.update({ 
            where: { id: recordId },
            data 
          });
          break;
        case 'macroaree':
          result = await prisma.macroaree.update({ 
            where: { id: recordId },
            data 
          });
          break;
        case 'origini_specifiche':
          result = await prisma.origini_specifiche.update({ 
            where: { id: recordId },
            data 
          });
          break;
        case 'nazioni':
          result = await prisma.nazioni.update({ 
            where: { id: recordId },
            data 
          });
          break;
        case 'province':
          result = await prisma.province.update({ 
            where: { id: recordId },
            data 
          });
          break;
        case 'comuni':
          result = await prisma.comuni.update({ 
            where: { id: recordId },
            data 
          });
          break;
        case 'codici_iva':
          result = await prisma.codici_iva.update({ 
            where: { id: recordId },
            data 
          });
          break;
        case 'olive_to_oli':
          // Rimuovi eventuali oggetti relazionali nidificati che Prisma non accetta
          const { olive, olio, ...olivaOlioUpdateData } = data;
          
          // Validazione: assicurati che cod_olive e cod_olio siano validi se forniti
          if ((olivaOlioUpdateData.cod_olive !== undefined && !olivaOlioUpdateData.cod_olive) || 
              (olivaOlioUpdateData.cod_olio !== undefined && !olivaOlioUpdateData.cod_olio)) {
            return res.status(400).json({
              success: false,
              message: "I campi cod_olive e cod_olio non possono essere vuoti se forniti"
            });
          }
          
          // Recupera la relazione attuale per verificare se stiamo modificando cod_olive o flag_default
          const currentRelation = await prisma.olive_to_oli.findUnique({
            where: { id: recordId }
          });
          
          if (!currentRelation) {
            return res.status(404).json({
              success: false,
              message: `Relazione con ID ${recordId} non trovata`
            });
          }
          
          // Determina l'ID oliva da verificare (quello nuovo se è stato modificato, altrimenti quello attuale)
          const oliveIdToCheck = olivaOlioUpdateData.cod_olive !== undefined 
            ? olivaOlioUpdateData.cod_olive 
            : currentRelation.cod_olive;
            
          // Controlla se stiamo impostando questa relazione come predefinita
          const willBeDefault = olivaOlioUpdateData.flag_default !== undefined 
            ? olivaOlioUpdateData.flag_default 
            : currentRelation.flag_default;
            
          // Se la relazione diventerà predefinita, verifichiamo che non ci siano altre predefinite
          if (willBeDefault) {
            const existingDefault = await prisma.olive_to_oli.findFirst({
              where: {
                id: { not: recordId }, // Escludiamo la relazione corrente
                cod_olive: oliveIdToCheck,
                flag_default: true
              }
            });
            
            if (existingDefault) {
              return res.status(400).json({
                success: false,
                message: "Esiste già una relazione predefinita per questa oliva. Disattiva prima quella esistente."
              });
            }
          }
          
          result = await prisma.olive_to_oli.update({ 
            where: { id: recordId },
            data: olivaOlioUpdateData 
          });
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Tabella '${tableName}' non supportata`
          });
      }
      
      return res.status(200).json({
        success: true,
        data: result,
        message: `Record aggiornato con successo nella tabella ${tableName}`
      });
    } catch (error: any) {
      logger.error(`Errore nell'aggiornamento record in ${tableName}:`, error);
      return res.status(500).json({
        success: false,
        message: `Errore nell'aggiornamento record nella tabella ${tableName}`,
        error: error.message
      });
    }
  }
  
  static async delete(req: Request, res: Response) {
    const { tableName, id } = req.params;
    
    try {
      let result;
      const recordId = parseInt(id);
      
      // Seleziona dinamicamente la tabella corretta
      switch(tableName) {
        case 'articoli':
          result = await prisma.articoli.delete({ 
            where: { id: recordId }
          });
          break;
        case 'categorie_olio':
          result = await prisma.categorie_olio.delete({ 
            where: { id: recordId }
          });
          break;
        case 'macroaree':
          result = await prisma.macroaree.delete({ 
            where: { id: recordId }
          });
          break;
        case 'origini_specifiche':
          result = await prisma.origini_specifiche.delete({ 
            where: { id: recordId }
          });
          break;
        case 'nazioni':
          result = await prisma.nazioni.delete({ 
            where: { id: recordId }
          });
          break;
        case 'province':
          result = await prisma.province.delete({ 
            where: { id: recordId }
          });
          break;
        case 'comuni':
          result = await prisma.comuni.delete({ 
            where: { id: recordId }
          });
          break;
        case 'codici_iva':
          result = await prisma.codici_iva.delete({ 
            where: { id: recordId }
          });
          break;
        case 'olive_to_oli':
          result = await prisma.olive_to_oli.delete({ 
            where: { id: recordId }
          });
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Tabella '${tableName}' non supportata`
          });
      }
      
      return res.status(200).json({
        success: true,
        data: result,
        message: `Record eliminato con successo dalla tabella ${tableName}`
      });
    } catch (error: any) {
      logger.error(`Errore nell'eliminazione record da ${tableName}:`, error);
      return res.status(500).json({
        success: false,
        message: `Errore nell'eliminazione record dalla tabella ${tableName}`,
        error: error.message
      });
    }
  }
}