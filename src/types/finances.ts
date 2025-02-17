export type FinancialCategory = {
  id: string
  name: string
  type: 'income' | 'expense'
  description: string | null
  created_at: string
  updated_at: string
}

export type PaymentMethod = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type FinancialTransaction = {
  id: string
  contract_id: string | null
  category_id: string
  payment_method_id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  due_date: string
  payment_date: string | null
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  document_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Relacionamentos
  category?: FinancialCategory
  payment_method?: PaymentMethod
  contract?: {
    id: string
    municipality_name: string
  }
}

export type RecurringTransaction = {
  id: string
  category_id: string
  payment_method_id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date: string | null
  last_generated_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Relacionamentos
  category?: FinancialCategory
  payment_method?: PaymentMethod
}

export type TransactionFilters = {
  type?: 'income' | 'expense'
  category_id?: string
  payment_method_id?: string
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
  start_date?: string
  end_date?: string
  contract_id?: string
}
