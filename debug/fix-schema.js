const { PrismaClient } = require('@prisma/client');

async function fixSchema() {
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
      const columnNames = columns.map(col => col.column_name.toLowerCase());
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''})`);
      });
      
      // Lista delle colonne che dovrebbero essere presenti
      const requiredColumns = [
        { name: 'tipologia', type: 'CHAR(2)' },
        { name: 'descrizione', type: 'CHAR(60)' },
        { name: 'categ_olio', type: 'INTEGER' },
        { name: 'macroarea', type: 'INTEGER' },
        { name: 'origispeci', type: 'CHAR(20)' },
        { name: 'flag_ps', type: 'BOOLEAN' },
        { name: 'flag_ef', type: 'BOOLEAN' },
        { name: 'flag_bio', type: 'BOOLEAN' },
        { name: 'flag_conv', type: 'BOOLEAN' },
        { name: 'cod_iva', type: 'INTEGER' },
        { name: 'varieta', type: 'CHAR(40)' },
        { name: 'flag_in_uso', type: 'BOOLEAN' },
        { name: 'unita_misura', type: 'CHAR(3)' }
      ];
      
      // Verifica quali colonne mancano
      const missingColumns = requiredColumns.filter(
        col => !columnNames.includes(col.name.toLowerCase())
      );
      
      if (missingColumns.length > 0) {
        console.log(`\n⚠️ ATTENZIONE: Mancano ${missingColumns.length} colonne nella tabella ${tableName}`);
        
        console.log('Per aggiungere le colonne mancanti, esegui i seguenti comandi SQL:');
        missingColumns.forEach(col => {
          const defaultValue = col.name.startsWith('flag_') ? 'DEFAULT FALSE' : '';
          console.log(`ALTER TABLE "${tableName}" ADD COLUMN ${col.name} ${col.type} ${defaultValue};`);
        });
      } else {
        console.log(`\n✅ La tabella ${tableName} ha tutte le colonne necessarie.`);
      }
    }
    
    console.log('\nNOTA: Prima di eseguire le modifiche allo schema, è consigliabile fare un backup del database.');
    
  } catch (error) {
    console.error('Errore durante la verifica:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSchema();