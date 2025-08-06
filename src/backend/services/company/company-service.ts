import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '../../utils/logger';
import { CompanyTablesCreator } from './company-tables-creator';

/**
 * Interfaccia per i dati di creazione azienda
 */
interface CreateCompanyData {
  descrizione: string;
  codice: string;
  ultimoidsoggetto?: number;
}

/**
 * Interfaccia per i dati di aggiornamento azienda
 */
interface UpdateCompanyData {
  descrizione?: string;
  ultimoidsoggetto?: number;
  coordinate?: string;
  email_mittente?: string;
  email_password?: string;
  email_smtp_server?: string;
  email_smtp_port?: number;
  email_ssl?: boolean;
  email_default_oggetto?: string;
  email_firma?: string;
}

/**
 * Servizio per la gestione delle aziende
 */
export class CompanyService {
  private prisma: PrismaClient;
  private logger: Logger;
  private tablesCreator: CompanyTablesCreator;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
    this.tablesCreator = new CompanyTablesCreator(prisma, logger);
  }

  /**
   * Crea una nuova azienda con tutte le sue tabelle
   */
  async createCompany(data: CreateCompanyData, userId: number): Promise<any> {
    try {
      this.logger.info(`Creazione nuova azienda: ${data.descrizione} (${data.codice})`);

      // Validazione del codice azienda
      if (!/^[a-z0-9]{5}$/.test(data.codice)) {
        throw new Error('Codice azienda non valido. Deve essere di 5 caratteri alfanumerici minuscoli.');
      }

      // Verificare se il codice azienda è già in uso
      const existingCompany = await this.prisma.aziende.findUnique({
        where: { codice: data.codice }
      });

      if (existingCompany) {
        throw new Error(`Il codice azienda ${data.codice} è già in uso.`);
      }

      // Verificare se le tabelle esistono già (controllo aggiuntivo)
      const tablesExist = await this.tablesCreator.tablesExist(data.codice);
      if (tablesExist) {
        throw new Error(`Esistono già tabelle con il prefisso ${data.codice.toLowerCase()}. Scegliere un altro codice.`);
      }

      // Creare l'azienda e le relative tabelle in una transazione
      const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Creare il record azienda
        const company = await tx.aziende.create({
          data: {
            descrizione: data.descrizione,
            codice: data.codice,
            ultimoidsoggetto: data.ultimoidsoggetto || 0
          }
        });

        // 2. Registrare l'operazione di creazione
        await tx.syslog.create({
          data: {
            livello: 'INFO',
            messaggio: `Creata azienda ${data.descrizione} (${data.codice})`,
            dettagli: 'Creazione avviata',
            user_id: userId
          }
        });

        return company;
      });

      // 3. Creare le tabelle (questo viene fatto fuori dalla transazione 
      // principale perché le operazioni DDL possono avere problemi con le transazioni)
      await this.tablesCreator.createTables(data.codice);

      // 4. Loggare il completamento
      await this.prisma.syslog.create({
        data: {
          livello: 'INFO',
          messaggio: `Completata creazione azienda ${data.descrizione} (${data.codice})`,
          dettagli: 'Tabelle create correttamente',
          user_id: userId
        }
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Errore nella creazione dell'azienda:`, error);

      // Registrare l'errore
      await this.prisma.syslog.create({
        data: {
          livello: 'ERROR',
          messaggio: `Errore creazione azienda ${data.descrizione} (${data.codice})`,
          dettagli: error.message,
          user_id: userId
        }
      });

      throw error;
    }
  }

  /**
   * Recupera tutte le aziende
   */
  async getAllCompanies() {
    return await this.prisma.aziende.findMany({
      orderBy: { descrizione: 'asc' }
    });
  }

  /**
   * Recupera le aziende a cui ha accesso un utente
   */
  async getUserCompanies(userId: number) {
    return await this.prisma.aziende.findMany({
      where: {
        utenti: {
          some: {
            user_id: userId
          }
        }
      },
      orderBy: { descrizione: 'asc' }
    });
  }

  /**
   * Assegna un utente a un'azienda
   */
  async assignUserToCompany(userId: number, companyId: number, adminUserId: number) {
    try {
      // Verificare se l'associazione esiste già
      const existingAssignment = await this.prisma.user_aziende.findFirst({
        where: {
          user_id: userId,
          azienda_id: companyId
        }
      });

      if (existingAssignment) {
        return existingAssignment; // L'associazione esiste già
      }

      // Creare l'associazione
      const result = await this.prisma.user_aziende.create({
        data: {
          user_id: userId,
          azienda_id: companyId
        }
      });

      // Loggare l'operazione
      await this.prisma.syslog.create({
        data: {
          livello: 'INFO',
          messaggio: `Utente ${userId} assegnato all'azienda ${companyId}`,
          user_id: adminUserId
        }
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Errore nell'assegnazione dell'utente all'azienda:`, error);
      throw error;
    }
  }

  /**
   * Rimuove un utente da un'azienda
   */
  async removeUserFromCompany(userId: number, companyId: number, adminUserId: number) {
    try {
      const result = await this.prisma.user_aziende.deleteMany({
        where: {
          user_id: userId,
          azienda_id: companyId
        }
      });

      // Loggare l'operazione se è stata effettivamente rimossa un'associazione
      if (result.count > 0) {
        await this.prisma.syslog.create({
          data: {
            livello: 'INFO',
            messaggio: `Utente ${userId} rimosso dall'azienda ${companyId}`,
            user_id: adminUserId
          }
        });
      }

      return result;
    } catch (error: any) {
      this.logger.error(`Errore nella rimozione dell'utente dall'azienda:`, error);
      throw error;
    }
  }

  /**
   * Recupera i dettagli di un'azienda specifica
   */
  async getCompanyById(companyId: number, userId: number) {
    try {
      // Verificare se l'utente ha accesso all'azienda (a meno che non sia un admin)
      const userIsAdmin = await this.isUserAdmin(userId);
      
      if (!userIsAdmin) {
        const userHasAccess = await this.prisma.user_aziende.findFirst({
          where: {
            user_id: userId,
            azienda_id: companyId
          }
        });
        
        if (!userHasAccess) {
          const error: any = new Error('Accesso negato a questa azienda');
          error.statusCode = 403;
          throw error;
        }
      }
      
      // Recuperare i dati dell'azienda
      const company = await this.prisma.aziende.findUnique({
        where: { id: companyId }
      });
      
      if (!company) {
        const error: any = new Error('Azienda non trovata');
        error.statusCode = 404;
        throw error;
      }
      
      return company;
    } catch (error: any) {
      this.logger.error(`Errore nel recupero dell'azienda ${companyId}:`, error);
      throw error;
    }
  }
  
  /**
   * Aggiorna i dettagli di un'azienda
   */
  async updateCompany(companyId: number, data: UpdateCompanyData, userId: number) {
    try {
      // Verificare se l'utente ha accesso all'azienda (a meno che non sia un admin)
      const userIsAdmin = await this.isUserAdmin(userId);
      
      if (!userIsAdmin) {
        const userHasAccess = await this.prisma.user_aziende.findFirst({
          where: {
            user_id: userId,
            azienda_id: companyId
          }
        });
        
        if (!userHasAccess) {
          const error: any = new Error('Accesso negato a questa azienda');
          error.statusCode = 403;
          throw error;
        }
      }
      
      // Verificare che l'azienda esista
      const company = await this.prisma.aziende.findUnique({
        where: { id: companyId }
      });
      
      if (!company) {
        const error: any = new Error('Azienda non trovata');
        error.statusCode = 404;
        throw error;
      }
      
      // Aggiornare i dati dell'azienda
      const updatedCompany = await this.prisma.aziende.update({
        where: { id: companyId },
        data: {
          ...(data.descrizione !== undefined && { descrizione: data.descrizione }),
          ...(data.ultimoidsoggetto !== undefined && { ultimoidsoggetto: data.ultimoidsoggetto }),
          ...(data.coordinate !== undefined && { coordinate: data.coordinate }),
          ...(data.email_mittente !== undefined && { email_mittente: data.email_mittente }),
          ...(data.email_password !== undefined && { email_password: data.email_password }),
          ...(data.email_smtp_server !== undefined && { email_smtp_server: data.email_smtp_server }),
          ...(data.email_smtp_port !== undefined && { email_smtp_port: data.email_smtp_port }),
          ...(data.email_ssl !== undefined && { email_ssl: data.email_ssl }),
          ...(data.email_default_oggetto !== undefined && { email_default_oggetto: data.email_default_oggetto }),
          ...(data.email_firma !== undefined && { email_firma: data.email_firma })
        }
      });
      
      // Loggare l'operazione
      await this.prisma.syslog.create({
        data: {
          livello: 'INFO',
          messaggio: `Azienda ${companyId} aggiornata`,
          dettagli: JSON.stringify(data),
          user_id: userId
        }
      });
      
      return updatedCompany;
    } catch (error: any) {
      this.logger.error(`Errore nell'aggiornamento dell'azienda ${companyId}:`, error);
      throw error;
    }
  }

  /**
   * Verifica se un utente è amministratore
   * @private
   */
  private async isUserAdmin(userId: number): Promise<boolean> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId }
    });
    
    // Considerare l'utente come admin se ha ruolo = 1
    return user?.ruolo === 1;
  }
}