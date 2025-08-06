/**
 * Sistema di logging per registrare eventi di sistema nel database
 * 
 * Questo modulo fornisce funzionalità per registrare eventi di sistema 
 * sia nella tabella syslog che nei log di console
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

export class SystemLogger {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  /**
   * Registra un evento di sistema
   * @param level Livello del log (INFO, WARN, ERROR, DEBUG)
   * @param message Messaggio principale
   * @param details Dettagli aggiuntivi (opzionale)
   * @param userId ID dell'utente associato (opzionale)
   * @param ipAddress Indirizzo IP (opzionale)
   */
  async log(
    level: string,
    message: string,
    details?: any,
    userId?: number,
    ipAddress?: string
  ): Promise<void> {
    try {
      // Log su console
      switch (level.toUpperCase()) {
        case 'INFO':
          logger.info(message, details);
          break;
        case 'WARN':
          logger.warn(message, details);
          break;
        case 'ERROR':
          logger.error(message, details);
          break;
        case 'DEBUG':
          logger.debug(message, details);
          break;
        default:
          logger.info(message, details);
      }
      
      // Log su database
      await this.prisma.syslog.create({
        data: {
          livello: level.toUpperCase(),
          messaggio: message.substring(0, 254), // Tronca per evitare errori con VARCHAR(255)
          dettagli: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
          user_id: userId || null,
          ip_address: ipAddress || null,
          data: new Date()
        }
      });
    } catch (error) {
      logger.error(`Errore nella registrazione del log di sistema: ${message}`, error);
      // Non facciamo fallire l'applicazione se il logging fallisce
    }
  }
  
  /**
   * Registra un evento informativo
   */
  async info(message: string, details?: any, userId?: number, ipAddress?: string): Promise<void> {
    await this.log('INFO', message, details, userId, ipAddress);
  }
  
  /**
   * Registra un avviso
   */
  async warn(message: string, details?: any, userId?: number, ipAddress?: string): Promise<void> {
    await this.log('WARN', message, details, userId, ipAddress);
  }
  
  /**
   * Registra un errore
   */
  async error(message: string, details?: any, userId?: number, ipAddress?: string): Promise<void> {
    await this.log('ERROR', message, details, userId, ipAddress);
  }
  
  /**
   * Registra un messaggio di debug
   */
  async debug(message: string, details?: any, userId?: number, ipAddress?: string): Promise<void> {
    await this.log('DEBUG', message, details, userId, ipAddress);
  }
  
  /**
   * Registra un evento di accesso utente
   */
  async logAccess(userId: number, action: string, ipAddress: string, details?: any): Promise<void> {
    await this.info(`Accesso: ${action}`, details, userId, ipAddress);
  }
  
  /**
   * Registra un'operazione amministrativa
   */
  async logAdminAction(userId: number, action: string, targetId?: number, details?: any, ipAddress?: string): Promise<void> {
    const detailsWithTarget = { ...details, targetId };
    await this.info(`Admin: ${action}`, detailsWithTarget, userId, ipAddress);
  }
  
  /**
   * Registra un errore di sistema
   */
  async logSystemError(error: Error, context: string, userId?: number): Promise<void> {
    const details = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context
    };
    await this.error('Errore di sistema', details, userId);
  }
}