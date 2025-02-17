import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  deleteUser as deleteAuthUser,
  getAuth
} from 'firebase/auth';
import { db } from '../lib/firebase';
import { User, CreateUserData } from '../types/user';

const COLLECTION = 'users';

export async function createUser(data: CreateUserData): Promise<User> {
  const auth = getAuth();
  
  try {
    // Criar usuário no Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const now = new Date().toISOString();
    
    // Criar documento do usuário no Firestore
    const user: User = {
      id: userCredential.user.uid,
      email: data.email,
      role: data.role,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(doc(db, COLLECTION, user.id), user);
    
    return user;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
}

export async function getUsers(): Promise<User[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTION));
  return querySnapshot.docs.map(doc => doc.data() as User);
}

export async function getUser(id: string): Promise<User | null> {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as User;
  }
  
  return null;
}

export async function updateUserRole(id: string, role: User['role']): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    role,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteUser(id: string): Promise<void> {
  // Deletar do Firestore
  await deleteDoc(doc(db, COLLECTION, id));
  
  // Deletar do Authentication
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    await deleteAuthUser(user);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    return null;
  }
  
  return getUser(currentUser.uid);
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await getUser(userId);
  return user?.role === 'admin';
}
