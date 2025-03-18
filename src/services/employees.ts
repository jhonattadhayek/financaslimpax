import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Employee } from '../types/employee';

// Buscar todos os funcionários ativos
export async function getActiveEmployees(): Promise<Employee[]> {
  const employeesRef = collection(db, 'employees');
  const q = query(
    employeesRef,
    where('active', '==', true)
  );
  try {
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Employee data:', data); // Debug log
      
      return {
        id: doc.id,
        name: data.name || '',
        contract_id: data.contract_id,
        contract_municipality: data.contract_municipality,
        is_headquarter: data.is_headquarter || false,
        active: data.active || false,
        hire_date: data.hire_date || new Date().toISOString().split('T')[0],
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : undefined
      } as Employee;
    });
  } catch (error) {
    console.error('Error in getActiveEmployees:', error);
    throw error;
  }
}

// Buscar todos os funcionários
export async function getAllEmployees(): Promise<Employee[]> {
  const employeesRef = collection(db, 'employees');
  const q = query(employeesRef);
  try {
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Employee data:', data); // Debug log
      
      return {
        id: doc.id,
        name: data.name || '',
        contract_id: data.contract_id,
        contract_municipality: data.contract_municipality,
        is_headquarter: data.is_headquarter || false,
        active: data.active || false,
        hire_date: data.hire_date || new Date().toISOString().split('T')[0],
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : undefined
      } as Employee;
    });
  } catch (error) {
    console.error('Error in getAllEmployees:', error);
    throw error;
  }
}

// Criar novo funcionário
export async function createEmployee(data: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const employeeData = {
    ...data,
    created_at: Timestamp.now(),
    active: true
  };

  const docRef = await addDoc(collection(db, 'employees'), employeeData);
  return docRef.id;
}

// Atualizar funcionário
export async function updateEmployee(id: string, data: Partial<Employee>): Promise<void> {
  const employeeRef = doc(db, 'employees', id);
  await updateDoc(employeeRef, {
    ...data,
    updated_at: Timestamp.now()
  });
}

// Desativar funcionário
export async function deactivateEmployee(id: string): Promise<void> {
  const employeeRef = doc(db, 'employees', id);
  await updateDoc(employeeRef, {
    active: false,
    updated_at: Timestamp.now()
  });
}

// Buscar funcionários por contrato
export async function getEmployeesByContract(contractId: string): Promise<Employee[]> {
  const employeesRef = collection(db, 'employees');
  const q = query(
    employeesRef,
    where('contract_id', '==', contractId),
    where('active', '==', true)
  );
  try {
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Employee data:', data); // Debug log
      
      return {
        id: doc.id,
        name: data.name || '',
        contract_id: data.contract_id,
        contract_municipality: data.contract_municipality,
        is_headquarter: data.is_headquarter || false,
        active: data.active || false,
        hire_date: data.hire_date || new Date().toISOString().split('T')[0],
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : undefined
      } as Employee;
    });
  } catch (error) {
    console.error('Error in getEmployeesByContract:', error);
    throw error;
  }
}

// Buscar funcionários da SEDE
export async function getHeadquarterEmployees(): Promise<Employee[]> {
  const employeesRef = collection(db, 'employees');
  const q = query(
    employeesRef,
    where('is_headquarter', '==', true),
    where('active', '==', true)
  );
  try {
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Employee data:', data); // Debug log
      
      return {
        id: doc.id,
        name: data.name || '',
        contract_id: data.contract_id,
        contract_municipality: data.contract_municipality,
        is_headquarter: data.is_headquarter || false,
        active: data.active || false,
        hire_date: data.hire_date || new Date().toISOString().split('T')[0],
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : undefined
      } as Employee;
    });
  } catch (error) {
    console.error('Error in getHeadquarterEmployees:', error);
    throw error;
  }
}

// Deletar funcionário
export async function deleteEmployee(id: string): Promise<void> {
  const employeeRef = doc(db, 'employees', id);
  await deleteDoc(employeeRef);
}
