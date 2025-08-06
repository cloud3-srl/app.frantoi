// Script per verificare se esistono tabelle con prefisso specifico
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTablesExist(prefix) {
  try {
    console.log(`Verifico se esistono tabelle con prefisso "${prefix}"...`);
    
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE ${prefix + '%'}`;
    
    console.log('Risultato ricerca:');
    console.log(result);
    
    if (result.length > 0) {
      console.log(`Trovate ${result.length} tabelle con il prefisso "${prefix}"`);
      result.forEach(row => {
        console.log(` - ${row.table_name}`);
      });
    } else {
      console.log(`Nessuna tabella trovata con il prefisso "${prefix}"`);
    }
    
    return result.length > 0;
  } catch (error) {
    console.error('Errore durante la verifica delle tabelle:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il controllo con il prefisso "cloud" e mostra le tabelle aziende
async function run() {
  await checkTablesExist('cloud');
  
  console.log('\nVerifica tabella aziende:');
  try {
    const aziende = await prisma.aziende.findMany({
      where: {
        codice: 'cloud'
      }
    });
    
    console.log('Aziende con codice "cloud":', aziende);
  } catch (error) {
    console.error('Errore nella ricerca delle aziende:', error);
  }
  
  // Controlla anche nella tabella config
  console.log('\nVerifica tabella config:');
  try {
    const config = await prisma.config.findMany({
      where: {
        chiave: {
          startsWith: 'COMPANY_cloud'
        }
      }
    });
    
    console.log('Configurazioni per azienda "cloud":', config);
  } catch (error) {
    console.error('Errore nella ricerca delle configurazioni:', error);
  }
  
  await prisma.$disconnect();
}

run();