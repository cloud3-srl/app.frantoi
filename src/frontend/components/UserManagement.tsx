import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  nome: string;
  cognome: string;
  username: string;
  email: string;
  ruolo: number;
  ultimoLogin: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stato per il form di creazione/modifica utente
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    username: '',
    password: '',
    email: '',
    ruolo: 2 // Default: utente normale
  });

  // Caricamento dati iniziali
  useEffect(() => {
    fetchUsers();
  }, []);

  // Recupera tutti gli utenti
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setUsers(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Errore nel recupero degli utenti:', err);
      setError('Errore nel caricamento degli utenti');
      setLoading(false);
    }
  };

  // Gestione del form di creazione/modifica
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'ruolo' ? parseInt(value) : value
    });
  };

  // Gestione dell'invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedUserId) {
        // Aggiorna un utente esistente
        const dataToUpdate: any = { ...formData };
        if (!dataToUpdate.password) {
          delete dataToUpdate.password; // Rimuove la password se è vuota
        }
        
        await axios.put(`/api/users/${selectedUserId}`, dataToUpdate, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        // Crea un nuovo utente
        await axios.post('/api/users', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      
      // Resetta il form e ricarica gli utenti
      resetForm();
      fetchUsers();
    } catch (err: any) {
      console.error('Errore nell\'operazione utente:', err);
      setError(err.response?.data?.message || 'Errore nell\'operazione');
    }
  };

  // Prepara il form per la modifica di un utente
  const handleEditUser = (user: User) => {
    setIsEditing(true);
    setSelectedUserId(user.id);
    setFormData({
      nome: user.nome,
      cognome: user.cognome,
      username: user.username,
      password: '', // La password non viene recuperata
      email: user.email || '',
      ruolo: user.ruolo
    });
  };

  // Resetta il form allo stato iniziale
  const resetForm = () => {
    setIsEditing(false);
    setSelectedUserId(null);
    setFormData({
      nome: '',
      cognome: '',
      username: '',
      password: '',
      email: '',
      ruolo: 2
    });
    setError(null);
  };

  if (loading) return <div>Caricamento...</div>;

  return (
    <div className="user-management">
      <h2>Gestione Utenti</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Form per creazione/modifica utente */}
      <div className="user-form">
        <h3>{isEditing ? 'Modifica Utente' : 'Crea Nuovo Utente'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nome">Nome</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
                maxLength={20}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="cognome">Cognome</label>
              <input
                type="text"
                id="cognome"
                name="cognome"
                value={formData.cognome}
                onChange={handleInputChange}
                required
                maxLength={20}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={isEditing} // Non permettere la modifica dell'username
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password {isEditing && '(lasciare vuoto per non modificare)'}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!isEditing} // Obbligatoria solo per la creazione
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="ruolo">Ruolo</label>
              <select
                id="ruolo"
                name="ruolo"
                value={formData.ruolo}
                onChange={handleInputChange}
              >
                <option value={1}>Amministratore</option>
                <option value={2}>Utente standard</option>
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit">
              {isEditing ? 'Aggiorna Utente' : 'Crea Utente'}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="btn-secondary">
                Annulla
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Lista degli utenti */}
      <div className="users-list">
        <h3>Utenti ({users.length})</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Cognome</th>
              <th>Username</th>
              <th>Email</th>
              <th>Ruolo</th>
              <th>Ultimo Login</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.nome}</td>
                <td>{user.cognome}</td>
                <td>{user.username}</td>
                <td>{user.email || '-'}</td>
                <td>{user.ruolo === 1 ? 'Admin' : 'Utente'}</td>
                <td>{user.ultimoLogin ? new Date(user.ultimoLogin).toLocaleString() : 'Mai'}</td>
                <td>
                  <button onClick={() => handleEditUser(user)}>
                    Modifica
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={8}>Nessun utente trovato</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;