import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

const email = 'admin@limpax.com';
const password = '123456';

async function createAdminUser() {
  try {
    // Primeiro, tentar criar o usuário
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: email,
        password: password,
        emailVerified: true
      });
      console.log('Usuário criado com sucesso!');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        // Se o usuário já existe, buscar ele
        userRecord = await auth.getUserByEmail(email);
        console.log('Usuário já existe, atualizando...');
        
        // Atualizar a senha
        await auth.updateUser(userRecord.uid, {
          password: password
        });
      } else {
        throw error;
      }
    }

    // Definir claims personalizadas
    await auth.setCustomUserClaims(userRecord.uid, {
      admin: true
    });

    // Criar ou atualizar documento no Firestore
    const now = new Date().toISOString();
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email: email,
      role: 'admin',
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    console.log('\nUsuário administrador configurado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log('UID:', userRecord.uid);

    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

createAdminUser();
