const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBCQP-GUUnNtVR9jE2SshdXQKhxNiWnfpY",
  authDomain: "limpaxfinance.firebaseapp.com",
  projectId: "limpaxfinance",
  storageBucket: "limpaxfinance.firebasestorage.app",
  messagingSenderId: "568547676351",
  appId: "1:568547676351:web:76a7884888ea5e776cb60a",
  measurementId: "G-FQYB1ETZ6X"
};

async function createFinalAdmin() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = 'admin@admin.com';
  const password = '123456';

  try {
    // Criar usuário no Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    console.log('Usuário criado no Auth com sucesso!');

    // Criar documento no Firestore
    const now = new Date().toISOString();
    await setDoc(doc(db, 'users', uid), {
      id: uid,
      email: email,
      role: 'admin',
      createdAt: now,
      updatedAt: now
    });

    console.log('Documento criado no Firestore com sucesso!');
    console.log('\nCredenciais para login:');
    console.log('Email:', email);
    console.log('Senha:', password);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Use estas credenciais para login:');
      console.log('Email:', email);
      console.log('Senha:', password);
    } else {
      console.error('Erro:', error);
    }
  }
}

createFinalAdmin();
