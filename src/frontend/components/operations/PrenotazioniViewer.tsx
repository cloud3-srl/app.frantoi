import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/it';

// Funzione per determinare il colore del testo (nero o bianco) in base al contrasto
const getContrastColor = (hexColor: string): string => {
  if (!hexColor || !hexColor.startsWith('#')) return 'white';
  
  const hex = hexColor.slice(1);
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Formula YIQ per calcolare la luminosità percepita
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // Ritorna bianco o nero in base alla luminosità
  return (yiq >= 128) ? 'black' : 'white';
};
// Non usiamo react-to-print per evitare problemi di tipi
// import { useReactToPrint } from 'react-to-print';

// Configurazione di moment.js
moment.locale('it');

// Props del componente
interface PrenotazioniViewerProps {
  companyId?: number;
  companyCode?: string;
}

// Interfaccia Prenotazione
interface Prenotazione {
  id: number;
  id_cliente: number;
  nome_cliente: string;
  tipologia_oliva: number;
  nome_oliva: string;
  quantita_kg: number;
  data_inizio: Date | string;
  data_fine: Date | string;
  id_linea: number;
  nome_linea: string;
  stato: 'Provvisorio' | 'Confermato' | 'Modificato';
  note?: string;
  cellulare?: string;
  mail?: string;
  data_mail?: Date | string;
  data_whatsapp?: Date | string;
  id_user: number;
  flagcproprio?: boolean;
  flag_chiuso?: boolean;
  id_conferimento?: number;
}

// Interfaccia per le linee di lavorazione
interface LineaLavorazione {
  id: number;
  descrizione: string;
  colore?: string; // Colore per identificare la linea nel calendario
}

const PrenotazioniViewer: React.FC<PrenotazioniViewerProps> = ({ companyId, companyCode }) => {
  // Stati per i dati
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [linee, setLinee] = useState<LineaLavorazione[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stati per i filtri
  const [dataInizioFiltro, setDataInizioFiltro] = useState<string>(moment().format('YYYY-MM-DD'));
  const [dataFineFiltro, setDataFineFiltro] = useState<string>(moment().format('YYYY-MM-DD'));
  const [lineaFiltro, setLineaFiltro] = useState<number>(0);
  const [statoFiltro, setStatoFiltro] = useState<string>("Confermato");
  const [filtroChiuso, setFiltroChiuso] = useState<string>("da_conferire"); // Opzioni: "da_conferire", "conferite", "tutte"
  const [filtriCompressi, setFiltriCompressi] = useState<boolean>(true);
  const [prenotazioniFiltrate, setPrenotazioniFiltrate] = useState<Prenotazione[]>([]);
  
  // Stato per la prenotazione selezionata
  const [prenotazioneSelezionata, setPrenotazioneSelezionata] = useState<Prenotazione | null>(null);
  
  // Non è più necessario il riferimento per la stampa poiché usiamo window.print()
  
  // Navigazione
  const navigate = useNavigate();
  
  // Funzione per la stampa
  // Implementazione della funzione di stampa
  const handlePrint = () => {
    // Soluzione temporanea: usa window.print() per stampare la pagina
    window.print();
  };
  
  // Carica i dati all'avvio
  useEffect(() => {
    if (!companyId || !companyCode) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Carica le prenotazioni
        const prenotazioniResponse = await axios.get(`/api/company/${companyCode}/prenotazioni`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (prenotazioniResponse.data.success) {
          // Formatta le date
          const prenotazioniFormatted = prenotazioniResponse.data.data.map((p: any) => ({
            ...p,
            data_inizio: new Date(p.data_inizio),
            data_fine: new Date(p.data_fine),
            data_mail: p.data_mail ? new Date(p.data_mail) : null,
            data_whatsapp: p.data_whatsapp ? new Date(p.data_whatsapp) : null
          }));
          setPrenotazioni(prenotazioniFormatted);
        } else {
          setError('Errore nel caricamento delle prenotazioni');
        }
        
        // Carica le linee di lavorazione
        const lineeResponse = await axios.get(`/api/company/${companyId}/tables/linee`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (lineeResponse.data.success) {
          setLinee(lineeResponse.data.data || []);
        } else {
          setError('Errore nel caricamento delle linee di lavorazione');
        }
      } catch (err) {
        console.error('Errore nel recupero dei dati:', err);
        setError('Errore nella connessione al server');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [companyId, companyCode]);
  
  // Aggiorna le prenotazioni filtrate quando cambiano i filtri o i dati
  useEffect(() => {
    if (!prenotazioni.length) {
      setPrenotazioniFiltrate([]);
      return;
    }
    
    let risultatiFiltrati = [...prenotazioni];
    
    // Filtra per intervallo di date
    if (dataInizioFiltro) {
      const dataInizio = moment(dataInizioFiltro).startOf('day');
      risultatiFiltrati = risultatiFiltrati.filter(p => 
        moment(p.data_inizio).isSameOrAfter(dataInizio)
      );
    }
    
    if (dataFineFiltro) {
      const dataFine = moment(dataFineFiltro).endOf('day');
      risultatiFiltrati = risultatiFiltrati.filter(p => 
        moment(p.data_inizio).isSameOrBefore(dataFine)
      );
    }
    
    // Filtra per linea
    if (lineaFiltro > 0) {
      risultatiFiltrati = risultatiFiltrati.filter(p => p.id_linea === lineaFiltro);
    }
    
    // Filtra per stato
    if (statoFiltro) {
      risultatiFiltrati = risultatiFiltrati.filter(p => p.stato === statoFiltro);
    }
    
    // Filtra per flag_chiuso (Da Conferire / Conferite / Tutte)
    if (filtroChiuso === "da_conferire") {
      risultatiFiltrati = risultatiFiltrati.filter(p => !p.flag_chiuso);
    } else if (filtroChiuso === "conferite") {
      risultatiFiltrati = risultatiFiltrati.filter(p => p.flag_chiuso);
    }
    // Per "tutte" non filtriamo
    
    // Ordinamento per data di inizio
    risultatiFiltrati.sort((a, b) => {
      const dateA = moment(a.data_inizio);
      const dateB = moment(b.data_inizio);
      return dateA.diff(dateB);
    });
    
    setPrenotazioniFiltrate(risultatiFiltrati);
  }, [prenotazioni, dataInizioFiltro, dataFineFiltro, lineaFiltro, statoFiltro, filtroChiuso]);
  
  // Gestori per i filtri rapidi
  const filtraOggi = () => {
    const oggi = moment().format('YYYY-MM-DD');
    setDataInizioFiltro(oggi);
    setDataFineFiltro(oggi);
  };
  
  const filtraDomani = () => {
    const domani = moment().add(1, 'day').format('YYYY-MM-DD');
    setDataInizioFiltro(domani);
    setDataFineFiltro(domani);
  };
  
  const filtraSettimana = () => {
    setDataInizioFiltro(moment().format('YYYY-MM-DD'));
    setDataFineFiltro(moment().add(7, 'days').format('YYYY-MM-DD'));
  };
  
  // Gestisce la selezione di una prenotazione
  const handleSelectPrenotazione = (prenotazione: Prenotazione) => {
    setPrenotazioneSelezionata(prenotazione);
  };
  
  // Apre il form di conferimento con i dati precompilati
  const apriConferimentoConDati = (prenotazione = prenotazioneSelezionata) => {
    if (!prenotazione || prenotazione.id_cliente <= 0) return;
    
    // Verifica se la prenotazione è già stata conferita
    if (prenotazione.flag_chiuso) {
      alert("Questa prenotazione è già stata conferita!");
      return;
    }

    // Prepara i parametri URL standard (metodo tradizionale)
    const params = new URLSearchParams({
      prenotazioneId: prenotazione.id.toString(),
      clienteId: prenotazione.id_cliente.toString(),
      oliveId: prenotazione.tipologia_oliva.toString(),
      kgOlive: prenotazione.quantita_kg.toString(),
      dataPrenotazione: moment(prenotazione.data_inizio).format('YYYY-MM-DD')
    });

    // Naviga al form di conferimento con i parametri completi
    navigate(`/company/${companyCode}/operations/conferimento-cterzi?${params.toString()}`);
  };
  
  // Rendering del componente
  return (
    <div className="prenotazioni-viewer container-fluid px-2 px-md-3">
      <h2 className="page-title">
        <i className="fas fa-calendar-check"></i> Visualizzazione Prenotazioni
      </h2>
      
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      
      {/* Filtri */}
      <div className="filters-container card mb-3">
        <div className="filters-header card-header bg-light">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <h3 className="mb-2 mb-md-0">
              Filtri 
              <button 
                className="btn btn-sm btn-link ml-2" 
                onClick={() => setFiltriCompressi(!filtriCompressi)}
                style={{ padding: '0 5px', fontSize: '14px' }}
              >
                <i className={`fas fa-chevron-${filtriCompressi ? 'down' : 'up'}`}></i>
              </button>
            </h3>
            <div className="filter-summary flex-grow-1 mb-2 mb-md-0 text-center">
              {filtriCompressi && (
                <div className="filter-badges d-flex flex-wrap justify-content-center justify-content-md-start">
                  <span className="badge badge-primary mr-1 mb-1">
                    Da: {moment(dataInizioFiltro).format('DD/MM/YYYY')}
                  </span>
                  <span className="badge badge-primary mr-1 mb-1">
                    A: {moment(dataFineFiltro).format('DD/MM/YYYY')}
                  </span>
                  <span className="badge badge-primary mr-1 mb-1">
                    Linea: {lineaFiltro === 0 ? 'Tutte' : linee.find(l => l.id === lineaFiltro)?.descrizione || lineaFiltro}
                  </span>
                  <span className="badge badge-primary mr-1 mb-1">
                    Stato: {statoFiltro || 'Tutti'}
                  </span>
                  <span className="badge badge-primary mb-1">
                    {filtroChiuso === "da_conferire" ? "Da Conferire" : 
                     filtroChiuso === "conferite" ? "Conferite" : "Tutte"}
                  </span>
                </div>
              )}
            </div>
            <div className="quick-filters d-flex flex-wrap justify-content-center justify-content-md-end">
              <button 
                type="button" 
                className="btn btn-outline-primary btn-sm mr-1 mb-1"
                onClick={filtraOggi}
              >
                <i className="fas fa-calendar-day"></i> Oggi
              </button>
              <button 
                type="button" 
                className="btn btn-outline-primary btn-sm mr-1 mb-1"
                onClick={filtraDomani}
              >
                <i className="fas fa-calendar-day"></i> Domani
              </button>
              <button 
                type="button" 
                className="btn btn-outline-primary btn-sm mb-1"
                onClick={filtraSettimana}
              >
                <i className="fas fa-calendar-week"></i> Settimana
              </button>
            </div>
          </div>
        </div>
        
        {!filtriCompressi && (
          <div className="filters-body card-body">
            <div className="row">
              <div className="col-12 col-md-6 col-lg mb-3 mb-lg-0">
                <label htmlFor="dataInizioFiltro">Data Da:</label>
                <input
                  type="date"
                  id="dataInizioFiltro"
                  className="form-control"
                  value={dataInizioFiltro}
                  onChange={(e) => setDataInizioFiltro(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-6 col-lg mb-3 mb-lg-0">
                <label htmlFor="dataFineFiltro">Data A:</label>
                <input
                  type="date"
                  id="dataFineFiltro"
                  className="form-control"
                  value={dataFineFiltro}
                  onChange={(e) => setDataFineFiltro(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-6 col-lg mb-3 mb-lg-0">
                <label htmlFor="lineaFiltro">Linea:</label>
                <select
                  id="lineaFiltro"
                  className="form-control"
                  value={lineaFiltro}
                  onChange={(e) => setLineaFiltro(parseInt(e.target.value))}
                >
                  <option value="0">Tutte le linee</option>
                  {linee.map(linea => (
                    <option key={linea.id} value={linea.id}>
                      {linea.descrizione}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6 col-lg mb-3 mb-lg-0">
                <label htmlFor="statoFiltro">Stato:</label>
                <select
                  id="statoFiltro"
                  className="form-control"
                  value={statoFiltro}
                  onChange={(e) => setStatoFiltro(e.target.value)}
                >
                  <option value="">Tutti gli stati</option>
                  <option value="Provvisorio">Provvisorio</option>
                  <option value="Confermato">Confermato</option>
                  <option value="Modificato">Modificato</option>
                </select>
              </div>
              <div className="col-12 col-lg mb-3 mb-lg-0">
                <label htmlFor="filtroChiuso">Prenotazioni:</label>
                <select
                  id="filtroChiuso"
                  className="form-control"
                  value={filtroChiuso}
                  onChange={(e) => setFiltroChiuso(e.target.value)}
                >
                  <option value="da_conferire">Da Conferire</option>
                  <option value="conferite">Conferite</option>
                  <option value="tutte">Tutte</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tabella prenotazioni */}
      <div className="table-container card">
        <div className="table-header card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
          <h3 className="mb-2 mb-md-0">Elenco Prenotazioni</h3>
          <div className="d-flex align-items-center">
            <span className="results-count mr-3 badge badge-info p-2">
              <strong>{prenotazioniFiltrate.length}</strong> risultati
            </span>
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={handlePrint}
              title="Stampa lista"
            >
              <i className="fas fa-print"></i> Stampa
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Caricamento in corso...</span>
            </div>
          </div>
        ) : prenotazioniFiltrate.length === 0 ? (
          <div className="card-body">
            <div className="alert alert-info text-center">
              <i className="fas fa-info-circle"></i> Nessuna prenotazione trovata con i filtri selezionati.
            </div>
          </div>
        ) : (
          <>
            {/* VISTA DESKTOP */}
            <div className="desktop-view table-responsive card-body p-0">
              <div className="d-print-block d-none mb-3">
                <h2 className="text-center">Elenco Prenotazioni {companyCode}</h2>
                <p className="text-center">
                  {filtroChiuso === "da_conferire" ? "Prenotazioni da conferire" : 
                   filtroChiuso === "conferite" ? "Prenotazioni conferite" : "Tutte le prenotazioni"}
                  &nbsp;-&nbsp;
                  Periodo: {moment(dataInizioFiltro).format('DD/MM/YYYY')} - {moment(dataFineFiltro).format('DD/MM/YYYY')}
                </p>
              </div>
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>Data/Ora</th>
                    <th>Cliente</th>
                    <th>Tipologia Olive</th>
                    <th>Quantità (kg)</th>
                    <th>Linea</th>
                    <th>Stato</th>
                    <th className="d-print-none">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                {prenotazioniFiltrate.map(prenotazione => (
                  <tr 
                    key={prenotazione.id}
                    className={`${prenotazioneSelezionata?.id === prenotazione.id ? 'selected' : ''} ${prenotazione.flag_chiuso ? 'table-success' : ''}`}
                    onClick={() => handleSelectPrenotazione(prenotazione)}
                  >
                    <td>
                      {moment(prenotazione.data_inizio).format('DD/MM/YYYY HH:mm')}
                      <br />
                      <small>fino a {moment(prenotazione.data_fine).format('HH:mm')}</small>
                    </td>
                    <td>
                      {prenotazione.nome_cliente || 'Cliente non specificato'}
                      {prenotazione.cellulare && (
                        <div><small><i className="fas fa-phone"></i> {prenotazione.cellulare}</small></div>
                      )}
                    </td>
                    <td className="d-none d-md-table-cell">{prenotazione.nome_oliva}</td>
                    <td className="d-none d-md-table-cell">{prenotazione.quantita_kg}</td>
                    <td className="d-none d-md-table-cell">
                      {(() => {
                        const linea = linee.find(l => l.id === prenotazione.id_linea);
                        const lineaColor = linea?.colore || '#63666A';
                        return (
                          <span style={{ 
                            display: 'inline-block', 
                            backgroundColor: lineaColor,
                            color: getContrastColor(lineaColor),
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}>
                            {prenotazione.nome_linea}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <span className={`badge badge-${
                        prenotazione.stato === 'Confermato' ? 'success' :
                        prenotazione.stato === 'Modificato' ? 'warning' : 'info'
                      }`}>
                        {prenotazione.stato}
                      </span>
                    </td>
                    <td className="d-print-none">
                      <div className="d-flex flex-column flex-md-row gap-2">
                        <button
                          type="button"
                          className="btn btn-info btn-sm mb-1 mb-md-0 mr-md-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPrenotazione(prenotazione);
                          }}
                          title="Visualizza dettagli"
                        >
                          <i className="fas fa-info-circle"></i> <span className="d-none d-md-inline">Dettagli</span>
                        </button>
                        
                        {prenotazione.id_cliente > 0 && !prenotazione.flag_chiuso && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              apriConferimentoConDati(prenotazione);
                            }}
                            title="Crea conferimento"
                          >
                            <i className="fas fa-exchange-alt"></i> <span className="d-none d-md-inline">Conferimento</span>
                          </button>
                        )}
                        
                        {prenotazione.flag_chiuso && (
                          <span className="badge badge-success">
                            <i className="fas fa-check-circle"></i> Conferita
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* VISTA MOBILE */}
            <div className="mobile-view">
              {prenotazioniFiltrate.length > 0 ? (
                <div className="prenotazione-cards">
                  {prenotazioniFiltrate.map(prenotazione => (
                    <div 
                      key={prenotazione.id} 
                      className={`prenotazione-card ${prenotazione.flag_chiuso ? 'conferita' : ''}`}
                      onClick={() => handleSelectPrenotazione(prenotazione)}
                    >
                      <div className="card-header">
                        <div className="prenotazione-id-container">
                          <span className="prenotazione-id">#{prenotazione.id}</span>
                          {prenotazione.flag_chiuso && (
                            <span className="conferita-badge">
                              <i className="fas fa-check-circle"></i> Conferita
                            </span>
                          )}
                        </div>
                        <span className={`prenotazione-status status-${prenotazione.stato}`}>
                          {prenotazione.stato}
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="card-row">
                          <div className="card-label">Cliente:</div>
                          <div className="card-value">
                            {prenotazione.nome_cliente || 'Non specificato'}
                            {prenotazione.cellulare && (
                              <div className="cliente-contatto">
                                <i className="fas fa-phone"></i> {prenotazione.cellulare}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="card-row">
                          <div className="card-label">Data:</div>
                          <div className="card-value card-date">
                            <div className="date-primary">
                              <i className="far fa-calendar-alt mr-1"></i> {moment(prenotazione.data_inizio).format('DD/MM/YYYY')}
                            </div>
                            <div className="date-secondary">
                              <i className="far fa-clock mr-1"></i> {moment(prenotazione.data_inizio).format('HH:mm')} - {moment(prenotazione.data_fine).format('HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="card-info-row">
                          <div className="info-item">
                            <div className="info-label">Olive</div>
                            <div className="info-value">{prenotazione.nome_oliva || 'Non specificato'}</div>
                          </div>
                          <div className="info-item">
                            <div className="info-label">Quantità</div>
                            <div className="info-value">{prenotazione.quantita_kg} kg</div>
                          </div>
                          <div className="info-item">
                            <div className="info-label">Linea</div>
                            <div className="info-value">
                              {(() => {
                                const linea = linee.find(l => l.id === prenotazione.id_linea);
                                const lineaColor = linea?.colore || '#63666A';
                                return (
                                  <span style={{ 
                                    display: 'inline-block', 
                                    backgroundColor: lineaColor,
                                    color: getContrastColor(lineaColor),
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    width: '100%',
                                    textAlign: 'center'
                                  }}>
                                    {prenotazione.nome_linea || 'N/D'}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        {prenotazione.note && (
                          <div className="card-note">
                            <i className="fas fa-comment-alt"></i> {prenotazione.note.length > 50 ? `${prenotazione.note.substring(0, 50)}...` : prenotazione.note}
                          </div>
                        )}
                      </div>
                      <div className="card-actions">
                        <button
                          className="card-action-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPrenotazione(prenotazione);
                          }}
                          aria-label="Visualizza dettagli"
                        >
                          <i className="fas fa-info-circle"></i>
                          <span className="action-label">Dettagli</span>
                        </button>
                        
                        {prenotazione.id_cliente > 0 && !prenotazione.flag_chiuso && (
                          <button
                            className="card-action-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              apriConferimentoConDati(prenotazione);
                            }}
                            aria-label="Crea conferimento"
                          >
                            <i className="fas fa-exchange-alt"></i>
                            <span className="action-label">Conferimento</span>
                          </button>
                        )}
                        
                        {prenotazione.flag_chiuso && (
                          <div className="card-action-button disabled">
                            <i className="fas fa-check-circle"></i>
                            <span className="action-label">Conferita</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results-mobile">
                  <i className="fas fa-search mb-3"></i>
                  <p>Nessuna prenotazione trovata con i filtri selezionati.</p>
                  <button 
                    className="btn btn-sm btn-outline-primary mt-2" 
                    onClick={() => {
                      setDataInizioFiltro(moment().format('YYYY-MM-DD'));
                      setDataFineFiltro(moment().add(7, 'days').format('YYYY-MM-DD'));
                      setLineaFiltro(0);
                      setStatoFiltro('');
                      setFiltroChiuso('tutte');
                    }}
                  >
                    Reimposta filtri
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Dettagli prenotazione selezionata */}
      {prenotazioneSelezionata && (
        <div className="prenotazione-details mt-4">
          <h3 className="d-flex justify-content-between align-items-center">
            <span className="details-title">
              Dettagli Prenotazione #{prenotazioneSelezionata.id}
              <span className={`details-status-badge badge badge-${
                prenotazioneSelezionata.stato === 'Confermato' ? 'success' :
                prenotazioneSelezionata.stato === 'Modificato' ? 'warning' : 'info'
              } ml-2`}>
                {prenotazioneSelezionata.stato}
              </span>
            </span>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setPrenotazioneSelezionata(null)}
            >
              <i className="fas fa-times"></i> <span className="d-none d-md-inline">Chiudi</span>
            </button>
          </h3>
          <div className="card details-card">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 details-section">
                  <h5 className="section-title">Informazioni Cliente</h5>
                  <div className="details-item">
                    <span className="details-label">Cliente:</span>
                    <span className="details-value">{prenotazioneSelezionata.nome_cliente || 'Non specificato'}</span>
                  </div>
                  
                  {prenotazioneSelezionata.cellulare && (
                    <div className="details-item">
                      <span className="details-label">Cellulare:</span>
                      <span className="details-value">
                        <a href={`tel:${prenotazioneSelezionata.cellulare}`} className="contact-link">
                          <i className="fas fa-phone mr-1"></i> {prenotazioneSelezionata.cellulare}
                        </a>
                      </span>
                    </div>
                  )}
                  
                  {prenotazioneSelezionata.mail && (
                    <div className="details-item">
                      <span className="details-label">Email:</span>
                      <span className="details-value">
                        <a href={`mailto:${prenotazioneSelezionata.mail}`} className="contact-link">
                          <i className="fas fa-envelope mr-1"></i> {prenotazioneSelezionata.mail}
                        </a>
                      </span>
                    </div>
                  )}
                  
                  {prenotazioneSelezionata.flag_chiuso && (
                    <div className="alert alert-success mt-3">
                      <i className="fas fa-check-circle"></i> Prenotazione già conferita
                      {prenotazioneSelezionata.id_conferimento && 
                        <span> (Conferimento #{prenotazioneSelezionata.id_conferimento})</span>
                      }
                    </div>
                  )}
                </div>
                
                <div className="col-md-6 details-section">
                  <h5 className="section-title">Informazioni Prenotazione</h5>
                  <div className="details-item">
                    <span className="details-label">Data:</span>
                    <span className="details-value">{moment(prenotazioneSelezionata.data_inizio).format('DD/MM/YYYY')}</span>
                  </div>
                  
                  <div className="details-item">
                    <span className="details-label">Orario:</span>
                    <span className="details-value">
                      {moment(prenotazioneSelezionata.data_inizio).format('HH:mm')} - {moment(prenotazioneSelezionata.data_fine).format('HH:mm')}
                    </span>
                  </div>
                  
                  <div className="details-item">
                    <span className="details-label">Olive:</span>
                    <span className="details-value">{prenotazioneSelezionata.nome_oliva}</span>
                  </div>
                  
                  <div className="details-item">
                    <span className="details-label">Quantità:</span>
                    <span className="details-value">{prenotazioneSelezionata.quantita_kg} kg</span>
                  </div>
                  
                  <div className="details-item">
                    <span className="details-label">Linea:</span>
                    <span className="details-value">
                      {(() => {
                        const linea = linee.find(l => l.id === prenotazioneSelezionata.id_linea);
                        const lineaColor = linea?.colore || '#63666A';
                        return (
                          <span style={{ 
                            display: 'inline-block', 
                            backgroundColor: lineaColor,
                            color: getContrastColor(lineaColor),
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}>
                            {prenotazioneSelezionata.nome_linea}
                          </span>
                        );
                      })()}
                    </span>
                  </div>
                </div>
              </div>
              
              {prenotazioneSelezionata.note && (
                <div className="row mt-3">
                  <div className="col-12">
                    <h5 className="section-title">Note</h5>
                    <div className="p-3 bg-light rounded notes-container">
                      {prenotazioneSelezionata.note}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="row mt-4">
                <div className="col-12 text-right">
                  {prenotazioneSelezionata.id_cliente > 0 && !prenotazioneSelezionata.flag_chiuso && (
                    <button
                      type="button"
                      className="btn btn-primary action-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        apriConferimentoConDati();
                      }}
                    >
                      <i className="fas fa-exchange-alt"></i> <span className="btn-text">Crea Conferimento</span>
                    </button>
                  )}
                  
                  {prenotazioneSelezionata.flag_chiuso && (
                    <button
                      type="button"
                      className="btn btn-success action-btn"
                      disabled
                    >
                      <i className="fas fa-check-circle"></i> <span className="btn-text">Già conferita</span>
                    </button>
                  )}
                  
                  <button
                    type="button"
                    className="btn btn-outline-secondary ml-2 d-md-none action-btn-secondary"
                    onClick={() => setPrenotazioneSelezionata(null)}
                  >
                    <i className="fas fa-times"></i> <span className="btn-text">Chiudi</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        /* Stili per la stampa */
        @media print {
          body * {
            visibility: hidden;
          }
          .table-responsive,
          .table-responsive * {
            visibility: visible;
          }
          .table-responsive {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .d-print-block {
            display: block !important;
          }
          .d-print-none {
            display: none !important;
          }
        }
        
        /* Stili responsivi per mobile/desktop */
        @media screen and (max-width: 768px) {
          .desktop-view {
            display: none !important;
          }
          
          .mobile-view {
            display: block !important;
          }
          
          .filters-container {
            flex-direction: column;
            gap: 10px;
          }
          
          .filter-buttons {
            display: flex;
            justify-content: space-between;
            width: 100%;
          }
          
          .filter-button {
            flex: 1;
            white-space: nowrap;
            padding: 8px 5px;
            font-size: 0.9rem;
          }
          
          .quick-filters {
            margin-top: 10px;
            display: flex;
            justify-content: center;
            width: 100%;
          }
          
          .prenotazione-details .card-body {
            padding: 10px;
          }
          
          .prenotazione-details h5 {
            font-size: 1rem;
            margin-top: 10px;
          }
          
          .prenotazione-details .row {
            margin-left: -5px;
            margin-right: -5px;
          }
          
          .prenotazione-details .col-md-6 {
            padding-left: 5px;
            padding-right: 5px;
          }
        }
        
        @media screen and (min-width: 769px) {
          .mobile-view {
            display: none !important;
          }
          
          .desktop-view {
            display: block !important;
          }
        }
        
        /* Stili per le card su mobile */
        .prenotazione-cards {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 15px;
        }
        
        .prenotazione-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid #e4e9f0;
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .prenotazione-card:active {
          transform: translateY(1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .prenotazione-card.conferita {
          border-left: 4px solid #28a745;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          background-color: #f5f7fa;
          border-bottom: 1px solid #e4e9f0;
        }
        
        .prenotazione-id {
          font-weight: bold;
          color: #444;
        }
        
        .prenotazione-status {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .status-Confermato {
          background-color: #e3f2e3;
          color: #2a8d2a;
        }
        
        .status-Provvisorio {
          background-color: #fff3e0;
          color: #b86e00;
        }
        
        .status-Modificato {
          background-color: #e8f4fd;
          color: #0366d6;
        }
        
        .card-body {
          padding: 15px;
        }
        
        .card-row {
          display: flex;
          margin-bottom: 8px;
        }
        
        .card-label {
          font-weight: 500;
          flex: 0 0 80px;
          color: #555;
          font-size: 0.9rem;
        }
        
        .card-value {
          flex: 1;
          font-size: 0.95rem;
        }
        
        .card-info-row {
          display: flex;
          margin-top: 12px;
          margin-bottom: 12px;
          border-top: 1px dashed #eee;
          padding-top: 12px;
        }
        
        .info-item {
          flex: 1;
          text-align: center;
        }
        
        .info-label {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 4px;
        }
        
        .info-value {
          font-weight: 600;
          font-size: 1rem;
        }
        
        .card-actions {
          display: flex;
          border-top: 1px solid #eee;
          background: #fcfcfc;
        }
        
        .card-action-button {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          border-right: 1px solid #eee;
          cursor: pointer;
          font-size: 1.1rem;
          color: #555;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: background-color 0.2s;
        }
        
        .card-action-button:last-child {
          border-right: none;
        }
        
        .card-action-button:hover {
          background: #f0f0f0;
        }
        
        /* Colori per le icone delle azioni */
        .card-action-button i.fa-info-circle {
          color: #3498db;
        }
        
        .card-action-button i.fa-exchange-alt {
          color: #2ecc71;
        }
        
        .card-action-button i.fa-check-circle {
          color: #28a745;
        }
        
        /* Nuovi stili per migliorare la vista mobile */
        .prenotazione-id-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .conferita-badge {
          font-size: 0.75rem;
          color: #28a745;
          background-color: rgba(40, 167, 69, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
        }
        
        .cliente-contatto {
          font-size: 0.8rem;
          color: #666;
          margin-top: 3px;
        }
        
        .card-date {
          display: flex;
          flex-direction: column;
        }
        
        .date-primary {
          font-weight: 500;
        }
        
        .date-secondary {
          font-size: 0.85rem;
          color: #666;
          margin-top: 2px;
        }
        
        .card-note {
          margin-top: 10px;
          padding: 8px;
          background-color: #f8f9fa;
          border-radius: 4px;
          font-size: 0.9rem;
          color: #666;
          border-left: 3px solid #ddd;
        }
        
        .action-label {
          font-size: 0.8rem;
          margin-left: 5px;
          display: none;
        }
        
        @media screen and (min-width: 400px) {
          .action-label {
            display: inline;
          }
        }
        
        .card-action-button.disabled {
          opacity: 0.7;
          pointer-events: none;
        }
        
        .no-results-mobile {
          text-align: center;
          padding: 30px 15px;
          background: #f8f9fa;
          border-radius: 8px;
          color: #666;
          margin: 20px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .no-results-mobile i {
          font-size: 2rem;
          color: #aaa;
          margin-bottom: 10px;
        }
        
        /* Stili per la vista dettagli */
        .details-card {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: none;
          border-radius: 8px;
        }
        
        .details-title {
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .details-status-badge {
          font-size: 0.75rem;
          padding: 0.3em 0.6em;
        }
        
        .details-section {
          margin-bottom: 20px;
        }
        
        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #495057;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .details-item {
          margin-bottom: 10px;
          display: flex;
          flex-direction: column;
        }
        
        @media screen and (min-width: 576px) {
          .details-item {
            flex-direction: row;
          }
        }
        
        .details-label {
          font-weight: 600;
          color: #555;
          min-width: 100px;
          margin-right: 10px;
        }
        
        .details-value {
          flex: 1;
        }
        
        .contact-link {
          color: #3498db;
          text-decoration: none;
        }
        
        .contact-link:hover {
          text-decoration: underline;
        }
        
        .notes-container {
          background-color: #f8f9fa;
          border-left: 3px solid #ddd;
          line-height: 1.6;
        }
        
        .action-btn {
          border-radius: 4px;
          padding: 8px 16px;
        }
        
        .action-btn-secondary {
          border-radius: 4px;
          padding: 8px 16px;
        }
        
        @media screen and (max-width: 576px) {
          .btn-text {
            display: none;
          }
          
          .action-btn, .action-btn-secondary {
            padding: 8px;
            width: 40px;
            height: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
        }
        
        /* Altri stili */
        .filter-badges {
          display: inline-flex;
          gap: 5px;
          flex-wrap: wrap;
        }
        
        .badge {
          font-size: 0.8rem;
          padding: 0.4em 0.6em;
          margin-right: 5px;
        }
        
        .table-hover tbody tr:hover {
          background-color: rgba(0,123,255,0.1);
          cursor: pointer;
        }
        
        tr.selected {
          background-color: rgba(0,123,255,0.2) !important;
        }
        
        .gap-2 {
          gap: 0.5rem;
        }
        
        .mr-1 {
          margin-right: 0.25rem;
        }
        
        .page-title {
          margin-bottom: 20px;
          color: #4a86e8;
        }
        
        .filters-container {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .quick-filters button {
          margin-left: 8px;
        }
        
        .table-container {
          background-color: white;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .table-header {
          margin-bottom: 15px;
        }
        
        table tr.selected {
          background-color: #e8f4f8 !important;
        }
        
        .prenotazione-details {
          background-color: white;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .badge-success {
          background-color: #28a745;
          color: white;
        }
        
        .badge-warning {
          background-color: #ffc107;
          color: black;
        }
        
        .badge-info {
          background-color: #17a2b8;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default PrenotazioniViewer;