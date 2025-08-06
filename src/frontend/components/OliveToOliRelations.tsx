import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface OliveToOliRelationsProps {
  onBack?: () => void;
}

interface ArticoloOption {
  id: number;
  tipologia: string;
  descrizione: string;
  unita_misura: string;
}

const OliveToOliRelations: React.FC<OliveToOliRelationsProps> = ({ onBack }) => {
  const [relations, setRelations] = useState<any[]>([]);
  const [filteredRelations, setFilteredRelations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRelation, setEditingRelation] = useState<any | null>(null);
  const [newRelation, setNewRelation] = useState<any>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [oliveOptions, setOliveOptions] = useState<ArticoloOption[]>([]);
  const [olioOptions, setOlioOptions] = useState<ArticoloOption[]>([]);
  const editFormRef = React.useRef<HTMLDivElement>(null);

  // Caricamento degli articoli di tipo oliva e olio
  useEffect(() => {
    const loadArticoli = async () => {
      try {
        const response = await axios.get('/api/tables/articoli', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          const articoli = response.data.data;
          
          // Filtra gli articoli in base alla tipologia
          const oliveArticoli = articoli.filter((a: any) => a.tipologia === 'OL');
          const olioArticoli = articoli.filter((a: any) => a.tipologia === 'SF');
          
          setOliveOptions(oliveArticoli);
          setOlioOptions(olioArticoli);
        } else {
          setError('Errore nel caricamento degli articoli');
        }
      } catch (error: any) {
        console.error('Errore nel caricamento degli articoli:', error);
        setError('Errore nel caricamento degli articoli: ' + (error.response?.data?.message || error.message));
      }
    };
    
    loadArticoli();
  }, []);
  
  // Caricamento delle relazioni olive-olio
  useEffect(() => {
    fetchData();
  }, []);
  
  // Funzione per recuperare i dati delle relazioni
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/tables/olive_to_oli', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        setRelations(data);
        setFilteredRelations(data);
      } else {
        setError(response.data.message || 'Errore nel recupero delle relazioni');
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Errore nel caricamento delle relazioni olive-olio:', err);
      setError(err.response?.data?.message || 'Errore nel caricamento delle relazioni');
      setLoading(false);
    }
  };
  
  // Filtra le relazioni in base al termine di ricerca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRelations(relations);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = relations.filter(relation => {
      const oliveDesc = relation.olive?.descrizione?.toLowerCase() || '';
      const olioDesc = relation.olio?.descrizione?.toLowerCase() || '';
      
      return oliveDesc.includes(searchTermLower) || 
             olioDesc.includes(searchTermLower) ||
             String(relation.id).includes(searchTermLower);
    });
    
    setFilteredRelations(filtered);
  }, [searchTerm, relations]);
  
  // Scroll al form di modifica quando viene aperto
  useEffect(() => {
    if (editingRelation && editFormRef.current) {
      setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [editingRelation]);

  // Gestione della creazione di una nuova relazione
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Verifica che i campi obbligatori siano presenti
      if (!newRelation.cod_olive || !newRelation.cod_olio) {
        setError('Devi selezionare sia un\'oliva che un olio');
        return;
      }
      
      const dataToSend = {
        ...newRelation,
        // Se flag_default non è impostato, lo impostiamo a false
        flag_default: newRelation.flag_default || false
      };
      
      const response = await axios.post('/api/tables/olive_to_oli', dataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Aggiorna la lista delle relazioni
        await fetchData();
        
        // Reset del form
        setNewRelation({});
        setShowNewForm(false);
        setError(null);
      } else {
        setError(response.data.message || 'Errore nella creazione della relazione');
      }
    } catch (err: any) {
      console.error('Errore nella creazione della relazione:', err);
      
      // Mostra più dettagli sull'errore
      if (err.response?.data?.error) {
        setError(`Errore: ${err.response.data.error}`);
      } else {
        setError(err.response?.data?.message || 'Errore nella creazione della relazione');
      }
    }
  };
  
  // Gestione dell'aggiornamento di una relazione
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRelation) return;
    
    try {
      // Verifica che i campi obbligatori siano presenti
      if (!editingRelation.cod_olive || !editingRelation.cod_olio) {
        setError('Devi selezionare sia un\'oliva che un olio');
        return;
      }
      
      // Rimuoviamo i campi derivati dalla relazione che non sono parte del modello
      const { olive, olio, ...dataToSend } = editingRelation;
      
      const response = await axios.put(`/api/tables/olive_to_oli/${dataToSend.id}`, dataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Aggiorna la lista delle relazioni
        await fetchData();
        
        // Reset del form di modifica
        setEditingRelation(null);
        setError(null);
      } else {
        setError(response.data.message || 'Errore nell\'aggiornamento della relazione');
      }
    } catch (err: any) {
      console.error('Errore nell\'aggiornamento della relazione:', err);
      
      // Mostra più dettagli sull'errore
      if (err.response?.data?.error) {
        setError(`Errore: ${err.response.data.error}`);
      } else {
        setError(err.response?.data?.message || 'Errore nell\'aggiornamento della relazione');
      }
    }
  };
  
  // Gestione dell'eliminazione di una relazione
  const handleDelete = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa relazione?')) return;
    
    try {
      const response = await axios.delete(`/api/tables/olive_to_oli/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Aggiorna la lista delle relazioni
        await fetchData();
        setError(null);
      } else {
        setError(response.data.message || 'Errore nell\'eliminazione della relazione');
      }
    } catch (err: any) {
      console.error('Errore nell\'eliminazione della relazione:', err);
      setError(err.response?.data?.message || 'Errore nell\'eliminazione della relazione');
    }
  };
  
  // Gestione dell'input nei form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, isNew: boolean = false) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    let inputValue: any = value;
    
    // Gestione di diversi tipi di input
    if (type === 'checkbox') {
      inputValue = checked;
    } else if (name === 'cod_olive' || name === 'cod_olio') {
      inputValue = value ? parseInt(value) : null;
      
      // Se l'utente cambia l'oliva, verifichiamo se dobbiamo aggiornare la selezione predefinita
      if (name === 'cod_olive' && value) {
        // In caso di una nuova relazione, resettiamo il flag_default per sicurezza
        if (isNew) {
          setNewRelation((prev: any) => ({
            ...prev,
            [name]: inputValue,
            flag_default: false // Reset il flag predefinito quando si cambia oliva
          }));
          return; // Interrompiamo qui per evitare il doppio aggiornamento
        }
      }
    }
    
    // Registra il nuovo valore nell'oggetto di stato appropriato
    if (isNew) {
      setNewRelation((prev: any) => ({
        ...prev,
        [name]: inputValue
      }));
    } else {
      setEditingRelation((prev: any) => ({
        ...prev,
        [name]: inputValue
      }));
    }
  };
  
  // Renderizza un form per la relazione olive-to-oli
  const renderRelationForm = (isNew: boolean, formData: any, onSubmit: (e: React.FormEvent) => void, onCancel: () => void) => {
    const title = isNew ? 'Nuova Relazione Olive-Olio' : 'Modifica Relazione';
    const submitLabel = isNew ? 'Crea' : 'Salva';
    const idPrefix = isNew ? 'new' : 'edit';
    
    return (
      <div className={isNew ? "new-form" : "edit-form"} ref={isNew ? null : editFormRef}>
        <h3>{title}</h3>
        <form onSubmit={onSubmit}>
          {/* Selezione Olive */}
          <div className="field-section">
            <div className="field-section-title">Selezione Articoli</div>
            <div className="two-columns">
              <div className="form-group">
                <label htmlFor={`${idPrefix}-cod_olive`}>Olive</label>
                <select
                  id={`${idPrefix}-cod_olive`}
                  name="cod_olive"
                  value={formData.cod_olive || ''}
                  onChange={(e) => handleInputChange(e, isNew)}
                  required
                >
                  <option value="">Seleziona un'oliva...</option>
                  {oliveOptions.map(olive => (
                    <option key={olive.id} value={olive.id}>
                      {olive.descrizione} ({olive.unita_misura})
                    </option>
                  ))}
                </select>
                <div className="field-description">Seleziona l'articolo di tipo oliva</div>
              </div>
              
              <div className="form-group">
                <label htmlFor={`${idPrefix}-cod_olio`}>Olio</label>
                <select
                  id={`${idPrefix}-cod_olio`}
                  name="cod_olio"
                  value={formData.cod_olio || ''}
                  onChange={(e) => handleInputChange(e, isNew)}
                  required
                >
                  <option value="">Seleziona un olio...</option>
                  {olioOptions.map(olio => (
                    <option key={olio.id} value={olio.id}>
                      {olio.descrizione} ({olio.unita_misura})
                    </option>
                  ))}
                </select>
                <div className="field-description">Seleziona l'articolo di tipo olio che si produce da queste olive</div>
              </div>
            </div>
          </div>
          
          {/* Flag Default */}
          <div className="field-section">
            <div className="field-section-title">Impostazioni</div>
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id={`${idPrefix}-flag_default`}
                  name="flag_default"
                  checked={!!formData.flag_default}
                  onChange={(e) => handleInputChange(e, isNew)}
                  style={{ width: 'auto', marginRight: '10px' }}
                />
                <label htmlFor={`${idPrefix}-flag_default`}>Relazione Predefinita</label>
              </div>
              <div className="field-description">
                Indica se questa è la relazione predefinita per queste olive. Utile quando un tipo di oliva può produrre diversi tipi di olio.
              </div>
              <div className="field-warning">
                <i className="fas fa-exclamation-triangle"></i> Nota: Può esistere una sola relazione predefinita per ciascun tipo di oliva. Impostando questa come predefinita, eventuali altre relazioni predefinite per la stessa oliva dovranno essere disattivate.
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="primary-button">{submitLabel}</button>
            <button type="button" className="btn-secondary" onClick={onCancel}>Annulla</button>
          </div>
        </form>
      </div>
    );
  };
  
  // Rendering del form di modifica
  const renderEditForm = () => {
    if (!editingRelation) return null;
    return renderRelationForm(false, editingRelation, handleUpdate, () => setEditingRelation(null));
  };
  
  // Rendering del form per nuova relazione
  const renderNewForm = () => {
    if (!showNewForm) return null;
    return renderRelationForm(true, newRelation, handleCreate, () => setShowNewForm(false));
  };

  if (loading) return <div className="loading">Caricamento relazioni olive-olio...</div>;

  return (
    <div className="generic-table">
      <div className="header">
        {onBack && (
          <button onClick={onBack} className="btn-secondary back-button">
            <i className="fas fa-arrow-left"></i> Indietro
          </button>
        )}
        <h2>Gestione Relazioni Olive-Olio</h2>
        <button 
          onClick={() => setShowNewForm(true)}
          className="primary-button new-relation-button"
        >
          <i className="fas fa-plus"></i> Nuova Relazione
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="toolbox">
        <div className="search-bar">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Cerca relazioni..."
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
            {searchTerm && `${filteredRelations.length} risultati`}
          </div>
        </div>
        <div className="table-info">
          <div className="total-count">
            <i className="fas fa-link"></i> Relazioni totali: <strong>{relations.length}</strong>
          </div>
        </div>
      </div>
      
      {renderNewForm()}
      {renderEditForm()}
      
      <div className="records-list">
        <table>
          <thead>
            <tr>
              <th style={{ width: '60px' }}>ID</th>
              <th>Oliva</th>
              <th>Olio Prodotto</th>
              <th style={{ width: '120px' }}>Predefinita</th>
              <th style={{ width: '180px' }}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredRelations.map(relation => (
              <tr key={relation.id}>
                <td>{relation.id}</td>
                <td>
                  {relation.olive ? (
                    <div>
                      <div><strong>{relation.olive.descrizione}</strong></div>
                      <div className="relation-detail">
                        {relation.olive.categoria?.descrizione}
                        {relation.olive.area?.descrizione && ` - ${relation.olive.area.descrizione}`}
                      </div>
                    </div>
                  ) : (
                    <span className="missing-value">Oliva non trovata (ID: {relation.cod_olive})</span>
                  )}
                </td>
                <td>
                  {relation.olio ? (
                    <div>
                      <div><strong>{relation.olio.descrizione}</strong></div>
                      <div className="relation-detail">
                        {relation.olio.categoria?.descrizione}
                        {relation.olio.area?.descrizione && ` - ${relation.olio.area.descrizione}`}
                      </div>
                    </div>
                  ) : (
                    <span className="missing-value">Olio non trovato (ID: {relation.cod_olio})</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {relation.flag_default ? (
                    <span className="default-badge">
                      <i className="fas fa-check-circle"></i> Si
                    </span>
                  ) : (
                    <span className="text-muted">No</span>
                  )}
                </td>
                <td className="actions">
                  <div className="action-buttons">
                    <button 
                      onClick={() => setEditingRelation(relation)}
                      className="btn-edit"
                      title="Modifica relazione"
                    >
                      <i className="fas fa-edit"></i> Modifica
                    </button>
                    <button 
                      onClick={() => handleDelete(relation.id)}
                      className="btn-delete"
                      title="Elimina relazione"
                    >
                      <i className="fas fa-trash-alt"></i> Elimina
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRelations.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--light-text)' }}>
                    {searchTerm 
                      ? 'Nessun risultato corrisponde alla ricerca'
                      : 'Nessuna relazione olive-olio trovata'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="help-section">
        <h3>Informazioni sulle Relazioni Olive-Olio</h3>
        <p>Queste relazioni definiscono quali tipi di olio possono essere prodotti da quali tipi di olive. Una relazione "predefinita" sarà proposta automaticamente durante la lavorazione delle olive.</p>
        <div className="tips">
          <div className="tip">
            <i className="fas fa-info-circle"></i>
            <div>
              <strong>Suggerimento:</strong> Assicurati di creare relazioni per tutte le olive che vengono lavorate.
            </div>
          </div>
          <div className="tip">
            <i className="fas fa-info-circle"></i>
            <div>
              <strong>Suggerimento:</strong> Puoi definire più tipi di olio prodotti da uno stesso tipo di oliva. In questo caso, usa il flag "Predefinita" per indicare la produzione più comune.
            </div>
          </div>
          <div className="tip highlight">
            <i className="fas fa-exclamation-circle"></i>
            <div>
              <strong>Importante:</strong> Può esistere una sola relazione predefinita per ciascun tipo di oliva. Questo garantisce che durante la lavorazione delle olive, il sistema proponga sempre lo stesso tipo di olio, evitando ambiguità.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OliveToOliRelations;