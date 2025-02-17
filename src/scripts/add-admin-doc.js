const { initializeApp } = require('firebase/app');
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

async function addAdminDoc() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // UID do usuário criado anteriormente - você precisará substituir por um UID válido
  const uid = 'SUBSTITUA_PELO_UID_GERADO';
  const now = new Date().toISOString();

  try {
    await setDoc(doc(db, 'users', uid), {
      id: uid,
      email: 'admin@limpax.com',
      role: 'admin',
      createdAt: now,
      updatedAt: now
    });

    console.log('Documento do admin criado com sucesso no Firestore!');
  } catch (error) {
    console.error('Erro ao criar documento:', error);
  }
}

addAdminDoc();
