const admin = require('firebase-admin');
const serviceAccount = require('../../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

const email = 'admin@limpax.com.br';
const password = 'Limpax@2024';

async function createAdminUser() {
  try {
    // Criar usuário no Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: true
    });

    const now = new Date().toISOString();

    // Criar documento do usuário no Firestore
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email: email,
      role: 'admin',
      createdAt: now,
      updatedAt: now
    });

    console.log('Usuário administrador criado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    process.exit(1);
  }
}

createAdminUser();
