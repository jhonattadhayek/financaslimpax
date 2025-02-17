import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/user';
import { getUsers, createUser, deleteUser, updateUserRole } from '../services/users';

function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Erro ao carregar usuários');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      const userData = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        role: formData.get('role') as 'admin' | 'user'
      };

      await createUser(userData);
      await loadUsers();
      setShowModal(false);
      form.reset();
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      setFormError('Erro ao criar usuário. Verifique os dados e tente novamente.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    }
  };

  const handleToggleRole = async (user: User) => {
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await updateUserRole(user.id, newRole);
      await loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar papel do usuário:', error);
      alert('Erro ao atualizar papel do usuário');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-text-secondary">Carregando usuários...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-text-secondary hover:text-text transition-colors rounded-lg hover:bg-surface-hover"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
            Gerenciamento de Usuários
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="button-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Lista de Usuários */}
      <div className="grid gap-4">
        {users.map(user => (
          <div 
            key={user.id}
            className="card p-4 hover:scale-[1.01] transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-text">{user.email}</h3>
                <p className="text-sm text-text-secondary">
                  Criado em: {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleRole(user)}
                  className={`px-3 py-1 rounded-full flex items-center space-x-1 ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  <Shield size={16} />
                  <span className="capitalize">{user.role}</span>
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Novo Usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="card p-6 w-full max-w-xl">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
              Novo Usuário
            </h2>
            <form className="space-y-4" onSubmit={handleCreateUser}>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Senha</label>
                <input
                  type="password"
                  name="password"
                  className="input"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Papel</label>
                <select name="role" className="input" required>
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {formError && (
                <div className="text-red-500 text-sm">{formError}</div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="button-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="button-primary">
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
