import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface GenericTableProps {
  tableName: string;
}

interface Field {
  name: string;
  label: string;
  type: string;
  maxLength?: number;
}

const GenericTable: React.FC<GenericTableProps> = ({ tableName }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [newRecord, setNewRecord] = useState<any>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const editFormRef = React.useRef<HTMLDivElement>(null);
  
  // Funzione per ottenere la struttura dei campi in base alla tabella
  const getFieldsForTable = () => {
    switch(tableName) {
      case 'categorie_olio':
        return [
          { name: 'acronimo', label: 'Acronimo', type: 'text', maxLength: 3 },
          { name: 'descrizione', label: 'Descrizione', type: 'text', maxLength: 200 }
        ];
      case 'macroaree':
        return [
          { name: 'acronimo', label: 'Acronimo', type: 'text', maxLength: 5 },
          { name: 'descrizione', label: 'Descrizione', type: 'text', maxLength: 200 },
          { name: 'flag_orig', label: 'Flag Origine', type: 'checkbox' }
        ];
      case 'origini_specifiche':
        return [
          { name: 'acronimo', label: 'Acronimo', type: 'text', maxLength: 3 },
          { name: 'descrizione', label: 'Descrizione', type: 'text', maxLength: 200 },
          { name: 'flag_dop', label: 'Flag DOP', type: 'checkbox' },
          { name: 'flag_raccolta', label: 'Flag Raccolta', type: 'checkbox' },
          { name: 'flag_molitura', label: 'Flag Molitura', type: 'checkbox' },
          { name: 'flag_annata', label: 'Flag Annata', type: 'checkbox' },
          { name: 'flag_colla_da', label: 'Flag Colla Da', type: 'checkbox' },
          { name: 'flag_colla_a', label: 'Flag Colla A', type: 'checkbox' },
          { name: 'flag_capacita', label: 'Flag Capacità', type: 'checkbox' },
          { name: 'flag_certifi', label: 'Flag Certificazione', type: 'checkbox' }
        ];
      case 'nazioni':
        return [
          { name: 'cod_nazione', label: 'Codice Nazione', type: 'text', maxLength: 3 },
          { name: 'descrizione', label: 'Descrizione', type: 'text', maxLength: 60 },
          { name: 'cod_istat', label: 'Codice ISTAT', type: 'text', maxLength: 3 }
        ];
      case 'province':
        return [
          { name: 'descrizione', label: 'Descrizione', type: 'text', maxLength: 60 },
          { name: 'targa', label: 'Sigla Provincia', type: 'text', maxLength: 2 }
        ];
      case 'comuni':
        return [
          { name: 'descrizione', label: 'Nome Comune', type: 'text', maxLength: 60 },
          { name: 'cod_istat', label: 'Codice ISTAT', type: 'number' },
          { name: 'cod_cf', label: 'Codice Catastale', type: 'text', maxLength: 4 }
        ];
      case 'codici_iva':
        return [
          { name: 'id', label: 'Codice', type: 'number' },
          { name: 'percen', label: 'Percentuale', type: 'number' }
        ];
      default:
        return [];
    }
  };
  
  const fields = getFieldsForTable();
  
  // Caricamento dati iniziale
  useEffect(() => {
    fetchData();
  }, [tableName]);
  
  // Funzione per recuperare i dati
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/tables/${tableName}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setRecords(response.data.data);
      setFilteredRecords(response.data.data);
      setLoading(false);
    } catch (err: any) {
      console.error(`Errore nel caricamento della tabella ${tableName}:`, err);
      setError(err.response?.data?.message || `Errore nel caricamento della tabella ${tableName}`);
      setLoading(false);
    }
  };
  
  // Filtra i record in base al termine di ricerca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecords(records);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = records.filter(record => {
      // Cerca in tutti i campi del record
      return Object.keys(record).some(key => {
        const value = record[key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTermLower);
      });
    });
    
    setFilteredRecords(filtered);
  }, [searchTerm, records]);
  
  // Scroll al form di modifica quando viene aperto
  useEffect(() => {
    if (editingRecord && editFormRef.current) {
      // Aggiungi un piccolo ritardo per assicurarti che il form sia renderizzato
      setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [editingRecord]);
  
  // Gestione della creazione di un nuovo record
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/api/tables/${tableName}`, newRecord, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Aggiorna la lista dei record
      await fetchData();
      
      // Reset del form
      setNewRecord({});
      setShowNewForm(false);
      setError(null);
    } catch (err: any) {
      console.error(`Errore nella creazione del record in ${tableName}:`, err);
      setError(err.response?.data?.message || `Errore nella creazione del record`);
    }
  };
  
  // Gestione dell'aggiornamento di un record
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    try {
      await axios.put(`/api/tables/${tableName}/${editingRecord.id}`, editingRecord, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Aggiorna la lista dei record
      await fetchData();
      
      // Reset del form di modifica
      setEditingRecord(null);
      setError(null);
    } catch (err: any) {
      console.error(`Errore nell'aggiornamento del record in ${tableName}:`, err);
      setError(err.response?.data?.message || `Errore nell'aggiornamento del record`);
    }
  };
  
  // Gestione dell'eliminazione di un record
  const handleDelete = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo record?')) return;
    
    try {
      await axios.delete(`/api/tables/${tableName}/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Aggiorna la lista dei record
      await fetchData();
      setError(null);
    } catch (err: any) {
      console.error(`Errore nell'eliminazione del record da ${tableName}:`, err);
      setError(err.response?.data?.message || `Errore nell'eliminazione del record`);
    }
  };
  
  // Gestione dell'input nei form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean = false) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    
    if (isNew) {
      setNewRecord((prev: any) => ({
        ...prev,
        [name]: type === 'number' ? (value ? parseInt(value) : null) : inputValue
      }));
    } else {
      setEditingRecord((prev: any) => ({
        ...prev!,
        [name]: type === 'number' ? (value ? parseInt(value) : null) : inputValue
      }));
    }
  };
  
  // Rendering del form di modifica
  const renderEditForm = () => {
    if (!editingRecord) return null;
    
    return (
      <div className="edit-form" ref={editFormRef}>
        <h3>Modifica Record</h3>
        <form onSubmit={handleUpdate}>
          {fields.map(field => (
            <div className="form-group" key={field.name}>
              <label htmlFor={`edit-${field.name}`}>{field.label}</label>
              {field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  id={`edit-${field.name}`}
                  name={field.name}
                  checked={!!editingRecord[field.name]}
                  onChange={e => handleInputChange(e)}
                />
              ) : (
                <input
                  type={field.type}
                  id={`edit-${field.name}`}
                  name={field.name}
                  value={editingRecord[field.name] || ''}
                  onChange={e => handleInputChange(e)}
                  maxLength={field.maxLength}
                />
              )}
            </div>
          ))}
          
          <div className="form-actions">
            <button type="submit" className="primary-button">Salva</button>
            <button type="button" className="btn-secondary" onClick={() => setEditingRecord(null)}>Annulla</button>
          </div>
        </form>
      </div>
    );
  };
  
  // Rendering del form per nuovo record
  const renderNewForm = () => {
    if (!showNewForm) return null;
    
    return (
      <div className="new-form">
        <h3>Nuovo Record</h3>
        <form onSubmit={handleCreate}>
          {fields.map(field => (
            <div className="form-group" key={field.name}>
              <label htmlFor={`new-${field.name}`}>{field.label}</label>
              {field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  id={`new-${field.name}`}
                  name={field.name}
                  checked={!!newRecord[field.name]}
                  onChange={e => handleInputChange(e, true)}
                />
              ) : (
                <input
                  type={field.type}
                  id={`new-${field.name}`}
                  name={field.name}
                  value={newRecord[field.name] || ''}
                  onChange={e => handleInputChange(e, true)}
                  maxLength={field.maxLength}
                />
              )}
            </div>
          ))}
          
          <div className="form-actions">
            <button type="submit" className="primary-button">Crea</button>
            <button type="button" className="btn-secondary" onClick={() => setShowNewForm(false)}>Annulla</button>
          </div>
        </form>
      </div>
    );
  };
  
  if (loading) return <div>Caricamento...</div>;
  
  // Funzione per ottenere il nome leggibile della tabella
  const getTableLabel = () => {
    switch(tableName) {
      case 'categorie_olio': return 'Categorie Olio';
      case 'macroaree': return 'Macroaree';
      case 'origini_specifiche': return 'Origini Specifiche';
      case 'nazioni': return 'Nazioni';
      case 'province': return 'Province';
      case 'comuni': return 'Comuni';
      case 'codici_iva': return 'Codici IVA';
      default: return tableName;
    }
  };
  
  return (
    <div className="generic-table">
      <div className="header">
        <button onClick={() => window.location.href = '/admin/tables'} className="btn-secondary">
          <i className="fas fa-arrow-left"></i> Indietro
        </button>
        <h2>Gestione {getTableLabel()}</h2>
        <button 
          onClick={() => setShowNewForm(true)}
          className="primary-button"
        >
          <i className="fas fa-plus"></i> Nuovo
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Cerca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="clear-search"
          >
            ✕
          </button>
        )}
        <div className="search-results">
          {searchTerm && `${filteredRecords.length} risultati`}
        </div>
      </div>
      
      {renderNewForm()}
      {renderEditForm()}
      
      <div className="records-list">
        <table>
          <thead>
            <tr>
              <th style={{ width: '60px' }}>ID</th>
              {fields.map(field => (
                <th key={field.name}>{field.label}</th>
              ))}
              <th style={{ width: '120px' }}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(record => (
              <tr key={record.id}>
                <td>{record.id}</td>
                {fields.map(field => (
                  <td key={field.name}>
                    {field.type === 'checkbox' 
                      ? record[field.name] ? '✓' : '−'
                      : record[field.name]}
                  </td>
                ))}
                <td className="actions">
                  <button 
                    onClick={() => setEditingRecord(record)}
                    className="btn-secondary"
                  >
                    Modifica
                  </button>
                  <button 
                    onClick={() => handleDelete(record.id)}
                    style={{ backgroundColor: '#d32f2f' }}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={fields.length + 2}>
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--light-text)' }}>
                    {searchTerm 
                      ? 'Nessun risultato corrisponde alla ricerca'
                      : 'Nessun record trovato'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GenericTable;