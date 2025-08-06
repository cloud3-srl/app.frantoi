import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Company {
  id: number;
  descrizione: string;
  codice: string;
}

interface CompanySelectorProps {
  onSelectCompany: (companyId: number, companyCode: string, companyDescription?: string) => void;
  userId: number;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ onSelectCompany, userId }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Recupera le aziende dell'utente al caricamento del componente
    const fetchUserCompanies = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/companies/user', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setCompanies(response.data.data);
        
        // Se c'è una sola azienda, selezionala automaticamente
        if (response.data.data.length === 1) {
          const company = response.data.data[0];
          setSelectedCompany(company.id);
          onSelectCompany(company.id, company.codice, company.descrizione);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Errore nel recupero delle aziende dell\'utente:', err);
        setError('Impossibile caricare le aziende. Riprova più tardi.');
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserCompanies();
    }
  }, [userId, onSelectCompany]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = parseInt(e.target.value);
    setSelectedCompany(companyId);
    
    const selectedCompanyData = companies.find(c => c.id === companyId);
    if (selectedCompanyData) {
      onSelectCompany(companyId, selectedCompanyData.codice, selectedCompanyData.descrizione);
    }
  };

  if (loading) return <div>Caricamento aziende...</div>;
  
  if (error) return <div className="error-message">{error}</div>;
  
  if (companies.length === 0) {
    return (
      <div className="company-selector no-companies">
        <p>Non hai accesso ad alcuna azienda. Contatta l'amministratore.</p>
      </div>
    );
  }
  
  return (
    <div className="company-selector">
      <h3>Seleziona Azienda</h3>
      
      <select
        value={selectedCompany || ''}
        onChange={handleCompanyChange}
      >
        <option value="">Seleziona un'azienda</option>
        {companies.map(company => (
          <option key={company.id} value={company.id}>
            {company.descrizione} ({company.codice})
          </option>
        ))}
      </select>
      
      {selectedCompany && (
        <div className="selected-company-info">
          <p>
            Azienda selezionata: <strong>
              {companies.find(c => c.id === selectedCompany)?.descrizione}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default CompanySelector;