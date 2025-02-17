import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EmployeeDismissal } from '../types/employee-dismissal';

// Buscar todas as baixas
export async function getDismissals(): Promise<EmployeeDismissal[]> {
  const dismissalsRef = collection(db, 'employee_dismissals');
  const q = query(dismissalsRef, orderBy('dismissal_date', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    amount: Number(doc.data().amount) || 0,
    created_at: doc.data().created_at.toDate().toISOString(),
    updated_at: doc.data().updated_at?.toDate().toISOString()
  })) as EmployeeDismissal[];
}

// Criar nova baixa
export async function createDismissal(data: Omit<EmployeeDismissal, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const dismissalData = {
    ...data,
    created_at: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, 'employee_dismissals'), dismissalData);
  return docRef.id;
}

// Atualizar baixa
export async function updateDismissal(id: string, data: Partial<EmployeeDismissal>): Promise<void> {
  const dismissalRef = doc(db, 'employee_dismissals', id);
  await updateDoc(dismissalRef, {
    ...data,
    updated_at: Timestamp.now()
  });
}

// Excluir baixa
export async function deleteDismissal(id: string): Promise<void> {
  try {
    // Primeiro, busca a baixa para verificar se existe
    const dismissalRef = doc(db, 'employee_dismissals', id);
    const dismissalDoc = await getDoc(dismissalRef);
    
    if (!dismissalDoc.exists()) {
      throw new Error('Baixa não encontrada');
    }

    // Remove a baixa
    await deleteDoc(dismissalRef);
  } catch (error) {
    console.error('Erro ao excluir baixa:', error);
    throw error;
  }
}

// Buscar baixas por período
export async function getDismissalsByPeriod(startDate: string, endDate: string): Promise<EmployeeDismissal[]> {
  const dismissalsRef = collection(db, 'employee_dismissals');
  const q = query(
    dismissalsRef,
    where('dismissal_date', '>=', startDate),
    where('dismissal_date', '<=', endDate),
    orderBy('dismissal_date', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    amount: Number(doc.data().amount) || 0,
    created_at: doc.data().created_at.toDate().toISOString(),
    updated_at: doc.data().updated_at?.toDate().toISOString()
  })) as EmployeeDismissal[];
}
