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
  payment_date: data.payment_date.toDate().toISOString().split('T')[0],
  created_at: data.created_at.toDate().toISOString(),
  updated_at: data.updated_at.toDate().toISOString()
});

export async function getSuppliers(filters?: { startDate?: string; endDate?: string }) {
  const suppliersRef = collection(db, 'suppliers');
  let constraints: any[] = [];

  if (filters) {
    if (filters.startDate) {
      constraints.push(where('payment_date', '>=', Timestamp.fromDate(new Date(filters.startDate))));
    }
    if (filters.endDate) {
      constraints.push(where('payment_date', '<=', Timestamp.fromDate(new Date(filters.endDate))));
    }
  }

  const q = query(suppliersRef, ...constraints);
  const snapshot = await getDocs(q);
  
  // Ordenar no cliente
  return snapshot.docs
    .map(doc => convertSupplierFromFirestore(doc.id, doc.data() as FirestoreSupplier))
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
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
    payment_date: Timestamp.fromDate(new Date(supplier.payment_date)),
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
  
  if (supplier.payment_date) {
    updateData.payment_date = Timestamp.fromDate(new Date(supplier.payment_date));
  }
  
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
  return suppliers.reduce((total, supplier) => total + supplier.paid_value, 0);
}
