import React from 'react';
import { X } from 'lucide-react';
import { Transaction, createTransaction, updateTransaction } from '../services/finances';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTransaction?: Transaction | null;
};

export function NewTransactionModal({ isOpen, onClose, onSuccess, editingTransaction }: Props) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const transactionData = {
        type: formData.get('type') as string,
        category: formData.get('category') as string,
        payment_method: formData.get('payment_method') as string,
        description: formData.get('description') as string,
        amount: Number(formData.get('amount')),
        due_date: formData.get('due_date') as string,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, transactionData);
      } else {
        await createTransaction(transactionData);
      }
      
      onSuccess();
      onClose();
      form.reset();
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
      alert('Erro ao salvar transação. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="card p-6 w-full max-w-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
            {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Tipo</label>
            <select 
              name="type" 
              className="input" 
              required
              defaultValue={editingTransaction?.type || ''}
            >
              <option value="">Selecione um tipo</option>
              <option value="expense">Despesa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Categoria</label>
            <select 
              name="category" 
              className="input" 
              required
              defaultValue={editingTransaction?.category || ''}
            >
              <option value="">Selecione uma categoria</option>
              <option value="aluguel">Aluguel</option>
              <option value="energia">Energia</option>
              <option value="internet">Internet</option>
              <option value="manutencao">Manutenção</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Método de Pagamento</label>
            <select 
              name="payment_method" 
              className="input" 
              required
              defaultValue={editingTransaction?.payment_method || ''}
            >
              <option value="">Selecione um método</option>
              <option value="pix">PIX</option>
              <option value="transferencia">Transferência</option>
              <option value="boleto">Boleto</option>
              <option value="cartao">Cartão</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Descrição</label>
            <textarea
              name="description"
              className="input"
              rows={3}
              placeholder="Descreva a transação"
              required
              defaultValue={editingTransaction?.description}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Valor</label>
            <input
              type="number"
              name="amount"
              className="input"
              placeholder="0,00"
              step="0.01"
              min="0"
              required
              defaultValue={editingTransaction?.amount}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Data de Vencimento</label>
            <input
              type="date"
              name="due_date"
              className="input"
              required
              defaultValue={editingTransaction?.due_date}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="button-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="button-primary">
              {editingTransaction ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
