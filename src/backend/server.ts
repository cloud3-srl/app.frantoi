import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { loggerMiddleware } from './middleware/logger';
import { DatabaseInitializer } from './services/database/database-initializer';
import { SchemaUpdater } from './services/database/schema-updater';
import { logger } from './utils/logger';
import { PrismaClient } from '@prisma/client';

// Carica le variabili d'ambiente
dotenv.config();

// Funzione per verificare e creare il database se necessario
const checkAndCreateDatabase = () => {
  return new Promise<void>((resolve, reject) => {
    logger.info('Verifica esistenza database...');
    
    // Esegui lo script di creazione del database
    exec('node scripts/create-database.js', (error, stdout, stderr) => {
      if (error) {
        logger.error('Errore nella verifica/creazione del database:', error);
        logger.error(stderr);
        reject(error);
        return;
      }
      
      logger.info(stdout);
      resolve();
    });
  });
};

// Funzione per generare il Prisma Client
const generatePrismaClient = () => {
  return new Promise<void>((resolve, reject) => {
    logger.info('Generazione Prisma Client...');
    
    // Esegui il comando prisma generate
    exec('npx prisma generate', (error, stdout, stderr) => {
      if (error) {
        logger.error('Errore nella generazione del Prisma Client:', error);
        logger.error(stderr);
        reject(error);
        return;
      }
      
      logger.info(stdout);
      logger.info('Prisma Client generato con successo');
      resolve();
    });
  });
};

// Istanza Prisma per l'intera applicazione
const prisma = new PrismaClient();

// Inizializza l'applicazione
const initializeApp = async () => {
  try {
    // Prima verifica e crea il database se necessario
    await checkAndCreateDatabase();
    
    // Poi inizializza le tabelle e i dati
    const databaseInitializer = new DatabaseInitializer();
    
    // Verifica e aggiorna la struttura del database se necessario
    await databaseInitializer.checkDatabaseStructure();
    
    // Rigenera il client Prisma per assicurarsi che sia allineato con lo schema
    await generatePrismaClient();
    
    // Inizializza i dati
    await databaseInitializer.importDataFromDirectory(path.join(process.cwd(), 'Documenti'));
    
    // Aggiorna lo schema delle tabelle aziendali se necessario
    const schemaUpdater = new SchemaUpdater(prisma);
    await schemaUpdater.checkAndUpdateSchema();
    
    logger.info('Database inizializzato e aggiornato con successo');
  } catch (error) {
    logger.error('Errore nell\'inizializzazione del database:', error);
  }
};

// Avvia l'inizializzazione 
initializeApp();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware di sicurezza - configurazione meno restrittiva per sviluppo
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
}));

// Middleware per CORS - configurazione permissiva per sviluppo
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware per il parsing JSON con logging
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      console.log('JSON Body ricevuto:', buf.toString());
    }
  }
}));

// Middleware per il logging
app.use(loggerMiddleware);

// API routes
app.use('/api', require('./api/routes'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist/frontend')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/frontend/index.html'));
  });
}

// Gestione errori 404
app.use((req, res) => {
  res.status(404).json({ message: 'Risorsa non trovata' });
});

// Gestione errori globale
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Si è verificato un errore interno' });
});

// Avvio del server
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server in esecuzione su porta ${PORT} in modalità ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server disponibile su http://10.0.50.225:${PORT}`);
});

// Gestione della chiusura ordinata del server
process.on('SIGTERM', () => {
  logger.info('SIGTERM ricevuto, chiusura ordinata...');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT ricevuto, chiusura ordinata...');
  gracefulShutdown();
});

async function gracefulShutdown() {
  logger.info('Chiusura connessioni database...');
  try {
    await prisma.$disconnect();
    logger.info('Connessioni database chiuse correttamente');
  } catch (error) {
    logger.error('Errore nella chiusura delle connessioni database:', error);
  }
  
  server.close(() => {
    logger.info('Server HTTP chiuso correttamente');
    process.exit(0);
  });
  
  // Timeout di sicurezza
  setTimeout(() => {
    logger.error('Non tutte le connessioni sono state chiuse entro il timeout, uscita forzata');
    process.exit(1);
  }, 10000);
}