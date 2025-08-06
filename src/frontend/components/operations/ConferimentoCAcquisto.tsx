/**
 * ConferimentoCAcquisto.tsx
 * -------------------------
 * Componente per la gestione dei conferimenti in conto acquisto.
 * Basato su ConferimentoCterzi, questo componente permette di registrare l'acquisto di olive
 * da fornitori esterni, tracciando i dettagli dell'acquisto come prezzo, metodo di pagamento,
 * e altri dati pertinenti all'operazione di acquisto.
 * 
 * NOTA: In questo componente, il termine "Cliente" viene mostrato come "Fornitore" nell'interfaccia utente,
 * ma nei nomi delle variabili e strutture dati viene mantenuto "cliente" per compatibilità con il backend.
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Props del componente principale
interface ConferimentoCAcquistoProps {
  companyId?: number;   // ID dell'azienda corrente
  companyCode?: string; // Codice dell'azienda corrente
  key?: string;         // Aggiunto per evitare warning per prop non utilizzata
}

/**
 * Interfaccia Cliente (visualizzato come "Fornitore")
 * Rappresenta i soggetti che conferiscono olive al frantoio
 */
interface Cliente {
  id: number;
  descrizione: string;
  olivedef?: number; // ID dell'articolo olive di default
  id_sian?: string;  // ID SIAN per il cliente
  flagdoc?: boolean; // Flag che indica se il cliente ha documenti
}

/**
 * Interfaccia ArticoloOlive
 * Rappresenta le varietà di olive disponibili per il conferimento
 */
interface ArticoloOlive {
  id: number;
  descrizione: string;
  categ_olio?: number;         // Categoria dell'olio che si può produrre
  macroarea?: number | null;   // Area geografica di origine
  origispeci?: string | null;  // Origine specifica (es. DOP, IGP)
  flag_bio: boolean;           // Se è certificato biologico
  // Altri campi dell'articolo
}

/**
 * Interfaccia ArticoloOlio
 * Rappresenta i tipi di olio che si possono ottenere dalla lavorazione
 */
interface ArticoloOlio {
  id: number;
  descrizione: string;
}

/**
 * Interfaccia OliveToOlio
 * Definisce le relazioni tra tipi di olive e tipi di olio ottenibili
 */
interface OliveToOlio {
  id: number;
  cod_olive: number;      // Riferimento all'ID delle olive
  cod_olio: number;       // Riferimento all'ID dell'olio
  flag_default: boolean;  // Se questa relazione è quella predefinita
}

/**
 * Interfaccia Macroarea
 * Rappresenta le macroaree geografiche di provenienza delle olive
 */
interface Macroarea {
  id: number;
  descrizione: string;
}

/**
 * Interfaccia OrigineSpecifica
 * Definisce le origini specifiche delle olive (DOP, IGP, ecc.)
 */
interface OrigineSpecifica {
  id: number;
  descrizione: string;
  flag_dop: boolean;        // Se l'origine è una DOP
  flag_raccolta?: boolean;  // Se richiede informazioni sulla raccolta
}

/**
 * Interfaccia Magazzino
 * Rappresenta i magazzini disponibili per lo stoccaggio dell'olio
 */
interface Magazzino {
  id: number;
  descrizione: string;
  capacita?: number;  // Capacità totale del magazzino
  note?: string;      // Note opzionali
  flag_default?: boolean; // Indica se questo è il magazzino predefinito
}

/**
 * Interfaccia Cisterna
 * Rappresenta le cisterne per lo stoccaggio dell'olio all'interno di un magazzino
 */
interface Cisterna {
  id: string;
  descrizione: string;
  id_magazzino?: number;        // Magazzino di appartenenza
  capacita?: number;            // Capacità della cisterna
  giacenza?: number;            // Quantità attualmente presente
  id_articolo?: number;         // Tipo di olio contenuto
  id_codicesoggetto?: number;   // Proprietario dell'olio
}

/**
 * Interfaccia ConferimentoForm
 * Definisce tutti i campi del form di conferimento in conto acquisto
 */
interface ConferimentoForm {
  // Dati anagrafici
  cliente_id: number;          // ID del fornitore (mantenuto cliente_id per compatibilità)
  committente_id?: number;     // ID dell'eventuale committente diverso dal fornitore
  
  // Date e dati della raccolta
  data_arrivo: string;         // Data di arrivo delle olive al frantoio
  data_raccolta: string;       // Data di raccolta delle olive
  ora_raccolta: string;        // Ora della raccolta
  
  // Documentazione
  num_documento: string;       // Numero del documento di trasporto
  data_documento: string;      // Data del documento
  flag_privato_senza_doc: boolean; // Se conferimento privato senza documento (sempre false in acquisto)
  
  // Dati tecnici olive e olio
  olive_id: number;            // Tipo di olive
  olio_id: number;             // Tipo di olio risultante
  macroarea?: number | null;   // Macroarea geografica di provenienza
  origispeci?: string | null;  // Origine specifica
  flag_bio?: boolean;          // Se certificato biologico
  flag_dop?: boolean;          // Se certificato DOP
  flag_igp?: boolean;          // Se certificato IGP
  
  // Quantità
  kg_olive_conferite: number;  // Kg di olive conferite
  kg_olio_ottenuto: number;    // Kg di olio ottenuto (stima o valore effettivo)
  
  // Gestione olio (sempre stoccato nel caso di acquisto)
  flag_cliente_ritira_olio?: boolean; // Indica se il cliente ritira l'olio (sempre false in acquisto)
  magazzino_id?: number;       // Magazzino dove verrà stoccato l'olio
  cisterna_id?: string;        // Cisterna specifica per lo stoccaggio
  
  // Campi specifici per il conto acquisto
  prezzo_acquisto_kg: number;      // Prezzo di acquisto al kg delle olive
  prezzo_acquisto_totale: number;  // Prezzo totale di acquisto (kg × prezzo/kg)
  metodo_pagamento: string;        // Metodo di pagamento (Contanti, Bonifico, ecc.)
  data_pagamento: string;          // Data prevista del pagamento
  note_pagamento: string;          // Note aggiuntive sul pagamento
}

/**
 * Componente FormField
 * Wrapper per campi di input con etichetta, icona e tooltip informativo
 * Fornisce una UI consistente per tutti i campi del form
 */
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

/**
 * Interfaccia NuovoClienteForm
 * Definisce i campi necessari per creare un nuovo cliente/fornitore
 * Usata nel modal di creazione rapida di un nuovo fornitore
 */
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
  flagForn: boolean; // Flag per indicare che è un fornitore
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

/**
 * Interfaccia Nazione
 * Rappresenta le nazioni per l'anagrafica dei fornitori
 */
interface Nazione {
  id: number;
  descrizione: string;
  codice_iso?: string; // Codice ISO della nazione
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

/**
 * Componente principale ConferimentoCAcquisto
 * Gestisce l'intero processo di conferimento in conto acquisto
 */
const ConferimentoCAcquisto: React.FC<ConferimentoCAcquistoProps> = ({ companyId, companyCode }) => {
  console.log('ConferimentoCAcquisto inizializzato con:', { companyId, companyCode });
  
  // =============================================
  // STATI PER DATI PRINCIPALI E ANAGRAFICHE
  // =============================================
  const [clienti, setClienti] = useState<Cliente[]>([]); // Fornitori
  const [articoliOlive, setArticoliOlive] = useState<ArticoloOlive[]>([]); // Tipologie di olive
  const [articoliOlio, setArticoliOlio] = useState<ArticoloOlio[]>([]); // Tipologie di olio
  const [oliveToOli, setOliveToOli] = useState<OliveToOlio[]>([]); // Relazioni olive-olio
  const [macroaree, setMacroaree] = useState<Macroarea[]>([]); // Macroaree geografiche
  const [originiSpecifiche, setOriginiSpecifiche] = useState<OrigineSpecifica[]>([]); // Origini specifiche (DOP, ecc.)
  const [magazzini, setMagazzini] = useState<Magazzino[]>([]); // Magazzini di stoccaggio
  const [cisterne, setCisterne] = useState<Cisterna[]>([]); // Cisterne disponibili
  const [comuni, setComuni] = useState<Comune[]>([]); // Comuni per anagrafica
  const [province, setProvince] = useState<Provincia[]>([]); // Province per anagrafica
  const [nazioni, setNazioni] = useState<Nazione[]>([]); // Nazioni per anagrafica
  
  // =============================================
  // STATI PER IL MODAL DI AGGIUNTA FORNITORE
  // =============================================
  const [showNuovoClienteModal, setShowNuovoClienteModal] = useState<boolean>(false); // Controlla visibilità modal
  const [ultimoIdSian, setUltimoIdSian] = useState<string>(''); // Ultimo ID SIAN assegnato
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
    olivedef: undefined,
    flagForn: true // Importante: impostiamo a true perché stiamo creando un fornitore
  });
  const [salvandoNuovoCliente, setSalvandoNuovoCliente] = useState<boolean>(false); // Stato salvataggio in corso
  
  // =============================================
  // STATI PER FILTRI DI RICERCA
  // =============================================
  const [comuneFilter, setComuneFilter] = useState<string>(''); // Filtro per comuni
  const [provinciaFilter, setProvinciaFilter] = useState<string>(''); // Filtro per province
  const [nazioneFilter, setNazioneFilter] = useState<string>(''); // Filtro per nazioni
  const [clienteFilter, setClienteFilter] = useState<string>(''); // Filtro per fornitori
  const [committenteFilter, setCommittenteFilter] = useState<string>(''); // Filtro per committenti
  
  // =============================================
  // STATO PRINCIPALE DEL FORM DI CONFERIMENTO
  // =============================================
  const [form, setForm] = useState<ConferimentoForm>({
    cliente_id: 0,
    committente_id: undefined,
    data_arrivo: new Date().toISOString().slice(0, 10),
    data_raccolta: new Date().toISOString().slice(0, 10),
    ora_raccolta: '08:00',
    num_documento: '',
    data_documento: new Date().toISOString().slice(0, 10),
    flag_privato_senza_doc: false, // Sempre false per conto acquisto
    olive_id: 0,
    olio_id: 0,
    kg_olive_conferite: 0,
    kg_olio_ottenuto: 0, // Non è obbligatorio ma inizializziamo a 0
    flag_cliente_ritira_olio: false, // Sempre false per conto acquisto - l'olio rimane sempre presso il frantoio
    magazzino_id: undefined, // ID del magazzino dove verrà stoccato l'olio
    cisterna_id: undefined, // ID della cisterna dove verrà stoccato l'olio
    // Campi specifici per il conto acquisto
    prezzo_acquisto_kg: 0,
    prezzo_acquisto_totale: 0,
    metodo_pagamento: '',
    data_pagamento: new Date().toISOString().slice(0, 10), // Impostiamo la data di oggi come default
    note_pagamento: ''
  });
  
  // =============================================
  // STATI PER FEEDBACK UI E GESTIONE ERRORI
  // =============================================
  const [loading, setLoading] = useState<boolean>(true); // Indicatore caricamento
  const [error, setError] = useState<string | null>(null); // Messaggi di errore
  const [success, setSuccess] = useState<string | null>(null); // Messaggi di successo
  
  // =============================================
  // STATI PER COMPORTAMENTO UI E VALIDAZIONE
  // =============================================
  // Determina se i campi di raccolta sono obbligatori (bio/dop)
  const [isRaccoltaRequired, setIsRaccoltaRequired] = useState<boolean>(false);
  
  // Stati per sezioni espandibili/collassabili
  const [showOliveDetails, setShowOliveDetails] = useState<boolean>(false); // Dettagli olive
  
  // Stato per gestire la visualizzazione della sezione acquisto
  const [showAcquistoDetails, setShowAcquistoDetails] = useState<boolean>(false);
  
  // =============================================
  // EFFETTO PER CARICARE I DATI INIZIALI
  // =============================================
  useEffect(() => {
    if (!companyId || !companyCode) {
      console.log('CompanyId o companyCode mancanti:', { companyId, companyCode });
      return;
    }
    
    console.log('Inizializzazione conferimento con companyId:', companyId, 'e companyCode:', companyCode);
    
    /**
     * Carica tutti i dati necessari per il form di conferimento
     * Inclusi fornitori, articoli, magazzini, cisterne, comuni, province, ecc.
     */
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Carica i fornitori (soggetti con flagForn = true) dell'azienda
        console.log(`Fetching fornitori for companyId: ${companyId}`);
        const clientiResponse = await axios.get(`/api/company/${companyId}/tables/soggetti`, {
          params: { where: JSON.stringify({ flagForn: true }) },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        console.log('Risposta fornitori:', clientiResponse.data);
        
        if (clientiResponse.data.success) {
          setClienti(clientiResponse.data.data || []);
        }
        
        // Carica l'ultimo ID SIAN dall'azienda
        try {
          const aziendaResponse = await axios.get(`/api/company/${companyId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          
          if (aziendaResponse.data.success && aziendaResponse.data.company) {
            const ultimoId = aziendaResponse.data.company.ultimoidsoggetto || '';
            setUltimoIdSian(ultimoId);
            console.log('Ultimo ID SIAN recuperato:', ultimoId);
          }
        } catch (err) {
          console.error('Errore nel recupero dell\'ultimo ID SIAN:', err);
        }
        
        // Carica gli articoli olive (tipologia 'OL')
        const oliveResponse = await axios.get('/api/tables/articoli', {
          params: { where: JSON.stringify({ tipologia: 'OL' }) },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (oliveResponse.data.success) {
          setArticoliOlive(oliveResponse.data.data || []);
        }
        
        // Carica gli articoli olio (tipologia 'SF')
        const olioResponse = await axios.get('/api/tables/articoli', {
          params: { where: JSON.stringify({ tipologia: 'SF' }) },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (olioResponse.data.success) {
          setArticoliOlio(olioResponse.data.data || []);
        }
        
        // Carica le relazioni olive-olio
        const oliveToOliResponse = await axios.get('/api/tables/olive_to_oli', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (oliveToOliResponse.data.success) {
          setOliveToOli(oliveToOliResponse.data.data || []);
        }
        
        // Carica le macroaree
        const macroareeResponse = await axios.get('/api/tables/macroaree', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (macroareeResponse.data.success) {
          setMacroaree(macroareeResponse.data.data || []);
        }
        
        // Carica le origini specifiche
        const originiResponse = await axios.get('/api/tables/origini_specifiche', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (originiResponse.data.success) {
          setOriginiSpecifiche(originiResponse.data.data || []);
        }
        
        // Carica i comuni
        const comuniResponse = await axios.get('/api/tables/comuni', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (comuniResponse.data.success) {
          setComuni(comuniResponse.data.data || []);
        }
        
        // Carica le province
        const provinceResponse = await axios.get('/api/tables/province', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (provinceResponse.data.success) {
          setProvince(provinceResponse.data.data || []);
        }
        
        // Carica le nazioni
        const nazioniResponse = await axios.get('/api/tables/nazioni', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (nazioniResponse.data.success) {
          setNazioni(nazioniResponse.data.data || []);
        }
        
        // Carica i magazzini
        if (companyId) {
          try {
            const magazziniResponse = await axios.get(`/api/company/${companyId}/tables/magazzini`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (magazziniResponse.data.success) {
              const magazziniData = magazziniResponse.data.data || [];
              setMagazzini(magazziniData);
              console.log("Magazzini caricati:", magazziniData.length || 0);
              
              // Trova il magazzino con flag_default = true
              const defaultMagazzino = magazziniData.find((m: Magazzino) => m.flag_default === true);
              if (defaultMagazzino) {
                console.log("Magazzino predefinito trovato:", defaultMagazzino.descrizione);
                setForm(prev => ({
                  ...prev,
                  magazzino_id: defaultMagazzino.id
                }));
              }
            }
          } catch (error) {
            console.error('Errore nel caricamento dei magazzini:', error);
          }
        }
        
        // Carica le cisterne
        if (companyId) {
          try {
            const cisterneResponse = await axios.get(`/api/company/${companyId}/tables/cisterne`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (cisterneResponse.data.success) {
              setCisterne(cisterneResponse.data.data || []);
              console.log("Cisterne caricate:", cisterneResponse.data.data?.length || 0);
              
              if (cisterneResponse.data.data?.length > 0) {
                console.log("Prima cisterna:", cisterneResponse.data.data[0]);
              } else {
                console.log("Nessuna cisterna trovata per questa azienda");
              }
            }
          } catch (error) {
            console.error('Errore nel caricamento delle cisterne:', error);
          }
        }
        
        setLoading(false);
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
    const oliveId = parseInt(e.target.value);
    const selectedOlive = articoliOlive.find(a => a.id === oliveId);
    
    // Aggiorna il form con i valori derivati dall'articolo olive selezionato
    setForm(prev => {
      const newForm: ConferimentoForm = {
        ...prev,
        olive_id: oliveId,
        // Reset dei campi derivati
        macroarea: null, // Usiamo null invece di undefined
        origispeci: null, // Usiamo null invece di undefined
        flag_bio: false,
        flag_dop: false,
        flag_igp: false,
        olio_id: 0 // Reset dell'olio selezionato
      };
      
      // Se è stata selezionata un'oliva valida
      if (selectedOlive) {
        // Imposta i campi derivati
        newForm.macroarea = selectedOlive.macroarea;
        newForm.origispeci = selectedOlive.origispeci;
        newForm.flag_bio = selectedOlive.flag_bio;
        
        // Verifica DOP/IGP in base a macroarea e origini specifiche
        const isDopIgpMacroarea = selectedOlive.macroarea === 12 || 
                               selectedOlive.macroarea === 13 || 
                               selectedOlive.macroarea === 14;
        
        if (isDopIgpMacroarea && selectedOlive.origispeci) {
          const originiIds = selectedOlive.origispeci.split(',').map(id => parseInt(id.trim()));
          
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
          rel.cod_olive === selectedOlive.id && rel.flag_default
        );
        
        if (oliveOlioRel) {
          newForm.olio_id = oliveOlioRel.cod_olio;
        }
      }
      
      return newForm;
    });
  };
  
  // Gestisce i cambi generici nel form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // Gestisce diversi tipi di input
    let inputValue;
    
    if (type === 'checkbox') {
      inputValue = checked;
    } else if (type === 'number') {
      // Gestisce esplicitamente i valori vuoti per i campi numerici
      if (value === '' || value === null) {
        // Imposta esplicitamente a 0 per campi numerici vuoti
        inputValue = 0;
      } else {
        inputValue = parseFloat(value);
      }
    } else {
      inputValue = value;
    }
    
    console.log(`Campo: ${name}, Valore: ${value}, Tipo: ${type}, Valore convertito: ${inputValue}`);
    
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
    
    // Se sono cambiati i kg olive, aggiorna prezzo acquisto totale
    if (name === 'kg_olive_conferite' && typeof inputValue === 'number' && inputValue > 0) {
      updatePrezzoAcquistoTotale(inputValue, form.prezzo_acquisto_kg);
    }
    
    // Se è cambiato il prezzo di acquisto al kg, aggiorna il prezzo totale
    if (name === 'prezzo_acquisto_kg' && typeof inputValue === 'number') {
      updatePrezzoAcquistoTotale(form.kg_olive_conferite, inputValue);
    }
  };
  
  // Funzione per aggiornare il prezzo totale di acquisto
  const updatePrezzoAcquistoTotale = (kg: number, prezzoKg: number) => {
    if (kg > 0 && prezzoKg > 0) {
      setForm(prev => ({
        ...prev,
        prezzo_acquisto_totale: Number((kg * prezzoKg).toFixed(2))
      }));
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
  
  // Funzione rimossa: fetchMolituraPrice
  
  // Gestisce la visualizzazione dei campi Data/Ora Raccolta in base alla selezione del cliente
  useEffect(() => {
    // Se il cliente è cambiato, verifica se rendere obbligatori i campi data/ora raccolta
    if (form.cliente_id > 0) {
      const selectedCliente = clienti.find(c => c.id === form.cliente_id);
      
      // Se il cliente è un produttore (ha olivedef) o se il flag BIO è impostato
      // allora i campi data/ora raccolta sono obbligatori
      const isRequired = Boolean(selectedCliente?.olivedef) || form.flag_bio === true;
      setIsRaccoltaRequired(isRequired);
    } else {
      // Se nessun cliente selezionato, i campi non sono obbligatori
      setIsRaccoltaRequired(false);
    }
  }, [form.cliente_id, form.flag_bio, clienti]);
  
  // Handler per la selezione di un comune
  const handleComuneChange = (comuneId: number) => {
    if (!comuneId) return;
    
    const selectedComune = comuni.find(c => c.id === comuneId);
    if (selectedComune && selectedComune.provincia_id) {
      setNuovoClienteForm(prev => ({
        ...prev,
        comune_id: comuneId,
        provincia_id: selectedComune.provincia_id
      }));
    } else {
      setNuovoClienteForm(prev => ({
        ...prev,
        comune_id: comuneId
      }));
    }
  };
  
  // Gestisce l'invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validazione dei campi obbligatori
      if (!form.cliente_id) {
        setError('È necessario selezionare un fornitore');
        setLoading(false);
        return;
      }
      
      if (!form.data_arrivo) {
        setError('La data di arrivo è obbligatoria');
        setLoading(false);
        return;
      }
      
      if (isRaccoltaRequired && (!form.data_raccolta || !form.ora_raccolta)) {
        setError('La data e ora di raccolta sono obbligatorie per questo cliente');
        setLoading(false);
        return;
      }
      
      if (!form.num_documento || !form.data_documento) {
        setError('Il numero e la data del documento sono obbligatori');
        setLoading(false);
        return;
      }
      
      if (!form.olive_id) {
        setError('È necessario selezionare una tipologia di olive');
        setLoading(false);
        return;
      }
      
      if (!form.kg_olive_conferite || form.kg_olive_conferite <= 0) {
        setError('I Kg di olive conferite devono essere maggiori di zero');
        setLoading(false);
        return;
      }
      
      // Validazione campi specifici per il conto acquisto solo se la sezione è visibile
      if (showAcquistoDetails) {
        if (!form.prezzo_acquisto_kg || form.prezzo_acquisto_kg <= 0) {
          setError('Il prezzo di acquisto al kg deve essere maggiore di zero');
          setLoading(false);
          return;
        }
        
        if (!form.metodo_pagamento) {
          setError('È necessario selezionare un metodo di pagamento');
          setLoading(false);
          return;
        }
        
        if (!form.data_pagamento) {
          setError('La data di pagamento è obbligatoria');
          setLoading(false);
          return;
        }
      }
      
      // Se è inserito un valore per l'olio ottenuto, è obbligatorio selezionare una cisterna
      if (form.kg_olio_ottenuto > 0 && !form.cisterna_id) {
        setError('È necessario selezionare una cisterna quando si specifica una quantità di olio ottenuto');
        setLoading(false);
        return;
      }
      
      // Invia il form al server
      const response = await axios.post(`/api/company/${companyId}/conferimenti`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        // Mostra un alert e torna alla dashboard
        alert('Registrazione completata');
        
        // Reindirizza alla dashboard
        window.location.href = '/';
      } else {
        // Gestiamo un errore nella risposta (success: false)
        setError(response.data.message || 'Errore durante il salvataggio del conferimento');
      }
    } catch (err: any) {
      console.error('Errore durante il salvataggio del conferimento:', err);
      
      if (err.response && err.response.data) {
        // Errore restituito dal server con dettagli
        setError(err.response.data.message || `Errore del server (${err.response.status})`);
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
  
  // Gestisce il salvataggio di un nuovo cliente
  const handleNuovoClienteSave = async () => {
    try {
      setSalvandoNuovoCliente(true);
      
      // Validazione dei campi obbligatori
      if (!nuovoClienteForm.descrizione) {
        setNuovoClienteForm(prev => ({ ...prev, indirizzoValidationError: 'La descrizione è obbligatoria' }));
        setSalvandoNuovoCliente(false);
        return;
      }

      // Qui implementeresti l'invio del form al server
      const response = await axios.post(`/api/company/${companyId}/tables/soggetti`, {
        ...nuovoClienteForm,
        olivedef: nuovoClienteForm.olivedef || null,
        flagForn: true, // Assicuriamo che venga inviato come true
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        // Aggiungi il nuovo cliente alla lista e selezionalo
        const nuovoCliente = response.data.data;
        setClienti(prev => [...prev, nuovoCliente]);
        setForm(prev => ({ ...prev, cliente_id: nuovoCliente.id }));
        
        // Chiudi il modal e resetta il form
        setShowNuovoClienteModal(false);
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
          olivedef: undefined,
          flagForn: true // Impostiamo a true perché stiamo creando un fornitore
        });
      } else {
        // Gestisci errori di risposta
        console.error('Errore nella creazione del cliente:', response.data.message);
      }
    } catch (error) {
      console.error('Errore durante il salvataggio del cliente:', error);
    } finally {
      setSalvandoNuovoCliente(false);
    }
  };
  
  // Gestisce i cambiamenti nei campi del form nuovo cliente
  const handleNuovoClienteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Se il valore è una stringa vuota e il campo accetta undefined (come i numeri)
    if (value === '' && (name === 'comune_id' || name === 'provincia_id' || name === 'nazione_id' || name === 'olivedef')) {
      setNuovoClienteForm(prev => ({
        ...prev,
        [name]: undefined
      }));
    } else {
      // Altrimenti imposta il valore normalmente
      setNuovoClienteForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  return (
    <div className="operation-module conferimento-module">
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}
      
      <div className="module-header">
        <h2><i className="fas fa-truck-loading"></i> Conferimento Conto Acquisto</h2>
        <p>Registrazione delle olive acquistate dai fornitori, con gestione dei prezzi di acquisto, metodi di pagamento e date di pagamento.</p>
      </div>
      
      <div className="module-content">
        <div className="operation-form-container conferimento-form-container">
          <div className="card form-card">
            <form onSubmit={handleSubmit}>
              {/* Sezione Cliente */}
              <div className="form-section section-card">
                <h4 className="section-title"><i className="fas fa-user"></i> Fornitore</h4>
                <div className="form-row input-row">
                  <FormField
                    id="cliente_id"
                    label="Fornitore"
                    description="Seleziona il fornitore che conferisce le olive."
                    icon="fas fa-user"
                    required
                  >
                    <div style={{position: 'relative'}}>
                      <div style={{display: 'flex', alignItems: 'center'}}>
                        <input
                          type="text"
                          id="cliente_search"
                          placeholder={form.cliente_id ? clienti.find(c => c.id === form.cliente_id)?.descrizione || "Cerca fornitore..." : "Cerca fornitore..."}
                          value={clienteFilter}
                          onChange={(e) => setClienteFilter(e.target.value)}
                          className="form-control"
                          style={{
                            width: '100%', 
                            padding: '8px'
                          }}
                          onFocus={() => {
                            if (form.cliente_id && !clienteFilter) {
                              // Se c'è un fornitore già selezionato e il campo è vuoto, mostriamo il nome
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
                      
                      {/* Box di selezione */}
                      {clienti
                        .filter(cliente => cliente.descrizione.toLowerCase().includes(clienteFilter.toLowerCase()))
                        .length > 0 && clienteFilter && (
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
                            .filter(cliente => cliente.descrizione.toLowerCase().includes(clienteFilter.toLowerCase()))
                            .sort((a, b) => {
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
                                  backgroundColor: form.cliente_id === cliente.id ? '#e8f4e8' : 'white'
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
                      {/* Questo select è nascosto ma necessario per il submit del form */}
                      <div className="d-none">
                        <select 
                          id="cliente_id"
                          name="cliente_id"
                          value={form.cliente_id || ''}
                          onChange={handleClienteChange}
                          required
                        >
                          <option value="">Seleziona fornitore...</option>
                          {clienti.map(cliente => (
                            <option key={cliente.id} value={cliente.id}>
                              {cliente.descrizione}
                            </option>
                          ))}
                        </select>
                        <button 
                          type="button" 
                          className="btn btn-primary btn-slim action-button"
                          onClick={() => setShowNuovoClienteModal(true)}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  </FormField>
                  
                  <FormField
                    id="committente_id"
                    label="Committente"
                    description={
                      form.committente_id && form.committente_id === form.cliente_id 
                        ? "Il committente selezionato è uguale al fornitore" 
                        : "Seleziona il committente se diverso dal fornitore"
                    }
                    icon="fas fa-user-tag"
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
                      {clienti
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
                </div>
                
                <div className="form-row input-row">
                  <FormField
                    id="data_arrivo"
                    label="Data Arrivo"
                    description="Data di arrivo delle olive al frantoio."
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
                  
                  <FormField
                    id="data_raccolta"
                    label="Data Raccolta"
                    description={`Data in cui sono state raccolte le olive. ${isRaccoltaRequired ? 'Campo obbligatorio per BIO o produttori.' : ''}`}
                    icon="fas fa-calendar-check"
                    required={isRaccoltaRequired}
                  >
                    <input 
                      type="date" 
                      id="data_raccolta"
                      name="data_raccolta"
                      value={form.data_raccolta}
                      onChange={handleInputChange}
                      required={isRaccoltaRequired}
                    />
                  </FormField>
                  
                  <FormField
                    id="ora_raccolta"
                    label="Ora Raccolta"
                    description={`Ora in cui sono state raccolte le olive. ${isRaccoltaRequired ? 'Campo obbligatorio per BIO o produttori.' : ''}`}
                    icon="fas fa-clock"
                    required={isRaccoltaRequired}
                  >
                    <input 
                      type="time" 
                      id="ora_raccolta"
                      name="ora_raccolta"
                      value={form.ora_raccolta}
                      onChange={handleInputChange}
                      required={isRaccoltaRequired}
                    />
                  </FormField>
                </div>
                
                {/* Il flag_privato_senza_doc è sempre false nel caso di conto acquisto */}
                {(
                  <div className="form-row input-row">
                    <FormField
                      id="num_documento"
                      label="Numero Documento"
                      description="Numero del documento di accompagnamento delle olive."
                      icon="fas fa-file-alt"
                      required={!form.flag_privato_senza_doc}
                    >
                      <input 
                        type="text" 
                        id="num_documento"
                        name="num_documento"
                        value={form.num_documento}
                        onChange={handleInputChange}
                        required={!form.flag_privato_senza_doc}
                      />
                    </FormField>
                    
                    <FormField
                      id="data_documento"
                      label="Data Documento"
                      description="Data del documento di accompagnamento delle olive."
                      icon="fas fa-calendar-day"
                      required={!form.flag_privato_senza_doc}
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
              <div className="form-section section-card">
                <h4 className="section-title">
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
                <div className="form-row input-row">
                  <div className="col-md-6">
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
                  </div>
                  
                  <div className="col-md-6">
                    <FormField
                      id="magazzino_id"
                      label="Magazzino"
                      description="Magazzino di riferimento per l'operazione"
                      icon="fas fa-warehouse"
                      required={false}
                    >
                      <select
                        id="magazzino_id"
                        name="magazzino_id"
                        value={form.magazzino_id || ''}
                        onChange={handleInputChange}
                        style={{width: '100%'}}
                      >
                        <option value="">-- Seleziona magazzino --</option>
                        {magazzini.map(magazzino => (
                          <option key={magazzino.id} value={magazzino.id}>
                            {magazzino.descrizione}
                            {magazzino.capacita ? ` (Capacità: ${magazzino.capacita} kg)` : ''}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </div>
                
                {showOliveDetails && form.olive_id > 0 && (
                  <div className="form-row input-row">
                    <div className="detail-box olive-details">
                      <h5>Caratteristiche Olive</h5>
                      <div className="details-grid">
                        <div className="detail-item">
                          <strong>Macroarea:</strong> 
                          <span>{form.macroarea ? macroaree.find(m => m.id === form.macroarea)?.descrizione || 'Non specificata' : 'Non specificata'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Origine Specifica:</strong>
                          <span>
                            {form.origispeci ? form.origispeci.split(',').map(id => {
                              const origineId = parseInt(id.trim());
                              const origine = originiSpecifiche.find(o => o.id === origineId);
                              return origine?.descrizione || '';
                            }).filter(Boolean).join(', ') : 'Non specificata'}
                          </span>
                        </div>
                        <div className="detail-item">
                          <strong>BIO:</strong> <span>{form.flag_bio ? 'Sì' : 'No'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>DOP:</strong> <span>{form.flag_dop ? 'Sì' : 'No'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>IGP:</strong> <span>{form.flag_igp ? 'Sì' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="form-row input-row">
                  <FormField
                    id="kg_olive_conferite"
                    label="Kg Olive"
                    description="Peso in Kg delle olive conferite."
                    icon="fas fa-weight"
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
                </div>
              </div>
              
              {/* Sezione Acquisto */}
              <div className="form-section section-card">
                <h4 className="section-title">
                  <i className="fas fa-shopping-cart"></i> Dati Acquisto
                  <button 
                    type="button" 
                    className="btn-link-small" 
                    onClick={() => setShowAcquistoDetails(!showAcquistoDetails)}
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
                    {showAcquistoDetails ? 
                      <><i className="fas fa-chevron-up"></i> Nascondi dettagli</> : 
                      <><i className="fas fa-chevron-down"></i> Mostra dettagli</>
                    }
                  </button>
                </h4>
                
                {showAcquistoDetails && (
                  <>
                    <div className="form-row input-row">
                      <FormField
                        id="prezzo_acquisto_kg"
                        label="Prezzo Acquisto (€/kg)"
                        description="Prezzo di acquisto delle olive al kg."
                        icon="fas fa-euro-sign"
                        required
                      >
                        <input 
                          type="number" 
                          id="prezzo_acquisto_kg"
                          name="prezzo_acquisto_kg"
                          value={form.prezzo_acquisto_kg || ''}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          required
                        />
                      </FormField>
                      
                      <FormField
                        id="prezzo_acquisto_totale"
                        label="Prezzo Totale (€)"
                        description="Prezzo totale di acquisto delle olive. Calcolato automaticamente in base al prezzo al kg e al peso totale."
                        icon="fas fa-calculator"
                      >
                        <input 
                          type="number" 
                          id="prezzo_acquisto_totale"
                          name="prezzo_acquisto_totale"
                          value={form.prezzo_acquisto_totale || ''}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          readOnly
                        />
                      </FormField>
                    </div>
                    
                    <div className="form-row input-row">
                      <FormField
                        id="metodo_pagamento"
                        label="Metodo di Pagamento"
                        description="Seleziona il metodo di pagamento per l'acquisto delle olive."
                        icon="fas fa-credit-card"
                        required
                      >
                        <select 
                          id="metodo_pagamento"
                          name="metodo_pagamento"
                          value={form.metodo_pagamento || ''}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Seleziona metodo...</option>
                          <option value="Contanti">Contanti</option>
                          <option value="Bonifico">Bonifico Bancario</option>
                          <option value="Assegno">Assegno</option>
                          <option value="CreditoFornitore">Credito Fornitore</option>
                          <option value="Altro">Altro</option>
                        </select>
                      </FormField>
                      
                      <FormField
                        id="data_pagamento"
                        label="Data Pagamento"
                        description="Data prevista per il pagamento."
                        icon="fas fa-calendar-alt"
                        required
                      >
                        <input 
                          type="date" 
                          id="data_pagamento"
                          name="data_pagamento"
                          value={form.data_pagamento}
                          onChange={handleInputChange}
                          required
                        />
                      </FormField>
                    </div>
                    
                    <div className="form-row input-row">
                      <FormField
                        id="note_pagamento"
                        label="Note sul Pagamento"
                        description="Note aggiuntive sulle modalità di pagamento o altre informazioni utili."
                        icon="fas fa-sticky-note"
                      >
                        <textarea 
                          id="note_pagamento"
                          name="note_pagamento"
                          value={form.note_pagamento || ''}
                          onChange={handleInputChange as any}
                          rows={3}
                          style={{ width: '100%' }}
                        />
                      </FormField>
                    </div>
                  </>
                )}
              </div>

              {/* Sezione Molitura */}
              <div className="form-section section-card">
                <h4 className="section-title"><i className="fas fa-cogs"></i> Molitura</h4>
                <div className="form-row input-row">
                  <FormField
                    id="olio_id"
                    label="Tipologia Olio Ottenuto"
                    description="Seleziona la tipologia dell'olio ottenuto dalla molitura. È pre-selezionata in base alla tipologia di olive scelta."
                    icon="fas fa-wine-bottle"
                  >
                    <select 
                      id="olio_id"
                      name="olio_id"
                      value={form.olio_id === 0 ? '0' : (form.olio_id || '')}
                      onChange={handleInputChange}
                    >
                      <option value="0">Nessuna tipologia di olio</option>
                      {articoliOlio.map(olio => (
                        <option key={olio.id} value={olio.id}>
                          {olio.descrizione}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  
                  <FormField
                    id="kg_olio_ottenuto"
                    label="Kg Olio Ottenuto"
                    description="Quantità di olio ottenuto dalla molitura in Kg. Campo opzionale. Se specificato, verrà calcolata automaticamente la resa."
                    icon="fas fa-weight"
                  >
                    <input
                      type="number"
                      id="kg_olio_ottenuto"
                      name="kg_olio_ottenuto"
                      value={form.kg_olio_ottenuto.toString()}
                      onChange={handleInputChange}
                      placeholder="0"
                      step="0.1"
                      min="0"
                    />
                  </FormField>
                </div>
                
                {/* Selezione cisterna - visibile quando è selezionato un olio (diverso da 0) */}
                {form.olio_id !== 0 && form.olio_id && (
                  <div className="form-row input-row" style={{marginTop: '10px'}}>
                    <FormField
                      id="cisterna_id"
                      label="Cisterna di Stoccaggio"
                      description="Seleziona la cisterna in cui verrà stoccato l'olio acquistato. Obbligatorio solo se è stato inserito un valore nei Kg Olio Ottenuto."
                      icon="fas fa-oil-can" 
                      required={form.kg_olio_ottenuto > 0}
                    >
                      <select 
                        id="cisterna_id"
                        name="cisterna_id"
                        value={form.cisterna_id || ''}
                        onChange={handleInputChange}
                        required={form.kg_olio_ottenuto > 0}
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
                                {cisterna.capacita ? ` (Capacità: ${cisterna.capacita} kg)` : ''}
                                {cisterna.giacenza ? ` - Giacenza: ${cisterna.giacenza} kg` : ''}
                              </option>
                            ))
                        )}
                      </select>
                      {cisterne.length === 0 && (
                        <div style={{marginTop: '5px'}}>
                          <div className="alert alert-warning">
                            <i className="fas fa-exclamation-triangle"></i> Nessuna cisterna disponibile.
                          </div>
                        </div>
                      )}
                      <div style={{marginTop: '5px'}}>
                        <small className="text-muted">
                          Nota: In modalità c/acquisto, l'olio rimane sempre presso il frantoio.
                        </small>
                      </div>
                    </FormField>
                  </div>
                )}
              </div>
              
              {/* Pulsanti di azione */}
              <div className="form-actions action-buttons">
                <button type="submit" className="btn btn-primary action-button" disabled={loading}>
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
                  className="btn btn-secondary action-button" 
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
                      kg_olio_ottenuto: 0, // Non obbligatorio ma inizializzato a 0
                      flag_cliente_ritira_olio: false, // Sempre false per conto acquisto - l'olio rimane sempre presso il frantoio
                      magazzino_id: undefined, // Reset magazzino
                      cisterna_id: undefined, // Reset cisterna
                      // Reset campi specifici per il conto acquisto
                      prezzo_acquisto_kg: 0,
                      prezzo_acquisto_totale: 0,
                      metodo_pagamento: '',
                      data_pagamento: new Date().toISOString().slice(0, 10),
                      note_pagamento: ''
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
        <div className="operation-info-panel conferimento-info-panel">
          <div className="info-card summary-card">
            <h3><i className="fas fa-info-circle"></i> Informazioni</h3>
            <div className="info-content">
              <p>Compila il form per registrare un nuovo acquisto di olive.</p>
              <p>I campi contrassegnati con * sono obbligatori.</p>
              
              <div className="tips-list">
                <h4 className="section-title">Note importanti:</h4>
                <ul>
                  <li>Selezionando un fornitore, i campi relativi alla tipologia di olive verranno pre-compilati se il fornitore ha delle olive predefinite.</li>
                  <li>I valori di Macroarea, Origine Specifica, BIO e DOP sono derivati automaticamente dalla tipologia di olive selezionata.</li>
                  <li>Il prezzo totale di acquisto viene calcolato automaticamente in base ai Kg di olive e al prezzo di acquisto al Kg.</li>
                  <li>Specificare un metodo di pagamento e una data prevista per il pagamento.</li>
                  <li>Le note di pagamento possono essere utilizzate per specificare dettagli aggiuntivi come IBAN, riferimenti bancari o altri accordi.</li>
                </ul>
              </div>
            </div>
          </div>
          
          {form.cliente_id > 0 && form.kg_olive_conferite > 0 && (
            <div className="info-card summary-card">
              <h3><i className="fas fa-calculator"></i> Riepilogo</h3>
              <div className="summary-content">
                <div className="summary-item">
                  <strong>Fornitore:</strong> 
                  <span>{clienti.find(c => c.id === form.cliente_id)?.descrizione || ''}</span>
                </div>
                
                <div className="summary-item">
                  <strong>Data arrivo:</strong> 
                  <span>{formatDate(form.data_arrivo)}</span>
                </div>
                
                <div className="summary-item">
                  <strong>Tipologia olive:</strong> 
                  <span>{articoliOlive.find(a => a.id === form.olive_id)?.descrizione || ''}</span>
                </div>
                
                <div className="summary-item">
                  <strong>Quantità olive:</strong> 
                  <span>{form.kg_olive_conferite} kg</span>
                </div>
                
                {form.olio_id > 0 && form.kg_olio_ottenuto > 0 && (
                  <div className="summary-item">
                    <strong>Quantità olio:</strong> 
                    <span>{form.kg_olio_ottenuto} kg</span>
                  </div>
                )}
                
                {form.olio_id > 0 && form.kg_olio_ottenuto > 0 && form.kg_olive_conferite > 0 && (
                  <div className="summary-item highlight">
                    <strong>Resa:</strong> 
                    <span>{((form.kg_olio_ottenuto / form.kg_olive_conferite) * 100).toFixed(2)}%</span>
                  </div>
                )}
                
                {showAcquistoDetails && (
                  <>
                    <div className="summary-item highlight">
                      <strong>Prezzo acquisto:</strong> 
                      <span>{form.prezzo_acquisto_totale.toFixed(2)} €</span>
                    </div>
                    
                    <div className="summary-item">
                      <strong>Metodo pagamento:</strong> 
                      <span>{form.metodo_pagamento || 'Non specificato'}</span>
                    </div>
                    
                    <div className="summary-item">
                      <strong>Data pagamento:</strong> 
                      <span>{form.data_pagamento ? formatDate(form.data_pagamento) : 'Non specificata'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// NOTA: In questo componente, il termine "Cliente" è stato cambiato in "Fornitore" nell'interfaccia utente,
// ma nei nomi delle variabili, ID e proprietà tecniche è stato mantenuto "cliente" per mantenere
// la compatibilità con il backend e la struttura di base del codice.

export default ConferimentoCAcquisto;