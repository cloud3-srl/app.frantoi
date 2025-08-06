import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface GenericArticlesProps {
  onBack?: () => void;
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

const GenericArticles: React.FC<GenericArticlesProps> = ({ onBack }) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [newArticle, setNewArticle] = useState<any>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [referenceData, setReferenceData] = useState<Record<string, any[]>>({});
  const editFormRef = React.useRef<HTMLDivElement>(null);

  // Definizione dei campi per la tabella articoli
  const fields: Field[] = [
    { 
      name: 'tipologia', 
      label: 'Tipologia', 
      type: 'select', 
      options: [
        { value: 'SF', label: 'Olio Sfuso' },
        { value: 'OL', label: 'Olive' },
        { value: 'SE', label: 'Servizi' }
      ],
      description: 'Seleziona il tipo di prodotto'
    },
    { 
      name: 'descrizione', 
      label: 'Descrizione', 
      type: 'text', 
      maxLength: 60,
      description: 'Inserisci la descrizione dell\'articolo (verrà convertita in maiuscolo)'
    },
    { 
      name: 'categ_olio', 
      label: 'Categoria Olio', 
      type: 'select', 
      reference: { table: 'categorie_olio', valueField: 'id', labelField: 'descrizione' },
      description: 'Seleziona la categoria dell\'olio'
    },
    { 
      name: 'macroarea', 
      label: 'Macroarea', 
      type: 'select', 
      reference: { table: 'macroaree', valueField: 'id', labelField: 'descrizione' },
      description: 'Seleziona la macroarea geografica'
    },
    { 
      name: 'origispeci', 
      label: 'Origine Specifica', 
      type: 'multiselect', 
      reference: { table: 'origini_specifiche', valueField: 'id', labelField: 'descrizione' },
      description: 'Seleziona una o più origini specifiche (attiva solo se richiesta dalla macroarea)'
    },
    // Raggruppo i flag in sezioni logiche
    { 
      name: 'flag_ps', 
      label: 'PS (Prima Spremitura)', 
      type: 'checkbox',
      description: 'Indica se l\'olio è di prima spremitura'
    },
    { 
      name: 'flag_ef', 
      label: 'EF (Estrazione a Freddo)', 
      type: 'checkbox',
      description: 'Indica se l\'olio è estratto a freddo'
    },
    { 
      name: 'flag_bio', 
      label: 'Biologico', 
      type: 'checkbox',
      description: 'Indica se l\'articolo è biologico' 
    },
    { 
      name: 'flag_conv', 
      label: 'In Conversione', 
      type: 'checkbox',
      description: 'Indica se l\'articolo è in conversione verso il biologico'
    },
    { 
      name: 'cod_iva', 
      label: 'Codice IVA', 
      type: 'select', 
      reference: { table: 'codici_iva', valueField: 'id', labelField: 'percen' },
      description: 'Seleziona l\'aliquota IVA applicabile'
    },
    { 
      name: 'varieta', 
      label: 'Varietà', 
      type: 'text', 
      maxLength: 40,
      description: 'Inserisci la varietà dell\'oliva (opzionale)'
    },
    { 
      name: 'flag_in_uso', 
      label: 'In Uso', 
      type: 'checkbox',
      description: 'Indica se l\'articolo è attualmente in uso'
    },
    { 
      name: 'unita_misura', 
      label: 'Unità Misura', 
      type: 'select',
      options: [
        { value: 'KG', label: 'Kilogrammi (KG)' },
        { value: 'LT', label: 'Litri (LT)' },
        { value: 'QT', label: 'Quintali (QT)' },
        { value: 'PZ', label: 'Pezzi (PZ)' }
      ],
      description: 'Seleziona l\'unità di misura dell\'articolo'
    }
  ];

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
          
          // Usa l'API per tabelle comuni
          const endpoint = `/api/tables/${table}`;
          
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
    
    loadReferenceData();
  }, []);
  
  // Caricamento dati iniziale
  useEffect(() => {
    fetchData();
  }, []);
  
  // Funzione per recuperare i dati
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/tables/articoli', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setArticles(response.data.data);
        setFilteredArticles(response.data.data);
      } else {
        setError(response.data.message || 'Errore nel recupero dei dati');
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Errore nel caricamento degli articoli:', err);
      setError(err.response?.data?.message || 'Errore nel caricamento degli articoli');
      setLoading(false);
    }
  };
  
  // Filtra i record in base al termine di ricerca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredArticles(articles);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = articles.filter(article => {
      // Cerca in tutti i campi dell'articolo
      return Object.keys(article).some(key => {
        const value = article[key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTermLower);
      });
    });
    
    setFilteredArticles(filtered);
  }, [searchTerm, articles]);
  
  // Scroll al form di modifica quando viene aperto
  useEffect(() => {
    if (editingArticle && editFormRef.current) {
      setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [editingArticle]);

  // Gestione della creazione di un nuovo record
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Aggiungiamo i campi obbligatori mancanti specifici per la tabella articoli
      let dataToSend = {...newArticle};
      
      // Unità misura è obbligatoria per articoli
      if (!dataToSend.unita_misura) {
        if (dataToSend.tipologia === 'SF') {
          dataToSend.unita_misura = 'KG';
        } else if (dataToSend.tipologia === 'OL') {
          dataToSend.unita_misura = 'QT';
        } else if (dataToSend.tipologia === 'SE') {
          dataToSend.unita_misura = 'PZ'; // Per i servizi, utilizziamo "Pezzi" come unità di misura predefinita
        } else {
          dataToSend.unita_misura = 'KG'; // Valore predefinito generico
        }
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
      
      const response = await axios.post('/api/tables/articoli', dataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Aggiorna la lista dei record
        await fetchData();
        
        // Reset del form
        setNewArticle({});
        setShowNewForm(false);
        setError(null);
      } else {
        setError(response.data.message || 'Errore nella creazione dell\'articolo');
      }
    } catch (err: any) {
      console.error('Errore nella creazione dell\'articolo:', err);
      
      // Mostra più dettagli sull'errore
      if (err.response?.data?.error) {
        console.error('Dettagli errore:', err.response.data.error);
        setError(`Errore: ${err.response.data.error}`);
      } else {
        setError(err.response?.data?.message || 'Errore nella creazione dell\'articolo');
      }
    }
  };
  
  // Gestione dell'aggiornamento di un record
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    
    try {
      // Aggiungiamo i campi obbligatori mancanti specifici per la tabella articoli
      let dataToSend = {...editingArticle};
      
      // Unità misura è obbligatoria per articoli
      if (!dataToSend.unita_misura) {
        if (dataToSend.tipologia === 'SF') {
          dataToSend.unita_misura = 'KG';
        } else if (dataToSend.tipologia === 'OL') {
          dataToSend.unita_misura = 'QT';
        } else if (dataToSend.tipologia === 'SE') {
          dataToSend.unita_misura = 'PZ'; // Per i servizi, utilizziamo "Pezzi" come unità di misura predefinita
        } else {
          dataToSend.unita_misura = 'KG'; // Valore predefinito generico
        }
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
      
      const response = await axios.put(`/api/tables/articoli/${dataToSend.id}`, dataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Aggiorna la lista dei record
        await fetchData();
        
        // Reset del form di modifica
        setEditingArticle(null);
        setError(null);
      } else {
        setError(response.data.message || 'Errore nell\'aggiornamento dell\'articolo');
      }
    } catch (err: any) {
      console.error('Errore nell\'aggiornamento dell\'articolo:', err);
      
      // Mostra più dettagli sull'errore
      if (err.response?.data?.error) {
        console.error('Dettagli errore:', err.response.data.error);
        setError(`Errore: ${err.response.data.error}`);
      } else {
        setError(err.response?.data?.message || 'Errore nell\'aggiornamento dell\'articolo');
      }
    }
  };
  
  // Gestione dell'eliminazione di un record
  const handleDelete = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo articolo?')) return;
    
    try {
      const response = await axios.delete(`/api/tables/articoli/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Aggiorna la lista dei record
        await fetchData();
        setError(null);
      } else {
        setError(response.data.message || 'Errore nell\'eliminazione dell\'articolo');
      }
    } catch (err: any) {
      console.error('Errore nell\'eliminazione dell\'articolo:', err);
      setError(err.response?.data?.message || 'Errore nell\'eliminazione dell\'articolo');
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
    } else if (name === 'descrizione') {
      // Conversione in maiuscolo per il campo descrizione
      inputValue = value.toUpperCase();
    } else if (name === 'comune' || name === 'provincia' || name === 'nazione' || 
               name === 'cod_cli' || name === 'orig_spec' || name === 'categ_olio' || 
               name === 'macroarea' || name === 'cod_iva') {
      // Campi select che si riferiscono a tabelle esterne - converti in numeri
      inputValue = value ? parseInt(value) : null;
      
      // Se è stato modificato il campo macroarea, controlla il flag_orig e resetta origispeci se necessario
      if (name === 'macroarea') {
        // Cerca la macroarea selezionata nei dati di riferimento
        const macroaree = referenceData['macroaree'] || [];
        const selectedMacroarea = macroaree.find((m: any) => m.id === parseInt(value));
        
        // Se la macroarea ha flag_orig = false, resetta il campo origispeci
        if (selectedMacroarea && !selectedMacroarea.flag_orig) {
          if (isNew) {
            setNewArticle((prev: any) => ({
              ...prev,
              origispeci: null
            }));
          } else {
            setEditingArticle((prev: any) => ({
              ...prev!,
              origispeci: null
            }));
          }
        }
      }
    } else if (name === 'tipologia') {
      // Se cambia la tipologia dell'articolo
      if (value === 'SE') { // Se cambia a tipo "Servizi", resettiamo campi non pertinenti
        if (isNew) {
          setNewArticle((prev: any) => ({
            ...prev,
            tipologia: value,
            categ_olio: null,
            macroarea: null,
            origispeci: null,
            varieta: null,
            flag_ps: false,
            flag_ef: false,
            flag_bio: false,
            flag_conv: false,
            unita_misura: 'PZ' // Imposta PZ come unità di misura predefinita per i servizi
          }));
          return; // Interrompiamo qui per evitare doppio aggiornamento
        } else {
          setEditingArticle((prev: any) => ({
            ...prev!,
            tipologia: value,
            categ_olio: null,
            macroarea: null,
            origispeci: null,
            varieta: null,
            flag_ps: false,
            flag_ef: false,
            flag_bio: false,
            flag_conv: false,
            unita_misura: 'PZ' // Imposta PZ come unità di misura predefinita per i servizi
          }));
          return; // Interrompiamo qui per evitare doppio aggiornamento
        }
      }
    }
    
    // Registra il nuovo valore nell'oggetto di stato appropriato
    if (isNew) {
      setNewArticle((prev: any) => ({
        ...prev,
        [name]: inputValue
      }));
    } else {
      setEditingArticle((prev: any) => ({
        ...prev!,
        [name]: inputValue
      }));
    }
  };
  
  // Gestione degli input di tipo multiselect
  const handleMultiselectChange = (name: string, selectedValues: string[], isNew: boolean = false) => {
    // Converti i valori in numeri e poi in stringa separata da virgole
    const numericValues = selectedValues.map(v => parseInt(v));
    const stringValue = numericValues.join(',');
    
    if (isNew) {
      setNewArticle((prev: any) => ({
        ...prev,
        [name]: stringValue
      }));
    } else {
      setEditingArticle((prev: any) => ({
        ...prev!,
        [name]: stringValue
      }));
    }
  };
  
  // Renderizza un form per articoli con campi raggruppati
  const renderArticleForm = (isNew: boolean, formData: any, onSubmit: (e: React.FormEvent) => void, onCancel: () => void) => {
    const title = isNew ? 'Nuovo Articolo' : 'Modifica Articolo';
    const submitLabel = isNew ? 'Crea' : 'Salva';
    const idPrefix = isNew ? 'new' : 'edit';
    
    // Determina se l'articolo è di tipo Servizio
    const isService = formData.tipologia === 'SE';
    
    // Raggruppiamo i campi in sezioni logiche
    const baseInfoFields = fields.filter(f => ['tipologia', 'descrizione', 'unita_misura'].includes(f.name));
    const categoryFields = !isService ? fields.filter(f => ['categ_olio', 'varieta'].includes(f.name)) : [];
    const originFields = !isService ? fields.filter(f => ['macroarea', 'origispeci'].includes(f.name)) : [];
    
    // Per articoli di tipo Servizio, includiamo solo flag_in_uso
    const flagFields = isService 
      ? fields.filter(f => f.name === 'flag_in_uso')
      : fields.filter(f => f.name.startsWith('flag_'));
    
    const otherFields = fields.filter(f => 
      !['tipologia', 'descrizione', 'unita_misura', 'categ_olio', 'varieta', 'macroarea', 'origispeci'].includes(f.name) 
      && !f.name.startsWith('flag_') && f.name !== 'id'
    );
    
    return (
      <div className={isNew ? "new-form" : "edit-form"} ref={isNew ? null : editFormRef}>
        <h3>{title}</h3>
        <form onSubmit={onSubmit}>
          {/* Informazioni di base */}
          <div className="field-section">
            <div className="field-section-title">
              <i className="fas fa-info-circle"></i> Informazioni Base
            </div>
            <div className="two-columns">
              {baseInfoFields.map(field => (
                <div className="form-group" key={field.name}>
                  <label htmlFor={`${idPrefix}-${field.name}`}>{field.label}</label>
                  {renderFormField(field, formData[field.name], isNew)}
                </div>
              ))}
            </div>
          </div>
          
          {/* Categoria e Varietà - solo per Olive e Olio */}
          {categoryFields.length > 0 && (
            <div className="field-section">
              <div className="field-section-title">
                <i className="fas fa-tags"></i> Classificazione
              </div>
              <div className="two-columns">
                {categoryFields.map(field => (
                  <div className="form-group" key={field.name}>
                    <label htmlFor={`${idPrefix}-${field.name}`}>{field.label}</label>
                    {renderFormField(field, formData[field.name], isNew)}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Origine - solo per Olive e Olio */}
          {originFields.length > 0 && (
            <div className="field-section">
              <div className="field-section-title">
                <i className="fas fa-globe-europe"></i> Origine Geografica
              </div>
              {originFields.map(field => (
                <div className="form-group" key={field.name}>
                  <label htmlFor={`${idPrefix}-${field.name}`}>{field.label}</label>
                  {renderFormField(field, formData[field.name], isNew)}
                </div>
              ))}
            </div>
          )}
          
          {/* Flags */}
          <div className="field-section">
            <div className="field-section-title">
              <i className="fas fa-check-square"></i> Caratteristiche
            </div>
            <div className="checkbox-inline">
              {flagFields.map(field => (
                <div className="form-group" key={field.name}>
                  {renderFormField(field, formData[field.name], isNew)}
                  <label htmlFor={`${idPrefix}-${field.name}`}>{field.label}</label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Altri campi */}
          {otherFields.length > 0 && (
            <div className="field-section">
              <div className="field-section-title">
                <i className="fas fa-cog"></i> Informazioni Aggiuntive
              </div>
              {otherFields.map(field => (
                <div className="form-group" key={field.name}>
                  <label htmlFor={`${idPrefix}-${field.name}`}>{field.label}</label>
                  {renderFormField(field, formData[field.name], isNew)}
                </div>
              ))}
            </div>
          )}
          
          <div className="form-actions">
            <button type="submit" className="primary-button">
              <i className={`fas fa-${isNew ? 'plus' : 'save'}`}></i> {submitLabel}
            </button>
            <button type="button" className="btn-secondary" onClick={onCancel}>
              <i className="fas fa-times"></i> Annulla
            </button>
          </div>
        </form>
      </div>
    );
  };
  
  // Rendering del form di modifica
  const renderEditForm = () => {
    if (!editingArticle) return null;
    return renderArticleForm(false, editingArticle, handleUpdate, () => setEditingArticle(null));
  };
  
  // Rendering del form per nuovo record
  const renderNewForm = () => {
    if (!showNewForm) return null;
    return renderArticleForm(true, newArticle, handleCreate, () => setShowNewForm(false));
  };
  
  // Funzione helper per renderizzare il campo del form in base al tipo
  const renderFormField = (field: Field, value: any, isNew: boolean) => {
    const id = `${isNew ? 'new' : 'edit'}-${field.name}`;
    
    // Per i campi select con opzioni predefinite
    if (field.type === 'select' && field.options) {
      return (
        <div>
          <select
            id={id}
            name={field.name}
            value={value || ''}
            onChange={(e) => handleInputChange(e, isNew)}
          >
            <option value="">Seleziona...</option>
            {field.options.map((option) => {
              // Per i campi standard usiamo l'opzione direttamente
              const displayLabel = option.label;
                
              return (
                <option 
                  key={option.value} 
                  value={option.value}
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
    
    // Per i campi select che si riferiscono a tabelle esterne
    if (field.type === 'select' && field.reference) {
      const options = referenceData[field.reference.table] || [];
      
      return (
        <div>
          <select
            id={id}
            name={field.name}
            value={value || ''}
            onChange={(e) => handleInputChange(e, isNew)}
          >
            <option value="">Seleziona...</option>
            {options.map((option: any) => {
              // Per IVA visualizza la percentuale con il simbolo %
              const displayLabel = field.name === 'cod_iva' 
                ? `${option[field.reference!.labelField]}%` 
                : option[field.reference!.labelField];
                
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
      
      if (field.name === 'origispeci') {
        // Ottieni l'ID della macroarea selezionata
        const macroareaId = isNew 
          ? newArticle['macroarea'] 
          : (editingArticle ? editingArticle['macroarea'] : null);
        
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

      // Preparazione delle opzioni selezionate per la visualizzazione
      const selectedLabels = selectedValues.map((val: number) => {
        const option = options.find((o: any) => o[field.reference!.valueField] === val);
        return option ? option[field.reference!.labelField] : val;
      });
      
      // Per il campo origini specifiche, mostriamo un'interfaccia migliorata con checkbox
      if (field.name === 'origispeci') {
        return (
          <div>
            {field.description && <div className="field-description">{field.description}</div>}
            {isDisabled && disabledMessage && <div className="field-error">{disabledMessage}</div>}
            
            {!isDisabled && (
              <div className="origini-selection">
                <div className="origin-checkboxes">
                  {options.map((option: any) => {
                    const isSelected = selectedValues.includes(option[field.reference!.valueField]);
                    return (
                      <div key={option[field.reference!.valueField]} className="origin-checkbox">
                        <input
                          type="checkbox"
                          id={`${id}-${option[field.reference!.valueField]}`}
                          checked={isSelected}
                          onChange={(e) => {
                            const optionId = option[field.reference!.valueField].toString();
                            let newSelected = [...selectedValues.map((v: number) => v.toString())];
                            
                            if (e.target.checked) {
                              // Aggiungi la selezione se non esiste già
                              if (!newSelected.includes(optionId)) {
                                newSelected.push(optionId);
                              }
                            } else {
                              // Rimuovi la selezione
                              newSelected = newSelected.filter(v => v !== optionId);
                            }
                            
                            handleMultiselectChange(field.name, newSelected, isNew);
                          }}
                        />
                        <label htmlFor={`${id}-${option[field.reference!.valueField]}`}>
                          {option[field.reference!.labelField]}
                        </label>
                      </div>
                    );
                  })}
                </div>
                
                {selectedValues.length > 0 && (
                  <div className="selected-options">
                    <strong>Origini selezionate:</strong> {selectedLabels.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      
      // Per altri campi multiselect (se ce ne sono)
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
              size={4}
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
                <strong>Selezionati:</strong> {selectedLabels.join(', ')}
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
    
    // Per i campi di testo e numerici
    return (
      <div>
        <input
          type={field.type}
          id={id}
          name={field.name}
          value={value || ''}
          onChange={(e) => handleInputChange(e, isNew)}
          maxLength={field.maxLength}
        />
        {field.description && <div className="field-description">{field.description}</div>}
      </div>
    );
  };

  if (loading) return <div className="loading"><i className="fas fa-spinner fa-spin"></i> Caricamento articoli...</div>;

  // Funzione per renderizzare una pillola di badge per le caratteristiche
  const renderBadge = (name: string, value: boolean) => {
    if (!value) return null;
    
    let badgeClass = '';
    let icon = '';
    let label = '';

    switch(name) {
      case 'flag_bio':
        badgeClass = 'badge-bio';
        icon = 'leaf';
        label = 'BIO';
        break;
      case 'flag_ps':
        badgeClass = 'badge-cl';
        icon = 'tint';
        label = 'PS';
        break;
      case 'flag_ef':
        badgeClass = 'badge-cl';
        icon = 'temperature-low';
        label = 'EF';
        break;
      case 'flag_conv':
        badgeClass = 'badge-warning';
        icon = 'sync';
        label = 'In Conv.';
        break;
      case 'flag_in_uso':
        badgeClass = 'badge-success';
        icon = 'check-circle';
        label = 'Attivo';
        break;
      default:
        badgeClass = 'badge-primary';
        icon = 'check';
        label = name.replace('flag_', '').toUpperCase();
    }

    return (
      <span className={badgeClass}>
        <i className={`fas fa-${icon}`}></i> {label}
      </span>
    );
  };

  return (
    <div className="generic-table">
      <div className="header">
        {onBack && (
          <button onClick={onBack} className="btn-secondary back-button">
            <i className="fas fa-arrow-left"></i> Indietro
          </button>
        )}
        <h2><i className="fas fa-boxes"></i> Gestione Articoli</h2>
        <button 
          onClick={() => setShowNewForm(true)}
          className="primary-button new-article-button"
        >
          <i className="fas fa-plus"></i> Nuovo Articolo
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <div className="error-content">
            <i className="fas fa-exclamation-circle"></i>
            <div className="error-text">{error}</div>
          </div>
        </div>
      )}
      
      <div className="toolbox">
        <div className="search-bar">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Cerca articoli per descrizione, categoria, origine..."
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
            {searchTerm && `${filteredArticles.length} risultati`}
          </div>
        </div>
        <div className="table-info">
          <div className="total-count">
            <i className="fas fa-list"></i> Articoli totali: <strong>{articles.length}</strong>
          </div>
        </div>
      </div>
      
      {renderNewForm()}
      {renderEditForm()}
      
      <div className="records-list">
        <table>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>Descrizione</th>
              <th>Tipologia</th>
              <th>Categoria</th>
              <th>Origine</th>
              <th>Caratteristiche</th>
              <th>IVA</th>
              <th>U.M.</th>
              <th style={{ width: '120px' }}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredArticles.map(article => {
              // Trova la tipologia
              const tipologiaField = fields.find(f => f.name === 'tipologia');
              const tipologiaOption = tipologiaField?.options?.find(opt => opt.value === article.tipologia);
              
              // Trova la categoria dell'olio
              const categField = fields.find(f => f.name === 'categ_olio');
              const categOptions = categField?.reference ? referenceData[categField.reference.table] || [] : [];
              const selectedCateg = categOptions.find((opt: any) => opt.id === article.categ_olio);
              
              // Trova la macroarea
              const macroareaField = fields.find(f => f.name === 'macroarea');
              const macroareaOptions = macroareaField?.reference ? referenceData[macroareaField.reference.table] || [] : [];
              const selectedMacroarea = macroareaOptions.find((opt: any) => opt.id === article.macroarea);
              
              // Trova l'IVA
              const ivaField = fields.find(f => f.name === 'cod_iva');
              const ivaOptions = ivaField?.reference ? referenceData[ivaField.reference.table] || [] : [];
              const selectedIva = ivaOptions.find((opt: any) => opt.id === article.cod_iva);
              
              return (
                <tr key={article.id}>
                  <td>{article.id}</td>
                  <td><strong>{article.descrizione}</strong></td>
                  <td>{tipologiaOption?.label || article.tipologia}</td>
                  <td>{selectedCateg?.descrizione || '-'}</td>
                  <td>{selectedMacroarea?.descrizione || '-'}</td>
                  <td>
                    {/* Mostra flag come badges */}
                    {Object.entries(article)
                      .filter(([key, value]) => key.startsWith('flag_') && value === true)
                      .map(([key]) => renderBadge(key, true))
                    }
                    {!Object.entries(article).some(([key, value]) => key.startsWith('flag_') && value === true) && '-'}
                  </td>
                  <td>{selectedIva ? `${selectedIva.percen}%` : '-'}</td>
                  <td>{article.unita_misura}</td>
                  <td className="actions">
                    <div className="action-buttons">
                      <button 
                        onClick={() => setEditingArticle(article)}
                        className="btn-edit"
                        title="Modifica articolo"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(article.id)}
                        className="btn-delete"
                        title="Elimina articolo"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredArticles.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--light-text)' }}>
                    {searchTerm 
                      ? <><i className="fas fa-search"></i> Nessun risultato corrisponde alla ricerca</>
                      : <><i className="fas fa-info-circle"></i> Nessun articolo trovato</>}
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

export default GenericArticles;