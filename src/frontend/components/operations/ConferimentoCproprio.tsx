import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

interface ConferimentoCproprioProps {
  companyId?: number;
  companyCode?: string;
  key?: string; // Aggiunto per evitare warning per prop non utilizzata
  preCompilazioneData?: {
    prenotazioneId?: number;
    clienteId?: number;
    oliveId?: number;
    kgOlive?: number;
    dataPrenotazione?: string;
    nomeCliente?: string;
    nomeOliva?: string;
  };
}

interface Cliente {
  id: number;
  descrizione: string;
  olivedef?: number; // ID dell'articolo olive di default
  id_sian?: string; // ID SIAN per il cliente
  flagdoc?: boolean; // Flag che indica se il cliente ha documenti
}

interface ArticoloOlive {
  id: number;
  descrizione: string;
  categ_olio?: number;
  macroarea?: number;
  origispeci?: string;
  flag_bio: boolean;
  // Altri campi dell'articolo
}

interface ArticoloOlio {
  id: number;
  descrizione: string;
}

interface OliveToOlio {
  id: number;
  cod_olive: number;
  cod_olio: number;
  flag_default: boolean;
}

interface Macroarea {
  id: number;
  descrizione: string;
}

interface OrigineSpecifica {
  id: number;
  descrizione: string;
  flag_dop: boolean;
  flag_raccolta?: boolean;
}

interface Magazzino {
  id: number;
  descrizione: string;
  capacita?: number;
  note?: string;
}

interface Cisterna {
  id: string;
  descrizione: string;
  id_magazzino?: number;
  capacita?: number;
  giacenza?: number;
  id_articolo?: number;
  id_codicesoggetto?: number;
}

interface ConferimentoForm {
  cliente_id: number; // Sarà sempre il soggetto con ID 0
  data_arrivo: string;
  data_raccolta: string;
  ora_raccolta: string;
  num_documento: string;
  data_documento: string;
  olive_id: number;
  olio_id: number;
  macroarea?: number;
  origispeci?: string;
  flag_bio?: boolean;
  flag_dop?: boolean;
  flag_igp?: boolean;
  kg_olive_conferite: number;
  prezzo_molitura_kg: number;
  prezzo_molitura: number;
  kg_olio_ottenuto: number; // Non obbligatorio ma tipizzato come number
  magazzino_id?: number; // ID del magazzino dove verrà stoccato l'olio
  cisterna_id?: string; // ID della cisterna dove verrà stoccato l'olio
}

// Componente FormField per gestire input e tooltip informativi
interface FormFieldProps {
  id: string;
  label: string;
  description: string;
  icon?: string;
  children: React.ReactNode;
  required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ id, label, description, icon, children, required }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const formGroupRef = useRef<HTMLDivElement>(null);
  
  // Gestisce il click sul documento per chiudere il tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formGroupRef.current && !formGroupRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div ref={formGroupRef} className={`form-group ${showTooltip ? 'tooltip-active' : ''}`}>
      <label htmlFor={id}>
        {icon && <i className={`${icon} me-1`} style={{marginRight: '5px'}}></i>} {label}{required && '*'}
        <span 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowTooltip(!showTooltip);
          }}
          style={{
            display: 'inline-block',
            marginLeft: '8px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <i 
            className="fas fa-question-circle"
            style={{
              color: '#4a8f29',
              fontSize: '18px',
              display: 'inline-block',
              width: '18px',
              height: '18px'
            }}
            title="Mostra informazioni"
          ></i>
        </span>
      </label>
      <small style={{
        display: showTooltip ? 'block' : 'none',
        padding: '6px 10px',
        marginTop: '5px',
        backgroundColor: '#f8f9fa', 
        borderLeft: '3px solid #4a8f29',
        borderRadius: '0 4px 4px 0',
        marginBottom: '6px'
      }}>{description}</small>
      {children}
    </div>
  );
};

const ConferimentoCproprio: React.FC<ConferimentoCproprioProps> = ({ companyId, companyCode }) => {
  // Ottiene i parametri dalla URL
  const location = useLocation();
  
  // Stati per i dati
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [proprioCliente, setProprioCliente] = useState<Cliente | null>(null);
  const [articoliOlive, setArticoliOlive] = useState<ArticoloOlive[]>([]);
  const [articoliOlio, setArticoliOlio] = useState<ArticoloOlio[]>([]);
  const [oliveToOli, setOliveToOli] = useState<OliveToOlio[]>([]);
  const [macroaree, setMacroaree] = useState<Macroarea[]>([]);
  const [originiSpecifiche, setOriginiSpecifiche] = useState<OrigineSpecifica[]>([]);
  const [magazzini, setMagazzini] = useState<Magazzino[]>([]);
  const [cisterne, setCisterne] = useState<Cisterna[]>([]);
  
  // Stato per il form
  const [form, setForm] = useState<ConferimentoForm>({
    cliente_id: 0, // Il cliente è preimpostato al soggetto con ID 0
    data_arrivo: new Date().toISOString().slice(0, 10),
    data_raccolta: new Date().toISOString().slice(0, 10),
    ora_raccolta: '08:00',
    num_documento: '',
    data_documento: new Date().toISOString().slice(0, 10),
    olive_id: 0,
    olio_id: 0,
    kg_olive_conferite: 0,
    prezzo_molitura_kg: 0,
    prezzo_molitura: 0,
    kg_olio_ottenuto: 0,
    magazzino_id: undefined,
    cisterna_id: undefined
  });
  
  // Stati per il caricamento e gli errori
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Stato per gestire se i campi data/ora raccolta sono obbligatori
  const [isRaccoltaRequired, setIsRaccoltaRequired] = useState<boolean>(false);
  
  // Stati per gestire la visualizzazione dei dettagli
  const [showOliveDetails, setShowOliveDetails] = useState<boolean>(false);
  const [showOlioDetails, setShowOlioDetails] = useState<boolean>(false);
  
  // Timestamp iniziale per tracciare i tempi
  useEffect(() => {
    const timestampApertura = new Date();
    console.log('==== TIMESTAMP: APERTURA FORM ====', timestampApertura.toISOString(), timestampApertura.getTime());
    
    // Aggiungiamo al window per tracciamento
    (window as any).timestampApertura = timestampApertura.getTime();
    (window as any).timestampLog = [];
    (window as any).logTiming = (msg: string) => {
      const now = new Date();
      const elapsed = now.getTime() - timestampApertura.getTime();
      (window as any).timestampLog.push({
        msg, 
        timestamp: now.toISOString(),
        elapsed: `${elapsed}ms`
      });
      console.log(`==== TIMESTAMP: ${msg} ==== [+${elapsed}ms]`, now.toISOString());
    };
  }, []);

  // Carica i dati all'avvio
  useEffect(() => {
    if (!companyId || !companyCode) {
      console.log('CompanyId o companyCode mancanti:', { companyId, companyCode });
      return;
    }
    
    const logTiming = (window as any).logTiming || ((msg: string) => console.log(`TIMING: ${msg}`));
    logTiming('INIZIO CARICAMENTO DATI');
    
    console.log('Inizializzazione conferimento con companyId:', companyId, 'e companyCode:', companyCode);
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Carica i clienti (soggetti) dell'azienda
        const clientiResponse = await axios.get(`/api/company/${companyId}/tables/soggetti`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (clientiResponse.data.success) {
          const clientiData = clientiResponse.data.data || [];
          setClienti(clientiData);
          console.log(`Clienti caricati: ${clientiData.length} record`);
          
          // Trova il cliente proprio (ID 0)
          const proprio = clientiData.find((c: Cliente) => c.id === 0);
          if (proprio) {
            setProprioCliente(proprio);
            // Set default olive se il cliente c/proprio ha un'oliva default
            if (proprio.olivedef) {
              setForm(prev => ({
                ...prev,
                olive_id: proprio.olivedef || 0
              }));
            }
          } else {
            console.error('Cliente con ID 0 (c/proprio) non trovato');
            setError('Cliente c/proprio con ID 0 non trovato. Verificare la configurazione del sistema.');
          }
        }
        
        // Carica gli articoli olive
        const oliveResponse = await axios.get('/api/tables/articoli', {
          params: { where: JSON.stringify({ tipologia: 'OL' }) },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (oliveResponse.data.success) {
          setArticoliOlive(oliveResponse.data.success ? oliveResponse.data.data || [] : []);
        }
        
        // Carica gli articoli olio
        const olioResponse = await axios.get('/api/tables/articoli', {
          params: { where: JSON.stringify({ tipologia: 'SF' }) },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (olioResponse.data.success) {
          setArticoliOlio(olioResponse.data.success ? olioResponse.data.data || [] : []);
        }
        
        // Carica le relazioni olive-olio
        const oliveToOliResponse = await axios.get('/api/tables/olive_to_oli', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (oliveToOliResponse.data.success) {
          setOliveToOli(oliveToOliResponse.data.success ? oliveToOliResponse.data.data || [] : []);
        }
        
        // Carica macroaree
        const macroareeResponse = await axios.get('/api/tables/macroaree', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (macroareeResponse.data.success) {
          setMacroaree(macroareeResponse.data.success ? macroareeResponse.data.data || [] : []);
        }
        
        // Carica origini specifiche
        const originiResponse = await axios.get('/api/tables/origini_specifiche', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (originiResponse.data.success) {
          setOriginiSpecifiche(originiResponse.data.success ? originiResponse.data.data || [] : []);
        }
        
        // Carica magazzini
        const magazziniResponse = await axios.get(`/api/company/${companyId}/tables/magazzini`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (magazziniResponse.data.success) {
          setMagazzini(magazziniResponse.data.success ? magazziniResponse.data.data || [] : []);
        }
        
        // Carica cisterne
        const cisterneResponse = await axios.get(`/api/company/${companyId}/tables/cisterne`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (cisterneResponse.data.success) {
          setCisterne(cisterneResponse.data.success ? cisterneResponse.data.data || [] : []);
        }
        
        logTiming('CARICAMENTO DATI COMPLETATO');
      } catch (err) {
        console.error('Errore nel caricamento dei dati:', err);
        setError('Errore nel caricamento dei dati. Riprova più tardi.');
        logTiming('ERRORE CARICAMENTO DATI');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [companyId, companyCode]);

  // Aggiorna automaticamente l'olio quando cambia l'oliva
  useEffect(() => {
    if (form.olive_id && oliveToOli.length > 0) {
      // Cerca la relazione di default
      const defaultRelation = oliveToOli.find(relation => 
        relation.cod_olive === form.olive_id && relation.flag_default
      );
      
      // Se c'è una relazione di default, usa quella
      if (defaultRelation) {
        setForm(prevForm => ({
          ...prevForm,
          olio_id: defaultRelation.cod_olio
        }));
      } else {
        // Altrimenti prendi la prima relazione disponibile
        const anyRelation = oliveToOli.find(relation => relation.cod_olive === form.olive_id);
        if (anyRelation) {
          setForm(prevForm => ({
            ...prevForm,
            olio_id: anyRelation.cod_olio
          }));
        }
      }
      
      // Se abbiamo selezionato un'oliva, aggiorna anche i campi macroarea e origispeci
      if (form.olive_id) {
        const selectedOlive = articoliOlive.find(oliva => oliva.id === form.olive_id);
        if (selectedOlive) {
          setForm(prevForm => ({
            ...prevForm,
            macroarea: selectedOlive.macroarea,
            origispeci: selectedOlive.origispeci,
            flag_bio: selectedOlive.flag_bio
          }));
        }
      }
    }
  }, [form.olive_id, oliveToOli, articoliOlive]);

  // Non calcoliamo più il prezzo molitura per c/proprio

  // Handler per i cambiamenti del form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prevForm => ({
        ...prevForm,
        [name]: checked
      }));
    } else if (type === 'number') {
      let numValue = parseFloat(value);
      if (isNaN(numValue)) numValue = 0;
      
      setForm(prevForm => ({
        ...prevForm,
        [name]: numValue
      }));
    } else {
      setForm(prevForm => ({
        ...prevForm,
        [name]: value
      }));
    }
  };

  // Gestione dell'invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Effettua validazioni
    if (!form.olive_id) {
      setError('Seleziona il tipo di olive');
      return;
    }
    
    if (!form.olio_id) {
      setError('Seleziona il tipo di olio da produrre');
      return;
    }
    
    if (!form.kg_olive_conferite || form.kg_olive_conferite <= 0) {
      setError('Inserisci la quantità di olive conferite');
      return;
    }
    
    // Aggiunge il flag che indica che questo conferimento è c/proprio
    const conferimentoData = {
      ...form,
      flag_c_proprio: true // Aggiunge questo flag per identificare il conferimento c/proprio
    };
    
    try {
      // Salva il conferimento
      const response = await axios.post(`/api/company/${companyId}/conferimenti`, conferimentoData);
      
      if (response.data.success) {
        setSuccess('Conferimento c/proprio registrato con successo!');
        // Reset del form dopo un successo
        setForm({
          cliente_id: 0,
          data_arrivo: new Date().toISOString().slice(0, 10),
          data_raccolta: new Date().toISOString().slice(0, 10),
          ora_raccolta: '08:00',
          num_documento: '',
          data_documento: new Date().toISOString().slice(0, 10),
          olive_id: 0,
          olio_id: 0,
          kg_olive_conferite: 0,
          prezzo_molitura_kg: 0,
          prezzo_molitura: 0,
          kg_olio_ottenuto: 0,
          magazzino_id: undefined,
          cisterna_id: undefined
        });
      } else {
        setError(response.data.message || 'Errore nella registrazione del conferimento');
      }
    } catch (err: any) {
      console.error('Errore nell\'invio del conferimento:', err);
      setError(err.response?.data?.message || 'Si è verificato un errore. Riprova più tardi.');
    }
  };

  // Ottieni i dettagli delle olive selezionate
  const getOliveDetails = () => {
    if (!form.olive_id) return null;
    
    const olive = articoliOlive.find(o => o.id === form.olive_id);
    if (!olive) return null;
    
    // Debug log per vedere i valori
    console.log('Olive selezionate:', olive);
    console.log('Macroaree disponibili:', macroaree);
    console.log('Origini disponibili:', originiSpecifiche);
    
    const macroarea = olive.macroarea ? macroaree.find(m => m.id === olive.macroarea) : null;
    
    // Gestione più sicura del campo origispeci
    let origini: string[] = [];
    if (olive.origispeci) {
      try {
        // Se è un array o una stringa con separatore
        if (typeof olive.origispeci === 'string' && olive.origispeci.includes(',')) {
          const ids = olive.origispeci.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
          origini = ids.map(id => {
            const origine = originiSpecifiche.find(o => o.id === id);
            return origine ? origine.descrizione : null;
          }).filter(Boolean) as string[];
        } else {
          const id = parseInt(olive.origispeci);
          const origine = originiSpecifiche.find(o => o.id === id);
          if (origine) origini.push(origine.descrizione);
        }
      } catch (err) {
        console.error('Errore nel parsing delle origini specifiche:', err);
      }
    }
    
    return {
      descrizione: olive.descrizione,
      macroarea: macroarea?.descrizione || 'Non specificata',
      origine: origini.length > 0 ? origini.join(', ') : 'Non specificata',
      bio: olive.flag_bio ? 'Sì' : 'No'
    };
  };

  // Ottieni il nome dell'olio selezionato
  const getOlioName = () => {
    if (!form.olio_id) return '';
    const olio = articoliOlio.find(o => o.id === form.olio_id);
    return olio ? olio.descrizione : '';
  };

  return (
    <div className="conferimento-form-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h2>Conferimento Oliva c/proprio</h2>
          <p className="subtitle">Registrazione del conferimento di olive in conto proprio</p>
        </div>
        <div className="header-actions">
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => window.history.back()}
          >
            <i className="fas fa-arrow-left"></i> Torna indietro
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
          <p>Caricamento dati in corso...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : success ? (
        <div className="alert alert-success">
          {success}
          <button 
            onClick={() => setSuccess(null)} 
            className="btn btn-primary mt-3"
          >
            Inserisci un nuovo conferimento
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="conferimento-form card"
              style={{backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)'}}>
          {/* Sezione cliente - Mostrato ma non modificabile, senza titolo */}
          <div className="form-section card-body border-bottom">
            <div className="form-row row">
              <div className="col-md-6">
                <FormField 
                  id="cliente" 
                  label="Cliente" 
                  description="Cliente c/proprio fisso (non modificabile)"
                  icon="fas fa-user"
                  required
                >
                  <input
                    type="text"
                    id="cliente"
                    className="form-control"
                    value={proprioCliente?.descrizione || 'Cliente c/proprio'}
                    disabled
                  />
                  <input
                    type="hidden"
                    name="cliente_id"
                    value="0"
                  />
                </FormField>
              </div>
            </div>
          </div>
          
          <div className="form-section card-body border-bottom">
            <h3 className="section-title">
              <i className="fas fa-truck-loading text-success me-2"></i>
              Dati Conferimento
            </h3>
            <div className="form-row row">
              <div className="col-md-4">
                <FormField 
                  id="data_arrivo" 
                  label="Data Arrivo" 
                  description="Data di arrivo delle olive al frantoio"
                  icon="fas fa-calendar-alt"
                  required
                >
                  <input
                    type="date"
                    id="data_arrivo"
                    name="data_arrivo"
                    className="form-control"
                    value={form.data_arrivo}
                    onChange={handleInputChange}
                    required
                  />
                </FormField>
              </div>
            </div>
          </div>
          
          <div className="form-section card-body border-bottom">
            <h3 className="section-title">
              Olive
            </h3>
            <div className="form-row row">
              <div className="col-md-12">
                <div className="mb-3">
                  <h4 style={{ marginBottom: '10px' }}>
                    Tipo Olive
                    {form.olive_id > 0 && (
                      <button 
                        type="button" 
                        className="btn-link-small" 
                        onClick={() => setShowOliveDetails(!showOliveDetails)}
                        style={{
                          marginLeft: '10px',
                          background: 'none',
                          border: 'none',
                          color: '#4a8f29',
                          cursor: 'pointer',
                          fontSize: '0.9em',
                          textDecoration: 'underline',
                          padding: '0',
                        }}
                      >
                        {showOliveDetails ? 
                          <><i className="fas fa-chevron-up"></i> Nascondi dettagli</> : 
                          <><i className="fas fa-chevron-down"></i> Mostra dettagli</>
                        }
                      </button>
                    )}
                  </h4>
                  <select
                    id="olive_id"
                    name="olive_id"
                    className="form-control"
                    value={form.olive_id || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleziona tipo olive</option>
                    {articoliOlive.map(oliva => (
                      <option key={oliva.id} value={oliva.id}>{oliva.descrizione}</option>
                    ))}
                  </select>
                </div>
                  
                {form.olive_id > 0 && showOliveDetails && (
                  <div className="form-row details-section" style={{ 
                    backgroundColor: '#f9f9f9',
                    padding: '10px',
                    borderRadius: '4px',
                    marginTop: '10px',
                    marginBottom: '10px',
                    borderLeft: '3px solid #4a8f29'
                  }}>
                    <h5 style={{ margin: '5px 0 15px 0', color: '#4a8f29' }}>
                      <i className="fas fa-info-circle"></i> Dettagli Olive
                    </h5>
                    
                    {/* Caratteristiche field */}
                    <div className="form-row" style={{ marginBottom: '15px' }}>
                      <div className="form-group" style={{ width: '100%' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                          <i className="fas fa-tags" style={{ marginRight: '5px' }}></i> Caratteristiche
                        </label>
                        <div className="form-display-field" style={{ padding: '7px 0' }}>
                          {getOliveDetails()?.bio === 'Sì' ? 
                            <span className="badge-bio" style={{ marginRight: '10px' }}><i className="fas fa-leaf"></i> BIO</span> :
                            <span>Standard</span>
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Macroarea and Origine Specifica fields */}
                    <div className="form-row row">
                      <div className="col-md-6">
                        <FormField
                          id="macroarea"
                          label="Macroarea"
                          description="Macroarea delle olive, derivata automaticamente dalla tipologia di olive selezionata."
                          icon="fas fa-map-marker-alt"
                        >
                          <div className="form-display-field">
                            {getOliveDetails()?.macroarea || 'Non specificata'}
                          </div>
                        </FormField>
                      </div>
                      
                      <div className="col-md-6">
                        <FormField
                          id="origispeci"
                          label="Origine Specifica"
                          description="Origine specifica delle olive, derivata automaticamente dalla tipologia di olive selezionata."
                          icon="fas fa-map-pin"
                        >
                          <div className="form-display-field">
                            {getOliveDetails()?.origine || 'Non specificata'}
                          </div>
                        </FormField>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-row row mt-3">
              <div className="col-md-4">
                <FormField 
                  id="data_raccolta" 
                  label="Data Raccolta" 
                  description="Data in cui sono state raccolte le olive"
                  icon="fas fa-calendar-day"
                  required
                >
                  <input
                    type="date"
                    id="data_raccolta"
                    name="data_raccolta"
                    className="form-control"
                    value={form.data_raccolta}
                    onChange={handleInputChange}
                    required
                  />
                </FormField>
              </div>
              
              <div className="col-md-4">
                <FormField 
                  id="ora_raccolta" 
                  label="Ora Raccolta" 
                  description="Ora indicativa in cui sono state raccolte le olive"
                  icon="fas fa-clock"
                >
                  <input
                    type="time"
                    id="ora_raccolta"
                    name="ora_raccolta"
                    className="form-control"
                    value={form.ora_raccolta}
                    onChange={handleInputChange}
                  />
                </FormField>
              </div>
              
              <div className="col-md-4">
                <FormField 
                  id="kg_olive_conferite" 
                  label="Kg Olive Conferite" 
                  description="Quantità in kg di olive conferite"
                  icon="fas fa-weight"
                  required
                >
                  <input
                    type="number"
                    id="kg_olive_conferite"
                    name="kg_olive_conferite"
                    className="form-control"
                    value={form.kg_olive_conferite || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </FormField>
              </div>
            </div>
          </div>
          
          <div className="form-section card-body border-bottom">
            <h3 className="section-title">
              Produzione Olio
              {form.olio_id > 0 && (
                <button 
                  type="button" 
                  className="btn-link-small" 
                  onClick={() => setShowOlioDetails(!showOlioDetails)}
                  style={{
                    marginLeft: '10px',
                    background: 'none',
                    border: 'none',
                    color: '#4a8f29',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    textDecoration: 'underline',
                    padding: '0',
                  }}
                >
                  {showOlioDetails ? 
                    <><i className="fas fa-chevron-up"></i> Nascondi dettagli</> : 
                    <><i className="fas fa-chevron-down"></i> Mostra dettagli</>
                  }
                </button>
              )}
            </h3>
            
            {showOlioDetails ? (
              <div className="form-row row">
                <div className="col-md-4">
                  <FormField 
                    id="olio_id" 
                    label="Tipo Olio" 
                    description="Seleziona il tipo di olio da produrre"
                    icon="fas fa-tint"
                    required
                  >
                    <select
                      id="olio_id"
                      name="olio_id"
                      className="form-control"
                      value={form.olio_id || ''}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleziona tipo olio</option>
                      {articoliOlio.map(olio => (
                        <option key={olio.id} value={olio.id}>{olio.descrizione}</option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div className="col-md-4">
                  <FormField 
                    id="kg_olio_ottenuto" 
                    label="Kg Olio Ottenuto" 
                    description="Quantità di olio ottenuta dalla molitura (può essere inserita anche successivamente)"
                    icon="fas fa-tint"
                  >
                    <input
                      type="number"
                      id="kg_olio_ottenuto"
                      name="kg_olio_ottenuto"
                      className="form-control"
                      value={form.kg_olio_ottenuto || ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </FormField>
                </div>
                
                <div className="col-md-4">
                  <FormField 
                    id="cisterna_id" 
                    label="Cisterna" 
                    description="Cisterna dove stoccare l'olio prodotto"
                    icon="fas fa-warehouse"
                  >
                    <select
                      id="cisterna_id"
                      name="cisterna_id"
                      className="form-control"
                      value={form.cisterna_id || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleziona cisterna</option>
                      {cisterne.map(cisterna => (
                        <option key={cisterna.id} value={cisterna.id}>
                          {cisterna.descrizione} ({cisterna.capacita} Kg, disp: {cisterna.giacenza} Kg)
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            ) : (
              <div className="text-muted">
                <i>Clicca su "Mostra dettagli" per gestire le informazioni sulla produzione dell'olio</i>
              </div>
            )}
          </div>
          
          {/* Bottoni di azione */}
          <div className="form-actions card-footer d-flex justify-content-between">
            <button 
              type="button" 
              className="btn btn-outline-secondary"
              onClick={() => window.history.back()}
            >
              <i className="fas fa-arrow-left"></i> Annulla
            </button>
            
            <button 
              type="submit" 
              className="btn btn-success"
            >
              <i className="fas fa-save"></i> Salva Conferimento
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ConferimentoCproprio;