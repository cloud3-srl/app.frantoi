import React, { useState } from 'react';
import axios from 'axios';

interface InitializeCompanyTablesProps {
  companyId?: number;
  companyCode?: string;
}

const InitializeCompanyTables: React.FC<InitializeCompanyTablesProps> = ({ companyId, companyCode }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const initializeTables = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setLogMessages(['Avvio inizializzazione tabelle...']);

      if (!companyId || !companyCode) {
        throw new Error('ID azienda o codice azienda mancante.');
      }

      setLogMessages(prev => [...prev, `Inizializzazione tabelle per azienda ${companyId} (${companyCode})...`]);

      // API call per creare le tabelle aziendali
      const response = await axios.post(`/api/admin/initialize-company-tables/${companyId}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccess(`Tabelle aziendali inizializzate con successo per ${companyCode}`);
        setLogMessages(prev => [
          ...prev, 
          'Tabelle create con successo:', 
          ...response.data.tables.map((t: string) => `- ${t} creata`)
        ]);
      } else {
        throw new Error(response.data.message || 'Errore durante l\'inizializzazione delle tabelle');
      }
    } catch (err: any) {
      console.error('Errore durante l\'inizializzazione delle tabelle:', err);
      
      if (err.response) {
        setError(err.response.data?.message || `Errore del server (${err.response.status})`);
        setLogMessages(prev => [
          ...prev, 
          `Errore: ${err.response.data?.message || `Errore del server (${err.response.status})`}`,
          err.response.data?.error || ''
        ]);
      } else if (err.request) {
        setError('Nessuna risposta dal server. Verificare la connessione.');
        setLogMessages(prev => [...prev, 'Errore: Nessuna risposta dal server']);
      } else {
        setError(err.message || 'Errore imprevisto durante l\'inizializzazione');
        setLogMessages(prev => [...prev, `Errore: ${err.message}`]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="initialize-tables-component">
      <div className="card">
        <div className="card-header bg-warning">
          <h3>
            <i className="fas fa-database"></i> Inizializzazione Tabelle Azienda
          </h3>
        </div>
        <div className="card-body">
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle"></i> Questa operazione inizializzerà tutte le tabelle necessarie per l'azienda {companyCode} (ID: {companyId}).
            <br />
            <strong>Nota:</strong> Se le tabelle esistono già, questa operazione non avrà effetto.
          </div>
          
          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              <i className="fas fa-check-circle"></i> {success}
            </div>
          )}
          
          <div className="form-group mt-3">
            <button 
              className="btn btn-warning" 
              onClick={initializeTables}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Inizializzazione in corso...
                </>
              ) : (
                <>
                  <i className="fas fa-database"></i> Inizializza Tabelle
                </>
              )}
            </button>
          </div>
          
          {logMessages.length > 0 && (
            <div className="log-container mt-4">
              <h5>Log operazioni:</h5>
              <div className="log-messages p-2 bg-light border rounded">
                {logMessages.map((message, index) => (
                  <div key={index} className="log-message">
                    {message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InitializeCompanyTables;