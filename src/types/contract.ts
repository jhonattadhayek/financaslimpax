export type Contract = {
  id: string;
  municipality_name: string;
  start_date: string;
  end_date: string;
  value: number;
  active: boolean;
  created_at: string;
  updated_at?: string;
};
