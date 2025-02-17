export type Employee = {
  id: string;
  name: string;
  contract_id?: string;
  contract_municipality?: string;
  is_headquarter: boolean;
  active: boolean;
  hire_date: string;
  created_at: string;
  updated_at?: string;
};
