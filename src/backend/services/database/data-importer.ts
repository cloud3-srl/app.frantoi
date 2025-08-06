/**
 * Data Importer - Importa dati da file CSV alle tabelle del database
 * 
 * Questo modulo rileva e importa automaticamente i dati dai file CSV
 * presenti nella cartella Documenti, mappandoli alle tabelle del database
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import { logger } from '../../utils/logger';

export class DataImporter {
  constructor(private prisma: PrismaClient) {}
  
  /**
   * Mappa i nomi dei file CSV ai nomi delle tabelle
   */
  private getTableMapping(): { [fileName: string]: string } {
    return {
      // Mappa per gestire le differenze tra nomi file e tabelle
      'macroaree.csv': 'macroaree',
      'macroarea.csv': 'macroaree',
      'categorie_olio.csv': 'categorie_olio',
      'categ_olio.csv': 'categorie_olio',
      'comuni.csv': 'comuni',
      'province.csv': 'province',
      'origini_specifiche.csv': 'origini_specifiche'
      // Aggiungi altri mapping se necessario
    };
  }

  /**
   * Importa i dati da una directory contenente file CSV
   */
  async importFromDirectory(directory: string): Promise<void> {
    logger.info(`Ricerca file CSV in ${directory}...`);
    
    try {
      // Verifica che la directory esista
      if (!fs.existsSync(directory)) {
        logger.warn(`Directory ${directory} non trovata, importazione saltata`);
        return;
      }
      
      const files = fs.readdirSync(directory);
      const tableMapping = this.getTableMapping();
      
      for (const file of files) {
        if (file.toLowerCase().endsWith('.csv')) {
          // Ottieni il nome base del file senza estensione
          const fileLower = file.toLowerCase();
          
          // Determina il nome della tabella usando la mappatura o il nome del file
          let tableName = '';
          
          // Verifica se esiste una mappatura per questo file
          if (tableMapping[fileLower]) {
            tableName = tableMapping[fileLower];
          } else {
            // Usa il nome del file se non c'è una mappatura specifica
            const baseName = path.basename(file, '.csv');
            tableName = baseName.toLowerCase();
          }
          
          // Verifica se esiste una tabella con il nome determinato
          if (await this.tableExists(tableName)) {
            logger.info(`Importazione dati per tabella ${tableName} dal file ${file}...`);
            await this.importCsvToTable(path.join(directory, file), tableName);
          } else {
            // Se non viene trovata una tabella, salta l'importazione
            logger.warn(`File CSV ${file} ignorato, tabella ${tableName} non trovata`);
          }
        }
      }
      
      logger.info('Importazione dati completata');
      
    } catch (error) {
      logger.error('Errore durante l\'importazione dei dati:', error);
      throw error;
    }
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
   * Pulisce i dati esistenti in una tabella
   */
  private async clearTableData(tableName: string): Promise<void> {
    try {
      await this.prisma.$queryRawUnsafe(`DELETE FROM "${tableName}"`);
      logger.info(`Dati esistenti eliminati dalla tabella ${tableName}`);
    } catch (error) {
      logger.error(`Errore nell'eliminazione dei dati dalla tabella ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Importa i dati da un file CSV in una tabella
   */
  private async importCsvToTable(filePath: string, tableName: string): Promise<void> {
    try {
      // Leggi il file come buffer binario
      const fileBuffer = fs.readFileSync(filePath);
      
      // Converti da Windows-1252 a UTF-8
      let fileContent = iconv.decode(fileBuffer, 'win1252');
      
      // Correggi le apostrofi e i caratteri speciali mal codificati
      fileContent = fileContent
        .replace(/â€˜/g, "'")  // Apostrofo singolo codificato erroneamente
        .replace(/â€™/g, "'")  // Apostrofo singolo codificato erroneamente
        .replace(/â€œ/g, '"')  // Virgolette doppie codificate erroneamente
        .replace(/â€/g, '"')   // Virgolette doppie codificate erroneamente
        .replace(/Ã¨/g, 'è')   // è accentata
        .replace(/Ã /g, 'à')   // à accentata
        .replace(/Ã¹/g, 'ù')   // ù accentata
        .replace(/Ã²/g, 'ò')   // ò accentata
        .replace(/Ã¬/g, 'ì');  // ì accentata
      
      // Dividi in righe e filtra quelle vuote e quelle che contengono solo la stringa ".csv"
      const lines = fileContent.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line !== '.csv');
      
      logger.info(`Trovate ${lines.length} righe non vuote nel file ${path.basename(filePath)}`);
      
      if (lines.length === 0) {
        logger.warn(`Il file ${path.basename(filePath)} è vuoto, importazione saltata`);
        return;
      }
      
      // Determina il separatore (virgola o punto e virgola)
      let firstLine = lines[0];
      
      // Se la prima riga è ".csv", prendi la seconda riga
      if (firstLine.trim() === '.csv') {
        if (lines.length > 1) {
          lines.shift(); // Rimuovi la prima riga
          firstLine = lines[0];
          logger.info(`Ignorata prima riga ".csv", usando la riga successiva come intestazione`);
        } else {
          logger.warn(`Il file contiene solo la riga ".csv", importazione saltata`);
          return;
        }
      }
      
      const separator = firstLine.includes(';') ? ';' : ',';
      
      // Determina se il file ha o meno intestazioni
      let hasHeaders = false; // Impostiamo a false per il file origini_specifiche.csv
      
      // Per altri file, se la prima colonna del primo record è un numero, probabilmente non è un'intestazione ma un ID
      if (path.basename(filePath).toLowerCase() !== 'origini_specifiche.csv') {
        if (/^\d+$/.test(firstLine.split(separator)[0].trim())) {
          hasHeaders = false;
          logger.info(`Il file ${path.basename(filePath)} non sembra avere intestazioni. Usando colonne della tabella.`);
        } else {
          hasHeaders = true;
        }
      } else {
        logger.info(`File origini_specifiche.csv identificato: trattando tutte le righe come dati (no intestazioni)`);
      }
      
      // Ottieni la struttura della tabella per validare i dati
      const tableColumns = await this.getTableColumns(tableName);
      
      // Se il file ha intestazioni, usale come base per mappare le colonne
      let columnMapping: { [key: string]: string } = {};
      let headers: string[] = [];
      
      if (hasHeaders) {
        // Analizza l'intestazione per ottenere i nomi delle colonne
        headers = firstLine.split(separator).map(header => header.trim());
        logger.info(`Intestazioni rilevate: ${headers.join(', ')}`);
        
        // Mappa le colonne del file alle colonne della tabella
        columnMapping = this.mapColumns(headers, tableColumns);
      } else {
        // Se non ha intestazioni, mappa direttamente per posizione 
        // assumendo che le colonne del file siano nello stesso ordine della tabella
        tableColumns.forEach((col, index) => {
          columnMapping[index.toString()] = col.column_name;
        });
        logger.info(`Mappatura colonne per posizione: ${tableColumns.map(col => col.column_name).join(', ')}`);
      }
      
      // Verifica se ci sono dati esistenti
      const existingData = await this.checkExistingData(tableName);
      
      if (existingData.hasData) {
        logger.info(`Trovati ${existingData.count} record esistenti nella tabella ${tableName}. I dati verranno aggiornati.`);
      } else {
        logger.info(`Nessun dato esistente nella tabella ${tableName}. I dati verranno inseriti.`);
      }
      
      // Processa ogni riga, inclusa la prima se non è un'intestazione
      let importCount = 0;
      const startIndex = hasHeaders ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        
        // Dividi la riga in campi usando il separatore
        const values = this.parseCSVLine(line, separator);
        
        // Crea l'oggetto dati mappando i valori alle colonne della tabella
        const data: any = {};
        
        for (const [fileColumnIndex, dbColumnName] of Object.entries(columnMapping)) {
          if (dbColumnName && parseInt(fileColumnIndex) < values.length) {
            // Ottieni il valore e puliscilo
            let value = values[parseInt(fileColumnIndex)].trim();
            
            // Converti il valore in base al tipo di colonna
            const column = tableColumns.find(col => col.column_name === dbColumnName);
            if (column) {
              value = this.convertValue(value, column.data_type, dbColumnName);
            }
            
            data[dbColumnName] = value;
          }
        }
        
        // Inserisci o aggiorna i dati nel database
        try {
          // Verifica se esiste già un record con lo stesso ID
          let existingRecord = null;
          if (data.id) {
            const findResult = await this.prisma.$queryRawUnsafe(
              `SELECT id FROM "${tableName}" WHERE id = $1 LIMIT 1`,
              data.id
            );
            existingRecord = findResult && (findResult as any[])[0];
          }
          
          if (existingRecord) {
            // Aggiornamento (omettendo l'ID che è la chiave primaria)
            const dataToUpdate = {...data};
            delete dataToUpdate.id;
            
            if (Object.keys(dataToUpdate).length > 0) {
              const updateColumns = Object.keys(dataToUpdate).map((key, index) => `"${key}" = $${index + 2}`).join(', ');
              await this.prisma.$queryRawUnsafe(
                `UPDATE "${tableName}" SET ${updateColumns} WHERE id = $1`,
                data.id,
                ...Object.values(dataToUpdate)
              );
              logger.debug(`Record ID ${data.id} aggiornato nella tabella ${tableName}`);
            }
          } else {
            // Inserimento
            await this.prisma.$queryRawUnsafe(
              `INSERT INTO "${tableName}" (${Object.keys(data).map(k => `"${k}"`).join(', ')}) 
               VALUES (${Object.keys(data).map((_, i) => `$${i + 1}`).join(', ')})`,
              ...Object.values(data)
            );
            logger.debug(`Nuovo record inserito nella tabella ${tableName}`);
          }
          
          importCount++;
        } catch (error) {
          logger.error(`Errore nell'elaborazione della riga ${i} nella tabella ${tableName}:`, error);
          logger.error('Dati problematici:', data);
        }
      }
      
      logger.info(`Importate ${importCount} righe nella tabella ${tableName}`);
      
    } catch (error) {
      logger.error(`Errore nell'importazione del file ${filePath} nella tabella ${tableName}:`, error);
      throw error;
    }
  }
  
  /**
   * Ottiene le colonne di una tabella
   */
  private async getTableColumns(tableName: string): Promise<any[]> {
    try {
      const columns = await this.prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName};
      `;
      
      return columns as any[];
    } catch (error) {
      logger.error(`Errore nel recupero delle colonne della tabella ${tableName}:`, error);
      return [];
    }
  }
  
  /**
   * Mappa le colonne del file CSV alle colonne della tabella
   */
  private mapColumns(fileHeaders: string[], tableColumns: any[]): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    
    // Prima prova la corrispondenza diretta (ignorando maiuscole/minuscole)
    for (let i = 0; i < fileHeaders.length; i++) {
      const header = fileHeaders[i].toLowerCase();
      
      // Cerca una colonna del database con lo stesso nome
      const column = tableColumns.find(col => 
        col.column_name.toLowerCase() === header || 
        col.column_name.toLowerCase().replace('_', '') === header.replace('_', '')
      );
      
      if (column) {
        mapping[i.toString()] = column.column_name;
      }
    }
    
    // Se non ci sono abbastanza mappature, prova ad usare l'ordine delle colonne per le prime colonne
    if (Object.keys(mapping).length < Math.min(fileHeaders.length, tableColumns.length)) {
      // Mappa per posizione (solo per le prime colonne)
      for (let i = 0; i < Math.min(fileHeaders.length, tableColumns.length); i++) {
        if (!mapping[i.toString()]) {
          mapping[i.toString()] = tableColumns[i].column_name;
        }
      }
    }
    
    // Log della mappatura
    const mappingLog = Object.entries(mapping)
      .map(([fileIndex, dbColumn]) => `${fileHeaders[parseInt(fileIndex)]} -> ${dbColumn}`)
      .join(', ');
      
    logger.info(`Mappatura colonne: ${mappingLog}`);
    
    return mapping;
  }
  
  /**
   * Verifica i dati esistenti in una tabella per modalità importazione
   */
  private async checkExistingData(tableName: string): Promise<{ hasData: boolean, count: number }> {
    try {
      // Conta i record esistenti
      const result = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const count = parseInt((result as any)[0].count);
      
      logger.info(`Trovati ${count} record esistenti nella tabella ${tableName}`);
      
      return { 
        hasData: count > 0,
        count
      };
    } catch (error) {
      logger.error(`Errore nel controllo dei dati esistenti nella tabella ${tableName}:`, error);
      return { hasData: false, count: 0 };
    }
  }
  
  /**
   * Converte un valore in base al tipo di dati
   */
  private convertValue(value: string, dataType: string, columnName: string): any {
    // Se il valore è vuoto, restituisci null (se la colonna lo consente)
    if (!value || value.trim() === '') {
      return null;
    }
    
    switch (dataType) {
      case 'integer':
        return parseInt(value);
        
      case 'numeric':
      case 'decimal':
      case 'real':
      case 'double precision':
        return parseFloat(value);
        
      case 'boolean':
        // Gestisci i valori booleani (S/N, true/false, etc.)
        if (value.toLowerCase() === 'true' || value.toLowerCase() === 's' || value === '1') {
          return true;
        } else if (value.toLowerCase() === 'false' || value.toLowerCase() === 'n' || value === '0') {
          return false;
        }
        return false;
        
      case 'timestamp with time zone':
      case 'timestamp without time zone':
      case 'date':
        // Tenta di convertire in data
        try {
          return new Date(value);
        } catch (error) {
          logger.warn(`Errore nella conversione della data ${value}:`, error);
          return null;
        }
        
      default:
        // Per i tipi di stringa, restituisci il valore come stringa
        return value;
    }
  }
  
  /**
   * Parse una riga CSV gestendo le virgolette
   */
  private parseCSVLine(line: string, separator: string): string[] {
    const result: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === separator && !insideQuotes) {
        result.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Aggiungi l'ultimo valore
    result.push(currentValue);
    
    // Rimuovi le virgolette attorno ai valori
    return result.map(value => {
      if (value.startsWith('"') && value.endsWith('"')) {
        return value.substring(1, value.length - 1);
      }
      return value;
    });
  }
}