/**
 * Funzioni di aiuto per la gestione delle tabelle
 */

/**
 * Mappa dei campi speciali per le tabelle
 * Utilizzato per gestire i nomi di campo che necessitano di virgolette o hanno lettere maiuscole
 */
export const specialFieldMappings: Record<string, Record<string, string>> = {
  listini: {
    'flagAttivo': '"flagAttivo"'
  },
  soggetti: {
    'flagForn': '"flagForn"'
  }
  // Rimuoviamo completamente cisterne e flagObso da qui, lo tratteremo come un campo normale
};

/**
 * Trasforma i dati per gestire i campi speciali
 * @param data - I dati da trasformare
 * @param tableName - Il nome della tabella
 * @returns I dati trasformati con i nomi dei campi corretti
 */
export function transformSpecialFields(data: Record<string, any>, tableName: string): Record<string, any> {
  const result = {...data};
  
  // Se ci sono mappature speciali per questa tabella
  if (specialFieldMappings[tableName]) {
    for (const [jsField, dbField] of Object.entries(specialFieldMappings[tableName])) {
      if (result.hasOwnProperty(jsField)) {
        // Copia il valore al nuovo nome del campo
        result[dbField] = result[jsField];
        // Rimuovi il campo originale
        delete result[jsField];
      }
    }
  }
  
  return result;
}