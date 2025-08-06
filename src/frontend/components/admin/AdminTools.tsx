import React, { useState } from 'react';
import axios from 'axios';
import InitializeCompanyTables from './InitializeCompanyTables';
import OliveLineeManager from './OliveLineeManager';

interface AdminToolsProps {
  companyId?: number;
  companyCode?: string;
}

const AdminTools: React.FC<AdminToolsProps> = ({ companyId, companyCode }) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
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
    <div className="admin-tools">
      <div className="admin-header">
        <h2><i className="fas fa-tools"></i> Strumenti Amministratore</h2>
        <p>Utilizza questi strumenti con cautela. Alcune operazioni potrebbero influire sui dati dell'applicazione.</p>
      </div>
      
      <div className="admin-tools-grid">
        <InitializeCompanyTables companyId={companyId} companyCode={companyCode} />
        
        <div className="admin-tool-card">
          <div className="tool-header">
            <h3><i className="fas fa-database"></i> Backup Database</h3>
          </div>
          <div className="tool-content">
            <p>Esegue un backup completo del database nella cartella backups con nome anno_mese_giorno_ora_minuti.sql</p>
            
            {backupMessage && (
              <div className={`message ${backupMessage.type === 'success' ? 'success-message' : 'error-message'}`}>
                {backupMessage.text}
              </div>
            )}
            
            <button 
              className="btn-primary" 
              onClick={handleBackupDatabase}
              disabled={isBackingUp}
            >
              {isBackingUp ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Backup in corso...
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i> Esegui Backup
                </>
              )}
            </button>
          </div>
        </div>
        
        <OliveLineeManager companyId={companyId} companyCode={companyCode} />
      </div>
    </div>
  );
};

export default AdminTools;