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

export type Contract = {
  id: string;
  municipality_name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type FirestoreContract = Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'start_date' | 'end_date'> & {
  start_date: Timestamp;
  end_date: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
};

const convertContractFromFirestore = (id: string, data: FirestoreContract): Contract => ({
  id,
  ...data,
  start_date: data.start_date.toDate().toISOString().split('T')[0],
  end_date: data.end_date.toDate().toISOString().split('T')[0],
  created_at: data.created_at.toDate().toISOString(),
  updated_at: data.updated_at.toDate().toISOString()
});

export async function getContracts() {
  const contractsRef = collection(db, 'contracts');
  const q = query(contractsRef, orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => 
    convertContractFromFirestore(doc.id, doc.data() as FirestoreContract)
  );
}

export async function getContractById(id: string) {
  try {
    const contractRef = doc(db, 'contracts', id);
    const snapshot = await getDoc(contractRef);
    
    if (!snapshot.exists()) {
      throw new Error('Contrato não encontrado');
    }
    
    return convertContractFromFirestore(snapshot.id, snapshot.data() as FirestoreContract);
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    throw error;
  }
}

export async function createContract(contract: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) {
  const now = Timestamp.now();
  const contractsRef = collection(db, 'contracts');
  
  const docRef = await addDoc(contractsRef, {
    ...contract,
    start_date: Timestamp.fromDate(new Date(contract.start_date)),
    end_date: Timestamp.fromDate(new Date(contract.end_date)),
    created_at: now,
    updated_at: now
  });
  
  const newDoc = await getDoc(docRef);
  return convertContractFromFirestore(newDoc.id, newDoc.data() as FirestoreContract);
}

export async function updateContract(
  id: string,
  contract: Partial<Omit<Contract, 'id' | 'created_at' | 'updated_at'>>
) {
  const contractRef = doc(db, 'contracts', id);
  const updateData: any = {
    ...contract,
    updated_at: Timestamp.now()
  };
  
  if (contract.start_date) {
    updateData.start_date = Timestamp.fromDate(new Date(contract.start_date));
  }
  if (contract.end_date) {
    updateData.end_date = Timestamp.fromDate(new Date(contract.end_date));
  }
  
  await updateDoc(contractRef, updateData);
  const updatedDoc = await getDoc(contractRef);
  return convertContractFromFirestore(updatedDoc.id, updatedDoc.data() as FirestoreContract);
}

export async function deleteContract(id: string) {
  try {
    // Primeiro, busca o contrato para verificar se existe
    const contractRef = doc(db, 'contracts', id);
    const contractDoc = await getDoc(contractRef);
    
    if (!contractDoc.exists()) {
      throw new Error('Contrato não encontrado');
    }

    // Verifica se há funcionários ativos vinculados ao contrato
    const employeesRef = collection(db, 'employees');
    const q = query(
      employeesRef,
      where('contract_id', '==', id),
      where('active', '==', true)
    );
    const employeesSnapshot = await getDocs(q);

    if (!employeesSnapshot.empty) {
      throw new Error('Não é possível excluir o contrato pois existem funcionários ativos vinculados a ele');
    }

    // Remove o contrato
    await deleteDoc(contractRef);
  } catch (error) {
    console.error('Erro ao excluir contrato:', error);
    throw error;
  }
}
