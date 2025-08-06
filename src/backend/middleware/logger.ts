/**
 * Middleware per il logging delle richieste HTTP
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { SystemLogger } from '../services/logging/system-logger';

// Inizializza il logger di sistema
const systemLogger = new SystemLogger();

/**
 * Middleware per il logging delle richieste HTTP e loro registrazione 
 * nel database se si tratta di operazioni significative
 */
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Logga l'inizio della richiesta
  logger.info(`${req.method} ${req.url}`);
  
  // Monitora il completamento della risposta
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;
    
    // Log su console sempre
    if (res.statusCode >= 500) {
      logger.error(logMessage);
    } else if (res.statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
    
    // Log su database solo per eventi significativi
    try {
      const userId = (req as any).user?.id;
      
      // Registra su database login, logout e operazioni admin
      if (
        (req.method === 'POST' && req.url.includes('/auth/login')) ||
        (req.method === 'POST' && req.url.includes('/auth/logout')) ||
        (req.url.includes('/admin/') && res.statusCode < 400) ||
        (res.statusCode >= 500)
      ) {
        systemLogger.log(
          res.statusCode >= 400 ? 'ERROR' : 'INFO',
          logMessage,
          {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
            userAgent: req.headers['user-agent'],
            contentType: req.headers['content-type']
          },
          userId,
          req.ip
        ).catch(err => {
          logger.error('Errore nella registrazione del log di sistema:', err);
        });
      }
    } catch (error) {
      logger.error('Errore nel middleware di logging:', error);
    }
  });
  
  next();
};