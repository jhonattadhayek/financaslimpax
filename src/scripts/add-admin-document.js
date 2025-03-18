import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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
const auth = getAuth();
const db = getFirestore();

async function addAdminDocument() {
  try {
    // Fazer login para obter o UID
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@admin.com', '123456');
    const uid = userCredential.user.uid;

    console.log('Criando documento no Firestore...');
    
    // Criar documento no Firestore
    const now = new Date().toISOString();
    await setDoc(doc(db, 'users', uid), {
      id: uid,
      email: 'admin@admin.com',
      role: 'admin',
      createdAt: now,
      updatedAt: now
    });

    console.log('Documento do admin criado com sucesso!');
    console.log('UID:', uid);

    // Fazer logout
    await auth.signOut();
    console.log('Logout realizado');
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

addAdminDocument();
