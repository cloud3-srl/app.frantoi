import express from 'express';
import path from 'path';
import { healthController } from '../controllers/health.controller';
import { CompanyController } from '../controllers/company.controller';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import { TablesController } from '../controllers/tables.controller';
import { CompanyTablesController } from '../controllers/company-tables.controller';
import { AdminController } from '../controllers/admin.controller';
import { prenotazioniController } from '../controllers/prenotazioni.controller';
import { OliveLineeController } from '../controllers/olive-linee.controller';
import { MolituraController } from '../controllers/molitura.controller';
import { MolituraCProprioController } from '../controllers/molitura-cproprio.controller';
import { ConferimentiCAcquistoController } from '../controllers/conferimenti-cacquisto.controller';
import { SianRegistryController } from '../controllers/sian/registry.controller';
import { authenticateJWT, isAdmin } from '../../middleware/auth';
import { DatabaseInitializer } from '../../services/database/database-initializer';
import { logger } from '../../utils/logger';

const router = express.Router();

// Creiamo un'istanza del controller olive-linee
const oliveLineeController = new OliveLineeController();

// Stato del servizio
router.get('/health', healthController.check);

// Test endpoint per debug
router.post('/test-auth', (req, res) => {
  logger.debug('Test auth endpoint chiamato');
  res.json({ success: true, message: 'Test auth endpoint funzionante' });
});

// Rotte per l'autenticazione
router.post('/auth/login', (req, res) => {
  logger.debug("Route login chiamata");
  return AuthController.login(req, res);
});
router.post('/auth/register', (req, res) => {
  logger.debug("Route registrazione chiamata");
  return AuthController.register(req, res);
});
router.get('/auth/verify-email/:userId/:token', (req, res) => {
  // TODO: Implementare la verifica dell'email
  // Questa rotta deve verificare il token e attivare l'account
  // return AuthController.verifyEmail(req, res);
  res.send('Funzionalità di verifica email da implementare');
});

// Route di debug per verificare lo stato di login
router.get('/debug/auth/me', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const userRuolo = (req.user as any)?.ruolo;
    const userIsAdmin = (req.user as any)?.isAdmin;
    
    return res.status(200).json({
      success: true,
      data: {
        userId,
        userRuolo,
        isAdmin: userIsAdmin,
        user: req.user
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Errore debug auth',
      error: error.message
    });
  }
});
router.get('/auth/me', authenticateJWT, AuthController.getCurrentUser);

// Rotte per la gestione delle aziende
router.post('/companies', authenticateJWT, isAdmin, CompanyController.createCompany);
router.get('/companies', authenticateJWT, isAdmin, CompanyController.getAllCompanies);
router.get('/companies/user', authenticateJWT, CompanyController.getUserCompanies);
router.get('/companies/:id', authenticateJWT, CompanyController.getCompany);
router.patch('/companies/:id', authenticateJWT, CompanyController.updateCompany);
router.post('/companies/:id/test-email', authenticateJWT, CompanyController.testEmail);
router.post('/companies/assign-user', authenticateJWT, isAdmin, CompanyController.assignUserToCompany);
router.post('/companies/remove-user', authenticateJWT, isAdmin, CompanyController.removeUserFromCompany);
router.get('/companies/:companyId/users', authenticateJWT, isAdmin, UserController.getCompanyUsers);

// Rotte per la gestione degli utenti
router.get('/users', authenticateJWT, isAdmin, UserController.getAllUsers);
router.post('/users', authenticateJWT, isAdmin, UserController.createUser);
router.put('/users/:id', authenticateJWT, UserController.updateUser);

// Rotta per l'importazione dei dati
router.post('/admin/import-data', authenticateJWT, isAdmin, async (req, res) => {
  try {
    logger.info('Avvio importazione dati manuale...');
    
    // Directory da utilizzare per l'importazione (default: Documenti)
    const directory = req.body.directory || path.join(process.cwd(), 'Documenti');
    
    // Inizializza il database
    const databaseInitializer = new DatabaseInitializer();
    await databaseInitializer.importDataFromDirectory(directory);
    
    res.json({ 
      success: true, 
      message: 'Importazione dati completata con successo' 
    });
  } catch (error) {
    logger.error('Errore durante l\'importazione dei dati:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Si è verificato un errore durante l\'importazione dei dati', 
      error: (error as Error).message 
    });
  }
});

// Rotte amministrative
router.post('/admin/initialize-company-tables/:companyId', authenticateJWT, isAdmin, AdminController.initializeCompanyTables);
router.post('/admin/backup-database', authenticateJWT, isAdmin, AdminController.backupDatabase);

// Rotte per la gestione delle tabelle comuni 
// Le tabelle di riferimento devono essere accessibili anche agli utenti normali
router.get('/tables/:tableName', authenticateJWT, TablesController.getAll);
router.get('/tables/:tableName/:id', authenticateJWT, TablesController.getById);
// Solo gli admin possono modificare le tabelle comuni
router.post('/tables/:tableName', authenticateJWT, isAdmin, TablesController.create);
router.put('/tables/:tableName/:id', authenticateJWT, isAdmin, TablesController.update);
router.delete('/tables/:tableName/:id', authenticateJWT, isAdmin, TablesController.delete);

// Rotte per la gestione delle tabelle specifiche per azienda (accessibili anche agli utenti normali)
router.get('/company/:companyId/tables/:tableName', authenticateJWT, CompanyTablesController.getAll);
router.get('/company/:companyId/tables/:tableName/:id', authenticateJWT, CompanyTablesController.getById);
router.post('/company/:companyId/tables/:tableName', authenticateJWT, CompanyTablesController.create);
router.put('/company/:companyId/tables/:tableName/:id', authenticateJWT, CompanyTablesController.update);
router.delete('/company/:companyId/tables/:tableName/:id', authenticateJWT, CompanyTablesController.delete);

// Rotte per la gestione delle prenotazioni moliture
router.get('/company/:companyCode/prenotazioni', authenticateJWT, prenotazioniController.getPrenotazioni);
router.get('/company/:companyCode/prenotazioni/date/:date', authenticateJWT, prenotazioniController.getPrenotazioniByDate);
router.get('/company/:companyCode/prenotazioni/:id', authenticateJWT, prenotazioniController.getPrenotazioneById);
router.post('/company/:companyCode/prenotazioni', authenticateJWT, prenotazioniController.createPrenotazione);
router.put('/company/:companyCode/prenotazioni/:id', authenticateJWT, prenotazioniController.updatePrenotazione);
router.delete('/company/:companyCode/prenotazioni/:id', authenticateJWT, prenotazioniController.deletePrenotazione);
// Rotte per la gestione delle notifiche email delle prenotazioni
router.get('/company/:companyCode/prenotazioni/:id/email-template', authenticateJWT, prenotazioniController.getEmailTemplate);
router.post('/company/:companyCode/prenotazioni/:id/send-email', authenticateJWT, prenotazioniController.sendEmailNotification);

// Rotte per la gestione delle relazioni olive-linee
router.get('/company/:companyId/olive-linee', authenticateJWT, (req, res) => oliveLineeController.getAll(req, res));
router.get('/company/:companyId/olive-linee/olive/:oliveTypeId', authenticateJWT, (req, res) => oliveLineeController.getLinesForOliveType(req, res));
router.post('/company/:companyId/olive-linee', authenticateJWT, (req, res) => oliveLineeController.create(req, res));
router.delete('/company/:companyId/olive-linee/:relationId', authenticateJWT, (req, res) => oliveLineeController.delete(req, res));

// Rotte per la gestione delle moliture
router.get('/company/:companyId/molitura/test', (req, res) => {
  const { companyId } = req.params;
  logger.info(`Test molitura endpoint called for company ${companyId}`);
  return res.status(200).json({
    success: true,
    message: 'Endpoint molitura funzionante',
    companyId
  });
});

// Rotta per molitura conto terzi
router.post('/company/:companyId/molitura', authenticateJWT, MolituraController.processMolitura);

// Rotta per molitura conto proprio
router.post('/company/:companyId/molitura-cproprio', authenticateJWT, MolituraCProprioController.processMolituraCproprio);

// Rotte per i conferimenti in conto acquisto
router.post('/company/:companyId/conferimenti', authenticateJWT, ConferimentiCAcquistoController.createConferimento);

// Rotte per la gestione Registro SIAN
router.get('/company/:companyCode/sian/movimenti', authenticateJWT, SianRegistryController.getMovimentiDaInviare);
router.post('/company/:companyCode/sian/genera-xml', authenticateJWT, SianRegistryController.generaXml);
router.get('/company/:companyCode/sian/files', authenticateJWT, SianRegistryController.getFilesList);
router.get('/company/:companyCode/sian/files/:fileName', authenticateJWT, SianRegistryController.downloadFile);
router.post('/company/:companyCode/sian/marca-inviati', authenticateJWT, SianRegistryController.markFileAsSent);

export = router;