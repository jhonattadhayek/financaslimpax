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

export type Transaction = {
  id: string;
  type: string;
  category: string;
  payment_method: string;
  description: string;
  amount: number;
  due_date: string;
  created_at: string;
  updated_at: string;
};

type FirestoreTransaction = Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'due_date'> & {
  due_date: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
};

const convertTransactionFromFirestore = (id: string, data: FirestoreTransaction): Transaction => ({
  id,
  ...data,
  due_date: data.due_date.toDate().toISOString().split('T')[0],
  created_at: data.created_at.toDate().toISOString(),
  updated_at: data.updated_at.toDate().toISOString()
});

export async function getTransactions(filters?: { startDate?: string; endDate?: string }) {
  try {
    const transactionsRef = collection(db, 'financial_transactions');
    let constraints: any[] = [orderBy('due_date', 'desc')];

    if (filters) {
      if (filters.startDate) {
        constraints.push(where('due_date', '>=', Timestamp.fromDate(new Date(filters.startDate))));
      }
      if (filters.endDate) {
        constraints.push(where('due_date', '<=', Timestamp.fromDate(new Date(filters.endDate))));
      }
    }

    const q = query(transactionsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => 
      convertTransactionFromFirestore(doc.id, doc.data() as FirestoreTransaction)
    );
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    throw error;
  }
}

export async function getTransactionsByCategory(category: string) {
  try {
    const transactionsRef = collection(db, 'financial_transactions');
    const q = query(
      transactionsRef,
      where('category', '==', category),
      orderBy('due_date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => 
      convertTransactionFromFirestore(doc.id, doc.data() as FirestoreTransaction)
    );
  } catch (error) {
    console.error('Erro ao buscar transações por categoria:', error);
    throw error;
  }
}

export async function createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const now = Timestamp.now();
    const transactionsRef = collection(db, 'financial_transactions');
    
    const docRef = await addDoc(transactionsRef, {
      ...transaction,
      due_date: Timestamp.fromDate(new Date(transaction.due_date)),
      created_at: now,
      updated_at: now
    });
    
    const newDoc = await getDoc(docRef);
    return convertTransactionFromFirestore(newDoc.id, newDoc.data() as FirestoreTransaction);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    throw error;
  }
}

export async function updateTransaction(
  id: string,
  transaction: Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at'>>
) {
  try {
    const transactionRef = doc(db, 'financial_transactions', id);
    const updateData: any = {
      ...transaction,
      updated_at: Timestamp.now()
    };
    
    if (transaction.due_date) {
      updateData.due_date = Timestamp.fromDate(new Date(transaction.due_date));
    }
    
    await updateDoc(transactionRef, updateData);
    const updatedDoc = await getDoc(transactionRef);
    return convertTransactionFromFirestore(updatedDoc.id, updatedDoc.data() as FirestoreTransaction);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    throw error;
  }
}

export async function deleteTransaction(id: string) {
  try {
    const transactionRef = doc(db, 'financial_transactions', id);
    await deleteDoc(transactionRef);
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    throw error;
  }
}

export async function getTransactionsByMonth(month: number, year: number) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return getTransactions({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Erro ao buscar transações por mês:', error);
    throw error;
  }
}

export async function getTransactionSummary(startDate?: string, endDate?: string) {
  try {
    const transactions = await getTransactions({ startDate, endDate });
    
    const summary = transactions.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return summary;
  } catch (error) {
    console.error('Erro ao buscar resumo de transações:', error);
    throw error;
  }
}
