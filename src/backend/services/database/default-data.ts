/**
 * Dati predefiniti da inserire nelle tabelle al primo avvio
 * 
 * Questo modulo contiene i dati di default da inserire nelle tabelle fondamentali
 * quando l'applicazione viene avviata per la prima volta.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../../utils/logger';

export class DefaultDataInitializer {
  constructor(private prisma: PrismaClient) {}
  
  /**
   * Inizializza le tabelle con i dati predefiniti
   */
  async initializeDefaultData(): Promise<void> {
    try {
      logger.info('Inizializzazione dati predefiniti...');
      
      // Inizializza l'utente amministratore
      await this.initializeAdminUser();
      
      // Inizializza la configurazione di sistema
      await this.initializeSystemConfig();
      
      // Inizializza i codici IVA predefiniti
      await this.initializeIvaCodes();
      
      logger.info('Inizializzazione dati predefiniti completata!');
    } catch (error) {
      logger.error('Errore durante l\'inizializzazione dei dati predefiniti:', error);
      throw error;
    }
  }
  
  /**
   * Crea l'utente amministratore se non esiste già
   */
  private async initializeAdminUser(): Promise<void> {
    try {
      // Verifica se esiste già un utente amministratore
      const adminExists = await this.prisma.users.findFirst({
        where: { ruolo: 1 }
      });
      
      if (!adminExists) {
        logger.info('Creazione utente amministratore...');
        
        // Cripta la password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('!Localcloud3', saltRounds);
        
        // Debug: visualizza la password hashata
        console.log('Password admin hashata:', hashedPassword);
        
        // Crea l'utente amministratore
        const adminUser = await this.prisma.users.create({
          data: {
            nome: 'Amministratore',
            cognome: 'Cloud3',
            ruolo: 1,
            username: 'admin',
            password: hashedPassword,
            email: 'admin.cloud@adhocoil.com',
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        
        console.log('Utente amministratore creato:', {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email
        });
        
        logger.info('Utente amministratore creato con successo');
      } else {
        logger.info('Utente amministratore già esistente, inizializzazione saltata');
      }
    } catch (error) {
      logger.error('Errore durante l\'inizializzazione dell\'utente amministratore:', error);
      throw error;
    }
  }
  
  /**
   * Inizializza la configurazione di sistema
   */
  private async initializeSystemConfig(): Promise<void> {
    try {
      // Impostazioni di configurazione predefinite
      const defaultSettings = [
        {
          chiave: 'versione_app',
          valore: '1.0.0',
          descrizione: 'Versione corrente dell\'applicazione',
          categoria: 'sistema'
        },
        {
          chiave: 'nome_azienda',
          valore: 'AppFrantoi',
          descrizione: 'Nome dell\'azienda',
          categoria: 'azienda'
        },
        {
          chiave: 'data_inizializzazione',
          valore: new Date().toISOString(),
          descrizione: 'Data di inizializzazione del sistema',
          categoria: 'sistema'
        },
        {
          chiave: 'sessione_timeout',
          valore: '3600',
          descrizione: 'Timeout della sessione in secondi',
          categoria: 'sicurezza'
        }
      ];
      
      // Inserisci ogni configurazione se non esiste già
      for (const setting of defaultSettings) {
        const exists = await this.prisma.config.findFirst({
          where: { chiave: setting.chiave }
        });
        
        if (!exists) {
          await this.prisma.config.create({
            data: {
              chiave: setting.chiave,
              valore: setting.valore,
              descrizione: setting.descrizione,
              categoria: setting.categoria,
              data_creazione: new Date(),
              data_modifica: new Date()
            }
          });
          
          logger.info(`Configurazione '${setting.chiave}' creata`);
        }
      }
      
      logger.info('Configurazione di sistema inizializzata');
    } catch (error) {
      logger.error('Errore durante l\'inizializzazione della configurazione di sistema:', error);
      throw error;
    }
  }
  
  /**
   * Inizializza i codici IVA predefiniti
   */
  private async initializeIvaCodes(): Promise<void> {
    try {
      // Controlla se esistono già dei codici IVA
      const ivaCount = await this.prisma.codici_iva.count();
      
      if (ivaCount === 0) {
        logger.info('Inizializzazione codici IVA predefiniti...');
        
        // Codici IVA predefiniti in Italia
        const defaultIvaCodes = [
          { id: 1, percen: 4 },   // Aliquota ridotta (4%)
          { id: 2, percen: 5 },   // Aliquota ridotta (5%)
          { id: 3, percen: 10 },  // Aliquota ridotta (10%)
          { id: 4, percen: 22 }   // Aliquota ordinaria (22%)
        ];
        
        // Inserisci i codici IVA predefiniti
        for (const ivaCode of defaultIvaCodes) {
          await this.prisma.codici_iva.create({
            data: ivaCode
          });
        }
        
        logger.info(`Inseriti ${defaultIvaCodes.length} codici IVA predefiniti`);
      } else {
        logger.info('Codici IVA già presenti, inizializzazione saltata');
      }
    } catch (error) {
      logger.error('Errore durante l\'inizializzazione dei codici IVA:', error);
      throw error;
    }
  }
}