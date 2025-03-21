import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  where, 
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type MonthlyRecord = {
  id: string;
  contract_id: string;
  month: number;
  year: number;
  revenue: number;
  expenses: number;
  employees_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type FirestoreMonthlyRecord = Omit<MonthlyRecord, 'id' | 'created_at' | 'updated_at'> & {
  created_at: Timestamp;
  updated_at: Timestamp;
};

const convertMonthlyRecordFromFirestore = (id: string, data: FirestoreMonthlyRecord): MonthlyRecord => ({
  id,
  ...data,
  created_at: data.created_at.toDate().toISOString(),
  updated_at: data.updated_at.toDate().toISOString()
});

export async function getMonthlyRecords(contractId: string) {
  try {
    const recordsRef = collection(db, 'monthly_records');
    const q = query(
      recordsRef,
      where('contract_id', '==', contractId)
    );
    
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => 
      convertMonthlyRecordFromFirestore(doc.id, doc.data() as FirestoreMonthlyRecord)
    );
    
    // Ordenar no cliente
    return records.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  } catch (error) {
    console.error('Erro ao buscar registros mensais:', error);
    throw error;
  }
}

export async function createMonthlyRecord(record: Omit<MonthlyRecord, 'id' | 'created_at' | 'updated_at'>) {
  const now = Timestamp.now();
  const recordsRef = collection(db, 'monthly_records');
  
  const docRef = await addDoc(recordsRef, {
    ...record,
    created_at: now,
    updated_at: now
  });
  
  const newDoc = await getDoc(docRef);
  return convertMonthlyRecordFromFirestore(newDoc.id, newDoc.data() as FirestoreMonthlyRecord);
}

export async function updateMonthlyRecord(id: string, data: Omit<MonthlyRecord, 'id' | 'contract_id' | 'created_at' | 'updated_at'>) {
  try {
    const recordRef = doc(db, 'monthly_records', id);
    const now = Timestamp.now();
    
    await updateDoc(recordRef, {
      ...data,
      updated_at: now
    });

    const updatedDoc = await getDoc(recordRef);
    if (!updatedDoc.exists()) {
      throw new Error('Registro não encontrado');
    }

    return convertMonthlyRecordFromFirestore(updatedDoc.id, updatedDoc.data() as FirestoreMonthlyRecord);
  } catch (error) {
    console.error('Erro ao atualizar registro mensal:', error);
    throw error;
  }
}

export async function deleteMonthlyRecord(id: string) {
  const recordRef = doc(db, 'monthly_records', id);
  await deleteDoc(recordRef);
}
