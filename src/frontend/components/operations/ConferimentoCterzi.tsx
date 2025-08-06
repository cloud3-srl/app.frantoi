import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

interface ConferimentoCterziProps {
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
  cliente_id: number;
  committente_id?: number;
  data_arrivo: string;
  data_raccolta: string;
  ora_raccolta: string;
  num_documento: string;
  data_documento: string;
  flag_privato_senza_doc: boolean;
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
  flag_cliente_ritira_olio?: boolean; // Indica se il cliente ritira l'olio o lo lascia presso il frantoio
  magazzino_id?: number; // ID del magazzino dove verrà stoccato l'olio
  cisterna_id?: string; // ID della cisterna dove verrà stoccato l'olio
  id_prenotazione?: number; // ID della prenotazione collegata (se il conferimento è creato da una prenotazione)
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

// Interfaccia per il form nuovo cliente
interface NuovoClienteForm {
  descrizione: string;
  indirizzo: string;
  cap: string;
  comune_id: number | undefined;
  provincia_id: number | undefined;
  nazione_id: number | undefined;
  telefono: string;
  email: string;
  codice_fiscale: string;
  partita_iva: string;
  id_sian: string;
  olivedef: number | undefined;
  cfValidationError?: string;
  pivaValidationError?: string;
  emailValidationError?: string;
  indirizzoValidationError?: string;
  capValidationError?: string;
  comuneValidationError?: string;
  provinciaValidationError?: string;
  nazioneValidationError?: string;
  telefonoValidationError?: string;
}

interface Nazione {
  id: number;
  descrizione: string;
  codice_iso?: string;
}

interface Comune {
  id: number;
  descrizione: string;
  provincia_id?: number;
}

interface Provincia {
  id: number;
  descrizione: string;
  sigla?: string;
}

const ConferimentoCterzi: React.FC<ConferimentoCterziProps> = ({ companyId, companyCode, preCompilazioneData }) => {
  // Ottiene i parametri dalla URL
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Approccio semplificato: estrae i parametri direttamente dalla URL
  const prenotazioneId = searchParams.get('prenotazioneId') ? parseInt(searchParams.get('prenotazioneId')!) : undefined;
  const clienteId = searchParams.get('clienteId') ? parseInt(searchParams.get('clienteId')!) : undefined;
  const oliveId = searchParams.get('oliveId') ? parseInt(searchParams.get('oliveId')!) : undefined;
  const kgOlive = searchParams.get('kgOlive') ? parseFloat(searchParams.get('kgOlive')!) : undefined;
  const dataPrenotazione = searchParams.get('dataPrenotazione') || undefined;

  // Nomi delle entità ricavati dai dati caricati (non da localStorage)
  let nomeCliente: string | undefined = undefined;
  let nomeOliva: string | undefined = undefined;
  
  // Crea l'oggetto di precompilazione dai parametri ottenuti
  const urlPreCompilazioneData = prenotazioneId || clienteId || oliveId || kgOlive || dataPrenotazione
    ? {
        prenotazioneId,
        clienteId,
        oliveId,
        kgOlive,
        dataPrenotazione,
        // Aggiungiamo i nomi precompilati se disponibili
        nomeCliente,
        nomeOliva
      }
    : undefined;
  
  // Usa o i dati passati come prop o quelli dalla URL
  const datiPrecompilazione = preCompilazioneData || urlPreCompilazioneData;
  
  console.log('ConferimentoCterzi inizializzato con:', { 
    companyId, 
    companyCode, 
    datiPrecompilazione,
    parametriURL: { prenotazioneId, clienteId, oliveId, kgOlive, dataPrenotazione }
  });
  // Stati per i dati
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [articoliOlive, setArticoliOlive] = useState<ArticoloOlive[]>([]);
  const [articoliOlio, setArticoliOlio] = useState<ArticoloOlio[]>([]);
  const [oliveToOli, setOliveToOli] = useState<OliveToOlio[]>([]);
  const [macroaree, setMacroaree] = useState<Macroarea[]>([]);
  const [originiSpecifiche, setOriginiSpecifiche] = useState<OrigineSpecifica[]>([]);
  const [magazzini, setMagazzini] = useState<Magazzino[]>([]);
  const [cisterne, setCisterne] = useState<Cisterna[]>([]);
  const [comuni, setComuni] = useState<Comune[]>([]);
  const [province, setProvince] = useState<Provincia[]>([]);
  const [nazioni, setNazioni] = useState<Nazione[]>([]);
  
  // Stato per il modal di aggiunta cliente
  const [showNuovoClienteModal, setShowNuovoClienteModal] = useState<boolean>(false);
  const [ultimoIdSian, setUltimoIdSian] = useState<string>('');
  const [nuovoClienteForm, setNuovoClienteForm] = useState<NuovoClienteForm>({
    descrizione: '',
    indirizzo: '',
    cap: '',
    comune_id: undefined,
    provincia_id: undefined,
    nazione_id: undefined,
    telefono: '',
    email: '',
    codice_fiscale: '',
    partita_iva: '',
    id_sian: '',
    olivedef: undefined
  });
  const [salvandoNuovoCliente, setSalvandoNuovoCliente] = useState<boolean>(false);
  const [comuneFilter, setComuneFilter] = useState<string>('');
  const [provinciaFilter, setProvinciaFilter] = useState<string>('');
  const [nazioneFilter, setNazioneFilter] = useState<string>('');
  const [clienteFilter, setClienteFilter] = useState<string>('');
  const [committenteFilter, setCommittenteFilter] = useState<string>('');
  
  // Stato per il form
  const [form, setForm] = useState<ConferimentoForm>({
    cliente_id: 0,
    committente_id: undefined,
    data_arrivo: new Date().toISOString().slice(0, 10),
    data_raccolta: new Date().toISOString().slice(0, 10),
    ora_raccolta: '08:00',
    num_documento: '',
    data_documento: new Date().toISOString().slice(0, 10),
    flag_privato_senza_doc: false,
    olive_id: 0,
    olio_id: 0,
    kg_olive_conferite: 0,
    prezzo_molitura_kg: 0,
    prezzo_molitura: 0,
    kg_olio_ottenuto: 0, // Non è obbligatorio ma inizializziamo a 0
    flag_cliente_ritira_olio: false, // Indica se il cliente ritira l'olio o lo lascia presso il frantoio
    magazzino_id: undefined, // ID del magazzino dove verrà stoccato l'olio
    cisterna_id: undefined // ID della cisterna dove verrà stoccato l'olio
  });
  
  // Stati per il caricamento e gli errori
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Stato per gestire se i campi data/ora raccolta sono obbligatori
  const [isRaccoltaRequired, setIsRaccoltaRequired] = useState<boolean>(false);
  
  // Stato per tracciare se i clienti sono stati caricati
  const [clientiLoaded, setClientiLoaded] = useState<boolean>(false);
  
  // Stato per gestire la visualizzazione dei dettagli delle olive
  const [showOliveDetails, setShowOliveDetails] = useState<boolean>(false);
  
  // Registra i dati di precompilazione quando disponibili
  useEffect(() => {
    // Se ci sono dati di precompilazione, verifica se provengono da una prenotazione
    const hasDatiPrenotazione = datiPrecompilazione && (
      datiPrecompilazione.clienteId || 
      datiPrecompilazione.oliveId || 
      datiPrecompilazione.dataPrenotazione
    );
    
    if (hasDatiPrenotazione) {
      console.log('Dati di precompilazione trovati:', datiPrecompilazione);
    }
  }, [datiPrecompilazione]);

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
    
    // Se ci sono dati di precompilazione, verifica se provengono da una prenotazione
    const hasDatiPrenotazione = datiPrecompilazione && (
      datiPrecompilazione.clienteId || 
      datiPrecompilazione.oliveId || 
      datiPrecompilazione.dataPrenotazione
    );
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Se ci sono dati di precompilazione, diamo priorità ai dati essenziali
        // per velocizzare la compilazione del form
        const hasDatiPrecompilazione = datiPrecompilazione && (
          datiPrecompilazione.clienteId || 
          datiPrecompilazione.oliveId
        );
        
        let priorityPromises: Promise<any>[] = [];
        let secondaryPromises: Promise<any>[] = [];
        
        // 1. CARICA I DATI ESSENZIALI PRIMA (quelli necessari per la precompilazione)
        if (hasDatiPrecompilazione) {
          // Carica i clienti (soggetti) dell'azienda - ESSENZIALE per id_cliente
          console.log(`Caricamento prioritario soggetti per companyId: ${companyId}`);
          const clientiPromise = axios.get(`/api/company/${companyId}/tables/soggetti`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(response => {
            if (response.data.success) {
              const clientiData = response.data.data || [];
              setClienti(clientiData);
              setClientiLoaded(true);
              console.log(`Clienti caricati: ${clientiData.length} record`);
            }
            return response;
          }).catch(err => {
            console.error('Errore nel caricamento clienti:', err);
            return null;
          });
          
          // Carica gli articoli olive (tipologia 'OL') - ESSENZIALE per olive_id
          const olivePromise = axios.get('/api/tables/articoli', {
            params: { where: JSON.stringify({ tipologia: 'OL' }) },
            headers: { Authorization: `Bearer ${token}` }
          }).then(response => {
            if (response.data.success) {
              setArticoliOlive(response.data.data || []);
              console.log(`Articoli olive caricati: ${response.data.data?.length || 0}`);
            }
            return response;
          }).catch(err => {
            console.error('Errore nel caricamento articoli olive:', err);
            return null;
          });
          
          // Carica le relazioni olive-olio - NECESSARIO per compilazione corretta olive
          const oliveToOliPromise = axios.get('/api/tables/olive_to_oli', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(response => {
            if (response.data.success) {
              setOliveToOli(response.data.data || []);
            }
            return response;
          }).catch(err => {
            console.error('Errore nel caricamento relazioni olive-olio:', err);
            return null;
          });
          
          // Aggiungi alle chiamate prioritarie
          priorityPromises = [clientiPromise, olivePromise, oliveToOliPromise];
        } else {
          // Se non c'è precompilazione, carica tutto normalmente senza priorità
          console.log('Nessun dato di precompilazione, caricamento standard');
          
          // Carica i clienti anche senza precompilazione
          const clientiPromise = axios.get(`/api/company/${companyId}/tables/soggetti`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(response => {
            if (response.data.success) {
              const clientiData = response.data.data || [];
              setClienti(clientiData);
              setClientiLoaded(true);
              console.log(`Clienti caricati: ${clientiData.length} record`);
            }
            return response;
          }).catch(err => {
            console.error('Errore nel caricamento clienti:', err);
            return null;
          });
          
          // Carica gli articoli olive anche senza precompilazione
          const olivePromise = axios.get('/api/tables/articoli', {
            params: { where: JSON.stringify({ tipologia: 'OL' }) },
            headers: { Authorization: `Bearer ${token}` }
          }).then(response => {
            if (response.data.success) {
              setArticoliOlive(response.data.data || []);
              console.log(`Articoli olive caricati: ${response.data.data?.length || 0}`);
            }
            return response;
          }).catch(err => {
            console.error('Errore nel caricamento articoli olive:', err);
            return null;
          });
          
          // Carica le relazioni olive-olio anche senza precompilazione
          const oliveToOliPromise = axios.get('/api/tables/olive_to_oli', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(response => {
            if (response.data.success) {
              setOliveToOli(response.data.data || []);
              console.log(`Relazioni olive-olio caricate: ${response.data.data?.length || 0}`);
            }
            return response;
          }).catch(err => {
            console.error('Errore nel caricamento relazioni olive-olio:', err);
            return null;
          });
          
          priorityPromises = [clientiPromise, olivePromise, oliveToOliPromise];
        }
        
        // 2. DATI SECONDARI (possono essere caricati dopo la precompilazione)
        
        // Questi dati verranno caricati in parallelo ma non bloccheranno la precompilazione
        // ID SIAN è utile ma non blocca la compilazione del form
        const aziendaPromise = axios.get(`/api/company/${companyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data.success && response.data.company) {
            const ultimoId = response.data.company.ultimoidsoggetto || '';
            setUltimoIdSian(ultimoId);
          }
          return response;
        }).catch(err => {
          console.error('Errore nel recupero dell\'ultimo ID SIAN:', err);
          return null;
        });
        
        // Articoli olio non usati immediatamente nella precompilazione
        const olioPromise = axios.get('/api/tables/articoli', {
          params: { where: JSON.stringify({ tipologia: 'SF' }) },
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data.success) {
            setArticoliOlio(response.data.data || []);
          }
          return response;
        }).catch(err => {
          console.error('Errore nel caricamento articoli olio:', err);
          return null;
        });
        
        // Altri dati di supporto
        const macroareePromise = axios.get('/api/tables/macroaree', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data.success) {
            setMacroaree(response.data.data || []);
          }
          return response;
        }).catch(() => null);
        
        const originiPromise = axios.get('/api/tables/origini_specifiche', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data.success) {
            setOriginiSpecifiche(response.data.data || []);
          }
          return response;
        }).catch(() => null);
        
        const comuniPromise = axios.get('/api/tables/comuni', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data.success) {
            setComuni(response.data.data || []);
          }
          return response;
        }).catch(() => null);
        
        const provincePromise = axios.get('/api/tables/province', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data.success) {
            setProvince(response.data.data || []);
          }
          return response;
        }).catch(() => null);
        
        const nazioniPromise = axios.get('/api/tables/nazioni', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data.success) {
            setNazioni(response.data.data || []);
          }
          return response;
        }).catch(() => null);
        
        // Dati aziendali secondari
        const magazziniPromise = companyId ? axios.get(`/api/company/${companyId}/tables/magazzini`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data.success) {
            setMagazzini(response.data.data || []);
          }
          return response;
        }).catch(() => null) : Promise.resolve();
        
        const cisternePromise = companyId ? axios.get(`/api/company/${companyId}/tables/cisterne`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data.success) {
            setCisterne(response.data.data || []);
          }
          return response;
        }).catch(() => null) : Promise.resolve();
        
        // Aggiungi tutte le chiamate secondarie
        secondaryPromises = [
          aziendaPromise, olioPromise, macroareePromise, originiPromise,
          comuniPromise, provincePromise, nazioniPromise, magazziniPromise, cisternePromise
        ];
        
        // 3. GESTIONE DEL CARICAMENTO
        if (hasDatiPrecompilazione) {
          // Se c'è precompilazione, esegui prima le chiamate prioritarie
          // e poi avvia la compilazione del form
          console.log('Esecuzione chiamate prioritarie...');
          const logTiming = (window as any).logTiming || ((msg: string) => console.log(`TIMING: ${msg}`));
          
          try {
            // Attendi il completamento delle chiamate prioritarie
            await Promise.all(priorityPromises);
            logTiming('DATI PRIORITARI CARICATI');
            
            // Avvia le chiamate secondarie ma non aspettare il loro completamento
            Promise.all(secondaryPromises)
              .then(() => logTiming('TUTTI I DATI CARICATI'));
              
            // Continua con la precompilazione senza aspettare i dati secondari
          } catch (err) {
            console.error('Errore nel caricamento dati prioritari:', err);
          }
        } else {
          // Se non c'è precompilazione, esegui tutte le chiamate in parallelo
          await Promise.all([...priorityPromises, ...secondaryPromises]);
        }
        
        // Primo caricamento base dei dati completato
        
        // Se abbiamo dati di precompilazione dalla prenotazione, impostiamo il form
        if (hasDatiPrenotazione) {
          // Implementazione ottimizzata immediatamente dopo aver caricato i dati
          console.log('Avvio ottimizzato di precompilazione dati...');
          
          // Tracciamento del tempo
          const logTiming = (window as any).logTiming || ((msg: string) => console.log(`TIMING: ${msg}`));
          logTiming('INIZIO COMPILAZIONE DATI');
          
          // Ottimizzazione: prepariamo i dati
          const updatedForm = { ...form };
          let clienteDesc = '';
          
          // Cerca direttamente il cliente nei dati caricati
          if (datiPrecompilazione?.clienteId) {
            const startClienteSearch = new Date().getTime();
            const cliente = clienti.find(c => c.id === datiPrecompilazione.clienteId);
            const endClienteSearch = new Date().getTime();
            console.log(`Ricerca cliente completata in ${endClienteSearch - startClienteSearch}ms`);
            
            if (cliente) {
              clienteDesc = cliente.descrizione;
              console.log('Cliente trovato:', cliente.descrizione);
            } else {
              console.log('Cliente non trovato per ID:', datiPrecompilazione.clienteId);
            }
          }
          
          // 1. Precompilazione istantanea di tutte le proprietà
          if (datiPrecompilazione?.dataPrenotazione) {
            const dataFormatted = new Date(datiPrecompilazione.dataPrenotazione).toISOString().slice(0, 10);
            updatedForm.data_arrivo = dataFormatted;
            updatedForm.data_documento = dataFormatted;
          }
          
          if (datiPrecompilazione?.kgOlive && datiPrecompilazione.kgOlive > 0) {
            updatedForm.kg_olive_conferite = datiPrecompilazione.kgOlive || 0;
          }
          
          if (datiPrecompilazione?.clienteId) {
            updatedForm.cliente_id = datiPrecompilazione.clienteId || 0;
          }
          
          if (datiPrecompilazione?.oliveId) {
            updatedForm.olive_id = datiPrecompilazione.oliveId || 0;
          }
          
          // 2. Applica tutte le modifiche in un'unica operazione
          console.log('Applicazione immediata di tutti i dati');
          setForm(updatedForm);
          
          // 3. Imposta il nome cliente immediatamente se disponibile
          if (clienteDesc) {
            setClienteFilter(clienteDesc);
          }
          
          // 4. Nascondi subito gli indicatori di caricamento
          setLoading(false);
          
          // Tracciamento
          logTiming('DATI BASE COMPILATI');
          
          // 5. Esegui handleOliveChange come ultima operazione
          if (datiPrecompilazione?.oliveId) {
            console.log('Avvio cambio oliva...');
            
            // Traccia il tempo di esecuzione del cambio oliva
            const startOliveChange = new Date().getTime();
            
            // Esecuzione diretta senza ritardi
            try {
              handleOliveChange({ target: { value: datiPrecompilazione.oliveId?.toString() || '0' }} as React.ChangeEvent<HTMLSelectElement>);
              const endOliveChange = new Date().getTime();
              console.log(`Cambio oliva completato in ${endOliveChange - startOliveChange}ms`);
            } catch (err) {
              console.error('Errore nella gestione cambio oliva:', err);
            } finally {
              // Completa la precompilazione
              logTiming('COMPILAZIONE COMPLETA');
              console.log('RIEPILOGO TEMPI:', (window as any).timestampLog);
            }
          } else {
            // Se non c'è un'oliva da impostare, termina subito
            logTiming('COMPILAZIONE COMPLETA (SENZA CAMBIO OLIVA)');
            console.log('RIEPILOGO TEMPI:', (window as any).timestampLog);
          }
        } else {
          // Nessun dato da precompilare, termina subito
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Errore nel caricamento dei dati:', err);
        
        if (err.response) {
          console.error('Dettagli errore:', {
            status: err.response.status,
            data: err.response.data,
            headers: err.response.headers
          });
          setError(err.response.data?.message || `Errore del server (${err.response.status})`);
        } else if (err.request) {
          console.error('Nessuna risposta ricevuta:', err.request);
          setError('Impossibile comunicare con il server');
        } else {
          console.error('Errore nella richiesta:', err.message);
          setError(err.message || 'Errore nel caricamento dei dati');
        }
        
        setLoading(false);
      }
    };
    
    fetchData();
  }, [companyId, companyCode]);
  
  // Gestisce il cambio del cliente
  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clienteId = parseInt(e.target.value);
    const selectedCliente = clienti.find(c => c.id === clienteId);
    
    // Reset del form con i valori del cliente selezionato
    setForm(prev => {
      const newForm = {
        ...prev,
        cliente_id: clienteId
      };
      
      // Impostiamo flag_privato_senza_doc in base al valore di flagdoc del cliente
      // Se flagdoc è false, il cliente non ha documenti, quindi flag_privato_senza_doc deve essere true
      // Se flagdoc è true, il cliente ha documenti, quindi flag_privato_senza_doc deve essere false
      if (selectedCliente) {
        // Verifichiamo se il cliente ha il flag flagdoc
        if (selectedCliente.flagdoc !== undefined) {
          newForm.flag_privato_senza_doc = !selectedCliente.flagdoc;
        }
      }
      
      // Se il cliente ha un tipo di olive predefinito, lo selezioniamo
      if (selectedCliente?.olivedef) {
        const oliveArticolo = articoliOlive.find(a => a.id === selectedCliente.olivedef);
        
        if (oliveArticolo) {
          newForm.olive_id = oliveArticolo.id;
          
          // Imposta i campi derivati dall'articolo olive
          newForm.macroarea = oliveArticolo.macroarea;
          newForm.origispeci = oliveArticolo.origispeci;
          newForm.flag_bio = oliveArticolo.flag_bio;
          
          // Reset dei flag DOP e IGP
          newForm.flag_dop = false;
          newForm.flag_igp = false;
          
          // Verifica DOP/IGP in base a macroarea e origini specifiche
          const isDopIgpMacroarea = oliveArticolo.macroarea === 12 || 
                                   oliveArticolo.macroarea === 13 || 
                                   oliveArticolo.macroarea === 14;
          
          if (isDopIgpMacroarea && oliveArticolo.origispeci) {
            const originiIds = oliveArticolo.origispeci.split(',').map(id => parseInt(id.trim()));
            
            const hasDop = originiIds.some(id => {
              const origine = originiSpecifiche.find(o => o.id === id);
              return origine?.flag_dop === true;
            });
            
            if (hasDop) {
              newForm.flag_dop = true;
            } else {
              newForm.flag_igp = true;
            }
          }
          
          // Cerchiamo l'olio di default per queste olive
          const oliveOlioRel = oliveToOli.find(rel => 
            rel.cod_olive === oliveArticolo.id && rel.flag_default
          );
          
          if (oliveOlioRel) {
            newForm.olio_id = oliveOlioRel.cod_olio;
          }
        }
      }
      
      return newForm;
    });
  };
  
  // Gestisce il cambio dell'articolo olive
  const handleOliveChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const logTiming = (window as any).logTiming || ((msg: string) => console.log(`TIMING: ${msg}`));
    logTiming('INIZIO CAMBIO OLIVA');
    
    const startTime = performance.now();
    
    const oliveId = parseInt(e.target.value);
    console.log('handleOliveChange chiamato con ID:', oliveId);
    
    const t1 = performance.now();
    const selectedOlive = articoliOlive.find(a => a.id === oliveId);
    const t2 = performance.now();
    console.log(`Ricerca oliva completata in ${t2-t1}ms`);
    
    setForm(prev => {
      const newForm = {
        ...prev,
        olive_id: oliveId
      };
      
      if (selectedOlive) {
        // Imposta i campi derivati dall'articolo olive
        newForm.macroarea = selectedOlive.macroarea;
        newForm.origispeci = selectedOlive.origispeci;
        newForm.flag_bio = selectedOlive.flag_bio;
        
        // Cerca l'olio di default per queste olive
        const oliveOlioRel = oliveToOli.find(rel => 
          rel.cod_olive === oliveId && rel.flag_default
        );
        
        if (oliveOlioRel) {
          newForm.olio_id = oliveOlioRel.cod_olio;
        }
        
        // Se l'origine specifica è impostata, verifica se è DOP/IGP e se richiede data raccolta
        let requiresRaccolta = false;
        
        // Reset dei flag DOP e IGP
        newForm.flag_dop = false;
        newForm.flag_igp = false;
        
        if (selectedOlive.origispeci) {
          const originiIds = selectedOlive.origispeci.split(',').map(id => parseInt(id.trim()));
          
          // Verifica se la macroarea è 12, 13 o 14 (DOP/IGP)
          const isDopIgpMacroarea = selectedOlive.macroarea === 12 || 
                                    selectedOlive.macroarea === 13 || 
                                    selectedOlive.macroarea === 14;
          
          if (isDopIgpMacroarea) {
            // Verifica le origini specifiche per determinare DOP o IGP
            const hasDop = originiIds.some(id => {
              const origine = originiSpecifiche.find(o => o.id === id);
              return origine?.flag_dop === true;
            });
            
            if (hasDop) {
              newForm.flag_dop = true;
            } else {
              // Se è una macroarea DOP/IGP ma l'origine specifica non ha flag_dop,
              // allora è IGP
              newForm.flag_igp = true;
            }
          }
          
          // Se almeno una origine richiede data raccolta, impostiamo il flag corrispondente
          requiresRaccolta = originiIds.some(id => {
            const origine = originiSpecifiche.find(o => o.id === id);
            return origine?.flag_raccolta;
          });
        }
        
        // Aggiorna lo stato per i campi data_raccolta e ora_raccolta obbligatori
        setIsRaccoltaRequired(requiresRaccolta);
      }
      
      return newForm;
    });
    
    const endTime = performance.now();
    console.log(`Cambio oliva completato in ${endTime - startTime}ms`);
    logTiming('FINE CAMBIO OLIVA');
  };
  
  // Calcola il prezzo totale di molitura in base ai kg e al prezzo unitario
  const calcolaPrezzoMolitura = () => {
    const kgOlive = form.kg_olive_conferite || 0;
    const prezzoKg = form.prezzo_molitura_kg || 0;
    const prezzoTotale = kgOlive * prezzoKg;
    
    setForm(prev => ({
      ...prev,
      prezzo_molitura: Number(prezzoTotale.toFixed(2))
    }));
  };
  
  // Calcola automaticamente il prezzo quando cambiano i valori pertinenti
  useEffect(() => {
    calcolaPrezzoMolitura();
  }, [form.kg_olive_conferite, form.prezzo_molitura_kg]);
  
  // Carica anche l'articolo MOLITURA all'avvio
  useEffect(() => {
    if (companyId && typeof form.kg_olive_conferite === 'number' && form.kg_olive_conferite > 0) {
      fetchMolituraPrice(form.kg_olive_conferite);
    }
  }, [companyId]);
  
  // Gestisce i cambi generici nel form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // Gestisce diversi tipi di input
    const inputValue = type === 'checkbox' 
      ? checked 
      : (type === 'number' ? parseFloat(value) : value);
    
    // Se cambia magazzino_id, usa la funzione specifica
    if (name === 'magazzino_id' && type !== 'checkbox') {
      handleMagazzinoChange(e as unknown as React.ChangeEvent<HTMLSelectElement>);
      return;
    }
    
    // Aggiorna il form
    setForm(prev => ({
      ...prev,
      [name]: inputValue
    }));
    
    // Se sono cambiati i kg olive, cerca il prezzo di molitura nel listino
    if (name === 'kg_olive_conferite' && typeof inputValue === 'number' && inputValue > 0) {
      fetchMolituraPrice(inputValue);
    }
  };
  
  // Gestisce specificatamente il cambio del magazzino (per aggiornare anche le cisterne)
  const handleMagazzinoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const magazzinoId = value ? parseInt(value) : undefined;
    
    console.log("Cambiato magazzino a:", magazzinoId);
    
    // Aggiorna il form con il nuovo magazzino e resetta la cisterna
    setForm(prev => ({
      ...prev,
      magazzino_id: magazzinoId,
      cisterna_id: undefined // Reset della cisterna quando cambia il magazzino
    }));
    
    // Verifica se ci sono cisterne disponibili per questo magazzino
    const cisterneFiltrate = cisterne.filter(cisterna => 
      !magazzinoId || cisterna.id_magazzino === magazzinoId
    );
    
    console.log(`Cisterne disponibili per il magazzino ${magazzinoId}:`, cisterneFiltrate.length);
    if (cisterneFiltrate.length === 0) {
      console.log("Nessuna cisterna disponibile per questo magazzino");
    }
  };
  
  // Funzione per cercare il prezzo di molitura nel listino
  const fetchMolituraPrice = async (kgOlive: number) => {
    try {
      if (!companyId || !kgOlive) return;
      
      // Ottieni l'ID dell'articolo "MOLITURA"
      const articoliResponse = await axios.get('/api/tables/articoli', {
        params: { where: JSON.stringify({ descrizione: 'MOLITURA' }) },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!articoliResponse.data.success || !articoliResponse.data.data.length) {
        console.log('Articolo MOLITURA non trovato');
        return;
      }
      
      const molituraArticoloId = articoliResponse.data.data[0].id;
      
      // Cerca nel listino una fascia che comprenda i kg di olive
      const listiniResponse = await axios.get(`/api/company/${companyId}/tables/listini`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!listiniResponse.data.success) {
        console.log('Errore nel recupero dei listini');
        return;
      }
      
      // Filtra i listini per trovare quello corrispondente al peso e all'articolo MOLITURA
      const listini = listiniResponse.data.data || [];
      const listino = listini.find((l: any) => 
        l.cod_articolo === molituraArticoloId && 
        l.qta_da <= kgOlive && 
        l.qta_a >= kgOlive &&
        l.flagAttivo === true
      );
      
      if (listino) {
        console.log('Trovato listino per molitura:', listino);
        // Imposta il prezzo della molitura dal listino
        setForm(prev => ({
          ...prev,
          prezzo_molitura_kg: listino.prezzo,
          // Calcola automaticamente il prezzo totale
          prezzo_molitura: Number((kgOlive * listino.prezzo).toFixed(2))
        }));
      } else {
        console.log('Nessun listino trovato per i kg specificati');
      }
      
    } catch (error) {
      console.error('Errore nel recupero del prezzo di molitura:', error);
    }
  };
  
  // Gestisce l'invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validazione: se c'è olio ottenuto e il cliente non ritira l'olio, la cisterna è obbligatoria
      if (form.kg_olio_ottenuto > 0 && !form.flag_cliente_ritira_olio && !form.cisterna_id) {
        setError('La cisterna di stoccaggio è obbligatoria se inserisci una quantità di olio ottenuto e il cliente non ritira l\'olio.');
        return;
      }
      
      // Salvataggio dei dati nella tabella conferimenti
      console.log('Invio dati del conferimento:', form);
      setLoading(true);
      
      // Aggiungiamo l'ID della prenotazione se il conferimento proviene da una prenotazione
      const formData = { ...form };
      
      // Se abbiamo un ID prenotazione nei dati precompilati, lo includiamo nella richiesta
      if (datiPrecompilazione?.prenotazioneId) {
        formData.id_prenotazione = datiPrecompilazione.prenotazioneId;
        console.log(`Includendo ID prenotazione ${datiPrecompilazione.prenotazioneId} nel conferimento`);
      }
      
      // Utilizziamo la rotta generica per tabelle specifiche dell'azienda
      // che è già disponibile nel nostro backend
      const response = await axios.post(
        `/api/company/${companyId}/tables/conferimenti`, 
        formData,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Risposta salvataggio conferimento:', response.data);
      
      if (response.data.success) {
        // Mostra un popup e reindirizza alla dashboard
        alert('Conferimento c/terzi registrato con successo');
        window.location.href = '/';
        
        // Reset del flag per i campi data/ora raccolta obbligatori
        setIsRaccoltaRequired(false);
      } else {
        throw new Error(response.data.message || 'Errore sconosciuto');
      }
      
      // Reset dei messaggi di errore
      setError(null);
    } catch (err: any) {
      console.error('Errore nel salvataggio del conferimento:', err);
      
      // Gestiamo diversi tipi di errori per dare feedback più precisi all'utente
      if (err.response) {
        // Errore dal server con response
        setError(err.response.data?.message || `Errore del server (${err.response.status})`);
        
        // Log dettagliato per debug
        console.error('Dettagli errore risposta:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
        
        // Errore specifico per tabella non trovata
        if (err.response.status === 500 && err.response.data?.error?.includes('relation') && err.response.data?.error?.includes('does not exist')) {
          setError(`La tabella conferimenti non esiste per questa azienda. Contattare l'amministratore.`);
        }
      } else if (err.request) {
        // Richiesta inviata ma nessuna risposta ricevuta
        setError('Nessuna risposta dal server. Verificare la connessione.');
      } else {
        // Errore durante la preparazione della richiesta
        setError(err.message || 'Errore imprevisto durante il salvataggio');
      }
      
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Formatta le date per la visualizzazione
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch (e) {
      return dateString;
    }
  };
  
  // Mostra il loader solo durante il caricamento iniziale dei dati
  // ma non durante l'invio del form (quando handleSubmit imposta loading a true)
  if (loading && clienti.length === 0) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i> Caricamento dati in corso...
      </div>
    );
  }
  
  // Gestisce il cambio dei campi nel form nuovo cliente
  const handleNuovoClienteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Gestione speciale per i campi numerici
    let newValue: string | number | undefined = value;
    
    if (type === 'number' || name === 'comune_id' || name === 'provincia_id' || name === 'nazione_id') {
      // Se il campo è numerico e ha un valore, lo convertiamo in numero
      newValue = value ? parseInt(value) : undefined;
    }
    
    // Aggiorna automaticamente la provincia quando viene selezionato un comune
    if (name === 'comune_id' && value) {
      const selectedComune = comuni.find(c => c.id === parseInt(value));
      if (selectedComune) {
        // Pulisce il filtro di ricerca del comune dopo la selezione
        setComuneFilter('');
        
        if (selectedComune.provincia_id) {
          // Aggiorna anche la provincia se disponibile
          setNuovoClienteForm(prev => ({
            ...prev,
            comune_id: typeof newValue === 'string' ? parseInt(newValue) : newValue as number | undefined,
            provincia_id: selectedComune.provincia_id
          }));
          
          // Pulisce il filtro di ricerca della provincia
          setProvinciaFilter('');
          return;
        }
      }
    }
    
    // Variabili di stato per errori di validazione specifici
    let cfValidationError = '';
    let pivaValidationError = '';
    let emailValidationError = '';
    let indirizzoValidationError = '';
    let capValidationError = '';
    let comuneValidationError = '';
    let provinciaValidationError = '';
    let nazioneValidationError = '';
    let telefonoValidationError = '';
    
    // Validazione per indirizzo
    if (name === 'indirizzo') {
      if (!value || value.trim() === '') {
        indirizzoValidationError = 'Campo obbligatorio';
      } else {
        if (nuovoClienteForm.indirizzoValidationError) {
          indirizzoValidationError = '';
        }
      }
    } else {
      indirizzoValidationError = nuovoClienteForm.indirizzoValidationError || '';
    }
    
    // Validazione per CAP
    if (name === 'cap') {
      if (!value || value.trim() === '') {
        capValidationError = 'Campo obbligatorio';
      } else {
        if (nuovoClienteForm.capValidationError) {
          capValidationError = '';
        }
      }
    } else {
      capValidationError = nuovoClienteForm.capValidationError || '';
    }
    
    // Validazione per comune
    if (name === 'comune_id') {
      if (!value) {
        comuneValidationError = 'Campo obbligatorio';
      } else {
        if (nuovoClienteForm.comuneValidationError) {
          comuneValidationError = '';
        }
      }
    } else {
      comuneValidationError = nuovoClienteForm.comuneValidationError || '';
    }
    
    // Validazione per provincia
    if (name === 'provincia_id') {
      if (!value) {
        provinciaValidationError = 'Campo obbligatorio';
      } else {
        if (nuovoClienteForm.provinciaValidationError) {
          provinciaValidationError = '';
        }
      }
    } else {
      provinciaValidationError = nuovoClienteForm.provinciaValidationError || '';
    }
    
    // Validazione per nazione
    if (name === 'nazione_id') {
      if (!value) {
        nazioneValidationError = 'Campo obbligatorio';
      } else {
        if (nuovoClienteForm.nazioneValidationError) {
          nazioneValidationError = '';
        }
      }
    } else {
      nazioneValidationError = nuovoClienteForm.nazioneValidationError || '';
    }
    
    // Validazione per telefono
    if (name === 'telefono') {
      if (!value || value.trim() === '') {
        telefonoValidationError = 'Campo obbligatorio';
      } else {
        if (nuovoClienteForm.telefonoValidationError) {
          telefonoValidationError = '';
        }
      }
    } else {
      telefonoValidationError = nuovoClienteForm.telefonoValidationError || '';
    }
    
    // Validazione speciale per codice fiscale
    if (name === 'codice_fiscale') {
      if (value && !isValidCodiceFiscale(value)) {
        cfValidationError = 'Formato codice fiscale non valido. Deve essere di 16 caratteri alfanumerici (es. RSSMRA80A01H501U)';
      } else {
        // Aggiorna lo stato solo se c'è una modifica
        if (nuovoClienteForm.cfValidationError) {
          cfValidationError = '';
        }
      }
    } else {
      // Mantieni l'errore esistente per gli altri campi
      cfValidationError = nuovoClienteForm.cfValidationError || '';
    }
    
    // Validazione speciale per email
    if (name === 'email') {
      if (value && !isValidEmail(value)) {
        emailValidationError = 'Formato email non valido.';
      } else {
        // Aggiorna lo stato solo se c'è una modifica
        if (nuovoClienteForm.emailValidationError) {
          emailValidationError = '';
        }
      }
    } else {
      // Mantieni l'errore esistente per gli altri campi
      emailValidationError = nuovoClienteForm.emailValidationError || '';
    }
    
    // Validazione speciale per partita IVA
    if (name === 'partita_iva') {
      if (value && !isValidPartitaIVA(value)) {
        pivaValidationError = 'Formato partita IVA non valido. Deve essere di 11 cifre numeriche.';
      } else {
        // Aggiorna lo stato solo se c'è una modifica
        if (nuovoClienteForm.pivaValidationError) {
          pivaValidationError = '';
        }
      }
    } else {
      // Mantieni l'errore esistente per gli altri campi
      pivaValidationError = nuovoClienteForm.pivaValidationError || '';
    }
    
    // Aggiorna lo stato del form includendo gli errori di validazione
    setNuovoClienteForm(prev => ({
      ...prev,
      [name]: newValue,
      cfValidationError,
      pivaValidationError,
      emailValidationError,
      indirizzoValidationError,
      capValidationError,
      comuneValidationError,
      provinciaValidationError,
      nazioneValidationError,
      telefonoValidationError
    }));
    
    // Pulisci i filtri appropriati dopo la selezione
    if (name === 'provincia_id' && value) {
      setProvinciaFilter('');
    } else if (name === 'nazione_id' && value) {
      setNazioneFilter('');
    }
  };
  
  // La funzione handleComuneSelect è stata rimossa poiché non viene utilizzata
  // La funzionalità di selezione del comune è già gestita direttamente nei click handler delle opzioni
  
  // Funzione di validazione per email
  const isValidEmail = (email: string): boolean => {
    if (!email || email.trim() === '') return true; // Email non è obbligatoria
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Funzione di validazione per codice fiscale italiano
  const isValidCodiceFiscale = (cf: string): boolean => {
    if (!cf || cf.trim() === '') return false; // CF è obbligatorio se non c'è P.IVA
    const cfRegex = /^[A-Za-z]{6}[0-9]{2}[A-Za-z]{1}[0-9]{2}[A-Za-z]{1}[0-9]{3}[A-Za-z]{1}$/;
    return cfRegex.test(cf);
  };
  
  // Funzione di validazione per partita IVA italiana
  const isValidPartitaIVA = (piva: string): boolean => {
    if (!piva || piva.trim() === '') return false; // P.IVA è obbligatoria se non c'è CF
    const pivaRegex = /^[0-9]{11}$/;
    return pivaRegex.test(piva);
  };

  // Gestisce l'invio del form nuovo cliente
  const handleNuovoClienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      setError('ID azienda mancante. Impossibile aggiungere il cliente.');
      return;
    }
    
    // Validazione campi obbligatori
    if (!nuovoClienteForm.descrizione.trim()) {
      setError('Il campo Denominazione/Nome è obbligatorio.');
      return;
    }
    
    // Validazione campi obbligatori
    if (!nuovoClienteForm.indirizzo.trim()) {
      setError('Il campo Indirizzo è obbligatorio.');
      return;
    }
    
    if (!nuovoClienteForm.cap.trim()) {
      setError('Il campo CAP è obbligatorio.');
      return;
    }
    
    if (!nuovoClienteForm.comune_id) {
      setError('Il campo Comune è obbligatorio.');
      return;
    }
    
    if (!nuovoClienteForm.provincia_id) {
      setError('Il campo Provincia è obbligatorio.');
      return;
    }
    
    if (!nuovoClienteForm.nazione_id) {
      setError('Il campo Nazione è obbligatorio.');
      return;
    }
    
    if (!nuovoClienteForm.telefono.trim()) {
      setError('Il campo Telefono è obbligatorio.');
      return;
    }
    
    // Validazione email
    if (!isValidEmail(nuovoClienteForm.email)) {
      setError('Formato email non valido.');
      return;
    }
    
    // Validazione che almeno uno tra codice fiscale e partita IVA sia presente e valido
    const hasCF = isValidCodiceFiscale(nuovoClienteForm.codice_fiscale);
    const hasPIVA = isValidPartitaIVA(nuovoClienteForm.partita_iva);
    
    if (!hasCF && !hasPIVA) {
      setError('È obbligatorio specificare almeno uno tra Codice Fiscale e Partita IVA in formato valido.');
      return;
    }
    
    // Controlli individuali sui formati se sono stati inseriti
    if (nuovoClienteForm.codice_fiscale && !hasCF) {
      setError('Formato codice fiscale non valido. Deve essere di 16 caratteri alfanumerici.');
      return;
    }
    
    if (nuovoClienteForm.partita_iva && !hasPIVA) {
      setError('Formato partita IVA non valido. Deve essere di 11 cifre numeriche.');
      return;
    }
    
    try {
      setSalvandoNuovoCliente(true);
      
      // Prepara i dati da inviare - mappando i campi del form ai nomi dei campi del database
      // Nota: l'ID SIAN vuoto sarà gestito automaticamente dal backend
      const clienteData: Record<string, any> = {
        descrizione: nuovoClienteForm.descrizione,
        indirizzo: nuovoClienteForm.indirizzo,
        cap: nuovoClienteForm.cap,
        comune: nuovoClienteForm.comune_id, // Mappato da comune_id a comune
        provincia: nuovoClienteForm.provincia_id, // Mappato da provincia_id a provincia
        nazione: nuovoClienteForm.nazione_id, // Mappato da nazione_id a nazione
        telefono: nuovoClienteForm.telefono,
        mail: nuovoClienteForm.email, // Mappato da email a mail
        codfisc: nuovoClienteForm.codice_fiscale, // Mappato da codice_fiscale a codfisc
        partiva: nuovoClienteForm.partita_iva, // Mappato da partita_iva a partiva
        olivedef: nuovoClienteForm.olivedef
        // Non inviamo id_sian se è vuoto per consentire al backend di generarlo automaticamente
      };
      
      // Se l'ID SIAN è stato specificato esplicitamente, lo includiamo
      if (nuovoClienteForm.id_sian && nuovoClienteForm.id_sian.trim()) {
        clienteData.id_sian = nuovoClienteForm.id_sian.trim();
      }
      
      // Log dei dati che stiamo inviando per debug
      console.log('Invio dati nuovo cliente:', clienteData);
      
      // Recupera il codice companyCode (es. "frant") necessario per il controller
      if (!companyCode) {
        throw new Error('Codice azienda mancante.');
      }
      
      console.log(`Creazione soggetto per l'azienda ${companyId} con codice ${companyCode}`);
      
      // Utilizziamo il percorso corretto per le tabelle aziendali
      // NOTA: la tabella nel database è prefissata con companyCode ma l'endpoint richiede solo 'soggetti'
      const response = await axios.post(
        `/api/company/${companyId}/tables/soggetti`,
        clienteData,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Risposta creazione cliente:', response.data);
      
      if (response.data.success) {
        // Ottieni il nuovo cliente creato
        const nuovoCliente = response.data.data;
        
        // Aggiorna la lista dei clienti
        setClienti(prev => [...prev, nuovoCliente]);
        
        // Seleziona il nuovo cliente nel form
        setForm(prev => ({
          ...prev,
          cliente_id: nuovoCliente.id
        }));
        
        // Esegui la logica di handleClienteChange come se l'utente avesse selezionato questo cliente
        if (nuovoCliente.olivedef) {
          const oliveArticolo = articoliOlive.find(a => a.id === nuovoCliente.olivedef);
          
          if (oliveArticolo) {
            setForm(prev => {
              const newForm = {
                ...prev,
                olive_id: oliveArticolo.id,
                macroarea: oliveArticolo.macroarea,
                origispeci: oliveArticolo.origispeci,
                flag_bio: oliveArticolo.flag_bio,
                flag_dop: false,
                flag_igp: false
              };
              
              // Verifica DOP/IGP
              const isDopIgpMacroarea = oliveArticolo.macroarea === 12 || 
                                       oliveArticolo.macroarea === 13 || 
                                       oliveArticolo.macroarea === 14;
              
              if (isDopIgpMacroarea && oliveArticolo.origispeci) {
                const originiIds = oliveArticolo.origispeci.split(',').map(id => parseInt(id.trim()));
                
                const hasDop = originiIds.some(id => {
                  const origine = originiSpecifiche.find(o => o.id === id);
                  return origine?.flag_dop === true;
                });
                
                if (hasDop) {
                  newForm.flag_dop = true;
                } else {
                  newForm.flag_igp = true;
                }
              }
              
              // Cerchiamo l'olio di default per queste olive
              const oliveOlioRel = oliveToOli.find(rel => 
                rel.cod_olive === oliveArticolo.id && rel.flag_default
              );
              
              if (oliveOlioRel) {
                newForm.olio_id = oliveOlioRel.cod_olio;
              }
              
              return newForm;
            });
          }
        }
        
        // Resetta il form e chiudi il modal
        setNuovoClienteForm({
          descrizione: '',
          indirizzo: '',
          cap: '',
          comune_id: undefined,
          provincia_id: undefined,
          nazione_id: undefined,
          telefono: '',
          email: '',
          codice_fiscale: '',
          partita_iva: '',
          id_sian: '',
          olivedef: undefined
        });
        
        // Reset filtri
        setComuneFilter('');
        setProvinciaFilter('');
        setNazioneFilter('');
        
        setShowNuovoClienteModal(false);
        setSuccess('Cliente aggiunto con successo!');
        
        // Aggiorna l'ultimo ID SIAN se necessario
        if ((!nuovoClienteForm.id_sian || !nuovoClienteForm.id_sian.trim()) && response.data.ultimoidsoggetto) {
          setUltimoIdSian(response.data.ultimoidsoggetto);
        }
      } else {
        throw new Error(response.data.message || 'Errore sconosciuto');
      }
    } catch (err: any) {
      console.error('Errore nella creazione del cliente:', err);
      
      if (err.response) {
        // Gestione specifica degli errori più comuni
        if (err.response.status === 404) {
          setError(`Errore 404: Risorsa non trovata. Verifica che il servizio sia online.`);
        } else if (err.response.status === 403) {
          setError(`Errore 403: Non hai i permessi necessari per questa operazione.`);
        } else if (err.response.status === 500 && err.response.data?.error?.includes('relation') && err.response.data?.error?.includes('does not exist')) {
          // Errore di tabella non trovata (molto comune in questo tipo di app)
          setError(`La tabella 'soggetti' non esiste per questa azienda. Potrebbe essere necessario inizializzare le tabelle aziendali.`);
        } else {
          setError(err.response.data?.message || `Errore del server (${err.response.status})`);
        }
        
        // Log dettagliato per debug
        console.error('Dettagli errore:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
      } else if (err.request) {
        setError('Nessuna risposta dal server. Verificare la connessione.');
      } else {
        setError(err.message || 'Errore imprevisto durante il salvataggio');
      }
    } finally {
      setSalvandoNuovoCliente(false);
    }
  };
  
  return (
    <div className="conferimento-cterzi">
      <div className="conferimento-header">
        <h2><i className="fas fa-truck-loading"></i> Conferimento Conto Terzi</h2>
      </div>
      
      {/* Rimosso il messaggio di precompilazione in corso */}
      
      {error && (
        <div className="error-message">
          <div className="error-content">
            <i className="fas fa-exclamation-triangle"></i>
            <div className="error-text">
              {error.includes('tabella soggetti') ? (
                <>
                  <div><strong>Errore:</strong> La tabella "soggetti" non è stata trovata per questa azienda.</div>
                  <div>Possibili cause:</div>
                  <ul>
                    <li>Le tabelle aziendali non sono state correttamente create</li>
                    <li>L'ID dell'azienda non è corretto: {companyId}</li>
                    <li>Codice azienda utilizzato: {companyCode}</li>
                  </ul>
                  <div>Contatta l'amministratore per risolvere il problema.</div>
                </>
              ) : error.includes('tabella conferimenti') ? (
                <>
                  <div><strong>Errore:</strong> {error}</div>
                  <div>Possibili cause:</div>
                  <ul>
                    <li>La tabella conferimenti non è stata creata</li>
                    <li>L'ID dell'azienda non è corretto: {companyId}</li>
                  </ul>
                  <div>Contatta l'amministratore per risolvere il problema.</div>
                </>
              ) : (
                error
              )}
            </div>
            <button 
              className="dismiss-button" 
              onClick={() => setError(null)}
              aria-label="Chiudi messaggio"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <div className="success-content">
            <i className="fas fa-check-circle"></i>
            <div className="success-text">{success}</div>
            <button 
              className="dismiss-button" 
              onClick={() => setSuccess(null)}
              aria-label="Chiudi messaggio"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
      
      <div className="conferimento-grid">
        <div className="form-component">
          <h3><i className="fas fa-edit"></i> Registrazione Conferimento</h3>
          
          <div className="form-content">
            <form onSubmit={handleSubmit}>
              {/* Sezione Cliente e Date */}
              <div className="form-section">
                <h4><i className="fas fa-user"></i> Cliente e Date</h4>
                <div className="form-row">
                  <FormField 
                    id="cliente_id" 
                    label="Cliente (Produttore)" 
                    description="Seleziona il produttore che conferisce le olive" 
                    icon="fas fa-user"
                    required
                  >
                    <div style={{position: 'relative'}}>
                      <div style={{display: 'flex', alignItems: 'center'}}>
                        <input
                          type="text"
                          id="cliente_search"
                          placeholder={form.cliente_id ? clienti.find(c => c.id === form.cliente_id)?.descrizione || "Cerca cliente..." : "Cerca cliente..."}
                          value={clienteFilter}
                          onChange={(e) => setClienteFilter(e.target.value)}
                          className="form-control"
                          style={{
                            width: '100%', 
                            padding: '8px'
                          }}
                          onClick={(e) => {
                            // Assicura solo che il focus rimanga sul campo di ricerca
                            (e.target as HTMLInputElement).focus();
                          }}  
                          onFocus={() => {
                            if (form.cliente_id && !clienteFilter) {
                              // Se c'è un cliente già selezionato e il campo è vuoto, mostriamo il nome
                              const cliente = clienti.find(c => c.id === form.cliente_id);
                              if (cliente) {
                                setClienteFilter(cliente.descrizione);
                              }
                            }
                          }}
                        />
                        {clienteFilter && (
                          <button 
                            type="button"
                            onClick={() => setClienteFilter('')}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                      
                      {/* Box di selezione - mostra solo quando l'utente digita qualcosa */}
                      {(clienti.filter(cliente => cliente.descrizione.toLowerCase().includes(clienteFilter.toLowerCase())).length > 0 && clienteFilter) && (
                        <div 
                          onClick={(e) => e.preventDefault()} // Impedisce che il click chiuda la lista
                          style={{
                          position: 'absolute',
                          width: '100%',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '0 0 4px 4px',
                          zIndex: 1000,
                          marginTop: '1px'
                        }}>
                          {clienti
                            // Filtra i clienti in base al testo digitato
                            .filter(cliente => cliente.descrizione.toLowerCase().includes(clienteFilter.toLowerCase()))
                            .sort((a, b) => {
                              // Se il filtro è vuoto, ordina alfabeticamente
                              if (clienteFilter === '') {
                                return a.descrizione.localeCompare(b.descrizione);
                              }
                              
                              // Altrimenti, priorità a quelli che iniziano con il filtro
                              const aStartsWith = a.descrizione.toLowerCase().startsWith(clienteFilter.toLowerCase());
                              const bStartsWith = b.descrizione.toLowerCase().startsWith(clienteFilter.toLowerCase());
                              if (aStartsWith && !bStartsWith) return -1;
                              if (!aStartsWith && bStartsWith) return 1;
                              return a.descrizione.localeCompare(b.descrizione);
                            })
                            .slice(0, 100)
                            .map(cliente => (
                              <div 
                                key={cliente.id} 
                                onClick={() => {
                                  setForm(prev => ({
                                    ...prev,
                                    cliente_id: cliente.id
                                  }));
                                  setClienteFilter(''); // Svuotiamo il campo di ricerca dopo la selezione
                                  handleClienteChange({target: {value: cliente.id.toString()}} as React.ChangeEvent<HTMLSelectElement>);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #eee',
                                  backgroundColor: form.cliente_id === cliente.id ? '#e8f4e8' : 'white',
                                }}
                                onMouseOver={(e) => {
                                  if (form.cliente_id !== cliente.id) {
                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                  }
                                }}
                                onMouseOut={(e) => {
                                  if (form.cliente_id !== cliente.id) {
                                    e.currentTarget.style.backgroundColor = 'white';
                                  }
                                }}
                              >
                                {cliente.descrizione}
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>

                    <input 
                      type="hidden" 
                      id="cliente_id"
                      name="cliente_id"
                      value={form.cliente_id || ''}
                      required
                    />
                    
                    <button
                      type="button"
                      className="btn-add-cliente"
                      onClick={() => setShowNuovoClienteModal(true)}
                      style={{
                        marginLeft: '10px',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        background: '#4a8f29',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '14px'
                      }}
                    >
                      <i className="fas fa-plus" style={{marginRight: '5px'}}></i> Nuovo
                    </button>
                  </FormField>
                  
                  <FormField 
                    id="data_arrivo" 
                    label="Data Entrata Olive" 
                    description="Data di entrata delle olive nel frantoio" 
                    icon="fas fa-calendar-alt"
                    required
                  >
                    <input
                      type="date"
                      id="data_arrivo"
                      name="data_arrivo"
                      value={form.data_arrivo}
                      onChange={handleInputChange}
                      required
                    />
                  </FormField>
                </div>
                
                <div className="form-row">
                  <FormField
                    id="committente_id"
                    label="Committente"
                    description={
                      form.committente_id && form.committente_id === form.cliente_id 
                        ? "Il committente selezionato è uguale al produttore" 
                        : "Seleziona il committente se diverso dal produttore"
                    }
                    icon="fas fa-briefcase"
                  >
                    <div style={{position: 'relative'}}>
                      <div style={{display: 'flex', alignItems: 'center'}}>
                        <input
                          type="text"
                          id="committente_search"
                          placeholder={form.committente_id ? clienti.find(c => c.id === form.committente_id)?.descrizione || "Cerca committente..." : "Cerca committente..."}
                          value={committenteFilter}
                          onChange={(e) => setCommittenteFilter(e.target.value)}
                          className="form-control"
                          style={{
                            width: '100%', 
                            padding: '8px'
                          }}
                          onFocus={() => {
                            if (form.committente_id && !committenteFilter) {
                              // Se c'è un committente già selezionato e il campo è vuoto, mostriamo il nome
                              const committente = clienti.find(c => c.id === form.committente_id);
                              if (committente) {
                                setCommittenteFilter(committente.descrizione);
                              }
                            }
                          }}
                        />
                        {committenteFilter && (
                          <button 
                            type="button"
                            onClick={() => setCommittenteFilter('')}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                      
                      {/* Box di selezione */}
                      {clientiLoaded && clienti
                        .filter(cliente => cliente.descrizione.toLowerCase().includes(committenteFilter.toLowerCase()))
                        .length > 0 && committenteFilter && (
                        <div style={{
                          position: 'absolute',
                          width: '100%',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '0 0 4px 4px',
                          zIndex: 1000,
                          marginTop: '1px'
                        }}>
                          {clienti
                            .filter(cliente => cliente.descrizione.toLowerCase().includes(committenteFilter.toLowerCase()))
                            .sort((a, b) => {
                              const aStartsWith = a.descrizione.toLowerCase().startsWith(committenteFilter.toLowerCase());
                              const bStartsWith = b.descrizione.toLowerCase().startsWith(committenteFilter.toLowerCase());
                              if (aStartsWith && !bStartsWith) return -1;
                              if (!aStartsWith && bStartsWith) return 1;
                              return a.descrizione.localeCompare(b.descrizione);
                            })
                            .slice(0, 100)
                            .map(cliente => (
                              <div 
                                key={cliente.id} 
                                onClick={() => {
                                  setForm(prev => ({
                                    ...prev,
                                    committente_id: cliente.id
                                  }));
                                  setCommittenteFilter(''); // Svuotiamo il campo di ricerca dopo la selezione
                                }}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #eee',
                                  backgroundColor: form.committente_id === cliente.id ? '#e8f4e8' : 'white',
                                }}
                                onMouseOver={(e) => {
                                  if (form.committente_id !== cliente.id) {
                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                  }
                                }}
                                onMouseOut={(e) => {
                                  if (form.committente_id !== cliente.id) {
                                    e.currentTarget.style.backgroundColor = 'white';
                                  }
                                }}
                              >
                                {cliente.descrizione}
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>

                    <input 
                      type="hidden" 
                      id="committente_id"
                      name="committente_id"
                      value={form.committente_id || ''}
                    />
                  </FormField>
                  
                  <div className="form-group">
                    {/* Intenzionalmente vuoto per mantenere l'allineamento della griglia */}
                  </div>
                </div>
                
              </div>
              
              {/* Sezione Documento */}
              <div className="form-section">
                <h4><i className="fas fa-file-alt"></i> Documento</h4>
                <div className="form-row">
                  <div className="form-group">
                    <div className="checkbox-form-group">
                      <input
                        type="checkbox"
                        id="flag_privato_senza_doc"
                        name="flag_privato_senza_doc"
                        checked={form.flag_privato_senza_doc}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="flag_privato_senza_doc">
                        Privato senza documento
                        <span 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const helpText = document.getElementById('help-flag_privato_senza_doc');
                            if (helpText) {
                              helpText.style.display = helpText.style.display === 'block' ? 'none' : 'block';
                            }
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
                    </div>
                    <small id="help-flag_privato_senza_doc" style={{
                      display: 'none', 
                      padding: '6px 10px',
                      marginTop: '5px',
                      backgroundColor: '#f8f9fa', 
                      borderLeft: '3px solid #4a8f29',
                      borderRadius: '0 4px 4px 0',
                      marginBottom: '6px'
                    }}>
                      Seleziona questa opzione se il conferimento è da privato senza documento di trasporto. 
                      In questo caso, i campi numero e data documento saranno nascosti.
                    </small>
                  </div>
                </div>
                
                {!form.flag_privato_senza_doc && (
                  <div className="form-row">
                    <FormField
                      id="num_documento"
                      label="Numero Documento"
                      description="Numero del documento di trasporto che accompagna le olive. Richiesto per la tracciabilità a norma di legge."
                      icon="fas fa-file-alt"
                    >
                      <input
                        type="text"
                        id="num_documento"
                        name="num_documento"
                        value={form.num_documento}
                        onChange={handleInputChange}
                      />
                    </FormField>
                    
                    <FormField
                      id="data_documento"
                      label="Data Documento"
                      description="Data di emissione del documento di trasporto. Importante ai fini fiscali e per la tracciabilità."
                      icon="fas fa-calendar-alt"
                    >
                      <input
                        type="date"
                        id="data_documento"
                        name="data_documento"
                        value={form.data_documento}
                        onChange={handleInputChange}
                      />
                    </FormField>
                  </div>
                )}
              </div>
              
              {/* Sezione Tipologia Olive */}
              <div className="form-section">
                <h4>
                  <i className="fas fa-leaf"></i> Tipologia di Olive
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
                <div className="form-row">
                  <FormField
                    id="olive_id"
                    label="Tipologia Olive"
                    description="Seleziona la tipologia delle olive conferite. Influenzerà automaticamente i campi Caratteristiche, Macroarea e Origine Specifica."
                    icon="fas fa-leaf"
                    required
                  >
                    <select 
                      id="olive_id"
                      name="olive_id"
                      value={form.olive_id || ''}
                      onChange={handleOliveChange}
                      required
                    >
                      <option value="">Seleziona tipologia olive...</option>
                      {articoliOlive.map(oliva => (
                        <option key={oliva.id} value={oliva.id}>
                          {oliva.descrizione}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  
                  {/* Il campo Caratteristiche è nascosto qui */}
                </div>
                
                {/* Campi informativi (sola visualizzazione) - mostrati solo se showOliveDetails è true */}
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
                    
                    {/* Aggiungiamo qui il campo Caratteristiche */}
                    <div className="form-row" style={{ marginBottom: '15px' }}>
                      <div className="form-group" style={{ width: '100%' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                          <i className="fas fa-tags" style={{ marginRight: '5px' }}></i> Caratteristiche
                        </label>
                        <div className="form-display-field" style={{ padding: '7px 0' }}>
                          {form.flag_bio && <span className="badge-bio" style={{ marginRight: '10px' }}><i className="fas fa-leaf"></i> BIO</span>}
                          {form.flag_dop && <span className="badge-cl" style={{ marginRight: '10px' }}><i className="fas fa-certificate"></i> DOP</span>}
                          {form.flag_igp && <span className="badge-cl" style={{ marginRight: '10px' }}><i className="fas fa-award"></i> IGP</span>}
                          {!form.flag_bio && !form.flag_dop && !form.flag_igp && <span>Standard</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <FormField
                        id="macroarea"
                        label="Macroarea"
                        description="Macroarea delle olive, derivata automaticamente dalla tipologia di olive selezionata."
                        icon="fas fa-map-marker-alt"
                      >
                        <div className="form-display-field">
                          {form.macroarea ? 
                            macroaree.find(m => m.id === form.macroarea)?.descrizione : 
                            'Non specificata'
                          }
                        </div>
                      </FormField>
                      
                      <FormField
                        id="origispeci"
                        label="Origine Specifica"
                        description="Origine specifica delle olive, derivata automaticamente dalla tipologia di olive selezionata."
                        icon="fas fa-map-pin"
                      >
                        <div className="form-display-field">
                          {form.origispeci ? 
                            form.origispeci.split(',').map(id => {
                              const origine = originiSpecifiche.find(o => o.id === parseInt(id.trim()));
                              return origine ? origine.descrizione : '';
                            }).filter(Boolean).join(', ') : 
                            'Non specificata'
                          }
                        </div>
                      </FormField>
                    </div>
                  </div>
                )}
                
                {isRaccoltaRequired && (
                  <div className="form-row" style={{ 
                    backgroundColor: '#fff8e6',
                    padding: '10px',
                    borderRadius: '4px',
                    marginTop: '10px',
                    marginBottom: '10px',
                    borderLeft: '3px solid #ffc107'
                  }}>
                    <div style={{ width: '100%', marginBottom: '10px' }}>
                      <h5 style={{ margin: '5px 0', color: '#856404' }}>
                        <i className="fas fa-exclamation-triangle"></i> Informazioni Raccolta Richieste
                      </h5>
                      <p style={{ fontSize: '0.9em', margin: '5px 0' }}>
                        Per questa tipologia di olive è necessario specificare data e ora di raccolta.
                      </p>
                    </div>
                    
                    <FormField
                      id="data_raccolta"
                      label="Data Raccolta"
                      description="Data in cui sono state raccolte le olive. Obbligatorio per questo tipo di olive."
                      icon="fas fa-calendar-day"
                      required={true}
                    >
                      <input
                        type="date"
                        id="data_raccolta"
                        name="data_raccolta"
                        value={form.data_raccolta}
                        onChange={handleInputChange}
                        required={true}
                      />
                    </FormField>
                    
                    <FormField
                      id="ora_raccolta"
                      label="Ora Raccolta"
                      description="Orario approssimativo in cui sono state raccolte le olive. Obbligatorio per questo tipo di olive."
                      icon="fas fa-clock"
                      required={true}
                    >
                      <input
                        type="time"
                        id="ora_raccolta"
                        name="ora_raccolta"
                        value={form.ora_raccolta}
                        onChange={handleInputChange}
                        required={true}
                      />
                    </FormField>
                  </div>
                )}
                
              </div>
              
              {/* Sezione Quantità e Prezzi */}
              <div className="form-section">
                <h4><i className="fas fa-balance-scale"></i> Quantità e Prezzi</h4>
                <div className="form-row">
                  <FormField
                    id="kg_olive_conferite"
                    label="Kg Olive Conferite"
                    description="Quantità di olive conferite in Kg. Questo valore sarà usato per calcolare il prezzo totale della molitura e la resa."
                    icon="fas fa-balance-scale"
                    required
                  >
                    <input
                      type="number"
                      id="kg_olive_conferite"
                      name="kg_olive_conferite"
                      value={form.kg_olive_conferite || ''}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      required
                    />
                  </FormField>
                  
                  <FormField
                    id="prezzo_molitura_kg"
                    label="Prezzo Molitura al Kg"
                    description="Prezzo della molitura per Kg di olive. Viene calcolato automaticamente dal listino in base ai Kg di olive conferite. Può essere modificato manualmente se necessario."
                    icon="fas fa-euro-sign"
                    required
                  >
                    <div className="input-with-prefix">
                      <span className="input-prefix">€</span>
                      <input
                        type="number"
                        id="prezzo_molitura_kg"
                        name="prezzo_molitura_kg"
                        value={form.prezzo_molitura_kg || ''}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </FormField>
                </div>
                
                <div className="form-row">
                  <FormField
                    id="prezzo_molitura"
                    label="Prezzo Molitura Totale"
                    description="Prezzo totale della molitura, calcolato automaticamente moltiplicando il prezzo al Kg per i Kg di olive conferite. Il prezzo al Kg è determinato in base alla fascia di peso del listino aziendale."
                    icon="fas fa-calculator"
                  >
                    <div className="input-with-prefix">
                      <span className="input-prefix">€</span>
                      <input
                        type="number"
                        id="prezzo_molitura"
                        name="prezzo_molitura"
                        value={form.prezzo_molitura || ''}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        readOnly
                      />
                    </div>
                  </FormField>
                </div>
              </div>
              
              {/* Sezione Molitura - Layout Compatto */}
              <div className="form-section">
                <h4><i className="fas fa-cogs"></i> Molitura</h4>
                <div className="form-row" style={{display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
                  {/* Colonna 1: Tipologia Olio e Checkbox */}
                  <div style={{flex: '1', minWidth: '250px'}}>
                    <FormField
                      id="olio_id"
                      label="Tipologia Olio Ottenuto"
                      description="Tipologia dell'olio ottenuto dalla molitura"
                      icon="fas fa-wine-bottle"
                    >
                      <select 
                        id="olio_id"
                        name="olio_id"
                        value={form.olio_id || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Seleziona tipologia olio...</option>
                        {articoliOlio.map(olio => (
                          <option key={olio.id} value={olio.id}>
                            {olio.descrizione}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    {/* Checkbox sotto la tipologia olio */}
                    {form.olio_id > 0 && (
                      <div style={{marginTop: '10px'}}>
                        <div className="checkbox-form-group">
                          <input
                            type="checkbox"
                            id="flag_cliente_ritira_olio"
                            name="flag_cliente_ritira_olio"
                            checked={form.flag_cliente_ritira_olio}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="flag_cliente_ritira_olio">
                            Il cliente ritira l'olio
                            <i 
                              className="fas fa-question-circle"
                              style={{
                                color: '#4a8f29',
                                fontSize: '14px',
                                marginLeft: '5px',
                                cursor: 'pointer'
                              }}
                              title="Se selezionato, il cliente ritirerà l'olio prodotto"
                            ></i>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Colonna 2: Kg Olio Ottenuto */}
                  <div style={{width: '150px'}}>
                    <FormField
                      id="kg_olio_ottenuto"
                      label="Kg Olio Ottenuto"
                      description="Quantità di olio in Kg"
                      icon="fas fa-weight"
                    >
                      <input
                        type="number"
                        id="kg_olio_ottenuto"
                        name="kg_olio_ottenuto"
                        value={form.kg_olio_ottenuto || ''}
                        onChange={handleInputChange}
                        step="0.1"
                        min="0"
                        style={{width: '100%'}}
                      />
                    </FormField>
                    {/* Div vuoto per allineamento con checkbox */}
                    <div style={{height: '41px'}}></div>
                  </div>
                </div>
                
                {/* Selezione cisterna - visibile solo se il cliente NON ritira l'olio */}
                {form.olio_id > 0 && !form.flag_cliente_ritira_olio && (
                  <div className="form-row">
                    <div style={{maxWidth: '500px', width: '100%'}}>
                      <FormField
                        id="cisterna_id"
                        label="Cisterna di Stoccaggio"
                        description="Cisterna per lo stoccaggio dell'olio"
                        icon="fas fa-oil-can"
                      >
                        <select 
                          id="cisterna_id"
                          name="cisterna_id"
                          value={form.cisterna_id || ''}
                          onChange={handleInputChange}
                          style={{width: '100%'}}
                        >
                          <option value="">Seleziona cisterna...</option>
                          {cisterne.length === 0 ? (
                            <option value="" disabled>Nessuna cisterna disponibile</option>
                          ) : (
                            cisterne
                              .filter(cisterna => 
                                !form.magazzino_id || cisterna.id_magazzino === form.magazzino_id
                              )
                              .map(cisterna => (
                                <option key={cisterna.id} value={cisterna.id}>
                                  {cisterna.descrizione}
                                  {cisterna.capacita ? ` (${cisterna.capacita} kg)` : ''}
                                  {cisterna.giacenza ? ` - G: ${cisterna.giacenza} kg` : ''}
                                </option>
                              ))
                          )}
                        </select>
                        {cisterne.length === 0 && (
                          <small className="text-warning">
                            <i className="fas fa-exclamation-triangle"></i> Nessuna cisterna disponibile
                          </small>
                        )}
                      </FormField>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Pulsanti di azione */}
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Salvataggio in corso...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i> Salva Conferimento
                    </>
                  )}
                </button>
                <button 
                  type="reset" 
                  className="btn-secondary" 
                  disabled={loading}
                  onClick={() => {
                    setForm({
                      cliente_id: 0,
                      committente_id: undefined,
                      data_arrivo: new Date().toISOString().slice(0, 10),
                      data_raccolta: new Date().toISOString().slice(0, 10),
                      ora_raccolta: '08:00',
                      num_documento: '',
                      data_documento: new Date().toISOString().slice(0, 10),
                      flag_privato_senza_doc: false,
                      olive_id: 0,
                      olio_id: 0,
                      kg_olive_conferite: 0,
                      prezzo_molitura_kg: 0,
                      prezzo_molitura: 0,
                      kg_olio_ottenuto: 0, // Non obbligatorio ma inizializzato a 0
                      flag_cliente_ritira_olio: false, // Default no ritiro
                      magazzino_id: undefined, // Reset magazzino
                      cisterna_id: undefined // Reset cisterna
                    });
                    setError(null);
                    setSuccess(null);
                    setIsRaccoltaRequired(false);
                  }}
                >
                  <i className="fas fa-eraser"></i> Pulisci Form
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Pannello informativo/riepilogativo */}
        <div className="conferimento-info-panel">
          <div className="info-card">
            <h3><i className="fas fa-info-circle"></i> Informazioni</h3>
            <div className="info-content">
              <p>Compila il form per registrare un nuovo conferimento di olive in conto terzi.</p>
              <p>I campi contrassegnati con * sono obbligatori.</p>
              
              <div className="tips-list">
                <h4>Note importanti:</h4>
                <ul>
                  <li>Selezionando un cliente, i campi relativi alla tipologia di olive verranno pre-compilati se il cliente ha delle olive predefinite.</li>
                  <li>I valori di Macroarea, Origine Specifica, BIO e DOP sono derivati automaticamente dalla tipologia di olive selezionata.</li>
                  <li>Il prezzo totale della molitura viene calcolato automaticamente in base ai Kg di olive e al prezzo al Kg.</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Riepilogo dei dati inseriti */}
          {(form.cliente_id && form.olive_id) && (
            <div className="info-card summary-card">
              <h3>
                <i className="fas fa-clipboard-check"></i> Riepilogo
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
                    fontSize: '0.8em',
                    textDecoration: 'underline',
                    padding: '0',
                  }}
                >
                  {showOliveDetails ? 
                    <><i className="fas fa-eye-slash"></i> Nascondi dettagli</> : 
                    <><i className="fas fa-eye"></i> Mostra dettagli</>
                  }
                </button>
              </h3>
              <div className="summary-content">
                <div className="summary-row">
                  <span className="summary-label">Cliente:</span>
                  <span className="summary-value">{clienti.find(c => c.id === form.cliente_id)?.descrizione || 'Non selezionato'}</span>
                </div>
                {form.committente_id && form.committente_id !== form.cliente_id && (
                  <div className="summary-row">
                    <span className="summary-label">Committente:</span>
                    <span className="summary-value">{clienti.find(c => c.id === form.committente_id)?.descrizione || 'Non selezionato'}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span className="summary-label">Data Arrivo:</span>
                  <span className="summary-value">{formatDate(form.data_arrivo)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Tipologia Olive:</span>
                  <span className="summary-value">
                    {articoliOlive.find(o => o.id === form.olive_id)?.descrizione || 'Non selezionato'}
                    {form.flag_bio && <span className="badge-bio" style={{marginLeft: '5px'}}><i className="fas fa-leaf"></i> BIO</span>}
                    {form.flag_dop && <span className="badge-cl" style={{marginLeft: '5px'}}><i className="fas fa-certificate"></i> DOP</span>}
                    {form.flag_igp && <span className="badge-cl" style={{marginLeft: '5px'}}><i className="fas fa-award"></i> IGP</span>}
                  </span>
                </div>
                
                {/* Dettagli origine mostrati solo se showOliveDetails è true */}
                {showOliveDetails && (
                  <>
                    <div className="summary-row">
                      <span className="summary-label">Macroarea:</span>
                      <span className="summary-value">
                        {form.macroarea ? 
                          macroaree.find(m => m.id === form.macroarea)?.descrizione : 
                          'Non specificata'
                        }
                      </span>
                    </div>
                    
                    <div className="summary-row">
                      <span className="summary-label">Origine:</span>
                      <span className="summary-value">
                        {form.origispeci ? 
                          form.origispeci.split(',').map(id => {
                            const origine = originiSpecifiche.find(o => o.id === parseInt(id.trim()));
                            return origine ? origine.descrizione : '';
                          }).filter(Boolean).join(', ') : 
                          'Non specificata'
                        }
                      </span>
                    </div>
                    
                    {isRaccoltaRequired && (
                      <div className="summary-row">
                        <span className="summary-label">Data/Ora Raccolta:</span>
                        <span className="summary-value">
                          {formatDate(form.data_raccolta)} {form.ora_raccolta}
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                <div className="summary-row">
                  <span className="summary-label">Tipologia Olio:</span>
                  <span className="summary-value">{articoliOlio.find(o => o.id === form.olio_id)?.descrizione || 'Non selezionato'}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Kg Olive Conferite:</span>
                  <span className="summary-value">{form.kg_olive_conferite} Kg</span>
                </div>
                {form.kg_olio_ottenuto > 0 && (
                  <div className="summary-row">
                    <span className="summary-label">Kg Olio Ottenuto:</span>
                    <span className="summary-value">{form.kg_olio_ottenuto} Kg</span>
                  </div>
                )}
                {form.kg_olio_ottenuto > 0 && (
                  <div className="summary-row">
                    <span className="summary-label">Resa:</span>
                    <span className="summary-value">
                      {form.kg_olive_conferite > 0
                        ? `${((form.kg_olio_ottenuto / form.kg_olive_conferite) * 100).toFixed(2)}%` 
                        : 'N/A'}
                    </span>
                  </div>
                )}
                <div className="summary-row">
                  <span className="summary-label">Prezzo Molitura:</span>
                  <span className="summary-value">€ {form.prezzo_molitura.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal per l'aggiunta di un nuovo cliente */}
      {showNuovoClienteModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowNuovoClienteModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#333'
              }}
              aria-label="Chiudi"
            >
              <i className="fas fa-times"></i>
            </button>
            
            <h3 style={{marginBottom: '20px', color: '#4a8f29', borderBottom: '2px solid #eee', paddingBottom: '10px'}}>
              <i className="fas fa-user-plus" style={{marginRight: '10px'}}></i>
              Aggiungi Nuovo Cliente
            </h3>
            
            <form onSubmit={handleNuovoClienteSubmit}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div className="form-group" style={{gridColumn: '1 / span 2'}}>
                  <label htmlFor="descrizione">
                    <i className="fas fa-user" style={{marginRight: '5px'}}></i>
                    Denominazione/Nome*
                  </label>
                  <input
                    type="text"
                    id="descrizione"
                    name="descrizione"
                    value={nuovoClienteForm.descrizione}
                    onChange={handleNuovoClienteInputChange}
                    required
                    className="form-control"
                    style={{width: '100%', padding: '8px', marginTop: '5px'}}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="indirizzo">
                    <i className="fas fa-map-marker-alt" style={{marginRight: '5px'}}></i>
                    Indirizzo
                  </label>
                  <input
                    type="text"
                    id="indirizzo"
                    name="indirizzo"
                    value={nuovoClienteForm.indirizzo}
                    onChange={handleNuovoClienteInputChange}
                    className={`form-control ${nuovoClienteForm.indirizzoValidationError ? 'is-invalid' : ''}`}
                    style={{width: '100%', padding: '8px', marginTop: '5px'}}
                    required
                  />
                  {nuovoClienteForm.indirizzoValidationError && (
                    <small style={{fontSize: '0.8em', color: '#dc3545', display: 'block', marginTop: '4px'}}>
                      {nuovoClienteForm.indirizzoValidationError}
                    </small>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="comune_id">
                    <i className="fas fa-city" style={{marginRight: '5px'}}></i>
                    Comune
                  </label>
                  
                  {/* Sistema di ricerca a due fasi */}
                  <div style={{position: 'relative', marginTop: '5px'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <input
                        type="text"
                        id="comune_search"
                        placeholder="Cerca comune..."
                        value={comuneFilter}
                        onChange={(e) => setComuneFilter(e.target.value)}
                        className={`form-control ${nuovoClienteForm.comuneValidationError ? 'is-invalid' : ''}`}
                        style={{
                          width: '100%', 
                          padding: '8px'
                        }}
                      />
                      {comuneFilter && (
                        <button 
                          type="button"
                          onClick={() => setComuneFilter('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    
                    {/* Box di selezione */}
                    {comuni
                      .filter(comune => comune.descrizione.toLowerCase().includes(comuneFilter.toLowerCase()))
                      .length > 0 && comuneFilter && (
                      <div style={{
                        position: 'absolute',
                        width: '100%',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '0 0 4px 4px',
                        zIndex: 1000,
                        marginTop: '1px'
                      }}>
                        {comuni
                          .filter(comune => comune.descrizione.toLowerCase().includes(comuneFilter.toLowerCase()))
                          .sort((a, b) => {
                            const aStartsWith = a.descrizione.toLowerCase().startsWith(comuneFilter.toLowerCase());
                            const bStartsWith = b.descrizione.toLowerCase().startsWith(comuneFilter.toLowerCase());
                            if (aStartsWith && !bStartsWith) return -1;
                            if (!aStartsWith && bStartsWith) return 1;
                            return a.descrizione.localeCompare(b.descrizione);
                          })
                          .slice(0, 100)
                          .map(comune => (
                            <div 
                              key={comune.id} 
                              onClick={() => {
                                setNuovoClienteForm({
                                  ...nuovoClienteForm,
                                  comune_id: comune.id,
                                  provincia_id: comune.provincia_id
                                });
                                setComuneFilter(comune.descrizione);
                              }}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                                backgroundColor: nuovoClienteForm.comune_id === comune.id ? '#e8f4e8' : 'white',
                              }}
                              onMouseOver={(e) => {
                                if (nuovoClienteForm.comune_id !== comune.id) {
                                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (nuovoClienteForm.comune_id !== comune.id) {
                                  e.currentTarget.style.backgroundColor = 'white';
                                }
                              }}
                            >
                              {comune.descrizione}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                  
                  <input 
                    type="hidden" 
                    id="comune_id"
                    name="comune_id"
                    value={nuovoClienteForm.comune_id || ''}
                  />
                  {nuovoClienteForm.comuneValidationError && (
                    <small style={{fontSize: '0.8em', color: '#dc3545', display: 'block', marginTop: '4px'}}>
                      {nuovoClienteForm.comuneValidationError}
                    </small>
                  )}
                </div>
                
                {/* Contatore risultati per comuni */}
                {comuni.length > 0 && comuneFilter && (
                  <div style={{fontSize: '0.8em', color: '#666', marginTop: '2px'}}>
                    Risultati: {comuni.filter(comune => 
                      comune.descrizione.toLowerCase().includes(comuneFilter.toLowerCase())
                    ).length} di {comuni.length}
                  </div>
                )}
                
                <div className="form-group" style={{display: 'flex', gap: '10px'}}>
                  <div style={{flex: '1'}}>
                    <label htmlFor="cap">
                      <i className="fas fa-mail-bulk" style={{marginRight: '5px'}}></i>
                      CAP
                    </label>
                    <input
                      type="text"
                      id="cap"
                      name="cap"
                      value={nuovoClienteForm.cap}
                      onChange={handleNuovoClienteInputChange}
                      className="form-control"
                      style={{width: '100%', padding: '8px', marginTop: '5px'}}
                    />
                  </div>
                  
                  <div style={{flex: '1'}}>
                    <label htmlFor="provincia_id">
                      <i className="fas fa-map" style={{marginRight: '5px'}}></i>
                      Provincia
                    </label>
                    {/* Sistema di ricerca a due fasi per provincia */}
                    <div style={{position: 'relative', marginTop: '5px'}}>
                      <div style={{display: 'flex', alignItems: 'center'}}>
                        <input
                          type="text"
                          id="provincia_search"
                          placeholder="Cerca provincia..."
                          value={provinciaFilter}
                          onChange={(e) => setProvinciaFilter(e.target.value)}
                          className={`form-control ${nuovoClienteForm.provinciaValidationError ? 'is-invalid' : ''}`}
                          style={{
                            width: '100%', 
                            padding: '8px'
                          }}
                        />
                        {provinciaFilter && (
                          <button 
                            type="button"
                            onClick={() => setProvinciaFilter('')}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                      
                      {/* Box di selezione per province */}
                      {province
                        .filter(provincia => 
                          provincia.descrizione.toLowerCase().includes(provinciaFilter.toLowerCase()) ||
                          (provincia.sigla && provincia.sigla.toLowerCase().includes(provinciaFilter.toLowerCase()))
                        )
                        .length > 0 && provinciaFilter && !nuovoClienteForm.provincia_id && (
                        <div style={{
                          position: 'absolute',
                          width: '100%',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '0 0 4px 4px',
                          zIndex: 1000,
                          marginTop: '1px'
                        }}>
                          {province
                            .filter(provincia => 
                              provincia.descrizione.toLowerCase().includes(provinciaFilter.toLowerCase()) ||
                              (provincia.sigla && provincia.sigla.toLowerCase().includes(provinciaFilter.toLowerCase()))
                            )
                            .sort((a, b) => {
                              if (!provinciaFilter) return 0;
                              
                              // Priorità alle province che iniziano con la stringa di ricerca
                              const aStartsWith = a.descrizione.toLowerCase().startsWith(provinciaFilter.toLowerCase());
                              const bStartsWith = b.descrizione.toLowerCase().startsWith(provinciaFilter.toLowerCase());
                              
                              // Priorità alle province corrispondenti esattamente alla sigla
                              const aMatchesSigla = a.sigla && a.sigla.toLowerCase() === provinciaFilter.toLowerCase();
                              const bMatchesSigla = b.sigla && b.sigla.toLowerCase() === provinciaFilter.toLowerCase();
                              
                              if (aMatchesSigla && !bMatchesSigla) return -1;
                              if (!aMatchesSigla && bMatchesSigla) return 1;
                              if (aStartsWith && !bStartsWith) return -1;
                              if (!aStartsWith && bStartsWith) return 1;
                              
                              return a.descrizione.localeCompare(b.descrizione);
                            })
                            .slice(0, 100)
                            .map(provincia => (
                              <div 
                                key={provincia.id} 
                                onClick={() => {
                                  setNuovoClienteForm({
                                    ...nuovoClienteForm,
                                    provincia_id: provincia.id
                                  });
                                  setProvinciaFilter(provincia.descrizione + (provincia.sigla ? ` (${provincia.sigla})` : ''));
                                }}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #eee',
                                  backgroundColor: 'white',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                {provincia.descrizione} {provincia.sigla ? `(${provincia.sigla})` : ''}
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                    
                    {/* Input nascosto per mantenere il valore nel form */}
                    <input
                      type="hidden"
                      id="provincia_id"
                      name="provincia_id"
                      value={nuovoClienteForm.provincia_id || ''}
                    />
                    {nuovoClienteForm.provinciaValidationError && (
                      <small style={{fontSize: '0.8em', color: '#dc3545', display: 'block', marginTop: '4px'}}>
                        {nuovoClienteForm.provinciaValidationError}
                      </small>
                    )}
                    
                    {/* Rimosso vecchio select nascosto di compatibilità */}
                    {province.length > 0 && provinciaFilter && (
                      <div style={{fontSize: '0.8em', color: '#666', marginTop: '2px'}}>
                        Risultati: {province.filter(provincia => 
                          provincia.descrizione.toLowerCase().includes(provinciaFilter.toLowerCase()) ||
                          (provincia.sigla && provincia.sigla.toLowerCase().includes(provinciaFilter.toLowerCase()))
                        ).length} di {province.length}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="nazione_id">
                    <i className="fas fa-globe" style={{marginRight: '5px'}}></i>
                    Nazione
                  </label>
                  
                  {/* Sistema di ricerca a due fasi per nazione */}
                  <div style={{position: 'relative', marginTop: '5px'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <input
                        type="text"
                        id="nazione_search"
                        placeholder="Cerca nazione..."
                        value={nazioneFilter}
                        onChange={(e) => setNazioneFilter(e.target.value)}
                        className={`form-control ${nuovoClienteForm.nazioneValidationError ? 'is-invalid' : ''}`}
                        style={{
                          width: '100%', 
                          padding: '8px'
                        }}
                      />
                      {nazioneFilter && (
                        <button 
                          type="button"
                          onClick={() => setNazioneFilter('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    
                    {/* Box di selezione */}
                    {nazioni
                      .filter(nazione => nazione.descrizione.toLowerCase().includes(nazioneFilter.toLowerCase()))
                      .length > 0 && nazioneFilter && (
                      <div style={{
                        position: 'absolute',
                        width: '100%',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '0 0 4px 4px',
                        zIndex: 1000,
                        marginTop: '1px'
                      }}>
                        {nazioni
                          .filter(nazione => nazione.descrizione.toLowerCase().includes(nazioneFilter.toLowerCase()))
                          .sort((a, b) => {
                            const aStartsWith = a.descrizione.toLowerCase().startsWith(nazioneFilter.toLowerCase());
                            const bStartsWith = b.descrizione.toLowerCase().startsWith(nazioneFilter.toLowerCase());
                            if (aStartsWith && !bStartsWith) return -1;
                            if (!aStartsWith && bStartsWith) return 1;
                            return a.descrizione.localeCompare(b.descrizione);
                          })
                          .slice(0, 100)
                          .map(nazione => (
                            <div 
                              key={nazione.id} 
                              onClick={() => {
                                setNuovoClienteForm({
                                  ...nuovoClienteForm,
                                  nazione_id: nazione.id
                                });
                                setNazioneFilter(nazione.descrizione);
                              }}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                                backgroundColor: nuovoClienteForm.nazione_id === nazione.id ? '#e8f4e8' : 'white',
                              }}
                              onMouseOver={(e) => {
                                if (nuovoClienteForm.nazione_id !== nazione.id) {
                                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (nuovoClienteForm.nazione_id !== nazione.id) {
                                  e.currentTarget.style.backgroundColor = 'white';
                                }
                              }}
                            >
                              {nazione.descrizione} {nazione.codice_iso ? `(${nazione.codice_iso})` : ''}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                  
                  <input 
                    type="hidden" 
                    id="nazione_id"
                    name="nazione_id"
                    value={nuovoClienteForm.nazione_id || ''}
                  />
                  {nuovoClienteForm.nazioneValidationError && (
                    <small style={{fontSize: '0.8em', color: '#dc3545', display: 'block', marginTop: '4px'}}>
                      {nuovoClienteForm.nazioneValidationError}
                    </small>
                  )}
                  
                  {/* Contatore risultati per nazioni */}
                  {nazioni.length > 0 && nazioneFilter && (
                    <div style={{fontSize: '0.8em', color: '#666', marginTop: '2px'}}>
                      Risultati: {nazioni.filter(nazione => 
                        nazione.descrizione.toLowerCase().includes(nazioneFilter.toLowerCase())
                      ).length} di {nazioni.length}
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="telefono">
                    <i className="fas fa-phone" style={{marginRight: '5px'}}></i>
                    Telefono
                  </label>
                  <input
                    type="text"
                    id="telefono"
                    name="telefono"
                    value={nuovoClienteForm.telefono}
                    onChange={handleNuovoClienteInputChange}
                    className={`form-control ${nuovoClienteForm.telefonoValidationError ? 'is-invalid' : ''}`}
                    style={{width: '100%', padding: '8px', marginTop: '5px'}}
                    required
                  />
                  {nuovoClienteForm.telefonoValidationError && (
                    <small style={{fontSize: '0.8em', color: '#dc3545', display: 'block', marginTop: '4px'}}>
                      {nuovoClienteForm.telefonoValidationError}
                    </small>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">
                    <i className="fas fa-envelope" style={{marginRight: '5px'}}></i>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={nuovoClienteForm.email}
                    onChange={handleNuovoClienteInputChange}
                    className={`form-control ${nuovoClienteForm.emailValidationError ? 'is-invalid' : ''}`}
                    style={{width: '100%', padding: '8px', marginTop: '5px'}}
                    placeholder="esempio@dominio.it"
                    required
                  />
                  {nuovoClienteForm.emailValidationError ? (
                    <small style={{fontSize: '0.8em', color: '#dc3545', display: 'block', marginTop: '4px'}}>
                      {nuovoClienteForm.emailValidationError}
                    </small>
                  ) : (
                    <small style={{fontSize: '0.8em', color: '#666'}}>
                      Formato valido: esempio@dominio.it
                    </small>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="codice_fiscale">
                    <i className="fas fa-id-card" style={{marginRight: '5px'}}></i>
                    Codice Fiscale
                  </label>
                  <input
                    type="text"
                    id="codice_fiscale"
                    name="codice_fiscale"
                    value={nuovoClienteForm.codice_fiscale}
                    onChange={handleNuovoClienteInputChange}
                    className={`form-control ${nuovoClienteForm.cfValidationError ? 'is-invalid' : ''}`}
                    style={{width: '100%', padding: '8px', marginTop: '5px'}}
                    placeholder="RSSMRA80A01H501U"
                    maxLength={16}
                    required
                  />
                  {nuovoClienteForm.cfValidationError ? (
                    <small style={{fontSize: '0.8em', color: '#dc3545', display: 'block', marginTop: '4px'}}>
                      {nuovoClienteForm.cfValidationError}
                    </small>
                  ) : (
                    <small style={{fontSize: '0.8em', color: '#666'}}>
                      16 caratteri alfanumerici (es. RSSMRA80A01H501U). Obbligatorio se non è specificata la Partita IVA.
                    </small>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="partita_iva">
                    <i className="fas fa-building" style={{marginRight: '5px'}}></i>
                    Partita IVA
                  </label>
                  <input
                    type="text"
                    id="partita_iva"
                    name="partita_iva"
                    value={nuovoClienteForm.partita_iva}
                    onChange={handleNuovoClienteInputChange}
                    className={`form-control ${nuovoClienteForm.pivaValidationError ? 'is-invalid' : ''}`}
                    style={{width: '100%', padding: '8px', marginTop: '5px'}}
                    placeholder="12345678901"
                    maxLength={11}
                    required={!nuovoClienteForm.codice_fiscale}
                  />
                  {nuovoClienteForm.pivaValidationError ? (
                    <small style={{fontSize: '0.8em', color: '#dc3545', display: 'block', marginTop: '4px'}}>
                      {nuovoClienteForm.pivaValidationError}
                    </small>
                  ) : (
                    <small style={{fontSize: '0.8em', color: '#666'}}>
                      11 caratteri numerici (es. 12345678901). Obbligatorio se non è specificato il Codice Fiscale.
                    </small>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="id_sian" style={{display: 'flex', alignItems: 'center'}}>
                    <i className="fas fa-fingerprint" style={{marginRight: '5px'}}></i>
                    ID SIAN
                    <span 
                      onClick={(e) => {
                        e.preventDefault();
                        const helpText = document.getElementById('help-id_sian');
                        if (helpText) {
                          helpText.style.display = helpText.style.display === 'block' ? 'none' : 'block';
                        }
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
                          fontSize: '16px',
                          display: 'inline-block',
                          width: '16px',
                          height: '16px'
                        }}
                        title="Mostra informazioni"
                      ></i>
                    </span>
                  </label>
                  <small id="help-id_sian" style={{
                    display: 'none', 
                    padding: '6px 10px',
                    marginTop: '5px',
                    backgroundColor: '#f8f9fa', 
                    borderLeft: '3px solid #4a8f29',
                    borderRadius: '0 4px 4px 0',
                    marginBottom: '6px'
                  }}>
                    Se lasciato vuoto, l'ID SIAN verrà assegnato automaticamente utilizzando l'ultimo ID disponibile nell'azienda.
                  </small>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <input
                      type="text"
                      id="id_sian"
                      name="id_sian"
                      value={nuovoClienteForm.id_sian}
                      onChange={handleNuovoClienteInputChange}
                      className="form-control"
                      style={{flex: '1', padding: '8px', marginTop: '5px'}}
                      placeholder="Lascia vuoto per generazione automatica"
                      readOnly={!!ultimoIdSian}
                    />
                  </div>
                  {ultimoIdSian && (
                    <div style={{
                      marginTop: '5px',
                      fontSize: '0.85em',
                      color: '#666'
                    }}>
                      <i className="fas fa-info-circle" style={{marginRight: '5px'}}></i>
                      Ultimo ID SIAN utilizzato: <strong>{ultimoIdSian}</strong>
                    </div>
                  )}
                </div>
                
                <div className="form-group" style={{gridColumn: '1 / span 2'}}>
                  <label htmlFor="olivedef">
                    <i className="fas fa-leaf" style={{marginRight: '5px'}}></i>
                    Olive Predefinite
                  </label>
                  <select
                    id="olivedef"
                    name="olivedef"
                    value={nuovoClienteForm.olivedef || ''}
                    onChange={handleNuovoClienteInputChange}
                    className="form-control"
                    style={{width: '100%', padding: '8px', marginTop: '5px'}}
                  >
                    <option value="">Seleziona tipologia olive (opzionale)...</option>
                    {articoliOlive.map(oliva => (
                      <option key={oliva.id} value={oliva.id}>
                        {oliva.descrizione}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                borderTop: '1px solid #eee',
                paddingTop: '15px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowNuovoClienteModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    background: '#f5f5f5',
                    cursor: 'pointer'
                  }}
                  disabled={salvandoNuovoCliente}
                >
                  <i className="fas fa-times" style={{marginRight: '5px'}}></i>
                  Annulla
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    background: '#4a8f29',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  disabled={salvandoNuovoCliente}
                >
                  {salvandoNuovoCliente ? (
                    <>
                      <i className="fas fa-spinner fa-spin" style={{marginRight: '5px'}}></i>
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save" style={{marginRight: '5px'}}></i>
                      Salva Cliente
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConferimentoCterzi;