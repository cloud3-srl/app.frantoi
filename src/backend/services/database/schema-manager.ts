/**
 * Schema Manager - Gestisce la sincronizzazione dello schema del database
 * 
 * Questo modulo verifica e sincronizza lo schema del database con la definizione JSON
 * Crea tabelle mancanti, aggiunge campi mancanti e aggiorna tipi di campo se necessario
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';

interface FieldDefinition {
  name: string;
  type: string;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  required?: boolean;
  unique?: boolean;
  default?: any;
  references?: string;
}

interface TableDefinition {
  description: string;
  fields: FieldDefinition[];
  uniqueConstraints?: Array<{
    fields: string[];
    name: string;
  }>;
}

interface SchemaDefinition {
  version: string;
  lastUpdated: string;
  tables: {
    [tableName: string]: TableDefinition;
  };
}

export class SchemaManager {
  private schemaDefinition: SchemaDefinition;
  
  constructor(private prisma: PrismaClient) {
    // Carica lo schema di riferimento
    const schemaPath = path.join(__dirname, 'database-schema.json');
    this.schemaDefinition = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  }
  
  /**
   * Esegue la sincronizzazione dello schema del database
   */
  async synchronizeSchema(): Promise<void> {
    logger.info('Sincronizzazione schema database...');
    
    // Per ogni tabella nella definizione
    for (const tableName of Object.keys(this.schemaDefinition.tables)) {
      const tableExists = await this.tableExists(tableName);
      
      if (!tableExists) {
        logger.info(`Tabella ${tableName} non trovata, creazione...`);
        await this.createTable(tableName);
      } else {
        logger.info(`Tabella ${tableName} trovata, verifica campi...`);
        await this.updateTable(tableName);
      }
    }
    
    logger.info('Sincronizzazione schema completata!');
  }
  
  /**
   * Verifica se una tabella esiste nel database
   */
  private async tableExists(tableName: string): Promise<boolean> {
    try {
      // Utilizza Prisma per interrogare il database
      const result = await this.prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      `;
      
      // result è un array con un oggetto che ha una proprietà exists
      return (result as any)[0].exists;
    } catch (error) {
      logger.error(`Errore nella verifica dell'esistenza della tabella ${tableName}:`, error);
      return false;
    }
  }
  
  /**
   * Crea una nuova tabella nel database
   */
  private async createTable(tableName: string): Promise<void> {
    try {
      const tableDefinition = this.schemaDefinition.tables[tableName];
      
      // Genera lo statement SQL per creare la tabella
      let createStatement = `CREATE TABLE "${tableName}" (\n`;
      
      // Aggiungi le definizioni dei campi
      const fieldDefinitions = tableDefinition.fields.map(field => {
        let fieldDef = `  "${field.name}" ${field.type}`;
        
        if (field.primaryKey) {
          fieldDef += ' PRIMARY KEY';
        }
        
        if (field.autoIncrement) {
          // Per PostgreSQL, dobbiamo usare SERIAL o BIGSERIAL
          if (field.type.toUpperCase() === 'INTEGER') {
            fieldDef = `  "${field.name}" SERIAL`;
            if (field.primaryKey) {
              fieldDef += ' PRIMARY KEY';
            }
          }
        }
        
        if (field.required) {
          fieldDef += ' NOT NULL';
        }
        
        if (field.unique) {
          fieldDef += ' UNIQUE';
        }
        
        if (field.default !== undefined) {
          if (typeof field.default === 'string' && field.default === 'CURRENT_TIMESTAMP') {
            fieldDef += ' DEFAULT CURRENT_TIMESTAMP';
          } else if (typeof field.default === 'boolean') {
            fieldDef += ` DEFAULT ${field.default}`;
          } else {
            fieldDef += ` DEFAULT '${field.default}'`;
          }
        }
        
        return fieldDef;
      });
      
      createStatement += fieldDefinitions.join(',\n');
      
      // Aggiungi le chiavi esterne (references)
      const foreignKeys: string[] = [];
      
      tableDefinition.fields.forEach(field => {
        if (field.references) {
          const [refTable, refField] = field.references.split('.');
          foreignKeys.push(`  FOREIGN KEY ("${field.name}") REFERENCES "${refTable}" ("${refField}")`);
        }
      });
      
      // Aggiungi unique constraints se presenti
      if (tableDefinition.uniqueConstraints && tableDefinition.uniqueConstraints.length > 0) {
        tableDefinition.uniqueConstraints.forEach(constraint => {
          const fields = constraint.fields.map(f => `"${f}"`).join(', ');
          foreignKeys.push(`  CONSTRAINT "${constraint.name}" UNIQUE (${fields})`);
        });
      }
      
      if (foreignKeys.length > 0) {
        createStatement += ',\n' + foreignKeys.join(',\n');
      }
      
      createStatement += '\n);';
      
      // Log dello statement SQL per debug
      logger.debug(`Statement SQL per la creazione della tabella ${tableName}:\n${createStatement}`);
      
      // Esegui lo statement SQL
      await this.prisma.$executeRawUnsafe(createStatement);
      
      logger.info(`Tabella ${tableName} creata con successo`);
      
    } catch (error) {
      logger.error(`Errore nella creazione della tabella ${tableName}:`, error);
      throw error;
    }
  }
  
  /**
   * Aggiorna una tabella esistente aggiungendo campi mancanti o modificando tipi
   */
  private async updateTable(tableName: string): Promise<void> {
    try {
      const tableDefinition = this.schemaDefinition.tables[tableName];
      
      // Ottieni i campi attuali della tabella
      const currentFields = await this.getTableFields(tableName);
      
      // Per ogni campo nella definizione
      for (const field of tableDefinition.fields) {
        const currentField = currentFields.find(f => f.column_name === field.name);
        
        if (!currentField) {
          // Campo mancante, aggiungilo
          await this.addField(tableName, field);
        } else {
          // Campo esistente, verifica se il tipo corrisponde
          const needsUpdate = this.fieldNeedsUpdate(currentField, field);
          if (needsUpdate) {
            await this.updateField(tableName, field, currentField);
          }
        }
      }
      
    } catch (error) {
      logger.error(`Errore nell'aggiornamento della tabella ${tableName}:`, error);
      throw error;
    }
  }
  
  /**
   * Ottiene i campi di una tabella esistente
   */
  private async getTableFields(tableName: string): Promise<any[]> {
    try {
      const fields = await this.prisma.$queryRaw`
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName};
      `;
      
      return fields as any[];
    } catch (error) {
      logger.error(`Errore nel recupero dei campi della tabella ${tableName}:`, error);
      return [];
    }
  }
  
  /**
   * Aggiunge un campo a una tabella esistente
   */
  private async addField(tableName: string, field: FieldDefinition): Promise<void> {
    try {
      // Genera lo statement SQL per aggiungere il campo
      let alterStatement = `ALTER TABLE "${tableName}" ADD COLUMN "${field.name}" ${field.type}`;
      
      if (field.required) {
        alterStatement += ' NOT NULL';
      }
      
      if (field.unique) {
        alterStatement += ' UNIQUE';
      }
      
      if (field.default !== undefined) {
        if (typeof field.default === 'string' && field.default === 'CURRENT_TIMESTAMP') {
          alterStatement += ' DEFAULT CURRENT_TIMESTAMP';
        } else if (typeof field.default === 'boolean') {
          alterStatement += ` DEFAULT ${field.default}`;
        } else {
          alterStatement += ` DEFAULT '${field.default}'`;
        }
      }
      
      // Esegui lo statement SQL
      await this.prisma.$executeRawUnsafe(alterStatement);
      
      // Se il campo ha un riferimento a un'altra tabella, aggiungi la chiave esterna
      if (field.references) {
        const [refTable, refField] = field.references.split('.');
        const addForeignKeyStatement = `
          ALTER TABLE "${tableName}"
          ADD CONSTRAINT "fk_${tableName}_${field.name}_${refTable}_${refField}"
          FOREIGN KEY ("${field.name}")
          REFERENCES "${refTable}" ("${refField}");
        `;
        
        await this.prisma.$executeRawUnsafe(addForeignKeyStatement);
      }
      
      logger.info(`Campo ${field.name} aggiunto alla tabella ${tableName}`);
      
    } catch (error) {
      logger.error(`Errore nell'aggiunta del campo ${field.name} alla tabella ${tableName}:`, error);
      throw error;
    }
  }
  
  /**
   * Determina se un campo necessita di aggiornamento
   */
  private fieldNeedsUpdate(currentField: any, fieldDefinition: FieldDefinition): boolean {
    // Controlla se il tipo di dati è compatibile
    // Questo è complesso in quanto i tipi PostgreSQL non mappano direttamente ai tipi SQL
    // Per ora, facciamo un controllo semplice
    
    // Ad esempio, VARCHAR(200) nel schema diventerebbe character varying in PostgreSQL
    // con character_maximum_length = 200
    
    if (fieldDefinition.type.startsWith('VARCHAR') || fieldDefinition.type.startsWith('CHAR')) {
      const match = /\((\d+)\)/.exec(fieldDefinition.type);
      if (match) {
        const length = parseInt(match[1], 10);
        
        // Se il campo attuale è character varying o character e la lunghezza è diversa
        if ((currentField.data_type === 'character varying' || currentField.data_type === 'character') && 
            currentField.character_maximum_length !== length) {
          return true;
        }
      }
    }
    
    // Controlla NOT NULL
    const isNullable = currentField.is_nullable === 'YES';
    if (fieldDefinition.required && isNullable) {
      return true;
    }
    
    // Per altri tipi, facciamo un controllo semplice
    // Questo potrebbe richiedere una logica più complessa per tutti i tipi supportati
    
    return false;
  }
  
  /**
   * Aggiorna un campo esistente
   */
  private async updateField(tableName: string, field: FieldDefinition, currentField: any): Promise<void> {
    try {
      // Per semplicità, modifichiamo solo il tipo e NOT NULL
      // Modificare altri vincoli come PRIMARY KEY o UNIQUE è più complesso
      
      let alterStatement = `ALTER TABLE "${tableName}" ALTER COLUMN "${field.name}"`;
      
      // Modifica tipo
      if (field.type.startsWith('VARCHAR') || field.type.startsWith('CHAR')) {
        const match = /\((\d+)\)/.exec(field.type);
        if (match) {
          const length = parseInt(match[1], 10);
          
          if ((currentField.data_type === 'character varying' || currentField.data_type === 'character') && 
              currentField.character_maximum_length !== length) {
            await this.prisma.$executeRawUnsafe(`${alterStatement} TYPE ${field.type}`);
            logger.info(`Tipo del campo ${field.name} aggiornato nella tabella ${tableName}`);
          }
        }
      }
      
      // Modifica NOT NULL
      const isNullable = currentField.is_nullable === 'YES';
      if (field.required && isNullable) {
        // Se vogliamo impostare NOT NULL ma il campo è nullable
        await this.prisma.$executeRawUnsafe(`${alterStatement} SET NOT NULL`);
        logger.info(`Vincolo NOT NULL aggiunto al campo ${field.name} nella tabella ${tableName}`);
      } else if (!field.required && !isNullable) {
        // Se vogliamo rimuovere NOT NULL ma il campo non è nullable
        await this.prisma.$executeRawUnsafe(`${alterStatement} DROP NOT NULL`);
        logger.info(`Vincolo NOT NULL rimosso dal campo ${field.name} nella tabella ${tableName}`);
      }
      
    } catch (error) {
      logger.error(`Errore nell'aggiornamento del campo ${field.name} nella tabella ${tableName}:`, error);
      throw error;
    }
  }
}