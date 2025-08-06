import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CompanyService } from '../../services/company/company-service';
import { Logger } from '../../utils/logger';
import nodemailer from 'nodemailer';

// Utilizziamo la dichiarazione globale di Request fatta in auth.ts

const prisma = new PrismaClient();
const logger = new Logger('CompanyController');
const companyService = new CompanyService(prisma, logger);

/**
 * Controller per la gestione delle aziende
 */
export class CompanyController {
  /**
   * Testa la configurazione email dell'azienda
   */
  static async testEmail(req: Request, res: Response) {
    try {
      const companyId = parseInt(req.params.id);
      const { 
        destination,
        email_mittente,
        email_password,
        email_smtp_server,
        email_smtp_port,
        email_ssl,
        email_default_oggetto,
        email_firma
      } = req.body;
      
      logger.info(`Richiesta test email per azienda ID: ${companyId}`);
      logger.info(`Parametri: destination=${destination}, mittente=${email_mittente}, server=${email_smtp_server}, porta=${email_smtp_port}, ssl=${email_ssl}`);
      
      if (isNaN(companyId)) {
        logger.error(`ID azienda non valido: ${req.params.id}`);
        return res.status(400).json({
          success: false,
          message: 'ID azienda non valido'
        });
      }

      if (!destination || !email_mittente || !email_password || !email_smtp_server || !email_smtp_port) {
        logger.error('Parametri email insufficienti:', {
          destination: !!destination,
          email_mittente: !!email_mittente,
          email_password: !!email_password,
          email_smtp_server: !!email_smtp_server,
          email_smtp_port: !!email_smtp_port
        });
        
        return res.status(400).json({
          success: false,
          message: 'Parametri email insufficienti. Compilare tutti i campi obbligatori.'
        });
      }
      
      // Ottenere l'ID utente dalla sessione
      const userId = (req.user as any)?.id;
      if (!userId) {
        logger.error('Utente non autenticato per il test email');
        return res.status(401).json({
          success: false,
          message: 'Utente non autenticato'
        });
      }
      
      // Verifica che l'utente abbia accesso all'azienda
      logger.info(`Verifica accesso utente ID: ${userId} all'azienda ID: ${companyId}`);
      const company = await companyService.getCompanyById(companyId, userId);
      if (!company) {
        logger.error(`Accesso negato per utente ID: ${userId} all'azienda ID: ${companyId}`);
        return res.status(403).json({
          success: false,
          message: 'Accesso negato a questa azienda'
        });
      }
      
      // Configurazione dettagliata
      logger.info('Configurazione SMTP dettagliata:', {
        host: email_smtp_server,
        port: email_smtp_port,
        secure: email_ssl,
        auth: {
          user: email_mittente,
          // password mascherata per sicurezza
          pass: '********'
        }
      });
      
      // Crea un trasportatore SMTP
      logger.info('Creazione del trasportatore SMTP...');
      const transporter = nodemailer.createTransport({
        host: email_smtp_server,
        port: email_smtp_port,
        secure: email_ssl,
        auth: {
          user: email_mittente,
          pass: email_password,
        },
        // Aggiungiamo debug per vedere più informazioni
        debug: true,
        logger: true
      });
      
      // Verifichiamo la connessione prima di inviare
      logger.info('Verifica connessione SMTP...');
      try {
        await transporter.verify();
        logger.info('Connessione SMTP verificata con successo');
      } catch (verifyError: any) {
        logger.error('Errore durante la verifica della connessione SMTP:', verifyError);
        return res.status(500).json({
          success: false,
          message: 'Errore nella connessione al server SMTP',
          error: verifyError.message,
          errorCode: verifyError.code,
          errorResponse: verifyError.response,
          errorCommand: verifyError.command
        });
      }
      
      // Contenuto email di test
      const firma = email_firma ? `<br><br>${email_firma}` : '';
      const emailContent = `
        <h2>Test Connessione Email</h2>
        <p>Questa è un'email di test inviata dall'App Frantoi.</p>
        <p>Se stai ricevendo questa email, la configurazione email è stata impostata correttamente.</p>
        <p><strong>Dati configurazione:</strong></p>
        <ul>
          <li>Server SMTP: ${email_smtp_server}</li>
          <li>Porta: ${email_smtp_port}</li>
          <li>SSL/TLS: ${email_ssl ? 'Sì' : 'No'}</li>
        </ul>
        <p>Ora puoi salvare la configurazione.</p>
        ${firma}
      `;
      
      // Opzioni messaggio
      const mailOptions = {
        from: `"App Frantoi" <${email_mittente}>`,
        to: destination,
        subject: email_default_oggetto || 'Test Configurazione Email - App Frantoi',
        html: emailContent,
      };
      
      logger.info('Tentativo di invio email con i seguenti parametri:', {
        from: `"App Frantoi" <${email_mittente}>`,
        to: destination,
        subject: email_default_oggetto || 'Test Configurazione Email - App Frantoi'
      });
      
      // Invia l'email
      const info = await transporter.sendMail(mailOptions);
      
      logger.info(`Email di test inviata con successo a ${destination}`);
      logger.info('Dettagli invio:', {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected
      });
      
      return res.status(200).json({
        success: true,
        message: 'Email di test inviata con successo',
        data: {
          messageId: info.messageId,
          response: info.response
        }
      });
    } catch (error: any) {
      logger.error(`Errore nell'invio dell'email di test:`, error);
      logger.error('Stack trace:', error.stack);
      
      // Log dettagliato dell'errore
      if (error.errno) logger.error(`Errore numero: ${error.errno}`);
      if (error.code) logger.error(`Codice errore: ${error.code}`);
      if (error.syscall) logger.error(`Syscall: ${error.syscall}`);
      if (error.hostname) logger.error(`Hostname: ${error.hostname}`);
      if (error.command) logger.error(`Comando: ${error.command}`);
      if (error.response) logger.error(`Risposta: ${error.response}`);
      
      // Formatta l'errore Nodemailer per renderlo più leggibile
      let errorMessage = error.message;
      let errorDetails = {};
      
      if (error.code === 'EAUTH') {
        errorMessage = 'Errore di autenticazione: username o password non validi';
      } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
        errorMessage = 'Errore di connessione: verificare server o porta SMTP';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Timeout di connessione: il server SMTP non risponde';
      } else if (error.code === 'EENVELOPE') {
        errorMessage = 'Errore nell\'indirizzo email (mittente o destinatario non validi)';
      } else if (error.code === 'ECERTMISMATCH') {
        errorMessage = 'Il certificato SSL del server non è valido';
      } else if (error.code === 'ESSL') {
        errorMessage = 'Errore SSL: impossibile stabilire una connessione sicura';
      }
      
      // Dettagli aggiuntivi dell'errore
      errorDetails = {
        code: error.code,
        syscall: error.syscall,
        hostname: error.hostname,
        command: error.command,
        response: error.response
      };
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante l\'invio dell\'email di test',
        error: errorMessage,
        details: errorDetails
      });
    }
  }
  /**
   * Recupera i dettagli di un'azienda specifica
   */
  static async getCompany(req: Request, res: Response) {
    try {
      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        return res.status(400).json({
          success: false,
          message: 'ID azienda non valido'
        });
      }
      
      // Ottenere l'ID utente dalla sessione
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Utente non autenticato'
        });
      }
      
      const company = await companyService.getCompanyById(companyId, userId);
      
      return res.status(200).json({
        success: true,
        data: company
      });
    } catch (error: any) {
      logger.error(`Errore nel recupero dell'azienda:`, error);
      
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Errore durante il recupero dell\'azienda',
      });
    }
  }

  /**
   * Aggiorna i dettagli di un'azienda
   */
  static async updateCompany(req: Request, res: Response) {
    try {
      const companyId = parseInt(req.params.id);
      const { 
        descrizione, 
        ultimoidsoggetto,
        coordinate,
        email_mittente,
        email_password,
        email_smtp_server,
        email_smtp_port,
        email_ssl,
        email_default_oggetto,
        email_firma
      } = req.body;
      
      if (isNaN(companyId)) {
        return res.status(400).json({
          success: false,
          message: 'ID azienda non valido'
        });
      }
      
      // Validazione descrizione se fornita
      if (descrizione !== undefined && descrizione.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'La descrizione non può essere vuota'
        });
      }

      // Validazione ultimoidsoggetto se fornito
      if (ultimoidsoggetto !== undefined && (isNaN(ultimoidsoggetto) || ultimoidsoggetto < 0)) {
        return res.status(400).json({
          success: false,
          message: 'Ultimo ID soggetto non valido'
        });
      }
      
      // Validazione email_smtp_port se fornito
      if (email_smtp_port !== undefined && (isNaN(email_smtp_port) || email_smtp_port <= 0 || email_smtp_port > 65535)) {
        return res.status(400).json({
          success: false,
          message: 'Porta SMTP non valida'
        });
      }
      
      // Ottenere l'ID utente dalla sessione
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Utente non autenticato'
        });
      }
      
      const updatedCompany = await companyService.updateCompany(
        companyId,
        { 
          descrizione, 
          ultimoidsoggetto,
          coordinate,
          email_mittente,
          email_password,
          email_smtp_server,
          email_smtp_port,
          email_ssl,
          email_default_oggetto,
          email_firma
        },
        userId
      );
      
      return res.status(200).json({
        success: true,
        message: 'Azienda aggiornata con successo',
        data: updatedCompany
      });
    } catch (error: any) {
      logger.error(`Errore nell'aggiornamento dell'azienda:`, error);
      
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Errore durante l\'aggiornamento dell\'azienda',
      });
    }
  }

  /**
   * Crea una nuova azienda
   */
  static async createCompany(req: Request, res: Response) {
    try {
      // Ottenere i dati dalla richiesta
      const { descrizione, codice, ultimoidsoggetto } = req.body;

      // Validazione input
      if (!descrizione || !codice) {
        return res.status(400).json({
          success: false,
          message: 'Descrizione e codice azienda sono obbligatori'
        });
      }

      // Ottenere l'ID utente dalla sessione
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Utente non autenticato'
        });
      }

      // Validare ultimoidsoggetto se fornito
      if (ultimoidsoggetto !== undefined && (isNaN(parseInt(ultimoidsoggetto)) || parseInt(ultimoidsoggetto) < 0)) {
        return res.status(400).json({
          success: false,
          message: 'Ultimo ID soggetto non valido'
        });
      }

      // Creare l'azienda
      const company = await companyService.createCompany(
        { 
          descrizione, 
          codice: codice.toLowerCase(),
          ultimoidsoggetto: ultimoidsoggetto !== undefined ? parseInt(ultimoidsoggetto) : 0
        },
        userId
      );

      return res.status(201).json({
        success: true,
        message: 'Azienda creata con successo',
        data: company
      });
    } catch (error: any) {
      logger.error('Errore nella creazione dell\'azienda:', error);
      
      // Controlla se l'azienda esiste comunque nonostante l'errore (caso di fallimento durante la creazione tabelle)
      const aziendaCreata = await prisma.aziende.findFirst({
        where: {
          codice: req.body.codice.toLowerCase()
        }
      });
      
      if (aziendaCreata) {
        // Se l'azienda esiste, significa che è stata creata ma ci sono stati problemi con le tabelle
        return res.status(201).json({
          success: true,
          message: 'Azienda creata con successo. Attenzione: potrebbero esserci state delle difficoltà con alcune tabelle, ma l\'azienda è stata registrata.',
          data: aziendaCreata,
          warning: `Attenzione: Si sono verificati alcuni problemi durante la creazione delle tabelle: ${error.message}`
        });
      } else {
        // Se l'azienda non esiste, è stato un errore nella fase di creazione dell'azienda stessa
        return res.status(500).json({
          success: false,
          message: 'Errore durante la creazione dell\'azienda',
          error: error.message
        });
      }
    }
  }

  /**
   * Recupera tutte le aziende
   */
  static async getAllCompanies(req: Request, res: Response) {
    try {
      const companies = await companyService.getAllCompanies();
      
      return res.status(200).json({
        success: true,
        data: companies
      });
    } catch (error: any) {
      logger.error('Errore nel recupero delle aziende:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante il recupero delle aziende',
        error: error.message
      });
    }
  }

  /**
   * Recupera le aziende dell'utente corrente
   */
  static async getUserCompanies(req: Request, res: Response) {
    try {
      // Ottenere l'ID utente dalla sessione
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Utente non autenticato'
        });
      }

      const companies = await companyService.getUserCompanies(userId);
      
      return res.status(200).json({
        success: true,
        data: companies
      });
    } catch (error: any) {
      logger.error('Errore nel recupero delle aziende dell\'utente:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante il recupero delle aziende dell\'utente',
        error: error.message
      });
    }
  }

  /**
   * Assegna un utente a un'azienda
   */
  static async assignUserToCompany(req: Request, res: Response) {
    try {
      const { userId, companyId } = req.body;

      // Validazione input
      if (!userId || !companyId) {
        return res.status(400).json({
          success: false,
          message: 'ID utente e ID azienda sono obbligatori'
        });
      }

      // Ottenere l'ID dell'amministratore dalla sessione
      const adminUserId = (req.user as any)?.id;
      if (!adminUserId) {
        return res.status(401).json({
          success: false,
          message: 'Utente non autenticato'
        });
      }

      const result = await companyService.assignUserToCompany(
        parseInt(userId),
        parseInt(companyId),
        adminUserId
      );

      return res.status(200).json({
        success: true,
        message: 'Utente assegnato all\'azienda con successo',
        data: result
      });
    } catch (error: any) {
      logger.error('Errore nell\'assegnazione dell\'utente all\'azienda:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante l\'assegnazione dell\'utente all\'azienda',
        error: error.message
      });
    }
  }

  /**
   * Rimuove un utente da un'azienda
   */
  static async removeUserFromCompany(req: Request, res: Response) {
    try {
      const { userId, companyId } = req.body;

      // Validazione input
      if (!userId || !companyId) {
        return res.status(400).json({
          success: false,
          message: 'ID utente e ID azienda sono obbligatori'
        });
      }

      // Ottenere l'ID dell'amministratore dalla sessione
      const adminUserId = (req.user as any)?.id;
      if (!adminUserId) {
        return res.status(401).json({
          success: false,
          message: 'Utente non autenticato'
        });
      }

      const result = await companyService.removeUserFromCompany(
        parseInt(userId),
        parseInt(companyId),
        adminUserId
      );

      return res.status(200).json({
        success: true,
        message: 'Utente rimosso dall\'azienda con successo',
        data: result
      });
    } catch (error: any) {
      logger.error('Errore nella rimozione dell\'utente dall\'azienda:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante la rimozione dell\'utente dall\'azienda',
        error: error.message
      });
    }
  }
}