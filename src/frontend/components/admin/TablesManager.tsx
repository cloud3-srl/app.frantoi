import React, { useState } from 'react';
import axios from 'axios';

interface TableDefinition {
  name: string;
  label: string;
  description: string;
}

const TablesManager: React.FC = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const tables: TableDefinition[] = [
    { name: 'articoli', label: 'Articoli', description: 'Gestione articoli di olio e olive' },
    { name: 'olive_to_oli', label: 'Relazioni Olive-Olio', description: 'Gestione delle relazioni tra olive e olio prodotto' },
    { name: 'categorie_olio', label: 'Categorie Olio', description: 'Gestione categorie e tipologie di olio' },
    { name: 'macroaree', label: 'Macroaree', description: 'Gestione delle macroaree geografiche' },
    { name: 'origini_specifiche', label: 'Origini specifiche', description: 'Gestione origini specifiche dell\'olio' },
    { name: 'nazioni', label: 'Nazioni', description: 'Gestione delle nazioni' },
    { name: 'province', label: 'Province', description: 'Gestione delle province italiane' },
    { name: 'comuni', label: 'Comuni', description: 'Gestione dei comuni italiani' },
    { name: 'codici_iva', label: 'Codici IVA', description: 'Gestione delle aliquote IVA' },
  ];

  // Gestione della navigazione verso la tabella specifica
  const navigateToTable = (tableName: string) => {
    window.location.href = `/admin/tables/${tableName}`;
  };
  
  // Funzione per effettuare il backup del database
  const handleBackupDatabase = async () => {
    try {
      setIsBackingUp(true);
      setBackupMessage(null);
      
      const response = await axios.post('/api/admin/backup-database', {}, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setBackupMessage({
          type: 'success',
          text: `Backup completato con successo: ${response.data.filename}`
        });
      } else {
        setBackupMessage({
          type: 'error',
          text: response.data.message || 'Errore durante il backup del database'
        });
        
        // Aggiungiamo ulteriori dettagli se disponibili
        if (response.data.details) {
          console.error('Dettagli errore backup:', response.data.details);
        }
      }
    } catch (error: any) {
      console.error('Errore durante il backup:', error);
      setBackupMessage({
        type: 'error',
        text: error.response?.data?.message || 'Errore durante il backup del database'
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="tables-manager">
      <div className="tables-header">
        <h2>Gestione Tabelle di Base</h2>
        <div className="tables-actions">
          <button 
            className="backup-button"
            onClick={handleBackupDatabase}
            disabled={isBackingUp}
          >
            {isBackingUp ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Backup in corso...
              </>
            ) : (
              <>
                <i className="fas fa-database"></i> Backup Database
              </>
            )}
          </button>
        </div>
      </div>
      
      {backupMessage && (
        <div className={`message-box ${backupMessage.type === 'success' ? 'success-message' : 'error-message'}`}>
          {backupMessage.type === 'success' ? (
            <i className="fas fa-check-circle"></i>
          ) : (
            <i className="fas fa-exclamation-circle"></i>
          )}
          {backupMessage.text}
        </div>
      )}
      
      <p>Seleziona una tabella da gestire:</p>
      
      <div className="tables-grid">
        {tables.map(table => (
          <div className="table-card" key={table.name}>
            <div className="card-content">
              <h3>{table.label}</h3>
              <p>{table.description}</p>
              <button 
                onClick={() => navigateToTable(table.name)}
                className="primary-button"
              >
                Gestisci
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="admin-tools-card">
        <h3>Strumenti di Manutenzione</h3>
        <p>Esegue un backup completo del database nella cartella backups</p>
        <button 
          className="backup-button-large"
          onClick={handleBackupDatabase}
          disabled={isBackingUp}
        >
          {isBackingUp ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Backup in corso...
            </>
          ) : (
            <>
              <i className="fas fa-database"></i> Esegui Backup Database
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TablesManager;