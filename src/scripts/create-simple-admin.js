const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBCQP-GUUnNtVR9jE2SshdXQKhxNiWnfpY",
  authDomain: "limpaxfinance.firebaseapp.com",
  projectId: "limpaxfinance",
  storageBucket: "limpaxfinance.firebasestorage.app",
  messagingSenderId: "568547676351",
  appId: "1:568547676351:web:76a7884888ea5e776cb60a",
  measurementId: "G-FQYB1ETZ6X"
};

async function createSimpleAdmin() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const email = 'admin@limpax.com';
  const password = 'admin123456';

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Usuário criado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log('UID:', userCredential.user.uid);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Usuário já existe. Use estas credenciais:');
      console.log('Email:', email);
      console.log('Senha:', password);
    } else {
      console.error('Erro:', error);
    }
  }
}

createSimpleAdmin();
