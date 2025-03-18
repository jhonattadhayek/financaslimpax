import React, { useState } from 'react';
import { InternalCostsTab } from '../components/InternalCostsTab';
import { SuppliersTab } from '../components/SuppliersTab';
import { EmployeeDismissalsTab } from '../components/EmployeeDismissalsTab';

function Finances() {
  const [activeTab, setActiveTab] = useState<'internal' | 'suppliers' | 'dismissals'>('internal');
  const [internalCosts, setInternalCosts] = useState(0);
  const [suppliersCosts, setSuppliersCosts] = useState(0);
  const [dismissalsCosts, setDismissalsCosts] = useState(0);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
          Finanças
        </h1>
        <div className="text-text-secondary">
          Total: R$ {(internalCosts + suppliersCosts + dismissalsCosts).toLocaleString()}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/10">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`tab ${activeTab === 'internal' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('internal')}
          >
            Custos Internos
          </button>
          <button
            className={`tab ${activeTab === 'suppliers' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('suppliers')}
          >
            Fornecedores
          </button>
          <button
            className={`tab ${activeTab === 'dismissals' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('dismissals')}
          >
            Baixas
          </button>
        </nav>
      </div>

      {activeTab === 'internal' && (
        <InternalCostsTab onCostUpdate={setInternalCosts} />
      )}

      {activeTab === 'suppliers' && (
        <SuppliersTab onCostUpdate={setSuppliersCosts} />
      )}

      {activeTab === 'dismissals' && (
        <EmployeeDismissalsTab onCostUpdate={setDismissalsCosts} />
      )}
    </div>
  );
}

export default Finances;
