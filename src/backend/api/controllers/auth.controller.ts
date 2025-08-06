import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Logger } from '../../utils/logger';

const prisma = new PrismaClient();
const logger = new Logger('AuthController');

/**
 * Controller per l'autenticazione degli utenti
 */
export class AuthController {
  
  /**
   * Registrazione nuovo cliente/utente
   */
  static async register(req: Request, res: Response) {
    try {
      
      const { 
        descrizione, // Ragione sociale o Nome e Cognome
        email, 
        password,
        telefono
      } = req.body;
      
      // Validazione input
      if (!descrizione || !email || !password || !telefono) {
        return res.status(400).json({
          success: false,
          message: 'I campi Nome/Ragione Sociale, Email, Password e Telefono sono obbligatori'
        });
      }
      
      // Verifica se l'email è già registrata
      const existingUser = await prisma.users.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email già registrata'
        });
      }
      
      // Hash della password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Crea il nuovo utente con ruolo 3 (cliente)
      const nome = descrizione.split(' ')[0] || descrizione;
      const cognome = descrizione.split(' ').slice(1).join(' ') || '';
      
      // Genera username dall'email (prima parte dell'email)
      const username = email.split('@')[0];
      
      // Genera token di verifica email
      const crypto = require('crypto');
      const verificationToken = crypto.randomBytes(48).toString('hex');
      
      // Crea l'utente in una transazione
      const result = await prisma.$transaction(async (tx) => {
        // 1. Crea l'utente
        const user = await tx.users.create({
          data: {
            nome,
            cognome,
            username,
            email,
            password: hashedPassword,
            ruolo: 3 // Cliente
            // Non includiamo i nuovi campi fino a quando non vengono aggiunti al database
          }
        });
        
        // 2. Registra il log
        await tx.syslog.create({
          data: {
            livello: 'INFO',
            messaggio: `Registrato nuovo cliente: ${descrizione} (${email})`,
            user_id: user.id,
            ip_address: req.ip
          }
        });
        
        return { user };
      });
      
      // TODO: Inviare email di verifica con il token
      // L'implementazione della funzione di invio email dovrà essere sviluppata
      // separatamente, ma ecco il pseudocodice:
      /*
      await sendVerificationEmail({
        to: email,
        subject: 'Verifica il tuo indirizzo email',
        nome: nome,
        token: verificationToken,
        userId: result.user.id
      });
      */
      
      return res.status(201).json({
        success: true,
        message: 'Registrazione completata con successo. Controlla la tua email per verificare il tuo account.'
      });
      
    } catch (error: any) {
      logger.error('Errore durante la registrazione:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante la registrazione',
        error: error.message
      });
    }
  }
  /**
   * Login utente
   */
  static async login(req: Request, res: Response) {
    try {
      
      // Accetta sia email che username (per retrocompatibilità)
      const { email, username, password } = req.body;
      
      // Usa email se fornita, altrimenti usa username
      const userIdentifier = email || username;
      
      // Validazione input
      if (!userIdentifier || !password) {
        logger.debug("Validazione fallita: identificativo utente o password mancanti");
        return res.status(400).json({
          success: false,
          message: 'Email/username e password sono obbligatori'
        });
      }

      // Recupera l'utente dal database - cerca per email o username
      const user = await prisma.users.findFirst({
        where: {
          OR: [
            { email: userIdentifier },
            { username: userIdentifier }
          ]
        }
      });
      
      logger.debug(`Ricerca utente con identificativo: ${userIdentifier}`);

      // Verifica se l'utente esiste
      if (!user) {
        logger.debug(`Utente non trovato per l'identificativo fornito`);
        return res.status(401).json({
          success: false,
          message: 'Credenziali non valide'
        });
      }
      
      logger.debug(`Utente trovato con ID: ${user.id}`);

      // Verifica la password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Credenziali non valide'
        });
      }

      // Genera il token JWT con flag isAdmin basato sul ruolo
      const secretKey = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          ruolo: user.ruolo, 
          isAdmin: user.ruolo === 1 
        },
        secretKey,
        { expiresIn: '8h' }
      );

      // Non logghiamo più il token per motivi di sicurezza
      await prisma.syslog.create({
        data: {
          livello: 'DEBUG',
          messaggio: 'Token JWT generato per utente',
          user_id: user.id,
          ip_address: req.ip
        }
      });

      // Aggiorna la data dell'ultimo login
      await prisma.users.update({
        where: { id: user.id },
        data: { ultimo_login: new Date() }
      });

      // Registra il login nei log
      try {
        await prisma.syslog.create({
          data: {
            livello: 'INFO',
            messaggio: `Login utente ${user.email}`,
            user_id: user.id,
            ip_address: req.ip,
            dettagli: JSON.stringify({
              timestamp: new Date().toISOString(),
              userAgent: req.headers['user-agent'],
              method: 'login'
            })
          }
        });
        logger.info(`Login utente ${user.email} registrato nel syslog`);
      } catch (logError) {
        // Non blocchiamo il login se la registrazione del log fallisce
        logger.error('Errore nella registrazione del log di login:', logError);
      }

      // Determinare lo stato admin dell'utente (ruolo 1)
      const userIsAdmin = user.ruolo === 1;

      return res.status(200).json({
        success: true,
        message: 'Login effettuato con successo',
        data: {
          userId: user.id,
          username: user.username,
          nome: user.nome,
          cognome: user.cognome,
          isAdmin: userIsAdmin,
          token
        }
      });
    } catch (error: any) {
      logger.error('Errore durante il login:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante l\'autenticazione',
        error: error.message
      });
    }
  }

  /**
   * Recupera informazioni sull'utente attualmente autenticato
   */
  static async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Utente non autenticato'
        });
      }

      const user = await prisma.users.findUnique({
        where: { id: parseInt(userId) },
        select: {
          id: true,
          nome: true,
          cognome: true,
          username: true,
          email: true,
          ruolo: true,
          ultimo_login: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utente non trovato'
        });
      }

      // Considera direttamente l'isAdmin dal token se presente, altrimenti determina dal ruolo
      let isAdmin = (req.user as any)?.isAdmin;
      if (isAdmin === undefined) {
        isAdmin = user.ruolo === 1;
      }
      
      logger.debug(`getCurrentUser - utente ID: ${userId}`);

      return res.status(200).json({
        success: true,
        data: {
          ...user,
          isAdmin
        }
      });
    } catch (error: any) {
      logger.error('Errore nel recupero delle informazioni utente:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante il recupero delle informazioni utente',
        error: error.message
      });
    }
  }
}