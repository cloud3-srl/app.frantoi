// Script per riparare tabelle aziendali inconsistenti
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Verifica se ci sono parametri da riga di comando
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Utilizzo: node fix-company-tables.js <companyCode> <action>');
      console.log('Azioni disponibili: check, drop, complete');
      return;
    }
    
    const companyCode = args[0].toLowerCase();
    const action = args[1].toLowerCase();
    
    console.log(`Esecuzione azione '${action}' per il codice azienda '${companyCode}'`);
    
    if (action === 'check') {
      // Verifica lo stato attuale
      const result = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name LIKE ${`${companyCode}_%`}`;
      
      console.log(`Tabelle trovate con prefisso '${companyCode}_':`);
      if (result.length === 0) {
        console.log(' - Nessuna tabella trovata');
      } else {
        result.forEach(row => console.log(` - ${row.table_name}`));
      }
      
      // Verifica la configurazione
      const config = await prisma.config.findFirst({
        where: { chiave: `COMPANY_${companyCode.toUpperCase()}_CREATED` }
      });
      
      console.log(`\nConfigurazione per azienda '${companyCode}':`);
      console.log(config || 'Nessuna configurazione trovata');
      
      // Verifica l'azienda
      const company = await prisma.aziende.findFirst({
        where: { codice: companyCode }
      });
      
      console.log(`\nAzienda con codice '${companyCode}':`);
      console.log(company || 'Nessuna azienda trovata');
      
    } else if (action === 'drop') {
      // Elimina tutte le tabelle con il prefisso specificato
      const result = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name LIKE ${`${companyCode}_%`}`;
      
      if (result.length === 0) {
        console.log(`Nessuna tabella trovata con prefisso '${companyCode}_'`);
      } else {
        console.log(`Eliminazione di ${result.length} tabelle con prefisso '${companyCode}_':`);
        
        for (const row of result) {
          const tableName = row.table_name;
          console.log(`Eliminazione tabella: ${tableName}...`);
          
          try {
            await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
            console.log(`Tabella ${tableName} eliminata con successo`);
          } catch (err) {
            console.error(`Errore nell'eliminazione della tabella ${tableName}:`, err);
          }
        }
        
        console.log(`Tutte le tabelle con prefisso '${companyCode}_' sono state eliminate`);
      }
      
      // Elimina anche eventuali configurazioni
      const configDeleted = await prisma.config.deleteMany({
        where: { chiave: `COMPANY_${companyCode.toUpperCase()}_CREATED` }
      });
      
      if (configDeleted.count > 0) {
        console.log(`Configurazione per l'azienda '${companyCode}' eliminata`);
      }
      
    } else if (action === 'complete') {
      // Verifica se esiste l'azienda
      const company = await prisma.aziende.findFirst({
        where: { codice: companyCode }
      });
      
      if (!company) {
        console.log(`Impossibile completare: azienda con codice '${companyCode}' non trovata`);
        return;
      }
      
      // Verifica se esistono tabelle
      const result = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name LIKE ${`${companyCode}_%`}`;
      
      if (result.length === 0) {
        console.log(`Impossibile completare: nessuna tabella trovata con prefisso '${companyCode}_'`);
        return;
      }
      
      // Crea la configurazione
      await prisma.config.upsert({
        where: { chiave: `COMPANY_${companyCode.toUpperCase()}_CREATED` },
        update: {
          valore: 'TRUE',
          descrizione: `Tabelle create per azienda ${companyCode} (riparazione manuale)`,
          data_modifica: new Date()
        },
        create: {
          chiave: `COMPANY_${companyCode.toUpperCase()}_CREATED`,
          valore: 'TRUE',
          descrizione: `Tabelle create per azienda ${companyCode} (riparazione manuale)`,
          categoria: 'COMPANY_SETUP',
          data_creazione: new Date(),
          data_modifica: new Date()
        }
      });
      
      console.log(`Configurazione completata per l'azienda '${companyCode}'`);
      
    } else {
      console.log(`Azione '${action}' non riconosciuta. Utilizzare: check, drop, complete`);
    }
  } catch (error) {
    console.error('Errore durante l\'esecuzione dello script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
main();