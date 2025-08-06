import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Logger } from '../../utils/logger';

/**
 * Classe per l'inizializzazione del database
 */
export class DatabaseInitializer {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor() {
    this.prisma = new PrismaClient();
    this.logger = new Logger('DatabaseInitializer');
  }

  /**
   * Verifica la struttura del database ed esegue i necessari aggiornamenti
   */
  async checkDatabaseStructure(): Promise<void> {
    try {
      this.logger.info('Verifica della struttura del database in corso...');
      
      // Verifica se esiste la colonna ultimoidsoggetto nella tabella aziende
      const hasUltimoIdSoggetto = await this.columnExists('aziende', 'ultimoidsoggetto');
      
      if (!hasUltimoIdSoggetto) {
        this.logger.info('Aggiunta della colonna ultimoidsoggetto alla tabella aziende...');
        
        // Crea la colonna ultimoidsoggetto se non esiste
        await this.prisma.$executeRaw`
          ALTER TABLE "aziende" ADD COLUMN IF NOT EXISTS "ultimoidsoggetto" INTEGER NOT NULL DEFAULT 0;
        `;
        
        this.logger.info('Colonna ultimoidsoggetto aggiunta con successo.');
      } else {
        this.logger.info('La colonna ultimoidsoggetto esiste già nella tabella aziende.');
      }
      
      this.logger.info('Verifica della struttura del database completata.');
    } catch (error) {
      this.logger.error('Errore durante la verifica della struttura del database:', error);
      throw error;
    }
  }

  /**
   * Verifica se una colonna esiste in una tabella
   */
  private async columnExists(tableName: string, columnName: string): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${tableName} AND column_name = ${columnName};
      `;
      
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      this.logger.error(`Errore durante la verifica dell'esistenza della colonna ${columnName}:`, error);
      throw error;
    }
  }

  /**
   * Importa i dati da una directory
   */
  async importDataFromDirectory(directory: string): Promise<void> {
    try {
      this.logger.info(`Importazione dati da ${directory}`);
      
      // Verifica se la directory esiste
      if (!fs.existsSync(directory)) {
        throw new Error(`La directory ${directory} non esiste`);
      }
      
      // Leggi e importa i file CSV con i nomi corretti (minuscoli)
      await this.importCategorieOlio(path.join(directory, 'categorie_olio.csv'));
      await this.importMacroaree(path.join(directory, 'macroaree.csv'));
      await this.importOriginiSpecifiche(path.join(directory, 'origini_specifiche.csv'));
      await this.importProvince(path.join(directory, 'province.csv'));
      await this.importComuni(path.join(directory, 'comuni.csv'));
      
      this.logger.info('Importazione dati completata con successo');
    } catch (error) {
      this.logger.error('Errore durante l\'importazione dei dati:', error);
      throw error;
    }
  }
  
  /**
   * Importa le categorie olio dal file CSV
   */
  private async importCategorieOlio(filePath: string): Promise<void> {
    try {
      this.logger.info(`Importazione categorie olio da ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`File ${filePath} non trovato, importazione categorie olio saltata`);
        return;
      }
      
      const records: any[] = [];
      
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator: ';' }))
          .on('data', (data) => {
            // Verifica i possibili nomi delle colonne nel file CSV
            const id = data['id'] || data['ID'] || data[Object.keys(data)[0]] || '';
            const acronimo = data['acronimo'] || data['ACRONIMO'] || data[Object.keys(data)[1]] || '';
            const descrizione = data['descrizione'] || data['DESCRIZ'] || data[Object.keys(data)[2]] || '';
            
            if (acronimo && descrizione) {
              records.push({
                id: parseInt(id) || undefined,
                acronimo: acronimo.toString().trim(),
                descrizione: descrizione.toString().trim()
              });
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });
      
      this.logger.info(`Trovate ${records.length} categorie olio da importare`);
      
      // Inserisci i record nel database
      let processedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      for (const record of records) {
        try {
          // Prima verifica se esiste già con lo stesso ID
          if (record.id) {
            const existingById = await this.prisma.categorie_olio.findUnique({
              where: { id: record.id }
            });
            
            if (existingById) {
              // Aggiorna il record esistente per ID
              await this.prisma.categorie_olio.update({
                where: { id: existingById.id },
                data: { 
                  acronimo: record.acronimo,
                  descrizione: record.descrizione
                }
              });
              updatedCount++;
              processedCount++;
              continue;
            }
          }
          
          // Poi verifica se esiste con lo stesso acronimo
          const existingByAcronimo = await this.prisma.categorie_olio.findFirst({
            where: { acronimo: record.acronimo }
          });
          
          if (existingByAcronimo) {
            // Aggiorna il record esistente
            await this.prisma.categorie_olio.update({
              where: { id: existingByAcronimo.id },
              data: { descrizione: record.descrizione }
            });
            updatedCount++;
          } else {
            // Crea un nuovo record senza specificare l'ID
            await this.prisma.categorie_olio.create({
              data: {
                acronimo: record.acronimo,
                descrizione: record.descrizione
              }
            });
          }
          processedCount++;
        } catch (error: any) {
          this.logger.warn(`Errore durante l'elaborazione della categoria olio '${record.descrizione}': ${error.message}`);
          skippedCount++;
        }
      }
      
      this.logger.info(`Categorie olio: ${processedCount} elaborate, ${updatedCount} aggiornate, ${skippedCount} saltate`);
      
      
      this.logger.info('Importazione categorie olio completata');
    } catch (error) {
      this.logger.error('Errore durante l\'importazione delle categorie olio:', error);
      throw error;
    }
  }
  
  /**
   * Importa le macroaree dal file CSV
   */
  private async importMacroaree(filePath: string): Promise<void> {
    try {
      this.logger.info(`Importazione macroaree da ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`File ${filePath} non trovato, importazione macroaree saltata`);
        return;
      }
      
      const records: any[] = [];
      
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator: ';' }))
          .on('data', (data) => {
            // Verifica i possibili nomi delle colonne nel file CSV
            const id = data['id'] || data['ID'] || '';
            const acronimo = data['acronimo'] || data['ACRONIMO'] || data[Object.keys(data)[1]] || '';
            const descrizione = data['descrizione'] || data['DESCRIZ'] || data[Object.keys(data)[2]] || '';
            const flag_orig = data['flag_orig'] || data['FLAG_ORIG'] || '';
            
            if (acronimo && descrizione) {
              records.push({
                id: parseInt(id) || undefined,
                acronimo: acronimo.toString().trim(),
                descrizione: descrizione.toString().trim(),
                flag_orig: flag_orig === 'S' || flag_orig === '1' || flag_orig === 'true'
              });
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });
      
      this.logger.info(`Trovate ${records.length} macroaree da importare`);
      
      // Inserisci i record nel database
      let processedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      for (const record of records) {
        try {
          // Prima verifica se esiste già con lo stesso ID
          if (record.id) {
            const existingById = await this.prisma.macroaree.findUnique({
              where: { id: record.id }
            });
            
            if (existingById) {
              // Aggiorna il record esistente per ID
              await this.prisma.macroaree.update({
                where: { id: existingById.id },
                data: { 
                  acronimo: record.acronimo,
                  descrizione: record.descrizione,
                  flag_orig: record.flag_orig
                }
              });
              updatedCount++;
              processedCount++;
              continue;
            }
          }
          
          // Poi verifica se esiste con lo stesso acronimo
          const existingByAcronimo = await this.prisma.macroaree.findFirst({
            where: { acronimo: record.acronimo }
          });
          
          if (existingByAcronimo) {
            // Aggiorna il record esistente
            await this.prisma.macroaree.update({
              where: { id: existingByAcronimo.id },
              data: { 
                descrizione: record.descrizione,
                flag_orig: record.flag_orig
              }
            });
            updatedCount++;
          } else {
            // Crea un nuovo record senza specificare l'ID
            await this.prisma.macroaree.create({
              data: {
                acronimo: record.acronimo,
                descrizione: record.descrizione,
                flag_orig: record.flag_orig
              }
            });
          }
          processedCount++;
        } catch (error: any) {
          this.logger.warn(`Errore durante l'elaborazione della macroarea '${record.descrizione}': ${error.message}`);
          skippedCount++;
        }
      }
      
      this.logger.info(`Macroaree: ${processedCount} elaborate, ${updatedCount} aggiornate, ${skippedCount} saltate`);
      
      
      this.logger.info('Importazione macroaree completata');
    } catch (error) {
      this.logger.error('Errore durante l\'importazione delle macroaree:', error);
      throw error;
    }
  }
  
  /**
   * Importa le origini specifiche dal file CSV
   */
  private async importOriginiSpecifiche(filePath: string): Promise<void> {
    try {
      this.logger.info(`Importazione origini specifiche da ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`File ${filePath} non trovato, importazione origini specifiche saltata`);
        return;
      }
      
      const records: any[] = [];
      
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator: ';' }))
          .on('data', (data) => {
            // Verifica i possibili nomi delle colonne
            const id = data['id'] || data['ID'] || '';
            const acronimo = data['acronimo'] || data['ACRONIMO'] || data[Object.keys(data)[1]] || '';
            const descrizione = data['descrizione'] || data['DESCRIZ'] || data[Object.keys(data)[2]] || '';
            const flag_dop = data['flag_dop'] || data['FLAG_DOP'] || '';
            const flag_raccolta = data['flag_raccolta'] || data['FLAG_RACCOLTA'] || '';
            const flag_molitura = data['flag_molitura'] || data['FLAG_MOLITURA'] || '';
            const flag_annata = data['flag_annata'] || data['FLAG_ANNATA'] || '';
            const flag_colla_da = data['flag_colla_da'] || data['FLAG_COLLA_DA'] || '';
            const flag_colla_a = data['flag_colla_a'] || data['FLAG_COLLA_A'] || '';
            const flag_capacita = data['flag_capacita'] || data['FLAG_CAPACITA'] || '';
            const flag_certifi = data['flag_certifi'] || data['FLAG_CERTIFI'] || '';
            
            if (acronimo && descrizione) {
              records.push({
                id: parseInt(id) || undefined,
                acronimo: acronimo.toString().trim(),
                descrizione: descrizione.toString().trim(),
                flag_dop: flag_dop === 'S' || flag_dop === '1' || flag_dop === 'true',
                flag_raccolta: flag_raccolta === 'S' || flag_raccolta === '1' || flag_raccolta === 'true',
                flag_molitura: flag_molitura === 'S' || flag_molitura === '1' || flag_molitura === 'true',
                flag_annata: flag_annata === 'S' || flag_annata === '1' || flag_annata === 'true',
                flag_colla_da: flag_colla_da === 'S' || flag_colla_da === '1' || flag_colla_da === 'true',
                flag_colla_a: flag_colla_a === 'S' || flag_colla_a === '1' || flag_colla_a === 'true',
                flag_capacita: flag_capacita === 'S' || flag_capacita === '1' || flag_capacita === 'true',
                flag_certifi: flag_certifi === 'S' || flag_certifi === '1' || flag_certifi === 'true'
              });
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });
      
      this.logger.info(`Trovate ${records.length} origini specifiche da importare`);
      
      // Inserisci i record nel database
      let processedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      for (const record of records) {
        try {
          // Prima verifica se esiste già con lo stesso ID
          if (record.id) {
            const existingById = await this.prisma.origini_specifiche.findUnique({
              where: { id: record.id }
            });
            
            if (existingById) {
              // Aggiorna il record esistente per ID
              await this.prisma.origini_specifiche.update({
                where: { id: existingById.id },
                data: { 
                  acronimo: record.acronimo,
                  descrizione: record.descrizione,
                  flag_dop: record.flag_dop,
                  flag_raccolta: record.flag_raccolta,
                  flag_molitura: record.flag_molitura,
                  flag_annata: record.flag_annata,
                  flag_colla_da: record.flag_colla_da,
                  flag_colla_a: record.flag_colla_a,
                  flag_capacita: record.flag_capacita,
                  flag_certifi: record.flag_certifi
                }
              });
              updatedCount++;
              processedCount++;
              continue;
            }
          }
          
          // Poi verifica se esiste con lo stesso acronimo
          const existingByAcronimo = await this.prisma.origini_specifiche.findFirst({
            where: { acronimo: record.acronimo }
          });
          
          if (existingByAcronimo) {
            // Aggiorna il record esistente
            await this.prisma.origini_specifiche.update({
              where: { id: existingByAcronimo.id },
              data: { 
                descrizione: record.descrizione,
                flag_dop: record.flag_dop,
                flag_raccolta: record.flag_raccolta,
                flag_molitura: record.flag_molitura,
                flag_annata: record.flag_annata,
                flag_colla_da: record.flag_colla_da,
                flag_colla_a: record.flag_colla_a,
                flag_capacita: record.flag_capacita,
                flag_certifi: record.flag_certifi
              }
            });
            updatedCount++;
          } else {
            // Crea un nuovo record senza specificare l'ID
            await this.prisma.origini_specifiche.create({
              data: {
                acronimo: record.acronimo,
                descrizione: record.descrizione,
                flag_dop: record.flag_dop,
                flag_raccolta: record.flag_raccolta,
                flag_molitura: record.flag_molitura,
                flag_annata: record.flag_annata,
                flag_colla_da: record.flag_colla_da,
                flag_colla_a: record.flag_colla_a,
                flag_capacita: record.flag_capacita,
                flag_certifi: record.flag_certifi
              }
            });
          }
          processedCount++;
        } catch (error: any) {
          this.logger.warn(`Errore durante l'elaborazione dell'origine specifica '${record.descrizione}': ${error.message}`);
          skippedCount++;
        }
      }
      
      this.logger.info(`Origini specifiche: ${processedCount} elaborate, ${updatedCount} aggiornate, ${skippedCount} saltate`);
      
      
      this.logger.info('Importazione origini specifiche completata');
    } catch (error) {
      this.logger.error('Errore durante l\'importazione delle origini specifiche:', error);
      throw error;
    }
  }
  
  /**
   * Importa le province dal file CSV
   */
  private async importProvince(filePath: string): Promise<void> {
    try {
      this.logger.info(`Importazione province da ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`File ${filePath} non trovato, importazione province saltata`);
        return;
      }
      
      const records: any[] = [];
      
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator: ';' }))
          .on('data', (data) => {
            // Verifica i possibili nomi delle colonne
            const id = data['id'] || data['ID'] || '';
            const descrizione = data['descrizione'] || data['DESCRIZ'] || data[Object.keys(data)[1]] || '';
            const targa = data['targa'] || data['TARGA'] || data[Object.keys(data)[2]] || '';
            
            if (descrizione && targa) {
              records.push({
                id: parseInt(id) || undefined,
                descrizione: descrizione.toString().trim(),
                targa: targa.toString().trim()
              });
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });
      
      this.logger.info(`Trovate ${records.length} province da importare`);
      
      // Inserisci i record nel database
      let processedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      for (const record of records) {
        try {
          // Prima verifica se esiste già con lo stesso ID
          if (record.id) {
            const existingById = await this.prisma.province.findUnique({
              where: { id: record.id }
            });
            
            if (existingById) {
              // Aggiorna il record esistente per ID
              await this.prisma.province.update({
                where: { id: existingById.id },
                data: { 
                  descrizione: record.descrizione,
                  targa: record.targa
                }
              });
              updatedCount++;
              processedCount++;
              continue;
            }
          }
          
          // Poi verifica se esiste con la stessa targa
          const existingByTarga = await this.prisma.province.findFirst({
            where: { targa: record.targa }
          });
          
          if (existingByTarga) {
            // Aggiorna il record esistente
            await this.prisma.province.update({
              where: { id: existingByTarga.id },
              data: { descrizione: record.descrizione }
            });
            updatedCount++;
          } else {
            // Crea un nuovo record senza specificare l'ID
            await this.prisma.province.create({
              data: {
                descrizione: record.descrizione,
                targa: record.targa
              }
            });
          }
          processedCount++;
        } catch (error: any) {
          this.logger.warn(`Errore durante l'elaborazione della provincia '${record.descrizione}': ${error.message}`);
          skippedCount++;
        }
      }
      
      this.logger.info(`Province: ${processedCount} elaborate, ${updatedCount} aggiornate, ${skippedCount} saltate`);
      
      
      this.logger.info('Importazione province completata');
    } catch (error) {
      this.logger.error('Errore durante l\'importazione delle province:', error);
      throw error;
    }
  }
  
  /**
   * Importa i comuni dal file CSV
   */
  private async importComuni(filePath: string): Promise<void> {
    try {
      this.logger.info(`Importazione comuni da ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`File ${filePath} non trovato, importazione comuni saltata`);
        return;
      }
      
      const records: any[] = [];
      
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator: ';' }))
          .on('data', (data) => {
            // Verifica i possibili nomi delle colonne
            const id = data['id'] || data['ID'] || '';
            const descrizione = data['descrizione'] || data['DESCRIZ'] || data[Object.keys(data)[1]] || '';
            const cod_istat = data['cod_istat'] || data['COD_ISTAT'] || data[Object.keys(data)[2]] || '';
            const cod_cf = data['cod_cf'] || data['COD_CF'] || data[Object.keys(data)[3]] || '';
            
            if (descrizione && (cod_istat || cod_cf)) {
              records.push({
                id: parseInt(id) || undefined,
                descrizione: descrizione.toString().trim(),
                cod_istat: parseInt(cod_istat) || 0,
                cod_cf: (cod_cf || '').toString().trim()
              });
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });
      
      this.logger.info(`Trovati ${records.length} comuni da importare`);
      
      // Inserisci i record nel database
      let processedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      for (const record of records) {
        try {
          // Prima verifica se esiste già con lo stesso ID
          if (record.id) {
            const existingById = await this.prisma.comuni.findUnique({
              where: { id: record.id }
            });
            
            if (existingById) {
              // Aggiorna il record esistente per ID
              await this.prisma.comuni.update({
                where: { id: existingById.id },
                data: { 
                  descrizione: record.descrizione,
                  cod_istat: record.cod_istat,
                  cod_cf: record.cod_cf
                }
              });
              updatedCount++;
              processedCount++;
              continue;
            }
          }
          
          // Poi verifica se esiste con lo stesso cod_cf
          const existingByCodCf = await this.prisma.comuni.findFirst({
            where: { cod_cf: record.cod_cf }
          });
          
          if (existingByCodCf) {
            // Aggiorna il record esistente
            await this.prisma.comuni.update({
              where: { id: existingByCodCf.id },
              data: { 
                descrizione: record.descrizione,
                cod_istat: record.cod_istat
              }
            });
            updatedCount++;
          } else {
            try {
              // Se il codice arriva qui, significa che non esiste un comune con questo ID o cod_cf
              // Proviamo a creare il comune con l'ID specificato nel CSV
              if (record.id) {
                await this.prisma.comuni.create({
                  data: {
                    id: record.id,
                    descrizione: record.descrizione,
                    cod_istat: record.cod_istat,
                    cod_cf: record.cod_cf
                  }
                });
              } else {
                // Se non c'è ID nel CSV, usiamo un ID generato da Prisma
                await this.prisma.comuni.create({
                  data: {
                    descrizione: record.descrizione,
                    cod_istat: record.cod_istat,
                    cod_cf: record.cod_cf
                  }
                });
              }
            } catch (createError: any) {
              // Se fallisce con errore di unicità, proviamo ancora con un approccio diverso
              if (createError.code === 'P2002') {
                // Troviamo l'ID massimo attualmente in uso
                const maxIdResult = await this.prisma.$queryRaw<{max_id: number}[]>`
                  SELECT MAX(id) as max_id FROM comuni
                `;
                const maxId = maxIdResult[0]?.max_id || 0;
                
                // Usiamo un ID sicuramente libero (maxId + 10000 per sicurezza)
                await this.prisma.comuni.create({
                  data: {
                    id: maxId + 10000 + Math.floor(Math.random() * 1000),
                    descrizione: record.descrizione,
                    cod_istat: record.cod_istat,
                    cod_cf: record.cod_cf
                  }
                });
                this.logger.warn(`Comune ${record.descrizione} creato con ID alternativo perché l'ID originale ${record.id} era già in uso`);
              } else {
                // Se è un altro tipo di errore, lo rilanciamo
                throw createError;
              }
            }
          }
          processedCount++;
        } catch (error: any) {
          this.logger.warn(`Errore durante l'elaborazione del comune '${record.descrizione}': ${error.message}`);
          skippedCount++;
        }
      }
      
      this.logger.info(`Comuni: ${processedCount} elaborati, ${updatedCount} aggiornati, ${skippedCount} saltati`);
      
      
      this.logger.info('Importazione comuni completata');
    } catch (error) {
      this.logger.error('Errore durante l\'importazione dei comuni:', error);
      throw error;
    }
  }
}