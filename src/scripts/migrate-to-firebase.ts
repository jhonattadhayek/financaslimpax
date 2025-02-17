import 'dotenv/config';
import { 
  collection, 
  addDoc,
  Timestamp,
  getDocs,
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Dados padrão para inicializar o banco
const defaultCategories = [
  { name: 'Pagamento de Contrato', type: 'income', description: 'Receitas de contratos municipais' },
  { name: 'Salários', type: 'expense', description: 'Pagamento de funcionários' },
  { name: 'Equipamentos', type: 'expense', description: 'Compra e manutenção de equipamentos' },
  { name: 'Materiais de Limpeza', type: 'expense', description: 'Produtos e materiais de limpeza' },
  { name: 'Impostos', type: 'expense', description: 'Pagamentos de impostos e taxas' },
  { name: 'Transporte', type: 'expense', description: 'Custos com transporte e combustível' }
];

const defaultPaymentMethods = [
  { name: 'PIX', description: 'Pagamento via PIX', is_active: true },
  { name: 'Transferência Bancária', description: 'Transferência entre contas', is_active: true },
  { name: 'Boleto', description: 'Pagamento via boleto bancário', is_active: true },
  { name: 'Dinheiro', description: 'Pagamento em espécie', is_active: true },
  { name: 'Cartão de Crédito', description: 'Pagamento com cartão de crédito', is_active: true },
  { name: 'Cartão de Débito', description: 'Pagamento com cartão de débito', is_active: true }
];

const defaultContracts = [
  {
    municipality_name: 'Prefeitura de Exemplo',
    description: 'Serviços de limpeza e conservação',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    status: 'active'
  }
];

const defaultMonthlyRecords = [
  {
    month: 1,
    year: 2025,
    revenue: 50000,
    expenses: 35000,
    employees_count: 20,
    notes: 'Registro inicial'
  }
];

const defaultSuppliers = [
  {
    name: 'Fornecedor de Materiais Ltda',
    service: 'Materiais de Limpeza',
    document: '12.345.678/0001-90',
    payment_method: 'Boleto',
    contract_value: 15000,
    paid_value: 5000,
    payment_date: '2025-01-15'
  },
  {
    name: 'Equipamentos Industriais SA',
    service: 'Equipamentos de Limpeza',
    document: '98.765.432/0001-10',
    payment_method: 'Transferência',
    contract_value: 25000,
    paid_value: 12500,
    payment_date: '2025-01-20'
  }
];

const defaultInternalCosts = [
  {
    type: 'expense',
    category: 'aluguel',
    payment_method: 'Transferência',
    description: 'Aluguel do escritório',
    amount: 3000,
    due_date: '2025-01-05'
  },
  {
    type: 'expense',
    category: 'energia',
    payment_method: 'Boleto',
    description: 'Conta de energia',
    amount: 800,
    due_date: '2025-01-10'
  },
  {
    type: 'expense',
    category: 'internet',
    payment_method: 'Boleto',
    description: 'Internet corporativa',
    amount: 400,
    due_date: '2025-01-15'
  },
  {
    type: 'expense',
    category: 'manutencao',
    payment_method: 'PIX',
    description: 'Manutenção predial',
    amount: 1200,
    due_date: '2025-01-20'
  }
];

async function clearCollection(collectionName: string) {
  console.log(`Limpando coleção ${collectionName}...`);
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  console.log(`Coleção ${collectionName} limpa`);
}

async function initializeCategories() {
  console.log('Inicializando categorias...');
  const categoriesRef = collection(db, 'financial_categories');
  const now = Timestamp.now();
  
  for (const category of defaultCategories) {
    await addDoc(categoriesRef, {
      ...category,
      created_at: now,
      updated_at: now
    });
  }
  console.log(`${defaultCategories.length} categorias criadas`);
}

async function initializePaymentMethods() {
  console.log('Inicializando métodos de pagamento...');
  const methodsRef = collection(db, 'payment_methods');
  const now = Timestamp.now();
  
  for (const method of defaultPaymentMethods) {
    await addDoc(methodsRef, {
      ...method,
      created_at: now,
      updated_at: now
    });
  }
  console.log(`${defaultPaymentMethods.length} métodos de pagamento criados`);
}

async function initializeContracts() {
  console.log('Inicializando contratos...');
  const contractsRef = collection(db, 'contracts');
  const now = Timestamp.now();
  const createdContracts = [];
  
  for (const contract of defaultContracts) {
    const docRef = await addDoc(contractsRef, {
      ...contract,
      start_date: Timestamp.fromDate(new Date(contract.start_date)),
      end_date: Timestamp.fromDate(new Date(contract.end_date)),
      created_at: now,
      updated_at: now
    });
    createdContracts.push({ id: docRef.id });
  }
  
  console.log(`${defaultContracts.length} contratos criados`);
  return createdContracts;
}

async function initializeMonthlyRecords(contracts: { id: string }[]) {
  console.log('Inicializando registros mensais...');
  const recordsRef = collection(db, 'monthly_records');
  const now = Timestamp.now();
  
  for (const contract of contracts) {
    for (const record of defaultMonthlyRecords) {
      await addDoc(recordsRef, {
        ...record,
        contract_id: contract.id,
        created_at: now,
        updated_at: now
      });
    }
  }
  console.log(`${defaultMonthlyRecords.length * contracts.length} registros mensais criados`);
}

async function initializeSuppliers() {
  console.log('Inicializando fornecedores...');
  const suppliersRef = collection(db, 'suppliers');
  const now = Timestamp.now();
  
  for (const supplier of defaultSuppliers) {
    await addDoc(suppliersRef, {
      ...supplier,
      payment_date: Timestamp.fromDate(new Date(supplier.payment_date)),
      created_at: now,
      updated_at: now
    });
  }
  console.log(`${defaultSuppliers.length} fornecedores criados`);
}

async function initializeInternalCosts() {
  console.log('Inicializando custos internos...');
  const transactionsRef = collection(db, 'financial_transactions');
  const now = Timestamp.now();
  
  for (const cost of defaultInternalCosts) {
    await addDoc(transactionsRef, {
      ...cost,
      due_date: Timestamp.fromDate(new Date(cost.due_date)),
      created_at: now,
      updated_at: now
    });
  }
  console.log(`${defaultInternalCosts.length} custos internos criados`);
}

async function initialize() {
  try {
    console.log('Iniciando inicialização do Firebase...');
    
    // Limpar coleções existentes
    await clearCollection('financial_categories');
    await clearCollection('payment_methods');
    await clearCollection('contracts');
    await clearCollection('monthly_records');
    await clearCollection('suppliers');
    await clearCollection('financial_transactions');
    
    // Inicializar com novos dados
    await initializeCategories();
    await initializePaymentMethods();
    const contracts = await initializeContracts();
    if (contracts && contracts.length > 0) {
      await initializeMonthlyRecords(contracts);
    }
    await initializeSuppliers();
    await initializeInternalCosts();
    
    console.log('Inicialização concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro durante a inicialização:', error);
    process.exit(1);
  }
}

initialize();
