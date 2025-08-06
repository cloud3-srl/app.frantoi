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
}

const CompanySettings: React.FC<{ companyId: number }> = ({ companyId }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editedCompany, setEditedCompany] = useState<Partial<Company>>({});
  const [testEmailDestination, setTestEmailDestination] = useState<string>('');
  const [testingEmail, setTestingEmail] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  // Caricamento dei dati dell'azienda
  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/companies/${companyId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const companyData = response.data.data;
        setCompany(companyData);
        setEditedCompany({
          descrizione: companyData.descrizione,
          ultimoidsoggetto: companyData.ultimoidsoggetto,
          coordinate: companyData.coordinate || '',
          email_mittente: companyData.email_mittente || '',
          email_password: companyData.email_password || '',
          email_smtp_server: companyData.email_smtp_server || '',
          email_smtp_port: companyData.email_smtp_port || 587,
          email_ssl: companyData.email_ssl !== undefined ? companyData.email_ssl : true,
          email_default_oggetto: companyData.email_default_oggetto || '',
          email_firma: companyData.email_firma || ''
        });
        setLoading(false);
      } catch (err: any) {
        console.error('Errore nel caricamento dell\'azienda:', err);
        setError(err.response?.data?.message || 'Errore nel caricamento dei dati dell\'azienda');
        setLoading(false);
      }
    };

    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  // Gestione dell'invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editedCompany.descrizione) {
      setError('La descrizione non può essere vuota');
      return;
    }

    try {
      const response = await axios.patch(`/api/companies/${companyId}`, editedCompany, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setCompany(response.data.data);
      setSuccess('Impostazioni azienda aggiornate con successo');
      
      // Resetta il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
      setError(null);
    } catch (err: any) {
      console.error('Errore nell\'aggiornamento dell\'azienda:', err);
      setError(err.response?.data?.message || 'Errore nell\'aggiornamento dell\'azienda');
      setSuccess(null);
    }
  };
  
  // Test invio email
  const handleTestEmail = async () => {
    if (!testEmailDestination) {
      setError('Inserire un indirizzo email per il test');
      return;
    }
    
    setTestingEmail(true);
    setTestResult(null);
    
    try {
      const response = await axios.post(`/api/companies/${companyId}/test-email`, {
        destination: testEmailDestination,
        ...editedCompany
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
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Errore nell\'invio dell\'email di test'
      });
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) return <div>Caricamento...</div>;
  if (!company) return <div>Azienda non trovata</div>;

  return (
    <div className="company-settings">
      <h2>Impostazioni Azienda</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="company-info">
        <div className="info-row">
          <span className="label">ID:</span>
          <span className="value">{company.id}</span>
        </div>
        <div className="info-row">
          <span className="label">Codice:</span>
          <span className="value">{company.codice}</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-section">
          <h3>
            <i className="fa fa-building"></i> Informazioni Azienda
          </h3>
          
          <div className="form-group">
            <label htmlFor="descrizione">Descrizione</label>
            <input
              type="text"
              id="descrizione"
              value={editedCompany.descrizione || ''}
              onChange={(e) => setEditedCompany({...editedCompany, descrizione: e.target.value})}
              maxLength={40}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="ultimoidsoggetto">Ultimo ID Soggetto SIAN</label>
            <input
              type="number"
              id="ultimoidsoggetto"
              value={editedCompany.ultimoidsoggetto || 0}
              onChange={(e) => setEditedCompany({...editedCompany, ultimoidsoggetto: parseInt(e.target.value) || 0})}
              min="0"
            />
            <small>Numero progressivo usato per generare gli ID soggetti nel sistema SIAN</small>
          </div>
          
          <div className="form-group" style={{ backgroundColor: '#f9f9ff', padding: '15px', borderRadius: '5px', marginBottom: '20px', border: '1px solid #e0e0ff' }}>
            <label htmlFor="coordinate" style={{ fontWeight: 'bold', color: '#3030a0' }}>Coordinate GPS Frantoio</label>
            <input
              type="text"
              id="coordinate"
              value={editedCompany.coordinate || ''}
              onChange={(e) => setEditedCompany({...editedCompany, coordinate: e.target.value})}
              maxLength={20}
              placeholder="es. 41.902782,12.496366"
              style={{ borderColor: '#a0a0ff' }}
            />
            <small style={{ color: '#5050a0' }}>Inserisci le coordinate geografiche (latitudine,longitudine) per aiutare i clienti a raggiungere il frantoio</small>
          </div>
        </div>
        
        <div className="form-section">
          <h3>
            <i className="fa fa-envelope"></i> Configurazione Email
          </h3>
          
          <div className="form-group">
            <label htmlFor="email_mittente">Email Mittente</label>
            <input
              type="email"
              id="email_mittente"
              value={editedCompany.email_mittente || ''}
              onChange={(e) => setEditedCompany({...editedCompany, email_mittente: e.target.value})}
              maxLength={100}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email_password">Password</label>
            <input
              type="password"
              id="email_password"
              value={editedCompany.email_password || ''}
              onChange={(e) => setEditedCompany({...editedCompany, email_password: e.target.value})}
              maxLength={100}
            />
            <small>Questa password sarà salvata in modo sicuro nel database</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="email_smtp_server">Server SMTP</label>
            <input
              type="text"
              id="email_smtp_server"
              value={editedCompany.email_smtp_server || ''}
              onChange={(e) => setEditedCompany({...editedCompany, email_smtp_server: e.target.value})}
              maxLength={100}
              placeholder="Es. smtp.gmail.com"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="email_smtp_port">Porta SMTP</label>
              <input
                type="number"
                id="email_smtp_port"
                value={editedCompany.email_smtp_port || 587}
                onChange={(e) => setEditedCompany({...editedCompany, email_smtp_port: parseInt(e.target.value) || 587})}
                min="1"
                max="65535"
                placeholder="587"
              />
            </div>
            
            <div className="form-group half">
              <label htmlFor="email_ssl">Usa SSL/TLS</label>
              <select
                id="email_ssl"
                value={editedCompany.email_ssl ? "true" : "false"}
                onChange={(e) => setEditedCompany({...editedCompany, email_ssl: e.target.value === "true"})}
              >
                <option value="true">Sì</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email_default_oggetto">Oggetto Email Predefinito</label>
            <input
              type="text"
              id="email_default_oggetto"
              value={editedCompany.email_default_oggetto || ''}
              onChange={(e) => setEditedCompany({...editedCompany, email_default_oggetto: e.target.value})}
              maxLength={200}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email_firma">Firma Email</label>
            <textarea
              id="email_firma"
              value={editedCompany.email_firma || ''}
              onChange={(e) => setEditedCompany({...editedCompany, email_firma: e.target.value})}
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
          <button type="submit" className="btn-primary">Salva Modifiche</button>
        </div>
      </form>
    </div>
  );
};

export default CompanySettings;