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

export type Supplier = {
  id: string;
  name: string;
  service: string;
  document: string; // CPF/CNPJ
  payment_method: string;
  contract_value: number;
  paid_value: number;
  payment_date: string;
  created_at: string;
  updated_at: string;
  contract_id?: string;
  is_headquarter: boolean;
};

type FirestoreSupplier = Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'payment_date'> & {
  payment_date: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
};

const convertSupplierFromFirestore = (id: string, data: FirestoreSupplier): Supplier => ({
  id,
  ...data,
  payment_date: data.payment_date ? data.payment_date.toDate().toISOString().split('T')[0] : '',
  created_at: data.created_at.toDate().toISOString(),
  updated_at: data.updated_at.toDate().toISOString()
});

export async function getSuppliers(filters?: { startDate?: string; endDate?: string }) {
  const suppliersRef = collection(db, 'suppliers');
  
  // Se temos filtros de data, precisamos fazer duas consultas:
  // 1. Uma para fornecedores com data de pagamento dentro do intervalo
  // 2. Outra para fornecedores sem data de pagamento (null)
  let allDocs: any[] = [];
  
  if (filters && (filters.startDate || filters.endDate)) {
    let dateConstraints: any[] = [];
    
    if (filters.startDate) {
      dateConstraints.push(where('payment_date', '>=', Timestamp.fromDate(new Date(filters.startDate))));
    }
    if (filters.endDate) {
      dateConstraints.push(where('payment_date', '<=', Timestamp.fromDate(new Date(filters.endDate))));
    }
    
    // Consulta para fornecedores com data dentro do intervalo
    const dateQuery = query(suppliersRef, ...dateConstraints);
    const dateSnapshot = await getDocs(dateQuery);
    
    // Consulta para fornecedores sem data de pagamento
    const nullQuery = query(suppliersRef, where('payment_date', '==', null));
    const nullSnapshot = await getDocs(nullQuery);
    
    // Combinar os resultados
    allDocs = [...dateSnapshot.docs, ...nullSnapshot.docs];
  } else {
    // Se não há filtros de data, buscar todos os fornecedores
    const q = query(suppliersRef);
    const snapshot = await getDocs(q);
    allDocs = snapshot.docs;
  }
  
  // Ordenar no cliente
  return allDocs
    .map((doc: any) => convertSupplierFromFirestore(doc.id, doc.data() as FirestoreSupplier))
    .sort((a: Supplier, b: Supplier) => {
      // Se ambas as datas existirem, compara normalmente
      if (a.payment_date && b.payment_date) {
        return new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
      }
      // Se apenas a.payment_date existir, coloca a antes
      if (a.payment_date && !b.payment_date) {
        return -1;
      }
      // Se apenas b.payment_date existir, coloca b antes
      if (!a.payment_date && b.payment_date) {
        return 1;
      }
      // Se nenhuma data existir, mantém a ordem original
      return 0;
    });
}

export async function getSupplierById(id: string) {
  const supplierRef = doc(db, 'suppliers', id);
  const snapshot = await getDoc(supplierRef);
  
  if (!snapshot.exists()) {
    throw new Error('Fornecedor não encontrado');
  }
  
  return convertSupplierFromFirestore(snapshot.id, snapshot.data() as FirestoreSupplier);
}

export async function createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) {
  const now = Timestamp.now();
  const suppliersRef = collection(db, 'suppliers');
  
  const docRef = await addDoc(suppliersRef, {
    ...supplier,
    payment_date: supplier.payment_date ? Timestamp.fromDate(new Date(supplier.payment_date)) : null,
    created_at: now,
    updated_at: now,
    is_headquarter: supplier.is_headquarter || false,
    contract_id: supplier.contract_id
  });
  
  const newDoc = await getDoc(docRef);
  return convertSupplierFromFirestore(newDoc.id, newDoc.data() as FirestoreSupplier);
}

export async function updateSupplier(
  id: string,
  supplier: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>
) {
  const supplierRef = doc(db, 'suppliers', id);
  const updateData: any = {
    ...supplier,
    updated_at: Timestamp.now()
  };
  
  // Se payment_date for uma string não vazia, converte para Timestamp
  // Se for uma string vazia ou undefined, define como null
  updateData.payment_date = supplier.payment_date 
    ? Timestamp.fromDate(new Date(supplier.payment_date)) 
    : null;
  
  await updateDoc(supplierRef, updateData);
  const updatedDoc = await getDoc(supplierRef);
  return convertSupplierFromFirestore(updatedDoc.id, updatedDoc.data() as FirestoreSupplier);
}

export async function deleteSupplier(id: string) {
  const supplierRef = doc(db, 'suppliers', id);
  await deleteDoc(supplierRef);
}

export async function getSuppliersTotalCost(startDate?: string, endDate?: string) {
  const suppliers = await getSuppliers({ startDate, endDate });
  return suppliers.reduce((total: number, supplier: Supplier) => total + supplier.paid_value, 0);
}
