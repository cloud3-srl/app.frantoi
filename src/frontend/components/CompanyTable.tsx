import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OliveLineeManager from './admin/OliveLineeManager';

interface CompanyTableProps {
  tableName: string;
  companyId: number;
  companyCode: string;
  onBack: () => void;
}

interface Field {
  name: string;
  label: string;
  type: string;
  maxLength?: number;
  reference?: {
    table: string;
    valueField: string;
    labelField: string;
  };
  options?: {
    value: string;
    label: string;
  }[];
  description?: string;
}

const CompanyTable: React.FC<CompanyTableProps> = ({ tableName, companyId, companyCode, onBack }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [newRecord, setNewRecord] = useState<any>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [referenceData, setReferenceData] = useState<Record<string, any[]>>({});
  const editFormRef = React.useRef<HTMLDivElement>(null);
  
  // Definizione dei campi per ciascuna tabella
  const getFieldsForTable = (): Field[] => {
    switch(tableName) {
      case 'cisterne':
        return [
          { name: 'id', label: 'ID Cisterna', type: 'text', maxLength: 20 },
          { name: 'descrizione', label: 'Descrizione *', type: 'text', maxLength: 40 },
          { name: 'id_magazzino', label: 'Magazzino', type: 'select', reference: { table: `${companyCode}_magazzini`, valueField: 'id', labelField: 'descrizione' } },
          { name: 'capacita', label: 'Capacità Massima', type: 'number' },
          { name: 'giacenza', label: 'Giacenza', type: 'number' },
          { name: 'id_articolo', label: 'Articolo', type: 'select', reference: { table: 'articoli', valueField: 'id', labelField: 'descrizione' } },
          { name: 'id_codicesoggetto', label: 'Soggetto', type: 'select', reference: { table: `${companyCode}_soggetti`, valueField: 'id', labelField: 'descrizione' } },
          { name: 'flagObso', label: 'Obsoleta', type: 'checkbox' }
        ];
      case 'linee':
        return [
          { name: 'descrizione', label: 'Descrizione *', type: 'text', maxLength: 20, description: 'Nome della linea di lavorazione' },
          { name: 'cap_oraria', label: 'Capacità Oraria (kg/h)', type: 'number', description: 'Quantità di olive lavorabili in un\'ora' },
          { name: 'id_magazzino', label: 'Magazzino Predef.', type: 'select', reference: { table: `${companyCode}_magazzini`, valueField: 'id', labelField: 'descrizione' }, description: 'Magazzino predefinito per questa linea' },
          { name: 'id_oliva', label: 'Tipo Oliva Predef.', type: 'select', reference: { table: 'articoli', valueField: 'id', labelField: 'descrizione' }, description: 'Tipo di oliva predefinito per questa linea' },
          { name: 'colore', label: 'Colore', type: 'color', description: 'Colore per identificare la linea nel calendario' }
        ];
      case 'magazzini':
        return [
          { name: 'descrizione', label: 'Descrizione', type: 'text', maxLength: 20 },
          { name: 'cod_sian', label: 'Codice SIAN', type: 'number' }
        ];
      case 'soggetti':
        return [
          { name: 'descrizione', label: 'Ragione Sociale *', type: 'text', maxLength: 40, description: 'Nome o ragione sociale del cliente/fornitore' },
          
          // Sezione Anagrafica e Fiscale
          { name: '__section_anagrafica', label: 'Dati Anagrafici e Fiscali', type: 'section' },
          { name: 'codfisc', label: 'Codice Fiscale', type: 'text', maxLength: 16, description: 'Codice fiscale della persona o azienda' },
          { name: 'partiva', label: 'Partita IVA', type: 'text', maxLength: 12, description: 'Partita IVA dell\'azienda' },
          { name: 'id_sian', label: 'ID SIAN', type: 'number', description: 'Identificativo nel sistema SIAN' },
          { name: 'flagForn', label: 'È Fornitore', type: 'checkbox', description: 'Indica se il soggetto è un fornitore' },
          { name: 'flagdoc', label: 'Conferisce con DDT', type: 'checkbox', description: 'Indica se il soggetto conferisce olive con documento di trasporto' },
          
          // Sezione Contatti
          { name: '__section_contatti', label: 'Contatti', type: 'section' },
          { name: 'telefono', label: 'Telefono', type: 'text', maxLength: 20 },
          { name: 'cellulare', label: 'Cellulare', type: 'text', maxLength: 20 },
          { name: 'mail', label: 'Email', type: 'email', maxLength: 60 },
          
          // Sezione Indirizzo
          { name: '__section_indirizzo', label: 'Indirizzo', type: 'section' },
          { name: 'indirizzo', label: 'Via/Piazza', type: 'text', maxLength: 60 },
          { name: 'cap', label: 'CAP', type: 'text', maxLength: 8 },
          { name: 'comune', label: 'Comune', type: 'select', reference: { table: 'comuni', valueField: 'id', labelField: 'descrizione' } },
          { name: 'provincia', label: 'Provincia', type: 'select', reference: { table: 'province', valueField: 'id', labelField: 'descrizione' } },
          { name: 'nazione', label: 'Nazione', type: 'select', reference: { table: 'nazioni', valueField: 'id', labelField: 'descrizione' } },
          
          // Sezione Oliva
          { name: '__section_oliva', label: 'Conferimenti Olive', type: 'section' },
          { 
            name: 'olivedef', 
            label: 'Tipo Oliva Predefinito', 
            type: 'select', 
            reference: { 
              table: 'articoli', 
              valueField: 'id', 
              labelField: 'descrizione' 
            },
            description: 'Tipo di oliva predefinito per i conferimenti di questo cliente'
          }
        ];
      case 'terreni':
        return [
          { name: 'cod_cli', label: 'Proprietario', type: 'select', reference: { table: `${companyCode}_soggetti`, valueField: 'id', labelField: 'descrizione' } },
          { name: 'annata', label: 'Annata', type: 'text', maxLength: 5 },
          { name: 'orig_spec', label: 'Origine Specifica', type: 'select', reference: { table: 'origini_specifiche', valueField: 'id', labelField: 'descrizione' } },
          { name: 'cod_catastale', label: 'Codice Catastale', type: 'text', maxLength: 10 },
          { name: 'metriq', label: 'Metri Quadri', type: 'number' },
          { name: 'ettari', label: 'Ettari', type: 'number' },
          { name: 'qtamaxq', label: 'Quantità Max', type: 'number' },
          { name: 'num_alberi', label: 'Numero Alberi', type: 'number' }
        ];
      case 'articoli':
        return [
          { 
            name: 'tipologia', 
            label: 'Tipologia', 
            type: 'select', 
            options: [
              { value: 'SF', label: 'Olio Sfuso' },
              { value: 'OL', label: 'Olive' }
            ]
          },
          { name: 'descrizione', label: 'Descrizione', type: 'text', maxLength: 60 },
          { name: 'categ_olio', label: 'Categoria Olio', type: 'select', reference: { table: 'categorie_olio', valueField: 'id', labelField: 'descrizione' } },
          { name: 'macroarea', label: 'Macroarea', type: 'select', reference: { table: 'macroaree', valueField: 'id', labelField: 'descrizione' } },
          { 
            name: 'origispeci', 
            label: 'Origine Specifica', 
            type: 'multiselect', 
            reference: { table: 'origini_specifiche', valueField: 'id', labelField: 'descrizione' },
            description: 'Seleziona una o più origini specifiche' 
          },
          { name: 'flag_ps', label: 'PS', type: 'checkbox' },
          { name: 'flag_ef', label: 'EF', type: 'checkbox' },
          { name: 'flag_bio', label: 'Biologico', type: 'checkbox' },
          { name: 'flag_conv', label: 'In Conversione', type: 'checkbox' },
          { name: 'cod_iva', label: 'Codice IVA', type: 'select', reference: { table: 'codici_iva', valueField: 'id', labelField: 'percen' } },
          { name: 'varieta', label: 'Varietà', type: 'text', maxLength: 40 },
          { name: 'flag_in_uso', label: 'In Uso', type: 'checkbox' },
          { name: 'unita_misura', label: 'Unità Misura', type: 'text', maxLength: 3 }
        ];
      case 'movimenti':
        return [
          { name: 'nome_file', label: 'Nome File', type: 'text', maxLength: 50 }
          // Nota: movimenti avrà un'implementazione speciale che visualizzerà solo i dati
          // e reindirizzerà a un altro componente per la gestione completa
        ];
      case 'listini':
        return [
          { name: 'descrizione', label: 'Descrizione', type: 'text', maxLength: 40, description: 'Nome del listino prezzi' },
          { name: 'anno', label: 'Anno', type: 'text', maxLength: 4, description: 'Anno di riferimento (formato AAAA)' },
          { name: 'data_inizio', label: 'Data Inizio', type: 'date', description: 'Data di inizio validità' },
          { name: 'data_fine', label: 'Data Fine', type: 'date', description: 'Data di fine validità' },
          { name: 'cod_articolo', label: 'Articolo', type: 'select', reference: { table: 'articoli', valueField: 'id', labelField: 'descrizione' }, description: 'Articolo a cui si riferisce il prezzo' },
          { name: 'qta_da', label: 'Quantità Da', type: 'number', description: 'Quantità minima per applicare questo prezzo' },
          { name: 'qta_a', label: 'Quantità A', type: 'number', description: 'Quantità massima per applicare questo prezzo' },
          { name: 'prezzo', label: 'Prezzo', type: 'number', description: 'Prezzo unitario' },
          { name: 'um', label: 'Unità Misura', type: 'select', options: [
            { value: 'KG', label: 'Kilogrammi (KG)' },
            { value: 'LT', label: 'Litri (LT)' },
            { value: 'QT', label: 'Quintali (QT)' },
            { value: 'PZ', label: 'Pezzi (PZ)' }
          ], description: 'Unità di misura del prezzo' },
          { name: 'cod_iva', label: 'Codice IVA', type: 'select', reference: { table: 'codici_iva', valueField: 'id', labelField: 'percen' }, description: 'Aliquota IVA applicabile' },
          { name: 'note', label: 'Note', type: 'text', maxLength: 100, description: 'Note aggiuntive sul listino' },
          // Usiamo il nome esatto come appare nel database con le virgolette
          { name: '"flagAttivo"', label: 'Attivo', type: 'checkbox', description: 'Indica se il listino è attualmente attivo' }
        ];
      default:
        return [];
    }
  };
  
  const fields = getFieldsForTable();
  
  // Carica i dati di riferimento per i campi select e multiselect
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const referenceTables = fields
          .filter(field => (field.type === 'select' || field.type === 'multiselect') && field.reference)
          .map(field => field.reference?.table);
        
        const uniqueTables = [...new Set(referenceTables)];
        
        const referenceDataObj: Record<string, any[]> = {};
        
        for (const table of uniqueTables) {
          if (!table) continue;
          
          // Per le tabelle aziendali, usa l'API per tabelle aziendali
          let endpoint = `/api/tables/${table}`;
          if (table.startsWith(`${companyCode}_`)) {
            endpoint = `/api/company/${companyId}/tables/${table.replace(`${companyCode}_`, '')}`;
          }
          
          console.log(`Caricamento tabella di riferimento: ${table} da ${endpoint}`);
          
          const response = await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.data.success) {
            referenceDataObj[table] = response.data.data;
            console.log(`Dati caricati per ${table}:`, response.data.data);
          }
        }
        
        setReferenceData(referenceDataObj);
      } catch (error) {
        console.error('Errore nel caricamento dei dati di riferimento:', error);
      }
    };
    
    if (fields.some(field => field.type === 'select' || field.type === 'multiselect')) {
      loadReferenceData();
    }
  }, [fields, companyId, companyCode]);
  
  // Caricamento dati iniziale
  useEffect(() => {
    // Se è la tabella olive_linee, non facciamo il fetchData standard
    if (tableName !== 'olive_linee') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [tableName, companyId]);
  
  // Funzione per recuperare i dati
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/company/${companyId}/tables/${tableName}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setRecords(response.data.data);
        setFilteredRecords(response.data.data);
      } else {
        setError(response.data.message || 'Errore nel recupero dei dati');
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error(`Errore nel caricamento della tabella ${tableName}:`, err);
      setError(err.response?.data?.message || `Errore nel caricamento della tabella ${tableName}`);
      setLoading(false);
    }
  };
  
  // Filtra i record in base al termine di ricerca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecords(records);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = records.filter(record => {
      // Cerca in tutti i campi del record
      return Object.keys(record).some(key => {
        const value = record[key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTermLower);
      });
    });
    
    setFilteredRecords(filtered);
  }, [searchTerm, records]);
  
  // Scroll al form di modifica quando viene aperto
  useEffect(() => {
    if (editingRecord && editFormRef.current) {
      setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [editingRecord]);
  
  // Gestione della creazione di un nuovo record
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Aggiungiamo i campi obbligatori mancanti specifici per la tabella articoli
      let dataToSend = {...newRecord};
      
      if (tableName === 'articoli') {
        // Unità misura è obbligatoria per articoli
        if (!dataToSend.unita_misura) {
          dataToSend.unita_misura = dataToSend.tipologia === 'SF' ? 'KG' : 'QT';
        }
        
        // Origispeci potrebbe essere null ma è definito come CHAR(20) nel DB
        if (dataToSend.origispeci === null || dataToSend.origispeci === undefined) {
          dataToSend.origispeci = '';
        }
        
        // Se non è definita la tipologia, impostiamo un valore predefinito
        if (dataToSend.tipologia === null || dataToSend.tipologia === undefined) {
          dataToSend.tipologia = 'OL'; // Valore predefinito: Olive
        }
        
        // Imposta i flag booleani a false se non definiti
        ['flag_ps', 'flag_ef', 'flag_bio', 'flag_conv', 'flag_in_uso'].forEach(flag => {
          if (dataToSend[flag] === null || dataToSend[flag] === undefined) {
            dataToSend[flag] = false;
          }
        });
        
        console.log('Dati articolo da inviare:', dataToSend);
      }
      
      const response = await axios.post(`/api/company/${companyId}/tables/${tableName}`, dataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Aggiorna la lista dei record
        await fetchData();
        
        // Reset del form
        setNewRecord({});
        setShowNewForm(false);
        setError(null);
      } else {
        setError(response.data.message || 'Errore nella creazione del record');
      }
    } catch (err: any) {
      console.error(`Errore nella creazione del record in ${tableName}:`, err);
      
      // Mostra più dettagli sull'errore
      if (err.response?.data?.error) {
        console.error('Dettagli errore:', err.response.data.error);
        setError(`Errore: ${err.response.data.error}`);
      } else {
        setError(err.response?.data?.message || `Errore nella creazione del record`);
      }
    }
  };
  
  // Gestione dell'aggiornamento di un record
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    try {
      // Aggiungiamo i campi obbligatori mancanti specifici per la tabella articoli
      let dataToSend = {...editingRecord};
      
      if (tableName === 'articoli') {
        // Unità misura è obbligatoria per articoli
        if (!dataToSend.unita_misura) {
          dataToSend.unita_misura = dataToSend.tipologia === 'SF' ? 'KG' : 'QT';
        }
        
        // Origispeci potrebbe essere null ma è definito come CHAR(20) nel DB
        if (dataToSend.origispeci === null || dataToSend.origispeci === undefined) {
          dataToSend.origispeci = '';
        }
        
        // Se non è definita la tipologia, impostiamo un valore predefinito
        if (dataToSend.tipologia === null || dataToSend.tipologia === undefined) {
          dataToSend.tipologia = 'OL'; // Valore predefinito: Olive
        }
        
        // Imposta i flag booleani a false se non definiti
        ['flag_ps', 'flag_ef', 'flag_bio', 'flag_conv', 'flag_in_uso'].forEach(flag => {
          if (dataToSend[flag] === null || dataToSend[flag] === undefined) {
            dataToSend[flag] = false;
          }
        });
        
        console.log('Dati articolo da aggiornare:', dataToSend);
      }
      
      const response = await axios.put(`/api/company/${companyId}/tables/${tableName}/${dataToSend.id}`, dataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Aggiorna la lista dei record
        await fetchData();
        
        // Reset del form di modifica
        setEditingRecord(null);
        setError(null);
      } else {
        setError(response.data.message || 'Errore nell\'aggiornamento del record');
      }
    } catch (err: any) {
      console.error(`Errore nell'aggiornamento del record in ${tableName}:`, err);
      
      // Mostra più dettagli sull'errore
      if (err.response?.data?.error) {
        console.error('Dettagli errore:', err.response.data.error);
        setError(`Errore: ${err.response.data.error}`);
      } else {
        setError(err.response?.data?.message || `Errore nell'aggiornamento del record`);
      }
    }
  };
  
  // Gestione dell'eliminazione di un record
  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo record?')) return;
    
    try {
      const response = await axios.delete(`/api/company/${companyId}/tables/${tableName}/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Aggiorna la lista dei record
        await fetchData();
        setError(null);
      } else {
        setError(response.data.message || 'Errore nell\'eliminazione del record');
      }
    } catch (err: any) {
      console.error(`Errore nell'eliminazione del record da ${tableName}:`, err);
      setError(err.response?.data?.message || `Errore nell'eliminazione del record`);
    }
  };
  
  // Gestione dell'input nei form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, isNew: boolean = false) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    let inputValue: any = value;
    
    // Gestione di diversi tipi di input
    if (type === 'checkbox') {
      inputValue = checked;
    } else if (type === 'number') {
      inputValue = value ? parseFloat(value) : null;
    } else if (name === 'comune' || name === 'provincia' || name === 'nazione' || 
               name === 'cod_cli' || name === 'orig_spec' || name === 'categ_olio' || 
               name === 'macroarea' || name === 'cod_iva') {
      // Campi select che si riferiscono a tabelle esterne - converti in numeri
      inputValue = value ? parseInt(value) : null;
      
      // Se è stato modificato il campo macroarea, controlla il flag_orig e resetta origispeci se necessario
      if (name === 'macroarea' && tableName === 'articoli') {
        // Cerca la macroarea selezionata nei dati di riferimento
        const macroaree = referenceData['macroaree'] || [];
        const selectedMacroarea = macroaree.find((m: any) => m.id === parseInt(value));
        
        // Se la macroarea ha flag_orig = false, resetta il campo origispeci
        if (selectedMacroarea && !selectedMacroarea.flag_orig) {
          if (isNew) {
            setNewRecord((prev: any) => ({
              ...prev,
              origispeci: null
            }));
          } else {
            setEditingRecord((prev: any) => ({
              ...prev!,
              origispeci: null
            }));
          }
        }
      }
    }
    
    // Registra il nuovo valore nell'oggetto di stato appropriato
    if (isNew) {
      setNewRecord((prev: any) => ({
        ...prev,
        [name]: inputValue
      }));
    } else {
      setEditingRecord((prev: any) => ({
        ...prev!,
        [name]: inputValue
      }));
    }
    
    // Log per debug solo per cod_iva
    if (name === 'cod_iva') {
      console.log(`Codice IVA selezionato: ${value} (${typeof value}), convertito in: ${inputValue} (${typeof inputValue})`);
    }
  };
  
  // Gestione degli input di tipo multiselect
  const handleMultiselectChange = (name: string, selectedValues: string[], isNew: boolean = false) => {
    // Converti i valori in numeri e poi in stringa separata da virgole
    const numericValues = selectedValues.map(v => parseInt(v));
    const stringValue = numericValues.join(',');
    
    if (isNew) {
      setNewRecord((prev: any) => ({
        ...prev,
        [name]: stringValue
      }));
    } else {
      setEditingRecord((prev: any) => ({
        ...prev!,
        [name]: stringValue
      }));
    }
  };
  
  // Funzione per renderizzare il valore di un riferimento a un'altra tabella
  const renderReferenceValue = (tableName: string, value: any) => {
    if (!value) return '';
    
    const options = referenceData[tableName] || [];
    const selected = options.find((option: any) => option.id === value);
    
    return selected ? selected.descrizione : '';
  };
  
  // Funzione per renderizzare il valore di un riferimento a un'altra tabella con il flag bio
  const renderReferenceValueWithBio = (tableName: string, value: any) => {
    if (!value) return '';
    
    const options = referenceData[tableName] || [];
    const selected = options.find((option: any) => option.id === value);
    
    if (!selected) return '';
    
    // Aggiunge il badge BIO se flag_bio è true
    const isBio = selected.flag_bio;
    return (
      <>
        {selected.descrizione}
        {isBio && <span className="badge badge-biologico badge-small">BIO</span>}
      </>
    );
  };
  
  // Rendering del form di modifica
  const renderEditForm = () => {
    if (!editingRecord) return null;
    
    return (
      <div className="edit-form" ref={editFormRef}>
        <h3>Modifica Record</h3>
        <form onSubmit={handleUpdate}>
          {tableName === 'soggetti' ? (
            // Rendering con sezioni per la tabella soggetti
            <>
              <div className="form-group" key="descrizione">
                <label htmlFor="edit-descrizione">Ragione Sociale *</label>
                {renderFormField(fields.find(f => f.name === 'descrizione')!, editingRecord['descrizione'], false)}
              </div>

              {fields
                .filter(field => field.type === 'section')
                .map(section => {
                  // Trova i campi che appartengono alla sezione corrente
                  const sectionFields = [];
                  let foundSection = false;
                  
                  for (const field of fields) {
                    if (field.type === 'section') {
                      if (field.name === section.name) {
                        foundSection = true;
                      } else if (foundSection) {
                        break;
                      }
                      continue;
                    }
                    
                    if (foundSection && field.name !== 'descrizione') {
                      sectionFields.push(field);
                    }
                  }
                  
                  return (
                    <div className="field-section" key={section.name}>
                      <div className="field-section-title">
                        <i className={`fas fa-${
                          section.name === '__section_anagrafica' ? 'address-card' : 
                          section.name === '__section_contatti' ? 'phone-alt' :
                          section.name === '__section_indirizzo' ? 'map-marker-alt' :
                          section.name === '__section_oliva' ? 'leaf' : 'info-circle'
                        }`}></i>
                        {section.label}
                      </div>
                      <div className="field-section-content">
                        {sectionFields.map(field => (
                          <div className="form-group" key={field.name}>
                            <label htmlFor={`edit-${field.name}`}>{field.label}</label>
                            {renderFormField(field, editingRecord[field.name], false)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              }
            </>
          ) : (
            // Rendering standard per altre tabelle
            fields.map(field => {
              // Non mostrare l'ID nei form di modifica se è una chiave primaria autogenerata
              if (field.name === 'id' && tableName !== 'cisterne') return null;
              if (field.type === 'section') return null;
              
              return (
                <div className="form-group" key={field.name}>
                  <label htmlFor={`edit-${field.name}`}>{field.label}</label>
                  {renderFormField(field, editingRecord[field.name], false)}
                </div>
              );
            })
          )}
          
          <div className="form-actions">
            <button type="submit" className="primary-button">Salva</button>
            <button type="button" className="btn-secondary" onClick={() => setEditingRecord(null)}>Annulla</button>
          </div>
        </form>
      </div>
    );
  };
  
  // Rendering del form per nuovo record
  const renderNewForm = () => {
    if (!showNewForm) return null;
    
    return (
      <div className="new-form">
        <h3>Nuovo Record</h3>
        <form onSubmit={handleCreate}>
          {tableName === 'soggetti' ? (
            // Rendering con sezioni per la tabella soggetti
            <>
              <div className="form-group" key="descrizione">
                <label htmlFor="new-descrizione">Ragione Sociale *</label>
                {renderFormField(fields.find(f => f.name === 'descrizione')!, newRecord['descrizione'], true)}
              </div>

              {fields
                .filter(field => field.type === 'section')
                .map(section => {
                  // Trova i campi che appartengono alla sezione corrente
                  const sectionFields = [];
                  let foundSection = false;
                  
                  for (const field of fields) {
                    if (field.type === 'section') {
                      if (field.name === section.name) {
                        foundSection = true;
                      } else if (foundSection) {
                        break;
                      }
                      continue;
                    }
                    
                    if (foundSection && field.name !== 'descrizione') {
                      sectionFields.push(field);
                    }
                  }
                  
                  return (
                    <div className="field-section" key={section.name}>
                      <div className="field-section-title">
                        <i className={`fas fa-${
                          section.name === '__section_anagrafica' ? 'address-card' : 
                          section.name === '__section_contatti' ? 'phone-alt' :
                          section.name === '__section_indirizzo' ? 'map-marker-alt' :
                          section.name === '__section_oliva' ? 'leaf' : 'info-circle'
                        }`}></i>
                        {section.label}
                      </div>
                      <div className="field-section-content">
                        {sectionFields.map(field => (
                          <div className="form-group" key={field.name}>
                            <label htmlFor={`new-${field.name}`}>{field.label}</label>
                            {renderFormField(field, newRecord[field.name], true)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              }
            </>
          ) : (
            // Rendering standard per altre tabelle
            fields.map(field => {
              // Per le cisterne, mostra anche l'ID nel form di creazione perché è la chiave primaria
              // Per le altre tabelle, nascondi l'ID perché è autogenerato
              if (field.name === 'id' && tableName !== 'cisterne') return null;
              if (field.type === 'section') return null;
              
              return (
                <div className="form-group" key={field.name}>
                  <label htmlFor={`new-${field.name}`}>{field.label}</label>
                  {renderFormField(field, newRecord[field.name], true)}
                </div>
              );
            })
          )}
          
          <div className="form-actions">
            <button type="submit" className="primary-button">Crea</button>
            <button type="button" className="btn-secondary" onClick={() => setShowNewForm(false)}>Annulla</button>
          </div>
        </form>
      </div>
    );
  };
  
  // Funzione helper per renderizzare il campo del form in base al tipo
  const renderFormField = (field: Field, value: any, isNew: boolean) => {
    const id = `${isNew ? 'new' : 'edit'}-${field.name}`;
    
    // Per campi di tipo section, restituisci null (sono gestiti esternamente)
    if (field.type === 'section') return null;
    
    // Flag per campi obbligatori
    const isRequired = field.name === 'descrizione';
    
    // Per i campi di tipo colore
    if (field.type === 'color') {
      return (
        <div>
          <input
            type="color"
            id={id}
            name={field.name}
            value={value || '#3788d8'} // Colore predefinito blu
            onChange={(e) => handleInputChange(e, isNew)}
            style={{ width: '100%', height: '38px', padding: '2px', cursor: 'pointer' }}
          />
          {field.description && <div className="field-description">{field.description}</div>}
        </div>
      );
    }
    
    // Per i campi select con opzioni predefinite
    if (field.type === 'select' && field.options) {
      return (
        <div>
          <select
            id={id}
            name={field.name}
            value={value || ''}
            onChange={(e) => handleInputChange(e, isNew)}
            required={field.name === 'id' && tableName === 'cisterne'}
          >
            <option value="">Seleziona...</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.description && <div className="field-description">{field.description}</div>}
        </div>
      );
    }
    
    // Per i campi select che si riferiscono a tabelle esterne
    if (field.type === 'select' && field.reference) {
      let options = referenceData[field.reference.table] || [];
      
      // Filtra le opzioni per il campo olivedef per mostrare solo articoli di tipo 'OL'
      if (field.name === 'olivedef' && tableName === 'soggetti') {
        options = options.filter((option: any) => option.tipologia === 'OL');
      }
      
      return (
        <div>
          <select
            id={id}
            name={field.name}
            value={value || ''}
            onChange={(e) => handleInputChange(e, isNew)}
            required={field.name === 'id' && tableName === 'cisterne'} // L'ID delle cisterne è obbligatorio
          >
            <option value="">Seleziona...</option>
            {options.map((option: any) => {
              // Per IVA visualizza la percentuale con il simbolo %
              let displayLabel = field.name === 'cod_iva' 
                ? `${option[field.reference!.labelField]}%` 
                : option[field.reference!.labelField];
                
              // Per olivedef, mostra anche se è biologico
              if (field.name === 'olivedef' && option.flag_bio) {
                displayLabel = `${displayLabel} (BIO)`;
              }
              
              return (
                <option 
                  key={option[field.reference!.valueField]} 
                  value={option[field.reference!.valueField]}
                >
                  {displayLabel}
                </option>
              );
            })}
          </select>
          {field.description && <div className="field-description">{field.description}</div>}
        </div>
      );
    }
    
    // Per i campi multiselect
    if (field.type === 'multiselect' && field.reference) {
      const options = referenceData[field.reference.table] || [];
      const selectedValues = value ? value.split(',').map((v: string) => parseInt(v.trim())) : [];
      
      // Per il campo origispeci in articoli, verificare se la macroarea selezionata ha flag_orig=true
      let isDisabled = false;
      let disabledMessage = "";
      
      if (field.name === 'origispeci' && tableName === 'articoli') {
        // Ottieni l'ID della macroarea selezionata
        const macroareaId = isNew 
          ? newRecord['macroarea'] 
          : (editingRecord ? editingRecord['macroarea'] : null);
        
        if (macroareaId) {
          // Trova la macroarea nei dati di riferimento
          const macroaree = referenceData['macroaree'] || [];
          const selectedMacroarea = macroaree.find((m: any) => m.id === macroareaId);
          
          // Se la macroarea ha flag_orig = false, disabilita il campo
          if (selectedMacroarea && !selectedMacroarea.flag_orig) {
            isDisabled = true;
            disabledMessage = "Non applicabile per questa macroarea";
          }
        } else {
          // Se non è stata selezionata una macroarea, disabilita il campo
          isDisabled = true;
          disabledMessage = "Seleziona prima una macroarea";
        }
      }
      
      return (
        <div>
          <div className="multiselect-container">
            <select
              id={id}
              name={field.name}
              multiple
              value={selectedValues}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                handleMultiselectChange(field.name, selectedOptions, isNew);
              }}
              size={4} // Mostra 4 opzioni contemporaneamente
              className="multiselect"
              disabled={isDisabled}
            >
              {options.map((option: any) => (
                <option 
                  key={option[field.reference!.valueField]} 
                  value={option[field.reference!.valueField]}
                >
                  {option[field.reference!.labelField]}
                </option>
              ))}
            </select>
          </div>
          {field.description && <div className="field-description">{field.description}</div>}
          {isDisabled && disabledMessage && <div className="field-error">{disabledMessage}</div>}
          <div className="selected-options">
            {selectedValues.length > 0 && (
              <div>
                <strong>Selezionati:</strong> {selectedValues.map((val: number) => {
                  const option = options.find((o: any) => o[field.reference!.valueField] === val);
                  return option ? option[field.reference!.labelField] : val;
                }).join(', ')}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Per i campi checkbox
    if (field.type === 'checkbox') {
      return (
        <div>
          <input
            type="checkbox"
            id={id}
            name={field.name}
            checked={!!value}
            onChange={(e) => handleInputChange(e, isNew)}
          />
          {field.description && <div className="field-description">{field.description}</div>}
        </div>
      );
    }
    
    // Per i campi di tipo data
    if (field.type === 'date') {
      return (
        <div>
          <input
            type="date"
            id={id}
            name={field.name}
            value={value ? value.substring(0, 10) : ''}
            onChange={(e) => handleInputChange(e, isNew)}
            required={field.name === 'data_inizio'} // La data di inizio è obbligatoria
          />
          {field.description && <div className="field-description">{field.description}</div>}
        </div>
      );
    }
    
    // Per i campi di testo e numerici
    return (
      <div>
        <input
          type={field.type}
          id={id}
          name={field.name}
          value={field.type === 'number' ? (value === 0 ? '0' : (value || '')) : (value || '')}
          onChange={(e) => handleInputChange(e, isNew)}
          maxLength={field.maxLength}
          required={field.name === 'id' && tableName === 'cisterne' || isRequired} // L'ID e la descrizione delle cisterne sono obbligatori
          min={field.type === 'number' ? '0' : undefined} // Consenti valore 0 per campi numerici
          step={field.type === 'number' ? '0.01' : undefined} // Precisione a 2 decimali per numeri
        />
        {field.description && <div className="field-description">{field.description}</div>}
      </div>
    );
  };
  
  // Funzione per ottenere il nome leggibile della tabella
  const getTableLabel = () => {
    switch(tableName) {
      case 'cisterne': return 'Cisterne';
      case 'magazzini': return 'Magazzini';
      case 'soggetti': return 'Soggetti';
      case 'terreni': return 'Terreni';
      case 'articoli': return 'Articoli';
      case 'movimenti': return 'Movimentazione';
      case 'listini': return 'Listini Prezzi';
      case 'linee': return 'Linee di Lavorazione';
      case 'olive_linee': return 'Relazioni Olive-Linee';
      default: return tableName;
    }
  };
  
  // Per le tabelle speciali, mostriamo un'interfaccia dedicata
  if (tableName === 'movimenti') {
    return (
      <div className="company-table">
        <div className="header">
          <button onClick={onBack} className="btn-secondary">
            <i className="fas fa-arrow-left"></i> Indietro
          </button>
          <h2>Gestione {getTableLabel()}</h2>
          <div></div> {/* Spazio vuoto per bilanciare la flexbox */}
        </div>
        
        <div className="movimenti-info">
          <p>La gestione dei movimenti richiede un'interfaccia dedicata.</p>
          <p>Utilizzare la funzionalità specifica di movimentazione olio dalla dashboard principale.</p>
          <button onClick={onBack} className="primary-button">Torna alle Tabelle</button>
        </div>
      </div>
    );
  }
  
  // Per la tabella olive_linee, mostriamo l'interfaccia dedicata OliveLineeManager
  if (tableName === 'olive_linee') {
    return (
      <div className="company-table">
        <div className="header">
          <button onClick={onBack} className="btn-secondary">
            <i className="fas fa-arrow-left"></i> Indietro
          </button>
          <h2>Gestione Relazioni Olive-Linee</h2>
          <div></div> {/* Spazio vuoto per bilanciare la flexbox */}
        </div>
        
        <OliveLineeManager companyId={companyId} companyCode={companyCode} />
      </div>
    );
  }
  
  if (loading) return <div className="loading">Caricamento...</div>;
  
  return (
    <div className="company-table">
      <div className="header">
        <button onClick={onBack} className="btn-secondary">
          <i className="fas fa-arrow-left"></i> Indietro
        </button>
        <h2>Gestione {getTableLabel()}</h2>
        <button 
          onClick={() => setShowNewForm(true)}
          className="primary-button"
        >
          <i className="fas fa-plus"></i> Nuovo
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Cerca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="clear-search"
          >
            ✕
          </button>
        )}
        <div className="search-results">
          {searchTerm && `${filteredRecords.length} risultati`}
        </div>
      </div>
      
      {renderNewForm()}
      {renderEditForm()}
      
      <div className="records-list">
        <table>
          <thead>
            <tr>
              <th style={{ width: '60px' }}>ID</th>
              {tableName === 'soggetti' ? (
                // Colonne personalizzate per la tabella soggetti
                <>
                  <th key="descrizione">Ragione Sociale</th>
                  <th key="contatti">Contatti</th>
                  <th key="indirizzo">Indirizzo</th>
                  <th key="fiscale">Dati Fiscali</th>
                  <th key="olivedef">Tipo Oliva</th>
                  <th key="flagForn">Tipo</th>
                </>
              ) : (
                // Colonne standard per altre tabelle
                fields.filter(f => f.name !== 'id' && f.type !== 'section').map(field => (
                  <th key={field.name}>{field.label}</th>
                ))
              )}
              <th style={{ width: '120px' }}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(record => (
              <tr key={record.id}>
                <td>{record.id}</td>
                {tableName === 'soggetti' ? (
                  // Celle personalizzate per soggetti
                  <>
                    <td key="descrizione" className="soggetti-cell-name">
                      <div className="soggetti-name">{record.descrizione}</div>
                    </td>
                    <td key="contatti" className="soggetti-cell-contacts">
                      {record.mail && <div><i className="fas fa-envelope"></i> {record.mail}</div>}
                      {record.telefono && <div><i className="fas fa-phone"></i> {record.telefono}</div>}
                      {record.cellulare && <div><i className="fas fa-mobile-alt"></i> {record.cellulare}</div>}
                    </td>
                    <td key="indirizzo" className="soggetti-cell-address">
                      <div>{record.indirizzo || ''}</div>
                      <div>
                        {record.cap ? `${record.cap} ` : ''}
                        {renderReferenceValue('comuni', record.comune)}
                        {record.provincia ? ` (${renderReferenceValue('province', record.provincia)})` : ''}
                      </div>
                    </td>
                    <td key="fiscale" className="soggetti-cell-fiscale">
                      {record.codfisc && <div><strong>CF:</strong> {record.codfisc}</div>}
                      {record.partiva && <div><strong>P.IVA:</strong> {record.partiva}</div>}
                    </td>
                    <td key="olivedef" className="soggetti-cell-olive">
                      {renderReferenceValueWithBio('articoli', record.olivedef)}
                    </td>
                    <td key="flagForn" className="soggetti-cell-type">
                      <span className={`badge ${record.flagForn ? 'badge-fornitore' : 'badge-cliente'}`}>
                        {record.flagForn ? 'Fornitore' : 'Cliente'}
                      </span>
                      {record.flagdoc && 
                        <span className="badge badge-small badge-info" style={{marginTop: '4px'}}>
                          <i className="fas fa-file-alt"></i> DDT
                        </span>
                      }
                    </td>
                  </>
                ) : (
                  // Celle standard per altre tabelle
                  fields.filter(f => f.name !== 'id' && f.type !== 'section').map(field => {
                    if (field.type === 'checkbox') {
                      return (
                        <td key={field.name}>
                          {record[field.name] ? '✓' : '−'}
                        </td>
                      );
                    }
                    
                    if (field.type === 'select' && field.options) {
                      const selected = field.options.find(option => option.value === record[field.name]);
                      return (
                        <td key={field.name}>
                          {selected ? selected.label : record[field.name]}
                        </td>
                      );
                    }
                  
                    if (field.type === 'select' && field.reference) {
                      const options = referenceData[field.reference.table] || [];
                      const selected = options.find((option: any) => 
                        option[field.reference!.valueField] === record[field.name]
                      );
                      
                      // Personalizzazione visualizzazione per campi specifici
                      
                      // Per il campo cod_iva
                      if (field.name === 'cod_iva' && selected) {
                        return (
                          <td key={field.name}>
                            {selected ? `${selected[field.reference.labelField]}%` : ''}
                          </td>
                        );
                      }
                      
                      // Per il campo olivedef, mostra anche se è biologico
                      if (field.name === 'olivedef' && selected) {
                        const isBio = selected.flag_bio;
                        return (
                          <td key={field.name}>
                            {selected ? `${selected[field.reference.labelField]} ${isBio ? '(BIO)' : ''}` : ''}
                          </td>
                        );
                      }
                      
                      return (
                        <td key={field.name}>
                          {selected ? selected[field.reference.labelField] : ''}
                        </td>
                      );
                    }
                  
                    if (field.type === 'multiselect' && field.reference) {
                      const options = referenceData[field.reference.table] || [];
                      const values = record[field.name] ? record[field.name].split(',').map((v: string) => parseInt(v.trim())) : [];
                      const selectedLabels = values.map((v: number) => {
                        const option = options.find((o: any) => o[field.reference!.valueField] === v);
                        return option ? option[field.reference!.labelField] : v;
                      });
                      
                      return (
                        <td key={field.name}>
                          {selectedLabels.join(', ')}
                        </td>
                      );
                    }
                    
                    // Formattazione date
                    if (field.type === 'date' && record[field.name]) {
                      // Converte la data in formato locale
                      const date = new Date(record[field.name]);
                      return (
                        <td key={field.name}>
                          {date.toLocaleDateString('it-IT')}
                        </td>
                      );
                    }
                    
                    // Formattazione numeri
                    if (field.type === 'number' && record[field.name] !== null && record[field.name] !== undefined) {
                      // Per prezzo, mostra 2 decimali e il simbolo €
                      if (field.name === 'prezzo') {
                        return (
                          <td key={field.name}>
                            {record[field.name].toLocaleString('it-IT', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })} €
                          </td>
                        );
                      }
                      // Per altri numeri, usa la formattazione locale
                      return (
                        <td key={field.name}>
                          {record[field.name].toLocaleString('it-IT', { 
                            minimumFractionDigits: 0, 
                            maximumFractionDigits: 2
                          })}
                        </td>
                      );
                    }
                    
                    return <td key={field.name}>{record[field.name]}</td>;
                  })
                )}
                <td className="actions">
                  <button 
                    onClick={() => setEditingRecord(record)}
                    className="btn-secondary"
                  >
                    Modifica
                  </button>
                  <button 
                    onClick={() => handleDelete(record.id)}
                    style={{ backgroundColor: '#d32f2f' }}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={fields.length + 1}>
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--light-text)' }}>
                    {searchTerm 
                      ? 'Nessun risultato corrisponde alla ricerca'
                      : 'Nessun record trovato'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyTable;