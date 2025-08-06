import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CisternaProps {
  companyId: number;
  companyCode: string;
}

interface Cisterna {
  id: string;
  descrizione: string;
  capacita: number;
  giacenza: number;
  id_articolo?: number | null;
  id_magazzino?: number | null;
  id_codicesoggetto?: number | null;
  flagobso?: boolean;
}

const VisualizeCisterne: React.FC<CisternaProps> = ({ companyId, companyCode }) => {
  const [cisterne, setCisterne] = useState<Cisterna[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Informazioni di debug
  console.log('Debug - Parametri componente:', { companyId, companyCode });

  useEffect(() => {
    const fetchCisterne = async () => {
      try {
        setLoading(true);
        
        // Il backend aggiunge automaticamente il prefisso, quindi passiamo solo "cisterne"
        // Evitando di usare ${companyCode}_cisterne per prevenire la doppia prefissazione
        console.log(`Recupero dati cisterne per l'azienda ${companyId}, prefisso: ${companyCode}`);
        
        // Eseguiamo la richiesta API corretta - senza '/records' nel percorso
        const response = await axios.get(`/api/company/${companyId}/tables/cisterne`);
        console.log('Risposta API:', response.data);
        
        if (response.data.success) {
          const rawData = response.data.data || [];
          console.log('Dati ricevuti:', rawData);
          
          // Trasformiamo i dati ricevuti
          const cisterneData = rawData.map((cisterna: any) => {
            // Converti i valori numerici
            const capacita = parseFloat(cisterna.capacita) || 0;
            const giacenza = parseFloat(cisterna.giacenza) || 0;
            
            // Conversione esplicita del flagobso
            const flagobso = cisterna.flagobso === true || 
                           cisterna.flagobso === 'true' || 
                           cisterna.flagobso === 1 || 
                           cisterna.flagobso === '1';
            
            return {
              id: cisterna.id,
              descrizione: cisterna.descrizione || `Cisterna ${cisterna.id}`,
              capacita: capacita,
              giacenza: giacenza,
              id_articolo: cisterna.id_articolo,
              id_magazzino: cisterna.id_magazzino,
              id_codicesoggetto: cisterna.id_codicesoggetto,
              flagobso: flagobso
            };
          });
          
          console.log('Dati elaborati:', cisterneData);
          setCisterne(cisterneData);
        } else {
          console.error('Errore nella risposta API:', response.data);
          setError(`Errore nel recupero dati: ${response.data.message || 'Errore sconosciuto'}`);
        }
      } catch (err) {
        console.error('Errore durante la richiesta:', err);
        let errorMessage = 'Errore di connessione';
        
        // Estraiamo dettagli specifici dall'errore axios
        if ((err as any)?.response?.data?.message) {
          errorMessage = `Errore API: ${(err as any).response.data.message}`;
        } else if ((err as Error)?.message) {
          errorMessage = `Errore: ${(err as Error).message}`;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCisterne();
  }, [companyId, companyCode]);

  // Funzione per ottenere la percentuale di riempimento
  const getPercentuale = (cisterna: Cisterna): number => {
    if (cisterna.capacita <= 0) return 0;
    const percentuale = (cisterna.giacenza / cisterna.capacita) * 100;
    return Math.min(Math.max(percentuale, 0), 100); // Limitato tra 0 e 100
  };
  
  // Funzione per determinare lo stato della cisterna
  const getStatoCisterna = (cisterna: Cisterna): string => {
    if (cisterna.flagobso) return 'manutenzione';
    if (cisterna.giacenza <= 0) return 'vuota';
    if (cisterna.giacenza >= cisterna.capacita * 0.95) return 'piena';
    return 'parziale';
  };

  // Funzione per ottenere il colore
  const getColore = (cisterna: Cisterna): string => {
    if (cisterna.flagobso) return '#f44336'; // Rosso per manutenzione
    
    const percentuale = getPercentuale(cisterna);
    if (percentuale <= 0) return '#e0e0e0'; // Grigio per vuota
    
    // Verde oliva di intensità variabile
    return `hsl(86, ${80}%, ${50 - percentuale * 0.25}%)`;
  };

  return (
    <div className="visualize-cisterne-container">
      <div className="page-header">
        <h2>Visualizzazione Cisterne</h2>
        <p className="subtitle">Visualizzazione cisterne (Azienda: {companyCode})</p>
      </div>
      
      <div className="controls">
        <div className="view-toggle">
          <button 
            className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <i className="fas fa-th"></i> Griglia
          </button>
          <button 
            className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <i className="fas fa-list"></i> Lista
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-indicator">
          <i className="fas fa-spinner fa-spin"></i> Caricamento cisterne...
        </div>
      ) : error ? (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      ) : cisterne.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-database"></i>
          <p>Nessuna cisterna trovata nella tabella {companyCode}_cisterne</p>
        </div>
      ) : (
        <div className={`cisterne-${viewMode}`}>
          {viewMode === 'grid' ? (
            <div className="cisterne-grid">
              {cisterne.map(cisterna => (
                <div 
                  key={cisterna.id} 
                  className={`cisterna-card ${getStatoCisterna(cisterna)}`}
                >
                  <div className="cisterna-header">
                    <span className="cisterna-code">{cisterna.id}</span>
                    <span className={`cisterna-status stato-${getStatoCisterna(cisterna)}`}>
                      {getStatoCisterna(cisterna) === 'vuota' && 'Vuota'}
                      {getStatoCisterna(cisterna) === 'piena' && 'Piena'}
                      {getStatoCisterna(cisterna) === 'parziale' && 'Parziale'}
                      {getStatoCisterna(cisterna) === 'manutenzione' && 'Manutenzione'}
                    </span>
                  </div>
                  
                  <div className="cisterna-graphic">
                    <div className="cisterna-container">
                      <div 
                        className="cisterna-fill" 
                        style={{ 
                          height: `${getPercentuale(cisterna)}%`,
                          backgroundColor: getColore(cisterna)
                        }}
                      >
                        {getPercentuale(cisterna) > 10 && (
                          <span className="fill-text">
                            {getPercentuale(cisterna).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="cisterna-scale">
                      <span className="scale-max">{cisterna.capacita} Kg</span>
                      <span className="scale-mid">{(cisterna.capacita / 2).toFixed(0)} Kg</span>
                      <span className="scale-min">0 Kg</span>
                    </div>
                  </div>
                  
                  <div className="cisterna-details">
                    <div className="detail-row">
                      <span className="detail-label">Nome:</span>
                      <span className="detail-value">{cisterna.descrizione}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Capacità:</span>
                      <span className="detail-value">{cisterna.capacita} Kg</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Attuale:</span>
                      <span className="detail-value">{cisterna.giacenza} Kg</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">ID Articolo:</span>
                      <span className="detail-value">{cisterna.id_articolo || '-'}</span>
                    </div>
                    {cisterna.id_codicesoggetto && (
                      <div className="detail-row">
                        <span className="detail-label">Codice soggetto:</span>
                        <span className="detail-value">{cisterna.id_codicesoggetto}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="cisterne-list">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Descrizione</th>
                    <th>Stato</th>
                    <th>Livello</th>
                    <th>Capacità</th>
                    <th>ID Articolo</th>
                    <th>ID Soggetto</th>
                  </tr>
                </thead>
                <tbody>
                  {cisterne.map(cisterna => (
                    <tr key={cisterna.id} className={getStatoCisterna(cisterna)}>
                      <td>{cisterna.id}</td>
                      <td>{cisterna.descrizione}</td>
                      <td>
                        <span className={`stato-${getStatoCisterna(cisterna)}`}>
                          {getStatoCisterna(cisterna) === 'vuota' && 'Vuota'}
                          {getStatoCisterna(cisterna) === 'piena' && 'Piena'}
                          {getStatoCisterna(cisterna) === 'parziale' && 'Parziale'}
                          {getStatoCisterna(cisterna) === 'manutenzione' && 'Manutenzione'}
                        </span>
                      </td>
                      <td>
                        <div className="list-fill-bar">
                          <div 
                            className="list-fill-progress" 
                            style={{ 
                              width: `${getPercentuale(cisterna)}%`,
                              backgroundColor: getColore(cisterna)
                            }}
                          ></div>
                          <span className="list-fill-text">
                            {cisterna.giacenza} Kg ({getPercentuale(cisterna).toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td>{cisterna.capacita} Kg</td>
                      <td>{cisterna.id_articolo || '-'}</td>
                      <td>{cisterna.id_codicesoggetto || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualizeCisterne;