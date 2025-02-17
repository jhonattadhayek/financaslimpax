import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBCQP-GUUnNtVR9jE2SshdXQKhxNiWnfpY",
  authDomain: "limpaxfinance.firebaseapp.com",
  projectId: "limpaxfinance",
  storageBucket: "limpaxfinance.firebasestorage.app",
  messagingSenderId: "568547676351",
  appId: "1:568547676351:web:76a7884888ea5e776cb60a",
  measurementId: "G-FQYB1ETZ6X"
};

async function createAdminUser() {
  // Inicializar Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = 'admin@limpax.com';
  const password = 'admin123456';

  try {
    // Primeiro tentar fazer login para ver se o usuário já existe
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuário já existe. Credenciais:');
      console.log('Email:', email);
      console.log('Senha:', password);
      process.exit(0);
    } catch (loginError) {
      // Se o login falhar, criar novo usuário
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const now = new Date().toISOString();

      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        id: userCredential.user.uid,
        email: email,
        role: 'admin',
        createdAt: now,
        updatedAt: now
      });

      console.log('Novo usuário administrador criado com sucesso!');
      console.log('Email:', email);
      console.log('Senha:', password);
    }
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
  }

  process.exit(0);
}

createAdminUser();
