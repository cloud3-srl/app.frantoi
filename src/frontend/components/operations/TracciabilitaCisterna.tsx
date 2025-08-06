import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

interface TracciabilitaProps {
  companyId: number;
  companyCode: string;
}

interface MovimentoSchema {
  id: number;
  data: string;
  tipo_movimento: string;
  cisterna_id: string;
  quantita: number;
  id_articolo?: number;
  id_codicesoggetto?: number;
  note?: string;
  numero_documento?: string;
  tipo_operazione?: string;
  operatore?: string;
  data_registrazione?: string;
}

interface CisternaInfo {
  id: string;
  descrizione: string;
  tipo_olio?: string;
  capacita: number;
  giacenza: number;
}

const TracciabilitaCisterna: React.FC<TracciabilitaProps> = ({ companyId, companyCode }) => {
  const { cisternaId } = useParams<{ cisternaId?: string }>();
  const navigate = useNavigate();
  
  const [cisterne, setCisterne] = useState<CisternaInfo[]>([]);
  const [selectedCisterna, setSelectedCisterna] = useState<string>(cisternaId || '');
  const [cisternaInfo, setCisternaInfo] = useState<CisternaInfo | null>(null);
  const [movimenti, setMovimenti] = useState<MovimentoSchema[]>([]);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Primo giorno del mese corrente
    end: new Date().toISOString().split('T')[0] // Oggi
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carica elenco cisterne
  useEffect(() => {
    const fetchCisterne = async () => {
      try {
        setLoading(true);
        // Correzione del percorso API
        console.log(`Caricando cisterne per l'azienda ${companyId}, prefisso: ${companyCode}`);
        const response = await axios.get(`/api/company/${companyId}/tables/cisterne`);
        
        if (response.data.success) {
          const rawData = response.data.data || [];
          
          // Adatta i dati dalla tabella
          const cisterneData = rawData.map((record: any) => ({
            id: record.id,
            descrizione: record.descrizione || `Cisterna ${record.id}`,
            tipo_olio: record.tipo_olio || '',
            capacita: parseFloat(record.capacita) || 0,
            giacenza: parseFloat(record.giacenza) || 0,
          }));
          
          setCisterne(cisterneData);
          
          // Se è stata specificata una cisterna nella URL o è già selezionata
          if (cisternaId || selectedCisterna) {
            const selectedId = cisternaId || selectedCisterna;
            const found = cisterneData.find((c: CisternaInfo) => c.id === selectedId);
            if (found) {
              setSelectedCisterna(selectedId);
              setCisternaInfo(found);
              fetchMovimentiCisterna(selectedId);
            } else if (cisterneData.length > 0) {
              // Se la cisterna specificata non esiste, seleziona la prima
              setSelectedCisterna(cisterneData[0].id);
              setCisternaInfo(cisterneData[0]);
              fetchMovimentiCisterna(cisterneData[0].id);
              
              // Aggiorna l'URL se necessario
              if (cisternaId) {
                navigate(`/company/${companyCode}/operations/tracciabilita-cisterna/${cisterneData[0].id}`);
              }
            }
          }
        } else {
          setError('Errore nel caricamento delle cisterne.');
          showDemoData();
        }
      } catch (err) {
        console.error('Errore nel recupero dei dati delle cisterne:', err);
        setError(`Errore nel recupero dati cisterne: ${(err as Error).message}`);
        showDemoData();
      } finally {
        setLoading(false);
      }
    };

    const showDemoData = () => {
      // Dati di esempio per visualizzazione
      const demoCisterne: CisternaInfo[] = [
        { 
          id: 'C001', 
          descrizione: 'Cisterna Olio Extra Vergine', 
          capacita: 5000, 
          giacenza: 4800, 
          tipo_olio: 'Extra Vergine'
        },
        { 
          id: 'C002', 
          descrizione: 'Cisterna Olio Extra Vergine 2', 
          capacita: 3000, 
          giacenza: 1500, 
          tipo_olio: 'Extra Vergine'
        },
        { 
          id: 'C003', 
          descrizione: 'Cisterna Standard 1', 
          capacita: 2000, 
          giacenza: 0
        },
        { 
          id: 'C004', 
          descrizione: 'Cisterna Olio Vergine', 
          capacita: 10000, 
          giacenza: 9800, 
          tipo_olio: 'Vergine'
        }
      ];
      
      setCisterne(demoCisterne);
      
      // Seleziona una cisterna di default
      const defaultCisterna = cisternaId ? 
        demoCisterne.find((c: CisternaInfo) => c.id === cisternaId) : 
        demoCisterne[0];
      
      if (defaultCisterna) {
        setSelectedCisterna(defaultCisterna.id);
        setCisternaInfo(defaultCisterna);
        showDemoMovimenti(defaultCisterna.id);
      }
    };

    fetchCisterne();
  }, [companyId, companyCode, cisternaId]);

  // Carica movimenti per la cisterna selezionata
  const fetchMovimentiCisterna = async (cisternaId: string) => {
    try {
      setLoading(true);
      
      // Correzione del percorso API
      console.log(`Cercando movimenti per l'azienda ${companyId}, prefisso: ${companyCode}`);
      const response = await axios.get(`/api/company/${companyId}/tables/movimenti_cisterne`, {
        params: {
          filters: JSON.stringify({
            cisterna_id: cisternaId,
            data: {
              $gte: dateRange.start,
              $lte: dateRange.end
            }
          }),
          sort: 'data:desc' // Ordina per data discendente
        }
      });
      
      if (response.data.success) {
        setMovimenti(response.data.data || []);
      } else {
        console.warn('Tabella movimenti_cisterne non trovata o vuota, visualizzo dati di esempio');
        showDemoMovimenti(cisternaId);
      }
    } catch (err) {
      console.error('Errore nel recupero dei movimenti:', err);
      showDemoMovimenti(cisternaId);
    } finally {
      setLoading(false);
    }
  };

  const showDemoMovimenti = (cisternaId: string) => {
    // Movimenti di esempio per la cisterna
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const demoMovimenti: MovimentoSchema[] = [
      {
        id: 1,
        data: today.toISOString().split('T')[0],
        tipo_movimento: 'Carico',
        cisterna_id: cisternaId,
        quantita: 150,
        tipo_operazione: 'Molitura',
        operatore: 'Mario Rossi',
        numero_documento: 'MOL-2025-001',
        note: 'Caricamento da molitura',
        data_registrazione: today.toISOString()
      },
      {
        id: 2,
        data: yesterday.toISOString().split('T')[0],
        tipo_movimento: 'Scarico',
        cisterna_id: cisternaId,
        quantita: 200,
        tipo_operazione: 'Vendita',
        operatore: 'Luigi Bianchi',
        numero_documento: 'DDT-2025-042',
        note: 'Vendita a Cliente XYZ',
        data_registrazione: yesterday.toISOString()
      },
      {
        id: 3,
        data: twoDaysAgo.toISOString().split('T')[0],
        tipo_movimento: 'Travaso',
        cisterna_id: cisternaId,
        quantita: 500,
        tipo_operazione: 'Travaso interno',
        operatore: 'Mario Rossi',
        numero_documento: 'TR-2025-007',
        note: 'Travaso da cisterna C002',
        data_registrazione: twoDaysAgo.toISOString()
      },
      {
        id: 4,
        data: lastWeek.toISOString().split('T')[0],
        tipo_movimento: 'Carico',
        cisterna_id: cisternaId,
        quantita: 1000,
        tipo_operazione: 'Acquisto',
        operatore: 'Luigi Bianchi',
        numero_documento: 'ACQ-2025-015',
        note: 'Acquisto da Fornitore ABC',
        data_registrazione: lastWeek.toISOString()
      }
    ];
    
    setMovimenti(demoMovimenti);
  };

  // Gestisce il cambio della cisterna selezionata
  const handleCisternaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCisternaId = e.target.value;
    setSelectedCisterna(newCisternaId);
    
    // Aggiorna la cisterna selezionata
    const selectedCisterna = cisterne.find((c: CisternaInfo) => c.id === newCisternaId);
    if (selectedCisterna) {
      setCisternaInfo(selectedCisterna);
      fetchMovimentiCisterna(newCisternaId);
      
      // Aggiorna l'URL
      navigate(`/company/${companyCode}/operations/tracciabilita-cisterna/${newCisternaId}`);
    }
  };

  // Gestisce il cambio del range di date
  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Applica il filtro per date
  const applyDateFilter = () => {
    if (selectedCisterna) {
      fetchMovimentiCisterna(selectedCisterna);
    }
  };

  // Calcola il bilancio totale dei movimenti
  const calcolaBilancioMovimenti = () => {
    return movimenti.reduce((total: number, movimento: MovimentoSchema) => {
      if (movimento.tipo_movimento === 'Carico') {
        return total + movimento.quantita;
      } else if (movimento.tipo_movimento === 'Scarico') {
        return total - movimento.quantita;
      }
      return total;
    }, 0);
  };

  // Ottieni la classe CSS per il tipo di movimento
  const getTipoMovimentoClass = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'carico':
        return 'movimento-carico';
      case 'scarico':
        return 'movimento-scarico';
      case 'travaso':
        return 'movimento-travaso';
      default:
        return '';
    }
  };

  // Formatta la data in un formato locale
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  };

  return (
    <div className="tracciabilita-cisterna-container">
      <div className="page-header">
        <h2>Tracciabilità Cisterna</h2>
        <p className="subtitle">Monitoraggio e tracciabilità dei movimenti delle cisterne</p>
      </div>

      {/* Filtri e selezione cisterna */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Seleziona Cisterna:</label>
          <select 
            value={selectedCisterna} 
            onChange={handleCisternaChange}
            className="cisterna-select"
          >
            {cisterne.map((cisterna: CisternaInfo) => (
              <option key={cisterna.id} value={cisterna.id}>
                {cisterna.descrizione} {cisterna.tipo_olio ? `(${cisterna.tipo_olio})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="date-range-filters">
          <div className="filter-group">
            <label>Data Inizio:</label>
            <input 
              type="date" 
              value={dateRange.start} 
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Data Fine:</label>
            <input 
              type="date" 
              value={dateRange.end} 
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
            />
          </div>
          <button 
            onClick={applyDateFilter}
            className="apply-filter-button"
          >
            <i className="fas fa-filter"></i> Applica Filtro
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-indicator">
          <i className="fas fa-spinner fa-spin"></i> Caricamento dati...
        </div>
      ) : error ? (
        <div>
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i> {error}
          </div>
          <div className="note-message">
            <p><strong>Nota:</strong> Sono mostrati dati di esempio perché la tabella <code>{companyCode}_movimenti_cisterne</code> probabilmente non esiste ancora.</p>
            <p>Per utilizzare la funzionalità di tracciabilità con dati reali, chiedi all'amministratore di sistema di creare la tabella <code>{companyCode}_movimenti_cisterne</code>.</p>
          </div>
        </div>
      ) : (
        <>
          {cisternaInfo && (
            <div className="cisterna-info-card">
              <h3>Informazioni Cisterna</h3>
              <div className="cisterna-details">
                <div className="detail-item">
                  <strong>Codice:</strong> {cisternaInfo.id}
                </div>
                <div className="detail-item">
                  <strong>Descrizione:</strong> {cisternaInfo.descrizione}
                </div>
                <div className="detail-item">
                  <strong>Capacità:</strong> {cisternaInfo.capacita} litri
                </div>
                <div className="detail-item">
                  <strong>Giacenza attuale:</strong> {cisternaInfo.giacenza} litri
                </div>
                {cisternaInfo.tipo_olio && (
                  <div className="detail-item">
                    <strong>Tipo Olio:</strong> {cisternaInfo.tipo_olio}
                  </div>
                )}
                <div className="detail-item">
                  <strong>Percentuale riempimento:</strong> {((cisternaInfo.giacenza / cisternaInfo.capacita) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          <div className="movimenti-bilancio">
            <h3>Bilancio Movimenti nel Periodo Selezionato</h3>
            <div className="bilancio-valore">
              <span className={calcolaBilancioMovimenti() >= 0 ? 'positivo' : 'negativo'}>
                {calcolaBilancioMovimenti() >= 0 ? '+' : ''}{calcolaBilancioMovimenti()} litri
              </span>
            </div>
          </div>

          <div className="movimenti-timeline">
            <h3>Cronologia Movimenti</h3>
            
            {movimenti.length === 0 ? (
              <div className="no-data-message">
                <i className="fas fa-info-circle"></i> Nessun movimento registrato nel periodo selezionato
              </div>
            ) : (
              <div className="timeline">
                {movimenti.map((movimento: MovimentoSchema, index: number) => (
                  <div 
                    key={movimento.id} 
                    className={`timeline-item ${getTipoMovimentoClass(movimento.tipo_movimento)}`}
                  >
                    <div className="timeline-badge">
                      <i className={`fas ${
                        movimento.tipo_movimento === 'Carico' ? 'fa-arrow-down' : 
                        movimento.tipo_movimento === 'Scarico' ? 'fa-arrow-up' : 
                        'fa-exchange-alt'
                      }`}></i>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-date">{formatDate(movimento.data)}</span>
                        <span className={`timeline-type badge-${movimento.tipo_movimento.toLowerCase()}`}>
                          {movimento.tipo_movimento}
                        </span>
                      </div>
                      <div className="timeline-body">
                        <div className="movimento-details">
                          <div className="movimento-dettaglio">
                            <strong>Quantità:</strong> {movimento.quantita} litri
                          </div>
                          {movimento.tipo_operazione && (
                            <div className="movimento-dettaglio">
                              <strong>Operazione:</strong> {movimento.tipo_operazione}
                            </div>
                          )}
                          {movimento.numero_documento && (
                            <div className="movimento-dettaglio">
                              <strong>Documento:</strong> {movimento.numero_documento}
                            </div>
                          )}
                          {movimento.operatore && (
                            <div className="movimento-dettaglio">
                              <strong>Operatore:</strong> {movimento.operatore}
                            </div>
                          )}
                          {movimento.note && (
                            <div className="movimento-dettaglio note">
                              <strong>Note:</strong> {movimento.note}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="actions-container">
        <button onClick={() => window.history.back()} className="back-button">
          <i className="fas fa-arrow-left"></i> Torna Indietro
        </button>
      </div>
    </div>
  );
};

export default TracciabilitaCisterna;