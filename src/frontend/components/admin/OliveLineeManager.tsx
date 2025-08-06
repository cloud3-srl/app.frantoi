import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface OliveLineeManagerProps {
  companyId?: number;
  companyCode?: string;
}

interface TipoOliva {
  id: number;
  descrizione: string;
}

interface Linea {
  id: number;
  descrizione: string;
  cap_oraria: number;
}

interface OlivaLineaRelazione {
  id: number;
  id_oliva: number;
  id_linea: number;
  priorita: number;
  olive_descrizione?: string;
  linea_descrizione?: string;
}

const OliveLineeManager: React.FC<OliveLineeManagerProps> = ({ companyId, companyCode }) => {
  const [relazioni, setRelazioni] = useState<OlivaLineaRelazione[]>([]);
  const [tipiOlive, setTipiOlive] = useState<TipoOliva[]>([]);
  const [linee, setLinee] = useState<Linea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Nuova relazione
  const [nuovaRelazione, setNuovaRelazione] = useState({
    id_oliva: 0,
    id_linea: 0,
    priorita: 1
  });

  // Carica i dati
  useEffect(() => {
    if (!companyId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setMessage(null);
      
      try {
        // Carica le relazioni esistenti
        const relazioniResponse = await axios.get(`/api/company/${companyId}/olive-linee`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (relazioniResponse.data.success) {
          setRelazioni(relazioniResponse.data.data || []);
        }
        
        // Carica i tipi di olive (articoli di tipo OL)
        const oliveResponse = await axios.get('/api/tables/articoli', {
          params: { where: JSON.stringify({ tipologia: 'OL' }) },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (oliveResponse.data.success) {
          setTipiOlive(oliveResponse.data.data || []);
        }
        
        // Carica le linee di lavorazione
        const lineeResponse = await axios.get(`/api/company/${companyId}/tables/linee`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (lineeResponse.data.success) {
          setLinee(lineeResponse.data.data || []);
        }
      } catch (error: any) {
        console.error('Errore nel caricamento dei dati:', error);
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Errore nel caricamento dei dati'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [companyId]);
  
  // Gestisce i cambiamenti nel form
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setNuovaRelazione(prev => ({
      ...prev,
      [name]: name === 'priorita' ? parseInt(value) : parseInt(value)
    }));
  };
  
  // Aggiungi una nuova relazione
  const handleAddRelazione = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) return;
    if (nuovaRelazione.id_oliva === 0 || nuovaRelazione.id_linea === 0) {
      setMessage({
        type: 'error',
        text: 'Seleziona un tipo di oliva e una linea di lavorazione'
      });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      console.log('Invio relazione:', { companyId, nuovaRelazione });
      
      const response = await axios.post(`/api/company/${companyId}/olive-linee`, nuovaRelazione, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      console.log('Risposta server:', response.data);
      
      if (response.data.success) {
        // Aggiorna l'elenco delle relazioni
        const relazioniResponse = await axios.get(`/api/company/${companyId}/olive-linee`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (relazioniResponse.data.success) {
          setRelazioni(relazioniResponse.data.data || []);
        }
        
        // Resetta il form
        setNuovaRelazione({
          id_oliva: 0,
          id_linea: 0,
          priorita: 1
        });
        
        setMessage({
          type: 'success',
          text: response.data.updated 
            ? 'Relazione aggiornata con successo' 
            : 'Relazione creata con successo'
        });
      } else {
        console.error('Errore dal server:', response.data);
        setMessage({
          type: 'error',
          text: response.data.message || 'Errore nella creazione della relazione'
        });
      }
    } catch (error: any) {
      console.error('Errore nella creazione della relazione:', error);
      console.error('Dettagli errore:', error.response?.data);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Errore nella creazione della relazione oliva-linea. Controlla che la tabella xxxxx_olive_linee esista.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Elimina una relazione
  const handleDeleteRelazione = async (id: number) => {
    if (!companyId) return;
    
    if (!window.confirm('Sei sicuro di voler eliminare questa relazione?')) {
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await axios.delete(`/api/company/${companyId}/olive-linee/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        // Rimuovi la relazione dall'elenco
        setRelazioni(prev => prev.filter(rel => rel.id !== id));
        
        setMessage({
          type: 'success',
          text: 'Relazione eliminata con successo'
        });
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Errore nell\'eliminazione della relazione'
        });
      }
    } catch (error: any) {
      console.error('Errore nell\'eliminazione della relazione:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Errore nell\'eliminazione della relazione'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="admin-tool-card">
      <div className="tool-header">
        <h3><i className="fas fa-link"></i> Gestione Relazioni Olive-Linee</h3>
      </div>
      <div className="tool-content">
        <p>Gestisci le relazioni tra tipi di olive e linee di lavorazione. Queste relazioni verranno utilizzate per suggerire automaticamente la linea più adatta in base al tipo di oliva selezionato durante la prenotazione.</p>
        
        {message && (
          <div className={`message ${message.type === 'success' ? 'success-message' : 'error-message'}`}>
            {message.text}
          </div>
        )}
        
        {/* Form per aggiungere una nuova relazione */}
        <form onSubmit={handleAddRelazione} className="olive-linee-form">
          <div className="form-row">
            <div className="form-group">
              <label>Tipo di Oliva:</label>
              <select 
                name="id_oliva" 
                value={nuovaRelazione.id_oliva} 
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value={0}>Seleziona tipo di oliva</option>
                {tipiOlive.map(oliva => (
                  <option key={oliva.id} value={oliva.id}>
                    {oliva.descrizione}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Linea di Lavorazione:</label>
              <select 
                name="id_linea" 
                value={nuovaRelazione.id_linea} 
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value={0}>Seleziona linea</option>
                {linee.map(linea => (
                  <option key={linea.id} value={linea.id}>
                    {linea.descrizione} (Capacità: {linea.cap_oraria} kg/ora)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Priorità:</label>
              <input 
                type="number" 
                name="priorita" 
                value={nuovaRelazione.priorita} 
                onChange={handleChange}
                min="1"
                max="10"
                disabled={isLoading}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Elaborazione...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i> Aggiungi
                </>
              )}
            </button>
          </div>
        </form>
        
        {/* Tabella delle relazioni esistenti */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo di Oliva</th>
                <th>Linea di Lavorazione</th>
                <th>Priorità</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {relazioni.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center">
                    {isLoading 
                      ? 'Caricamento...' 
                      : 'Nessuna relazione trovata. Aggiungi una nuova relazione utilizzando il form sopra.'}
                  </td>
                </tr>
              ) : (
                relazioni.map(relazione => (
                  <tr key={relazione.id}>
                    <td>{relazione.olive_descrizione || `Oliva ID ${relazione.id_oliva}`}</td>
                    <td>{relazione.linea_descrizione || `Linea ID ${relazione.id_linea}`}</td>
                    <td>{relazione.priorita}</td>
                    <td>
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => handleDeleteRelazione(relazione.id)}
                        disabled={isLoading}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OliveLineeManager;