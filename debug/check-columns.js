const { PrismaClient } = require('@prisma/client');

async function checkAndDisplayColumns() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Verifico le aziende disponibili...');
    const companies = await prisma.aziende.findMany({
      select: {
        id: true,
        codice: true,
        descrizione: true
      }
    });
    
    console.log('Aziende trovate:', companies.length);
    
    for (const company of companies) {
      const companyCode = company.codice.toLowerCase();
      const tableName = `${companyCode}_articoli`;
      
      console.log(`\nVerifica struttura tabella ${tableName} per azienda ${company.descrizione} (${company.codice}):`);
      
      // Verifica se la tabella esiste
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = ${tableName}
        ) as exists
      `;
      
      if (!tableExists[0].exists) {
        console.log(`La tabella ${tableName} non esiste.`);
        continue;
      }
      
      // Ottiene la struttura della tabella
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position
      `;
      
      console.log('Colonne trovate:');
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''})`);
      });
      
      // Verifica la presenza di tipologia
      const hasTipologia = columns.some(col => col.column_name.toLowerCase() === 'tipologia');
      
      if (!hasTipologia) {
        console.log(`\n⚠️ ATTENZIONE: La colonna 'tipologia' manca nella tabella ${tableName}`);
        
        // Chiede conferma per aggiungere la colonna
        console.log('Vuoi aggiungere la colonna tipologia? (Manualmente con ALTER TABLE)');
        console.log(`Esegui questo comando SQL nel database:`);
        console.log(`ALTER TABLE "${tableName}" ADD COLUMN tipologia CHAR(2);`);
      }
    }
  } catch (error) {
    console.error('Errore durante la verifica:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndDisplayColumns();