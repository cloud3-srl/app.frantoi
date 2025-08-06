import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CompanyTable from './CompanyTable';

interface CompanyTablesProps {
  companyId: number;
  companyCode: string;
  initialTable?: string;
}

interface TableDefinition {
  name: string;
  label: string;
  description: string;
}

const CompanyTables: React.FC<CompanyTablesProps> = ({ companyId, companyCode, initialTable }) => {
  const [tables, setTables] = useState<TableDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTable, setActiveTable] = useState<string | null>(initialTable || null);

  // Carica le tabelle disponibili per l'azienda
  useEffect(() => {
    if (!companyId || !companyCode) return;

    // Le tabelle sono fisse per ogni azienda
    setTables([
      { name: 'cisterne', label: 'Cisterne', description: 'Gestione cisterne dell\'azienda' },
      { name: 'magazzini', label: 'Magazzini', description: 'Gestione magazzini dell\'azienda' },
      { name: 'soggetti', label: 'Soggetti', description: 'Gestione soggetti dell\'azienda (clienti, fornitori, etc.)' },
      { name: 'terreni', label: 'Terreni', description: 'Gestione terreni dell\'azienda' },
      { name: 'movimenti', label: 'Movimentazione', description: 'Registro movimentazione olio' },
      { name: 'listini', label: 'Listini Prezzi', description: 'Gestione listini prezzi dell\'azienda' },
      { name: 'linee', label: 'Linee di Lavorazione', description: 'Gestione linee di lavorazione dell\'azienda' },
      { name: 'olive_linee', label: 'Relazioni Olive-Linee', description: 'Gestione relazioni tra tipi di olive e linee di lavorazione' },
      // Nota: articoli è una tabella comune e dovrebbe essere gestita tramite le rotte /tables/
    ]);
    setLoading(false);
  }, [companyId, companyCode]);

  // Gestione della selezione di una tabella
  const handleSelectTable = (tableName: string) => {
    setActiveTable(tableName);
  };

  // Torna alla visualizzazione delle tabelle
  const handleBackToTables = () => {
    setActiveTable(null);
  };

  if (loading) return <div className="loading">Caricamento...</div>;

  if (error) {
    return (
      <div className="company-tables error">
        <h2>Errore</h2>
        <p>{error}</p>
        <button onClick={() => setError(null)} className="btn-secondary">Riprova</button>
      </div>
    );
  }

  // Se c'è una tabella attiva, mostra il componente di gestione tabella
  if (activeTable) {
    return (
      <CompanyTable 
        tableName={activeTable} 
        companyId={companyId} 
        companyCode={companyCode} 
        onBack={handleBackToTables}
      />
    );
  }

  // Altrimenti mostra la lista delle tabelle disponibili
  return (
    <div className="company-tables">
      <h2>Gestione Tabelle Aziendali</h2>
      <p>Seleziona una tabella da gestire per l'azienda {companyCode}:</p>
      
      <div className="tables-grid">
        {tables.map(table => (
          <div className="table-card" key={table.name}>
            <div className="card-content">
              <h3>{table.label}</h3>
              <p>{table.description}</p>
              <button 
                onClick={() => handleSelectTable(table.name)}
                className="primary-button"
              >
                Gestisci
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyTables;