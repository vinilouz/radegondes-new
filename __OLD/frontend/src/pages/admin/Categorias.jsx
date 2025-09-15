import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/DataTable';
import { API_BASE_URL } from '../../config/api';
import { useModal } from '../../hooks/useModal';

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  
  useModal(showForm);

  const [formData, setFormData] = useState({ nome: '' });
  const { token } = useAuth();

  const columns = [
    { key: 'nome', label: 'Nome' },
    { 
      key: 'createdAt', 
      label: 'Data de Criação',
      render: (item) => new Date(item.createdAt).toLocaleDateString('pt-BR')
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (item) => (
        <div className="admin-button-group">
          <button
            onClick={() => handleEdit(item)}
            className="admin-btn-create"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="admin-btn-danger"
          >
            Excluir
          </button>
        </div>
      )
    }
  ];

  useEffect(() => {
    document.title = 'Categorias - Radegondes';
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/categorias`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategorias(data);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `${API_BASE_URL}/api/admin/categorias/${editingId}`
      : `${API_BASE_URL}/api/admin/categorias`;
    
    try {
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchCategorias();
        setShowForm(false);
        setEditingId(null);
        setFormData({ nome: '' });
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    }
  };

  const handleEdit = (categoria) => {
    setFormData({ nome: categoria.nome });
    setEditingId(categoria._id);
    setShowForm(true);
  };

  const handleDelete = async (categoria) => {
    const id = categoria._id || categoria;
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/categorias/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          fetchCategorias();
        }
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
      }
    }
  };

  return (
    <>
      <header className='flex justify-between head'>
        <h1>Categorias</h1>
        <button onClick={() => setShowForm(true)}>Nova Categoria</button>
      </header>

      {showForm && (
        <div className={`modal-overlay${isClosing ? ' closing' : ''}`} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowForm(false);
            setEditingId(null);
            setFormData({ nome: '' });
          }
        }}>
          <div className={`form-modal${isClosing ? ' closing' : ''}`}>
            <h3>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h3>
            <input
              type="text"
              placeholder="Nome da categoria"
              value={formData.nome}
              onChange={(e) => setFormData({ nome: e.target.value })}
              required
            />
            <div className="form-actions">
              <button type="submit" onClick={handleSubmit}>Salvar</button>
              <button type="button" onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ nome: '' });
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <DataTable
        data={categorias}
        columns={columns}
        onEdit={null}
        onDelete={null}
        loading={loading}
      />
    </>
  );
}

export default Categorias;
