import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

/**
 * Controller per la gestione delle prenotazioni moliture
 */
export class PrenotazioniController {
  /**
   * Ottiene le prenotazioni per una data specifica
   */
  async getPrenotazioniByDate(req: Request, res: Response): Promise<void> {
    try {
      const { companyCode, date } = req.params;
      const userId = (req.user as any)?.id;
      
      // Validazione della data
      if (!date || isNaN(Date.parse(date))) {
        res.status(400).json({ 
          success: false, 
          message: 'Formato data non valido. Utilizzare formato ISO 8601 (YYYY-MM-DD)' 
        });
        return;
      }

      // Recupera ruolo dell'utente
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        res.status(401).json({ 
          success: false, 
          message: 'Utente non autorizzato' 
        });
        return;
      }
      
      const tableName = `${companyCode.toLowerCase()}_calendario`;
      
      // Ottieni le date di inizio e fine della giornata
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Costruzione query
      let query = `
        SELECT 
          c.id, 
          c.id_cliente, 
          s.descrizione as nome_cliente,
          s.cod_cliahr,
          c.tipologia_oliva,
          a.descrizione as nome_oliva,
          c.quantita_kg,
          c.data_inizio,
          c.data_fine,
          c.id_linea,
          l.descrizione as nome_linea,
          l.cap_oraria,
          c.stato,
          c.note,
          c.cellulare,
          c.mail,
          c.id_user,
          c.flagcproprio,
          c.flag_chiuso,
          c.id_conferimento
        FROM "${tableName}" c
        LEFT JOIN "${companyCode.toLowerCase()}_soggetti" s ON c.id_cliente = s.id
        LEFT JOIN "articoli" a ON c.tipologia_oliva = a.id
        LEFT JOIN "${companyCode.toLowerCase()}_linee" l ON c.id_linea = l.id
        WHERE c.data_inizio >= '${startDate.toISOString()}'
        AND c.data_inizio <= '${endDate.toISOString()}'
      `;
      
      // Filtra per utente se è un cliente (ruolo 3)
      if (user.ruolo === 3) {
        query += ` AND c.id_user = ${userId}`;
      }
      
      // Ordina per data inizio
      query += ` ORDER BY c.data_inizio`;
      
      // Esegue la query
      const prenotazioni = await prisma.$queryRawUnsafe(query);
      
      // Se l'utente è un cliente, aggiungi anche gli slot occupati (senza dettagli)
      if (user.ruolo === 3) {
        const slotsOccupati = await prisma.$queryRawUnsafe(`
          SELECT 
            c.id,
            0 as id_cliente,
            'Slot occupato' as nome_cliente,
            null as cod_cliahr,
            0 as tipologia_oliva,
            'Slot occupato' as nome_oliva,
            0 as quantita_kg,
            c.data_inizio,
            c.data_fine,
            c.id_linea,
            l.descrizione as nome_linea,
            l.cap_oraria,
            c.stato,
            '' as note,
            null as cellulare,
            null as mail,
            0 as id_user,
            FALSE as flagcproprio,
            FALSE as flag_chiuso,
            null as id_conferimento
          FROM "${tableName}" c
          LEFT JOIN "${companyCode.toLowerCase()}_linee" l ON c.id_linea = l.id
          WHERE c.data_inizio >= '${startDate.toISOString()}'
          AND c.data_inizio <= '${endDate.toISOString()}'
          AND c.id_user != ${userId}
        `);
        
        // Combina le prenotazioni dell'utente con gli slot occupati
        const risultato = [...(prenotazioni as any[]), ...(slotsOccupati as any[])];
        
        // Ordina per data
        risultato.sort((a: any, b: any) => 
          new Date(a.data_inizio).getTime() - new Date(b.data_inizio).getTime()
        );
        
        res.json({
          success: true,
          data: risultato
        });
        return;
      }
      
      res.json({
        success: true,
        data: prenotazioni
      });
    } catch (error) {
      logger.error('Errore nel recupero prenotazioni per data:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero delle prenotazioni', 
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  }
  /**
   * Invia email di notifica per una prenotazione
   */
  async sendEmailNotification(req: Request, res: Response): Promise<void> {
    try {
      const { companyCode, id } = req.params;
      const { emailContent } = req.body;
      const userId = (req.user as any)?.id;
      
      // Recupero ruolo dell'utente
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        res.status(401).json({ 
          success: false, 
          message: 'Utente non autorizzato' 
        });
        return;
      }
      
      // Verifica esistenza prenotazione
      const tableName = `${companyCode.toLowerCase()}_calendario`;
      const prenotazione: any = await prisma.$queryRawUnsafe(`
        SELECT 
          c.id, 
          c.id_cliente, 
          s.descrizione as nome_cliente,
          c.tipologia_oliva,
          a.descrizione as nome_oliva,
          c.quantita_kg,
          c.data_inizio,
          c.data_fine,
          c.id_linea,
          l.descrizione as nome_linea,
          c.stato,
          c.note,
          c.cellulare,
          c.mail,
          c.id_user,
          c.flagcproprio
        FROM "${tableName}" c
        LEFT JOIN "${companyCode.toLowerCase()}_soggetti" s ON c.id_cliente = s.id
        LEFT JOIN "articoli" a ON c.tipologia_oliva = a.id
        LEFT JOIN "${companyCode.toLowerCase()}_linee" l ON c.id_linea = l.id
        WHERE c.id = ${id}
      `);
      
      if (!prenotazione || prenotazione.length === 0) {
        res.status(404).json({ 
          success: false, 
          message: 'Prenotazione non trovata' 
        });
        return;
      }
      
      // Verifica permessi: ruolo 2 può inviare email, ruolo 3 no
      if (user.ruolo !== 2) {
        res.status(403).json({ 
          success: false, 
          message: 'Non hai i permessi per inviare notifiche email' 
        });
        return;
      }
      
      // Verifica che la prenotazione sia in stato Confermato
      if (prenotazione[0].stato !== 'Confermato') {
        res.status(400).json({ 
          success: false, 
          message: 'Le notifiche possono essere inviate solo per prenotazioni confermate' 
        });
        return;
      }
      
      // Verifica che l'email del cliente sia presente
      if (!prenotazione[0].mail) {
        res.status(400).json({ 
          success: false, 
          message: 'Indirizzo email del cliente mancante' 
        });
        return;
      }
      
      // Recupera i parametri per l'invio email dalla tabella aziende
      const azienda: any = await prisma.$queryRawUnsafe(`
        SELECT 
          email_mittente,
          email_password,
          email_smtp_server,
          email_smtp_port,
          email_ssl,
          email_default_oggetto,
          email_firma
        FROM "aziende"
        WHERE codice = '${companyCode}'
      `);
      
      if (!azienda || azienda.length === 0) {
        res.status(500).json({ 
          success: false, 
          message: 'Configurazione email dell\'azienda non trovata' 
        });
        return;
      }
      
      const {
        email_mittente,
        email_password,
        email_smtp_server,
        email_smtp_port,
        email_ssl,
        email_default_oggetto,
        email_firma
      } = azienda[0];
      
      // Verifica che la configurazione email sia completa
      if (!email_mittente || !email_password || !email_smtp_server || !email_smtp_port) {
        res.status(500).json({ 
          success: false, 
          message: 'Configurazione email dell\'azienda incompleta' 
        });
        return;
      }
      
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
        res.status(500).json({
          success: false,
          message: 'Errore nella connessione al server SMTP',
          error: verifyError.message,
          errorCode: verifyError.code,
          errorResponse: verifyError.response,
          errorCommand: verifyError.command
        });
        return;
      }
      
      // Recupera il nome dell'azienda dal database
      const aziendaInfo: any = await prisma.$queryRawUnsafe(`
        SELECT descrizione FROM "aziende"
        WHERE codice = '${companyCode}'
      `);
      
      // Determina il nome da usare come mittente
      const nomeAzienda = (aziendaInfo && aziendaInfo.length > 0 && aziendaInfo[0].descrizione) 
        ? aziendaInfo[0].descrizione 
        : companyCode;
      
      // Prepara ed invia l'email
      const mailOptions = {
        from: `"${nomeAzienda}" <${email_mittente}>`,
        to: prenotazione[0].mail,
        subject: email_default_oggetto || 'Conferma Prenotazione Molitura',
        html: emailContent,
      };
      
      // Invia l'email
      const info = await transporter.sendMail(mailOptions);
      
      // Aggiorna il campo data_mail con il timestamp corrente
      await prisma.$queryRawUnsafe(`
        UPDATE "${tableName}" 
        SET data_mail = CURRENT_TIMESTAMP 
        WHERE id = ${id}
      `);
      
      // Risposta al client
      res.json({
        success: true,
        message: 'Email di notifica inviata con successo',
        data: {
          messageId: info.messageId,
          response: info.response
        }
      });
    } catch (error) {
      logger.error('Errore nell\'invio email di notifica:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nell\'invio dell\'email di notifica',
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  }
  
  /**
   * Genera il contenuto predefinito per l'email di notifica prenotazione
   */
  async getEmailTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { companyCode, id } = req.params;
      const userId = (req.user as any)?.id;
      
      // Recupero ruolo dell'utente
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        res.status(401).json({ 
          success: false, 
          message: 'Utente non autorizzato' 
        });
        return;
      }
      
      // Verifica esistenza prenotazione
      const tableName = `${companyCode.toLowerCase()}_calendario`;
      const prenotazione: any = await prisma.$queryRawUnsafe(`
        SELECT 
          c.id, 
          c.id_cliente, 
          s.descrizione as nome_cliente,
          c.tipologia_oliva,
          a.descrizione as nome_oliva,
          c.quantita_kg,
          c.data_inizio,
          c.data_fine,
          c.id_linea,
          l.descrizione as nome_linea,
          c.stato,
          c.note,
          c.cellulare,
          c.mail,
          c.id_user,
          c.flagcproprio
        FROM "${tableName}" c
        LEFT JOIN "${companyCode.toLowerCase()}_soggetti" s ON c.id_cliente = s.id
        LEFT JOIN "articoli" a ON c.tipologia_oliva = a.id
        LEFT JOIN "${companyCode.toLowerCase()}_linee" l ON c.id_linea = l.id
        WHERE c.id = ${id}
      `);
      
      if (!prenotazione || prenotazione.length === 0) {
        res.status(404).json({ 
          success: false, 
          message: 'Prenotazione non trovata' 
        });
        return;
      }
      
      // Recupera firma e coordinate dall'azienda
      const azienda: any = await prisma.$queryRawUnsafe(`
        SELECT email_firma, coordinate
        FROM "aziende"
        WHERE codice = '${companyCode}'
      `);
      
      const firma = (azienda && azienda.length > 0 && azienda[0].email_firma) 
        ? `<br><br>${azienda[0].email_firma}` 
        : '';
        
      // Prepara il link a Google Maps se le coordinate sono disponibili
      const coordinateLink = (azienda && azienda.length > 0 && azienda[0].coordinate)
        ? `<p><strong><a href="https://www.google.com/maps?q=${azienda[0].coordinate}" target="_blank" style="color: #3366cc; text-decoration: underline;">Come raggiungerci</a></strong> (apri in Google Maps)</p>`
        : '';
      
      // Formatta le date in modo leggibile
      const dataInizio = new Date(prenotazione[0].data_inizio).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const dataFine = new Date(prenotazione[0].data_fine).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Genera il contenuto dell'email
      const emailContent = `
        <h2>Conferma Prenotazione Molitura</h2>
        <p>Gentile <strong>${prenotazione[0].nome_cliente}</strong>,</p>
        <p>con la presente confermiamo la sua prenotazione per la molitura presso il nostro frantoio.</p>
        <p><strong>Dettagli della prenotazione:</strong></p>
        <ul>
          <li><strong>Tipologia olive:</strong> ${prenotazione[0].nome_oliva}</li>
          <li><strong>Quantità:</strong> ${prenotazione[0].quantita_kg} kg</li>
          <li><strong>Data e ora inizio:</strong> ${dataInizio}</li>
          <li><strong>Data e ora fine:</strong> ${dataFine}</li>
          <li><strong>Linea di lavorazione:</strong> ${prenotazione[0].nome_linea}</li>
        </ul>
        ${prenotazione[0].note ? `<p><strong>Note:</strong> ${prenotazione[0].note}</p>` : ''}
        <p>La preghiamo di presentarsi con un anticipo di almeno 15 minuti rispetto all'orario stabilito.</p>
        ${coordinateLink}
        <p>Per eventuali modifiche o cancellazioni, la preghiamo di contattarci con almeno 24 ore di anticipo.</p>
        <p>Cordiali saluti,</p>
        ${firma}
      `;
      
      // Risposta al client
      res.json({
        success: true,
        data: {
          emailContent
        }
      });
    } catch (error) {
      logger.error('Errore nella generazione del template email:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nella generazione del template email',
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  }
  /**
   * Ottiene tutte le prenotazioni per l'azienda corrente
   * Filtra in base ai permessi dell'utente:
   * - Ruolo 2 (admin): vede tutte le prenotazioni
   * - Ruolo 3 (cliente): vede solo le proprie prenotazioni + slot occupati
   */
  async getPrenotazioni(req: Request, res: Response): Promise<void> {
    try {
      const { companyCode } = req.params;
      const userId = (req.user as any)?.id;
      
      // Recupera ruolo dell'utente
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        res.status(401).json({ error: 'Utente non autorizzato' });
        return;
      }
      
      const tableName = `${companyCode.toLowerCase()}_calendario`;
      
      // Costruzione query in base al ruolo
      let query = `
        SELECT 
          c.id, 
          c.id_cliente, 
          s.descrizione as nome_cliente,
          s.cod_cliahr,
          c.tipologia_oliva,
          a.descrizione as nome_oliva,
          c.quantita_kg,
          c.data_inizio,
          c.data_fine,
          c.id_linea,
          l.descrizione as nome_linea,
          l.cap_oraria,
          c.stato,
          c.note,
          c.cellulare,
          c.mail,
          c.id_user,
          c.flagcproprio,
          c.flag_chiuso,
          c.id_conferimento
        FROM "${tableName}" c
        LEFT JOIN "${companyCode.toLowerCase()}_soggetti" s ON c.id_cliente = s.id
        LEFT JOIN "articoli" a ON c.tipologia_oliva = a.id
        LEFT JOIN "${companyCode.toLowerCase()}_linee" l ON c.id_linea = l.id
      `;
      
      // Filtra per utente se è un cliente (ruolo 3)
      if (user.ruolo === 3) {
        query += `WHERE c.id_user = ${userId}`;
      }
      
      // Ordina per data inizio
      query += ` ORDER BY c.data_inizio`;
      
      // Esegue la query
      const prenotazioni = await prisma.$queryRawUnsafe(query);
      
      // Se l'utente è un cliente, aggiungi anche gli slot occupati (senza dettagli)
      if (user.ruolo === 3) {
        const slotsOccupati = await prisma.$queryRawUnsafe(`
          SELECT 
            c.id,
            0 as id_cliente,
            'Slot occupato' as nome_cliente,
            null as cod_cliahr,
            0 as tipologia_oliva,
            'Slot occupato' as nome_oliva,
            0 as quantita_kg,
            c.data_inizio,
            c.data_fine,
            c.id_linea,
            l.descrizione as nome_linea,
            l.cap_oraria,
            c.stato,
            '' as note,
            null as cellulare,
            null as mail,
            0 as id_user,
            FALSE as flagcproprio,
            FALSE as flag_chiuso,
            null as id_conferimento
          FROM "${tableName}" c
          LEFT JOIN "${companyCode.toLowerCase()}_linee" l ON c.id_linea = l.id
          WHERE c.id_user != ${userId}
        `);
        
        // Combina le prenotazioni dell'utente con gli slot occupati
        const risultato = [...(prenotazioni as any[]), ...(slotsOccupati as any[])];
        
        // Ordina per data
        risultato.sort((a: any, b: any) => 
          new Date(a.data_inizio).getTime() - new Date(b.data_inizio).getTime()
        );
        
        res.json({
          success: true,
          data: risultato
        });
        return;
      }
      
      res.json({
        success: true,
        data: prenotazioni
      });
    } catch (error) {
      logger.error('Errore nel recupero prenotazioni:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero delle prenotazioni', 
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  }
  
  /**
   * Ottiene una prenotazione specifica
   */
  async getPrenotazioneById(req: Request, res: Response): Promise<void> {
    try {
      const { companyCode, id } = req.params;
      const userId = (req.user as any)?.id;
      
      // Recupera ruolo dell'utente
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        res.status(401).json({ error: 'Utente non autorizzato' });
        return;
      }
      
      const tableName = `${companyCode.toLowerCase()}_calendario`;
      
      // Verifica esistenza della prenotazione
      const prenotazione: any = await prisma.$queryRawUnsafe(`
        SELECT 
          c.id, 
          c.id_cliente, 
          s.descrizione as nome_cliente,
          c.tipologia_oliva,
          a.descrizione as nome_oliva,
          c.quantita_kg,
          c.data_inizio,
          c.data_fine,
          c.id_linea,
          l.descrizione as nome_linea,
          c.stato,
          c.note,
          c.cellulare,
          c.mail,
          c.id_user,
          c.flagcproprio
        FROM "${tableName}" c
        LEFT JOIN "${companyCode.toLowerCase()}_soggetti" s ON c.id_cliente = s.id
        LEFT JOIN "articoli" a ON c.tipologia_oliva = a.id
        LEFT JOIN "${companyCode.toLowerCase()}_linee" l ON c.id_linea = l.id
        WHERE c.id = ${id}
      `);
      
      if (!prenotazione || prenotazione.length === 0) {
        res.status(404).json({ error: 'Prenotazione non trovata' });
        return;
      }
      
      // Verifica permessi: ruolo 2 può vedere tutto, ruolo 3 solo le proprie prenotazioni
      if (user.ruolo === 3 && prenotazione[0].id_user !== userId) {
        res.status(403).json({ error: 'Non hai i permessi per visualizzare questa prenotazione' });
        return;
      }
      
      res.json({
        success: true,
        data: prenotazione[0]
      });
    } catch (error) {
      logger.error('Errore nel recupero prenotazione:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero della prenotazione',
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  }
  
  /**
   * Crea una nuova prenotazione
   */
  async createPrenotazione(req: Request, res: Response): Promise<void> {
    try {
      const { companyCode } = req.params;
      const userId = (req.user as any)?.id;
      const {
        id_cliente,
        tipologia_oliva,
        quantita_kg,
        data_inizio,
        data_fine,
        id_linea,
        stato,
        note,
        cellulare,
        mail,
        flagcproprio,
        sendMailNotification,
        sendWhatsAppNotification
      } = req.body;
      
      // Recupera ruolo dell'utente
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        res.status(401).json({ error: 'Utente non autorizzato' });
        return;
      }
      
      // Validazione campi obbligatori
      if ((!flagcproprio && !id_cliente) || !tipologia_oliva || !quantita_kg || !data_inizio || !data_fine || !id_linea || !stato) {
        res.status(400).json({ error: 'Campi obbligatori mancanti' });
        return;
      }
      
      // Per utenti con ruolo 3, consenti solo stato 'Provvisorio'
      if (user.ruolo === 3 && stato !== 'Provvisorio') {
        res.status(403).json({ error: 'Non hai i permessi per creare prenotazioni con questo stato' });
        return;
      }
      
      // Verifica se il cliente corrisponde all'utente (per ruolo 3) - solo se non è flagcproprio
      if (user.ruolo === 3 && !flagcproprio) {
        // Recupera il cliente associato all'utente
        const clienteAssociato: any = await prisma.$queryRawUnsafe(`
          SELECT id FROM "${companyCode.toLowerCase()}_soggetti" WHERE id = ${id_cliente}
        `);
        
        if (!clienteAssociato || clienteAssociato.length === 0) {
          res.status(403).json({ error: 'Non hai i permessi per prenotare a nome di questo cliente' });
          return;
        }
      }
      
      // Se è conto proprio, verifica che esista il soggetto speciale con id=0
      if (flagcproprio) {
        // Verifica se esiste già il soggetto c/proprio con id=0
        const cproprio: any = await prisma.$queryRawUnsafe(`
          SELECT id FROM "${companyCode.toLowerCase()}_soggetti" WHERE id = 0
        `);
        
        // Se non esiste, crealo
        if (!cproprio || cproprio.length === 0) {
          await prisma.$queryRawUnsafe(`
            INSERT INTO "${companyCode.toLowerCase()}_soggetti" (
              id, descrizione, created_at, updated_at
            ) VALUES (
              0, 'c/proprio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
          `);
          logger.info(`Creato soggetto c/proprio con id=0 per l'azienda ${companyCode}`);
        }
      }
      
      // Verifica disponibilità dello slot e raccoglie info sulle prenotazioni in sovrapposizione
      const sovrapposizioni: any = await prisma.$queryRawUnsafe(`
        SELECT c.id, c.data_inizio, c.data_fine, l.descrizione as nome_linea, s.descrizione as nome_cliente
        FROM "${companyCode.toLowerCase()}_calendario" c
        LEFT JOIN "${companyCode.toLowerCase()}_linee" l ON c.id_linea = l.id
        LEFT JOIN "${companyCode.toLowerCase()}_soggetti" s ON c.id_cliente = s.id
        WHERE c.id_linea = ${id_linea}
        AND (
          (c.data_inizio <= '${data_inizio}' AND c.data_fine >= '${data_inizio}') OR
          (c.data_inizio <= '${data_fine}' AND c.data_fine >= '${data_fine}') OR
          (c.data_inizio >= '${data_inizio}' AND c.data_fine <= '${data_fine}')
        )
      `);
      
      if (sovrapposizioni.length > 0) {
        // Formatta le informazioni della sovrapposizione per un messaggio più dettagliato
        const dataInizioConflitto = new Date(sovrapposizioni[0].data_inizio).toLocaleString('it-IT');
        const dataFineConflitto = new Date(sovrapposizioni[0].data_fine).toLocaleString('it-IT');
        const linea = sovrapposizioni[0].nome_linea || `ID linea: ${id_linea}`;
        
        res.status(409).json({ 
          success: false, 
          error: 'Slot occupato',
          message: `La linea "${linea}" è già occupata in questo intervallo orario (${dataInizioConflitto} - ${dataFineConflitto})`,
          data: {
            conflictId: sovrapposizioni[0].id,
            dataInizio: sovrapposizioni[0].data_inizio,
            dataFine: sovrapposizioni[0].data_fine,
            linea: sovrapposizioni[0].nome_linea,
            cliente: sovrapposizioni[0].nome_cliente
          }
        });
        return;
      }
      
      // Preparazione dei campi di data notifica
      const dataMail = sendMailNotification && stato === 'Confermato' ? 'CURRENT_TIMESTAMP' : 'NULL';
      const dataWhatsApp = sendWhatsAppNotification && stato === 'Confermato' ? 'CURRENT_TIMESTAMP' : 'NULL';
      
      // Se è conto proprio, usiamo id_cliente = 0 (che ora sappiamo esistere)
      const clienteId = flagcproprio ? 0 : id_cliente;
      
      // Prepara i valori di testo facendo escape degli apostrofi
      const noteEscaped = (note || '').replace(/'/g, "''");
      const cellulareEscaped = (cellulare || '').replace(/'/g, "''");
      const mailEscaped = (mail || '').replace(/'/g, "''");
      
      // Log per debugging
      logger.info(`Tentativo creazione prenotazione c/proprio=${flagcproprio}, clienteId=${clienteId}, id_linea=${id_linea}, tipologia_oliva=${tipologia_oliva}`);
      
      // Inserisci nuova prenotazione
      const result = await prisma.$queryRawUnsafe(`
        INSERT INTO "${companyCode.toLowerCase()}_calendario" (
          id_cliente,
          tipologia_oliva,
          quantita_kg,
          data_inizio,
          data_fine,
          id_linea,
          stato,
          note,
          cellulare,
          mail,
          data_mail,
          data_whatsapp,
          flagcproprio,
          id_user,
          created_at,
          updated_at
        ) VALUES (
          ${clienteId},
          ${tipologia_oliva},
          ${quantita_kg},
          '${data_inizio}',
          '${data_fine}',
          ${id_linea},
          '${stato}',
          '${noteEscaped}',
          '${cellulareEscaped}',
          '${mailEscaped}',
          ${dataMail},
          ${dataWhatsApp},
          ${flagcproprio ? 'TRUE' : 'FALSE'},
          ${userId},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ) RETURNING id
      `);
      
      const newPrenotationId = (result as any[])[0].id;
      
      // Creiamo la risposta base per il client
      const baseResponse = { 
        success: true, 
        data: { id: newPrenotationId }, 
        message: 'Prenotazione creata con successo' 
      };
      
      // Se la prenotazione è stata creata con stato Confermato e sendMailNotification è attivo,
      // NON tentiamo l'invio dell'email qui. Lasciamo che sia il frontend a gestire l'invio tramite
      // una chiamata esplicita, come avviene già per le prenotazioni esistenti.
      
      // Aggiungiamo un flag nella risposta per indicare al frontend se è necessario richiedere l'invio
      if (stato === 'Confermato' && sendMailNotification && mail) {
        (baseResponse.data as any).shouldSendEmail = true;
      }

      // Rispondiamo al client con successo
      res.status(201).json(baseResponse);
    } catch (error) {
      logger.error('Errore nella creazione prenotazione:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nella creazione della prenotazione',
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  }
  
  /**
   * Aggiorna una prenotazione esistente
   */
  async updatePrenotazione(req: Request, res: Response): Promise<void> {
    try {
      const { companyCode, id } = req.params;
      const userId = (req.user as any)?.id;
      const {
        id_cliente,
        tipologia_oliva,
        quantita_kg,
        data_inizio,
        data_fine,
        id_linea,
        stato,
        note,
        cellulare,
        mail,
        flagcproprio,
        sendMailNotification,
        sendWhatsAppNotification
      } = req.body;
      
      // Debug log
      logger.info(`Ricevuta richiesta create con flagcproprio=${flagcproprio}, id_cliente=${id_cliente}`);
      
      // Recupera ruolo dell'utente
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        res.status(401).json({ error: 'Utente non autorizzato' });
        return;
      }
      
      // Validazione campi obbligatori
      if ((!flagcproprio && !id_cliente) || !tipologia_oliva || !quantita_kg || !data_inizio || !data_fine || !id_linea || !stato) {
        res.status(400).json({ error: 'Campi obbligatori mancanti' });
        return;
      }
      
      // Verifica esistenza della prenotazione
      const prenotazione: any = await prisma.$queryRawUnsafe(`
        SELECT * FROM "${companyCode.toLowerCase()}_calendario" WHERE id = ${id}
      `);
      
      if (!prenotazione || prenotazione.length === 0) {
        res.status(404).json({ error: 'Prenotazione non trovata' });
        return;
      }
      
      // Verifica permessi: ruolo 2 può modificare tutto, ruolo 3 solo le proprie prenotazioni
      if (user.ruolo === 3) {
        if (prenotazione[0].id_user !== userId) {
          res.status(403).json({ error: 'Non hai i permessi per modificare questa prenotazione' });
          return;
        }
        
        // Ruolo 3 può modificare solo prenotazioni in stato 'Provvisorio'
        if (prenotazione[0].stato !== 'Provvisorio') {
          res.status(403).json({ error: 'Non puoi modificare prenotazioni già confermate' });
          return;
        }
        
        // Ruolo 3 può impostare solo stato 'Provvisorio'
        if (stato !== 'Provvisorio') {
          res.status(403).json({ error: 'Non hai i permessi per modificare lo stato della prenotazione' });
          return;
        }
      }
      
      // Se è conto proprio, verifica che esista il soggetto speciale con id=0
      if (flagcproprio) {
        // Verifica se esiste già il soggetto c/proprio con id=0
        const cproprio: any = await prisma.$queryRawUnsafe(`
          SELECT id FROM "${companyCode.toLowerCase()}_soggetti" WHERE id = 0
        `);
        
        // Se non esiste, crealo
        if (!cproprio || cproprio.length === 0) {
          await prisma.$queryRawUnsafe(`
            INSERT INTO "${companyCode.toLowerCase()}_soggetti" (
              id, descrizione, created_at, updated_at
            ) VALUES (
              0, 'c/proprio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
          `);
          logger.info(`Creato soggetto c/proprio con id=0 per l'azienda ${companyCode}`);
        }
      }
      
      // Verifica disponibilità dello slot (escludendo la prenotazione corrente)
      // e raccoglie info sulle prenotazioni in sovrapposizione
      const sovrapposizioni: any = await prisma.$queryRawUnsafe(`
        SELECT c.id, c.data_inizio, c.data_fine, l.descrizione as nome_linea, s.descrizione as nome_cliente
        FROM "${companyCode.toLowerCase()}_calendario" c
        LEFT JOIN "${companyCode.toLowerCase()}_linee" l ON c.id_linea = l.id
        LEFT JOIN "${companyCode.toLowerCase()}_soggetti" s ON c.id_cliente = s.id
        WHERE c.id_linea = ${id_linea}
        AND c.id != ${id}
        AND (
          (c.data_inizio <= '${data_inizio}' AND c.data_fine >= '${data_inizio}') OR
          (c.data_inizio <= '${data_fine}' AND c.data_fine >= '${data_fine}') OR
          (c.data_inizio >= '${data_inizio}' AND c.data_fine <= '${data_fine}')
        )
      `);
      
      if (sovrapposizioni.length > 0) {
        // Formatta le informazioni della sovrapposizione per un messaggio più dettagliato
        const dataInizioConflitto = new Date(sovrapposizioni[0].data_inizio).toLocaleString('it-IT');
        const dataFineConflitto = new Date(sovrapposizioni[0].data_fine).toLocaleString('it-IT');
        const linea = sovrapposizioni[0].nome_linea || `ID linea: ${id_linea}`;
        
        res.status(409).json({ 
          success: false, 
          error: 'Slot occupato',
          message: `La linea "${linea}" è già occupata in questo intervallo orario (${dataInizioConflitto} - ${dataFineConflitto})`,
          data: {
            conflictId: sovrapposizioni[0].id,
            dataInizio: sovrapposizioni[0].data_inizio,
            dataFine: sovrapposizioni[0].data_fine,
            linea: sovrapposizioni[0].nome_linea,
            cliente: sovrapposizioni[0].nome_cliente
          }
        });
        return;
      }
      
      // Preparazione dei valori per i campi di notifica
      let dataMail = '';
      let dataWhatsApp = '';
      
      if (stato === 'Confermato') {
        // Gestione notifica email
        dataMail = sendMailNotification 
          ? ', data_mail = CURRENT_TIMESTAMP' 
          : '';
        
        // Gestione notifica WhatsApp
        dataWhatsApp = sendWhatsAppNotification 
          ? ', data_whatsapp = CURRENT_TIMESTAMP' 
          : '';
      }
      
      // Se è conto proprio, usiamo id_cliente = 0 (che ora sappiamo esistere)
      const clienteId = flagcproprio ? 0 : id_cliente;
      
      // Prepara i valori di testo facendo escape degli apostrofi
      const noteEscaped = (note || '').replace(/'/g, "''");
      const cellulareEscaped = (cellulare || '').replace(/'/g, "''");
      const mailEscaped = (mail || '').replace(/'/g, "''");
      
      // Log per debugging
      logger.info(`Tentativo aggiornamento prenotazione id=${id}, c/proprio=${flagcproprio}, clienteId=${clienteId}`);
      
      // Aggiorna prenotazione
      await prisma.$queryRawUnsafe(`
        UPDATE "${companyCode.toLowerCase()}_calendario" SET
          id_cliente = ${clienteId},
          tipologia_oliva = ${tipologia_oliva},
          quantita_kg = ${quantita_kg},
          data_inizio = '${data_inizio}',
          data_fine = '${data_fine}',
          id_linea = ${id_linea},
          stato = '${stato}',
          note = '${noteEscaped}',
          cellulare = '${cellulareEscaped}',
          mail = '${mailEscaped}',
          flagcproprio = ${flagcproprio ? 'TRUE' : 'FALSE'},
          updated_at = CURRENT_TIMESTAMP
          ${dataMail}
          ${dataWhatsApp}
        WHERE id = ${id}
      `);
      
      res.json({ success: true, message: 'Prenotazione aggiornata con successo' });
    } catch (error) {
      logger.error('Errore nell\'aggiornamento prenotazione:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nell\'aggiornamento della prenotazione',
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  }
  
  /**
   * Elimina una prenotazione
   */
  async deletePrenotazione(req: Request, res: Response): Promise<void> {
    try {
      const { companyCode, id } = req.params;
      const userId = (req.user as any)?.id;
      
      // Recupera ruolo dell'utente
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        res.status(401).json({ error: 'Utente non autorizzato' });
        return;
      }
      
      // Verifica esistenza della prenotazione
      const prenotazione: any = await prisma.$queryRawUnsafe(`
        SELECT * FROM "${companyCode.toLowerCase()}_calendario" WHERE id = ${id}
      `);
      
      if (!prenotazione || prenotazione.length === 0) {
        res.status(404).json({ error: 'Prenotazione non trovata' });
        return;
      }
      
      // Verifica permessi: ruolo 2 può eliminare tutto, ruolo 3 solo le proprie prenotazioni in stato 'Provvisorio'
      if (user.ruolo === 3) {
        if (prenotazione[0].id_user !== userId) {
          res.status(403).json({ error: 'Non hai i permessi per eliminare questa prenotazione' });
          return;
        }
        
        if (prenotazione[0].stato !== 'Provvisorio') {
          res.status(403).json({ error: 'Non puoi eliminare prenotazioni già confermate' });
          return;
        }
      }
      
      // Elimina prenotazione
      await prisma.$queryRawUnsafe(`
        DELETE FROM "${companyCode.toLowerCase()}_calendario" WHERE id = ${id}
      `);
      
      res.json({ success: true, message: 'Prenotazione eliminata con successo' });
    } catch (error) {
      logger.error('Errore nell\'eliminazione prenotazione:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nell\'eliminazione della prenotazione',
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  }
}

export const prenotazioniController = new PrenotazioniController();