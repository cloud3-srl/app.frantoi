import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/it';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Configurazione di moment.js
moment.locale('it');
// Assicurati che le abbreviazioni dei giorni siano in italiano
moment.updateLocale('it', {
  week: {
    dow: 1, // Lunedì è il primo giorno della settimana
    doy: 4  // La settimana che contiene Jan 4th è la prima settimana dell'anno
  },
  weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
  weekdaysMin: ['Do', 'Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa'],
  weekdays: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
  months: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
  monthsShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
});

// Props del componente
interface PrenotazioneMolitureProps {
  companyId?: number;
  companyCode?: string;
}

// Tipi per le prenotazioni
interface Prenotazione {
  id: number;
  id_cliente: number;
  nome_cliente: string; // Campo derivato per visualizzazione
  tipologia_oliva: number;
  nome_oliva: string; // Campo derivato per visualizzazione
  quantita_kg: number;
  data_inizio: Date;
  data_fine: Date;
  id_linea: number;
  nome_linea: string; // Campo derivato per visualizzazione
  stato: 'Provvisorio' | 'Confermato' | 'Modificato';
  note?: string;
  cellulare?: string;
  mail?: string;
  id_user: number;
  flagcproprio?: boolean; // Campo per indicare conto proprio
}

// Interfaccia per Comune, Provincia e Nazione
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

interface Nazione {
  id: number;
  descrizione: string;
}

// Interfaccia per il form nuovo cliente
interface NuovoClienteForm {
  descrizione: string;
  indirizzo: string;
  cap: string;
  comune_id?: number;
  provincia_id?: number;
  nazione_id?: number;
  telefono: string;
  email: string;
  codice_fiscale: string;
  partita_iva: string;
  id_sian: string;
  olivedef?: number;
  // Campi per la validazione
  descrizioneValidationError?: string;
  indirizzoValidationError?: string;
  capValidationError?: string;
  comuneValidationError?: string;
  provinciaValidationError?: string;
  nazioneValidationError?: string;
  telefonoValidationError?: string;
  cfValidationError?: string;
  pivaValidationError?: string;
  emailValidationError?: string;
}

// Tipo convertito per il calendario
interface EventoCalendario {
  id: number;
  title: string;
  start: Date;
  end: Date;
  prenotazione: Prenotazione;
  isEditable: boolean;
}

// Tipi per dati del form
interface Cliente {
  id: number;
  descrizione: string;
  // Campi aggiuntivi che potrebbero essere presenti nei soggetti
  codfisc?: string;
  partiva?: string;
  indirizzo?: string;
  cap?: string;
  comune?: number;
  provincia?: number;
  telefono?: string;
  mail?: string;
  olivedef?: number; // ID dell'articolo olive di default per questo cliente
}

interface TipologiaOliva {
  id: number;
  descrizione: string;
}

interface LineaLavorazione {
  id: number;
  descrizione: string;
  cap_oraria: number; // kg/ora
  id_oliva?: number; // ID dell'articolo olive predefinito per questa linea
  id_magazzino?: number;
  colore?: string; // Colore per identificare la linea nel calendario
}

// Configurazione dei messaggi in italiano
const messages = {
  allDay: 'Tutto il giorno',
  previous: 'Precedente',
  next: 'Successivo',
  today: 'Oggi',
  month: 'Mese',
  week: 'Settimana',
  day: 'Giorno',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Ora',
  event: 'Evento',
  noEventsInRange: 'Nessun appuntamento in questo periodo',
  showMore: (total: number) => `+ Mostra altri (${total})`,
  weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
};

// Inizializza il localizer
const localizer = momentLocalizer(moment);

const PrenotazioneMoliture: React.FC<PrenotazioneMolitureProps> = ({ companyId, companyCode }) => {
  // Stati per il calendario
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [eventiCalendario, setEventiCalendario] = useState<EventoCalendario[]>([]);
  const [currentView, setCurrentView] = useState<View>(Views.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Stati per i dati del form
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [tipologieOlive, setTipologieOlive] = useState<TipologiaOliva[]>([]);
  const [linee, setLinee] = useState<LineaLavorazione[]>([]);
  const [comuni, setComuni] = useState<Comune[]>([]);
  const [province, setProvince] = useState<Provincia[]>([]);
  const [nazioni, setNazioni] = useState<Nazione[]>([]);
  
  // Stati per il form di prenotazione
  const [showForm, setShowForm] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [selectedPrenotazione, setSelectedPrenotazione] = useState<Prenotazione | null>(null);
  const [slotProposto, setSlotProposto] = useState<{inizio: Date, fine: Date} | null>(null);
  
  // Stato per il form
  const [formData, setFormData] = useState({
    id_cliente: 0,
    tipologia_oliva: 0,
    id_linea: 0,
    quantita_kg: 0,
    data_inizio: '',
    ora_inizio: '08:00',
    data_fine: '',
    ora_fine: '09:00',
    stato: 'Confermato' as 'Provvisorio' | 'Confermato' | 'Modificato',
    note: '',
    cellulare: '',
    mail: '',
    flagcproprio: false
  });
  
  // Stati per il modal di aggiunta cliente
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
  const [nuovoClienteError, setNuovoClienteError] = useState<string>('');
  
  // Handlers per il form del nuovo cliente
  const handleNuovoClienteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Gestione speciale per i campi numerici
    let newValue: string | number | undefined = value;
    
    if (type === 'number' || name === 'comune_id' || name === 'provincia_id' || name === 'nazione_id' || name === 'olivedef') {
      // Se il campo è numerico e ha un valore, lo convertiamo in numero
      newValue = value ? parseInt(value) : undefined;
    }
    
    console.log(`Handling input change for ${name}, value: ${value}, newValue: ${newValue}`);
    
    // Aggiorna automaticamente la provincia quando viene selezionato un comune
    if (name === 'comune_id' && value) {
      const selectedComune = comuni.find(c => c.id === parseInt(value));
      if (selectedComune) {
        console.log(`Selected comune: ${selectedComune.descrizione}, provincia_id: ${selectedComune.provincia_id}`);
        // Pulisce il filtro di ricerca del comune dopo la selezione
        setComuneFilter('');
        
        if (selectedComune.provincia_id) {
          // Aggiorna anche la provincia se disponibile
          setNuovoClienteForm(prev => {
            console.log(`Updating form with comune_id: ${newValue}, provincia_id: ${selectedComune.provincia_id}`);
            return {
              ...prev,
              comune_id: typeof newValue === 'string' ? parseInt(newValue) : newValue as number | undefined,
              provincia_id: selectedComune.provincia_id
            };
          });
          
          // Pulisce il filtro di ricerca della provincia
          setProvinciaFilter('');
          return;
        }
      }
    }
    
    // Validazione
    let cfValidationError = nuovoClienteForm.cfValidationError || '';
    let pivaValidationError = nuovoClienteForm.pivaValidationError || '';
    let emailValidationError = nuovoClienteForm.emailValidationError || '';
    let indirizzoValidationError = nuovoClienteForm.indirizzoValidationError || '';
    let capValidationError = nuovoClienteForm.capValidationError || '';
    let comuneValidationError = nuovoClienteForm.comuneValidationError || '';
    let provinciaValidationError = nuovoClienteForm.provinciaValidationError || '';
    let nazioneValidationError = nuovoClienteForm.nazioneValidationError || '';
    let telefonoValidationError = nuovoClienteForm.telefonoValidationError || '';
    
    // Validazioni specifiche per ogni campo
    if (name === 'indirizzo') {
      indirizzoValidationError = !value || value.trim() === '' ? 'Campo obbligatorio' : '';
    }
    if (name === 'cap') {
      capValidationError = !value || value.trim() === '' ? 'Campo obbligatorio' : '';
    }
    if (name === 'comune_id') {
      comuneValidationError = !value ? 'Campo obbligatorio' : '';
    }
    if (name === 'provincia_id') {
      provinciaValidationError = !value ? 'Campo obbligatorio' : '';
    }
    if (name === 'nazione_id') {
      nazioneValidationError = !value ? 'Campo obbligatorio' : '';
    }
    if (name === 'telefono') {
      telefonoValidationError = !value || value.trim() === '' ? 'Campo obbligatorio' : '';
    }
    
    // Validazione per codice fiscale
    if (name === 'codice_fiscale') {
      cfValidationError = value && !isValidCodiceFiscale(value) ? 
        'Formato codice fiscale non valido. Deve essere di 16 caratteri alfanumerici (es. RSSMRA80A01H501U)' : '';
    }
    
    // Validazione per email
    if (name === 'email') {
      emailValidationError = value && !isValidEmail(value) ? 
        'Formato email non valido.' : '';
    }
    
    // Validazione per partita IVA
    if (name === 'partita_iva') {
      pivaValidationError = value && !isValidPartitaIVA(value) ? 
        'Formato partita IVA non valido. Deve essere di 11 cifre numeriche.' : '';
    }
    
    // Aggiorna lo stato del form
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
  
  // Gestisce l'invio del form per il nuovo cliente
  const handleNuovoClienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      setErrorMessage('ID azienda mancante. Impossibile aggiungere il cliente.');
      return;
    }
    
    // Validazione campi obbligatori
    if (!nuovoClienteForm.descrizione.trim()) {
      setErrorMessage('Il campo Denominazione/Nome è obbligatorio.');
      return;
    }
    
    if (!nuovoClienteForm.indirizzo.trim()) {
      setErrorMessage('Il campo Indirizzo è obbligatorio.');
      return;
    }
    
    if (!nuovoClienteForm.cap.trim()) {
      setErrorMessage('Il campo CAP è obbligatorio.');
      return;
    }
    
    if (!nuovoClienteForm.comune_id) {
      setErrorMessage('Il campo Comune è obbligatorio.');
      return;
    }
    
    if (!nuovoClienteForm.provincia_id) {
      setErrorMessage('Il campo Provincia è obbligatorio.');
      return;
    }
    
    if (!nuovoClienteForm.nazione_id) {
      setErrorMessage('Il campo Nazione è obbligatorio.');
      return;
    }
    
    if (!nuovoClienteForm.telefono.trim()) {
      setErrorMessage('Il campo Telefono è obbligatorio.');
      return;
    }
    
    // Validazione email
    if (nuovoClienteForm.email && !isValidEmail(nuovoClienteForm.email)) {
      setErrorMessage('Formato email non valido.');
      return;
    }
    
    // Validazione che almeno uno tra codice fiscale e partita IVA sia presente e valido
    const hasCF = nuovoClienteForm.codice_fiscale && isValidCodiceFiscale(nuovoClienteForm.codice_fiscale);
    const hasPIVA = nuovoClienteForm.partita_iva && isValidPartitaIVA(nuovoClienteForm.partita_iva);
    
    if (!hasCF && !hasPIVA) {
      setErrorMessage('È necessario specificare almeno uno tra Codice Fiscale e Partita IVA in formato valido.');
      return;
    }
    
    try {
      setSalvandoNuovoCliente(true);
      
      // Prepara i dati da inviare
      const clienteData: Record<string, any> = {
        descrizione: nuovoClienteForm.descrizione,
        indirizzo: nuovoClienteForm.indirizzo,
        cap: nuovoClienteForm.cap,
        comune: nuovoClienteForm.comune_id,
        provincia: nuovoClienteForm.provincia_id,
        nazione: nuovoClienteForm.nazione_id,
        telefono: nuovoClienteForm.telefono,
        mail: nuovoClienteForm.email,
        codfisc: nuovoClienteForm.codice_fiscale,
        partiva: nuovoClienteForm.partita_iva,
        olivedef: nuovoClienteForm.olivedef
      };
      
      // Se l'ID SIAN è stato specificato, lo includiamo
      if (nuovoClienteForm.id_sian && nuovoClienteForm.id_sian.trim()) {
        clienteData.id_sian = nuovoClienteForm.id_sian.trim();
      }
      
      // Invia i dati al server
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
      
      if (response.data.success) {
        // Aggiornamento cliente nella lista e nel form principale
        const nuovoCliente = response.data.data;
        setClienti(prev => [...prev, nuovoCliente]);
        
        // Aggiorna il form di prenotazione con i dati del nuovo cliente
        setFormData(prev => ({
          ...prev,
          id_cliente: nuovoCliente.id,
          cellulare: nuovoCliente.telefono || '',
          mail: nuovoCliente.mail || ''
        }));
        
        // Se il cliente ha un tipo di oliva predefinito
        if (nuovoCliente.olivedef && nuovoCliente.olivedef > 0) {
          console.log(`Nuovo cliente ha olivedef: ${nuovoCliente.olivedef}`);
          // Imposta il tipo di oliva
          setFormData(prev => ({
            ...prev,
            id_cliente: nuovoCliente.id,
            tipologia_oliva: nuovoCliente.olivedef
          }));
          
          // Cerca una linea compatibile per questo tipo di oliva
          (async () => {
            try {
              const compatibleLine = await findCompatibleLine(nuovoCliente.olivedef);
              if (compatibleLine) {
                setFormData(prev => ({
                  ...prev,
                  id_linea: compatibleLine.id
                }));
                console.log(`Auto-selezionata linea ${compatibleLine.descrizione} per nuovo cliente`);
              }
            } catch (error) {
              console.error("Errore nel trovare linea compatibile per nuovo cliente:", error);
            }
          })();
        }
        
        // Reset del form
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
        setSuccessMessage('Cliente aggiunto con successo!');
        
        // Aggiorna l'ultimo ID SIAN se necessario
        if (response.data.ultimoidsoggetto) {
          setUltimoIdSian(response.data.ultimoidsoggetto);
        }
      } else {
        throw new Error(response.data.message || 'Errore sconosciuto');
      }
    } catch (err: any) {
      console.error('Errore nella creazione del cliente:', err);
      
      // Handling different error types
      if (err.response) {
        setErrorMessage(err.response.data?.message || `Errore del server (${err.response.status})`);
      } else if (err.request) {
        setErrorMessage('Nessuna risposta dal server. Verificare la connessione.');
      } else {
        setErrorMessage(err.message || 'Errore imprevisto durante il salvataggio');
      }
    } finally {
      setSalvandoNuovoCliente(false);
    }
  };
  
  // Stati per le notifiche
  const [sendMailNotification, setSendMailNotification] = useState(false);
  const [sendWhatsAppNotification, setSendWhatsAppNotification] = useState(false);
  
  // Stati per l'anteprima email
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  
  // Stati per la ricerca cliente
  const [clienteFilter, setClienteFilter] = useState('');
  
  // Stati per i messaggi
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Stato utente corrente - Per ora impostiamo direttamente ruolo 2 in base all'indicazione dell'utente
  const [currentUser, setCurrentUser] = useState<{id: number, ruolo: number}>({id: 0, ruolo: 2});
  
  // Funzioni di utilità per validare email, codice fiscale e partita IVA
  const isValidEmail = (email: string): boolean => {
    if (!email || email.trim() === '') return true; // Vuoto è valido (non obbligatorio)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const isValidCodiceFiscale = (cf: string): boolean => {
    if (!cf || cf.trim() === '') return true; // Vuoto è valido (non obbligatorio)
    // Semplificato: verifica 16 caratteri alfanumerici
    return /^[A-Za-z0-9]{16}$/.test(cf);
  };
  
  const isValidPartitaIVA = (piva: string): boolean => {
    if (!piva || piva.trim() === '') return true; // Vuoto è valido (non obbligatorio)
    // Semplificato: verifica 11 caratteri numerici
    return /^\d{11}$/.test(piva);
  };
  
  // Fetch dei dati all'avvio
  useEffect(() => {
    if (!companyId || !companyCode) {
      console.error('CompanyId o companyCode mancanti:', { companyId, companyCode });
      
      // Utilizziamo valori dal localStorage come fallback
      const companyIdFromStorage = localStorage.getItem('companyId');
      const companyCodeFromStorage = localStorage.getItem('companyCode');
      
      if (!companyIdFromStorage || !companyCodeFromStorage) {
        console.error("Impossibile determinare l'azienda corrente.");
        return;
      }
    }
    
    // Imposta ruolo utente a 2 per lo sviluppo
    setCurrentUser({
      id: 1,
      ruolo: 2
    });
    
    console.log('Inizializzazione prenotazioni con companyId:', companyId, 'e companyCode:', companyCode);
    
    const fetchData = async () => {
      try {
        // Recupera informazioni dell'utente corrente
        try {
          const response = await axios.get('/api/auth/me');
          console.log("User data received:", response.data);
          
          if (response.data.success) {
            const userData = response.data.data;
            // Per ora impostiamo manualmente il ruolo a 2 (override)
            setCurrentUser({
              id: userData.id,
              ruolo: 2 // Impostiamo manualmente a 2 per lo sviluppo
            });
          } 
        } catch (error) {
          console.error('Errore nel recupero dati utente:', error);
        }
        
        // Carica i clienti (soggetti) dell'azienda
        console.log(`Fetching soggetti for companyId: ${companyId}`);
        const clientiResponse = await axios.get(`/api/company/${companyId}/tables/soggetti`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        console.log('Risposta clienti:', clientiResponse.data);
        
        if (clientiResponse.data.success) {
          setClienti(clientiResponse.data.data || []);
          console.log("Clienti caricati:", clientiResponse.data.data?.length || 0);
        }
        
        // Carica gli articoli olive (tipologia 'OL')
        const oliveResponse = await axios.get('/api/tables/articoli', {
          params: { where: JSON.stringify({ tipologia: 'OL' }) },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (oliveResponse.data.success) {
          setTipologieOlive(oliveResponse.data.data || []);
          console.log("Tipologie olive caricate:", oliveResponse.data.data?.length || 0);
        }
        
        // Carica le linee di lavorazione
        const lineeResponse = await axios.get(`/api/company/${companyId}/tables/linee`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (lineeResponse.data.success) {
          setLinee(lineeResponse.data.data || []);
          console.log("Linee di lavorazione caricate:", lineeResponse.data.data?.length || 0);
        }
        
        // Carica comuni, province e nazioni per il form di nuovo cliente
        const comuniResponse = await axios.get('/api/tables/comuni', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (comuniResponse.data.success) {
          setComuni(comuniResponse.data.data || []);
          console.log("Comuni caricati:", comuniResponse.data.data?.length || 0);
        }
        
        const provinceResponse = await axios.get('/api/tables/province', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (provinceResponse.data.success) {
          setProvince(provinceResponse.data.data || []);
          console.log("Province caricate:", provinceResponse.data.data?.length || 0);
        }
        
        const nazioniResponse = await axios.get('/api/tables/nazioni', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (nazioniResponse.data.success) {
          setNazioni(nazioniResponse.data.data || []);
          console.log("Nazioni caricate:", nazioniResponse.data.data?.length || 0);
        }
        
        // Recupera prenotazioni
        try {
          console.log(`Fetching prenotazioni for companyCode: ${companyCode}`);
          const prenotazioniResponse = await axios.get(`/api/company/${companyCode}/prenotazioni`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          console.log("Prenotazioni response:", prenotazioniResponse.data);
          console.log("Tipo di risposta:", Array.isArray(prenotazioniResponse.data) ? "Array diretto" : "Oggetto");
          
          if (prenotazioniResponse.data) {
            // Handle both formats:
            // 1. Direct array response from prenotazioniController
            // 2. Standard { success: true, data: [...] } format used in other controllers
            const responseData = prenotazioniResponse.data.data ? prenotazioniResponse.data.data : prenotazioniResponse.data;
            
            const prenotazioniData = Array.isArray(responseData) ? 
              responseData.map((p: any) => ({
                ...p,
                data_inizio: new Date(p.data_inizio),
                data_fine: new Date(p.data_fine)
              })) : [];
            setPrenotazioni(prenotazioniData);
            console.log("Prenotazioni caricate:", prenotazioniData.length);
          }
        } catch (error) {
          console.error('Errore nel recupero prenotazioni:', error);
        }
      } catch (error) {
        console.error('Errore generale nel recupero dati:', error);
      }
    };
    
    fetchData();
  }, [companyId, companyCode]);
  
  // Converte le prenotazioni in formato per il calendario
  useEffect(() => {
    if (prenotazioni.length > 0) {
      const eventi = prenotazioni.map(prenotazione => {
        // Determina se l'utente può modificare questa prenotazione
        const isEditable = 
          currentUser.ruolo === 2 || // Admin può modificare tutto
          (currentUser.ruolo === 3 && prenotazione.id_user === currentUser.id); // Cliente può modificare solo i propri
        
        let title = '';
        if (isEditable || currentUser.ruolo === 2) {
          // Versione con dettagli per l'admin o per il cliente che può modificare
          title = `${prenotazione.nome_cliente} - ${prenotazione.nome_oliva} (${prenotazione.quantita_kg} kg) - ${prenotazione.stato}`;
        } else {
          // Versione semplificata per altri utenti
          title = `Prenotazione - ${prenotazione.stato}`;
        }
        
        return {
          id: prenotazione.id,
          title,
          start: prenotazione.data_inizio,
          end: prenotazione.data_fine,
          prenotazione,
          isEditable
        };
      });
      
      setEventiCalendario(eventi);
    }
  }, [prenotazioni, currentUser]);
  
  // Gestisce la selezione di un evento esistente
  const handleSelectEvent = (event: EventoCalendario) => {
    // Se l'utente non può modificare questa prenotazione, mostra solo i dettagli
    if (!event.isEditable && currentUser.ruolo === 3) {
      alert('Questa prenotazione non può essere modificata da te');
      return;
    }
    
    // Imposta i dati del form dalla prenotazione selezionata
    const prenotazione = event.prenotazione;
    setSelectedPrenotazione(prenotazione);
    
    // Formatta data e ora
    const dataInizio = moment(prenotazione.data_inizio).format('YYYY-MM-DD');
    const oraInizio = moment(prenotazione.data_inizio).format('HH:mm');
    const dataFine = moment(prenotazione.data_fine).format('YYYY-MM-DD');
    const oraFine = moment(prenotazione.data_fine).format('HH:mm');
    
    setFormData({
      id_cliente: prenotazione.id_cliente,
      tipologia_oliva: prenotazione.tipologia_oliva,
      id_linea: prenotazione.id_linea,
      quantita_kg: prenotazione.quantita_kg,
      data_inizio: dataInizio,
      ora_inizio: oraInizio,
      data_fine: dataFine,
      ora_fine: oraFine,
      stato: prenotazione.stato,
      note: prenotazione.note || '',
      cellulare: prenotazione.cellulare || '',
      mail: prenotazione.mail || '',
      flagcproprio: prenotazione.flagcproprio || false
    });
    
    // Mostra le note se il campo contiene testo
    setShowNotes(prenotazione.note ? true : false);
    setShowForm(true);
  };
  
  // Gestisce la selezione di uno slot vuoto per una nuova prenotazione
  const handleSelectSlot = ({ start }: { start: Date }) => {
    // Resetta il form per una nuova prenotazione
    setSelectedPrenotazione(null);
    
    // Imposta data e ora dallo slot selezionato
    const dataInizio = moment(start).format('YYYY-MM-DD');
    const oraInizio = moment(start).format('HH:mm');
    const dataFine = moment(start).add(1, 'hour').format('YYYY-MM-DD');
    const oraFine = moment(start).add(1, 'hour').format('HH:mm');
    
    console.log("Creating new booking with user role:", currentUser.ruolo);
    
    // For role 3 (client), we need to auto-fill their info
    if (currentUser.ruolo === 3) {
      // Find the client data in the clienti array
      const clienteData = clienti.find(c => c.id === currentUser.id);
      const defaultOliveType = clienteData?.olivedef || 0;
      
      // Set the initial form data first without the production line
      setFormData({
        id_cliente: currentUser.id,
        // Use client's default olive type if available
        tipologia_oliva: defaultOliveType,
        id_linea: 0, // Will be set asynchronously
        quantita_kg: 0,
        data_inizio: dataInizio,
        ora_inizio: oraInizio,
        data_fine: dataFine,
        ora_fine: oraFine,
        stato: 'Confermato',
        note: '',
        cellulare: clienteData?.telefono || '',
        mail: clienteData?.mail || '',
        flagcproprio: false
      });
      
      // Find a compatible production line for this olive type (async)
      if (defaultOliveType > 0) {
        (async () => {
          try {
            const compatibleLine = await findCompatibleLine(defaultOliveType);
            if (compatibleLine) {
              setFormData(prev => ({
                ...prev,
                id_linea: compatibleLine.id
              }));
              console.log(`Auto-selezionata linea ${compatibleLine.descrizione} per cliente`);
            }
          } catch (error) {
            console.error("Errore nel trovare linea compatibile:", error);
          }
        })();
      }
    } else {
      // For role 2 (admin/operator)
      setFormData({
        id_cliente: 0,
        tipologia_oliva: 0,
        id_linea: 0,
        quantita_kg: 0,
        data_inizio: dataInizio,
        ora_inizio: oraInizio,
        data_fine: dataFine,
        ora_fine: oraFine,
        stato: 'Confermato',
        note: '',
        cellulare: '',
        mail: '',
        flagcproprio: false
      });
    }
    
    // Reset cliente filter
    setClienteFilter('');
    
    // Resetta le notifiche
    setSendMailNotification(false);
    setSendWhatsAppNotification(false);
    
    setShowForm(true);
  };
  
  // Variabile globale al componente per memorizzare l'ID della prenotazione creata
  const [savedPrenotationId, setSavedPrenotationId] = useState<number | null>(null);
  
  // Gestisce l'invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validazione
      if ((!formData.flagcproprio && formData.id_cliente === 0) || 
          formData.tipologia_oliva === 0 || 
          formData.quantita_kg <= 0 || 
          formData.id_linea === 0) {
        setErrorMessage('Tutti i campi sono obbligatori');
        return;
      }
      
      // Verifica la validità dell'ID linea senza bloccare il flusso
      const lineaSelezionata = linee.find(l => l.id === formData.id_linea);
      if (!lineaSelezionata) {
        console.warn(`Avviso: Linea ID ${formData.id_linea} selezionata non trovata tra le linee disponibili. Proseguo comunque.`);
        // Non blocchiamo più il flusso, permettiamo il salvataggio anche se la linea non è tra quelle caricate
      }
      
      // Calcola datetime di inizio e fine
      const dataOraInizio = `${formData.data_inizio}T${formData.ora_inizio}:00`;
      const dataOraFine = `${formData.data_fine}T${formData.ora_fine}:00`;
      
      const prenotazioneData = {
        id_cliente: formData.id_cliente,
        tipologia_oliva: formData.tipologia_oliva,
        quantita_kg: formData.quantita_kg,
        data_inizio: new Date(dataOraInizio),
        data_fine: new Date(dataOraFine),
        id_linea: formData.id_linea,
        stato: formData.stato,
        note: formData.note,
        cellulare: formData.cellulare,
        mail: formData.mail,
        flagcproprio: formData.flagcproprio,
        id_user: currentUser.id
      };
      
      // Aggiungiamo i parametri per le notifiche se lo stato è Confermato
      // Le notifiche email vanno inviate dopo la conferma dell'anteprima, non durante il salvataggio
      const notificationParams = formData.stato === 'Confermato' ? {
        sendWhatsAppNotification // Solo per WhatsApp, email verrà gestita separatamente
      } : {};
      
      const dataToSend = {
        ...prenotazioneData,
        ...notificationParams
      };
      
      let savedPrenotationId;
      
      if (selectedPrenotazione) {
        // Aggiornamento prenotazione esistente
        await axios.put(`/api/company/${companyCode}/prenotazioni/${selectedPrenotazione.id}`, dataToSend, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        savedPrenotationId = selectedPrenotazione.id;
        
        let message = 'Prenotazione aggiornata con successo';
        if (formData.stato === 'Confermato' && sendWhatsAppNotification) {
          message += ' e notifica inviata via WhatsApp';
        }
        setSuccessMessage(message);
      } else {
        // Creazione nuova prenotazione
        console.log(`Creazione prenotazione per companyCode: ${companyCode}`, dataToSend);
        const response = await axios.post(`/api/company/${companyCode}/prenotazioni`, dataToSend, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        const newPrenotationId = response.data.data.id;
        console.log("Prenotazione creata con ID:", newPrenotationId);
        
        // Immediatamente memorizziamo l'ID nella variabile locale e nello state
        setSavedPrenotationId(newPrenotationId);
        
        const shouldSendEmail = response.data.data.shouldSendEmail as boolean | undefined;
        
        let message = 'Prenotazione creata con successo';
        if (formData.stato === 'Confermato' && sendWhatsAppNotification) {
          message += ' e notifica inviata via WhatsApp';
        }
        setSuccessMessage(message);
        
        // Salva il flag per l'invio automatico email
        if (shouldSendEmail) {
          setSendMailNotification(true);
        }
        
        // Se è stato richiesto l'invio di email, recupera subito il template senza aspettare l'aggiornamento dello state
        if (formData.stato === 'Confermato' && (sendMailNotification || shouldSendEmail) && formData.mail) {
          try {
            console.log("Recupero template email direttamente dopo creazione per ID:", newPrenotationId);
            
            // Recupera il template email dal backend
            const templateResponse = await axios.get(
              `/api/company/${companyCode}/prenotazioni/${newPrenotationId}/email-template`,
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            
            if (templateResponse.data.success) {
              setEmailContent(templateResponse.data.data.emailContent);
              setShowEmailPreview(true);
              return; // Interrompiamo qui l'esecuzione per attendere la conferma dell'utente
            }
          } catch (error) {
            console.error('Errore nel recupero del template email dopo creazione:', error);
            setErrorMessage('Errore nel recupero del template email. La prenotazione è stata salvata ma non è stato possibile inviare la notifica email.');
          }
        }
      }
      
      // Ricarica le prenotazioni
      const response = await axios.get(`/api/company/${companyCode}/prenotazioni`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log("Risposta dopo salvataggio:", response.data);
      
      if (response.data) {
        // Handle both formats:
        // 1. Direct array response from prenotazioniController
        // 2. Standard { success: true, data: [...] } format used in other controllers
        const responseData = response.data.data ? response.data.data : response.data;
        
        const prenotazioniData = Array.isArray(responseData) ? 
          responseData.map((p: any) => ({
            ...p,
            data_inizio: new Date(p.data_inizio),
            data_fine: new Date(p.data_fine)
          })) : [];
        setPrenotazioni(prenotazioniData);
      }
      
      // Se è selezionata l'opzione di invio email o è stato segnalato dal server, mostra l'anteprima dell'email
      // Nota: per nuove prenotazioni, questo viene già gestito direttamente nel blocco di creazione
      if (selectedPrenotazione && formData.stato === 'Confermato' && sendMailNotification && formData.mail) {
        try {
          console.log("Recupero template email per prenotazione esistente ID:", selectedPrenotazione.id);
          
          // Recupera il template email dal backend
          const templateResponse = await axios.get(
            `/api/company/${companyCode}/prenotazioni/${selectedPrenotazione.id}/email-template`,
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          );
          
          if (templateResponse.data.success) {
            setEmailContent(templateResponse.data.data.emailContent);
            setShowEmailPreview(true);
            
            // Non chiudiamo ancora il form, attendiamo la conferma dell'invio email
            return;
          }
        } catch (error) {
          console.error('Errore nel recupero del template email:', error);
          setErrorMessage('Errore nel recupero del template email. La prenotazione è stata salvata ma non è stato possibile inviare la notifica email.');
        }
      }
      
      // Chiudi il form (solo se non viene mostrata l'anteprima email)
      setShowForm(false);
      setSelectedPrenotazione(null);
      setSendMailNotification(false);
      setSendWhatsAppNotification(false);
      
      // Resetta i messaggi dopo 3 secondi
      setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
      
    } catch (error: any) {
      console.error('Errore nella gestione prenotazione:', error);
      
      // Gestione specifica dell'errore di slot occupato (status 409)
      if (error.response && error.response.status === 409) {
        const errorData = error.response.data;
        
        // Verifichiamo se l'errore è relativo a uno slot occupato
        if (errorData.error === 'Slot occupato' || errorData.message?.includes('slot') || errorData.message?.includes('occupat')) {
          // Utilizzare il messaggio dettagliato dal server se disponibile
          const detailMessage = errorData.message || 'Slot temporale già occupato su questa linea';
          
          // Costruiamo un messaggio più informativo
          const lineaSelezionata = linee.find(l => l.id === formData.id_linea);
          const lineaDescr = lineaSelezionata ? lineaSelezionata.descrizione : `Linea ${formData.id_linea}`;
          
          let errorMsg = `ATTENZIONE: ${detailMessage}`;
          
          // Se ci sono ulteriori dettagli sul conflitto, mostriamoli
          if (errorData.data) {
            const { dataInizio, dataFine } = errorData.data;
            if (dataInizio && dataFine) {
              const dataInizioStr = new Date(dataInizio).toLocaleString('it-IT');
              const dataFineStr = new Date(dataFine).toLocaleString('it-IT');
              errorMsg += `\nIntervallo occupato: ${dataInizioStr} - ${dataFineStr}`;
            }
          }
          
          // Calcola il prossimo slot disponibile, verificando che non si sovrapponga ad altri appuntamenti
          if (errorData.data && errorData.data.dataFine) {
            // Usa la durata dell'appuntamento originale per calcolare la nuova ora di fine
            const dataInizioOriginale = new Date(formData.data_inizio + 'T' + formData.ora_inizio);
            const dataFineOriginale = new Date(formData.data_fine + 'T' + formData.ora_fine);
            const durataMillisec = dataFineOriginale.getTime() - dataInizioOriginale.getTime();
            
            // Funzione per verificare se un dato slot si sovrappone ad altri eventi
            const verificaSovrapposizione = (inizioSlot: Date, fineSlot: Date): boolean => {
              return eventiCalendario.some(evento => {
                // Ignora l'evento che ha causato il conflitto originale
                if (errorData.data.conflictId && evento.id === errorData.data.conflictId) return false;
                
                // Verifica solo gli eventi sulla stessa linea
                if (evento.prenotazione.id_linea !== formData.id_linea) return false;
                
                // Controlla sovrapposizione
                const inizioEvento = new Date(evento.start);
                const fineEvento = new Date(evento.end);
                
                return (
                  (inizioSlot <= fineEvento && inizioSlot >= inizioEvento) ||
                  (fineSlot <= fineEvento && fineSlot >= inizioEvento) ||
                  (inizioSlot <= inizioEvento && fineSlot >= fineEvento)
                );
              });
            };
            
            // Inizia dalla fine del conflitto attuale
            let potenzialeDateInizio = new Date(errorData.data.dataFine);
            let slotTrovato = false;
            let tentativiRimasti = 5; // Massimo 5 tentativi per trovare uno slot libero
            
            while (!slotTrovato && tentativiRimasti > 0) {
              // Arrotonda al quarto d'ora più vicino
              const minuti = potenzialeDateInizio.getMinutes();
              const nuoviMinuti = Math.ceil(minuti / 15) * 15;
              potenzialeDateInizio.setMinutes(nuoviMinuti);
              potenzialeDateInizio.setSeconds(0);
              
              // Calcola la potenziale ora di fine
              const potenzialeDateFine = new Date(potenzialeDateInizio.getTime() + durataMillisec);
              
              // Verifica se questo slot è libero
              if (!verificaSovrapposizione(potenzialeDateInizio, potenzialeDateFine)) {
                slotTrovato = true;
                
                // Formatta le date in formato leggibile
                const dataFormattata = potenzialeDateInizio.toLocaleDateString('it-IT');
                const oraInizioFormattata = potenzialeDateInizio.toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'});
                const oraFineFormattata = potenzialeDateFine.toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'});
                
                // Salva lo slot proposto
                setSlotProposto({
                  inizio: new Date(potenzialeDateInizio),
                  fine: new Date(potenzialeDateFine)
                });
                
                errorMsg += `\n\nProssimo slot disponibile per questa linea: ${dataFormattata} dalle ore ${oraInizioFormattata} alle ${oraFineFormattata}`;
              } else {
                // Cerca lo slot successivo usando la fine dell'evento che causa conflitto
                const eventoConflitto = eventiCalendario.find(evento => {
                  const inizioEvento = new Date(evento.start);
                  const fineEvento = new Date(evento.end);
                  return (
                    evento.prenotazione.id_linea === formData.id_linea &&
                    (
                      (potenzialeDateInizio <= fineEvento && potenzialeDateInizio >= inizioEvento) ||
                      (potenzialeDateFine <= fineEvento && potenzialeDateFine >= inizioEvento) ||
                      (potenzialeDateInizio <= inizioEvento && potenzialeDateFine >= fineEvento)
                    )
                  );
                });
                
                if (eventoConflitto) {
                  // Usa la fine dell'evento che causa conflitto come nuovo punto di partenza
                  potenzialeDateInizio = new Date(eventoConflitto.end);
                } else {
                  // Fallback: avanza di 15 minuti come prima
                  potenzialeDateInizio = new Date(potenzialeDateInizio.getTime() + 15 * 60 * 1000);
                }
                
                tentativiRimasti--;
              }
            }
            
            // Se non è stato trovato uno slot dopo i tentativi, mostra un messaggio generico
            if (!slotTrovato) {
              errorMsg += `\n\nNon è stato possibile trovare uno slot libero nei prossimi orari. Prova a verificare il calendario per altre disponibilità.`;
            }
          }
          
          setErrorMessage(errorMsg);
        } else {
          // Altro errore di conflitto
          setErrorMessage(errorData.message || 'Errore di conflitto. La richiesta non può essere completata.');
        }
      } else if (error.response) {
        // Altri errori di risposta HTTP
        setErrorMessage(error.response.data?.message || `Errore del server (${error.response.status})`);
      } else if (error.request) {
        // Errori di connessione
        setErrorMessage('Nessuna risposta dal server. Verificare la connessione.');
      } else {
        // Errori generici
        setErrorMessage(error.message || 'Si è verificato un errore. Riprova più tardi.');
      }
    }
  };
  
  // Gestisce l'invio dell'email dopo la conferma dell'anteprima
  const handleSendEmail = async () => {
    try {
      setEmailSending(true);
      
      // Ottieni l'ID della prenotazione corrente
      let prenotationId: number | null = null;
      
      if (selectedPrenotazione) {
        prenotationId = selectedPrenotazione.id;
      } else if (savedPrenotationId) {
        prenotationId = savedPrenotationId;
      }
      
      if (!prenotationId) {
        setErrorMessage('Errore: ID prenotazione non trovato');
        setEmailSending(false);
        return;
      }
      
      // Invia l'email con il contenuto modificato
      const response = await axios.post(
        `/api/company/${companyCode}/prenotazioni/${prenotationId}/send-email`,
        { emailContent },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
        setSuccessMessage(prevMessage => prevMessage + ' Email inviata con successo!');
        
        // Chiudi dialogo anteprima e form
        setShowEmailPreview(false);
        setShowForm(false);
        setSelectedPrenotazione(null);
        setSendMailNotification(false);
        setSendWhatsAppNotification(false);
        setEmailContent('');
      } else {
        setErrorMessage('Errore nell\'invio dell\'email. Riprova più tardi.');
      }
    } catch (error) {
      console.error('Errore nell\'invio email:', error);
      setErrorMessage('Errore nell\'invio dell\'email. Riprova più tardi.');
    } finally {
      setEmailSending(false);
    }
  };
  
  // Trova linee compatibili con un tipo di oliva
  const findCompatibleLine = async (oliveTypeId: number): Promise<LineaLavorazione | undefined> => {
    // If no olive type is selected, return undefined
    if (!oliveTypeId || oliveTypeId <= 0) return undefined;
    
    try {
      // Chiamata all'API per ottenere le linee compatibili con questo tipo di oliva
      console.log(`Fetching linee compatibili per oliva ID ${oliveTypeId}`);
      const response = await axios.get(`/api/company/${companyId}/olive-linee/olive/${oliveTypeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('Risposta linee compatibili:', response.data);
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        // Usa la linea con la priorità più alta
        const compatibleLines = response.data.data;
        console.log(`Trovate ${compatibleLines.length} linee compatibili per oliva ID ${oliveTypeId}`);
        const bestLine = compatibleLines[0]; // La prima è quella con priorità più alta (ordinate nella query)
        
        // Trova la linea completa nel nostro state locale
        const fullLineInfo = linee.find(l => l.id === bestLine.id);
        if (fullLineInfo) {
          console.log(`Selezionata linea compatibile: ${fullLineInfo.descrizione}`);
          return fullLineInfo;
        }
      } else {
        console.log(`Metodo usato: ${response.data.method}, nessuna linea specifica trovata`);
        
        // Fallback: prova con il vecchio metodo (campo id_oliva nella tabella linee)
        const compatibleLine = linee.find(linea => linea.id_oliva === oliveTypeId);
        
        if (compatibleLine) {
          console.log(`Usato metodo legacy: trovata linea specifica per oliva ID ${oliveTypeId}: ${compatibleLine.descrizione}`);
          return compatibleLine;
        }
        
        // Se ancora niente, restituisci la prima linea disponibile
        if (linee.length > 0) {
          console.log(`Nessuna linea specifica trovata per oliva ID ${oliveTypeId}, uso la prima disponibile`);
          return linee[0];
        }
      }
    } catch (error) {
      console.error('Errore nel recupero delle linee compatibili:', error);
      
      // Fallback in caso di errore: usa il vecchio metodo
      const compatibleLine = linee.find(linea => linea.id_oliva === oliveTypeId);
      
      if (compatibleLine) {
        console.log(`Fallback: trovata linea specifica per oliva ID ${oliveTypeId}: ${compatibleLine.descrizione}`);
        return compatibleLine;
      }
      
      // Se ancora niente, restituisci la prima linea disponibile
      if (linee.length > 0) {
        console.log(`Fallback: nessuna linea specifica trovata, uso la prima disponibile`);
        return linee[0];
      }
    }
    
    return undefined;
  };

  // Gestisce i cambiamenti nei campi del form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for olive type field
    if (name === "tipologia_oliva") {
      const oliveTypeId = parseInt(value);
      
      // Update the olive type first
      setFormData(prev => ({
        ...prev,
        tipologia_oliva: oliveTypeId
      }));
      
      // Find and set compatible production line (async)
      if (oliveTypeId > 0) {
        (async () => {
          try {
            const compatibleLine = await findCompatibleLine(oliveTypeId);
            if (compatibleLine) {
              setFormData(prev => ({
                ...prev,
                id_linea: compatibleLine.id
              }));
            }
          } catch (error) {
            console.error("Errore nel trovare linea compatibile:", error);
          }
        })();
      }
    } 
    // Handle quantity change to calculate the end time based on processing capacity
    else if (name === "quantita_kg" && formData.id_linea > 0) {
      const updatedQuantita = parseInt(value);
      const lineaSelezionata = linee.find(l => l.id === formData.id_linea);
      
      setFormData(prev => ({
        ...prev,
        quantita_kg: updatedQuantita
      }));
      
      if (lineaSelezionata && updatedQuantita > 0) {
        // Calculate duration in hours = quantity / capacity
        const durata = updatedQuantita / lineaSelezionata.cap_oraria;
        
        // Calculate end date and time based on start date and time
        const startDateTime = `${formData.data_inizio}T${formData.ora_inizio}:00`;
        const endDateTime = moment(startDateTime).add(durata, 'hours');
        
        setFormData(prev => ({
          ...prev,
          quantita_kg: updatedQuantita,
          data_fine: endDateTime.format('YYYY-MM-DD'),
          ora_fine: endDateTime.format('HH:mm')
        }));
      }
    }
    // Handle start date or time change to update end date/time if quantity and line are set
    else if ((name === "data_inizio" || name === "ora_inizio") && formData.quantita_kg > 0 && formData.id_linea > 0) {
      // Update the field that changed
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      const lineaSelezionata = linee.find(l => l.id === formData.id_linea);
      
      if (lineaSelezionata) {
        // Calculate duration in hours = quantity / capacity
        const durata = formData.quantita_kg / lineaSelezionata.cap_oraria;
        
        // Create a new start date/time with the updated value
        const startDateTime = name === "data_inizio" 
          ? `${value}T${formData.ora_inizio}:00`
          : `${formData.data_inizio}T${value}:00`;
        
        const endDateTime = moment(startDateTime).add(durata, 'hours');
        
        setFormData(prev => ({
          ...prev,
          data_fine: endDateTime.format('YYYY-MM-DD'),
          ora_fine: endDateTime.format('HH:mm')
        }));
      }
    }
    // Handle line change to recalculate end time if quantity is set
    else if (name === "id_linea") {
      const lineaId = parseInt(value);
      const lineaSelezionata = linee.find(l => l.id === lineaId);
      
      // Update the field first
      setFormData(prev => ({
        ...prev,
        id_linea: lineaId
      }));
      
      // Then recalculate end time if we have a quantity
      if (lineaSelezionata && formData.quantita_kg > 0) {
        // Calculate duration in hours = quantity / capacity
        const durata = formData.quantita_kg / lineaSelezionata.cap_oraria;
        
        // Calculate end date and time based on start date and time
        const startDateTime = `${formData.data_inizio}T${formData.ora_inizio}:00`;
        const endDateTime = moment(startDateTime).add(durata, 'hours');
        
        setFormData(prev => ({
          ...prev,
          data_fine: endDateTime.format('YYYY-MM-DD'),
          ora_fine: endDateTime.format('HH:mm')
        }));
      }
    }
    else {
      // Standard handling for other fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Debug del contenuto del form dopo ogni cambiamento
    console.log("Current form data:", formData);
    console.log("Current user role:", currentUser.ruolo);
  };
  
  // Funzione per definire colori in base alla linea e allo stato
  const getEventStyle = (event: EventoCalendario) => {
    const { stato, id_linea } = event.prenotazione;
    const isEditable = event.isEditable;
    
    // Ottieni la linea selezionata
    const selectedLine = linee.find(l => l.id === id_linea);
    
    // Usa il colore della linea se disponibile, altrimenti usa un colore neutro
    let backgroundColor;
    
    if (selectedLine && selectedLine.colore) {
      // Usa il colore personalizzato della linea
      backgroundColor = selectedLine.colore;
    } else {
      // Colore neutro se non c'è un colore per la linea
      backgroundColor = '#63666A';
    }
    
    // Definisci il colore e lo spessore del bordo in base allo stato
    let borderColor, borderWidth;
    
    if (stato === 'Provvisorio') {
      borderColor = '#e6c700'; // Giallo
      borderWidth = '3px';
    } else if (stato === 'Confermato') {
      borderColor = '#34b734'; // Verde
      borderWidth = '3px';
    } else if (stato === 'Modificato') {
      borderColor = '#e67700'; // Arancione
      borderWidth = '3px';
    } else {
      borderColor = backgroundColor;
      borderWidth = '1px';
    }
    
    // Stile in base se è modificabile o meno
    const opacity = isEditable ? 0.9 : 0.5;
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity,
        color: getContrastYIQ(backgroundColor), // Determina colore testo (bianco/nero) in base al contrasto
        border: `${borderWidth} solid ${borderColor}`,
        padding: '2px 5px',
        fontWeight: 500
      }
    };
  };
  
  // Funzione utility per aggiungere trasparenza a un colore hex
  const addAlphaToHex = (hexColor: string, alpha: number): string => {
    if (!hexColor || !hexColor.startsWith('#')) return hexColor;
    // Converti alpha (0-1) a byte (0-255)
    const alphaInt = Math.round(alpha * 255);
    return `${hexColor}${alphaInt.toString(16).padStart(2, '0')}`;
  };
  
  // Funzione utility per regolare la tonalità di un colore hex
  const adjustHexColor = (hexColor: string, amount: number): string => {
    if (!hexColor || !hexColor.startsWith('#')) return hexColor;
    
    // Rimuovi # e converti in RGB
    const hex = hexColor.slice(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Regola ogni componente
    const newR = Math.max(0, Math.min(255, r + amount));
    const newG = Math.max(0, Math.min(255, g + amount));
    const newB = Math.max(0, Math.min(255, b + amount));
    
    // Converti di nuovo in hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };
  
  // Funzione per determinare se usare testo bianco o nero in base al contrasto
  const getContrastYIQ = (hexColor: string): string => {
    if (!hexColor || !hexColor.startsWith('#')) return 'white';
    
    // Rimuovi # e converti in RGB
    const hex = hexColor.slice(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Formula YIQ per calcolare la luminosità percepita
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Ritorna bianco o nero in base alla luminosità
    return (yiq >= 128) ? 'black' : 'white';
  };
  
  // Funzione per accettare lo slot proposto
  const handleAccettaSlotProposto = () => {
    if (slotProposto) {
      // Imposta i dati del form con lo slot proposto
      const dataInizio = moment(slotProposto.inizio).format('YYYY-MM-DD');
      const oraInizio = moment(slotProposto.inizio).format('HH:mm');
      const dataFine = moment(slotProposto.fine).format('YYYY-MM-DD');
      const oraFine = moment(slotProposto.fine).format('HH:mm');
      
      setFormData(prev => ({
        ...prev,
        data_inizio: dataInizio,
        ora_inizio: oraInizio,
        data_fine: dataFine,
        ora_fine: oraFine
      }));
      
      // Pulisci il messaggio di errore e lo slot proposto
      setErrorMessage('');
      setSlotProposto(null);
    }
  };
  
  return (
    <div style={{ height: 'calc(100vh - 120px)', padding: '20px' }}>
      
      {/* Messaggi di successo/errore - Solo messaggio di successo qui, l'errore è ora nel form */}
      {successMessage && (
        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
          {successMessage}
        </div>
      )}
      
      {/* Bottoni di azione rimossi, ora nell'header */}
      
      {/* Anteprima Email */}
      {/* Modal per l'aggiunta di un nuovo cliente */}
      {showNuovoClienteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1002, // Più alto di tutti gli altri elementi
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }} onClick={() => setShowNuovoClienteModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '5px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '0'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '15px 20px',
              borderBottom: '1px solid #e3e3e3',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8f9fa'
            }}>
              <h3 style={{ margin: 0 }}><i className="fas fa-user-plus" style={{ marginRight: '10px' }}></i> Nuovo Cliente</h3>
              <button 
                onClick={() => setShowNuovoClienteModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <form onSubmit={handleNuovoClienteSubmit}>
                {/* Denominazione / Nome */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                    Denominazione/Nome <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="descrizione"
                    value={nuovoClienteForm.descrizione}
                    onChange={handleNuovoClienteInputChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da'
                    }}
                    required
                  />
                </div>
                
                {/* Indirizzo e CAP */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: '2' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Indirizzo <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="indirizzo"
                      value={nuovoClienteForm.indirizzo}
                      onChange={handleNuovoClienteInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: nuovoClienteForm.indirizzoValidationError ? '1px solid #dc3545' : '1px solid #ced4da'
                      }}
                      required
                    />
                    {nuovoClienteForm.indirizzoValidationError && (
                      <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '4px' }}>
                        {nuovoClienteForm.indirizzoValidationError}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: '1' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      CAP <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="cap"
                      value={nuovoClienteForm.cap}
                      onChange={handleNuovoClienteInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: nuovoClienteForm.capValidationError ? '1px solid #dc3545' : '1px solid #ced4da'
                      }}
                      required
                    />
                    {nuovoClienteForm.capValidationError && (
                      <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '4px' }}>
                        {nuovoClienteForm.capValidationError}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Comune, Provincia, Nazione */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: '1', position: 'relative' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Comune <span style={{ color: 'red' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      {nuovoClienteForm.comune_id && !comuneFilter ? (
                        // Se un comune è selezionato e il filtro è vuoto, mostra solo il comune selezionato
                        <div 
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            backgroundColor: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>{comuni.find(c => c.id === nuovoClienteForm.comune_id)?.descrizione}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setNuovoClienteForm(prev => ({
                                ...prev,
                                comune_id: undefined,
                                comuneValidationError: 'Campo obbligatorio'
                              }));
                              setComuneFilter('');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#6c757d'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        // Altrimenti mostra il campo di ricerca
                        <input
                          type="text"
                          placeholder="Cerca comune..."
                          value={comuneFilter}
                          onChange={(e) => setComuneFilter(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: nuovoClienteForm.comuneValidationError ? '1px solid #dc3545' : '1px solid #ced4da'
                          }}
                        />
                      )}
                      
                      {/* Pulsante X per il campo di ricerca */}
                      {comuneFilter && (
                        <button
                          type="button"
                          onClick={() => setComuneFilter('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6c757d'
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    
                    {/* Campo nascosto per il valore effettivo */}
                    <input 
                      type="hidden" 
                      name="comune_id" 
                      value={nuovoClienteForm.comune_id || ''}
                    />
                    {comuneFilter && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
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
                          .slice(0, 20)
                          .map(comune => (
                            <div
                              key={comune.id}
                              onClick={() => {
                                // Aggiorna il form con l'ID del comune 
                                setNuovoClienteForm(prev => ({
                                  ...prev,
                                  comune_id: comune.id,
                                  comuneValidationError: '',
                                  ...(comune.provincia_id ? { 
                                    provincia_id: comune.provincia_id, 
                                    provinciaValidationError: '' 
                                  } : {})
                                }));
                                
                                // Svuota il campo di ricerca per mostrare solo il valore selezionato
                                setComuneFilter('');
                                
                                // Se è selezionata una provincia, aggiorna anche il filtro della provincia
                                if (comune.provincia_id) {
                                  const provinciaCorrispondente = province.find(p => p.id === comune.provincia_id);
                                  if (provinciaCorrispondente) {
                                    setProvinciaFilter('');
                                  }
                                }
                              }}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              {comune.descrizione}
                            </div>
                          ))
                        }
                      </div>
                    )}
                    {nuovoClienteForm.comuneValidationError && (
                      <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '4px' }}>
                        {nuovoClienteForm.comuneValidationError}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: '1', position: 'relative' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Provincia <span style={{ color: 'red' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      {nuovoClienteForm.provincia_id && !provinciaFilter ? (
                        // Se una provincia è selezionata e il filtro è vuoto, mostra solo la provincia selezionata
                        <div 
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            backgroundColor: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>{province.find(p => p.id === nuovoClienteForm.provincia_id)?.descrizione}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setNuovoClienteForm(prev => ({
                                ...prev,
                                provincia_id: undefined,
                                provinciaValidationError: 'Campo obbligatorio'
                              }));
                              setProvinciaFilter('');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#6c757d'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        // Altrimenti mostra il campo di ricerca
                        <input
                          type="text"
                          placeholder="Cerca provincia..."
                          value={provinciaFilter}
                          onChange={(e) => setProvinciaFilter(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: nuovoClienteForm.provinciaValidationError ? '1px solid #dc3545' : '1px solid #ced4da'
                          }}
                        />
                      )}
                      
                      {/* Pulsante X per il campo di ricerca */}
                      {provinciaFilter && (
                        <button
                          type="button"
                          onClick={() => setProvinciaFilter('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6c757d'
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    
                    {/* Campo nascosto per il valore effettivo */}
                    <input 
                      type="hidden" 
                      name="provincia_id" 
                      value={nuovoClienteForm.provincia_id || ''}
                    />
                    {provinciaFilter && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '0 0 4px 4px',
                        zIndex: 1000,
                        marginTop: '1px'
                      }}>
                        {province
                          .filter(provincia => provincia.descrizione.toLowerCase().includes(provinciaFilter.toLowerCase()) ||
                            (provincia.sigla && provincia.sigla.toLowerCase().includes(provinciaFilter.toLowerCase())))
                          .slice(0, 20)
                          .map(provincia => (
                            <div
                              key={provincia.id}
                              onClick={() => {
                                // Aggiorna il form
                                setNuovoClienteForm(prev => ({
                                  ...prev,
                                  provincia_id: provincia.id,
                                  provinciaValidationError: ''
                                }));
                                
                                // Svuota il filtro per mostrare solo il valore selezionato
                                setProvinciaFilter('');
                              }}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              {provincia.descrizione} {provincia.sigla && `(${provincia.sigla})`}
                            </div>
                          ))
                        }
                      </div>
                    )}
                    {nuovoClienteForm.provinciaValidationError && (
                      <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '4px' }}>
                        {nuovoClienteForm.provinciaValidationError}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: '1', position: 'relative' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Nazione <span style={{ color: 'red' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      {nuovoClienteForm.nazione_id && !nazioneFilter ? (
                        // Se una nazione è selezionata e il filtro è vuoto, mostra solo la nazione selezionata
                        <div 
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            backgroundColor: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>{nazioni.find(n => n.id === nuovoClienteForm.nazione_id)?.descrizione}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setNuovoClienteForm(prev => ({
                                ...prev,
                                nazione_id: undefined,
                                nazioneValidationError: 'Campo obbligatorio'
                              }));
                              setNazioneFilter('');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#6c757d'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        // Altrimenti mostra il campo di ricerca
                        <input
                          type="text"
                          placeholder="Cerca nazione..."
                          value={nazioneFilter}
                          onChange={(e) => setNazioneFilter(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: nuovoClienteForm.nazioneValidationError ? '1px solid #dc3545' : '1px solid #ced4da'
                          }}
                        />
                      )}
                      
                      {/* Pulsante X per il campo di ricerca */}
                      {nazioneFilter && (
                        <button
                          type="button"
                          onClick={() => setNazioneFilter('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6c757d'
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    
                    {/* Campo nascosto per il valore effettivo */}
                    <input 
                      type="hidden" 
                      name="nazione_id" 
                      value={nuovoClienteForm.nazione_id || ''}
                    />
                    {nazioneFilter && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
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
                          .slice(0, 20)
                          .map(nazione => (
                            <div
                              key={nazione.id}
                              onClick={() => {
                                // Aggiorna il form
                                setNuovoClienteForm(prev => ({
                                  ...prev,
                                  nazione_id: nazione.id,
                                  nazioneValidationError: ''
                                }));
                                
                                // Svuota il filtro per mostrare solo il valore selezionato
                                setNazioneFilter('');
                              }}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              {nazione.descrizione}
                            </div>
                          ))
                        }
                      </div>
                    )}
                    {nuovoClienteForm.nazioneValidationError && (
                      <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '4px' }}>
                        {nuovoClienteForm.nazioneValidationError}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Telefono e Email */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: '1' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Telefono <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="telefono"
                      value={nuovoClienteForm.telefono}
                      onChange={handleNuovoClienteInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: nuovoClienteForm.telefonoValidationError ? '1px solid #dc3545' : '1px solid #ced4da'
                      }}
                      required
                    />
                    {nuovoClienteForm.telefonoValidationError && (
                      <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '4px' }}>
                        {nuovoClienteForm.telefonoValidationError}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: '1' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={nuovoClienteForm.email}
                      onChange={handleNuovoClienteInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: nuovoClienteForm.emailValidationError ? '1px solid #dc3545' : '1px solid #ced4da'
                      }}
                    />
                    {nuovoClienteForm.emailValidationError && (
                      <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '4px' }}>
                        {nuovoClienteForm.emailValidationError}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Codice Fiscale e Partita IVA */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: '1' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Codice Fiscale <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="codice_fiscale"
                      value={nuovoClienteForm.codice_fiscale}
                      onChange={handleNuovoClienteInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: nuovoClienteForm.cfValidationError ? '1px solid #dc3545' : '1px solid #ced4da'
                      }}
                    />
                    {nuovoClienteForm.cfValidationError && (
                      <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '4px' }}>
                        {nuovoClienteForm.cfValidationError}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75em', color: '#6c757d', marginTop: '4px' }}>
                      Se non specificato Partita IVA, il Codice Fiscale è obbligatorio
                    </div>
                  </div>
                  <div style={{ flex: '1' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Partita IVA <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="partita_iva"
                      value={nuovoClienteForm.partita_iva}
                      onChange={handleNuovoClienteInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: nuovoClienteForm.pivaValidationError ? '1px solid #dc3545' : '1px solid #ced4da'
                      }}
                    />
                    {nuovoClienteForm.pivaValidationError && (
                      <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '4px' }}>
                        {nuovoClienteForm.pivaValidationError}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75em', color: '#6c757d', marginTop: '4px' }}>
                      Se non specificato Codice Fiscale, la Partita IVA è obbligatoria
                    </div>
                  </div>
                </div>
                
                {/* ID SIAN e Olive Predefinite */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: '1' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      ID SIAN
                    </label>
                    <input
                      type="text"
                      name="id_sian"
                      value={nuovoClienteForm.id_sian}
                      onChange={handleNuovoClienteInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ced4da'
                      }}
                      placeholder={ultimoIdSian ? `Ultimo ID: ${ultimoIdSian}` : ''}
                    />
                    <div style={{ fontSize: '0.75em', color: '#6c757d', marginTop: '4px' }}>
                      Se lasciato vuoto, verrà generato automaticamente
                    </div>
                  </div>
                  <div style={{ flex: '1' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Tipo di Olive Predefinito
                    </label>
                    <select
                      name="olivedef"
                      value={nuovoClienteForm.olivedef || ''}
                      onChange={handleNuovoClienteInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ced4da'
                      }}
                    >
                      <option value="">-- Seleziona tipologia --</option>
                      {tipologieOlive.map(oliva => (
                        <option key={oliva.id} value={oliva.id}>
                          {oliva.descrizione}
                        </option>
                      ))}
                    </select>
                    <div style={{ fontSize: '0.75em', color: '#6c757d', marginTop: '4px' }}>
                      Tipo di olive abitualmente conferite dal cliente
                    </div>
                  </div>
                </div>
                
                {/* Pulsanti */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowNuovoClienteModal(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#4a86e8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    disabled={salvandoNuovoCliente}
                  >
                    {salvandoNuovoCliente ? (
                      <>
                        <span className="spinner-border spinner-border-sm"></span>
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i>
                        Salva Cliente
                      </>
                    )}
                  </button>
                </div>
                
                {/* Messaggio di errore */}
                {nuovoClienteError && (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '10px', 
                    backgroundColor: '#f8d7da', 
                    color: '#721c24',
                    borderRadius: '4px'
                  }}>
                    {nuovoClienteError}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
      
      {showEmailPreview && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '5px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1001, // Sopra il form di prenotazione
          maxWidth: '650px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <h3>Anteprima Email</h3>
          <p>Modifica il testo dell'email se necessario e conferma l'invio:</p>
          
          <div style={{ marginBottom: '15px' }}>
            <textarea 
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '4px', 
                border: '1px solid #ced4da',
                minHeight: '300px',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              border: '1px solid #ced4da', 
              borderRadius: '4px', 
              padding: '10px', 
              backgroundColor: '#f8f9fa' 
            }}>
              <strong>Anteprima:</strong>
              <div 
                dangerouslySetInnerHTML={{ __html: emailContent }} 
                style={{ margin: '10px 0', fontFamily: 'Arial, sans-serif' }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowEmailPreview(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={emailSending}
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              disabled={emailSending}
            >
              {emailSending ? 'Invio in corso...' : 'Invia Email'}
            </button>
          </div>
        </div>
      )}
      
      {/* Stile CSS per l'animazione di evidenziazione */}
      <style>
        {`
          @keyframes highlight-error {
            0%, 100% { background-color: ${errorMessage?.includes('ATTENZIONE') ? '#ff9e80' : '#f8d7da'}; }
            50% { background-color: #ffeb3b; }
          }
          
          .error-flash {
            animation: highlight-error 1.5s ease;
          }
          
          .modal-form {
            scroll-behavior: smooth;
          }
        `}
      </style>
      
      {/* Form di prenotazione */}
      {showForm && (
        <div
        className="modal-form form-overlay"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '5px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
          maxWidth: '650px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <h3>{selectedPrenotazione ? 'Modifica Prenotazione' : 'Nuova Prenotazione'}</h3>
          
          {/* Mostra il messaggio di errore all'interno del form con riferimento per scroll */}
          {errorMessage && (
            <div 
              id="error-message-container"
              ref={(el) => {
                // Scroll al messaggio di errore quando appare
                if (el) {
                  setTimeout(() => {
                    // Sposta automaticamente la visualizzazione sul messaggio di errore
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Aggiunge la classe per l'animazione
                    el.classList.add('error-flash');
                    // Focus sul container per accessibilità
                    el.setAttribute('tabindex', '-1');
                    el.focus();
                  }, 100);
                }
              }}
              style={{ 
                backgroundColor: errorMessage.includes('ATTENZIONE') ? '#ff9e80' : '#f8d7da', 
                color: '#721c24', 
                padding: '15px', 
                marginBottom: '15px', 
                borderRadius: '4px',
                border: errorMessage.includes('ATTENZIONE') ? '2px solid #e53935' : '1px solid #f5c6cb',
                fontSize: errorMessage.includes('ATTENZIONE') ? '1.05rem' : '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '10px',
                scrollMarginTop: '20px',
                outline: 'none'
              }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', width: '100%' }}>
                {errorMessage.includes('ATTENZIONE') && (
                  <i className="fas fa-exclamation-triangle" style={{ color: '#e53935', fontSize: '1.3rem', marginTop: '2px' }}></i>
                )}
                <div style={{ whiteSpace: 'pre-line' }}>{errorMessage}</div>
              </div>
              
              {/* Mostra il pulsante "Accetta" se c'è uno slot proposto */}
              {slotProposto && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleAccettaSlotProposto}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <i className="fas fa-check"></i> Accetta Slot Proposto
                  </button>
                </div>
              )}
            </div>
          )}
          

          <form 
            className="prenotazione-form responsive-form"
            onSubmit={handleSubmit} 
            onKeyDown={(e) => {
              // Previeni l'invio del form quando si preme "Invio" nei campi input
              if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                return false;
              }
            }}>
            {/* Checkbox C/Proprio */}
            <div 
              className="checkbox-inline"
              style={{ 
                marginBottom: '10px', 
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '5px'
              }}
            >
              <input
                type="checkbox"
                id="flagcproprio"
                checked={formData.flagcproprio}
                onChange={(e) => setFormData(prev => ({ ...prev, flagcproprio: e.target.checked }))}
                style={{ marginRight: '5px' }}
              />
              <span style={{ whiteSpace: 'nowrap' }}>Conto Proprio</span>
            </div>
            
            {/* Cliente - visualizzato solo se non è flagcproprio */}
            {!formData.flagcproprio && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Cliente:</label>
                
                {Number(currentUser.ruolo) === 2 ? (
                  <div style={{position: 'relative'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <input
                        type="text"
                        id="cliente_search"
                        placeholder={formData.id_cliente ? clienti.find(c => c.id === formData.id_cliente)?.descrizione || "Cerca cliente..." : "Cerca cliente..."}
                        value={clienteFilter}
                        onChange={(e) => setClienteFilter(e.target.value)}
                        style={{
                          width: '100%', 
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ced4da'
                        }}
                        onFocus={() => {
                          if (formData.id_cliente && !clienteFilter) {
                            // Se c'è un cliente già selezionato e il campo è vuoto, mostriamo il nome
                            const cliente = clienti.find(c => c.id === formData.id_cliente);
                            if (cliente) {
                              setClienteFilter(cliente.descrizione);
                            }
                          }
                        }}
                      />
                      
                      {/* Bottone per aggiungere un nuovo cliente */}
                      <button
                        type="button"
                        onClick={() => setShowNuovoClienteModal(true)}
                        style={{
                          marginLeft: '8px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#4a86e8',
                          padding: '0 5px',
                          flexShrink: 0
                        }}
                        title="Aggiungi nuovo cliente"
                      >
                        <i className="fas fa-plus-circle"></i>
                      </button>
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
                  
                  {/* Box di selezione clienti */}
                  {clienti.filter(cliente => 
                    cliente.descrizione && 
                    cliente.descrizione.toLowerCase().includes(clienteFilter.toLowerCase())
                  ).length > 0 && clienteFilter && (
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
                        .filter(cliente => cliente.descrizione && cliente.descrizione.toLowerCase().includes(clienteFilter.toLowerCase()))
                        .sort((a, b) => {
                          if (!a.descrizione) return 1;
                          if (!b.descrizione) return -1;
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
                              // First, update the client ID and contact info
                              setFormData(prev => {
                                // Update with client ID and contact info
                                return {
                                  ...prev,
                                  id_cliente: cliente.id,
                                  cellulare: cliente.telefono || '',
                                  mail: cliente.mail || ''
                                };
                              });
                              
                              // If the client has a default olive type
                              if (cliente.olivedef && cliente.olivedef > 0) {
                                // Set the olive type first
                                setFormData(prev => ({
                                  ...prev,
                                  id_cliente: cliente.id,
                                  tipologia_oliva: cliente.olivedef || 0,
                                }));
                                
                                console.log("Settata tipologia oliva default:", cliente.olivedef);
                                
                                // Find a compatible production line for this olive type (async)
                                (async () => {
                                  try {
                                    const compatibleLine = await findCompatibleLine(cliente.olivedef || 0);
                                    if (compatibleLine) {
                                      setFormData(prev => ({
                                        ...prev,
                                        id_linea: compatibleLine.id
                                      }));
                                      console.log("Settata linea compatibile:", compatibleLine.id);
                                    }
                                  } catch (error) {
                                    console.error("Errore nel trovare linea compatibile:", error);
                                  }
                                })();
                              }
                              
                              console.log("Cliente selezionato:", cliente.id, cliente.descrizione, "olivedef:", cliente.olivedef);
                              setClienteFilter(''); // Svuotiamo il campo di ricerca dopo la selezione
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #eee',
                              backgroundColor: formData.id_cliente === cliente.id ? '#e8f4e8' : 'white',
                            }}
                            onMouseOver={(e) => {
                              if (formData.id_cliente !== cliente.id) {
                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (formData.id_cliente !== cliente.id) {
                                e.currentTarget.style.backgroundColor = 'white';
                              }
                            }}
                          >
                            {cliente.descrizione || `Cliente ${cliente.id}`}
                          </div>
                        ))
                      }
                    </div>
                  )}
                  
                  <input 
                    type="hidden" 
                    name="id_cliente"
                    value={formData.id_cliente || ''}
                  />
                </div>
              ) : (
                // Per utenti con ruolo 3, mostra solo il proprio nome in modo non modificabile
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', color: '#6c757d' }}>
                  {clienti.find(c => c.id === formData.id_cliente)?.descrizione || 'Cliente'}
                </div>
              )}
              </div>
            )}
            
            {/* Riga: Tipologia Oliva + Linea di lavorazione */}
            <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
              {/* Tipologia Oliva */}
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Tipologia Oliva:</label>
                <select 
                  name="tipologia_oliva"
                  value={formData.tipologia_oliva}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                >
                  <option value={0}>Seleziona tipologia</option>
                  {tipologieOlive.map(oliva => (
                    <option key={oliva.id} value={oliva.id}>
                      {oliva.descrizione}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Linea di lavorazione */}
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Linea di lavorazione:</label>
                <select 
                  name="id_linea"
                  value={formData.id_linea}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                >
                  <option value={0}>Seleziona linea</option>
                  {linee.map(linea => {
                    // Check if this line is recommended for the selected olive type
                    const isRecommended = linea.id_oliva === formData.tipologia_oliva && formData.tipologia_oliva > 0;
                    
                    return (
                      <option 
                        key={linea.id} 
                        value={linea.id}
                        style={isRecommended ? {fontWeight: 'bold', backgroundColor: '#e8f4e8'} : {}}
                      >
                        {linea.descrizione} 
                        {isRecommended ? ' ✓' : ''} 
                        ({linea.cap_oraria} kg/h)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            
            {/* Riga: Quantità + Data/Ora inizio */}
            <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
              {/* Quantità */}
              <div style={{ flex: 0.8 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Quantità (kg):</label>
                <input 
                  type="number"
                  name="quantita_kg"
                  value={formData.quantita_kg}
                  onChange={handleChange}
                  min="1"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                />
              </div>
              
              {/* Data inizio */}
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Data inizio:</label>
                <input 
                  type="date"
                  name="data_inizio"
                  value={formData.data_inizio}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                />
              </div>
              
              {/* Ora inizio */}
              <div style={{ flex: 0.6 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Ora inizio:</label>
                <input 
                  type="time"
                  name="ora_inizio"
                  value={formData.ora_inizio}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                />
              </div>
            </div>
            
            {/* Riga: Data/Ora fine */}
            <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
              <div style={{ flex: 0.8 }}>
                <div style={{ height: '29px' }}></div> {/* Spazio vuoto per allineamento */}
              </div>
              
              {/* Data fine */}
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Data fine:</label>
                <input 
                  type="date"
                  name="data_fine"
                  value={formData.data_fine}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                />
              </div>
              
              {/* Ora fine */}
              <div style={{ flex: 0.6 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Ora fine:</label>
                <input 
                  type="time"
                  name="ora_fine"
                  value={formData.ora_fine}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                />
              </div>
            </div>
            
            {/* Riga: Dati di contatto */}
            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
              {/* Cellulare */}
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Cellulare (per notifiche WhatsApp):</label>
                <input 
                  type="tel"
                  name="cellulare"
                  value={formData.cellulare}
                  onChange={handleChange}
                  placeholder="es. 3331234567"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                />
              </div>
              
              {/* Email */}
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Email (per notifiche email):</label>
                <input 
                  type="email"
                  name="mail"
                  value={formData.mail}
                  onChange={handleChange}
                  placeholder="es. cliente@email.it"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                />
              </div>
            </div>
            
            {/* Opzioni di notifica (visibili solo quando stato = Confermato) */}
            {formData.stato === 'Confermato' && (
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Notifiche di conferma:</div>
                
                <div style={{ display: 'flex', gap: '20px' }} className="checkbox-inline">
                  {/* Notifica WhatsApp */}
                  <div style={{ display: 'flex', alignItems: 'center' }} className="checkbox-inline">
                    <input
                      type="checkbox"
                      id="whatsapp_notification"
                      checked={sendWhatsAppNotification}
                      onChange={(e) => setSendWhatsAppNotification(e.target.checked)}
                      style={{ marginRight: '6px' }}
                      disabled={!formData.cellulare}
                    />
                    <label htmlFor="whatsapp_notification">Invia notifica WhatsApp</label>
                  </div>
                  
                  {/* Notifica Email */}
                  <div style={{ display: 'flex', alignItems: 'center' }} className="checkbox-inline">
                    <input
                      type="checkbox"
                      id="email_notification"
                      checked={sendMailNotification}
                      onChange={(e) => setSendMailNotification(e.target.checked)}
                      style={{ marginRight: '6px' }}
                      disabled={!formData.mail}
                    />
                    <label htmlFor="email_notification">Invia notifica email</label>
                  </div>
                </div>
                
                {(!formData.cellulare && !formData.mail) && (
                  <div style={{ marginTop: '8px', color: '#856404', backgroundColor: '#fff3cd', padding: '5px 10px', borderRadius: '4px', fontSize: '0.9em' }}>
                    Inserisci un numero di cellulare o una email per attivare le notifiche
                  </div>
                )}
                
                {(!formData.cellulare && sendWhatsAppNotification) && (
                  <div style={{ marginTop: '8px', color: '#721c24', backgroundColor: '#f8d7da', padding: '5px 10px', borderRadius: '4px', fontSize: '0.9em' }}>
                    Inserisci un numero di cellulare per inviare notifiche WhatsApp
                  </div>
                )}
                
                {(!formData.mail && sendMailNotification) && (
                  <div style={{ marginTop: '8px', color: '#721c24', backgroundColor: '#f8d7da', padding: '5px 10px', borderRadius: '4px', fontSize: '0.9em' }}>
                    Inserisci un indirizzo email per inviare notifiche email
                  </div>
                )}
              </div>
            )}
            
            {/* Stato (solo per admin) */}
            {currentUser.ruolo === 2 && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Stato:</label>
                <select 
                  name="stato"
                  value={formData.stato}
                  onChange={(e) => {
                    handleChange(e);
                    // Se lo stato cambia e non è più "Confermato", resetta i checkbox
                    if (e.target.value !== 'Confermato') {
                      setSendMailNotification(false);
                      setSendWhatsAppNotification(false);
                    }
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                >
                  <option value="Provvisorio">Provvisorio</option>
                  <option value="Confermato">Confermato</option>
                  <option value="Modificato">Modificato</option>
                </select>
              </div>
            )}
            
            {/* Toggle per mostrare/nascondere le note */}
            <div style={{ marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4a86e8',
                  cursor: 'pointer',
                  padding: '5px 0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span style={{ marginRight: '5px' }}>
                  {showNotes ? '▼' : '►'}
                </span>
                {showNotes ? 'Nascondi note' : 'Mostra note'}
                {!showNotes && formData.note && <span style={{ marginLeft: '5px', fontStyle: 'italic', fontSize: '0.9em' }}>(presenti)</span>}
              </button>
            </div>
            
            {/* Note (visibili solo se showNotes è true) */}
            {showNotes && (
              <div style={{ marginBottom: '15px' }}>
                <textarea 
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Inserisci note aggiuntive qui..."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', minHeight: '60px' }}
                />
              </div>
            )}
            
            {/* Bottoni */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  // Reimposta il form e cancella i messaggi di errore
                  setShowForm(false);
                  setErrorMessage('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Annulla
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {selectedPrenotazione ? 'Aggiorna' : 'Salva'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Stili per migliorare la visualizzazione su mobile */}
      <style>{`
        @media screen and (max-width: 768px) {
          /* Migliora la toolbar del calendario */
          .rbc-toolbar {
            flex-direction: column;
            align-items: center;
          }
          
          .rbc-toolbar-label {
            margin: 8px 0;
            font-size: 1.2em; 
          }
          
          .rbc-btn-group {
            margin: 5px 0;
            width: 100%;
            justify-content: center;
          }
          
          .rbc-btn-group button {
            padding: 8px;
          }
          
          /* Migliora la visualizzazione della settimana */
          .rbc-time-header-content {
            min-width: auto;
          }
          
          .rbc-time-view .rbc-header {
            border-bottom: none;
          }
          
          .rbc-day-slot .rbc-time-slot {
            border-top: 1px solid #f1f1f1;
          }
          
          .rbc-header {
            padding: 5px 2px;
            font-size: 0.8em;
            white-space: pre-line;
            line-height: 1.1;
            height: auto;
            min-height: 64px; /* Aumentata altezza per testo più grande */
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            flex-direction: column;
            background-color: #f8f8f8;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            margin: 1px;
            border-radius: 4px;
          }
          
          /* Stile specifico per la visualizzazione settimana */
          .rbc-time-header-content .rbc-header {
            padding-top: 2px;
            padding-bottom: 2px;
          }
          
          .rbc-event {
            padding: 3px;
            font-size: 0.8em;
            border-radius: 3px;
            white-space: normal; /* Permette il testo di andare a capo */
            overflow: hidden;
          }
          
          .rbc-event-content {
            line-height: 1.2;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .rbc-row-segment {
            padding: 0 1px;
          }
          
          /* Ottimizza le dimensioni per visualizzazione settimana */
          .rbc-time-view {
            font-size: 0.85em;
          }
          
          .rbc-time-content > * + * > * {
            border-left: 0.5px solid #e0e0e0;
          }
          
          .rbc-date-cell {
            font-size: 0.85em;
            padding: 3px;
          }
          
          .rbc-toolbar button {
            font-size: 0.85em;
            padding: 6px 8px;
          }

          .rbc-time-slot {
            min-height: 20px; /* Ridotta leggermente l'altezza */
          }
          
          /* Migliora la leggibilità dell'intestazione delle ore */
          .rbc-time-gutter .rbc-timeslot-group {
            min-width: 65px; /* Aumentato ulteriormente lo spazio per le ore */
            width: 65px; /* Fissa la larghezza */
          }
          
          /* Dimensioni coerenti tra ore e giorni */
          .rbc-time-header-gutter {
            font-size: 1.3em; /* Uguale alla dimensione del giorno */
          }
          
          /* Migliora la visualizzazione delle ore */
          .rbc-time-gutter .rbc-label {
            text-align: center;
            color: #333;
            padding: 4px 5px;
            background-color: #f8f8f8;
            border-radius: 4px;
            margin: 2px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
          }
          
          /* Stile consistente con le intestazioni dei giorni */
          .rbc-time-header-gutter {
            background-color: #f9f9f9;
            font-weight: bold;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          /* Enfatizza le ore come il numero del giorno */
          .rbc-time-header-gutter .rbc-label,
          .rbc-time-gutter .rbc-timeslot-group .rbc-label {
            font-weight: 600;
          }
          
          .rbc-label {
            padding: 1px 2px;
            font-size: 1.3em; /* Uguale alla dimensione del giorno */
            word-break: keep-all;
            white-space: nowrap;
            font-weight: 600;
          }
          
          /* Stile per i singoli componenti dell'intestazione giorno */
          .rbc-header span {
            display: block;
            line-height: 1.1;
          }
          
          /* Stile per distinguere visivamente i componenti della data */
          .rbc-header span:nth-child(1) {
            font-weight: bold;
            font-size: 1.1em;
          }
          
          .rbc-header span:nth-child(2) {
            font-size: 1.3em;
            margin-top: 2px;
            font-weight: 600;
          }
          
          .rbc-header span:nth-child(3) {
            font-size: 1em;
            opacity: 0.8;
          }
          
          /* Assicura che i giorni abbiano spazio sufficiente */
          .rbc-time-header-content .rbc-col-header {
            width: auto !important;
          }
          
          /* Più spazio in alto per l'intestazione con 3 righe */
          .rbc-time-view {
            padding-top: 5px;
          }
          
          /* Evidenzia l'ora corrente */
          .rbc-current-time-indicator {
            height: 2px;
            background-color: #e53935;
            opacity: 0.8;
            z-index: 10;
            box-shadow: 0 0 2px rgba(229, 57, 53, 0.5);
          }
          
          /* Riduce l'interlinea degli eventi per risparmiare spazio */
          .rbc-event-label {
            font-size: 0.75em;
            padding-right: 1px;
            padding-bottom: 0;
          }
          
          /* Diminuisci leggermente lo spessore delle linee della griglia */
          .rbc-time-content .rbc-today {
            background-color: rgba(245, 245, 245, 0.7);
          }
          
          /* Stile Today specifico per intestazione */
          .rbc-time-header .rbc-today {
            background-color: rgba(74, 143, 41, 0.15);
          }
          
          .rbc-time-gutter .rbc-time-slot {
            font-size: 0.8em;
          }
          
          .rbc-current-time-indicator {
            height: 2px;
          }
          
          /* Ottimizza il form di prenotazione */
          .prenotazione-form {
            max-width: 100% !important;
            padding: 10px !important;
          }
          
          /* Stile per la selezione cliente */
          .form-overlay {
            padding: 10px !important;
            width: 95% !important;
            max-width: 95% !important;
            margin: 0 auto;
            top: 5% !important;
            left: 2.5% !important;
            transform: none !important;
            height: 90% !important;
          }
          
          /* Rendi il form più compatto su mobile */
          .responsive-form > div {
            margin-bottom: 10px;
          }
          
          /* Stile per le righe di form */
          .responsive-form [style*="display: flex"]:not(.checkbox-inline) {
            flex-direction: column !important;
            gap: 10px !important;
          }
          
          /* Mantieni la checkbox e la label sulla stessa riga */
          .checkbox-inline {
            flex-direction: row !important;
            gap: 5px !important;
          }
          
          /* Stile per i gruppi nel form */
          .responsive-form [style*="flex: 1"] {
            width: 100% !important;
            flex: none !important;
          }
          
          /* Migliora il dropdown del cliente */
          [style*="position: absolute"] {
            max-height: 180px !important;
            width: 100% !important;
            z-index: 1000 !important;
          }
          
          /* Migliora i layout con display flex */
          [style*="display: flex"] {
            flex-wrap: wrap;
          }
          
          /* Ottimizza i pulsanti nel form */
          [style*="justify-content: flex-end"] {
            justify-content: space-between !important;
          }
          
          /* Migliora il messaggio di errore */
          [style*="color: red"] {
            width: 100%;
            word-break: break-word;
          }
          
          /* Rendi i campi select a piena larghezza */
          select {
            width: 100% !important;
          }
        }
      /* Stile per i pulsanti dell'header su mobile */
          .header-controls {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          
          .header-buttons {
            display: flex;
            flex-wrap: nowrap;
            gap: 8px;
          }
          
          .header-button {
            flex: 1;
            min-width: 80px;
            max-width: none;
            justify-content: center;
            white-space: nowrap;
            font-size: 0.85rem !important;
            padding: 7px 10px !important;
          }
          
          /* Su mobile, visualizzazione compatta */
          @media screen and (max-width: 768px) {
            .header-controls {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .header-buttons {
              width: 100%;
              margin-top: 8px;
              justify-content: space-between;
            }
            
            .header-button {
              flex: 1;
              padding: 8px 12px !important;
            }
            
            .button-text {
              display: none;
            }
            
            .header-button i {
              margin-right: 0 !important;
              font-size: 1.1rem;
            }
          }
      `}</style>
      
      {/* Header con bottoni */}
      <div className="header-controls">
        <h2>Prenotazione Moliture</h2>
        <div className="header-buttons">
          <Link 
            to={`/company/${companyCode}/operations/prenotazioni-viewer`}
            className="header-button"
            style={{
              backgroundColor: '#4a86e8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fas fa-list-alt" style={{ marginRight: '8px' }}></i>
            <span className="button-text">Visualizza Prenotazioni</span>
          </Link>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="header-button"
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
            <span className="button-text">Torna alla Dashboard</span>
          </button>
          
          <button 
            onClick={() => {
              setSelectedPrenotazione(null);
              setClienteFilter('');
              console.log("Creating new booking from button, user role:", currentUser.ruolo);
              // For role 3 (client), auto-fill their info
              if (currentUser.ruolo === 3) {
                // Find the client data in the clienti array
                const clienteData = clienti.find(c => c.id === currentUser.id);
                const defaultOliveType = clienteData?.olivedef || 0;
                
                // Set the initial form data first without the production line
                setFormData({
                  id_cliente: currentUser.id,
                  // Use client's default olive type if available
                  tipologia_oliva: defaultOliveType,
                  id_linea: 0, // Will be set asynchronously
                  quantita_kg: 0,
                  data_inizio: moment().format('YYYY-MM-DD'),
                  ora_inizio: '08:00',
                  data_fine: moment().add(1, 'hour').format('YYYY-MM-DD'),
                  ora_fine: '09:00',
                  stato: 'Confermato',
                  note: '',
                  cellulare: clienteData?.telefono || '',
                  mail: clienteData?.mail || '',
                  flagcproprio: false
                });
                
                // Find a compatible production line for this olive type (async)
                if (defaultOliveType > 0) {
                  (async () => {
                    try {
                      const compatibleLine = await findCompatibleLine(defaultOliveType);
                      if (compatibleLine) {
                        setFormData(prev => ({
                          ...prev,
                          id_linea: compatibleLine.id
                        }));
                        console.log(`Auto-selezionata linea ${compatibleLine.descrizione} per cliente`);
                      }
                    } catch (error) {
                      console.error("Errore nel trovare linea compatibile:", error);
                    }
                  })();
                }
              } else {
                // For role 2 (admin/operator)
                setFormData({
                  id_cliente: 0,
                  tipologia_oliva: 0,
                  id_linea: 0,
                  quantita_kg: 0,
                  data_inizio: moment().format('YYYY-MM-DD'),
                  ora_inizio: '08:00',
                  data_fine: moment().format('YYYY-MM-DD'),
                  ora_fine: '09:00',
                  stato: 'Confermato',
                  note: '',
                  cellulare: '',
                  mail: '',
                  flagcproprio: false
                });
              }
              // Assicuriamoci che non ci siano messaggi di errore da sessioni precedenti
              setErrorMessage('');
              setShowForm(true);
            }}
            className="header-button"
            style={{
              backgroundColor: '#4a86e8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
            <span className="button-text">Nuova Prenotazione</span>
          </button>
        </div>
      </div>
      
      {/* Calendario */}
      <div style={{ height: 'calc(100% - 70px)' }}>
        <Calendar
          localizer={localizer}
          events={eventiCalendario}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day', 'agenda']}
          step={30}
          showMultiDayTimes
          messages={messages}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={getEventStyle}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          formats={{
            timeGutterFormat: (date: Date) => moment(date).format('HH'), // Solo ora senza minuti per maggiore leggibilità
            dayFormat: (date: Date) => `${moment(date).format('ddd')}\n${moment(date).format('DD')}\n${moment(date).format('MM')}`, // Es: Lun\n20\n04
            eventTimeRangeFormat: ({ start, end }: { start: Date, end: Date }) => 
              `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`, // Formato 24 ore per eventi
            weekdayFormat: (date: Date) => moment(date).format('ddd'), // Nome del giorno abbreviato (Lun, Mar, ecc.)
            dayHeaderFormat: (date: Date) => moment(date).format('dddd D'), // Nomi giorni completi (Lunedì, Martedì, ecc.)
            dayRangeHeaderFormat: ({ start, end }: { start: Date, end: Date }) =>
              `${moment(start).format('D')} - ${moment(end).format('D MMMM YYYY')}`,
            monthHeaderFormat: (date: Date) => moment(date).format('MMMM YYYY'), // Nome mese completo in italiano
            agendaHeaderFormat: ({ start, end }: { start: Date, end: Date }) =>
              `${moment(start).format('D MMMM')} - ${moment(end).format('D MMMM YYYY')}`
          }}
          min={new Date(0, 0, 0, 0, 0)} // 00:00
          max={new Date(0, 0, 0, 23, 59)} // 23:59
        />
      </div>
    </div>
  );
};

export default PrenotazioneMoliture;
