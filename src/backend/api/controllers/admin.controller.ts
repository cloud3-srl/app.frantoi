import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../../utils/logger';
import { CompanyTablesCreator } from '../../services/company/company-tables-creator';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const logger = new Logger('AdminController');

export class AdminController {
  /**
   * Esegue un backup del database
   */
  static async backupDatabase(req: Request, res: Response) {
    const userId = (req.user as any)?.id;

    try {
      // Verifica che l'utente sia admin
      const isAdmin = (req.user as any)?.isAdmin === true;
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accesso negato. Solo gli amministratori possono eseguire il backup del database.'
        });
      }

      // Ottieni la data corrente nel formato YYYYMMDD_HHMMSS
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
      
      // Nome del file di backup
      const backupFileName = `frantoio_${timestamp}.sql`;
      
      // Crea directory di backup se non esiste
      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupFilePath = path.join(backupDir, backupFileName);
      
      // Estrai i parametri di connessione da DATABASE_URL
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL non trovato nelle variabili d\'ambiente.');
      }
      
      // Estrai i parametri dalla stringa di connessione
      const urlPattern = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
      const matches = databaseUrl.match(urlPattern);
      
      if (!matches || matches.length < 6) {
        throw new Error('Formato DATABASE_URL non valido.');
      }
      
      const [, username, password, host, port, databaseName] = matches;
      const dbName = databaseName.split('?')[0]; // Rimuovi eventuali query params
      
      // Verifica se pg_dump è disponibile nel sistema
      const checkPgDumpCommand = "which pg_dump || echo 'not found'";
      try {
        const pgDumpCheck = require('child_process').execSync(checkPgDumpCommand).toString().trim();
        
        if (pgDumpCheck === 'not found') {
          logger.error("Il comando pg_dump non è disponibile nel sistema.");
          
          // Alternativa: usare un backup basato su node-postgres
          logger.info("Tentativo di backup alternativo usando metodi JavaScript...");
          
          // Crea un file di backup con informazioni base
          const backupContent = `-- Backup del database generato il ${new Date().toISOString()}
-- Questo è un backup di emergenza creato perché pg_dump non è disponibile
-- Database: ${dbName}
-- Host: ${host}
-- Porta: ${port}
-- Utente: ${username}

-- ATTENZIONE: Questo non è un backup completo del database.
-- Si consiglia di installare pg_dump per backup completi.

-- Informazioni di connessione:
-- DATABASE_URL=${databaseUrl}
`;
          
          fs.writeFileSync(backupFilePath, backupContent);
          
          // Registra l'operazione nel log
          await prisma.syslog.create({
            data: {
              livello: 'WARNING',
              messaggio: 'Backup database limitato',
              dettagli: 'Backup limitato creato perché pg_dump non è disponibile',
              user_id: userId
            }
          });
          
          return res.status(500).json({
            success: false,
            message: 'ERRORE: pg_dump non è disponibile nel sistema. Il backup NON è stato completato. Per eseguire backup, installare postgresql-client.',
            error: 'pg_dump not found',
            details: 'Per installare postgresql-client su sistemi Debian/Ubuntu: sudo apt-get install postgresql-client'
          });
        }
      } catch (error) {
        logger.error("Errore durante la verifica di pg_dump:", error);
      }
      
      // Comando pg_dump standard
      const pgDumpCommand = `PGPASSWORD=${password} pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} -F p > "${backupFilePath}"`;
      
      logger.info(`Avvio backup database su ${backupFilePath}...`);
      
      // Esegue il backup
      return new Promise((resolve, reject) => {
        exec(pgDumpCommand, async (error, stdout, stderr) => {
          if (error) {
            logger.error(`Errore durante il backup: ${error.message}`);
            
            // Registra l'errore nel log di sistema
            await prisma.syslog.create({
              data: {
                livello: 'ERROR',
                messaggio: 'Backup database fallito',
                dettagli: error.message,
                user_id: userId
              }
            });
            
            return res.status(500).json({
              success: false,
              message: `Errore durante il backup: ${error.message}`
            });
          }
          
          if (stderr) {
            logger.warn(`Avvisi durante il backup: ${stderr}`);
          }
          
          // Verifica che il file esista
          if (!fs.existsSync(backupFilePath)) {
            const errorMsg = 'File di backup non creato correttamente';
            logger.error(errorMsg);
            
            await prisma.syslog.create({
              data: {
                livello: 'ERROR',
                messaggio: 'Backup database fallito',
                dettagli: errorMsg,
                user_id: userId
              }
            });
            
            return res.status(500).json({
              success: false,
              message: errorMsg
            });
          }
          
          // Ottieni la dimensione del file
          const stats = fs.statSync(backupFilePath);
          const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
          
          logger.info(`Backup completato: ${backupFilePath} (${fileSizeInMB} MB)`);
          
          // Gestione rotazione backup (mantiene solo gli ultimi 10 backup)
          const backupFiles = fs.readdirSync(backupDir)
            .filter(file => file.startsWith('frantoio_') && file.endsWith('.sql'))
            .map(file => ({
              name: file,
              path: path.join(backupDir, file),
              time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time); // Ordina per data decrescente
          
          // Se ci sono più di 10 backup, elimina i più vecchi
          if (backupFiles.length > 10) {
            logger.info('Eliminazione backup più vecchi (mantenendo gli ultimi 10)...');
            for (let i = 10; i < backupFiles.length; i++) {
              try {
                fs.unlinkSync(backupFiles[i].path);
                logger.info(`Backup eliminato: ${backupFiles[i].name}`);
              } catch (err: any) {
                logger.error(`Errore eliminando il backup ${backupFiles[i].name}: ${err.message}`);
              }
            }
          }
          
          // Registra il backup nel log di sistema
          await prisma.syslog.create({
            data: {
              livello: 'INFO',
              messaggio: 'Backup database completato',
              dettagli: `File: ${backupFileName}, Dimensione: ${fileSizeInMB} MB`,
              user_id: userId
            }
          });
          
          return res.status(200).json({
            success: true,
            message: 'Backup completato con successo',
            filename: backupFileName,
            path: backupFilePath,
            size: `${fileSizeInMB} MB`
          });
        });
      });
    } catch (error: any) {
      logger.error('Errore nell\'esecuzione del backup:', error);
      
      // Registra l'errore
      await prisma.syslog.create({
        data: {
          livello: 'ERROR',
          messaggio: 'Errore nell\'esecuzione del backup',
          dettagli: error.message,
          user_id: userId
        }
      });
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante l\'esecuzione del backup',
        error: error.message
      });
    }
  }
  /**
   * Inizializza le tabelle per un'azienda esistente
   */
  static async initializeCompanyTables(req: Request, res: Response) {
    const { companyId } = req.params;
    const userId = (req.user as any)?.id;

    try {
      // Verifica che l'utente sia admin
      const isAdmin = (req.user as any)?.isAdmin === true;
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accesso negato. Solo gli amministratori possono inizializzare le tabelle aziendali.'
        });
      }

      // Recupera l'azienda dal database
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

      // Inizializza il creatore di tabelle
      const tablesCreator = new CompanyTablesCreator(prisma, logger);

      // Verifica se le tabelle esistono già
      const tablesExist = await tablesCreator.tablesExist(companyCode);
      
      if (tablesExist) {
        return res.status(200).json({
          success: true,
          message: `Le tabelle per l'azienda ${companyCode} esistono già`,
          tables: [`${companyCode}_soggetti già esiste`]
        });
      }

      // Crea le tabelle
      await tablesCreator.createTables(companyCode);

      // Registra l'operazione nella tabella di log
      await prisma.syslog.create({
        data: {
          livello: 'INFO',
          messaggio: `Tabelle inizializzate per l'azienda ${company.descrizione} (${companyCode})`,
          dettagli: `Inizializzazione manuale delle tabelle dall'interfaccia amministrativa`,
          user_id: userId
        }
      });

      // Restituisci il risultato
      return res.status(200).json({
        success: true,
        message: `Tabelle per l'azienda ${companyCode} inizializzate con successo`,
        tables: [
          `${companyCode}_soggetti`,
          `${companyCode}_magazzini`,
          `${companyCode}_cisterne`,
          `${companyCode}_terreni`,
          `${companyCode}_movimenti`,
          `${companyCode}_articoli`,
          `${companyCode}_listini`
        ]
      });
    } catch (error: any) {
      logger.error(`Errore nell'inizializzazione delle tabelle per l'azienda ${companyId}:`, error);
      
      // Registra l'errore
      await prisma.syslog.create({
        data: {
          livello: 'ERROR',
          messaggio: `Errore inizializzazione tabelle per l'azienda ${companyId}`,
          dettagli: error.message,
          user_id: userId
        }
      });

      return res.status(500).json({
        success: false,
        message: 'Errore durante l\'inizializzazione delle tabelle',
        error: error.message
      });
    }
  }
}