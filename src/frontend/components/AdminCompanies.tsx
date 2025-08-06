import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Company {
  id: number;
  descrizione: string;
  codice: string;
  ultimoidsoggetto: number;
  coordinate?: string;
  email_mittente?: string;
  email_password?: string;
  email_smtp_server?: string;
  email_smtp_port?: number;
  email_ssl?: boolean;
  email_default_oggetto?: string;
  email_firma?: string;
  createdAt: string;
}

interface User {
  id: number;
  nome: string;
  cognome: string;
}

const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stato per la creazione di nuove aziende
  const [newCompany, setNewCompany] = useState({
    descrizione: '',
    codice: '',
    ultimoidsoggetto: 0
  });

  // Stato per l'assegnazione utenti
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [companyUsers, setCompanyUsers] = useState<{[key: number]: User[]}>({});
  
  // Stato per la modifica dell'azienda
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState({
    descrizione: '',
    ultimoidsoggetto: 0,
    coordinate: '',
    email_mittente: '',
    email_password: '',
    email_smtp_server: '',
    email_smtp_port: 587,
    email_ssl: true,
    email_default_oggetto: '',
    email_firma: ''
  });
  const [testEmailDestination, setTestEmailDestination] = useState<string>('');
  const [testingEmail, setTestingEmail] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  // Caricamento dati iniziali
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Recupera tutte le aziende
        const companiesResponse = await axios.get('/api/companies', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setCompanies(companiesResponse.data.data);

        // Recupera tutti gli utenti (richiede una nuova API)
        const usersResponse = await axios.get('/api/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setUsers(usersResponse.data.data);

        setLoading(false);
      } catch (err) {
        console.error('Errore nel caricamento dei dati:', err);
        setError('Errore nel caricamento delle aziende');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Carica gli utenti di un'azienda selezionata
  const loadCompanyUsers = async (companyId: number) => {
    try {
      const response = await axios.get(`/api/companies/${companyId}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setCompanyUsers(prev => ({
        ...prev,
        [companyId]: response.data.data
      }));
    } catch (err) {
      console.error(`Errore nel caricamento degli utenti dell'azienda ${companyId}:`, err);
    }
  };

  // Gestione dell'invio del form per la creazione di una nuova azienda
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newCompany.descrizione.trim() === '' || newCompany.codice.trim() === '') {
      setError('Inserisci sia la descrizione che il codice azienda');
      return;
    }

    try {
      const response = await axios.post('/api/companies', newCompany, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Aggiorna la lista delle aziende
      setCompanies([...companies, response.data.data]);
      
      // Reset del form
      setNewCompany({ descrizione: '', codice: '', ultimoidsoggetto: 0 });
      setError(null);
      
      // Mostra un avviso se c'è una warning
      if (response.data.warning) {
        setError(response.data.warning);
      }
    } catch (err: any) {
      console.error('Errore nella creazione dell\'azienda:', err);
      setError(err.response?.data?.message || 'Errore nella creazione dell\'azienda');
    }
  };

  // Gestione dell'assegnazione di un utente a un'azienda
  const handleAssignUser = async () => {
    if (!selectedCompany || !selectedUser) {
      setError('Seleziona sia l\'azienda che l\'utente');
      return;
    }

    try {
      await axios.post('/api/companies/assign-user', {
        userId: selectedUser,
        companyId: selectedCompany
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Aggiorna la lista degli utenti dell'azienda
      await loadCompanyUsers(selectedCompany);
      
      setError(null);
    } catch (err: any) {
      console.error('Errore nell\'assegnazione dell\'utente:', err);
      setError(err.response?.data?.message || 'Errore nell\'assegnazione dell\'utente');
    }
  };

  // Gestione della rimozione di un utente da un'azienda
  const handleRemoveUser = async (companyId: number, userId: number) => {
    try {
      await axios.post('/api/companies/remove-user', {
        userId,
        companyId
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Aggiorna la lista degli utenti dell'azienda
      await loadCompanyUsers(companyId);
    } catch (err: any) {
      console.error('Errore nella rimozione dell\'utente:', err);
      setError(err.response?.data?.message || 'Errore nella rimozione dell\'utente');
    }
  };
  
  // Apre il form di modifica per un'azienda
  const handleEditClick = (company: Company) => {
    setEditingCompany(company);
    setEditForm({
      descrizione: company.descrizione,
      ultimoidsoggetto: company.ultimoidsoggetto,
      coordinate: company.coordinate || '',
      email_mittente: company.email_mittente || '',
      email_password: company.email_password || '',
      email_smtp_server: company.email_smtp_server || '',
      email_smtp_port: company.email_smtp_port || 587,
      email_ssl: company.email_ssl !== undefined ? company.email_ssl : true,
      email_default_oggetto: company.email_default_oggetto || '',
      email_firma: company.email_firma || ''
    });
    setTestResult(null);
    setTestEmailDestination('');
  };
  
  // Chiude il form di modifica
  const handleCancelEdit = () => {
    setEditingCompany(null);
  };
  
  // Gestione dell'invio del form per l'aggiornamento di un'azienda
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCompany) return;
    
    if (editForm.descrizione.trim() === '') {
      setError('La descrizione non può essere vuota');
      return;
    }

    try {
      const response = await axios.patch(`/api/companies/${editingCompany.id}`, {
        descrizione: editForm.descrizione,
        ultimoidsoggetto: editForm.ultimoidsoggetto,
        coordinate: editForm.coordinate,
        email_mittente: editForm.email_mittente,
        email_password: editForm.email_password,
        email_smtp_server: editForm.email_smtp_server,
        email_smtp_port: editForm.email_smtp_port,
        email_ssl: editForm.email_ssl,
        email_default_oggetto: editForm.email_default_oggetto,
        email_firma: editForm.email_firma
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Aggiorna la lista delle aziende
      setCompanies(companies.map(company => 
        company.id === editingCompany.id ? response.data.data : company
      ));
      
      // Chiudi il form di modifica
      setEditingCompany(null);
      setError(null);
    } catch (err: any) {
      console.error('Errore nell\'aggiornamento dell\'azienda:', err);
      setError(err.response?.data?.message || 'Errore nell\'aggiornamento dell\'azienda');
    }
  };
  
  // Test invio email
  const handleTestEmail = async () => {
    if (!editingCompany) return;
    
    if (!testEmailDestination) {
      setError('Inserire un indirizzo email per il test');
      return;
    }
    
    setTestingEmail(true);
    setTestResult(null);
    setError(null);
    
    try {
      const response = await axios.post(`/api/companies/${editingCompany.id}/test-email`, {
        destination: testEmailDestination,
        email_mittente: editForm.email_mittente,
        email_password: editForm.email_password,
        email_smtp_server: editForm.email_smtp_server,
        email_smtp_port: editForm.email_smtp_port,
        email_ssl: editForm.email_ssl,
        email_default_oggetto: editForm.email_default_oggetto,
        email_firma: editForm.email_firma
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setTestResult({
        success: true,
        message: 'Email inviata con successo!'
      });
    } catch (err: any) {
      console.error('Errore nell\'invio dell\'email di test:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Errore nell\'invio dell\'email di test';
      const errorDetails = err.response?.data?.details;
      console.error('Dettagli errore test email:', errorDetails);
      
      // Creiamo un messaggio di errore più dettagliato
      let detailMessage = '';
      if (errorDetails) {
        if (errorDetails.code) detailMessage += `Codice: ${errorDetails.code}. `;
        if (errorDetails.command) detailMessage += `Comando: ${errorDetails.command}. `;
        if (errorDetails.response) detailMessage += `Risposta: ${errorDetails.response}. `;
      }
      
      setTestResult({
        success: false,
        message: errorMsg + (detailMessage ? `\nDettagli: ${detailMessage}` : '')
      });
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) return <div>Caricamento...</div>;

  return (
    <div className="admin-companies">
      <h2>Gestione Aziende</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Form per la creazione di nuove aziende */}
      <div className="create-company">
        <h3>Crea Nuova Azienda</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="descrizione">Descrizione</label>
            <input
              type="text"
              id="descrizione"
              value={newCompany.descrizione}
              onChange={(e) => setNewCompany({...newCompany, descrizione: e.target.value})}
              placeholder="Nome azienda"
              maxLength={40}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="codice">Codice (5 caratteri)</label>
            <input
              type="text"
              id="codice"
              value={newCompany.codice}
              onChange={(e) => setNewCompany({...newCompany, codice: e.target.value.toLowerCase()})}
              placeholder="abcd1"
              maxLength={5}
            />
            <small>Il codice deve contenere 5 caratteri alfanumerici minuscoli</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="ultimoidsoggetto">Ultimo ID Soggetto SIAN</label>
            <input
              type="number"
              id="ultimoidsoggetto"
              value={newCompany.ultimoidsoggetto}
              onChange={(e) => setNewCompany({...newCompany, ultimoidsoggetto: parseInt(e.target.value) || 0})}
              min="0"
            />
            <small>Numero progressivo usato per generare gli ID soggetti nel sistema SIAN</small>
          </div>
          
          <button type="submit">Crea Azienda</button>
        </form>
      </div>
      
      {/* Form per la modifica dell'azienda */}
      {editingCompany && (
        <div className="edit-company">
          <h3>Modifica Azienda</h3>
          <form onSubmit={handleUpdateSubmit}>
            <div className="form-section">
              <h4>Informazioni Generali</h4>
              <div className="form-group">
                <label htmlFor="edit-descrizione">Descrizione</label>
                <input
                  type="text"
                  id="edit-descrizione"
                  value={editForm.descrizione}
                  onChange={(e) => setEditForm({...editForm, descrizione: e.target.value})}
                  placeholder="Nome azienda"
                  maxLength={40}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-ultimoidsoggetto">Ultimo ID Soggetto SIAN</label>
                <input
                  type="number"
                  id="edit-ultimoidsoggetto"
                  value={editForm.ultimoidsoggetto}
                  onChange={(e) => setEditForm({...editForm, ultimoidsoggetto: parseInt(e.target.value) || 0})}
                  min="0"
                />
                <small>Numero progressivo usato per generare gli ID soggetti nel sistema SIAN</small>
              </div>
              
              <div className="form-group" style={{ backgroundColor: '#f9f9ff', padding: '15px', borderRadius: '5px', marginBottom: '20px', border: '1px solid #e0e0ff' }}>
                <label htmlFor="edit-coordinate" style={{ fontWeight: 'bold', color: '#3030a0' }}>Coordinate GPS Frantoio</label>
                <input
                  type="text"
                  id="edit-coordinate"
                  value={editForm.coordinate}
                  onChange={(e) => setEditForm({...editForm, coordinate: e.target.value})}
                  maxLength={20}
                  placeholder="es. 41.902782,12.496366"
                  style={{ borderColor: '#a0a0ff' }}
                />
                <small style={{ color: '#5050a0' }}>Inserisci le coordinate geografiche (latitudine,longitudine) per aiutare i clienti a raggiungere il frantoio</small>
              </div>
            </div>
            
            <div className="form-section">
              <h4>Configurazione Email</h4>
              
              <div className="form-group">
                <label htmlFor="edit-email-mittente">Email Mittente</label>
                <input
                  type="email"
                  id="edit-email-mittente"
                  value={editForm.email_mittente}
                  onChange={(e) => setEditForm({...editForm, email_mittente: e.target.value})}
                  maxLength={100}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-email-password">Password</label>
                <input
                  type="password"
                  id="edit-email-password"
                  value={editForm.email_password}
                  onChange={(e) => setEditForm({...editForm, email_password: e.target.value})}
                  maxLength={100}
                />
                <small>Questa password sarà salvata in modo sicuro nel database</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-email-smtp-server">Server SMTP</label>
                <input
                  type="text"
                  id="edit-email-smtp-server"
                  value={editForm.email_smtp_server}
                  onChange={(e) => setEditForm({...editForm, email_smtp_server: e.target.value})}
                  maxLength={100}
                  placeholder="Es. smtp.gmail.com"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="edit-email-smtp-port">Porta SMTP</label>
                  <input
                    type="number"
                    id="edit-email-smtp-port"
                    value={editForm.email_smtp_port}
                    onChange={(e) => setEditForm({...editForm, email_smtp_port: parseInt(e.target.value) || 587})}
                    min="1"
                    max="65535"
                    placeholder="587"
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="edit-email-ssl">Usa SSL/TLS</label>
                  <select
                    id="edit-email-ssl"
                    value={editForm.email_ssl ? "true" : "false"}
                    onChange={(e) => setEditForm({...editForm, email_ssl: e.target.value === "true"})}
                  >
                    <option value="true">Sì</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-email-default-oggetto">Oggetto Email Predefinito</label>
                <input
                  type="text"
                  id="edit-email-default-oggetto"
                  value={editForm.email_default_oggetto}
                  onChange={(e) => setEditForm({...editForm, email_default_oggetto: e.target.value})}
                  maxLength={200}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-email-firma">Firma Email</label>
                <textarea
                  id="edit-email-firma"
                  value={editForm.email_firma}
                  onChange={(e) => setEditForm({...editForm, email_firma: e.target.value})}
                  rows={4}
                  placeholder="Firma automatica da aggiungere in fondo alle email"
                />
              </div>
              
              <div className="email-test-section">
                <h4>Test Invio Email</h4>
                <div className="form-row">
                  <div className="form-group flex-grow">
                    <input
                      type="email"
                      placeholder="Indirizzo email per il test"
                      value={testEmailDestination}
                      onChange={(e) => setTestEmailDestination(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={handleTestEmail}
                      disabled={testingEmail}
                    >
                      {testingEmail ? 'Invio in corso...' : 'Invia Test'}
                    </button>
                  </div>
                </div>
                {testResult && (
                  <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">Salva</button>
              <button type="button" onClick={handleCancelEdit} className="btn-secondary">Annulla</button>
            </div>
          </form>
        </div>
      )}
      
      {/* Lista delle aziende */}
      <div className="companies-list">
        <h3>Aziende ({companies.length})</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descrizione</th>
              <th>Codice</th>
              <th>Ultimo ID SIAN</th>
              <th>Data Creazione</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company.id}>
                <td>{company.id}</td>
                <td>{company.descrizione}</td>
                <td>{company.codice}</td>
                <td>{company.ultimoidsoggetto}</td>
                <td>{new Date(company.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="button-group">
                    <button 
                      onClick={() => handleEditClick(company)}
                      className="btn-edit"
                    >
                      Modifica
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedCompany(company.id);
                        loadCompanyUsers(company.id);
                      }}
                      className="btn-users"
                    >
                      Gestisci Utenti
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={6}>Nessuna azienda trovata</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Sezione per assegnare utenti alle aziende */}
      {selectedCompany && (
        <div className="assign-users">
          <h3>Gestione Utenti per l'Azienda {companies.find(c => c.id === selectedCompany)?.descrizione}</h3>
          
          <div className="assign-user-form">
            <select
              value={selectedUser || ''}
              onChange={(e) => setSelectedUser(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Seleziona Utente</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nome} {user.cognome}
                </option>
              ))}
            </select>
            
            <button onClick={handleAssignUser}>Assegna Utente</button>
          </div>
          
          <h4>Utenti Assegnati</h4>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Cognome</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {companyUsers[selectedCompany]?.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.nome}</td>
                  <td>{user.cognome}</td>
                  <td>
                    <button 
                      onClick={() => handleRemoveUser(selectedCompany, user.id)}
                    >
                      Rimuovi
                    </button>
                  </td>
                </tr>
              ))}
              {(!companyUsers[selectedCompany] || companyUsers[selectedCompany].length === 0) && (
                <tr>
                  <td colSpan={4}>Nessun utente assegnato a questa azienda</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCompanies;