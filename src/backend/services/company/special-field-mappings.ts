/**
 * Mappatura dei campi con nomi speciali per le tabelle aziendali
 * Alcuni campi nel database PostgreSQL hanno nomi che necessitano di trattamento speciale
 * (es. con virgolette, lettere maiuscole, ecc.)
 */

// Mappatura dal nome campo in JavaScript al nome campo in PostgreSQL
export const fieldNameMappings: Record<string, Record<string, string>> = {
  listini: {
    'flagAttivo': '"flagAttivo"'
  },
  soggetti: {
    'flagForn': '"flagForn"'
  }
  // Rimuoviamo completamente cisterne e flagObso da qui, lo tratteremo come un campo normale
};

// Mappatura inversa dal nome campo in PostgreSQL al nome campo in JavaScript
export const reverseFieldNameMappings: Record<string, Record<string, string>> = {
  listini: {
    'flagAttivo': 'flagAttivo'
  },
  soggetti: {
    'flagForn': 'flagForn'
  }
  // Rimuoviamo completamente cisterne e flagObso da qui, lo tratteremo come un campo normale
};