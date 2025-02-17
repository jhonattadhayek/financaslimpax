import React, { useState } from 'react';
import { EmployeeVacationsTab } from '../components/EmployeeVacationsTab';

export function EmployeeVacations() {
  const [totalCost, setTotalCost] = useState(0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
            Férias de Funcionários
          </h1>
          <div className="text-lg font-semibold">
            Total: <span className="text-primary">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <EmployeeVacationsTab onCostUpdate={setTotalCost} />
      </div>
    </div>
  );
}
