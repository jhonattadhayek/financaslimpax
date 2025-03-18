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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'admin@limpax.com';
const password = '123456';

async function createUser() {
  try {
    // Tentar criar o usuário
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Usuário criado com sucesso!');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        // Se o usuário já existe, fazer login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Usuário já existe, logado com sucesso!');
      } else {
        throw error;
      }
    }

    // Criar documento no Firestore
    const now = new Date().toISOString();
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      id: userCredential.user.uid,
      email: email,
      role: 'admin',
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    console.log('\nUsuário configurado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log('UID:', userCredential.user.uid);

    // Fazer logout
    await auth.signOut();
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

createUser();
