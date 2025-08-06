import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../../../utils/logger';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const logger = new Logger('SianRegistryController');

/**
 * Controller per gestire le operazioni relative al registro SIAN 
 * Implementa le funzionalità per visualizzare le operazioni da inviare e generare i file XML
 */
export class SianRegistryController {
  
  /**
   * Ottieni l'elenco dei movimenti che non sono ancora stati inviati al SIAN
   */
  static async getMovimentiDaInviare(req: Request, res: Response) {
    const { companyCode } = req.params;
    const userId = (req.user as any)?.id;
    const isAdmin = (req.user as any)?.isAdmin === true;
    
    try {
      // Ottieni l'azienda
      const company = await prisma.aziende.findFirst({
        where: { codice: companyCode }
      });
      
      if (!company) {
        return res.status(404).json({
          success: false,
          message: `Azienda con codice ${companyCode} non trovata`
        });
      }
      
      // Verifica che l'utente abbia accesso all'azienda
      const userHasAccess = await prisma.user_aziende.findFirst({
        where: {
          user_id: userId,
          azienda_id: company.id
        }
      });
      
      // Se l'utente non è admin e non ha accesso all'azienda, ritorna errore
      if (!isAdmin && !userHasAccess) {
        return res.status(403).json({
          success: false,
          message: `Non hai accesso a questa azienda`
        });
      }
      
      // Nome della tabella movimenti specifica per l'azienda
      const tableCode = companyCode.toLowerCase();
      const movimentiTable = `${tableCode}_movimenti`;
      
      // Query per ottenere tutti i movimenti che non sono ancora stati inviati al SIAN
      // Nota: i movimenti possono avere campi id_articolo_inizio e id_articolo_fine, non id_articolo
      const query = `
        SELECT m.*, s.descrizione as nome_soggetto, 
               a_inizio.descrizione as descrizione_articolo_inizio,
               a_fine.descrizione as descrizione_articolo_fine
        FROM "${movimentiTable}" m
        LEFT JOIN "${tableCode}_soggetti" s ON m.id_soggetto = s.id
        LEFT JOIN "${tableCode}_articoli" a_inizio ON m.id_articolo_inizio = a_inizio.id
        LEFT JOIN "${tableCode}_articoli" a_fine ON m.id_articolo_fine = a_fine.id
        WHERE m.flag_sian_generato = false OR m.flag_sian_generato IS NULL
        ORDER BY m.campo04 DESC, m.id DESC
      `;
      
      // Esegui la query
      const movimenti = await prisma.$queryRawUnsafe(query);
      
      return res.status(200).json({
        success: true,
        data: movimenti
      });
    } catch (error: any) {
      logger.error(`Errore durante il recupero dei movimenti da inviare: ${error.message}`, error);
      return res.status(500).json({
        success: false,
        message: 'Errore durante il recupero dei movimenti da inviare',
        error: error.message
      });
    }
  }
  
  /**
   * Genera un file XML per il SIAN in base ai movimenti selezionati
   */
  static async generaXml(req: Request, res: Response) {
    const { companyCode } = req.params;
    const { movimentiIds } = req.body;
    const userId = (req.user as any)?.id;
    
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
      
      // Verifica che l'utente abbia accesso all'azienda
      const userHasAccess = await prisma.user_aziende.findFirst({
        where: {
          user_id: userId,
          azienda_id: company.id
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
      
      // Ottieni i movimenti selezionati
      const tableCode = companyCode.toLowerCase();
      const movimentiTable = `${tableCode}_movimenti`;
      
      const movimentiQuery = `
        SELECT m.*, s.descrizione as nome_soggetto, 
               a_inizio.descrizione as descrizione_articolo_inizio,
               a_fine.descrizione as descrizione_articolo_fine
        FROM "${movimentiTable}" m
        LEFT JOIN "${tableCode}_soggetti" s ON m.id_soggetto = s.id
        LEFT JOIN "${tableCode}_articoli" a_inizio ON m.id_articolo_inizio = a_inizio.id
        LEFT JOIN "${tableCode}_articoli" a_fine ON m.id_articolo_fine = a_fine.id
        WHERE m.id IN (${movimentiIds.join(',')})
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
      
      // Valida i dati prima di generare il file XML
      const validationErrors = validaMovimentiSIAN(movimenti);
      if (validationErrors.length > 0) {
        logger.warn(`Errori di validazione SIAN per ${companyCode}:`, validationErrors);
        
        // Procedi comunque, ma avvisa l'utente degli errori
        const warningMessage = validationErrors.length === 1 
          ? 'Attenzione: è stato rilevato un problema di validazione' 
          : `Attenzione: sono stati rilevati ${validationErrors.length} problemi di validazione`;
        
        // Registra gli errori di validazione nel log
        await prisma.syslog.create({
          data: {
            livello: 'WARNING',
            messaggio: `Validazione SIAN: ${validationErrors.length} errori`,
            dettagli: JSON.stringify(validationErrors.slice(0, 5)) + 
                    (validationErrors.length > 5 ? ' ...' : ''),
            user_id: userId,
            ip_address: req.ip
          }
        });
      }
      
      // Genera il file XML
      const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
      const xmlFileName = `sian_export_${tableCode}_${timestamp}.xml`;
      
      // Assicurati che la directory exports esista
      const exportsDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      const xmlFilePath = path.join(exportsDir, xmlFileName);
      
      // Genera il contenuto XML
      const xmlContent = generaContenutoXml(movimenti, company);
      
      // Scrivi il file XML
      fs.writeFileSync(xmlFilePath, xmlContent);
      
      // Aggiorna i movimenti nel database impostando flag_sian_generato = true
      const updateQuery = `
        UPDATE "${movimentiTable}" 
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
          user_id: userId,
          ip_address: req.ip
        }
      });
      
      return res.status(200).json({
        success: true,
        message: validationErrors.length > 0
          ? `File XML generato con successo, ma con ${validationErrors.length} avvisi di validazione. Il file potrebbe richiedere correzioni prima dell'invio al SIAN.`
          : 'File XML generato con successo',
        data: {
          fileName: xmlFileName,
          filePath: xmlFilePath,
          movimentiCount: movimenti.length,
          validationWarnings: validationErrors.length > 0 ? validationErrors : undefined
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
  
  /**
   * Registra un file come inviato al SIAN e aggiorna i movimenti associati
   */
  static async markFileAsSent(req: Request, res: Response) {
    const { companyCode } = req.params;
    const { fileName, movimentiIds = [] } = req.body;
    const userId = (req.user as any)?.id;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Il nome del file è obbligatorio'
      });
    }
    
    try {
      // Verifica che il file esista
      const filePath = path.join(process.cwd(), 'exports', fileName);
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
      
      // Ottieni l'azienda
      const company = await prisma.aziende.findFirst({
        where: { codice: companyCode }
      });
      
      if (!company) {
        return res.status(404).json({
          success: false,
          message: `Azienda con codice ${companyCode} non trovata`
        });
      }
      
      // Setup tabella movimenti
      const tableCode = companyCode.toLowerCase();
      const movimentiTable = `${tableCode}_movimenti`;
      
      // Cerca i movimenti associati al file
      // Se movimentiIds è vuoto, dobbiamo cercare i movimenti in base al nome del file
      let movimentiDaMarcare: number[] = [];
      
      if (movimentiIds.length > 0) {
        // Usa gli ID forniti dal client
        movimentiDaMarcare = movimentiIds;
      } else {
        // Cerca i movimenti in base al timestamp nel nome del file
        // es. sian_export_azienda_20250419123456.xml
        const timestampMatch = fileName.match(/sian_export_[\w]+_(\d+)\.xml/);
        
        if (timestampMatch && timestampMatch[1]) {
          const fileTimestamp = timestampMatch[1];
          // Cerca i movimenti generati nello stesso giorno
          // Usiamo solo la parte della data (anno, mese, giorno)
          const dataGenerazione = fileTimestamp.substring(0, 8);
          
          // Query per trovare i movimenti generati nella stessa data del file
          const query = `
            SELECT id FROM "${movimentiTable}"
            WHERE flag_sian_generato = true 
            AND flag_sian_inviato = false
            AND DATE(data_generazione_sian) = DATE('${dataGenerazione.substring(0, 4)}-${dataGenerazione.substring(4, 6)}-${dataGenerazione.substring(6, 8)}')
          `;
          
          const result = await prisma.$queryRawUnsafe(query);
          if (Array.isArray(result)) {
            movimentiDaMarcare = result.map((r: any) => r.id);
          }
        }
      }
      
      if (movimentiDaMarcare.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Nessun movimento da aggiornare per questo file',
          data: {
            fileName,
            movimentiAggiornati: 0
          }
        });
      }
      
      // Aggiorna i movimenti nel database impostando flag_sian_inviato = true
      const updateQuery = `
        UPDATE "${movimentiTable}" 
        SET flag_sian_inviato = true,
            data_invio_sian = NOW() 
        WHERE id IN (${movimentiDaMarcare.join(',')})
        AND flag_sian_generato = true
        AND (flag_sian_inviato = false OR flag_sian_inviato IS NULL)
      `;
      
      const updateResult = await prisma.$executeRawUnsafe(updateQuery);
      
      // Registra l'operazione nel log
      await prisma.syslog.create({
        data: {
          livello: 'INFO',
          messaggio: `Registrato invio file SIAN: ${fileName}`,
          dettagli: `Movimenti aggiornati: ${updateResult}`,
          user_id: userId,
          ip_address: req.ip
        }
      });
      
      // Crea una copia del file in una cartella "sent" per tenere traccia dei file inviati
      const sentDir = path.join(process.cwd(), 'exports', 'sent');
      if (!fs.existsSync(sentDir)) {
        fs.mkdirSync(sentDir, { recursive: true });
      }
      
      // Aggiungiamo un suffisso alla copia per indicare quando è stato inviato
      const sentTimestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
      const sentFileName = `${path.parse(fileName).name}_sent_${sentTimestamp}${path.parse(fileName).ext}`;
      const sentFilePath = path.join(sentDir, sentFileName);
      
      // Copia il file
      fs.copyFileSync(filePath, sentFilePath);
      
      return res.status(200).json({
        success: true,
        message: `File ${fileName} registrato come inviato al SIAN con successo`,
        data: {
          fileName,
          movimentiAggiornati: updateResult
        }
      });
    } catch (error: any) {
      logger.error('Errore durante la registrazione dell\'invio del file SIAN:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore durante la registrazione dell\'invio del file SIAN',
        error: error.message
      });
    }
  }
}

/**
 * Funzione di supporto per generare il contenuto XML
 * Implementa lo standard SIAN per il registro telematico dell'olio d'oliva
 */
function generaContenutoXml(movimenti: any[], company: any): string {
  if (!movimenti || !Array.isArray(movimenti)) {
    movimenti = [];
  }
  
  // Intestazione XML secondo il formato SIAN
  const dataGenerazione = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<RegistroOlio xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="registroolio.xsd">
  <Intestazione>
    <SoftwareId>AppFrantoi</SoftwareId>
    <Versione>1.0</Versione>
    <DataGenerazione>${dataGenerazione}</DataGenerazione>
    <OraGenerazione>${timestamp.slice(9, 13)}</OraGenerazione>
    <CodiceFiscale>${company.codice_fiscale || company.codice}</CodiceFiscale>
    <DenominazioneSocieta>${escapeXml(company.ragione_sociale || company.nome || '')}</DenominazioneSocieta>
  </Intestazione>
  <Movimenti>
`;

  // Aggiungi i movimenti con tutti i campi richiesti dallo standard SIAN
  movimenti.forEach((movimento: any) => {
    // Processo i campi secondo le specifiche SIAN, gestendo anche i campi mancanti o nulli
    xml += `    <Movimento>
      <CAMPO01>${escapeXml(movimento.campo01 || company.codice_fiscale || company.codice || '')}</CAMPO01>
      <CAMPO02>${escapeXml(movimento.campo02 || '')}</CAMPO02>
      <CAMPO03>${movimento.campo03 || movimento.id || ''}</CAMPO03>
      <CAMPO04>${formatSianDate(movimento.campo04)}</CAMPO04>
      <CAMPO05>${escapeXml(movimento.campo05 || '')}</CAMPO05>
      <CAMPO06>${formatSianDate(movimento.campo06)}</CAMPO06>
      <CAMPO07>${escapeXml(movimento.campo07 || '')}</CAMPO07>
      <CAMPO08>${escapeXml(movimento.campo08 || '')}</CAMPO08>
      <CAMPO09>${escapeXml(movimento.campo09 || '')}</CAMPO09>
      <CAMPO10>${formatSianNumber(movimento.campo10)}</CAMPO10>
      <CAMPO11>${formatSianNumber(movimento.campo11)}</CAMPO11>
      <CAMPO12>${escapeXml(movimento.campo12 || '')}</CAMPO12>
      <CAMPO13>${escapeXml(movimento.campo13 || '')}</CAMPO13>
      <CAMPO14>${escapeXml(movimento.campo14 || '')}</CAMPO14>
      <CAMPO15>${escapeXml(movimento.campo15 || '')}</CAMPO15>
      <CAMPO16>${escapeXml(movimento.campo16 || '')}</CAMPO16>
      <CAMPO17>${escapeXml(movimento.campo17 || '')}</CAMPO17>
      <CAMPO18>${escapeXml(movimento.campo18 || '')}</CAMPO18>
      <CAMPO19>${escapeXml(movimento.campo19 || '')}</CAMPO19>
      <CAMPO20>${escapeXml(movimento.campo20 || '')}</CAMPO20>
      <CAMPO21>${formatSianNumber(movimento.campo21)}</CAMPO21>
      <CAMPO22>${formatSianNumber(movimento.campo22)}</CAMPO22>
      <CAMPO23>${formatSianNumber(movimento.campo23)}</CAMPO23>
      <CAMPO24>${formatSianNumber(movimento.campo24)}</CAMPO24>
      <CAMPO25>${formatSianNumber(movimento.campo25)}</CAMPO25>
      <CAMPO26>${formatSianNumber(movimento.campo26)}</CAMPO26>
      <CAMPO27>${formatSianNumber(movimento.campo27)}</CAMPO27>
      <CAMPO28>${escapeXml(movimento.campo28 || '')}</CAMPO28>
      <CAMPO29>${escapeXml(movimento.campo29 || '')}</CAMPO29>
      <CAMPO30>${escapeXml(movimento.campo30 || '')}</CAMPO30>
      <CAMPO31>${escapeXml(movimento.campo31 || '')}</CAMPO31>
      <CAMPO32>${escapeXml(movimento.campo32 || '')}</CAMPO32>
      <CAMPO33>${escapeXml(movimento.campo33 || '')}</CAMPO33>
      <CAMPO34>${escapeXml(movimento.campo34 || '')}</CAMPO34>
      <CAMPO35>${escapeXml(movimento.campo35 || '')}</CAMPO35>
      <CAMPO36>${escapeXml(movimento.campo36 || '')}</CAMPO36>
      <CAMPO37>${escapeXml(movimento.campo37 || '')}</CAMPO37>
      <CAMPO38>${escapeXml(movimento.campo38 || '')}</CAMPO38>
      <CAMPO39>${escapeXml(movimento.campo39 || '')}</CAMPO39>
      <CAMPO40>${escapeXml(movimento.campo40 || '')}</CAMPO40>
      <CAMPO41>${formatSianDateTime(movimento.campo41)}</CAMPO41>
      <CAMPO42>${formatSianDateTime(movimento.campo42)}</CAMPO42>
      <CAMPO43>${escapeXml(movimento.campo43 || '')}</CAMPO43>
      <CAMPO44>${escapeXml(movimento.campo44 || '')}</CAMPO44>
      <CAMPO45>${escapeXml(movimento.campo45 || '')}</CAMPO45>
      <CAMPO46>${formatSianNumber(movimento.campo46)}</CAMPO46>
      <CAMPO47>${formatSianDate(movimento.campo47)}</CAMPO47>
      <CAMPO48>${escapeXml(movimento.campo48 || '')}</CAMPO48>
      <CAMPO49>${escapeXml(movimento.campo49 || '')}</CAMPO49>
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
 * Funzione di supporto per formattare le date nel formato SIAN (YYYYMMDD)
 */
function formatSianDate(dateString: string | Date | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Formato YYYYMMDD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}`;
  } catch (error) {
    return '';
  }
}

/**
 * Funzione di supporto per formattare le date e orari nel formato SIAN (YYYYMMDDHHmm)
 */
function formatSianDateTime(dateString: string | Date | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Formato YYYYMMDDHHmm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}`;
  } catch (error) {
    return '';
  }
}

/**
 * Funzione di supporto per formattare i numeri per SIAN
 * I numeri devono essere senza decimali o con 2 decimali fissi
 */
function formatSianNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return '0';
  
  try {
    const number = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(number)) return '0';
    
    // Formatta con 2 decimali e rimuovi il punto decimale (come richiesto da SIAN)
    return (Math.round(number * 100) / 100).toFixed(2).replace('.', '');
  } catch (error) {
    return '0';
  }
}

/**
 * Funzione di supporto per fare l'escape dei caratteri speciali in XML
 */
function escapeXml(unsafe: string): string {
  if (unsafe === null || unsafe === undefined) return '';
  
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Funzione per verificare che i movimenti abbiano i campi obbligatori SIAN
 * Restituisce un array di errori, vuoto se non ci sono errori
 */
function validaMovimentiSIAN(movimenti: any[]): string[] {
  const errori: string[] = [];
  
  if (!Array.isArray(movimenti)) {
    errori.push('Nessun movimento valido da validare');
    return errori;
  }
  
  // Campi obbligatori per tutti i tipi di operazione
  const campiObbligatoriComuni = [
    { campo: 'campo01', nome: 'CUAA' },
    { campo: 'campo02', nome: 'ID stabilimento' },
    { campo: 'campo03', nome: 'N° operazione' },
    { campo: 'campo04', nome: 'Data operazione' },
    { campo: 'campo07', nome: 'Codice operazione' },
  ];
  
  // Campi specifici per tipologia di operazione
  const campiPerOperazione: Record<string, { nome: string; campi: string[] }> = {
    'T1': { 
      nome: 'Carico Olive', 
      campi: ['campo08', 'campo10', 'campo17', 'campo18'] 
    },
    'T2': { 
      nome: 'Molitura', 
      campi: ['campo11', 'campo12', 'campo17', 'campo18', 'campo23'] 
    },
    'T3': { 
      nome: 'Vendita Olio', 
      campi: ['campo08', 'campo15', 'campo24'] 
    },
    'T4': { 
      nome: 'Carico Olio', 
      campi: ['campo08', 'campo15', 'campo23'] 
    },
    'T5': { 
      nome: 'Scarico Olio', 
      campi: ['campo08', 'campo15', 'campo24'] 
    },
    'CAR': { 
      nome: 'Carico', 
      campi: ['campo15', 'campo23'] 
    },
    'SCA': { 
      nome: 'Scarico', 
      campi: ['campo15', 'campo24'] 
    },
    'VEN': { 
      nome: 'Vendita', 
      campi: ['campo08', 'campo15', 'campo24'] 
    },
    'ACQ': { 
      nome: 'Acquisto', 
      campi: ['campo08', 'campo15', 'campo23'] 
    },
    'MOL': { 
      nome: 'Molitura', 
      campi: ['campo11', 'campo12', 'campo23'] 
    },
    'TRA': { 
      nome: 'Trasferimento', 
      campi: ['campo12', 'campo13', 'campo15', 'campo23', 'campo24'] 
    }
  };
  
  // Mappa dei nomi dei campi
  const nomiCampi: Record<string, string> = {
    'campo08': 'ID Fornitore/Cliente',
    'campo10': 'Quantità carico olive',
    'campo11': 'Quantità scarico olive',
    'campo12': 'ID recipiente stoccaggio',
    'campo13': 'ID recipiente destinazione',
    'campo15': 'Categoria olio',
    'campo17': 'Macroarea origine',
    'campo18': 'Origine specifica',
    'campo23': 'Qtà carico olio sfuso',
    'campo24': 'Qtà scarico olio sfuso'
  };
  
  // Valida i singoli movimenti
  movimenti.forEach((movimento, index) => {
    // Controllo campi obbligatori comuni
    campiObbligatoriComuni.forEach(campo => {
      if (!movimento[campo.campo]) {
        errori.push(`Movimento #${movimento.id || index + 1}: Campo obbligatorio ${campo.nome} (${campo.campo}) mancante`);
      }
    });
    
    // Controllo campi specifici per tipo operazione
    const codiceOperazione = movimento.campo07;
    
    if (codiceOperazione && campiPerOperazione[codiceOperazione]) {
      const { nome, campi } = campiPerOperazione[codiceOperazione];
      
      campi.forEach(campo => {
        if (!movimento[campo]) {
          errori.push(`Movimento #${movimento.id || index + 1}: Campo ${nomiCampi[campo] || campo} mancante per operazione ${nome}`);
        }
      });
    } else if (codiceOperazione) {
      // Codice operazione non riconosciuto ma presente
      errori.push(`Movimento #${movimento.id || index + 1}: Codice operazione ${codiceOperazione} non riconosciuto`);
    }
    
    // Controllo formato data
    if (movimento.campo04 && !isValidDate(movimento.campo04)) {
      errori.push(`Movimento #${movimento.id || index + 1}: Data operazione non valida`);
    }
    
    // Controllo numeri negativi per quantità
    ['campo10', 'campo11', 'campo23', 'campo24'].forEach(campo => {
      if (movimento[campo] && parseFloat(movimento[campo]) < 0) {
        errori.push(`Movimento #${movimento.id || index + 1}: ${nomiCampi[campo] || campo} non può essere negativo`);
      }
    });
  });
  
  return errori;
}

/**
 * Funzione di supporto per verificare se una data è valida
 */
function isValidDate(dateString: string | Date | null): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
}