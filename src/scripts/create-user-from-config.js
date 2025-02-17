import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Usar a mesma configuração que está no arquivo firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBCQP-GUUnNtVR9jE2SshdXQKhxNiWnfpY",
  authDomain: "limpaxfinance.firebaseapp.com",
  projectId: "limpaxfinance",
  storageBucket: "limpaxfinance.firebasestorage.app",
  messagingSenderId: "568547676351",
  appId: "1:568547676351:web:76a7884888ea5e776cb60a",
  measurementId: "G-FQYB1ETZ6X"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Credenciais do usuário admin
const email = 'admin@admin.com';
const password = '123456';

async function createAdminUser() {
  try {
    console.log('Iniciando criação do usuário admin...');
    
    // Tentar criar o usuário
    let userCredential;
    try {
      console.log('Tentando criar novo usuário...');
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Usuário criado com sucesso!');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Usuário já existe, tentando fazer login...');
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login realizado com sucesso!');
      } else {
        throw error;
      }
    }

    console.log('Criando documento no Firestore...');
    
    // Criar ou atualizar documento no Firestore
    const now = new Date().toISOString();
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      id: userCredential.user.uid,
      email: email,
      role: 'admin',
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    console.log('\nUsuário admin configurado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log('UID:', userCredential.user.uid);

    // Fazer logout
    await auth.signOut();
    console.log('Logout realizado');
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
  }
}

// Executar a função
createAdminUser().then(() => {
  console.log('Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
