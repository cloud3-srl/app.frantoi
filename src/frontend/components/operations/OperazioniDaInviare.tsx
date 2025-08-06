import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

// Mapping dei campi SIAN per riferimento
/*
CAMPO01	 =	CUAA (Codice fiscale o partita IVA) dell.impresa  
CAMPO02	 =	Identificativo dello stabilimento/deposito        
CAMPO03	 =	Numero dell.operazione                            
CAMPO04	 =	Data dell.operazione                              
CAMPO05	 =	Numero documento giustificativo                   
CAMPO06	 =	Data documento giustificativo                     
CAMPO07	 =	Codice operazione                                 
CAMPO08	 =	Identificativo Fornitore/Cliente/Terzista(cod.sog)
CAMPO09	 =	Identificativo Committente (Codice soggetto)      
CAMPO10	 =	Qtà di carico giorn.di olive sudd olivicoltore(kg)
CAMPO11	 =	Quantità di scarico delle olive (kg)              
CAMPO12	 =	Identificativo recipiente di stoccaggio           
CAMPO13	 =	Identif. recipiente di stoccaggio di destinazione 
CAMPO14	 =	Identif.stabilimento di provenienz/destinaz olio  
CAMPO15	 =	Descrizione categoria dell'olio                   
CAMPO16	 =	Descrizione categoria dell.olio a fine operazione 
CAMPO17	 =	Descrizione origine olive/olio per macroarea      
CAMPO18	 =	Descrizione origine olive/olio specifica          
CAMPO19	 =	Des.origine olive/olio per macroarea a fine operaz
CAMPO20	 =	Des.origine olive/olio specifica a fine operazione
CAMPO21	 =	Quantità carico sansa (Kg)                        
CAMPO22	 =	Quantità scarico sansa (Kg)                       
CAMPO23	 =	Quantità carico di olio sfuso (kg)                
CAMPO24	 =	Quantità scarico di olio sfuso (kg)               
CAMPO25	 =	Quantità carico di olio confezionato (litri)      
CAMPO26	 =	Quantità scarico di olio confezionato (litri)     
CAMPO27	 =	Quantità perdite o cali di lavoro (kg)            
CAMPO28	 =	Lotto di appartenenza dell.olio                   
CAMPO29	 =	Descrizione note                                  
CAMPO30	 =	Flag lavoro per conto terzi                       
CAMPO31	 =	Flag indicazione prima spremitura a freddo        
CAMPO32	 =	Flag indicaz prima spremitura a freddo fine operaz
CAMPO33	 =	Flag indicazione estratto a freddo                
CAMPO34	 =	Flag indicazione estratto a freddo fine operazione
CAMPO35	 =	Flag Biologico                                    
CAMPO36	 =	Flag Biologico fine operazione                    
CAMPO37	 =	Flag in conversione                               
CAMPO38	 =	Flag in conversione fine operazione               
CAMPO39	 =	Flag non etichettato                              
CAMPO40	 =	Flag non etichettato fine operazione              
CAMPO41	 =	Data e ora di raccolta delle olive                
CAMPO42	 =	Data e ora di molitura delle olive                
CAMPO43	 =	Annata                                            
CAMPO44	 =	Serie collarini dal                               
CAMPO45	 =	Serie collarini al                                
CAMPO46	 =	Capacità confezione                               
CAMPO47	 =	Data certificato                                  
CAMPO48	 =	Numero certificato                                
CAMPO49	 =	Tipo record inviato                                
*/

interface Movimento {
  id: number;
  data_operazione: string;
  cod_operazione: string;
  descrizione_operazione: string;
  tipo_soggetto: string;
  id_soggetto: number;
  nome_soggetto: string;
  id_articolo: number;
  descrizione_articolo: string;
  quantita: number;
  flag_sian_generato: boolean;
  flag_sian_inviato: boolean;
  [key: string]: any; // Consente proprietà aggiuntive
}

interface SianFile {
  fileName: string;
  fileSize: number;
  createdAt: string;
  modifiedAt: string;
}

interface OperazioniDaInviareProps {}

const OperazioniDaInviare: React.FC<OperazioniDaInviareProps> = () => {
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovimenti, setSelectedMovimenti] = useState<number[]>([]);
  const [allSelected, setAllSelected] = useState<boolean>(false);
  const [sianFiles, setSianFiles] = useState<SianFile[]>([]);
  const [showFilesList, setShowFilesList] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<{[key: number]: boolean}>({});
  
  // Parametri dalla URL
  const { companyCode } = useParams<{ companyCode: string }>();
  
  useEffect(() => {
    fetchMovimenti();
    fetchSianFiles();
  }, [companyCode]);
  
  const fetchMovimenti = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token di autenticazione mancante');
        setLoading(false);
        return;
      }
      
      // Usa l'endpoint dedicato per recuperare i movimenti da inviare al SIAN
      const response = await axios.get(`/api/company/${companyCode}/sian/movimenti`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Company-ID': companyCode
        }
      });
      
      if (response.data.success) {
        setMovimenti(response.data.data);
      } else {
        setError('Errore durante il recupero dei movimenti: ' + response.data.message);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      setError('Errore durante il recupero dei movimenti: ' + errorMsg);
      console.error('Errore API:', err);
      console.error('Dettagli risposta:', err.response?.data || 'Nessuna risposta dal server');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDataOperazione = (dataString: string) => {
    if (!dataString) return 'N/D';
    const data = new Date(dataString);
    return data.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const handleSelectAll = () => {
    if (allSelected) {
      // Deseleziona tutti
      setSelectedMovimenti([]);
    } else {
      // Seleziona tutti
      setSelectedMovimenti(movimenti.map(m => m.id));
    }
    setAllSelected(!allSelected);
  };
  
  const handleSelectMovimento = (id: number) => {
    if (selectedMovimenti.includes(id)) {
      // Rimuovi dalla selezione
      setSelectedMovimenti(prev => prev.filter(item => item !== id));
    } else {
      // Aggiungi alla selezione
      setSelectedMovimenti(prev => [...prev, id]);
    }
  };
  
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  
  const generaXmlSian = async () => {
    if (selectedMovimenti.length === 0) {
      alert('Seleziona almeno un movimento da elaborare');
      return;
    }
    
    try {
      setLoading(true);
      setValidationWarnings([]);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`/api/company/${companyCode}/sian/genera-xml`, {
        movimentiIds: selectedMovimenti
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Company-ID': companyCode
        }
      });
      
      if (response.data.success) {
        // Verifica se ci sono avvisi di validazione
        if (response.data.data.validationWarnings && response.data.data.validationWarnings.length > 0) {
          // Salva gli avvisi di validazione per mostrarli
          setValidationWarnings(response.data.data.validationWarnings);
          setShowValidationModal(true);
        } else {
          alert('File XML generato con successo!');
        }
        
        // Aggiorna l'elenco dei movimenti dopo la generazione
        fetchMovimenti();
        // Carica l'elenco dei file generati
        fetchSianFiles();
        // Mostra la lista dei file
        setShowFilesList(true);
      } else {
        alert('Errore durante la generazione del file XML: ' + response.data.message);
      }
    } catch (err: any) {
      alert('Errore durante la generazione del file XML: ' + (err.response?.data?.message || err.message));
      console.error('Errore API:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const getOperazioneLabel = (codOperazione: string) => {
    const operazioni: {[key: string]: string} = {
      'T1': 'Carico Olive',
      'T2': 'Molitura',
      'T3': 'Vendita Olio',
      'T4': 'Carico Olio',
      'T5': 'Scarico Olio',
      'CAR': 'Carico',
      'SCA': 'Scarico',
      'VEN': 'Vendita',
      'ACQ': 'Acquisto',
      'MOL': 'Molitura',
      'TRA': 'Trasferimento'
    };
    
    return operazioni[codOperazione] || codOperazione || 'Non specificato';
  };
  
  // Funzione per alternare l'espansione di una riga
  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const fetchSianFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`/api/company/${companyCode}/sian/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Company-ID': companyCode
        }
      });
      
      if (response.data.success) {
        setSianFiles(response.data.data);
      }
    } catch (err) {
      console.error('Errore nel caricamento dei file SIAN:', err);
    }
  };
  
  const downloadSianFile = (fileName: string) => {
    window.open(`/api/company/${companyCode}/sian/files/${fileName}`, '_blank');
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  const openGuideModal = () => {
    setShowGuideModal(true);
  };
  
  // Funzione per registrare l'invio del file al SIAN
  const markFileAsSent = async (fileName: string) => {
    if (!confirm(`Confermi di aver inviato il file "${fileName}" al sistema SIAN?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Estrai l'ID movimento dal nome del file (se il formato lo consente)
      const movimentiIds = extractMovimentiIdsFromFileName(fileName);
      
      // Chiama l'API per registrare l'invio
      const response = await axios.post(
        `/api/company/${companyCode}/sian/marca-inviati`, 
        { fileName, movimentiIds },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Company-ID': companyCode
          }
        }
      );
      
      if (response.data.success) {
        alert('File registrato come inviato al SIAN con successo!');
        // Aggiorna l'elenco dei movimenti
        fetchMovimenti();
      } else {
        alert('Errore durante la registrazione: ' + response.data.message);
      }
    } catch (err: any) {
      alert('Errore durante la registrazione dell\'invio: ' + (err.response?.data?.message || err.message));
      console.error('Errore API:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Estrae gli ID dei movimenti dal nome del file (se il formato lo consente)
  const extractMovimentiIdsFromFileName = (fileName: string) => {
    // Il nome del file contiene informazioni sul codice azienda e timestamp
    // ma non sugli ID dei movimenti, quindi dobbiamo fare un'ipotesi
    // In una implementazione reale, potremmo memorizzare queste informazioni
    // in un registro quando il file viene generato
    
    // Per ora, restituiamo un array vuoto
    return [];
  };
  
  // Componente modale per mostrare gli avvisi di validazione
  const ValidationModal = () => (
    <div className={`modal ${showValidationModal ? 'show' : ''}`} style={{ display: showValidationModal ? 'block' : 'none' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-warning text-dark">
            <h5 className="modal-title">
              <i className="fas fa-exclamation-triangle"></i> Avvisi di validazione SIAN
            </h5>
            <button type="button" className="close" onClick={() => setShowValidationModal(false)}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <p>Il file XML è stato generato con successo, ma sono stati rilevati i seguenti avvisi che potrebbero causare problemi durante l'invio al SIAN:</p>
            
            <div className="alert alert-warning">
              <strong>Numero di avvisi: {validationWarnings.length}</strong>
            </div>
            
            <ul className="validation-warnings-list">
              {validationWarnings.map((warning, index) => (
                <li key={index} className="validation-warning-item">
                  {warning}
                </li>
              ))}
            </ul>
            
            <div className="alert alert-info">
              <p><strong>Suggerimento:</strong> Verificare i dati nei campi segnalati prima di procedere con l'invio del file XML al SIAN.</p>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => setShowValidationModal(false)}
            >
              Ho capito
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </div>
  );

  return (
    <div className="operazioni-inviare-container">
      <div className="page-header">
        <h2>
          <i className="fas fa-paper-plane"></i> Operazioni da Inviare al SIAN
        </h2>
        <p className="subtitle">Visualizzazione delle operazioni in attesa di trasmissione al sistema SIAN</p>
      </div>
      
      {/* Modale per gli avvisi di validazione */}
      {showValidationModal && <ValidationModal />}
      
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      )}
      
      <div className="action-buttons">
        <button 
          className="btn btn-primary"
          onClick={generaXmlSian}
          disabled={loading || selectedMovimenti.length === 0}
        >
          <i className="fas fa-file-code"></i> Genera XML per SIAN
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={fetchMovimenti}
          disabled={loading}
        >
          <i className="fas fa-sync"></i> Aggiorna
        </button>
      </div>
      
      {loading ? (
        <div className="loading-indicator">
          <i className="fas fa-spinner fa-spin"></i> Caricamento in corso...
        </div>
      ) : movimenti.length === 0 ? (
        <div className="no-data-message">
          <i className="fas fa-info-circle"></i> Non ci sono operazioni da inviare al SIAN
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Data</th>
                <th>Operazione</th>
                <th>Soggetto</th>
                <th>Articolo</th>
                <th>Quantità</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {movimenti.map(movimento => (
                <React.Fragment key={movimento.id}>
                  <tr 
                    className={selectedMovimenti.includes(movimento.id) ? 'selected-row' : ''}
                  >
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedMovimenti.includes(movimento.id)}
                        onChange={() => handleSelectMovimento(movimento.id)}
                      />
                    </td>
                    <td>{formatDataOperazione(movimento.campo04)}</td>
                    <td>
                      <span className={`badge badge-${movimento.campo07 === 'T1' ? 'success' : 'warning'}`}>
                        {getOperazioneLabel(movimento.campo07)}
                      </span>
                    </td>
                    <td>{movimento.nome_soggetto || 'N/D'}</td>
                    <td>{movimento.descrizione_articolo_inizio || movimento.descrizione_articolo_fine || 'N/D'}</td>
                    <td>{movimento.quantita || movimento.campo10 || 0} kg</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-info"
                        onClick={() => toggleRowExpansion(movimento.id)}
                        title={expandedRows[movimento.id] ? "Nascondi dettagli" : "Mostra dettagli"}
                      >
                        <i className={`fas fa-chevron-${expandedRows[movimento.id] ? 'up' : 'down'}`}></i> Dettagli
                      </button>
                    </td>
                  </tr>
                  {expandedRows[movimento.id] && (
                    <tr className="details-row">
                      <td colSpan={7}>
                        <div className="details-container">
                          <h5>Dettagli SIAN per movimento #{movimento.id}</h5>
                          <table className="details-table">
                            <tbody>
                              {/* Riga 1 */}
                              <tr>
                                <th>CAMPO01 (CUAA):</th>
                                <td>{movimento.campo01 || '-'}</td>
                                <th>CAMPO02 (Stabilimento):</th>
                                <td>{movimento.campo02 || '-'}</td>
                                <th>CAMPO03 (N° operazione):</th>
                                <td>{movimento.campo03 || '-'}</td>
                              </tr>
                              {/* Riga 2 */}
                              <tr>
                                <th>CAMPO04 (Data op.):</th>
                                <td>{formatDataOperazione(movimento.campo04)}</td>
                                <th>CAMPO05 (N° doc.):</th>
                                <td>{movimento.campo05 || '-'}</td>
                                <th>CAMPO06 (Data doc.):</th>
                                <td>{formatDataOperazione(movimento.campo06)}</td>
                              </tr>
                              {/* Riga 3 */}
                              <tr>
                                <th>CAMPO07 (Cod. op.):</th>
                                <td>{movimento.campo07 || '-'}</td>
                                <th>CAMPO08 (ID Fornitore):</th>
                                <td>{movimento.campo08 || '-'}</td>
                                <th>CAMPO09 (ID Committente):</th>
                                <td>{movimento.campo09 || '-'}</td>
                              </tr>
                              {/* Riga 4 */}
                              <tr>
                                <th>CAMPO10 (Qtà carico olive):</th>
                                <td>{movimento.campo10 || '-'} kg</td>
                                <th>CAMPO11 (Qtà scarico olive):</th>
                                <td>{movimento.campo11 || '-'} kg</td>
                                <th>CAMPO12 (ID recipiente):</th>
                                <td>{movimento.campo12 || '-'}</td>
                              </tr>
                              {/* Riga 5 */}
                              <tr>
                                <th>CAMPO17 (Macroarea):</th>
                                <td>{movimento.campo17 || '-'}</td>
                                <th>CAMPO18 (Origine specifica):</th>
                                <td>{movimento.campo18 || '-'}</td>
                                <th>CAMPO30 (Flag c/terzi):</th>
                                <td>{movimento.campo30 || '-'}</td>
                              </tr>
                              {/* Riga 6 */}
                              <tr>
                                <th>CAMPO35 (Flag Bio):</th>
                                <td>{movimento.campo35 || '-'}</td>
                                <th>CAMPO49 (Tipo record):</th>
                                <td>{movimento.campo49 || '-'}</td>
                                <th>Descrizione:</th>
                                <td>{movimento.descrizione_movimento || '-'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="summary-info">
        <p>
          <strong>Totale operazioni selezionate:</strong> {selectedMovimenti.length} su {movimenti.length}
        </p>
      </div>
      
      {/* Sezione per i file SIAN generati */}
      <div className="sian-files-section">
        <h3 onClick={() => setShowFilesList(!showFilesList)} className="section-toggle">
          <i className={`fas fa-chevron-${showFilesList ? 'down' : 'right'}`}></i> File XML Generati
        </h3>
        
        {showFilesList && (
          <div className="sian-files-list">
            {sianFiles.length === 0 ? (
              <p>Nessun file XML generato finora.</p>
            ) : (
              <>
                <div className="sian-files-info alert alert-info">
                  <i className="fas fa-info-circle"></i> I file XML generati devono essere scaricati e inviati manualmente al portale SIAN.
                  Dopo l'invio, è importante registrare l'operazione per mantenere traccia delle trasmissioni.
                </div>
                
                <table className="table table-sm table-striped">
                  <thead className="thead-light">
                    <tr>
                      <th>Nome File</th>
                      <th>Dimensione</th>
                      <th>Data Creazione</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sianFiles.map(file => (
                      <tr key={file.fileName}>
                        <td>
                          <i className="fas fa-file-code text-primary"></i> {file.fileName}
                        </td>
                        <td>{formatFileSize(file.fileSize)}</td>
                        <td>{new Date(file.createdAt).toLocaleString('it-IT')}</td>
                        <td>
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-info"
                              onClick={() => downloadSianFile(file.fileName)}
                              title="Scarica il file XML"
                            >
                              <i className="fas fa-download"></i> Scarica
                            </button>
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => markFileAsSent(file.fileName)}
                              title="Registra come inviato al SIAN"
                            >
                              <i className="fas fa-check-circle"></i> Registra Invio
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="sian-files-actions">
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={fetchSianFiles}
                  >
                    <i className="fas fa-sync"></i> Aggiorna
                  </button>
                  <button
                    className="btn btn-outline-primary btn-sm ml-2"
                    onClick={openGuideModal}
                  >
                    <i className="fas fa-question-circle"></i> Guida all'invio SIAN
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Modale con la guida all'invio SIAN */}
      <div className={`modal ${showGuideModal ? 'show' : ''}`} style={{ display: showGuideModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-book"></i> Guida all'invio dei file XML al SIAN
              </h5>
              <button type="button" className="close" onClick={() => setShowGuideModal(false)}>
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <h5>Procedura per l'invio dei dati al SIAN:</h5>
              
              <ol className="guide-steps">
                <li>
                  <strong>Generare il file XML</strong> selezionando i movimenti da inviare e cliccando sul pulsante "Genera XML per SIAN"
                </li>
                <li>
                  <strong>Scaricare il file XML</strong> generato utilizzando il pulsante "Scarica"
                </li>
                <li>
                  <strong>Accedere al portale SIAN</strong> utilizzando le credenziali dell'azienda
                </li>
                <li>
                  <strong>Selezionare la sezione "Registro Telematico Olio d'Oliva"</strong> nel portale SIAN
                </li>
                <li>
                  <strong>Utilizzare la funzione "Caricamento XML"</strong> del portale
                </li>
                <li>
                  <strong>Caricare il file XML</strong> precedentemente scaricato
                </li>
                <li>
                  <strong>Verificare l'esito del caricamento</strong> nel portale SIAN
                </li>
                <li>
                  <strong>Registrare l'avvenuto invio</strong> utilizzando il pulsante "Registra Invio" in questa applicazione
                </li>
              </ol>
              
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle"></i> <strong>Attenzione:</strong> L'invio dei dati al SIAN è un obbligo normativo. 
                Assicurarsi di rispettare le scadenze previste dalla normativa vigente.
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowGuideModal(false)}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
        <div className="modal-backdrop show"></div>
      </div>
    </div>
  );
};

export default OperazioniDaInviare;