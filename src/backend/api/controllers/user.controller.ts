import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Logger } from '../../utils/logger';

const prisma = new PrismaClient();
const logger = new Logger('UserController');

/**
 * Controller per la gestione degli utenti
 */
export class UserController {
  /**
   * Recupera tutti gli utenti (per admin)
   */
  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.users.findMany({
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
        },
        orderBy: { cognome: 'asc' }
      });
      
      return res.status(200).json({
        success: true,
        data: users
      });
    } catch (error: any) {
      logger.error('Errore nel recupero degli utenti:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante il recupero degli utenti',
        error: error.message
      });
    }
  }

  /**
   * Crea un nuovo utente (per admin)
   */
  static async createUser(req: Request, res: Response) {
    try {
      const { nome, cognome, username, password, email, ruolo } = req.body;

      // Validazione input
      if (!nome || !cognome || !username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nome, cognome, username e password sono obbligatori'
        });
      }

      // Verifica se l'username è già in uso
      const existingUser = await prisma.users.findUnique({
        where: { username }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username già in uso'
        });
      }

      // Verifica se l'email è già in uso (se fornita)
      if (email) {
        const existingEmail = await prisma.users.findUnique({
          where: { email }
        });

        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: 'Email già in uso'
          });
        }
      }

      // Hash della password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Crea l'utente
      const user = await prisma.users.create({
        data: {
          nome,
          cognome,
          username,
          password: hashedPassword,
          email,
          ruolo: ruolo || 2 // Default: utente normale (2), admin (1)
        },
        select: {
          id: true,
          nome: true,
          cognome: true,
          username: true,
          email: true,
          ruolo: true,
          created_at: true
        }
      });

      // Registra la creazione dell'utente nei log
      const adminUserId = (req.user as any)?.id;
      await prisma.syslog.create({
        data: {
          livello: 'INFO',
          messaggio: `Creato utente ${username}`,
          user_id: adminUserId,
          ip_address: req.ip
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Utente creato con successo',
        data: user
      });
    } catch (error: any) {
      logger.error('Errore nella creazione dell\'utente:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante la creazione dell\'utente',
        error: error.message
      });
    }
  }

  /**
   * Aggiorna un utente (per admin o l'utente stesso)
   */
  static async updateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { nome, cognome, email, ruolo, password } = req.body;

      // Verifica i permessi: solo l'admin può modificare il ruolo
      // e solo l'admin o l'utente stesso possono modificare i propri dati
      const currentUserId = (req.user as any)?.id;
      const currentUserRuolo = (req.user as any)?.ruolo;
      const isAdmin = currentUserRuolo === 1;
      const isSameUser = currentUserId === userId;

      if (!isAdmin && !isSameUser) {
        return res.status(403).json({
          success: false,
          message: 'Non hai i permessi per modificare questo utente'
        });
      }

      // Se non è admin, rimuove il campo ruolo per sicurezza
      const updateData: any = {};
      
      if (nome) updateData.nome = nome;
      if (cognome) updateData.cognome = cognome;
      if (email) updateData.email = email;
      
      // Solo l'admin può modificare il ruolo
      if (isAdmin && ruolo !== undefined) {
        updateData.ruolo = ruolo;
      }

      // Se viene fornita una nuova password, hashala
      if (password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(password, saltRounds);
      }

      // Aggiorna l'utente
      const user = await prisma.users.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          nome: true,
          cognome: true,
          username: true,
          email: true,
          ruolo: true,
          ultimo_login: true,
          updated_at: true
        }
      });

      // Registra l'aggiornamento nei log
      await prisma.syslog.create({
        data: {
          livello: 'INFO',
          messaggio: `Aggiornato utente ${user.username}`,
          user_id: currentUserId,
          ip_address: req.ip
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Utente aggiornato con successo',
        data: user
      });
    } catch (error: any) {
      logger.error('Errore nell\'aggiornamento dell\'utente:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante l\'aggiornamento dell\'utente',
        error: error.message
      });
    }
  }

  /**
   * Recupera gli utenti associati a un'azienda (per admin)
   */
  static async getCompanyUsers(req: Request, res: Response) {
    try {
      const companyId = parseInt(req.params.companyId);

      const users = await prisma.users.findMany({
        where: {
          accessi: {
            some: {
              azienda_id: companyId
            }
          }
        },
        select: {
          id: true,
          nome: true,
          cognome: true,
          username: true,
          email: true,
          ruolo: true
        },
        orderBy: { cognome: 'asc' }
      });

      return res.status(200).json({
        success: true,
        data: users
      });
    } catch (error: any) {
      logger.error(`Errore nel recupero degli utenti dell'azienda ${req.params.companyId}:`, error);
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante il recupero degli utenti dell\'azienda',
        error: error.message
      });
    }
  }
}