import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../../utils/logger';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const logger = new Logger('SianController');

/**
 * Controller per la gestione delle operazioni relative al SIAN
 */
export class SianController {
  /**
   * Genera un file XML per il SIAN in base ai movimenti selezionati
   */
  static async generaXml(req: Request, res: Response) {
    const { companyCode } = req.params;
    const { movimentiIds } = req.body;
    
    if (!movimentiIds || !Array.isArray(movimentiIds) || movimentiIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Devi selezionare almeno un movimento per generare il file XML'
      });
    }
    
    try {
      // Ottieni il codice azienda
      const company = await prisma.aziende.findFirst({
        where: { codice: companyCode }
      });
      
      if (!company) {
        return res.status(404).json({
          success: false,
          message: `Azienda con codice ${companyCode} non trovata`
        });
      }
      
      // Ottieni i movimenti selezionati
      const fullTableName = `${companyCode.toLowerCase()}_movimenti`;
      const movimentiQuery = `
        SELECT * FROM "${fullTableName}" 
        WHERE id IN (${movimentiIds.join(',')})
      `;
      
      const movimentiResult = await prisma.$queryRawUnsafe(movimentiQuery);
      // Assicuriamoci che movimenti sia sempre un array
      const movimenti = Array.isArray(movimentiResult) ? movimentiResult : [];
      
      if (movimenti.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nessun movimento trovato con gli ID forniti'
        });
      }
      
      // Genera il file XML
      const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
      const xmlFileName = `sian_export_${companyCode.toLowerCase()}_${timestamp}.xml`;
      const xmlFilePath = path.join(process.cwd(), 'exports', xmlFileName);
      
      // Assicurati che la directory exports esista
      if (!fs.existsSync(path.join(process.cwd(), 'exports'))) {
        fs.mkdirSync(path.join(process.cwd(), 'exports'), { recursive: true });
      }
      
      // Genera il contenuto XML (questo è solo un esempio)
      const xmlContent = generaContenutoXml(movimenti, company);
      
      // Scrivi il file XML
      fs.writeFileSync(xmlFilePath, xmlContent);
      
      // Aggiorna i movimenti nel database impostando flag_sian_generato = true
      const updateQuery = `
        UPDATE "${fullTableName}" 
        SET flag_sian_generato = true,
            data_generazione_sian = NOW() 
        WHERE id IN (${movimentiIds.join(',')})
      `;
      
      await prisma.$executeRawUnsafe(updateQuery);
      
      // Registra l'operazione nel log
      await prisma.syslog.create({
        data: {
          livello: 'INFO',
          messaggio: `Generato file XML SIAN per ${movimentiIds.length} movimenti`,
          dettagli: `File: ${xmlFileName}`,
          user_id: (req.user as any)?.id,
          ip_address: req.ip
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'File XML generato con successo',
        data: {
          fileName: xmlFileName,
          filePath: xmlFilePath,
          movimentiCount: Array.isArray(movimenti) ? movimenti.length : 0
        }
      });
    } catch (error: any) {
      logger.error('Errore durante la generazione del file XML SIAN:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore durante la generazione del file XML',
        error: error.message
      });
    }
  }
  
  /**
   * Ottiene l'elenco dei file XML già generati
   */
  static async getFilesList(req: Request, res: Response) {
    const { companyCode } = req.params;
    
    try {
      const exportsPath = path.join(process.cwd(), 'exports');
      
      // Assicurati che la directory exports esista
      if (!fs.existsSync(exportsPath)) {
        fs.mkdirSync(exportsPath, { recursive: true });
      }
      
      // Leggi tutti i file nella directory
      const files = fs.readdirSync(exportsPath);
      
      // Filtra solo i file XML relativi all'azienda
      const companyFiles = files.filter(file => 
        file.startsWith(`sian_export_${companyCode.toLowerCase()}`) && 
        file.endsWith('.xml')
      );
      
      // Ottieni info sui file
      const filesInfo = companyFiles.map(file => {
        const filePath = path.join(exportsPath, file);
        const stats = fs.statSync(filePath);
        
        return {
          fileName: file,
          fileSize: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      });
      
      return res.status(200).json({
        success: true,
        data: filesInfo
      });
    } catch (error: any) {
      logger.error('Errore durante il recupero dei file XML:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore durante il recupero dei file XML',
        error: error.message
      });
    }
  }
  
  /**
   * Scarica un file XML specifico
   */
  static async downloadFile(req: Request, res: Response) {
    const { companyCode, fileName } = req.params;
    
    try {
      const filePath = path.join(process.cwd(), 'exports', fileName);
      
      // Verifica che il file esista
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File non trovato'
        });
      }
      
      // Verifica che il file sia relativo all'azienda
      if (!fileName.startsWith(`sian_export_${companyCode.toLowerCase()}`)) {
        return res.status(403).json({
          success: false,
          message: 'Non hai accesso a questo file'
        });
      }
      
      // Invia il file
      return res.download(filePath);
    } catch (error: any) {
      logger.error('Errore durante il download del file XML:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore durante il download del file XML',
        error: error.message
      });
    }
  }
}

/**
 * Funzione di supporto per generare il contenuto XML
 */
function generaContenutoXml(movimenti: any[], company: any): string {
  if (!movimenti || !Array.isArray(movimenti)) {
    movimenti = [];
  }
  
  // Intestazione XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<RegistroOlio xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Intestazione>
    <SoftwareId>AppFrantoi</SoftwareId>
    <Versione>1.0</Versione>
    <DataGenerazione>${new Date().toISOString().slice(0, 10)}</DataGenerazione>
    <AziendaId>${company.id}</AziendaId>
    <AziendaCodiceFiscale>${company.codice}</AziendaCodiceFiscale>
  </Intestazione>
  <Movimenti>
`;

  // Aggiungi i movimenti
  movimenti.forEach((movimento: any) => {
    xml += `    <Movimento>
      <Id>${movimento.id}</Id>
      <DataOperazione>${formatDate(movimento.data_operazione)}</DataOperazione>
      <CodiceOperazione>${movimento.cod_operazione || ''}</CodiceOperazione>
      <Descrizione>${escapeXml(movimento.descrizione_operazione || '')}</Descrizione>
      <Quantita>${movimento.quantita || 0}</Quantita>
      <UnitaMisura>${movimento.unita_misura || 'KG'}</UnitaMisura>
      <Soggetto>${escapeXml(movimento.nome_soggetto || '')}</Soggetto>
      <!-- Altri campi come da specifica SIAN -->
    </Movimento>
`;
  });

  // Chiusura XML
  xml += `  </Movimenti>
</RegistroOlio>`;

  return xml;
}

/**
 * Funzione di supporto per formattare le date nel formato YYYY-MM-DD
 */
function formatDate(dateString: string | Date | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().slice(0, 10);
}

/**
 * Funzione di supporto per fare l'escape dei caratteri speciali in XML
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}