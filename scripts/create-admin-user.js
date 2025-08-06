// Script per creare un utente amministratore predefinito
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Crea un'istanza di PrismaClient
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    // Controlla se l'utente admin esiste già
    const existingUser = await prisma.users.findUnique({
      where: {
        email: 'admin.cloud@adhocoil.com'
      }
    });

    if (existingUser) {
      console.log('🟠 L\'utente admin esiste già nel database');
      return;
    }

    // Crea una password hash
    const saltRounds = 10;
    const password = await bcrypt.hash('admin123', saltRounds);

    // Crea l'utente admin
    const admin = await prisma.users.create({
      data: {
        nome: 'Amministratore',
        cognome: 'Sistema',
        username: 'admin',
        password,
        email: 'admin.cloud@adhocoil.com',
        ruolo: 1  // 1 = admin
      }
    });

    console.log('🟢 Utente amministratore creato con successo:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Password: admin123`);
    console.log('⚠️  IMPORTANTE: Cambia questa password dopo il primo accesso!');

    // Aggiunge un log nel sistema
    await prisma.syslog.create({
      data: {
        livello: 'INFO',
        messaggio: 'Creato utente amministratore iniziale',
        dettagli: `Creato utente ${admin.username} con ID ${admin.id}`,
        user_id: admin.id
      }
    });

  } catch (error) {
    console.error('🔴 Errore durante la creazione dell\'utente amministratore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();