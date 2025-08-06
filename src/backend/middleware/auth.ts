import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';

// Estendi l'interfaccia Request di Express per includere user e companyId
declare global {
  namespace Express {
    interface Request {
      user?: any;
      companyId?: number;
    }
  }
}

const prisma = new PrismaClient();
const logger = new Logger('Auth');

/**
 * Middleware per verificare il token JWT
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Token di autenticazione mancante'
    });
  }

  const token = authHeader.split(' ')[1];
  // Non logghiamo più il token per motivi di sicurezza
  logger.debug('Token ricevuto in authenticateJWT');
  
  const secretKey = process.env.JWT_SECRET || 'your-secret-key';

  try {
    const decoded = jwt.verify(token, secretKey);
    (req as any).user = decoded;
    next();
  } catch (error) {
    logger.error('Errore di autenticazione JWT:', error);
    return res.status(403).json({
      success: false,
      message: 'Token non valido o scaduto'
    });
  }
};

/**
 * Middleware per verificare se l'utente è un amministratore
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato'
      });
    }

    // Recuperare l'utente dal database
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) }
    });

    // Verifica se l'utente ha ruolo amministratore (assumiamo che il ruolo 1 sia admin)
    if (!user || user.ruolo !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato - Solo gli amministratori possono accedere a questa risorsa'
      });
    }

    next();
  } catch (error: any) {
    logger.error('Errore nella verifica del ruolo admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante la verifica dei permessi',
      error: error.message
    });
  }
};

/**
 * Middleware per verificare l'accesso a un'azienda specifica
 */
export const hasCompanyAccess = (companyIdParam: string = 'companyId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Utente non autenticato'
        });
      }

      // Ottenere l'ID azienda dalla richiesta (da route param, query param o body)
      let companyId = req.params[companyIdParam] || 
                      req.query[companyIdParam] || 
                      req.body[companyIdParam];

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'ID azienda non specificato'
        });
      }

      companyId = parseInt(companyId);

      // Verificare se l'utente ha accesso all'azienda
      const access = await prisma.user_aziende.findFirst({
        where: {
          user_id: parseInt(userId),
          azienda_id: companyId
        }
      });

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Accesso negato - Non hai permessi per questa azienda'
        });
      }

      next();
    } catch (error: any) {
      logger.error('Errore nella verifica dell\'accesso all\'azienda:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore durante la verifica dei permessi',
        error: error.message
      });
    }
  };
};

/**
 * Middleware per impostare il contesto dell'azienda corrente
 */
export const setCompanyContext = (req: Request, res: Response, next: NextFunction) => {
  const companyId = req.headers['x-company-id'] as string;
  
  if (companyId) {
    (req as any).companyId = parseInt(companyId);
  }
  
  next();
};