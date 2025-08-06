--
-- PostgreSQL database dump
--

-- Dumped from database version 12.7
-- Dumped by pg_dump version 16.8 (Ubuntu 16.8-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = off;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET escape_string_warning = off;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: articoli; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.articoli (
    id integer NOT NULL,
    tipologia character(2) NOT NULL,
    descrizione character(60) NOT NULL,
    categ_olio integer,
    macroarea integer,
    origispeci character(20),
    flag_ps boolean DEFAULT false NOT NULL,
    flag_ef boolean DEFAULT false NOT NULL,
    flag_bio boolean DEFAULT false NOT NULL,
    flag_conv boolean DEFAULT false NOT NULL,
    cod_iva integer,
    varieta character(40),
    flag_in_uso boolean DEFAULT true NOT NULL,
    unita_misura character(3) NOT NULL
);


ALTER TABLE public.articoli OWNER TO postgres;

--
-- Name: articoli_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.articoli_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.articoli_id_seq OWNER TO postgres;

--
-- Name: articoli_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.articoli_id_seq OWNED BY public.articoli.id;


--
-- Name: aziende; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aziende (
    id integer NOT NULL,
    descrizione character(40) NOT NULL,
    codice character(5) NOT NULL,
    ultimoidsoggetto integer DEFAULT 0 NOT NULL,
    email_mittente character varying(100),
    email_password character varying(100),
    email_smtp_server character varying(100),
    email_smtp_port integer,
    email_ssl boolean DEFAULT true,
    email_default_oggetto character varying(200),
    email_firma text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.aziende OWNER TO postgres;

--
-- Name: aziende_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aziende_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aziende_id_seq OWNER TO postgres;

--
-- Name: aziende_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aziende_id_seq OWNED BY public.aziende.id;


--
-- Name: categorie_olio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorie_olio (
    id integer NOT NULL,
    acronimo character(3) NOT NULL,
    descrizione character varying(200) NOT NULL
);


ALTER TABLE public.categorie_olio OWNER TO postgres;

--
-- Name: categorie_olio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorie_olio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorie_olio_id_seq OWNER TO postgres;

--
-- Name: categorie_olio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorie_olio_id_seq OWNED BY public.categorie_olio.id;


--
-- Name: cloud_articoli; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloud_articoli (
    id integer NOT NULL,
    tipologia character(2),
    descrizione character(60) NOT NULL,
    categ_olio integer,
    macroarea integer,
    origispeci character(20),
    flag_ps boolean DEFAULT false,
    flag_ef boolean DEFAULT false,
    flag_bio boolean DEFAULT false,
    flag_conv boolean DEFAULT false,
    cod_iva integer,
    varieta character(40),
    flag_in_uso boolean DEFAULT true,
    unita_misura character(3),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cloud_articoli OWNER TO postgres;

--
-- Name: cloud_articoli_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cloud_articoli_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cloud_articoli_id_seq OWNER TO postgres;

--
-- Name: cloud_articoli_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cloud_articoli_id_seq OWNED BY public.cloud_articoli.id;


--
-- Name: cloud_calendario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloud_calendario (
    id integer NOT NULL,
    id_cliente integer,
    tipologia_oliva integer,
    quantita_kg numeric(10,2) NOT NULL,
    data_inizio timestamp without time zone NOT NULL,
    data_fine timestamp without time zone NOT NULL,
    id_linea integer,
    stato character varying(15),
    note text,
    id_user integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cloud_calendario_stato_check CHECK (((stato)::text = ANY ((ARRAY['Provvisorio'::character varying, 'Confermato'::character varying, 'Modificato'::character varying])::text[])))
);


ALTER TABLE public.cloud_calendario OWNER TO postgres;

--
-- Name: cloud_calendario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cloud_calendario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cloud_calendario_id_seq OWNER TO postgres;

--
-- Name: cloud_calendario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cloud_calendario_id_seq OWNED BY public.cloud_calendario.id;


--
-- Name: cloud_cisterne; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloud_cisterne (
    id character varying(20) NOT NULL,
    descrizione character varying(40) NOT NULL,
    id_magazzino integer,
    capacita numeric(10,2),
    giacenza numeric(10,2),
    id_articolo integer,
    id_codicesoggetto integer,
    flagobso boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cloud_cisterne OWNER TO postgres;

--
-- Name: cloud_linee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloud_linee (
    id integer NOT NULL,
    descrizione character varying(20) NOT NULL,
    id_magazzino integer,
    cap_oraria numeric(10,2),
    id_oliva integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cloud_linee OWNER TO postgres;

--
-- Name: cloud_linee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cloud_linee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cloud_linee_id_seq OWNER TO postgres;

--
-- Name: cloud_linee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cloud_linee_id_seq OWNED BY public.cloud_linee.id;


--
-- Name: cloud_listini; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloud_listini (
    id integer NOT NULL,
    descrizione character varying(40) NOT NULL,
    anno character varying(4),
    data_inizio date,
    data_fine date,
    cod_articolo integer,
    qta_da numeric(10,2),
    qta_a numeric(10,2),
    prezzo numeric(10,2),
    um character varying(5),
    cod_iva integer,
    note character varying(100),
    "flagAttivo" boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cloud_listini OWNER TO postgres;

--
-- Name: cloud_listini_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cloud_listini_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cloud_listini_id_seq OWNER TO postgres;

--
-- Name: cloud_listini_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cloud_listini_id_seq OWNED BY public.cloud_listini.id;


--
-- Name: cloud_magazzini; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloud_magazzini (
    id integer NOT NULL,
    descrizione character varying(20) NOT NULL,
    cod_sian integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cloud_magazzini OWNER TO postgres;

--
-- Name: cloud_magazzini_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cloud_magazzini_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cloud_magazzini_id_seq OWNER TO postgres;

--
-- Name: cloud_magazzini_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cloud_magazzini_id_seq OWNED BY public.cloud_magazzini.id;


--
-- Name: cloud_movimenti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloud_movimenti (
    id integer NOT NULL,
    nome_file character varying(50),
    campo01 character varying(16),
    campo02 numeric(10,0),
    campo03 numeric(10,0),
    campo04 date,
    campo05 character varying(10),
    campo06 date,
    campo07 character varying(10),
    campo08 numeric(10,0),
    campo09 numeric(10,0),
    campo10 numeric(13,0),
    campo11 numeric(13,0),
    campo12 character varying(10),
    campo13 character varying(10),
    campo14 numeric(10,0),
    campo15 numeric(2,0),
    campo16 numeric(2,0),
    campo17 numeric(2,0),
    campo18 character varying(80),
    campo19 numeric(2,0),
    campo20 character varying(80),
    campo21 numeric(13,0),
    campo22 numeric(13,0),
    campo23 numeric(13,0),
    campo24 numeric(13,0),
    campo25 numeric(13,0),
    campo26 numeric(13,0),
    campo27 numeric(13,0),
    campo28 character varying(20),
    campo29 character varying(300),
    campo30 character varying(1),
    campo31 character varying(1),
    campo32 character varying(1),
    campo33 character varying(1),
    campo34 character varying(1),
    campo35 character varying(1),
    campo36 character varying(1),
    campo37 character varying(1),
    campo38 character varying(1),
    campo39 character varying(1),
    campo40 character varying(1),
    campo41 timestamp without time zone,
    campo42 timestamp without time zone,
    campo43 numeric(4,0),
    campo44 character varying(10),
    campo45 character varying(10),
    campo46 numeric(13,0),
    campo47 date,
    campo48 character varying(10),
    campo49 character varying(1),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cloud_movimenti OWNER TO postgres;

--
-- Name: cloud_movimenti_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cloud_movimenti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cloud_movimenti_id_seq OWNER TO postgres;

--
-- Name: cloud_movimenti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cloud_movimenti_id_seq OWNED BY public.cloud_movimenti.id;


--
-- Name: cloud_soggetti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloud_soggetti (
    id integer NOT NULL,
    descrizione character varying(40) NOT NULL,
    indirizzo character varying(60),
    cap character varying(8),
    comune integer,
    provincia integer,
    nazione integer,
    id_sian integer,
    telefono character varying(20),
    cellulare character varying(20),
    mail character varying(60),
    partiva character varying(12),
    codfisc character varying(16),
    "flagForn" boolean DEFAULT false,
    flagdoc boolean DEFAULT false,
    olivedef integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cloud_soggetti OWNER TO postgres;

--
-- Name: cloud_soggetti_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cloud_soggetti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cloud_soggetti_id_seq OWNER TO postgres;

--
-- Name: cloud_soggetti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cloud_soggetti_id_seq OWNED BY public.cloud_soggetti.id;


--
-- Name: cloud_terreni; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloud_terreni (
    id integer NOT NULL,
    cod_cli integer,
    annata character varying(5),
    orig_spec integer,
    cod_catastale character varying(10),
    metriq numeric,
    ettari numeric,
    qtamaxq numeric,
    num_alberi integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cloud_terreni OWNER TO postgres;

--
-- Name: cloud_terreni_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cloud_terreni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cloud_terreni_id_seq OWNER TO postgres;

--
-- Name: cloud_terreni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cloud_terreni_id_seq OWNED BY public.cloud_terreni.id;


--
-- Name: codici_iva; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.codici_iva (
    id integer NOT NULL,
    percen integer NOT NULL
);


ALTER TABLE public.codici_iva OWNER TO postgres;

--
-- Name: comuni; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comuni (
    id integer NOT NULL,
    descrizione character(60) NOT NULL,
    cod_istat integer NOT NULL,
    cod_cf character(4) NOT NULL
);


ALTER TABLE public.comuni OWNER TO postgres;

--
-- Name: comuni_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comuni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comuni_id_seq OWNER TO postgres;

--
-- Name: comuni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comuni_id_seq OWNED BY public.comuni.id;


--
-- Name: config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.config (
    id integer NOT NULL,
    chiave character varying(50) NOT NULL,
    valore character varying(255) NOT NULL,
    descrizione character varying(255),
    categoria character varying(50),
    data_creazione timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_modifica timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.config OWNER TO postgres;

--
-- Name: config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.config_id_seq OWNER TO postgres;

--
-- Name: config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.config_id_seq OWNED BY public.config.id;


--
-- Name: frant_articoli; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.frant_articoli (
    id integer NOT NULL,
    tipologia character(2),
    descrizione character(60) NOT NULL,
    categ_olio integer,
    macroarea integer,
    origispeci character(20),
    flag_ps boolean DEFAULT false,
    flag_ef boolean DEFAULT false,
    flag_bio boolean DEFAULT false,
    flag_conv boolean DEFAULT false,
    cod_iva integer,
    varieta character(40),
    flag_in_uso boolean DEFAULT true,
    unita_misura character(3),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.frant_articoli OWNER TO postgres;

--
-- Name: frant_articoli_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.frant_articoli_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.frant_articoli_id_seq OWNER TO postgres;

--
-- Name: frant_articoli_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.frant_articoli_id_seq OWNED BY public.frant_articoli.id;


--
-- Name: frant_calendario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.frant_calendario (
    id integer NOT NULL,
    id_cliente integer,
    tipologia_oliva integer,
    quantita_kg numeric(10,2) NOT NULL,
    data_inizio timestamp without time zone NOT NULL,
    data_fine timestamp without time zone NOT NULL,
    id_linea integer,
    stato character varying(15),
    note text,
    id_user integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT frant_calendario_stato_check CHECK (((stato)::text = ANY ((ARRAY['Provvisorio'::character varying, 'Confermato'::character varying, 'Modificato'::character varying])::text[])))
);


ALTER TABLE public.frant_calendario OWNER TO postgres;

--
-- Name: frant_calendario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.frant_calendario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.frant_calendario_id_seq OWNER TO postgres;

--
-- Name: frant_calendario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.frant_calendario_id_seq OWNED BY public.frant_calendario.id;


--
-- Name: frant_cisterne; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.frant_cisterne (
    id character varying(20) NOT NULL,
    descrizione character varying(40) NOT NULL,
    id_magazzino integer,
    capacita numeric(10,2),
    giacenza numeric(10,2),
    id_articolo integer,
    id_codicesoggetto integer,
    flagobso boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.frant_cisterne OWNER TO postgres;

--
-- Name: frant_linee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.frant_linee (
    id integer NOT NULL,
    descrizione character varying(20) NOT NULL,
    id_magazzino integer,
    cap_oraria numeric(10,2),
    id_oliva integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.frant_linee OWNER TO postgres;

--
-- Name: frant_linee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.frant_linee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.frant_linee_id_seq OWNER TO postgres;

--
-- Name: frant_linee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.frant_linee_id_seq OWNED BY public.frant_linee.id;


--
-- Name: frant_listini; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.frant_listini (
    id integer NOT NULL,
    descrizione character varying(40) NOT NULL,
    anno character varying(4),
    data_inizio date,
    data_fine date,
    cod_articolo integer,
    qta_da numeric(10,2),
    qta_a numeric(10,2),
    prezzo numeric(10,2),
    um character varying(5),
    cod_iva integer,
    note character varying(100),
    "flagAttivo" boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.frant_listini OWNER TO postgres;

--
-- Name: frant_listini_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.frant_listini_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.frant_listini_id_seq OWNER TO postgres;

--
-- Name: frant_listini_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.frant_listini_id_seq OWNED BY public.frant_listini.id;


--
-- Name: frant_magazzini; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.frant_magazzini (
    id integer NOT NULL,
    descrizione character varying(20) NOT NULL,
    cod_sian integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.frant_magazzini OWNER TO postgres;

--
-- Name: frant_magazzini_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.frant_magazzini_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.frant_magazzini_id_seq OWNER TO postgres;

--
-- Name: frant_magazzini_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.frant_magazzini_id_seq OWNED BY public.frant_magazzini.id;


--
-- Name: frant_movimenti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.frant_movimenti (
    id integer NOT NULL,
    nome_file character varying(50),
    campo01 character varying(16),
    campo02 numeric(10,0),
    campo03 numeric(10,0),
    campo04 date,
    campo05 character varying(10),
    campo06 date,
    campo07 character varying(10),
    campo08 numeric(10,0),
    campo09 numeric(10,0),
    campo10 numeric(13,0),
    campo11 numeric(13,0),
    campo12 character varying(10),
    campo13 character varying(10),
    campo14 numeric(10,0),
    campo15 numeric(2,0),
    campo16 numeric(2,0),
    campo17 numeric(2,0),
    campo18 character varying(80),
    campo19 numeric(2,0),
    campo20 character varying(80),
    campo21 numeric(13,0),
    campo22 numeric(13,0),
    campo23 numeric(13,0),
    campo24 numeric(13,0),
    campo25 numeric(13,0),
    campo26 numeric(13,0),
    campo27 numeric(13,0),
    campo28 character varying(20),
    campo29 character varying(300),
    campo30 character varying(1),
    campo31 character varying(1),
    campo32 character varying(1),
    campo33 character varying(1),
    campo34 character varying(1),
    campo35 character varying(1),
    campo36 character varying(1),
    campo37 character varying(1),
    campo38 character varying(1),
    campo39 character varying(1),
    campo40 character varying(1),
    campo41 timestamp without time zone,
    campo42 timestamp without time zone,
    campo43 numeric(4,0),
    campo44 character varying(10),
    campo45 character varying(10),
    campo46 numeric(13,0),
    campo47 date,
    campo48 character varying(10),
    campo49 character varying(1),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.frant_movimenti OWNER TO postgres;

--
-- Name: frant_movimenti_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.frant_movimenti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.frant_movimenti_id_seq OWNER TO postgres;

--
-- Name: frant_movimenti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.frant_movimenti_id_seq OWNED BY public.frant_movimenti.id;


--
-- Name: frant_soggetti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.frant_soggetti (
    id integer NOT NULL,
    descrizione character varying(40) NOT NULL,
    indirizzo character varying(60),
    cap character varying(8),
    comune integer,
    provincia integer,
    nazione integer,
    id_sian integer,
    telefono character varying(20),
    cellulare character varying(20),
    mail character varying(60),
    partiva character varying(12),
    codfisc character varying(16),
    "flagForn" boolean DEFAULT false,
    flagdoc boolean DEFAULT false,
    olivedef integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.frant_soggetti OWNER TO postgres;

--
-- Name: frant_soggetti_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.frant_soggetti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.frant_soggetti_id_seq OWNER TO postgres;

--
-- Name: frant_soggetti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.frant_soggetti_id_seq OWNED BY public.frant_soggetti.id;


--
-- Name: frant_terreni; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.frant_terreni (
    id integer NOT NULL,
    cod_cli integer,
    annata character varying(5),
    orig_spec integer,
    cod_catastale character varying(10),
    metriq numeric,
    ettari numeric,
    qtamaxq numeric,
    num_alberi integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.frant_terreni OWNER TO postgres;

--
-- Name: frant_terreni_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.frant_terreni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.frant_terreni_id_seq OWNER TO postgres;

--
-- Name: frant_terreni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.frant_terreni_id_seq OWNED BY public.frant_terreni.id;


--
-- Name: macroaree; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.macroaree (
    id integer NOT NULL,
    acronimo character(5) NOT NULL,
    descrizione character varying(200) NOT NULL,
    flag_orig boolean DEFAULT false NOT NULL
);


ALTER TABLE public.macroaree OWNER TO postgres;

--
-- Name: macroaree_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.macroaree_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.macroaree_id_seq OWNER TO postgres;

--
-- Name: macroaree_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.macroaree_id_seq OWNED BY public.macroaree.id;


--
-- Name: nazioni; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nazioni (
    id integer NOT NULL,
    cod_nazione character(3) NOT NULL,
    descrizione character(60) NOT NULL,
    cod_istat character(3) NOT NULL
);


ALTER TABLE public.nazioni OWNER TO postgres;

--
-- Name: nazioni_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nazioni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nazioni_id_seq OWNER TO postgres;

--
-- Name: nazioni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nazioni_id_seq OWNED BY public.nazioni.id;


--
-- Name: olive_to_oli; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.olive_to_oli (
    id integer NOT NULL,
    cod_olive integer NOT NULL,
    cod_olio integer NOT NULL,
    flag_default boolean DEFAULT false NOT NULL
);


ALTER TABLE public.olive_to_oli OWNER TO postgres;

--
-- Name: olive_to_oli_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.olive_to_oli_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.olive_to_oli_id_seq OWNER TO postgres;

--
-- Name: olive_to_oli_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.olive_to_oli_id_seq OWNED BY public.olive_to_oli.id;


--
-- Name: origini_specifiche; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.origini_specifiche (
    id integer NOT NULL,
    acronimo character(3) NOT NULL,
    descrizione character varying(200) NOT NULL,
    flag_dop boolean DEFAULT false NOT NULL,
    flag_raccolta boolean DEFAULT false NOT NULL,
    flag_molitura boolean DEFAULT false NOT NULL,
    flag_annata boolean DEFAULT false NOT NULL,
    flag_colla_da boolean DEFAULT false NOT NULL,
    flag_colla_a boolean DEFAULT false NOT NULL,
    flag_capacita boolean DEFAULT false NOT NULL,
    flag_certifi boolean DEFAULT false NOT NULL
);


ALTER TABLE public.origini_specifiche OWNER TO postgres;

--
-- Name: origini_specifiche_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.origini_specifiche_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.origini_specifiche_id_seq OWNER TO postgres;

--
-- Name: origini_specifiche_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.origini_specifiche_id_seq OWNED BY public.origini_specifiche.id;


--
-- Name: province; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.province (
    id integer NOT NULL,
    descrizione character(60) NOT NULL,
    targa character(2) NOT NULL
);


ALTER TABLE public.province OWNER TO postgres;

--
-- Name: province_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.province_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.province_id_seq OWNER TO postgres;

--
-- Name: province_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.province_id_seq OWNED BY public.province.id;


--
-- Name: syslog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.syslog (
    id integer NOT NULL,
    livello character varying(10) NOT NULL,
    messaggio character varying(255) NOT NULL,
    dettagli text,
    user_id integer,
    ip_address character varying(45),
    data timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.syslog OWNER TO postgres;

--
-- Name: syslog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.syslog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.syslog_id_seq OWNER TO postgres;

--
-- Name: syslog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.syslog_id_seq OWNED BY public.syslog.id;


--
-- Name: user_aziende; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_aziende (
    id integer NOT NULL,
    user_id integer NOT NULL,
    azienda_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_aziende OWNER TO postgres;

--
-- Name: user_aziende_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_aziende_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_aziende_id_seq OWNER TO postgres;

--
-- Name: user_aziende_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_aziende_id_seq OWNED BY public.user_aziende.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    nome character(20) NOT NULL,
    cognome character(20) NOT NULL,
    ruolo integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    ultimo_login timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    data_token timestamp(3) without time zone,
    email_verificata boolean DEFAULT false NOT NULL,
    profilo_completo boolean DEFAULT false NOT NULL,
    token_verifica character varying(100)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: articoli id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articoli ALTER COLUMN id SET DEFAULT nextval('public.articoli_id_seq'::regclass);


--
-- Name: aziende id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aziende ALTER COLUMN id SET DEFAULT nextval('public.aziende_id_seq'::regclass);


--
-- Name: categorie_olio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorie_olio ALTER COLUMN id SET DEFAULT nextval('public.categorie_olio_id_seq'::regclass);


--
-- Name: cloud_articoli id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_articoli ALTER COLUMN id SET DEFAULT nextval('public.cloud_articoli_id_seq'::regclass);


--
-- Name: cloud_calendario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_calendario ALTER COLUMN id SET DEFAULT nextval('public.cloud_calendario_id_seq'::regclass);


--
-- Name: cloud_linee id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_linee ALTER COLUMN id SET DEFAULT nextval('public.cloud_linee_id_seq'::regclass);


--
-- Name: cloud_listini id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_listini ALTER COLUMN id SET DEFAULT nextval('public.cloud_listini_id_seq'::regclass);


--
-- Name: cloud_magazzini id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_magazzini ALTER COLUMN id SET DEFAULT nextval('public.cloud_magazzini_id_seq'::regclass);


--
-- Name: cloud_movimenti id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_movimenti ALTER COLUMN id SET DEFAULT nextval('public.cloud_movimenti_id_seq'::regclass);


--
-- Name: cloud_soggetti id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_soggetti ALTER COLUMN id SET DEFAULT nextval('public.cloud_soggetti_id_seq'::regclass);


--
-- Name: cloud_terreni id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_terreni ALTER COLUMN id SET DEFAULT nextval('public.cloud_terreni_id_seq'::regclass);


--
-- Name: comuni id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comuni ALTER COLUMN id SET DEFAULT nextval('public.comuni_id_seq'::regclass);


--
-- Name: config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.config ALTER COLUMN id SET DEFAULT nextval('public.config_id_seq'::regclass);


--
-- Name: frant_articoli id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_articoli ALTER COLUMN id SET DEFAULT nextval('public.frant_articoli_id_seq'::regclass);


--
-- Name: frant_calendario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_calendario ALTER COLUMN id SET DEFAULT nextval('public.frant_calendario_id_seq'::regclass);


--
-- Name: frant_linee id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_linee ALTER COLUMN id SET DEFAULT nextval('public.frant_linee_id_seq'::regclass);


--
-- Name: frant_listini id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_listini ALTER COLUMN id SET DEFAULT nextval('public.frant_listini_id_seq'::regclass);


--
-- Name: frant_magazzini id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_magazzini ALTER COLUMN id SET DEFAULT nextval('public.frant_magazzini_id_seq'::regclass);


--
-- Name: frant_movimenti id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_movimenti ALTER COLUMN id SET DEFAULT nextval('public.frant_movimenti_id_seq'::regclass);


--
-- Name: frant_soggetti id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_soggetti ALTER COLUMN id SET DEFAULT nextval('public.frant_soggetti_id_seq'::regclass);


--
-- Name: frant_terreni id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_terreni ALTER COLUMN id SET DEFAULT nextval('public.frant_terreni_id_seq'::regclass);


--
-- Name: macroaree id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.macroaree ALTER COLUMN id SET DEFAULT nextval('public.macroaree_id_seq'::regclass);


--
-- Name: nazioni id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nazioni ALTER COLUMN id SET DEFAULT nextval('public.nazioni_id_seq'::regclass);


--
-- Name: olive_to_oli id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olive_to_oli ALTER COLUMN id SET DEFAULT nextval('public.olive_to_oli_id_seq'::regclass);


--
-- Name: origini_specifiche id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.origini_specifiche ALTER COLUMN id SET DEFAULT nextval('public.origini_specifiche_id_seq'::regclass);


--
-- Name: province id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.province ALTER COLUMN id SET DEFAULT nextval('public.province_id_seq'::regclass);


--
-- Name: syslog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.syslog ALTER COLUMN id SET DEFAULT nextval('public.syslog_id_seq'::regclass);


--
-- Name: user_aziende id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_aziende ALTER COLUMN id SET DEFAULT nextval('public.user_aziende_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: articoli; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.articoli (id, tipologia, descrizione, categ_olio, macroarea, origispeci, flag_ps, flag_ef, flag_bio, flag_conv, cod_iva, varieta, flag_in_uso, unita_misura) FROM stdin;
1	OL	OLIVE ITALIANE CONVEZIONALI                                 	\N	1	                    	f	f	f	f	4	\N	t	KG 
2	SF	OLIO EVO ITALIANO ESTRATTO A FRESSO                         	2	1	                    	f	t	f	f	4	\N	t	KG 
3	OL	OLIVE ITALIANE BIOLOGICHE                                   	\N	1	                    	f	f	t	f	4	\N	t	KG 
5	SE	MOLITURA                                                    	\N	\N	                    	f	f	f	f	4	\N	f	KG 
6	OL	OLIVE DOP SEGGIANO                                          	\N	13	91                  	f	f	f	f	4	\N	t	KG 
8	OL	OLIVE ITALIANE LECCINO                                      	\N	1	                    	f	f	f	f	4	LECCINO                                 	t	KG 
9	SF	OLIO EVO ITALIANO VARIETA' LECCINO                          	2	1	                    	f	t	f	f	4	LECCINO                                 	t	KG 
4	SF	OLIO ITALIANO BIOLOGICO                                     	2	1	                    	f	t	t	f	4	\N	t	KG 
7	SF	OLIO EVO DOP TOSCANO SEGGIANO                               	2	12	NaN,91              	f	t	f	f	4	\N	t	KG 
\.


--
-- Data for Name: aziende; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aziende (id, descrizione, codice, ultimoidsoggetto, email_mittente, email_password, email_smtp_server, email_smtp_port, email_ssl, email_default_oggetto, email_firma, created_at, updated_at) FROM stdin;
4	Frantoio cloud3                         	cloud	258	frantoio@cloud3.help	!Localcloud3	mail.cloud3.help	465	t	Frantoio Cloud3	Cloud3 Srl	2025-04-18 15:29:46.647	2025-04-19 15:41:21.672
5	Frantoio                                	frant	521	frantoio@cloud3.help	!Localcloud3	mail.cloud3.help	465	t	Frantoio cloud3	Cloud3 Srl	2025-04-19 06:01:06.326	2025-04-19 15:42:27.423
\.


--
-- Data for Name: categorie_olio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorie_olio (id, acronimo, descrizione) FROM stdin;
2	EXT	Olio extra vergine di oliva
1	VER	Olio  vergine di oliva
3	CLA	Olio in attesa di classificazione
4	LAM	Olio lampante
5	OLI	Olio di oliva
6	ORA	Olio di oliva raffinato
7	SOL	Olio di sansa di oliva
8	SOG	Olio di sansa greggio
9	SOR	Olio di sansa raffinato
10	LOR	Olio in lavorazione per produzione olio di oliva raffinato
11	LSR	Olio in lavorazione per produzione olio di sansa di oliva raffinato
12	CAN	TES DA CANCELLARE
\.


--
-- Data for Name: cloud_articoli; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloud_articoli (id, tipologia, descrizione, categ_olio, macroarea, origispeci, flag_ps, flag_ef, flag_bio, flag_conv, cod_iva, varieta, flag_in_uso, unita_misura, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cloud_calendario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloud_calendario (id, id_cliente, tipologia_oliva, quantita_kg, data_inizio, data_fine, id_linea, stato, note, id_user, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cloud_cisterne; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloud_cisterne (id, descrizione, id_magazzino, capacita, giacenza, id_articolo, id_codicesoggetto, flagobso, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cloud_linee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloud_linee (id, descrizione, id_magazzino, cap_oraria, id_oliva, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cloud_listini; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloud_listini (id, descrizione, anno, data_inizio, data_fine, cod_articolo, qta_da, qta_a, prezzo, um, cod_iva, note, "flagAttivo", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cloud_magazzini; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloud_magazzini (id, descrizione, cod_sian, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cloud_movimenti; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloud_movimenti (id, nome_file, campo01, campo02, campo03, campo04, campo05, campo06, campo07, campo08, campo09, campo10, campo11, campo12, campo13, campo14, campo15, campo16, campo17, campo18, campo19, campo20, campo21, campo22, campo23, campo24, campo25, campo26, campo27, campo28, campo29, campo30, campo31, campo32, campo33, campo34, campo35, campo36, campo37, campo38, campo39, campo40, campo41, campo42, campo43, campo44, campo45, campo46, campo47, campo48, campo49, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cloud_soggetti; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloud_soggetti (id, descrizione, indirizzo, cap, comune, provincia, nazione, id_sian, telefono, cellulare, mail, partiva, codfisc, "flagForn", flagdoc, olivedef, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cloud_terreni; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloud_terreni (id, cod_cli, annata, orig_spec, cod_catastale, metriq, ettari, qtamaxq, num_alberi, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: codici_iva; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.codici_iva (id, percen) FROM stdin;
4	4
22	22
10	10
\.


--
-- Data for Name: comuni; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comuni (id, descrizione, cod_istat, cod_cf) FROM stdin;
1	Abano Terme                                                 	1	A001
2	Abbadia Cerreto                                             	1	A004
3	Abbadia Lariana                                             	1	A005
4	Abbadia San Salvatore                                       	1	A006
5	Abbasanta                                                   	1	A007
6	Abbateggio                                                  	1	A008
7	Abbiategrasso                                               	2	A010
8	Abetone                                                     	1	A012
9	Abriola                                                     	1	A013
10	Acate                                                       	1	A014
11	Accadia                                                     	1	A015
12	Acceglio                                                    	1	A016
13	Accettura                                                   	1	A017
14	Acciano                                                     	1	A018
15	Accumoli                                                    	1	A019
16	Acerenza                                                    	2	A020
17	Cermes                                                      	20	A022
18	Acerno                                                      	1	A023
19	Acerra                                                      	1	A024
20	Aci Bonaccorsi                                              	1	A025
21	Aci Castello                                                	2	A026
22	Aci Catena                                                  	3	A027
23	Acireale                                                    	4	A028
24	Aci Sant'Antonio                                            	5	A029
25	Acquacanina                                                 	1	A031
26	Acquafondata                                                	1	A032
27	Acquaformosa                                                	1	A033
28	Acquafredda                                                 	1	A034
29	Acqualagna                                                  	1	A035
30	Acquanegra sul Chiese                                       	1	A038
31	Acquanegra Cremonese                                        	1	A039
32	Acquapendente                                               	1	A040
33	Acquappesa                                                  	2	A041
34	Acquarica del Capo                                          	1	A042
35	Acquaro                                                     	1	A043
36	Acquasanta Terme                                            	1	A044
37	Acquasparta                                                 	1	A045
38	Acquaviva Picena                                            	2	A047
39	Acquaviva delle Fonti                                       	1	A048
40	Acquaviva Platani                                           	1	A049
41	Acquaviva Collecroce                                        	1	A050
42	Acquaviva d'Isernia                                         	1	A051
43	Acqui Terme                                                 	1	A052
44	Acri                                                        	3	A053
45	Acuto                                                       	2	A054
46	Adelfia                                                     	2	A055
47	Adrano                                                      	6	A056
48	Adrara San Martino                                          	1	A057
49	Adrara San Rocco                                            	2	A058
50	Adria                                                       	1	A059
51	Adro                                                        	2	A060
52	Affi                                                        	1	A061
53	Affile                                                      	1	A062
54	Afragola                                                    	2	A064
55	Africo                                                      	1	A065
56	Agazzano                                                    	1	A067
57	Agerola                                                     	3	A068
58	Aggius                                                      	1	A069
59	Agira                                                       	1	A070
60	Agliana                                                     	2	A071
61	Agliano Terme                                               	1	A072
62	AgliŠ                                                       	1	A074
63	Agna                                                        	2	A075
64	Agnadello                                                   	2	A076
65	Agnana Calabra                                              	2	A077
66	Agnone                                                      	2	A080
67	Villa Latina                                                	88	A081
68	Agnosine                                                    	3	A082
69	Agordo                                                      	1	A083
70	Agosta                                                      	2	A084
71	Agra                                                        	1	A085
72	Agrate Brianza                                              	1	A087
73	Agrate Conturbia                                            	1	A088
74	Agrigento                                                   	1	A089
75	Agropoli                                                    	2	A091
76	Agugliano                                                   	1	A092
77	Agugliaro                                                   	1	A093
78	Ayas                                                        	7	A094
79	Aicurzio                                                    	2	A096
80	Aidomaggiore                                                	2	A097
81	Aidone                                                      	2	A098
82	Aielli                                                      	2	A100
83	Aiello del Sabato                                           	1	A101
84	Aiello Calabro                                              	4	A102
85	Aiello del Friuli                                           	1	A103
86	Aieta                                                       	5	A105
87	Ailano                                                      	1	A106
88	Ailoche                                                     	1	A107
89	Aymavilles                                                  	8	A108
90	Airasca                                                     	2	A109
91	Airola                                                      	1	A110
92	Airole                                                      	1	A111
93	Airuno                                                      	2	A112
94	Aisone                                                      	2	A113
95	Al… dei Sardi                                               	3	A115
96	Ala                                                         	1	A116
97	Ala di Stura                                                	3	A117
98	Alagna                                                      	1	A118
99	Alagna Valsesia                                             	2	A119
100	Alanno                                                      	2	A120
101	Alano di Piave                                              	2	A121
102	Alassio                                                     	1	A122
103	Alatri                                                      	3	A123
104	Alba                                                        	3	A124
105	Alba Adriatica                                              	1	A125
106	Albagiara                                                   	3	A126
107	Albairate                                                   	5	A127
108	Albanella                                                   	3	A128
109	Albano Sant'Alessandro                                      	3	A129
110	Albano Vercellese                                           	3	A130
111	Albano di Lucania                                           	3	A131
112	Albano Laziale                                              	3	A132
113	Albaredo Arnaboldi                                          	2	A134
114	Albaredo per San Marco                                      	1	A135
115	Albaredo d'Adige                                            	2	A137
116	Albareto                                                    	1	A138
117	Albaretto della Torre                                       	4	A139
118	Albavilla                                                   	3	A143
119	Albenga                                                     	2	A145
120	Albera Ligure                                               	2	A146
121	Alberobello                                                 	3	A149
122	Alberona                                                    	2	A150
123	Albese con Cassano                                          	4	A153
124	Albettone                                                   	2	A154
125	Albi                                                        	2	A155
126	Albiano d'Ivrea                                             	4	A157
127	Albiano                                                     	2	A158
128	Albiate                                                     	3	A159
129	Albidona                                                    	6	A160
130	Albignasego                                                 	3	A161
131	Albinea                                                     	1	A162
132	Albino                                                      	4	A163
133	Albiolo                                                     	5	A164
134	Albissola Marina                                            	3	A165
135	Albisola Superiore                                          	4	A166
136	Albizzate                                                   	2	A167
137	Albonese                                                    	3	A171
138	Albosaggia                                                  	2	A172
139	Albugnano                                                   	2	A173
140	Albuzzano                                                   	4	A175
141	Alcamo                                                      	1	A176
142	Alcara li Fusi                                              	1	A177
143	Aldeno                                                      	3	A178
144	Aldino                                                      	1	A179
145	Ales                                                        	4	A180
146	Alessandria della Rocca                                     	2	A181
147	Alessandria                                                 	3	A182
148	Alessandria del Carretto                                    	7	A183
149	Alessano                                                    	2	A184
150	Alezio                                                      	3	A185
151	Alfano                                                      	4	A186
152	Alfedena                                                    	3	A187
153	Alfianello                                                  	4	A188
154	Alfiano Natta                                               	4	A189
155	Alfonsine                                                   	1	A191
156	Alghero                                                     	3	A192
157	Algua                                                       	248	A193
158	Al�                                                         	2	A194
159	Alia                                                        	1	A195
160	Aliano                                                      	2	A196
161	Alice Bel Colle                                             	5	A197
162	Alice Castello                                              	4	A198
163	Alice Superiore                                             	5	A199
164	Alife                                                       	2	A200
165	Al� Terme                                                   	3	A201
166	Alimena                                                     	2	A202
167	Aliminusa                                                   	3	A203
168	Allai                                                       	5	A204
169	Allein                                                      	1	A205
170	Alleghe                                                     	3	A206
171	Allerona                                                    	2	A207
172	Alliste                                                     	4	A208
173	Allumiere                                                   	4	A210
174	Alluvioni Cambi•                                            	6	A211
175	AlmŠ                                                        	5	A214
176	Villa d'AlmŠ                                                	239	A215
177	Almenno San Bartolomeo                                      	6	A216
178	Almenno San Salvatore                                       	7	A217
179	Almese                                                      	6	A218
180	Alonte                                                      	3	A220
181	Alpette                                                     	7	A221
182	Alpignano                                                   	8	A222
183	Alseno                                                      	2	A223
184	Alserio                                                     	6	A224
185	Altamura                                                    	4	A225
186	Altare                                                      	5	A226
187	Altavilla Monferrato                                        	7	A227
188	Altavilla Irpina                                            	2	A228
189	Altavilla Milicia                                           	4	A229
190	Altavilla Silentina                                         	5	A230
191	Altavilla Vicentina                                         	4	A231
192	Altidona                                                    	1	A233
193	Altilia                                                     	8	A234
194	Altino                                                      	1	A235
195	Altissimo                                                   	5	A236
196	Altivole                                                    	1	A237
197	Alto                                                        	5	A238
198	Altofonte                                                   	5	A239
199	Altomonte                                                   	9	A240
200	Altopascio                                                  	1	A241
201	Alviano                                                     	3	A242
202	Alvignano                                                   	3	A243
203	Alvito                                                      	4	A244
204	Alzano Scrivia                                              	8	A245
205	Alzano Lombardo                                             	8	A246
206	Alzate Brianza                                              	7	A249
207	Amalfi                                                      	6	A251
208	Amandola                                                    	2	A252
209	Amantea                                                     	10	A253
210	Amaro                                                       	2	A254
211	Amaroni                                                     	3	A255
212	Amaseno                                                     	5	A256
213	Amato                                                       	4	A257
214	Amatrice                                                    	2	A258
215	Ambivere                                                    	9	A259
216	Amblar                                                      	4	A260
217	Ameglia                                                     	1	A261
218	Amelia                                                      	4	A262
219	Amendolara                                                  	11	A263
220	Ameno                                                       	2	A264
221	Amorosi                                                     	2	A265
222	Cortina d'Ampezzo                                           	16	A266
223	Ampezzo                                                     	3	A267
224	Anacapri                                                    	4	A268
225	Anagni                                                      	6	A269
226	Ancarano                                                    	2	A270
227	Ancona                                                      	2	A271
228	Andali                                                      	5	A272
229	Andalo Valtellino                                           	3	A273
230	Andalo                                                      	5	A274
231	Andezeno                                                    	9	A275
232	Andora                                                      	6	A278
233	Andorno Micca                                               	2	A280
234	Andrano                                                     	5	A281
235	Andrate                                                     	10	A282
236	Andreis                                                     	1	A283
237	Andretta                                                    	3	A284
238	Andria                                                      	1	A285
239	Andriano                                                    	2	A286
240	Anela                                                       	4	A287
241	Anfo                                                        	5	A288
242	Angera                                                      	3	A290
243	Anghiari                                                    	1	A291
244	Angiari                                                     	3	A292
245	Angolo Terme                                                	6	A293
246	Angri                                                       	7	A294
247	Angrogna                                                    	11	A295
248	Anguillara Veneta                                           	4	A296
249	Anguillara Sabazia                                          	5	A297
250	Annicco                                                     	3	A299
251	Castello di Annone                                          	28	A300
252	Annone di Brianza                                           	3	A301
253	Annone Veneto                                               	1	A302
254	Anoia                                                       	3	A303
255	Antegnate                                                   	10	A304
256	Antey-Saint-Andr‚                                           	2	A305
257	Anterivo                                                    	3	A306
258	La Magdeleine                                               	39	A308
259	Anticoli Corrado                                            	6	A309
260	Fiuggi                                                      	35	A310
261	Antignano                                                   	3	A312
262	Antillo                                                     	4	A313
263	Antonimina                                                  	4	A314
264	Antrodoco                                                   	3	A315
265	Antrona Schieranco                                          	1	A317
266	Anversa degli Abruzzi                                       	4	A318
267	Anzano del Parco                                            	9	A319
268	Anzano di Puglia                                            	3	A320
269	Anzi                                                        	4	A321
270	Anzio                                                       	7	A323
271	Anzola dell'Emilia                                          	1	A324
272	Anzola d'Ossola                                             	2	A325
273	Aosta                                                       	3	A326
274	Apecchio                                                    	2	A327
275	Apice                                                       	3	A328
276	Apiro                                                       	2	A329
277	Apollosa                                                    	4	A330
278	Appiano sulla strada del vino                               	4	A332
279	Appiano Gentile                                             	10	A333
280	Appignano                                                   	3	A334
281	Appignano del Tronto                                        	5	A335
282	Aprica                                                      	4	A337
283	Apricale                                                    	2	A338
284	Apricena                                                    	4	A339
285	Aprigliano                                                  	12	A340
286	Aprilia                                                     	1	A341
287	Aquara                                                      	8	A343
288	Aquila d'Arroscia                                           	3	A344
289	L'Aquila                                                    	49	A345
290	Aquileia                                                    	4	A346
291	Aquilonia                                                   	4	A347
292	Aquino                                                      	7	A348
293	Aradeo                                                      	6	A350
294	Aragona                                                     	3	A351
295	Aramengo                                                    	4	A352
296	Arba                                                        	2	A354
297	Tortol�                                                     	18	A355
298	Arborea                                                     	6	A357
299	Arborio                                                     	6	A358
300	Arbus                                                       	1	A359
301	Arcade                                                      	2	A360
302	Arce                                                        	8	A363
303	Arcene                                                      	11	A365
304	Arcevia                                                     	3	A366
305	Archi                                                       	2	A367
306	San Nicol• d'Arcidano                                       	46	A368
307	Arcidosso                                                   	1	A369
308	Arcinazzo Romano                                            	8	A370
309	Arcisate                                                    	4	A371
310	Arco                                                        	6	A372
311	Arcola                                                      	2	A373
312	Arcole                                                      	4	A374
313	Arconate                                                    	7	A375
314	Arcore                                                      	4	A376
315	Arcugnano                                                   	6	A377
316	Ardara                                                      	5	A379
317	Ardauli                                                     	7	A380
318	Ardenno                                                     	5	A382
319	Ardesio                                                     	12	A383
320	Ardore                                                      	5	A385
321	Arena                                                       	2	A386
322	Arena Po                                                    	5	A387
323	Arenzano                                                    	1	A388
324	Arese                                                       	9	A389
325	Arezzo                                                      	2	A390
326	Argegno                                                     	11	A391
327	Argelato                                                    	2	A392
328	Argenta                                                     	1	A393
329	Argentera                                                   	6	A394
330	Arguello                                                    	7	A396
331	Argusto                                                     	7	A397
332	Ari                                                         	3	A398
333	Ariano Irpino                                               	5	A399
334	Ariano nel Polesine                                         	2	A400
335	Ariccia                                                     	9	A401
336	Arielli                                                     	4	A402
337	Arienzo                                                     	4	A403
338	Arignano                                                    	12	A405
339	Aritzo                                                      	1	A407
340	Arizzano                                                    	3	A409
341	Arlena di Castro                                            	2	A412
342	Arluno                                                      	10	A413
343	Armeno                                                      	6	A414
344	Armento                                                     	5	A415
345	Armo                                                        	4	A418
346	Armungia                                                    	2	A419
347	Arnara                                                      	9	A421
348	Arnasco                                                     	7	A422
349	Arnad                                                       	4	A424
350	Arnesano                                                    	7	A425
351	Arola                                                       	4	A427
352	Arona                                                       	8	A429
353	Arosio                                                      	12	A430
354	Arpaia                                                      	5	A431
355	Arpaise                                                     	6	A432
356	Arpino                                                      	10	A433
357	Arqu… Petrarca                                              	5	A434
358	Arqu… Polesine                                              	3	A435
359	Arquata Scrivia                                             	9	A436
360	Arquata del Tronto                                          	6	A437
361	Arre                                                        	6	A438
362	Arrone                                                      	5	A439
363	Arzago d'Adda                                               	13	A440
364	Arsago Seprio                                               	5	A441
365	ArsiŠ                                                       	4	A443
366	Arsiero                                                     	7	A444
367	Arsita                                                      	3	A445
368	Arsoli                                                      	10	A446
369	Arta Terme                                                  	5	A447
370	Artegna                                                     	6	A448
371	Artena                                                      	11	A449
372	Artogne                                                     	7	A451
373	Arvier                                                      	5	A452
374	Arzachena                                                   	4	A453
375	Arzana                                                      	1	A454
376	Arzano                                                      	5	A455
377	Arzene                                                      	3	A456
378	Arzergrande                                                 	7	A458
379	Arzignano                                                   	8	A459
380	Ascea                                                       	9	A460
381	Asciano                                                     	2	A461
382	Ascoli Piceno                                               	7	A462
383	Ascoli Satriano                                             	5	A463
384	Ascrea                                                      	4	A464
385	Asiago                                                      	9	A465
386	Asigliano Vercellese                                        	7	A466
387	Asigliano Veneto                                            	10	A467
388	Sinalunga                                                   	33	A468
389	Asola                                                       	2	A470
390	Asolo                                                       	3	A471
391	Casperia                                                    	12	A472
392	Assago                                                      	11	A473
393	Assemini                                                    	3	A474
394	Assisi                                                      	1	A475
395	Asso                                                        	13	A476
396	Assolo                                                      	8	A477
397	Assoro                                                      	3	A478
398	Asti                                                        	5	A479
399	Asuni                                                       	9	A480
400	Ateleta                                                     	5	A481
401	Atella                                                      	6	A482
402	Atena Lucana                                                	10	A484
403	Atessa                                                      	5	A485
404	Atina                                                       	11	A486
405	Atrani                                                      	11	A487
406	Atri                                                        	4	A488
407	Atripalda                                                   	6	A489
408	Attigliano                                                  	6	A490
409	Attimis                                                     	7	A491
410	Atzara                                                      	3	A492
411	Auditore                                                    	3	A493
412	Augusta                                                     	1	A494
413	Auletta                                                     	12	A495
414	Aulla                                                       	1	A496
415	Aurano                                                      	5	A497
416	Aurigo                                                      	5	A499
417	Auronzo di Cadore                                           	5	A501
418	Ausonia                                                     	12	A502
419	Austis                                                      	4	A503
420	Avegno                                                      	2	A506
421	Avelengo                                                    	5	A507
422	Avella                                                      	7	A508
423	Avellino                                                    	8	A509
424	Averara                                                     	14	A511
425	Aversa                                                      	5	A512
426	Avetrana                                                    	1	A514
427	Avezzano                                                    	6	A515
428	Aviano                                                      	4	A516
429	Aviatico                                                    	15	A517
430	Avigliana                                                   	13	A518
431	Avigliano                                                   	7	A519
432	Avio                                                        	7	A520
433	Avise                                                       	6	A521
434	Avola                                                       	2	A522
435	Avolasca                                                    	10	A523
436	Azeglio                                                     	14	A525
437	Azzanello                                                   	4	A526
438	Azzano d'Asti                                               	6	A527
439	Azzano San Paolo                                            	16	A528
440	Azzano Mella                                                	8	A529
441	Azzano Decimo                                               	5	A530
442	Azzate                                                      	6	A531
443	Azzio                                                       	7	A532
444	Azzone                                                      	17	A533
445	Baceno                                                      	6	A534
446	Bacoli                                                      	6	A535
447	Badalucco                                                   	6	A536
448	Badia                                                       	6	A537
449	Badia Pavese                                                	6	A538
450	Badia Polesine                                              	4	A539
451	Badia Calavena                                              	5	A540
452	Badia Tedalda                                               	3	A541
453	Badolato                                                    	8	A542
454	Bagaladi                                                    	6	A544
455	Bagheria                                                    	6	A546
456	Bagnacavallo                                                	2	A547
457	Bagnaria                                                    	7	A550
458	Bagnara di Romagna                                          	3	A551
459	Bagnara Calabra                                             	7	A552
460	Bagnaria Arsa                                               	8	A553
461	Bagnasco                                                    	8	A555
462	Bagnatica                                                   	18	A557
463	Porretta Terme                                              	49	A558
464	Bagni di Lucca                                              	2	A560
465	Montecatini-Terme                                           	11	A561
466	San Giuliano Terme                                          	31	A562
467	Bagno a Ripoli                                              	1	A564
468	Bagno di Romagna                                            	1	A565
469	Bagnoli Irpino                                              	9	A566
470	Bagnoli del Trigno                                          	3	A567
471	Bagnoli di Sopra                                            	8	A568
472	Bagnolo Mella                                               	9	A569
473	Bagnolo Cremasco                                            	5	A570
474	Bagnolo Piemonte                                            	9	A571
475	Bagnolo del Salento                                         	8	A572
476	Bagnolo in Piano                                            	2	A573
477	Bagnolo di Po                                               	5	A574
478	Bagnolo San Vito                                            	3	A575
479	Bagnone                                                     	2	A576
480	Bagnoregio                                                  	3	A577
481	Bagolino                                                    	10	A578
482	Baia e Latina                                               	6	A579
483	Baiano                                                      	10	A580
484	Bajardo                                                     	7	A581
485	Bairo                                                       	15	A584
486	Baiso                                                       	3	A586
487	Balangero                                                   	16	A587
488	Baldichieri d'Asti                                          	7	A588
489	Baldissero d'Alba                                           	10	A589
490	Baldissero Canavese                                         	17	A590
491	Baldissero Torinese                                         	18	A591
492	Balestrate                                                  	7	A592
493	Balestrino                                                  	8	A593
494	Ballabio                                                    	4	A594
495	Ballao                                                      	4	A597
496	Balme                                                       	19	A599
497	Balmuccia                                                   	8	A600
498	Balocco                                                     	9	A601
499	Balsorano                                                   	7	A603
500	Balvano                                                     	8	A604
501	Balzola                                                     	11	A605
502	Banari                                                      	7	A606
503	Banchette                                                   	20	A607
504	Villa Verde                                                 	73	A609
505	Bannio Anzino                                               	7	A610
506	Banzi                                                       	9	A612
507	Baone                                                       	9	A613
508	Baradili                                                    	10	A614
509	Baragiano                                                   	10	A615
510	Baranello                                                   	2	A616
511	Barano d'Ischia                                             	7	A617
512	Baranzate                                                   	250	A618
513	Barasso                                                     	8	A619
514	Baratili San Pietro                                         	11	A621
515	Barbania                                                    	21	A625
516	Barbara                                                     	4	A626
517	Barbarano Vicentino                                         	11	A627
518	Barbarano Romano                                            	4	A628
519	Barbaresco                                                  	11	A629
520	Barbariga                                                   	11	A630
521	Barbata                                                     	19	A631
522	Barberino di Mugello                                        	2	A632
523	Barberino Val d'Elsa                                        	3	A633
524	Barbianello                                                 	8	A634
525	Barbiano                                                    	7	A635
526	Barbona                                                     	10	A637
527	Barcellona Pozzo di Gotto                                   	5	A638
528	Barchi                                                      	4	A639
529	Barcis                                                      	6	A640
530	Bard                                                        	9	A643
531	Bardello                                                    	9	A645
532	Bardi                                                       	2	A646
533	Bardineto                                                   	9	A647
534	Bardolino                                                   	6	A650
535	Bardonecchia                                                	22	A651
536	Bareggio                                                    	12	A652
537	Barengo                                                     	12	A653
538	Baressa                                                     	12	A655
539	Barete                                                      	8	A656
540	Barga                                                       	3	A657
541	Bargagli                                                    	3	A658
542	Barge                                                       	12	A660
543	Barghe                                                      	12	A661
544	Bari                                                        	6	A662
545	Bari Sardo                                                  	2	A663
546	Bariano                                                     	20	A664
547	Baricella                                                   	3	A665
548	Barile                                                      	11	A666
549	Barisciano                                                  	9	A667
550	Barlassina                                                  	5	A668
551	Barletta                                                    	2	A669
552	Barni                                                       	15	A670
553	Barolo                                                      	13	A671
554	Barone Canavese                                             	23	A673
555	Baronissi                                                   	13	A674
556	Barrafranca                                                 	4	A676
557	Barrali                                                     	5	A677
558	Barrea                                                      	10	A678
559	Barumini                                                    	2	A681
560	Barzago                                                     	5	A683
561	Barzana                                                     	21	A684
562	Barzan•                                                     	6	A686
563	Barzio                                                      	7	A687
564	Basaluzzo                                                   	12	A689
565	BascapŠ                                                     	9	A690
566	Baschi                                                      	7	A691
567	Basciano                                                    	5	A692
568	Baselga di PinŠ                                             	9	A694
569	Baselice                                                    	7	A696
570	Basiano                                                     	14	A697
571	Basic•                                                      	6	A698
572	Basiglio                                                    	15	A699
573	Basiliano                                                   	9	A700
574	Vasanello                                                   	55	A701
575	Bassano Bresciano                                           	13	A702
576	Bassano del Grappa                                          	12	A703
577	Bassano Romano                                              	5	A704
578	Tronzano Lago Maggiore                                      	129	A705
579	Bassano in Teverina                                         	6	A706
580	Bassiano                                                    	2	A707
581	Bassignana                                                  	13	A708
582	Bastia Mondov�                                              	14	A709
583	Bastia Umbra                                                	2	A710
584	Bastida Pancarana                                           	11	A712
585	Bastiglia                                                   	1	A713
586	Battaglia Terme                                             	11	A714
587	Battifollo                                                  	15	A716
588	Battipaglia                                                 	14	A717
589	Battuda                                                     	12	A718
590	Baucina                                                     	8	A719
591	Boville Ernica                                              	14	A720
592	Bauladu                                                     	13	A721
593	Baunei                                                      	3	A722
594	Baveno                                                      	8	A725
595	Bedero Valcuvia                                             	10	A728
596	Bedizzole                                                   	14	A729
597	Bedollo                                                     	11	A730
598	Bedonia                                                     	3	A731
599	Bedulita                                                    	22	A732
600	Bee                                                         	9	A733
601	Beinasco                                                    	24	A734
602	Beinette                                                    	16	A735
603	Belcastro                                                   	9	A736
604	Belfiore                                                    	7	A737
605	Belforte Monferrato                                         	14	A738
606	Belforte del Chienti                                        	4	A739
607	Belforte all'Isauro                                         	5	A740
608	Belgioioso                                                  	13	A741
609	Belgirate                                                   	10	A742
610	Bella                                                       	12	A743
611	Bellano                                                     	8	A745
612	Bellante                                                    	6	A746
613	Bellaria-Igea Marina                                        	1	A747
614	Bellegra                                                    	12	A749
615	Bellino                                                     	17	A750
616	Bellinzago Lombardo                                         	16	A751
617	Bellinzago Novarese                                         	16	A752
618	Bellona                                                     	7	A755
619	Bellosguardo                                                	15	A756
620	Belluno                                                     	6	A757
621	Bellusco                                                    	6	A759
622	Belmonte Piceno                                             	3	A760
623	Belmonte del Sannio                                         	4	A761
624	Belmonte Calabro                                            	13	A762
625	Belmonte Castello                                           	13	A763
626	Belmonte Mezzagno                                           	9	A764
627	Belmonte in Sabina                                          	5	A765
628	Belpasso                                                    	7	A766
629	Belsito                                                     	14	A768
630	Belvedere Ostrense                                          	5	A769
631	Belveglio                                                   	8	A770
632	Lizzano in Belvedere                                        	33	A771
633	Belvedere di Spinello                                       	1	A772
634	Belvedere Marittimo                                         	15	A773
635	Belvedere Langhe                                            	18	A774
636	Belv�                                                       	7	A776
637	Bema                                                        	6	A777
638	Bene Lario                                                  	21	A778
639	Bene Vagienna                                               	19	A779
640	Benestare                                                   	8	A780
641	Benetutti                                                   	8	A781
642	Benevello                                                   	20	A782
643	Benevento                                                   	8	A783
644	Benna                                                       	3	A784
645	Bentivoglio                                                 	5	A785
646	Berbenno                                                    	23	A786
647	Berbenno di Valtellina                                      	7	A787
648	Berceto                                                     	4	A788
649	Berchidda                                                   	6	A789
650	Beregazzo con Figliaro                                      	22	A791
651	Bereguardo                                                  	14	A792
652	Bergamasco                                                  	15	A793
653	Bergamo                                                     	24	A794
654	Bergantino                                                  	6	A795
655	Bergeggi                                                    	10	A796
656	Bergolo                                                     	21	A798
657	Berlingo                                                    	15	A799
658	Bernalda                                                    	3	A801
659	Bernareggio                                                 	7	A802
660	Bernate Ticino                                              	19	A804
661	Bernezzo                                                    	22	A805
662	Berra                                                       	2	A806
663	Bersone                                                     	12	A808
664	Bertinoro                                                   	3	A809
665	Bertiolo                                                    	10	A810
666	Bertonico                                                   	2	A811
667	Berzano di San Pietro                                       	9	A812
668	Berzano di Tortona                                          	16	A813
669	Berzo San Fermo                                             	25	A815
670	Berzo Demo                                                  	16	A816
671	Berzo Inferiore                                             	17	A817
672	Besana in Brianza                                           	8	A818
673	Besano                                                      	11	A819
674	Besate                                                      	22	A820
675	Besenello                                                   	13	A821
676	Besenzone                                                   	3	A823
677	Besnate                                                     	12	A825
678	Besozzo                                                     	13	A826
679	Bessude                                                     	10	A827
680	Bettola                                                     	4	A831
681	Bettona                                                     	3	A832
682	Beura-Cardezza                                              	11	A834
683	Bevagna                                                     	4	A835
684	Beverino                                                    	3	A836
685	Bevilacqua                                                  	8	A837
686	Biancavilla                                                 	8	A841
687	Bianchi                                                     	16	A842
688	Bianco                                                      	9	A843
689	Biandrate                                                   	18	A844
690	Biandronno                                                  	14	A845
691	Bianzano                                                    	26	A846
692	BianzŠ                                                      	11	A847
693	Bianzone                                                    	8	A848
694	Biassono                                                    	9	A849
695	Bibbiano                                                    	4	A850
696	Bibbiena                                                    	4	A851
697	Bibbona                                                     	1	A852
698	Bibiana                                                     	25	A853
699	Biccari                                                     	6	A854
700	Bicinicco                                                   	11	A855
701	Bidon�                                                      	14	A856
702	Blera                                                       	7	A857
703	Biella                                                      	4	A859
704	Bienno                                                      	18	A861
705	Bieno                                                       	15	A863
706	Bientina                                                    	1	A864
707	Bigarello                                                   	4	A866
708	Binago                                                      	23	A870
709	Binasco                                                     	24	A872
710	Binetto                                                     	8	A874
711	Bioglio                                                     	5	A876
712	Bionaz                                                      	10	A877
713	Bione                                                       	19	A878
714	Birori                                                      	8	A880
715	Bisaccia                                                    	11	A881
716	Bisacquino                                                  	10	A882
717	Bisceglie                                                   	3	A883
718	Bisegna                                                     	11	A884
719	Bisenti                                                     	7	A885
720	Bisignano                                                   	17	A887
721	Bistagno                                                    	17	A889
722	Bisuschio                                                   	15	A891
723	Bitetto                                                     	10	A892
724	Bitonto                                                     	11	A893
725	Bitritto                                                    	12	A894
726	Bitti                                                       	9	A895
727	Bivona                                                      	4	A896
728	Bivongi                                                     	10	A897
729	Bizzarone                                                   	24	A898
730	Bleggio Superiore                                           	17	A902
731	Blello                                                      	27	A903
732	Blessagno                                                   	25	A904
733	Blevio                                                      	26	A905
734	Boara Pisani                                                	12	A906
735	Bobbio                                                      	5	A909
736	Bobbio Pellice                                              	26	A910
737	Boca                                                        	19	A911
738	Bocchigliero                                                	18	A912
739	Boccioleto                                                  	14	A914
740	Bocenago                                                    	18	A916
741	Bodio Lomnago                                               	16	A918
742	Boffalora d'Adda                                            	3	A919
743	Boffalora sopra Ticino                                      	26	A920
744	Bogliasco                                                   	4	A922
745	Bognanco                                                    	12	A925
746	Bogogno                                                     	21	A929
747	Bojano                                                      	3	A930
748	Boissano                                                    	11	A931
749	Bolano                                                      	4	A932
750	Bolbeno                                                     	19	A933
751	Bolgare                                                     	28	A937
752	Bollate                                                     	27	A940
753	Bollengo                                                    	27	A941
754	Nova Siri                                                   	18	A942
755	Bologna                                                     	6	A944
756	Bolognano                                                   	3	A945
757	Bolognetta                                                  	11	A946
758	Bolognola                                                   	5	A947
759	Bolotana                                                    	10	A948
760	Bolsena                                                     	8	A949
761	Boltiere                                                    	29	A950
762	Bolzano                                                     	8	A952
763	Bolzano Novarese                                            	22	A953
764	Bolzano Vicentino                                           	13	A954
765	Bomarzo                                                     	9	A955
766	Bomba                                                       	6	A956
767	Bompensiere                                                 	2	A957
768	Bompietro                                                   	12	A958
769	Bomporto                                                    	2	A959
770	Bonarcado                                                   	15	A960
771	Bonassola                                                   	5	A961
772	Bonate Sotto                                                	31	A962
773	Bonate Sopra                                                	30	A963
774	Bonavigo                                                    	9	A964
775	Bondeno                                                     	3	A965
776	Bondo                                                       	20	A967
777	Bondone                                                     	21	A968
778	Bonea                                                       	9	A970
779	Bonefro                                                     	4	A971
780	Bonemerse                                                   	6	A972
781	Bonifati                                                    	19	A973
782	Bonito                                                      	12	A975
783	Bonnanaro                                                   	11	A976
784	Bono                                                        	12	A977
785	Bonorva                                                     	13	A978
786	Bonvicino                                                   	23	A979
787	Borbona                                                     	6	A981
788	Borca di Cadore                                             	7	A982
789	Bordano                                                     	12	A983
790	Bordighera                                                  	8	A984
791	Bordolano                                                   	7	A986
792	Bore                                                        	5	A987
793	Boretto                                                     	5	A988
794	Borgarello                                                  	15	A989
795	Borgaro Torinese                                            	28	A990
796	Borgetto                                                    	13	A991
797	Borghetto di Vara                                           	6	A992
798	Borghetto d'Arroscia                                        	9	A993
799	Borghetto Lodigiano                                         	4	A995
800	Borgo Velino                                                	8	A996
801	Borghetto di Borbera                                        	18	A998
802	Borghetto Santo Spirito                                     	12	A999
803	Borghi                                                      	4	B001
804	Borgia                                                      	11	B002
805	Borgiallo                                                   	29	B003
806	Borgio Verezzi                                              	13	B005
807	Borgo Valsugana                                             	22	B006
808	Borgo a Mozzano                                             	4	B007
809	Borgorose                                                   	7	B008
810	Borgo d'Ale                                                 	15	B009
811	Borgo di Terzo                                              	32	B010
812	Motteggiana                                                 	37	B012
813	Borgofranco sul Po                                          	6	B013
814	Suardi                                                      	154	B014
815	Borgofranco d'Ivrea                                         	30	B015
816	Borgolavezzaro                                              	23	B016
817	Borgo San Giovanni                                          	5	B017
818	Borgomale                                                   	24	B018
819	Borgomanero                                                 	24	B019
820	Borgomaro                                                   	10	B020
821	Borgomasino                                                 	31	B021
822	Borgone Susa                                                	32	B024
823	Borgonovo Val Tidone                                        	6	B025
824	Borgo Pace                                                  	6	B026
825	Borgo Priolo                                                	16	B028
826	Borgoratto Alessandrino                                     	19	B029
827	Borgoratto Mormorolo                                        	17	B030
828	Borgoricco                                                  	13	B031
829	Borgo San Dalmazzo                                          	25	B033
830	Fidenza                                                     	14	B034
831	Borgo San Giacomo                                           	20	B035
832	Borgo San Lorenzo                                           	4	B036
833	Borgo San Martino                                           	20	B037
834	Borgo San Siro                                              	18	B038
835	Borgosatollo                                                	21	B040
836	Borgosesia                                                  	16	B041
837	Borgo Val di Taro                                           	6	B042
838	Borgo Ticino                                                	25	B043
839	Borgo Tossignano                                            	7	B044
840	Borgo Vercelli                                              	17	B046
841	Bormida                                                     	14	B048
842	Bormio                                                      	9	B049
843	Bornasco                                                    	19	B051
844	Borno                                                       	22	B054
845	Boroneddu                                                   	16	B055
846	Borore                                                      	11	B056
847	Borrello                                                    	7	B057
848	Borriana                                                    	6	B058
849	Borso del Grappa                                            	4	B061
850	Bortigali                                                   	12	B062
851	Bortigiadas                                                 	7	B063
852	Borutta                                                     	15	B064
853	Borzonasca                                                  	5	B067
854	Bosa                                                        	79	B068
855	Bosaro                                                      	7	B069
856	Boschi Sant'Anna                                            	10	B070
857	Bosco Marengo                                               	21	B071
858	Bosco Chiesanuova                                           	11	B073
859	Bosconero                                                   	33	B075
860	Boscoreale                                                  	8	B076
861	Boscotrecase                                                	9	B077
862	Bosentino                                                   	23	B078
863	Bosia                                                       	26	B079
864	Bosio                                                       	22	B080
865	Bosisio Parini                                              	9	B081
866	Bosnasco                                                    	20	B082
867	Bossico                                                     	33	B083
868	Bossolasco                                                  	27	B084
869	Botricello                                                  	12	B085
870	Botrugno                                                    	9	B086
871	Bottanuco                                                   	34	B088
872	Botticino                                                   	23	B091
873	Bottidda                                                    	16	B094
874	Bova                                                        	11	B097
875	Bovalino                                                    	12	B098
876	Bova Marina                                                 	13	B099
877	Bovegno                                                     	24	B100
878	Boves                                                       	28	B101
879	Bovezzo                                                     	25	B102
880	Bovino                                                      	7	B104
881	Bovisio-Masciago                                            	10	B105
882	Bovolenta                                                   	14	B106
883	Bovolone                                                    	12	B107
884	Bozzole                                                     	23	B109
885	Bozzolo                                                     	7	B110
886	Bra                                                         	29	B111
887	Bracca                                                      	35	B112
888	Bracciano                                                   	13	B114
889	Bracigliano                                                 	16	B115
890	Braies                                                      	9	B116
891	Brallo di Pregola                                           	21	B117
892	Brancaleone                                                 	14	B118
893	Brandico                                                    	26	B120
894	Brandizzo                                                   	34	B121
895	Branzi                                                      	36	B123
896	Braone                                                      	27	B124
897	Brebbia                                                     	17	B126
898	Breda di Piave                                              	5	B128
899	Castelverde                                                 	26	B129
900	Bregano                                                     	18	B131
901	Breganze                                                    	14	B132
902	Bregnano                                                    	28	B134
903	Breguzzo                                                    	24	B135
904	Breia                                                       	19	B136
905	Brembate                                                    	37	B137
906	Brembate di Sopra                                           	38	B138
907	Brembio                                                     	6	B141
908	Breme                                                       	22	B142
909	Brendola                                                    	15	B143
910	Brenna                                                      	29	B144
911	Brennero                                                    	10	B145
912	Breno                                                       	28	B149
913	Brenta                                                      	19	B150
914	Brentino Belluno                                            	13	B152
915	Brentonico                                                  	25	B153
916	Brenzone sul Garda                                          	14	B154
917	Brescello                                                   	6	B156
918	Brescia                                                     	29	B157
919	Bresimo                                                     	26	B158
920	Bressana Bottarone                                          	23	B159
921	Bressanone                                                  	11	B160
922	Bressanvido                                                 	16	B161
923	Bresso                                                      	32	B162
924	Brez                                                        	27	B165
925	Brezzo di Bedero                                            	20	B166
926	Briaglia                                                    	30	B167
927	Briatico                                                    	3	B169
928	Bricherasio                                                 	35	B171
929	Brienno                                                     	30	B172
930	Brienza                                                     	13	B173
931	Briga Alta                                                  	31	B175
932	Briga Novarese                                              	26	B176
933	Brignano Gera d'Adda                                        	40	B178
934	Brignano-Frascata                                           	24	B179
935	Brindisi                                                    	1	B180
936	Brindisi Montagna                                           	14	B181
937	Brinzio                                                     	21	B182
938	Briona                                                      	27	B183
939	Brione                                                      	30	B184
940	Brione                                                      	28	B185
941	Briosco                                                     	11	B187
942	Brisighella                                                 	4	B188
943	Brissago-Valtravaglia                                       	22	B191
944	Brissogne                                                   	11	B192
945	Brittoli                                                    	4	B193
946	Brivio                                                      	10	B194
947	Broccostella                                                	15	B195
948	Brogliano                                                   	17	B196
949	Brognaturo                                                  	4	B197
950	Brolo                                                       	7	B198
951	Brondello                                                   	32	B200
952	Broni                                                       	24	B201
953	Bronte                                                      	9	B202
954	Bronzolo                                                    	12	B203
955	Brossasco                                                   	33	B204
956	Brosso                                                      	36	B205
957	Brovello-Carpugnino                                         	13	B207
958	Brozolo                                                     	37	B209
959	Brugherio                                                   	12	B212
960	Brugine                                                     	15	B213
961	Brugnato                                                    	7	B214
962	Brugnera                                                    	7	B215
963	Bruino                                                      	38	B216
964	Brumano                                                     	41	B217
965	Brunate                                                     	32	B218
966	Brunello                                                    	23	B219
967	Brunico                                                     	13	B220
968	Bruno                                                       	10	B221
969	Brusaporto                                                  	42	B223
970	Brusasco                                                    	39	B225
971	Brusciano                                                   	10	B227
972	Brusimpiano                                                 	24	B228
973	Brusnengo                                                   	7	B229
974	Brusson                                                     	12	B230
975	Bruzolo                                                     	40	B232
976	Bruzzano Zeffirio                                           	15	B234
977	Bubbiano                                                    	35	B235
978	Bubbio                                                      	11	B236
979	Buccheri                                                    	3	B237
980	Bucchianico                                                 	8	B238
981	Bucciano                                                    	10	B239
982	Buccinasco                                                  	36	B240
983	Buccino                                                     	17	B242
984	Bucine                                                      	5	B243
985	Buddus•                                                     	8	B246
986	Budoia                                                      	8	B247
987	Budoni                                                      	9	B248
988	Budrio                                                      	8	B249
989	Buggerru                                                    	1	B250
990	Buggiano                                                    	3	B251
991	Buglio in Monte                                             	10	B255
992	Bugnara                                                     	12	B256
993	Buguggiate                                                  	25	B258
994	Buja                                                        	13	B259
995	Bulciago                                                    	11	B261
996	Bulgarograsso                                               	34	B262
997	Bultei                                                      	18	B264
998	Bulzi                                                       	19	B265
999	Buonabitacolo                                               	18	B266
1000	Buonalbergo                                                 	11	B267
1001	Montebello sul Sangro                                       	9	B268
1002	Buonconvento                                                	3	B269
1003	Buonvicino                                                  	20	B270
1004	Burago di Molgora                                           	13	B272
1005	Burcei                                                      	8	B274
1006	Burgio                                                      	5	B275
1007	Burgos                                                      	20	B276
1008	Buriasco                                                    	41	B278
1009	Burolo                                                      	42	B279
1010	Buronzo                                                     	21	B280
1011	Busachi                                                     	17	B281
1012	Busalla                                                     	6	B282
1013	Busana                                                      	7	B283
1014	Busano                                                      	43	B284
1015	Busca                                                       	34	B285
1016	Buscate                                                     	38	B286
1017	Buscemi                                                     	4	B287
1018	Buseto Palizzolo                                            	2	B288
1019	Busnago                                                     	51	B289
1020	Bussero                                                     	40	B292
1021	Busseto                                                     	7	B293
1022	Bussi sul Tirino                                            	5	B294
1023	Busso                                                       	5	B295
1024	Bussolengo                                                  	15	B296
1025	Bussoleno                                                   	44	B297
1026	Busto Arsizio                                               	26	B300
1027	Busto Garolfo                                               	41	B301
1028	Butera                                                      	3	B302
1029	Buti                                                        	2	B303
1030	Buttapietra                                                 	16	B304
1031	Buttigliera Alta                                            	45	B305
1032	Buttigliera d'Asti                                          	12	B306
1033	Buttrio                                                     	14	B309
1034	San Paolo d'Argon                                           	189	B310
1035	Cabella Ligure                                              	25	B311
1036	Castello Cabiaglio                                          	43	B312
1037	Cabiate                                                     	35	B313
1038	Cabras                                                      	18	B314
1039	Caccamo                                                     	14	B315
1040	Poggio Sannita                                              	37	B317
1041	Caccuri                                                     	2	B319
1042	Ca' d'Andrea                                                	8	B320
1043	Cadegliano-Viconago                                         	27	B326
1044	Cadelbosco di Sopra                                         	8	B328
1045	Cadeo                                                       	7	B332
1046	Caderzone Terme                                             	29	B335
1047	Cadoneghe                                                   	16	B345
1048	Cadorago                                                    	36	B346
1049	Cadrezzate                                                  	28	B347
1050	Caerano di San Marco                                        	6	B349
1051	Cafasse                                                     	46	B350
1052	Caggiano                                                    	19	B351
1053	Cagli                                                       	7	B352
1054	Cagliari                                                    	9	B354
1055	Caglio                                                      	37	B355
1056	Cagnano Varano                                              	8	B357
1057	Cagnano Amiterno                                            	13	B358
1058	Cagno                                                       	38	B359
1059	Cagn•                                                       	30	B360
1060	Caianello                                                   	8	B361
1061	Caiazzo                                                     	9	B362
1062	Caines                                                      	14	B364
1063	Caino                                                       	31	B365
1064	Caiolo                                                      	11	B366
1065	Cairano                                                     	13	B367
1066	Cairate                                                     	29	B368
1067	Cairo Montenotte                                            	15	B369
1068	Caivano                                                     	11	B371
1069	Calabritto                                                  	14	B374
1070	Calalzo di Cadore                                           	8	B375
1071	Calamandrana                                                	13	B376
1072	Calamonaci                                                  	6	B377
1073	Calangianus                                                 	10	B378
1074	Calanna                                                     	16	B379
1075	Calasca-Castiglione                                         	14	B380
1076	Calascibetta                                                	5	B381
1077	Calascio                                                    	14	B382
1078	Calasetta                                                   	2	B383
1079	Calatabiano                                                 	10	B384
1080	Calatafimi-Segesta                                          	3	B385
1081	Calavino                                                    	31	B386
1082	Lungavilla                                                  	84	B387
1083	Calcata                                                     	10	B388
1084	Calceranica al Lago                                         	32	B389
1085	Calci                                                       	3	B390
1086	Calciano                                                    	4	B391
1087	Calcinaia                                                   	4	B392
1088	Calcinate                                                   	43	B393
1089	Calcinato                                                   	32	B394
1090	Calcio                                                      	44	B395
1091	Calco                                                       	12	B396
1092	Caldaro sulla strada del vino                               	15	B397
1093	Caldarola                                                   	6	B398
1094	Calderara di Reno                                           	9	B399
1095	Caldes                                                      	33	B400
1096	Caldiero                                                    	17	B402
1097	Caldogno                                                    	18	B403
1098	Caldonazzo                                                  	34	B404
1099	Calendasco                                                  	8	B405
1100	Calenzano                                                   	5	B406
1101	Calestano                                                   	8	B408
1102	Calice Ligure                                               	16	B409
1103	Calice al Cornoviglio                                       	8	B410
1104	Calimera                                                    	10	B413
1105	Calitri                                                     	15	B415
1106	Calizzano                                                   	17	B416
1107	Callabiana                                                  	8	B417
1108	Calliano                                                    	14	B418
1109	Calliano                                                    	35	B419
1110	Calolziocorte                                               	13	B423
1111	Calopezzati                                                 	21	B424
1112	Calosso                                                     	15	B425
1113	Caloveto                                                    	22	B426
1114	Caltabellotta                                               	7	B427
1115	Caltagirone                                                 	11	B428
1116	Caltanissetta                                               	4	B429
1117	Caltavuturo                                                 	15	B430
1118	Caltignaga                                                  	30	B431
1119	Calto                                                       	8	B432
1120	Caltrano                                                    	19	B433
1121	Calusco d'Adda                                              	46	B434
1122	Caluso                                                      	47	B435
1123	Calvagese della Riviera                                     	33	B436
1124	Calvanico                                                   	20	B437
1125	Calvatone                                                   	9	B439
1126	Calvello                                                    	15	B440
1127	Calvene                                                     	20	B441
1128	Calvenzano                                                  	47	B442
1129	Calvera                                                     	16	B443
1130	Calvi                                                       	12	B444
1131	Calvi Risorta                                               	10	B445
1132	Calvi dell'Umbria                                           	8	B446
1133	Calvignano                                                  	25	B447
1134	Calvignasco                                                 	42	B448
1135	Calvisano                                                   	34	B450
1136	Calvizzano                                                  	12	B452
1137	Camagna Monferrato                                          	26	B453
1138	Camaiore                                                    	5	B455
1139	Camairago                                                   	7	B456
1140	Camandona                                                   	9	B457
1141	Camastra                                                    	8	B460
1142	Cambiago                                                    	44	B461
1143	Cambiano                                                    	48	B462
1144	Cambiasca                                                   	15	B463
1145	Camburzano                                                  	10	B465
1146	Sant'Elena Sannita                                          	47	B466
1147	Camerana                                                    	35	B467
1148	Camerano                                                    	6	B468
1149	Camerano Casasco                                            	16	B469
1150	Camerata Picena                                             	7	B470
1151	Camerata Cornello                                           	48	B471
1152	Camerata Nuova                                              	14	B472
1153	Cameri                                                      	32	B473
1154	Camerino                                                    	7	B474
1155	Camerota                                                    	21	B476
1156	Camigliano                                                  	11	B477
1157	Caminata                                                    	9	B479
1158	Camini                                                      	17	B481
1159	Camino                                                      	27	B482
1160	Camino al Tagliamento                                       	15	B483
1161	Camisano                                                    	10	B484
1162	Camisano Vicentino                                          	21	B485
1163	Cammarata                                                   	9	B486
1164	Camo                                                        	36	B489
1165	Camogli                                                     	7	B490
1166	Chamois                                                     	16	B491
1167	Campagna                                                    	22	B492
1168	Campagna Lupia                                              	2	B493
1169	Castel Campagnano                                           	23	B494
1170	Campagnano di Roma                                          	15	B496
1171	Campagnatico                                                	2	B497
1172	Campagnola Cremasca                                         	11	B498
1173	Campagnola Emilia                                           	9	B499
1174	Campana                                                     	23	B500
1175	Camparada                                                   	14	B501
1176	Campegine                                                   	10	B502
1177	Campello sul Clitunno                                       	5	B504
1178	Campertogno                                                 	25	B505
1179	Campi Salentina                                             	11	B506
1180	Campi Bisenzio                                              	6	B507
1181	Campiglia Cervo                                             	11	B508
1182	Campiglia Marittima                                         	2	B509
1183	Valprato Soana                                              	288	B510
1184	Campiglia dei Berici                                        	22	B511
1185	Campiglione Fenile                                          	49	B512
1186	Campione d'Italia                                           	40	B513
1187	Campitello di Fassa                                         	36	B514
1188	Campli                                                      	8	B515
1189	Campo Calabro                                               	18	B516
1190	Campobasso                                                  	6	B519
1191	Campobello di Licata                                        	10	B520
1192	Campobello di Mazara                                        	4	B521
1193	Campochiaro                                                 	7	B522
1194	Campodarsego                                                	17	B524
1195	Campodenno                                                  	37	B525
1196	Campo di Giove                                              	15	B526
1197	Campodimele                                                 	3	B527
1198	Campodipietra                                               	8	B528
1199	Campo di Trens                                              	16	B529
1200	Campodolcino                                                	12	B530
1201	Campodoro                                                   	18	B531
1202	Campofelice di Roccella                                     	17	B532
1203	Campofelice di Fitalia                                      	16	B533
1204	Campofilone                                                 	4	B534
1205	Campofiorito                                                	18	B535
1206	Campoformido                                                	16	B536
1207	Campofranco                                                 	5	B537
1208	Campo Ligure                                                	8	B538
1209	Campogalliano                                               	3	B539
1210	Champorcher                                                 	18	B540
1211	Campolattaro                                                	13	B541
1212	Campoli del Monte Taburno                                   	14	B542
1213	Campoli Appennino                                           	16	B543
1214	Campolieto                                                  	9	B544
1215	Campolongo Maggiore                                         	3	B546
1216	Campolongo sul Brenta                                       	23	B547
1217	Campomaggiore                                               	17	B549
1218	Campomarino                                                 	10	B550
1219	Campomorone                                                 	9	B551
1220	Campo nell'Elba                                             	3	B553
1221	Camponogara                                                 	4	B554
1222	Campora                                                     	23	B555
1223	Camporeale                                                  	19	B556
1224	Camporgiano                                                 	6	B557
1225	Camporosso                                                  	11	B559
1226	Camporotondo Etneo                                          	12	B561
1227	Camporotondo di Fiastrone                                   	8	B562
1228	Camposampiero                                               	19	B563
1229	Campo San Martino                                           	20	B564
1230	Camposano                                                   	13	B565
1231	Camposanto                                                  	4	B566
1232	Campospinoso                                                	26	B567
1233	Campotosto                                                  	16	B569
1234	Campo Tures                                                 	17	B570
1235	Camugnano                                                   	10	B572
1236	Canale                                                      	37	B573
1237	Canale d'Agordo                                             	23	B574
1238	Canale Monterano                                            	16	B576
1239	Canal San Bovo                                              	38	B577
1240	Canaro                                                      	9	B578
1241	Canazei                                                     	39	B579
1242	Cancellara                                                  	18	B580
1243	Cancello ed Arnone                                          	12	B581
1244	Canda                                                       	10	B582
1245	Candela                                                     	9	B584
1246	Candelo                                                     	12	B586
1247	Candia Lomellina                                            	27	B587
1248	Candia Canavese                                             	50	B588
1249	Candiana                                                    	21	B589
1250	Candida                                                     	16	B590
1251	Candidoni                                                   	19	B591
1252	Candiolo                                                    	51	B592
1253	Canegrate                                                   	46	B593
1254	Canelli                                                     	17	B594
1255	Orvinio                                                     	47	B595
1256	Canepina                                                    	11	B597
1257	Caneva                                                      	9	B598
1258	Canevino                                                    	28	B599
1259	Canicatt�                                                   	11	B602
1260	Canicattini Bagni                                           	5	B603
1261	Canino                                                      	12	B604
1262	Canischio                                                   	52	B605
1263	Canistro                                                    	17	B606
1264	Canna                                                       	24	B607
1265	Cannalonga                                                  	24	B608
1266	Cannara                                                     	6	B609
1267	Cannero Riviera                                             	16	B610
1268	Canneto sull'Oglio                                          	8	B612
1269	Canneto Pavese                                              	29	B613
1270	Cannobio                                                    	17	B615
1271	Cannole                                                     	12	B616
1272	Canolo                                                      	20	B617
1273	Canonica d'Adda                                             	49	B618
1274	Canosa di Puglia                                            	4	B619
1275	Canosa Sannita                                              	10	B620
1276	Canosio                                                     	38	B621
1277	Cansano                                                     	18	B624
1278	Cantagallo                                                  	1	B626
1279	Cantalice                                                   	9	B627
1280	Cantalupa                                                   	53	B628
1281	Cantalupo Ligure                                            	28	B629
1282	Cantalupo nel Sannio                                        	5	B630
1283	Cantalupo in Sabina                                         	10	B631
1284	Mandela                                                     	53	B632
1285	Cantarana                                                   	18	B633
1286	Cantello                                                    	30	B634
1287	Canterano                                                   	17	B635
1288	Cantiano                                                    	8	B636
1289	Cantoira                                                    	54	B637
1290	Cant—                                                       	41	B639
1291	Canzano                                                     	9	B640
1292	Canzo                                                       	42	B641
1293	Caorle                                                      	5	B642
1294	Caorso                                                      	10	B643
1295	Capaccio                                                    	25	B644
1296	Capaci                                                      	20	B645
1297	Capalbio                                                    	3	B646
1298	Capannoli                                                   	5	B647
1299	Capannori                                                   	7	B648
1300	Capena                                                      	18	B649
1301	Capergnanica                                                	12	B650
1302	Capestrano                                                  	19	B651
1303	Capiago Intimiano                                           	43	B653
1304	Capistrano                                                  	5	B655
1305	Capistrello                                                 	20	B656
1306	Capitignano                                                 	21	B658
1307	Capizzi                                                     	8	B660
1308	Capizzone                                                   	50	B661
1309	Ponte nelle Alpi                                            	40	B662
1310	Capodimonte                                                 	13	B663
1311	Capo di Ponte                                               	35	B664
1312	Capo d'Orlando                                              	9	B666
1313	Capodrise                                                   	13	B667
1314	Capoliveri                                                  	4	B669
1315	Capolona                                                    	6	B670
1316	Caponago                                                    	52	B671
1317	Caporciano                                                  	22	B672
1318	Caposele                                                    	17	B674
1319	Capoterra                                                   	11	B675
1320	Capovalle                                                   	36	B676
1321	Cappadocia                                                  	23	B677
1322	Cappella Maggiore                                           	7	B678
1323	Cappella Cantone                                            	13	B679
1324	Cappella de' Picenardi                                      	14	B680
1325	Cappelle sul Tavo                                           	6	B681
1326	Capracotta                                                  	6	B682
1327	Capraia e Limite                                            	8	B684
1328	Capraia Isola                                               	5	B685
1329	Capralba                                                    	15	B686
1330	Capranica Prenestina                                        	19	B687
1331	Capranica                                                   	14	B688
1332	Marzabotto                                                  	36	B689
1333	Caprarica di Lecce                                          	13	B690
1334	Caprarola                                                   	15	B691
1335	Caprauna                                                    	39	B692
1336	Caprese Michelangelo                                        	7	B693
1337	Caprezzo                                                    	18	B694
1338	Capri Leone                                                 	10	B695
1339	Capri                                                       	14	B696
1340	Capriana                                                    	40	B697
1341	Capriano del Colle                                          	37	B698
1342	Capriata d'Orba                                             	29	B701
1343	Capriate San Gervasio                                       	51	B703
1344	Capriati a Volturno                                         	14	B704
1345	Caprie                                                      	55	B705
1346	Capriglia Irpina                                            	18	B706
1347	Capriglio                                                   	19	B707
1348	Caprile                                                     	13	B708
1349	Caprino Veronese                                            	18	B709
1350	Caprino Bergamasco                                          	52	B710
1351	Capriolo                                                    	38	B711
1352	Capriva del Friuli                                          	1	B712
1353	Capua                                                       	15	B715
1354	Capurso                                                     	14	B716
1355	Caraffa di Catanzaro                                        	17	B717
1356	Caraffa del Bianco                                          	21	B718
1357	Caraglio                                                    	40	B719
1358	Caramagna Piemonte                                          	41	B720
1359	Caramanico Terme                                            	7	B722
1360	Carano                                                      	41	B723
1361	Carapelle                                                   	10	B724
1362	Carapelle Calvisio                                          	24	B725
1363	Carasco                                                     	10	B726
1364	Carassai                                                    	10	B727
1365	Carate Brianza                                              	15	B729
1366	Carate Urio                                                 	44	B730
1367	Caravaggio                                                  	53	B731
1368	Caravate                                                    	31	B732
1369	Caravino                                                    	56	B733
1370	Caravonica                                                  	12	B734
1371	Carbognano                                                  	16	B735
1372	Carbonara Scrivia                                           	30	B736
1373	Villasimius                                                 	100	B738
1374	Carbonara di Po                                             	9	B739
1375	Carbonara di Nola                                           	15	B740
1376	Carbonara al Ticino                                         	30	B741
1377	Carbonate                                                   	45	B742
1378	Carbone                                                     	19	B743
1379	Carbonera                                                   	8	B744
1380	Carbonia                                                    	3	B745
1381	Carcare                                                     	18	B748
1382	Carceri                                                     	22	B749
1383	Carcoforo                                                   	29	B752
1384	Cardano al Campo                                            	32	B754
1385	CardŠ                                                       	42	B755
1386	Cardeto                                                     	22	B756
1387	Cardinale                                                   	18	B758
1388	Cardito                                                     	16	B759
1389	Careggine                                                   	8	B760
1390	Carema                                                      	57	B762
1391	Carenno                                                     	14	B763
1392	Carentino                                                   	31	B765
1393	Careri                                                      	23	B766
1394	Caresana                                                    	30	B767
1395	Caresanablot                                                	31	B768
1396	Carezzano                                                   	32	B769
1397	Carfizzi                                                    	3	B771
1398	Cargeghe                                                    	22	B772
1399	Cariati                                                     	25	B774
1400	Carife                                                      	19	B776
1401	Carignano                                                   	58	B777
1402	Carimate                                                    	46	B778
1403	Carinaro                                                    	16	B779
1404	Carini                                                      	21	B780
1405	Carinola                                                    	17	B781
1406	Carisio                                                     	32	B782
1407	Carisolo                                                    	42	B783
1408	Carlantino                                                  	11	B784
1409	Carlazzo                                                    	47	B785
1410	Carlentini                                                  	6	B787
1411	Carlino                                                     	18	B788
1412	Carloforte                                                  	4	B789
1413	Carlopoli                                                   	20	B790
1414	Carmagnola                                                  	59	B791
1415	Carmiano                                                    	14	B792
1416	Carmignano                                                  	2	B794
1417	Carmignano di Brenta                                        	23	B795
1418	Carnago                                                     	33	B796
1419	Carnate                                                     	16	B798
1420	Cornedo all'Isarco                                          	23	B799
1421	Carobbio degli Angeli                                       	55	B801
1422	Carolei                                                     	26	B802
1423	Carona                                                      	56	B803
1424	Caronia                                                     	11	B804
1425	Caronno Pertusella                                          	34	B805
1426	Caronno Varesino                                            	35	B807
1427	Carosino                                                    	2	B808
1428	Carovigno                                                   	2	B809
1429	Carovilli                                                   	7	B810
1430	Carpaneto Piacentino                                        	11	B812
1431	Carpanzano                                                  	27	B813
1432	Carpasio                                                    	13	B814
1433	Carpegna                                                    	9	B816
1434	Carpenedolo                                                 	39	B817
1435	Carpeneto                                                   	33	B818
1436	Carpi                                                       	5	B819
1437	Carpiano                                                    	50	B820
1438	Carpignano Salentino                                        	15	B822
1439	Carpignano Sesia                                            	36	B823
1440	Cura Carpignano                                             	60	B824
1441	Carpineti                                                   	11	B825
1442	Carpineto Sinello                                           	11	B826
1443	Carpineto della Nora                                        	8	B827
1444	Carpineto Romano                                            	20	B828
1445	Carpino                                                     	12	B829
1446	Carpinone                                                   	8	B830
1447	Carrara                                                     	3	B832
1448	CarrŠ                                                       	24	B835
1449	Carrega Ligure                                              	34	B836
1450	Carro                                                       	9	B838
1451	Carrodano                                                   	10	B839
1452	Carrosio                                                    	35	B840
1453	Carr—                                                       	43	B841
1454	Carsoli                                                     	25	B842
1455	Cartigliano                                                 	25	B844
1456	Cartignano                                                  	44	B845
1457	Cartoceto                                                   	10	B846
1458	Cartosio                                                    	36	B847
1459	Cartura                                                     	26	B848
1460	Carugate                                                    	51	B850
1461	Carugo                                                      	48	B851
1462	Carunchio                                                   	12	B853
1463	Carvico                                                     	57	B854
1464	Carzano                                                     	43	B856
1465	Casabona                                                    	4	B857
1466	Casacalenda                                                 	11	B858
1467	Casacanditella                                              	13	B859
1468	Casagiove                                                   	18	B860
1469	Casalanguida                                                	14	B861
1470	Casalattico                                                 	17	B862
1471	Casalbeltrame                                               	37	B864
1472	Casalbordino                                                	15	B865
1473	Casalbore                                                   	20	B866
1474	Casalborgone                                                	60	B867
1475	Casalbuono                                                  	26	B868
1476	Casalbuttano ed Uniti                                       	16	B869
1477	Casal Cermelli                                              	37	B870
1478	Casalciprano                                                	12	B871
1479	Casal di Principe                                           	19	B872
1480	Casalduni                                                   	15	B873
1481	Casale Litta                                                	36	B875
1482	Casale Corte Cerro                                          	19	B876
1483	Casale di Scodosia                                          	27	B877
1484	Casale Marittimo                                            	6	B878
1485	Casale sul Sile                                             	9	B879
1486	Casalecchio di Reno                                         	11	B880
1487	Casale Cremasco-Vidolasco                                   	17	B881
1488	Casaleggio Boiro                                            	38	B882
1489	Casaleggio Novara                                           	39	B883
1490	Casale Monferrato                                           	39	B885
1491	Casaleone                                                   	19	B886
1492	Casaletto Lodigiano                                         	8	B887
1493	Casaletto Spartano                                          	27	B888
1494	Casaletto Ceredano                                          	18	B889
1495	Casaletto di Sopra                                          	19	B890
1496	Casaletto Vaprio                                            	20	B891
1497	Casalfiumanese                                              	12	B892
1498	Casalgrande                                                 	12	B893
1499	Casalgrasso                                                 	45	B894
1500	Casal Velino                                                	28	B895
1501	Casalincontrada                                             	16	B896
1502	Casalino                                                    	40	B897
1503	Casalmaggiore                                               	21	B898
1504	Casalmaiocco                                                	9	B899
1505	Casalmorano                                                 	22	B900
1506	Casalmoro                                                   	10	B901
1507	Casalnoceto                                                 	40	B902
1508	Villapiana                                                  	154	B903
1509	Casalnuovo Monterotaro                                      	13	B904
1510	Casalnuovo di Napoli                                        	17	B905
1511	San Paolo Albanese                                          	20	B906
1512	Casaloldo                                                   	11	B907
1513	Casalpusterlengo                                            	10	B910
1514	Casalromano                                                 	12	B911
1515	Casalserugo                                                 	28	B912
1516	Pozzaglio ed Uniti                                          	77	B914
1517	Trinitapoli                                                 	10	B915
1518	Casaluce                                                    	20	B916
1519	Casalvecchio di Puglia                                      	14	B917
1520	Casalvecchio Siculo                                         	12	B918
1521	Casalvieri                                                  	18	B919
1522	Casalvolone                                                 	41	B920
1523	Casalzuigno                                                 	37	B921
1524	Casamarciano                                                	18	B922
1525	Casamassima                                                 	15	B923
1526	Casamicciola Terme                                          	19	B924
1527	Casandrino                                                  	20	B925
1528	Casanova Lerrone                                            	19	B927
1529	Casanova Elvo                                               	33	B928
1530	Casanova Lonati                                             	31	B929
1531	Casape                                                      	21	B932
1532	Casapinta                                                   	14	B933
1533	Casaprota                                                   	11	B934
1534	Casapulla                                                   	21	B935
1535	Casarano                                                    	16	B936
1536	Casargo                                                     	15	B937
1537	Casarile                                                    	55	B938
1538	Casarza Ligure                                              	11	B939
1539	Casarsa della Delizia                                       	10	B940
1540	Casasco                                                     	41	B941
1541	Casasco d'Intelvi                                           	50	B942
1542	Casatenovo                                                  	16	B943
1543	Casatisma                                                   	32	B945
1544	Casavatore                                                  	21	B946
1545	Casazza                                                     	58	B947
1546	Cascia                                                      	7	B948
1547	Casciago                                                    	38	B949
1548	Cascina                                                     	8	B950
1549	San Giacomo Vercellese                                      	35	B952
1550	Cascinette d'Ivrea                                          	61	B953
1551	Casei Gerola                                                	33	B954
1552	Caselette                                                   	62	B955
1553	Casella                                                     	12	B956
1554	Caselle Lurani                                              	12	B958
1555	Caselle in Pittari                                          	29	B959
1556	Caselle Torinese                                            	63	B960
1557	Caselle Landi                                               	11	B961
1558	Scandicci                                                   	41	B962
1559	Caserta                                                     	22	B963
1560	Casier                                                      	10	B965
1561	Casignana                                                   	24	B966
1562	Casina                                                      	13	B967
1563	Castelsilano                                                	5	B968
1564	Castel di Casio                                             	15	B969
1565	Casirate d'Adda                                             	59	B971
1566	Caslino d'Erba                                              	52	B974
1567	Casnate con Bernate                                         	53	B977
1568	Casnigo                                                     	60	B978
1569	Casola in Lunigiana                                         	4	B979
1570	Casola di Napoli                                            	22	B980
1571	Casola Valsenio                                             	5	B982
1572	Casole Bruzio                                               	28	B983
1573	Casole d'Elsa                                               	4	B984
1574	Casoli                                                      	17	B985
1575	Casorate Sempione                                           	39	B987
1576	Casorate Primo                                              	34	B988
1577	Casorezzo                                                   	58	B989
1578	Casoria                                                     	23	B990
1579	Casorzo                                                     	20	B991
1580	Caspoggio                                                   	13	B993
1581	Cassacco                                                    	19	B994
1582	Cassago Brianza                                             	17	B996
1583	Cassano Irpino                                              	21	B997
1584	Cassano delle Murge                                         	16	B998
1585	Cassano Valcuvia                                            	41	B999
1586	Cassano all'Ionio                                           	29	C002
1587	Cassano d'Adda                                              	59	C003
1588	Cassano Magnago                                             	40	C004
1589	Cassano Spinola                                             	42	C005
1590	Cassaro                                                     	7	C006
1591	Cassiglio                                                   	61	C007
1592	Pero                                                        	170	C013
1593	Cassina de' Pecchi                                          	60	C014
1594	Cassina Rizzardi                                            	55	C020
1595	Cassinasco                                                  	21	C022
1596	Cassina Valsassina                                          	18	C024
1597	Cassine                                                     	43	C027
1598	Cassinelle                                                  	44	C030
1599	Cassinetta di Lugagnano                                     	61	C033
1600	Cassino                                                     	19	C034
1601	Cassola                                                     	26	C037
1602	Cassolnovo                                                  	35	C038
1603	Castel Castagna                                             	10	C040
1604	Castagnaro                                                  	20	C041
1605	Castagneto Carducci                                         	6	C044
1606	Castagneto Po                                               	64	C045
1607	Castagnito                                                  	46	C046
1608	Castagnole Monferrato                                       	23	C047
1609	Castagnole Piemonte                                         	65	C048
1610	Castagnole delle Lanze                                      	22	C049
1611	Castana                                                     	36	C050
1612	Castell'Umberto                                             	14	C051
1613	Castano Primo                                               	62	C052
1614	Casteggio                                                   	37	C053
1615	Castegnato                                                  	40	C055
1616	Castegnero                                                  	27	C056
1617	Castelbaldo                                                 	29	C057
1618	Castel Baronia                                              	22	C058
1619	Castelbelforte                                              	13	C059
1620	Castelbellino                                               	8	C060
1621	Castelbello-Ciardes                                         	18	C062
1622	Castelbianco                                                	20	C063
1623	Castel Boglione                                             	24	C064
1624	Castel Bolognese                                            	6	C065
1625	Castelbottaccio                                             	13	C066
1626	Castelbuono                                                 	22	C067
1627	Castelcivita                                                	30	C069
1628	Servigliano                                                 	38	C070
1629	Castelcovati                                                	41	C072
1630	Castelcucco                                                 	11	C073
1631	Casteldaccia                                                	23	C074
1632	Castel d'Aiano                                              	13	C075
1633	Castel d'Ario                                               	14	C076
1634	Castel d'Azzano                                             	21	C078
1635	Castelli Calepio                                            	62	C079
1636	Casteldelci                                                 	21	C080
1637	Casteldelfino                                               	47	C081
1638	Castel del Giudice                                          	9	C082
1639	Castel del Monte                                            	26	C083
1640	Castel del Piano                                            	4	C085
1641	Castel del Rio                                              	14	C086
1642	Casteldidone                                                	23	C089
1643	Castel di Ieri                                              	27	C090
1644	Castel di Iudica                                            	13	C091
1645	Castel di Lama                                              	11	C093
1646	Castel di Lucio                                             	13	C094
1647	Castel di Sangro                                            	28	C096
1648	Castel di Sasso                                             	24	C097
1649	Castel di Tora                                              	13	C098
1650	Castelfidardo                                               	10	C100
1651	Castelfiorentino                                            	10	C101
1652	Castel Focognano                                            	8	C102
1653	Castelfondo                                                 	46	C103
1654	Castelforte                                                 	4	C104
1655	Castelfranci                                                	23	C105
1656	Castelfranco in Miscano                                     	16	C106
1657	Castelfranco Emilia                                         	6	C107
1658	Castrolibero                                                	31	C108
1659	Castel Vittorio                                             	15	C110
1660	Castelfranco Veneto                                         	12	C111
1661	Castelfranco di Sotto                                       	9	C113
1662	Castel Frentano                                             	18	C114
1663	Castel Gabbiano                                             	24	C115
1664	Castel Gandolfo                                             	22	C116
1665	Castel Giorgio                                              	9	C117
1666	Castel Goffredo                                             	15	C118
1667	Castelgomberto                                              	28	C119
1668	Castelgrande                                                	21	C120
1669	Castel Guelfo di Bologna                                    	16	C121
1670	Castelguglielmo                                             	11	C122
1671	Castelguidone                                               	19	C123
1672	Castellabate                                                	31	C125
1673	Castellafiume                                               	29	C126
1674	Castell'Alfero                                              	25	C127
1675	Castellalto                                                 	11	C128
1676	Castellammare di Stabia                                     	24	C129
1677	Castellammare del Golfo                                     	5	C130
1678	Castellamonte                                               	66	C133
1679	Castellana Grotte                                           	17	C134
1680	Castellana Sicula                                           	24	C135
1681	Castellaneta                                                	3	C136
1682	Castellania                                                 	45	C137
1683	Castellanza                                                 	42	C139
1684	Castellar                                                   	48	C140
1685	Castellarano                                                	14	C141
1686	Castellar Guidobono                                         	46	C142
1687	Castellaro                                                  	14	C143
1688	Castell'Arquato                                             	12	C145
1689	Castell'Azzara                                              	5	C147
1690	Castellazzo Bormida                                         	47	C148
1691	Castellazzo Novarese                                        	42	C149
1692	Castelleone di Suasa                                        	11	C152
1693	Castelleone                                                 	25	C153
1694	Castellero                                                  	26	C154
1695	Castelletto Cervo                                           	15	C155
1696	Castelletto d'Erro                                          	48	C156
1697	Castelletto di Branduzzo                                    	38	C157
1698	Castelletto d'Orba                                          	49	C158
1699	Castelletto Merli                                           	50	C160
1700	Castelletto Molina                                          	27	C161
1701	Castelletto Monferrato                                      	51	C162
1702	Castelletto Stura                                           	49	C165
1703	Castelletto sopra Ticino                                    	43	C166
1704	Castelletto Uzzone                                          	50	C167
1705	Castelli                                                    	12	C169
1706	Castellina in Chianti                                       	5	C172
1707	Castellinaldo                                               	51	C173
1708	Castellina Marittima                                        	10	C174
1709	Castellino del Biferno                                      	14	C175
1710	Castellino Tanaro                                           	52	C176
1711	Castelliri                                                  	20	C177
1712	Castello del Matese                                         	25	C178
1713	Castelveccana                                               	45	C181
1714	Castel Condino                                              	45	C183
1715	Castello d'Agogna                                           	39	C184
1716	Castello d'Argile                                           	17	C185
1717	Castello dell'Acqua                                         	14	C186
1718	Castello di Brianza                                         	19	C187
1719	Castello di Cisterna                                        	25	C188
1720	Castello-Molina di Fiemme                                   	47	C189
1721	Castello di Godego                                          	13	C190
1722	Castello Tesino                                             	48	C194
1723	Castellucchio                                               	16	C195
1724	Castelmauro                                                 	15	C197
1725	Castelluccio dei Sauri                                      	15	C198
1726	Castelluccio Inferiore                                      	22	C199
1727	Castelverrino                                               	13	C200
1728	Castelluccio Superiore                                      	23	C201
1729	Castelluccio Valmaggiore                                    	16	C202
1730	Castel Madama                                               	23	C203
1731	Castel Maggiore                                             	19	C204
1732	Castelmagno                                                 	53	C205
1733	Castelmarte                                                 	58	C206
1734	Castelmassa                                                 	12	C207
1735	Castel Mella                                                	42	C208
1736	Castelmezzano                                               	24	C209
1737	Castelmola                                                  	15	C210
1738	Castel Morrone                                              	26	C211
1739	Castelnovetto                                               	40	C213
1740	Castelnuovo di Ceva                                         	54	C214
1741	Castelnovo Bariano                                          	13	C215
1742	Castelnuovo                                                 	49	C216
1743	Castelnovo del Friuli                                       	11	C217
1744	Castelnovo di Sotto                                         	15	C218
1745	Castelnovo ne' Monti                                        	16	C219
1746	Castelnuovo Bozzente                                        	59	C220
1747	Castelnuovo della Daunia                                    	17	C222
1748	Castelnuovo Parano                                          	21	C223
1749	Castelnuovo di Farfa                                        	14	C224
1750	Castelnuovo del Garda                                       	22	C225
1751	Castelnuovo Belbo                                           	29	C226
1752	Castelnuovo Berardenga                                      	6	C227
1753	Castelnuovo Bocca d'Adda                                    	13	C228
1754	Castelnuovo Bormida                                         	52	C229
1755	Castelnuovo Calcea                                          	30	C230
1756	Castelnuovo Cilento                                         	32	C231
1757	Castelnuovo Don Bosco                                       	31	C232
1758	Castelnuovo di Conza                                        	33	C235
1759	Castelnuovo di Garfagnana                                   	9	C236
1760	Castelnuovo di Porto                                        	24	C237
1761	Castelnuovo Magra                                           	11	C240
1762	Castelnuovo Nigra                                           	67	C241
1763	Castelnuovo Rangone                                         	7	C242
1764	Castelnuovo Scrivia                                         	53	C243
1765	Castelnuovo di Val di Cecina                                	11	C244
1766	Castelpagano                                                	17	C245
1767	Castelpetroso                                               	10	C246
1768	Castelpizzuto                                               	11	C247
1769	Castelplanio                                                	12	C248
1770	Castelpoto                                                  	18	C250
1771	Castelraimondo                                              	9	C251
1772	Castel Ritaldi                                              	8	C252
1773	Castel Rocchero                                             	32	C253
1774	Castelrotto                                                 	19	C254
1775	Castel Rozzone                                              	63	C255
1776	Castel San Giorgio                                          	34	C259
1777	Castel San Giovanni                                         	13	C261
1778	Castel San Lorenzo                                          	35	C262
1779	Castel San Niccol•                                          	10	C263
1780	Castel San Pietro Terme                                     	20	C265
1781	Castel San Pietro Romano                                    	25	C266
1782	Castelsantangelo sul Nera                                   	10	C267
1783	Castel Sant'Angelo                                          	15	C268
1784	Castel Sant'Elia                                            	17	C269
1785	Castel San Vincenzo                                         	12	C270
1786	Castelsaraceno                                              	25	C271
1787	Castelsardo                                                 	23	C272
1788	Castelseprio                                                	44	C273
1789	Castelspina                                                 	54	C274
1790	Casteltermini                                               	12	C275
1791	Castelvecchio di Rocca Barbena                              	21	C276
1792	Castelvecchio Calvisio                                      	30	C278
1793	Castelvecchio Subequo                                       	31	C279
1794	Castelvenere                                                	19	C280
1795	VerrŠs                                                      	73	C282
1796	Castelvetere sul Calore                                     	24	C283
1797	Castelvetere in Val Fortore                                 	20	C284
1798	Caulonia                                                    	25	C285
1799	Castelvetrano                                               	6	C286
1800	Castelvetro di Modena                                       	8	C287
1801	Castelvetro Piacentino                                      	14	C288
1802	Castel Viscardo                                             	10	C289
1803	Castelvisconti                                              	27	C290
1804	Castel Volturno                                             	27	C291
1805	Castenaso                                                   	21	C292
1806	Castenedolo                                                 	43	C293
1807	Chƒtillon                                                   	20	C294
1808	Castiglione dei Pepoli                                      	22	C296
1809	Castiglione di Sicilia                                      	14	C297
1810	Castiglione Messer Marino                                   	20	C298
1811	Castiglione d'Intelvi                                       	60	C299
1812	Castiglione Olona                                           	46	C300
1813	Castiglione Cosentino                                       	30	C301
1814	Castiglione Chiavarese                                      	13	C302
1815	Castiglione di Garfagnana                                   	10	C303
1816	Castiglione d'Adda                                          	14	C304
1817	Castiglione del Genovesi                                    	36	C306
1818	Castiglione Torinese                                        	68	C307
1819	Castiglione a Casauria                                      	9	C308
1820	Castiglione del Lago                                        	9	C309
1821	Castiglione della Pescaia                                   	6	C310
1822	Colledara                                                   	18	C311
1823	Castiglione delle Stiviere                                  	17	C312
1824	Castiglione d'Orcia                                         	7	C313
1825	Castiglione Falletto                                        	55	C314
1826	Castiglione in Teverina                                     	18	C315
1827	Castiglione Messer Raimondo                                 	13	C316
1828	Castiglione Tinella                                         	56	C317
1829	Castiglion Fibocchi                                         	11	C318
1830	Castiglion Fiorentino                                       	12	C319
1831	Castignano                                                  	12	C321
1832	Castilenti                                                  	14	C322
1833	Castino                                                     	57	C323
1834	Castione della Presolana                                    	64	C324
1835	Castione Andevenno                                          	15	C325
1836	Castions di Strada                                          	20	C327
1837	Castiraga Vidardo                                           	15	C329
1838	Casto                                                       	44	C330
1839	Castorano                                                   	13	C331
1840	Castrezzato                                                 	45	C332
1841	Castri di Lecce                                             	17	C334
1842	Castrignano de' Greci                                       	18	C335
1843	Castrignano del Capo                                        	19	C336
1844	Castro                                                      	65	C337
1845	Castro dei Volsci                                           	23	C338
1846	Castrocaro Terme e Terra del Sole                           	5	C339
1847	Castrocielo                                                 	22	C340
1848	Castrofilippo                                               	13	C341
1849	Enna                                                        	9	C342
1850	Castronno                                                   	47	C343
1851	Castronovo di Sicilia                                       	25	C344
1852	Castronuovo di Sant'Andrea                                  	26	C345
1853	Castropignano                                               	16	C346
1854	Castroreale                                                 	16	C347
1855	Castroregio                                                 	32	C348
1856	Castrovillari                                               	33	C349
1857	Catania                                                     	15	C351
1858	Catanzaro                                                   	23	C352
1859	Catenanuova                                                 	6	C353
1860	Catignano                                                   	10	C354
1861	Cattolica Eraclea                                           	14	C356
1862	Cattolica                                                   	2	C357
1863	Cautano                                                     	21	C359
1864	Cava Manara                                                 	41	C360
1865	Cava de' Tirreni                                            	37	C361
1866	Cavacurta                                                   	16	C362
1867	Cavagli…                                                    	16	C363
1868	Cavaglietto                                                 	44	C364
1869	Cavaglio d'Agogna                                           	45	C365
1870	Cavaglio-Spoccia                                            	20	C367
1871	Cavagnolo                                                   	69	C369
1872	Cavaion Veronese                                            	23	C370
1873	Cavalese                                                    	50	C372
1874	Cavallasca                                                  	61	C374
1875	Cavallerleone                                               	58	C375
1876	Cavallermaggiore                                            	59	C376
1877	Cavallino                                                   	20	C377
1878	Cavallirio                                                  	47	C378
1879	Cavareno                                                    	51	C380
1880	Cavargna                                                    	62	C381
1881	Cavaria con Premezzo                                        	48	C382
1882	Cavarzere                                                   	6	C383
1883	Cavaso del Tomba                                            	14	C384
1884	Cavasso Nuovo                                               	12	C385
1885	Cavatore                                                    	55	C387
1886	Jesolo                                                      	19	C388
1887	Cavazzo Carnico                                             	21	C389
1888	Cave                                                        	26	C390
1889	Cavedago                                                    	52	C392
1890	Cavedine                                                    	53	C393
1891	Cavenago d'Adda                                             	17	C394
1892	Cavenago di Brianza                                         	17	C395
1893	Cavernago                                                   	66	C396
1894	Cavezzo                                                     	9	C398
1895	Cavizzana                                                   	54	C400
1896	Cavour                                                      	70	C404
1897	Cavriago                                                    	17	C405
1898	Cavriana                                                    	18	C406
1899	Cavriglia                                                   	13	C407
1900	Cazzago San Martino                                         	46	C408
1901	Cazzago Brabbia                                             	49	C409
1902	Cazzano Sant'Andrea                                         	67	C410
1903	Cazzano di Tramigna                                         	24	C412
1904	Ceccano                                                     	24	C413
1905	Cecima                                                      	42	C414
1906	Cecina                                                      	7	C415
1907	Cedegolo                                                    	47	C417
1908	Cedrasco                                                    	16	C418
1909	Cefal… Diana                                                	26	C420
1910	Cefal—                                                      	27	C421
1911	Ceggia                                                      	7	C422
1912	Ceglie Messapica                                            	3	C424
1913	Celano                                                      	32	C426
1914	Celenza sul Trigno                                          	21	C428
1915	Celenza Valfortore                                          	18	C429
1916	Celico                                                      	34	C430
1917	Cella Monte                                                 	56	C432
1918	Cella Dati                                                  	28	C435
1919	Cellamare                                                   	18	C436
1920	Cellara                                                     	35	C437
1921	Cellarengo                                                  	33	C438
1922	Cellatica                                                   	48	C439
1923	Celle Enomondo                                              	34	C440
1924	Celle di Macra                                              	60	C441
1925	Celle di San Vito                                           	19	C442
1926	Celle Ligure                                                	22	C443
1927	Celle di Bulgheria                                          	38	C444
1928	Celleno                                                     	19	C446
1929	Cellere                                                     	20	C447
1930	Cellino San Marco                                           	4	C448
1931	Cellino Attanasio                                           	15	C449
1932	Cellio                                                      	38	C450
1933	Cembra                                                      	55	C452
1934	Cenadi                                                      	24	C453
1935	Cenate Sopra                                                	68	C456
1936	Cenate Sotto                                                	69	C457
1937	Cencenighe Agordino                                         	10	C458
1938	Cene                                                        	70	C459
1939	Ceneselli                                                   	14	C461
1940	Cengio                                                      	23	C463
1941	Centallo                                                    	61	C466
1942	Centa San Nicol•                                            	56	C467
1943	Cento                                                       	4	C469
1944	Centola                                                     	39	C470
1945	Centuripe                                                   	7	C471
1946	Centrache                                                   	25	C472
1947	Cepagatti                                                   	11	C474
1948	Ceppaloni                                                   	22	C476
1949	Ceppo Morelli                                               	21	C478
1950	Ceprano                                                     	25	C479
1951	Cerami                                                      	8	C480
1952	Ceranesi                                                    	14	C481
1953	Cerano d'Intelvi                                            	63	C482
1954	Cerano                                                      	49	C483
1955	Ceranova                                                    	43	C484
1956	Ceraso                                                      	40	C485
1957	Cercemaggiore                                               	17	C486
1958	Cercenasco                                                  	71	C487
1959	Cercepiccola                                                	18	C488
1960	Cerchiara di Calabria                                       	36	C489
1961	Cerchio                                                     	33	C492
1962	Cercino                                                     	17	C493
1963	Cercivento                                                  	22	C494
1964	Cercola                                                     	26	C495
1965	Cerda                                                       	28	C496
1966	Ceres                                                       	72	C497
1967	Cerea                                                       	25	C498
1968	Ceregnano                                                   	15	C500
1969	Cerenzia                                                    	6	C501
1970	Ceresara                                                    	19	C502
1971	Cereseto                                                    	57	C503
1972	Ceresole Alba                                               	62	C504
1973	Ceresole Reale                                              	73	C505
1974	Cerete                                                      	71	C506
1975	Cerreto Grue                                                	58	C507
1976	Ceretto Lomellina                                           	44	C508
1977	Cergnago                                                    	45	C509
1978	Ceriale                                                     	24	C510
1979	Ceriana                                                     	16	C511
1980	Ceriano Laghetto                                            	18	C512
1981	Cerignale                                                   	15	C513
1982	Cerignola                                                   	20	C514
1983	Cerisano                                                    	37	C515
1984	Cermenate                                                   	64	C516
1985	Cermignano                                                  	16	C517
1986	Cerreto Laziale                                             	27	C518
1987	Cernobbio                                                   	65	C520
1988	Cernusco Lombardone                                         	20	C521
1989	Cernusco sul Naviglio                                       	70	C523
1990	Cerreto d'Esi                                               	13	C524
1991	Cerreto Sannita                                             	23	C525
1992	Cerreto Castello                                            	17	C526
1993	Cerreto di Spoleto                                          	10	C527
1994	Cerreto d'Asti                                              	35	C528
1995	Cerreto Guidi                                               	11	C529
1996	Cerretto Langhe                                             	63	C530
1997	Cerrina Monferrato                                          	59	C531
1998	Cerrione                                                    	18	C532
1999	Cerro Tanaro                                                	36	C533
2000	Cerro al Volturno                                           	14	C534
2001	Cerro al Lambro                                             	71	C536
2002	Cerro Maggiore                                              	72	C537
2003	Cerro Veronese                                              	26	C538
2004	Cersosimo                                                   	27	C539
2005	Certaldo                                                    	12	C540
2006	Certosa di Pavia                                            	46	C541
2007	Cerva                                                       	27	C542
2008	Cervara di Roma                                             	28	C543
2009	Cervarese Santa Croce                                       	30	C544
2010	Cervaro                                                     	26	C545
2011	Cervasca                                                    	64	C547
2012	Cervatto                                                    	41	C548
2013	Cerveno                                                     	49	C549
2014	Cervere                                                     	65	C550
2015	Cervesina                                                   	47	C551
2016	Cerveteri                                                   	29	C552
2017	Cervia                                                      	7	C553
2018	Cervicati                                                   	38	C554
2019	Cervignano d'Adda                                           	18	C555
2020	Cervignano del Friuli                                       	23	C556
2021	Cervinara                                                   	25	C557
2022	Cervino                                                     	28	C558
2023	Cervo                                                       	17	C559
2024	Cerzeto                                                     	39	C560
2025	Cesa                                                        	29	C561
2026	Lentiai                                                     	28	C562
2027	Cesana Brianza                                              	21	C563
2028	Cesana Torinese                                             	74	C564
2029	Cesano Boscone                                              	74	C565
2030	Cesano Maderno                                              	19	C566
2031	Cesara                                                      	22	C567
2032	Cesar•                                                      	17	C568
2033	Cesate                                                      	76	C569
2034	Cesena                                                      	7	C573
2035	Cesenatico                                                  	8	C574
2036	Cesinali                                                    	26	C576
2037	Cesiomaggiore                                               	11	C577
2038	Cesio                                                       	18	C578
2039	Cessalto                                                    	15	C580
2040	Cessaniti                                                   	6	C581
2041	Cessapalombo                                                	11	C582
2042	Cessole                                                     	37	C583
2043	Cetara                                                      	41	C584
2044	Ceto                                                        	50	C585
2045	Cetona                                                      	8	C587
2046	Cetraro                                                     	40	C588
2047	Ceva                                                        	66	C589
2048	Cevo                                                        	51	C591
2049	Challand-Saint-Anselme                                      	13	C593
2050	Challand-Saint-Victor                                       	14	C594
2051	Chambave                                                    	15	C595
2052	Champdepraz                                                 	17	C596
2053	Charvensod                                                  	19	C598
2054	Cherasco                                                    	67	C599
2055	Cheremule                                                   	24	C600
2056	Chialamberto                                                	75	C604
2057	Chiampo                                                     	29	C605
2058	Chianche                                                    	27	C606
2059	Chianciano Terme                                            	9	C608
2060	Chianni                                                     	12	C609
2061	Chianocco                                                   	76	C610
2062	Chiaramonte Gulfi                                           	2	C612
2063	Chiaramonti                                                 	25	C613
2064	Chiarano                                                    	16	C614
2065	Chiaravalle                                                 	14	C615
2066	Chiaravalle Centrale                                        	29	C616
2067	Chiari                                                      	52	C618
2068	Chiaromonte                                                 	28	C619
2069	Chiauci                                                     	15	C620
2070	Chiavari                                                    	15	C621
2071	Chiavenna                                                   	18	C623
2072	Chiaverano                                                  	77	C624
2073	Chienes                                                     	21	C625
2074	Chieri                                                      	78	C627
2075	Chiesa in Valmalenco                                        	19	C628
2076	Chiesanuova                                                 	79	C629
2077	Chies d'Alpago                                              	12	C630
2078	Chiesina Uzzanese                                           	22	C631
2079	Chieti                                                      	22	C632
2080	Chieuti                                                     	21	C633
2081	Chieve                                                      	29	C634
2082	Chignolo d'Isola                                            	72	C635
2083	Chignolo Po                                                 	48	C637
2084	Chioggia                                                    	8	C638
2085	Chiomonte                                                   	80	C639
2086	Chions                                                      	13	C640
2087	Chiopris-Viscone                                            	24	C641
2088	Chitignano                                                  	14	C648
2089	Chiuduno                                                    	73	C649
2090	Chiuppano                                                   	30	C650
2091	Chiuro                                                      	20	C651
2092	Chiusa                                                      	22	C652
2093	Chiusa di Pesio                                             	68	C653
2094	Chiusa Sclafani                                             	29	C654
2095	Chiusa di San Michele                                       	81	C655
2096	Chiusaforte                                                 	25	C656
2097	Chiusanico                                                  	19	C657
2098	Chiusano d'Asti                                             	38	C658
2099	Chiusano di San Domenico                                    	28	C659
2100	Chiusavecchia                                               	20	C660
2101	Chiusdino                                                   	10	C661
2102	Chiusi                                                      	11	C662
2103	Chiusi della Verna                                          	15	C663
2104	Chivasso                                                    	82	C665
2105	Cianciana                                                   	15	C668
2106	Canossa                                                     	18	C669
2107	Crocetta del Montello                                       	25	C670
2108	Cibiana di Cadore                                           	13	C672
2109	Cicagna                                                     	16	C673
2110	Cicala                                                      	30	C674
2111	Cicciano                                                    	27	C675
2112	Cicerale                                                    	42	C676
2113	Ciciliano                                                   	30	C677
2114	Cicognolo                                                   	30	C678
2115	Ciconio                                                     	83	C679
2116	Cigliano                                                    	42	C680
2117	CigliŠ                                                      	69	C681
2118	Cigognola                                                   	49	C684
2119	Cigole                                                      	53	C685
2120	Cilavegna                                                   	50	C686
2121	Cimadolmo                                                   	17	C689
2122	Cimbergo                                                    	54	C691
2123	Cimego                                                      	57	C694
2124	Cimin…                                                      	26	C695
2125	Ciminna                                                     	30	C696
2126	Cimitile                                                    	28	C697
2127	Tavernole sul Mella                                         	183	C698
2128	Cimolais                                                    	14	C699
2129	Cimone                                                      	58	C700
2130	Cinaglio                                                    	39	C701
2131	Cineto Romano                                               	31	C702
2132	Cingia de' Botti                                            	31	C703
2133	Cingoli                                                     	12	C704
2134	Cinigiano                                                   	7	C705
2135	Cinisello Balsamo                                           	77	C707
2136	Cinisi                                                      	31	C708
2137	Cino                                                        	21	C709
2138	Cinquefrondi                                                	27	C710
2139	Cintano                                                     	84	C711
2140	Cinte Tesino                                                	59	C712
2141	Cinto Euganeo                                               	31	C713
2142	Cinto Caomaggiore                                           	9	C714
2143	Cinzano                                                     	85	C715
2144	Ciorlano                                                    	30	C716
2145	Santa Maria del Cedro                                       	132	C717
2146	Cipressa                                                    	21	C718
2147	Circello                                                    	24	C719
2148	CiriŠ                                                       	86	C722
2149	Cirigliano                                                  	5	C723
2150	Cirimido                                                    	68	C724
2151	Cir•                                                        	7	C725
2152	Cir• Marina                                                 	8	C726
2153	Cis                                                         	60	C727
2154	Cisano Bergamasco                                           	74	C728
2155	Cisano sul Neva                                             	25	C729
2156	Ciserano                                                    	75	C730
2157	Cislago                                                     	50	C732
2158	Cisliano                                                    	78	C733
2159	Cismon del Grappa                                           	31	C734
2160	Cison di Valmarino                                          	18	C735
2161	Cissone                                                     	70	C738
2162	Cisterna d'Asti                                             	40	C739
2163	Cisterna di Latina                                          	5	C740
2164	Cisternino                                                  	5	C741
2165	Citerna                                                     	11	C742
2166	Cittadella                                                  	32	C743
2167	Citt… della Pieve                                           	12	C744
2168	Citt… di Castello                                           	13	C745
2169	Cittaducale                                                 	16	C746
2170	Cittanova                                                   	28	C747
2171	Cittareale                                                  	17	C749
2172	Citt… Sant'Angelo                                           	12	C750
2173	Cittiglio                                                   	51	C751
2174	Civate                                                      	22	C752
2175	Civezza                                                     	22	C755
2176	Civezzano                                                   	61	C756
2177	Civiasco                                                    	43	C757
2178	Cividale del Friuli                                         	26	C758
2179	Cividate al Piano                                           	76	C759
2180	Cividate Camuno                                             	55	C760
2181	Civita                                                      	41	C763
2182	Civitacampomarano                                           	19	C764
2183	Civita Castellana                                           	21	C765
2184	Civita d'Antino                                             	34	C766
2185	Lanuvio                                                     	50	C767
2186	Civitaluparella                                             	23	C768
2187	Civitanova del Sannio                                       	16	C769
2188	Civitanova Marche                                           	13	C770
2189	Civitaquana                                                 	13	C771
2190	Duronia                                                     	22	C772
2191	Civitavecchia                                               	32	C773
2192	Civitella in Val di Chiana                                  	16	C774
2193	Civitella Messer Raimondo                                   	24	C776
2194	Civitella di Romagna                                        	9	C777
2195	Civitella Alfedena                                          	35	C778
2196	Civitella Casanova                                          	14	C779
2197	Civitella d'Agliano                                         	22	C780
2198	Civitella del Tronto                                        	17	C781
2199	Civitella Paganico                                          	8	C782
2200	Civitella Roveto                                            	36	C783
2201	Civitella San Paolo                                         	33	C784
2202	Civo                                                        	22	C785
2203	Claino con Osteno                                           	71	C787
2204	Ubiale Clanezzo                                             	221	C789
2205	Claut                                                       	15	C790
2206	Clauzetto                                                   	16	C791
2207	Clavesana                                                   	71	C792
2208	Claviere                                                    	87	C793
2209	Cles                                                        	62	C794
2210	Cleto                                                       	42	C795
2211	Clivio                                                      	52	C796
2212	Cloz                                                        	63	C797
2213	Clusone                                                     	77	C800
2214	Coassolo Torinese                                           	88	C801
2215	Coazze                                                      	89	C803
2216	Coazzolo                                                    	41	C804
2217	Coccaglio                                                   	56	C806
2218	Cocconato                                                   	42	C807
2219	Cocquio-Trevisago                                           	53	C810
2220	Cocullo                                                     	37	C811
2221	Codevigo                                                    	33	C812
2222	Codevilla                                                   	51	C813
2223	Codigoro                                                    	5	C814
2224	CodognŠ                                                     	19	C815
2225	Codogno                                                     	19	C816
2226	Codroipo                                                    	27	C817
2227	Codrongianos                                                	26	C818
2228	Coggiola                                                    	19	C819
2229	Cogliate                                                    	20	C820
2230	Cogne                                                       	21	C821
2231	Cogoleto                                                    	17	C823
2232	Cogollo del Cengio                                          	32	C824
2233	Cogorno                                                     	18	C826
2234	Colazza                                                     	51	C829
2235	Colere                                                      	78	C835
2236	Colfelice                                                   	27	C836
2237	Coli                                                        	16	C838
2238	Colico                                                      	23	C839
2239	Collagna                                                    	19	C840
2240	Collalto Sabino                                             	18	C841
2241	Collarmele                                                  	38	C844
2242	Collazzone                                                  	14	C845
2243	Colle Sannita                                               	25	C846
2244	Colle di Val d'Elsa                                         	12	C847
2245	Colle Umberto                                               	20	C848
2246	Collebeato                                                  	57	C850
2247	Colle Brianza                                               	24	C851
2248	Collecchio                                                  	9	C852
2249	Collecorvino                                                	15	C853
2250	Colle d'Anchise                                             	20	C854
2251	Colledimacine                                               	25	C855
2252	Colledimezzo                                                	26	C856
2253	Colle di Tora                                               	19	C857
2254	Colleferro                                                  	34	C858
2255	Collegiove                                                  	20	C859
2256	Collegno                                                    	90	C860
2257	Collelongo                                                  	39	C862
2258	Collepardo                                                  	28	C864
2259	Collepasso                                                  	21	C865
2260	Collepietro                                                 	40	C866
2261	Colleretto Castelnuovo                                      	91	C867
2262	Colleretto Giacosa                                          	92	C868
2263	Collesalvetti                                               	8	C869
2264	Colle San Magno                                             	29	C870
2265	Collesano                                                   	32	C871
2266	Colle Santa Lucia                                           	14	C872
2267	Colletorto                                                  	21	C875
2268	Collevecchio                                                	21	C876
2269	Colli del Tronto                                            	14	C877
2270	Colli a Volturno                                            	17	C878
2271	Colliano                                                    	43	C879
2272	Colli sul Velino                                            	22	C880
2273	Collinas                                                    	3	C882
2274	Collio                                                      	58	C883
2275	Collobiano                                                  	45	C884
2276	Colloredo di Monte Albano                                   	28	C885
2277	Colmurano                                                   	14	C886
2278	Colobraro                                                   	6	C888
2279	Cologna Veneta                                              	27	C890
2280	Cologne                                                     	59	C893
2281	Cologno al Serio                                            	79	C894
2282	Cologno Monzese                                             	81	C895
2283	Colognola ai Colli                                          	28	C897
2284	Colonna                                                     	35	C900
2285	Colonnella                                                  	19	C901
2286	Colonno                                                     	74	C902
2287	Colorina                                                    	23	C903
2288	Colorno                                                     	10	C904
2289	Colosimi                                                    	43	C905
2290	Colturano                                                   	82	C908
2291	Colzate                                                     	80	C910
2292	Comabbio                                                    	54	C911
2293	Comacchio                                                   	6	C912
2294	Comano                                                      	5	C914
2295	Comazzo                                                     	20	C917
2296	Comeglians                                                  	29	C918
2297	Santo Stefano di Cadore                                     	50	C919
2298	Comelico Superiore                                          	15	C920
2299	Comerio                                                     	55	C922
2300	Comezzano-Cizzago                                           	60	C925
2301	Comignago                                                   	52	C926
2302	Comiso                                                      	3	C927
2303	Comitini                                                    	16	C928
2304	Comiziano                                                   	29	C929
2305	Commessaggio                                                	20	C930
2306	Commezzadura                                                	64	C931
2307	Como                                                        	75	C933
2308	Compiano                                                    	11	C934
2309	Comunanza                                                   	15	C935
2310	Valsolda                                                    	234	C936
2311	Comun Nuovo                                                 	81	C937
2312	Cona                                                        	10	C938
2313	Conca della Campania                                        	31	C939
2314	Conca dei Marini                                            	44	C940
2315	Conca Casale                                                	18	C941
2316	Concamarise                                                 	29	C943
2317	Concerviano                                                 	23	C946
2318	Concesio                                                    	61	C948
2319	Conco                                                       	33	C949
2320	Concordia Sagittaria                                        	11	C950
2321	Concordia sulla Secchia                                     	10	C951
2322	Concorezzo                                                  	21	C952
2323	Condino                                                     	66	C953
2324	Condofuri                                                   	29	C954
2325	Condove                                                     	93	C955
2326	Condr•                                                      	18	C956
2327	Conegliano                                                  	21	C957
2328	Confienza                                                   	52	C958
2329	Configni                                                    	24	C959
2330	Conflenti                                                   	33	C960
2331	Coniolo                                                     	60	C962
2332	Conselice                                                   	8	C963
2333	Conselve                                                    	34	C964
2334	Contessa Entellina                                          	33	C968
2335	Contigliano                                                 	25	C969
2336	Contrada                                                    	29	C971
2337	Controguerra                                                	20	C972
2338	Controne                                                    	45	C973
2339	Contursi Terme                                              	46	C974
2340	Conversano                                                  	19	C975
2341	Conza della Campania                                        	30	C976
2342	Conzano                                                     	61	C977
2343	Copertino                                                   	22	C978
2344	Copiano                                                     	53	C979
2345	Copparo                                                     	7	C980
2346	Corana                                                      	54	C982
2347	Corato                                                      	20	C983
2348	Corbara                                                     	47	C984
2349	Corbetta                                                    	85	C986
2350	Corbola                                                     	17	C987
2351	Corchiano                                                   	23	C988
2352	Corciano                                                    	15	C990
2353	Cordenons                                                   	17	C991
2354	Cordignano                                                  	22	C992
2355	Cordovado                                                   	18	C993
2356	Coredo                                                      	67	C994
2357	Coreglia Ligure                                             	19	C995
2358	Coreglia Antelminelli                                       	11	C996
2359	Coreno Ausonio                                              	30	C998
2360	Corfinio                                                    	41	C999
2361	Cori                                                        	6	D003
2362	Coriano                                                     	3	D004
2363	Corigliano Calabro                                          	44	D005
2364	Corigliano d'Otranto                                        	23	D006
2365	Corinaldo                                                   	15	D007
2366	Corio                                                       	94	D008
2367	Corleone                                                    	34	D009
2368	Corleto Perticara                                           	29	D010
2369	Corleto Monforte                                            	48	D011
2370	Courmayeur                                                  	22	D012
2371	Cormano                                                     	86	D013
2372	Cormons                                                     	2	D014
2373	Corna Imagna                                                	82	D015
2374	Cornalba                                                    	249	D016
2375	Cornaredo                                                   	87	D018
2376	Cornate d'Adda                                              	53	D019
2377	Cornedo Vicentino                                           	34	D020
2378	Cornegliano Laudense                                        	21	D021
2379	Corneliano d'Alba                                           	72	D022
2380	Tarquinia                                                   	50	D024
2381	Corniglio                                                   	12	D026
2382	Corno di Rosazzo                                            	30	D027
2383	Corno Giovine                                               	22	D028
2384	Cornovecchio                                                	23	D029
2385	Cornuda                                                     	23	D030
2386	Morimondo                                                   	150	D033
2387	Correggio                                                   	20	D037
2388	Correzzana                                                  	22	D038
2389	Correzzola                                                  	35	D040
2390	Corrido                                                     	77	D041
2391	Corridonia                                                  	15	D042
2392	Corropoli                                                   	21	D043
2393	Corsano                                                     	24	D044
2394	Corsico                                                     	93	D045
2395	Corsione                                                    	44	D046
2396	Cortaccia sulla strada del vino                             	24	D048
2397	Cortale                                                     	34	D049
2398	Cortandone                                                  	45	D050
2399	Cortanze                                                    	46	D051
2400	Cortazzone                                                  	47	D052
2401	Corte Brugnatella                                           	17	D054
2402	Corte de' Cortesi con Cignone                               	32	D056
2403	Corte de' Frati                                             	33	D057
2404	Corte Franca                                                	62	D058
2405	Cortemaggiore                                               	18	D061
2406	Cortemilia                                                  	73	D062
2407	Corteno Golgi                                               	63	D064
2408	Cortenova                                                   	25	D065
2409	Cortenuova                                                  	83	D066
2410	Corteolona                                                  	56	D067
2411	Corte Palasio                                               	24	D068
2412	Cortiglione                                                 	48	D072
2413	Cortina sulla strada del vino                               	25	D075
2414	Cortino                                                     	22	D076
2415	Cortona                                                     	17	D077
2416	Corvara                                                     	16	D078
2417	Corvara in Badia                                            	26	D079
2418	Corvino San Quirico                                         	57	D081
2419	Corzano                                                     	64	D082
2420	Coseano                                                     	31	D085
2421	Cosenza                                                     	45	D086
2422	Cosio d'Arroscia                                            	23	D087
2423	Cosio Valtellino                                            	24	D088
2424	Cosoleto                                                    	30	D089
2425	Cossano Canavese                                            	95	D092
2426	Cossano Belbo                                               	74	D093
2427	Cossato                                                     	20	D094
2428	Cosseria                                                    	26	D095
2429	Cossignano                                                  	16	D096
2430	Cossogno                                                    	23	D099
2431	Cossoine                                                    	27	D100
2432	Cossombrato                                                 	49	D101
2433	Costa Vescovato                                             	62	D102
2434	Costa Valle Imagna                                          	85	D103
2435	Costa di Rovigo                                             	18	D105
2436	Costabissara                                                	35	D107
2437	Costacciaro                                                 	16	D108
2438	Costa de' Nobili                                            	58	D109
2439	Costa di Mezzate                                            	84	D110
2440	Costa Serina                                                	247	D111
2441	Costa Masnaga                                               	26	D112
2442	Costanzana                                                  	47	D113
2443	Costarainera                                                	24	D114
2444	Costa Volpino                                               	86	D117
2445	Costermano                                                  	30	D118
2446	Costigliole d'Asti                                          	50	D119
2447	Costigliole Saluzzo                                         	75	D120
2448	Cotignola                                                   	9	D121
2449	Crotone                                                     	10	D122
2450	Cotronei                                                    	9	D123
2451	Cottanello                                                  	26	D124
2452	Covo                                                        	87	D126
2453	Cozzo                                                       	59	D127
2454	Craco                                                       	7	D128
2455	Crandola Valsassina                                         	27	D131
2456	Cravagliana                                                 	48	D132
2457	Cravanzana                                                  	76	D133
2458	Craveggia                                                   	24	D134
2459	Creazzo                                                     	36	D136
2460	Crecchio                                                    	27	D137
2461	Credaro                                                     	88	D139
2462	Credera Rubbiano                                            	34	D141
2463	Crema                                                       	35	D142
2464	Cremella                                                    	28	D143
2465	Cremenaga                                                   	56	D144
2466	Cremeno                                                     	29	D145
2467	Cremia                                                      	83	D147
2468	Cremolino                                                   	63	D149
2469	Cremona                                                     	36	D150
2470	Cremosano                                                   	37	D151
2471	Crescentino                                                 	49	D154
2472	Crespadoro                                                  	37	D156
2473	Crespano del Grappa                                         	24	D157
2474	Crespiatica                                                 	25	D159
2475	Crespino                                                    	19	D161
2476	Cressa                                                      	55	D162
2477	Crevacuore                                                  	21	D165
2478	Crevalcore                                                  	24	D166
2479	Crevoladossola                                              	25	D168
2480	Crispano                                                    	30	D170
2481	Crispiano                                                   	4	D171
2482	Crissolo                                                    	77	D172
2483	Crocefieschi                                                	20	D175
2484	Crodo                                                       	26	D177
2485	Crognaleto                                                  	23	D179
2486	Cropalati                                                   	46	D180
2487	Cropani                                                     	36	D181
2488	Crosa                                                       	22	D182
2489	Crosia                                                      	47	D184
2490	Crosio della Valle                                          	57	D185
2491	Crotta d'Adda                                               	38	D186
2492	Crova                                                       	52	D187
2493	Croviana                                                    	68	D188
2494	Crucoli                                                     	11	D189
2495	Cuasso al Monte                                             	58	D192
2496	Veronella                                                   	92	D193
2497	Cuccaro Monferrato                                          	64	D194
2498	Cuccaro Vetere                                              	49	D195
2499	Cucciago                                                    	84	D196
2500	Cuceglio                                                    	96	D197
2501	Cuggiono                                                    	96	D198
2502	Cugliate-Fabiasco                                           	59	D199
2503	Cuglieri                                                    	19	D200
2504	Cugnoli                                                     	17	D201
2505	Cumiana                                                     	97	D202
2506	Cumignano sul Naviglio                                      	39	D203
2507	Cunardo                                                     	60	D204
2508	Cuneo                                                       	78	D205
2509	Cunevo                                                      	69	D206
2510	Cunico                                                      	51	D207
2511	CuorgnŠ                                                     	98	D208
2512	Cupello                                                     	28	D209
2513	Cupra Marittima                                             	17	D210
2514	Cupramontana                                                	16	D211
2515	Curcuris                                                    	77	D214
2516	Cureggio                                                    	58	D216
2517	Curiglia con Monteviasco                                    	61	D217
2518	Curinga                                                     	39	D218
2519	Curino                                                      	23	D219
2520	Curno                                                       	89	D221
2521	Curon Venosta                                               	27	D222
2522	Cursi                                                       	25	D223
2523	Cursolo-Orasso                                              	27	D225
2524	Curtarolo                                                   	36	D226
2525	Curtatone                                                   	21	D227
2526	Curti                                                       	32	D228
2527	Cusago                                                      	97	D229
2528	Cusano Mutri                                                	26	D230
2529	Cusano Milanino                                             	98	D231
2530	Cusino                                                      	85	D232
2531	Cusio                                                       	90	D233
2532	Custonaci                                                   	7	D234
2533	Cutigliano                                                  	4	D235
2534	Cutro                                                       	12	D236
2535	Cutrofiano                                                  	26	D237
2536	Cuveglio                                                    	62	D238
2537	Cuvio                                                       	63	D239
2538	Daiano                                                      	70	D243
2539	Dairago                                                     	99	D244
2540	Dalmine                                                     	91	D245
2541	Dambel                                                      	71	D246
2542	Danta di Cadore                                             	17	D247
2543	Daone                                                       	72	D248
2544	DarŠ                                                        	73	D250
2545	Darfo Boario Terme                                          	65	D251
2546	Das…                                                        	7	D253
2547	Davagna                                                     	21	D255
2548	Daverio                                                     	64	D256
2549	Davoli                                                      	42	D257
2550	Dazio                                                       	25	D258
2551	Decimomannu                                                 	15	D259
2552	Decimoputzu                                                 	16	D260
2553	Decollatura                                                 	43	D261
2554	Dego                                                        	27	D264
2555	Deiva Marina                                                	12	D265
2556	Delebio                                                     	26	D266
2557	Delia                                                       	6	D267
2558	Delianuova                                                  	31	D268
2559	Deliceto                                                    	22	D269
2560	Dello                                                       	66	D270
2561	Demonte                                                     	79	D271
2562	Denice                                                      	65	D272
2563	Denno                                                       	74	D273
2564	Dernice                                                     	66	D277
2565	Derovere                                                    	40	D278
2566	Deruta                                                      	17	D279
2567	Dervio                                                      	30	D280
2568	Desana                                                      	54	D281
2569	Desenzano del Garda                                         	67	D284
2570	Desio                                                       	23	D286
2571	Desulo                                                      	16	D287
2572	Diamante                                                    	48	D289
2573	Scigliano                                                   	139	D290
2574	Diano d'Alba                                                	80	D291
2575	Teggiano                                                    	146	D292
2576	Diano Arentino                                              	25	D293
2577	Diano Castello                                              	26	D296
2578	Diano Marina                                                	27	D297
2579	Diano San Pietro                                            	28	D298
2580	Dicomano                                                    	13	D299
2581	Dignano                                                     	32	D300
2582	Dimaro                                                      	75	D302
2583	Dinami                                                      	8	D303
2584	Dipignano                                                   	49	D304
2585	Diso                                                        	27	D305
2586	Divignano                                                   	60	D309
2587	Dizzasco                                                    	87	D310
2588	Dobbiaco                                                    	28	D311
2589	Doberd• del Lago                                            	3	D312
2590	Dogliani                                                    	81	D314
2591	Dogliola                                                    	29	D315
2592	Dogna                                                       	33	D316
2593	DolcŠ                                                       	31	D317
2594	Dolceacqua                                                  	29	D318
2595	Dolcedo                                                     	30	D319
2596	Dolegna del Collio                                          	4	D321
2597	Dolianova                                                   	17	D323
2598	San Dorligo della Valle-Dolina                              	4	D324
2599	Dolo                                                        	12	D325
2600	Dolzago                                                     	31	D327
2601	Domanico                                                    	50	D328
2602	Domaso                                                      	89	D329
2603	Domegge di Cadore                                           	18	D330
2604	Domicella                                                   	31	D331
2605	Domodossola                                                 	28	D332
2606	Domus de Maria                                              	18	D333
2607	Domusnovas                                                  	5	D334
2608	Don                                                         	76	D336
2609	Donnas                                                      	23	D338
2610	Donato                                                      	24	D339
2611	Dongo                                                       	90	D341
2612	Donori                                                      	20	D344
2613	Dorgali                                                     	17	D345
2614	Dorio                                                       	32	D346
2615	Dormelletto                                                 	62	D347
2616	Dorno                                                       	61	D348
2617	Dorsino                                                     	77	D349
2618	Dorzano                                                     	25	D350
2619	Dosolo                                                      	22	D351
2620	Dossena                                                     	92	D352
2621	Dosso del Liro                                              	92	D355
2622	Doues                                                       	24	D356
2623	Dovadola                                                    	11	D357
2624	Dovera                                                      	41	D358
2625	Dozza                                                       	25	D360
2626	Dragoni                                                     	33	D361
2627	Drapia                                                      	9	D364
2628	Drena                                                       	78	D365
2629	Drenchia                                                    	34	D366
2630	Dresano                                                     	101	D367
2631	Drizzona                                                    	42	D370
2632	Dro                                                         	79	D371
2633	Dronero                                                     	82	D372
2634	Druento                                                     	99	D373
2635	Druogno                                                     	29	D374
2636	Dualchi                                                     	18	D376
2637	Dubino                                                      	27	D377
2638	Dueville                                                    	38	D379
2639	Dugenta                                                     	27	D380
2640	Duino-Aurisina                                              	1	D383
2641	Dumenza                                                     	65	D384
2642	Duno                                                        	66	D385
2643	Durazzano                                                   	28	D386
2644	Dusino San Michele                                          	52	D388
2645	Eboli                                                       	50	D390
2646	Edolo                                                       	68	D391
2647	Egna                                                        	29	D392
2648	Elice                                                       	18	D394
2649	Elini                                                       	5	D395
2650	Ello                                                        	33	D398
2651	Elmas                                                       	108	D399
2652	Elva                                                        	83	D401
2653	EmarŠse                                                     	25	D402
2654	Empoli                                                      	14	D403
2655	Endine Gaiano                                               	93	D406
2656	Enego                                                       	39	D407
2657	Enemonzo                                                    	35	D408
2658	Entracque                                                   	84	D410
2659	Entratico                                                   	94	D411
2660	Envie                                                       	85	D412
2661	Episcopia                                                   	30	D414
2662	Eraclea                                                     	13	D415
2663	Erba                                                        	95	D416
2664	ErbŠ                                                        	32	D419
2665	Erbezzo                                                     	33	D420
2666	Erbusco                                                     	69	D421
2667	Erchie                                                      	6	D422
2668	Erice                                                       	8	D423
2669	Erli                                                        	28	D424
2670	Erto e Casso                                                	19	D426
2671	Erve                                                        	34	D428
2672	Esanatoglia                                                 	16	D429
2673	Escalaplano                                                 	110	D430
2674	Escolca                                                     	111	D431
2675	Exilles                                                     	100	D433
2676	Esine                                                       	70	D434
2677	Esino Lario                                                 	35	D436
2678	Esperia                                                     	31	D440
2679	Esporlatu                                                   	28	D441
2680	Este                                                        	37	D442
2681	Esterzili                                                   	112	D443
2682	Etroubles                                                   	26	D444
2683	Eupilio                                                     	97	D445
2684	Fabbrica Curone                                             	67	D447
2685	Fabbrico                                                    	21	D450
2686	Fabriano                                                    	17	D451
2687	Fabrica di Roma                                             	24	D452
2688	Fabrizia                                                    	10	D453
2689	Fabro                                                       	11	D454
2690	Faedis                                                      	36	D455
2691	Faedo Valtellino                                            	28	D456
2692	Faedo                                                       	80	D457
2693	Faenza                                                      	10	D458
2694	Faeto                                                       	23	D459
2695	Fagagna                                                     	37	D461
2696	Faggeto Lario                                               	98	D462
2697	Faggiano                                                    	5	D463
2698	Fagnano Castello                                            	51	D464
2699	Fagnano Alto                                                	42	D465
2700	Fagnano Olona                                               	67	D467
2701	Fai della Paganella                                         	81	D468
2702	Faicchio                                                    	29	D469
2703	Falcade                                                     	19	D470
2704	Falciano del Massico                                        	101	D471
2705	Falconara Marittima                                         	18	D472
2706	Falconara Albanese                                          	52	D473
2707	Falcone                                                     	19	D474
2708	Faleria                                                     	25	D475
2709	Falerna                                                     	47	D476
2710	Falerone                                                    	5	D477
2711	Fallo                                                       	104	D480
2712	Falmenta                                                    	30	D481
2713	Faloppio                                                    	99	D482
2714	Falvaterra                                                  	32	D483
2715	Falzes                                                      	30	D484
2716	Fanano                                                      	11	D486
2717	Fanna                                                       	20	D487
2718	Fano                                                        	13	D488
2719	Fano Adriano                                                	24	D489
2720	Fara Gera d'Adda                                            	96	D490
2721	Fara Olivana con Sola                                       	97	D491
2722	Fara Novarese                                               	65	D492
2723	Fara in Sabina                                              	27	D493
2724	Fara Filiorum Petri                                         	30	D494
2725	Fara San Martino                                            	31	D495
2726	Fara Vicentino                                              	40	D496
2727	Fardella                                                    	31	D497
2728	Farigliano                                                  	86	D499
2729	Farindola                                                   	19	D501
2730	Farini                                                      	19	D502
2731	Farnese                                                     	26	D503
2732	Farra d'Isonzo                                              	5	D504
2733	Farra di Soligo                                             	26	D505
2734	Farra d'Alpago                                              	20	D506
2735	Fasano                                                      	7	D508
2736	Fascia                                                      	22	D509
2737	Fauglia                                                     	14	D510
2738	Faule                                                       	87	D511
2739	Favale di Malvaro                                           	23	D512
2740	Valsinni                                                    	30	D513
2741	Favara                                                      	17	D514
2742	Faver                                                       	82	D516
2743	Favignana                                                   	9	D518
2744	Favria                                                      	101	D520
2745	Orco Feglino                                                	44	D522
2746	Feisoglio                                                   	88	D523
2747	Feletto                                                     	102	D524
2748	Felino                                                      	13	D526
2749	Felitto                                                     	51	D527
2750	Felizzano                                                   	68	D528
2751	Felonica                                                    	23	D529
2752	Feltre                                                      	21	D530
2753	Fenegr•                                                     	100	D531
2754	Fenestrelle                                                 	103	D532
2755	F‚nis                                                       	27	D537
2756	Ferentillo                                                  	12	D538
2757	Ferentino                                                   	33	D539
2758	Ferla                                                       	8	D540
2759	Fermignano                                                  	14	D541
2760	Fermo                                                       	6	D542
2761	Ferno                                                       	68	D543
2762	Feroleto Antico                                             	48	D544
2763	Feroleto della Chiesa                                       	32	D545
2764	Pianopoli                                                   	96	D546
2765	Ferrandina                                                  	8	D547
2766	Ferrara                                                     	8	D548
2767	Ferrara di Monte Baldo                                      	34	D549
2768	Ferrazzano                                                  	23	D550
2769	Ferrera di Varese                                           	69	D551
2770	Ferrera Erbognone                                           	62	D552
2771	Moncenisio                                                  	157	D553
2772	Ferrere                                                     	53	D554
2773	Ferriere                                                    	20	D555
2774	Ferruzzano                                                  	33	D557
2775	Fraconalto                                                  	69	D559
2776	Fiamignano                                                  	28	D560
2777	Fiano Romano                                                	36	D561
2778	Fiano                                                       	104	D562
2779	Fiastra                                                     	17	D564
2780	FiavŠ                                                       	83	D565
2781	Poggio San Vicino                                           	40	D566
2782	Ficarazzi                                                   	35	D567
2783	Ficarolo                                                    	21	D568
2784	Ficarra                                                     	20	D569
2785	Ficulle                                                     	13	D570
2786	FiŠ allo Sciliar                                            	31	D571
2787	Fiera di Primiero                                           	84	D572
2788	Fierozzo                                                    	85	D573
2789	Fiesco                                                      	43	D574
2790	Fiesole                                                     	15	D575
2791	Fiesse                                                      	71	D576
2792	Fiesso Umbertiano                                           	22	D577
2793	Fiesso d'Artico                                             	14	D578
2794	Figino Serenza                                              	101	D579
2795	Figline Vegliaturo                                          	53	D582
2796	Gonnosn•                                                    	23	D585
2797	Filacciano                                                  	37	D586
2798	Filadelfia                                                  	11	D587
2799	Filago                                                      	98	D588
2800	Filandari                                                   	12	D589
2801	Filattiera                                                  	6	D590
2802	Filettino                                                   	34	D591
2803	Filetto                                                     	32	D592
2804	Filiano                                                     	32	D593
2805	Filighera                                                   	63	D594
2806	Filignano                                                   	19	D595
2807	Filogaso                                                    	13	D596
2808	Filottrano                                                  	19	D597
2809	Finale Emilia                                               	12	D599
2810	Finale Ligure                                               	29	D600
2811	Fino del Monte                                              	99	D604
2812	Fino Mornasco                                               	102	D605
2813	Fiorano al Serio                                            	100	D606
2814	Fiorano Modenese                                            	13	D607
2815	Fiorano Canavese                                            	105	D608
2816	Fiordimonte                                                 	18	D609
2817	Fiorenzuola d'Arda                                          	21	D611
2818	Firenze                                                     	17	D612
2819	Firenzuola                                                  	18	D613
2820	Firmo                                                       	54	D614
2821	Fisciano                                                    	52	D615
2822	Fiumalbo                                                    	14	D617
2823	Fiumara                                                     	34	D619
2824	Fiume Veneto                                                	21	D621
2825	Fiumedinisi                                                 	21	D622
2826	Fiumefreddo di Sicilia                                      	16	D623
2827	Fiumefreddo Bruzio                                          	55	D624
2828	Fiumicello                                                  	38	D627
2829	Fiuminata                                                   	19	D628
2830	Fivizzano                                                   	7	D629
2831	Flaibano                                                    	39	D630
2832	Flavon                                                      	86	D631
2833	Flero                                                       	72	D634
2834	Floresta                                                    	22	D635
2835	Floridia                                                    	9	D636
2836	Florinas                                                    	29	D637
2837	Flumeri                                                     	32	D638
2838	Fluminimaggiore                                             	6	D639
2839	Flussio                                                     	80	D640
2840	Fobello                                                     	57	D641
2841	Foggia                                                      	24	D643
2842	Foglianise                                                  	30	D644
2843	Fogliano Redipuglia                                         	6	D645
2844	Foglizzo                                                    	106	D646
2845	Foiano della Chiana                                         	18	D649
2846	Foiano di Val Fortore                                       	31	D650
2847	Folgaria                                                    	87	D651
2848	Folignano                                                   	20	D652
2849	Foligno                                                     	18	D653
2850	Follina                                                     	27	D654
2851	Follo                                                       	13	D655
2852	Follonica                                                   	9	D656
2853	Fombio                                                      	26	D660
2854	Fondachelli-Fantina                                         	23	D661
2855	Fondi                                                       	7	D662
2856	Fondo                                                       	88	D663
2857	Fonni                                                       	24	D665
2858	Fontainemore                                                	28	D666
2859	Fontana Liri                                                	36	D667
2860	Fontanelice                                                 	26	D668
2861	Fontanafredda                                               	22	D670
2862	Fontanarosa                                                 	33	D671
2863	Fontanella                                                  	101	D672
2864	Fontanellato                                                	15	D673
2865	Fontanelle                                                  	28	D674
2866	Fontaneto d'Agogna                                          	66	D675
2867	Fontanetto Po                                               	58	D676
2868	Fontanigorda                                                	24	D677
2869	Fontanile                                                   	54	D678
2870	Fontaniva                                                   	38	D679
2871	Fonte                                                       	29	D680
2872	Fontecchio                                                  	43	D681
2873	Fontechiari                                                 	37	D682
2874	Fontegreca                                                  	34	D683
2875	Fonteno                                                     	102	D684
2876	Fontevivo                                                   	16	D685
2877	Fonzaso                                                     	22	D686
2878	Foppolo                                                     	103	D688
2879	Forano                                                      	29	D689
2880	San Giovanni Teatino                                        	81	D690
2881	Force                                                       	21	D691
2882	Forchia                                                     	32	D693
2883	Forcola                                                     	29	D694
2884	Fordongianus                                                	20	D695
2885	Forenza                                                     	33	D696
2886	Foresto Sparso                                              	104	D697
2887	Forgaria nel Friuli                                         	137	D700
2888	Forino                                                      	34	D701
2889	Forio                                                       	31	D702
2890	Forl� del Sannio                                            	20	D703
2891	Forl�                                                       	12	D704
2892	Forlimpopoli                                                	13	D705
2893	Formazza                                                    	31	D706
2894	Formello                                                    	38	D707
2895	Formia                                                      	8	D708
2896	Formicola                                                   	35	D709
2897	Formigara                                                   	44	D710
2898	Formigine                                                   	15	D711
2899	Formigliana                                                 	59	D712
2900	Formignana                                                  	9	D713
2901	Fornace                                                     	89	D714
2902	Fornelli                                                    	21	D715
2903	Tonezza del Cimone                                          	106	D717
2904	Forni Avoltri                                               	40	D718
2905	Forni di Sopra                                              	41	D719
2906	Forni di Sotto                                              	42	D720
2907	Forno Canavese                                              	107	D725
2908	Forno di Zoldo                                              	24	D726
2909	Fornovo San Giovanni                                        	105	D727
2910	Fornovo di Taro                                             	17	D728
2911	Forte dei Marmi                                             	13	D730
2912	Fortezza                                                    	32	D731
2913	Fortunago                                                   	64	D732
2914	Forza d'Agr•                                                	24	D733
2915	Fosciandora                                                 	14	D734
2916	Fosdinovo                                                   	8	D735
2917	Fossa                                                       	44	D736
2918	Fossalto                                                    	24	D737
2919	Fossacesia                                                  	33	D738
2920	Fossalta di Piave                                           	15	D740
2921	Fossalta di Portogruaro                                     	16	D741
2922	Fossano                                                     	89	D742
2923	Fossato Serralta                                            	52	D744
2924	Fossato di Vico                                             	19	D745
2925	Montebello Ionico                                           	53	D746
2926	Foss•                                                       	17	D748
2927	Fossombrone                                                 	15	D749
2928	Foza                                                        	41	D750
2929	Frabosa Soprana                                             	90	D751
2930	Frabosa Sottana                                             	91	D752
2931	Fragagnano                                                  	6	D754
2932	Fragneto l'Abate                                            	33	D755
2933	Fragneto Monforte                                           	34	D756
2934	Fraine                                                      	34	D757
2935	Framura                                                     	14	D758
2936	Francavilla Bisio                                           	70	D759
2937	Francavilla d'Ete                                           	7	D760
2938	Francavilla Fontana                                         	8	D761
2939	Francavilla Angitola                                        	14	D762
2940	Francavilla al Mare                                         	35	D763
2941	Francavilla Marittima                                       	56	D764
2942	Francavilla di Sicilia                                      	25	D765
2943	Francavilla in Sinni                                        	34	D766
2944	Francica                                                    	15	D767
2945	Francofonte                                                 	10	D768
2946	Francolise                                                  	36	D769
2947	Frascaro                                                    	71	D770
2948	Frascarolo                                                  	65	D771
2949	Frascati                                                    	39	D773
2950	Frascineto                                                  	57	D774
2951	Frassilongo                                                 	90	D775
2952	Frassinelle Polesine                                        	23	D776
2953	Frassinello Monferrato                                      	72	D777
2954	Frassineto Po                                               	73	D780
2955	Frassinetto                                                 	108	D781
2956	Frassino                                                    	92	D782
2957	Frassinoro                                                  	16	D783
2958	Frasso Telesino                                             	35	D784
2959	Frasso Sabino                                               	30	D785
2960	Umbertide                                                   	56	D786
2961	Fratta Todina                                               	20	D787
2962	Fratta Polesine                                             	24	D788
2963	Frattamaggiore                                              	32	D789
2964	Frattaminore                                                	33	D790
2965	Fratte Rosa                                                 	16	D791
2966	Frazzan•                                                    	26	D793
2967	Fregona                                                     	30	D794
2968	Fresagrandinaria                                            	36	D796
2969	Fresonara                                                   	74	D797
2970	Frigento                                                    	35	D798
2971	Frignano                                                    	37	D799
2972	Villa di Briano                                             	98	D801
2973	Frinco                                                      	55	D802
2974	Frisa                                                       	37	D803
2975	Frisanco                                                    	24	D804
2976	Front                                                       	109	D805
2977	Frontino                                                    	17	D807
2978	Frontone                                                    	18	D808
2979	Frosinone                                                   	38	D810
2980	Frosolone                                                   	22	D811
2981	Frossasco                                                   	110	D812
2982	Frugarolo                                                   	75	D813
2983	Fubine                                                      	76	D814
2984	Fucecchio                                                   	19	D815
2985	Fuipiano Valle Imagna                                       	106	D817
2986	Fumane                                                      	35	D818
2987	Fumone                                                      	39	D819
2988	Funes                                                       	33	D821
2989	Furci                                                       	38	D823
2990	Furci Siculo                                                	27	D824
2991	Furnari                                                     	28	D825
2992	Furore                                                      	53	D826
2993	Furtei                                                      	4	D827
2994	Fuscaldo                                                    	58	D828
2995	Fusignano                                                   	11	D829
2996	Fusine                                                      	30	D830
2997	Futani                                                      	54	D832
2998	Gabbioneta-Binanuova                                        	45	D834
2999	Gabiano                                                     	77	D835
3000	Gabicce Mare                                                	19	D836
3001	Gaby                                                        	29	D839
3002	Gadesco-Pieve Delmona                                       	46	D841
3003	Gadoni                                                      	25	D842
3004	Gaeta                                                       	9	D843
3005	Gaggi                                                       	29	D844
3006	Gaggiano                                                    	103	D845
3007	Gaggio Montano                                              	27	D847
3008	Gaglianico                                                  	26	D848
3009	Gagliano Castelferrato                                      	10	D849
3010	Gagliano Aterno                                             	45	D850
3011	Gagliano del Capo                                           	28	D851
3012	Gagliato                                                    	55	D852
3013	Gagliole                                                    	20	D853
3014	Gaiarine                                                    	31	D854
3015	Gaiba                                                       	25	D855
3016	Gaiola                                                      	93	D856
3017	Gaiole in Chianti                                           	13	D858
3018	Gairo                                                       	6	D859
3019	Gais                                                        	34	D860
3020	Galati Mamertino                                            	30	D861
3021	Galatina                                                    	29	D862
3022	Galatone                                                    	30	D863
3023	Galatro                                                     	35	D864
3024	Galbiate                                                    	36	D865
3025	Galeata                                                     	14	D867
3026	Galgagnano                                                  	27	D868
3027	Gallarate                                                   	70	D869
3028	Gallese                                                     	27	D870
3029	Galliate Lombardo                                           	71	D871
3030	Galliate                                                    	68	D872
3031	Galliavola                                                  	66	D873
3032	Gallicano                                                   	15	D874
3033	Gallicano nel Lazio                                         	40	D875
3034	Gallicchio                                                  	35	D876
3035	Galliera                                                    	28	D878
3036	Galliera Veneta                                             	39	D879
3037	Gallinaro                                                   	40	D881
3038	Gallio                                                      	42	D882
3039	Gallipoli                                                   	31	D883
3040	Gallo Matese                                                	38	D884
3041	Gallodoro                                                   	31	D885
3042	Galluccio                                                   	39	D886
3043	Galtell�                                                    	27	D888
3044	Galzignano Terme                                            	40	D889
3045	Gamalero                                                    	78	D890
3046	Gambara                                                     	73	D891
3047	Gambarana                                                   	67	D892
3048	Gambasca                                                    	94	D894
3049	Gambassi Terme                                              	20	D895
3050	Gambatesa                                                   	25	D896
3051	Gambellara                                                  	43	D897
3052	Gamberale                                                   	39	D898
3053	Gambettola                                                  	15	D899
3054	Gambol•                                                     	68	D901
3055	Gambugliano                                                 	44	D902
3056	Gandellino                                                  	107	D903
3057	Gandino                                                     	108	D905
3058	Gandosso                                                    	109	D906
3059	Gangi                                                       	36	D907
3060	Garaguso                                                    	9	D909
3061	Garbagna                                                    	79	D910
3062	Garbagna Novarese                                           	69	D911
3063	Garbagnate Milanese                                         	105	D912
3064	Garbagnate Monastero                                        	37	D913
3065	Garda                                                       	36	D915
3066	Gardone Riviera                                             	74	D917
3067	Gardone Val Trompia                                         	75	D918
3068	Garessio                                                    	95	D920
3069	Gargallo                                                    	70	D921
3070	Gargazzone                                                  	35	D923
3071	Gargnano                                                    	76	D924
3072	Garlasco                                                    	69	D925
3073	Garlate                                                     	38	D926
3074	Garlenda                                                    	30	D927
3075	Garniga Terme                                               	91	D928
3076	Garzeno                                                     	106	D930
3077	Garzigliana                                                 	111	D931
3078	Gasperina                                                   	56	D932
3079	Gassino Torinese                                            	112	D933
3080	Gattatico                                                   	22	D934
3081	Gatteo                                                      	16	D935
3082	Gattico                                                     	71	D937
3083	Gattinara                                                   	61	D938
3084	Gavardo                                                     	77	D940
3085	Gavazzana                                                   	80	D941
3086	Gavello                                                     	26	D942
3087	Gaverina Terme                                              	110	D943
3088	Gavi                                                        	81	D944
3089	Gavignano                                                   	41	D945
3090	Gavirate                                                    	72	D946
3091	Gavoi                                                       	28	D947
3092	Gavorrano                                                   	10	D948
3093	Gazoldo degli Ippoliti                                      	24	D949
3094	Gazzada Schianno                                            	73	D951
3095	Gazzaniga                                                   	111	D952
3096	Gazzo                                                       	41	D956
3097	Gazzo Veronese                                              	37	D957
3098	Gazzola                                                     	22	D958
3099	Gazzuolo                                                    	25	D959
3100	Gela                                                        	7	D960
3101	Gemmano                                                     	4	D961
3102	Gemona del Friuli                                           	43	D962
3103	Gemonio                                                     	74	D963
3104	Genazzano                                                   	42	D964
3105	Genga                                                       	20	D965
3106	Genivolta                                                   	47	D966
3107	Genola                                                      	96	D967
3108	Genoni                                                      	81	D968
3109	Genova                                                      	25	D969
3110	Genuri                                                      	5	D970
3111	Genzano di Lucania                                          	36	D971
3112	Genzano di Roma                                             	43	D972
3113	Genzone                                                     	70	D973
3114	Gera Lario                                                  	107	D974
3115	Gerace                                                      	36	D975
3116	Locri                                                       	43	D976
3117	Geraci Siculo                                               	37	D977
3118	Gerano                                                      	44	D978
3119	Gerenzago                                                   	71	D980
3120	Gerenzano                                                   	75	D981
3121	Gergei                                                      	113	D982
3122	Germagnano                                                  	113	D983
3123	Germagno                                                    	32	D984
3124	Germignaga                                                  	76	D987
3125	Gerocarne                                                   	16	D988
3126	Gerola Alta                                                 	31	D990
3127	Gerre de' Caprioli                                          	48	D993
3128	Gesico                                                      	24	D994
3129	Gessate                                                     	106	D995
3130	Gessopalena                                                 	40	D996
3131	Gesturi                                                     	6	D997
3132	Gesualdo                                                    	36	D998
3133	Ghedi                                                       	78	D999
3134	Ghemme                                                      	73	E001
3135	Ghiffa                                                      	33	E003
3136	Ghilarza                                                    	21	E004
3137	Ghisalba                                                    	113	E006
3138	Ghislarengo                                                 	62	E007
3139	Giacciano con Baruchella                                    	27	E008
3140	Giaglione                                                   	114	E009
3141	Gianico                                                     	79	E010
3142	Giano Vetusto                                               	40	E011
3143	Giano dell'Umbria                                           	21	E012
3144	Giardinello                                                 	38	E013
3145	Giardini-Naxos                                              	32	E014
3146	Giarole                                                     	82	E015
3147	Giarratana                                                  	4	E016
3148	Giarre                                                      	17	E017
3149	Giave                                                       	30	E019
3150	Giaveno                                                     	115	E020
3151	Giavera del Montello                                        	32	E021
3152	Giba                                                        	7	E022
3153	Gibellina                                                   	10	E023
3154	Gifflenga                                                   	27	E024
3155	Giffone                                                     	37	E025
3156	Giffoni Sei Casali                                          	55	E026
3157	Giffoni Valle Piana                                         	56	E027
3158	Gignese                                                     	34	E028
3159	Gignod                                                      	30	E029
3160	Gildone                                                     	26	E030
3161	Gimigliano                                                  	58	E031
3162	Ginestra                                                    	99	E033
3163	Ginestra degli Schiavoni                                    	36	E034
3164	Ginosa                                                      	7	E036
3165	Gioi                                                        	57	E037
3166	Gioia del Colle                                             	21	E038
3167	Gioia Sannitica                                             	41	E039
3168	Gioia dei Marsi                                             	46	E040
3169	Gioia Tauro                                                 	38	E041
3170	Gioiosa Marea                                               	33	E043
3171	Gioiosa Ionica                                              	39	E044
3172	Giove                                                       	14	E045
3173	Giovinazzo                                                  	22	E047
3174	Giovo                                                       	92	E048
3175	Girasole                                                    	7	E049
3176	Girifalco                                                   	59	E050
3177	Gissi                                                       	41	E052
3178	Giuggianello                                                	32	E053
3179	Giugliano in Campania                                       	34	E054
3180	Giuliana                                                    	39	E055
3181	Giuliano Teatino                                            	42	E056
3182	Giuliano di Roma                                            	41	E057
3183	Giulianova                                                  	25	E058
3184	Giuncugnano                                                 	16	E059
3185	Giungano                                                    	58	E060
3186	Giurdignano                                                 	33	E061
3187	Giussago                                                    	72	E062
3188	Giussano                                                    	24	E063
3189	Giustenice                                                  	31	E064
3190	Giustino                                                    	93	E065
3191	Giusvalla                                                   	32	E066
3192	Givoletto                                                   	116	E067
3193	Gizzeria                                                    	60	E068
3194	Glorenza                                                    	36	E069
3195	Sesta Godano                                                	28	E070
3196	Godega di Sant'Urbano                                       	33	E071
3197	Godiasco Salice Terme                                       	73	E072
3198	Godrano                                                     	40	E074
3199	Goito                                                       	26	E078
3200	Golasecca                                                   	77	E079
3201	Golferenzo                                                  	74	E081
3202	Gombito                                                     	49	E082
3203	Gonars                                                      	44	E083
3204	Goni                                                        	27	E084
3205	Gonnosfanadiga                                              	7	E085
3206	Gonnesa                                                     	8	E086
3207	Gonnoscodina                                                	22	E087
3208	Gonnostramatza                                              	24	E088
3209	Gonzaga                                                     	27	E089
3210	Gordona                                                     	32	E090
3211	Gorga                                                       	45	E091
3212	Gorgo al Monticano                                          	34	E092
3213	Gorgoglione                                                 	10	E093
3214	Gorgonzola                                                  	108	E094
3215	Goriano Sicoli                                              	47	E096
3216	Gorizia                                                     	7	E098
3217	Gorlago                                                     	114	E100
3218	Gorla Maggiore                                              	78	E101
3219	Gorla Minore                                                	79	E102
3220	Gorle                                                       	115	E103
3221	Gornate Olona                                               	80	E104
3222	Gorno                                                       	116	E106
3223	Goro                                                        	25	E107
3224	Gorreto                                                     	26	E109
3225	Gorzegno                                                    	97	E111
3226	Gosaldo                                                     	25	E113
3227	Gossolengo                                                  	23	E114
3228	Gottasecca                                                  	98	E115
3229	Gottolengo                                                  	80	E116
3230	Govone                                                      	99	E118
3231	Gozzano                                                     	76	E120
3232	Gradara                                                     	20	E122
3233	Gradisca d'Isonzo                                           	8	E124
3234	Grado                                                       	9	E125
3235	Gradoli                                                     	28	E126
3236	Graffignana                                                 	28	E127
3237	Graffignano                                                 	29	E128
3238	Graglia                                                     	28	E130
3239	Gragnano                                                    	35	E131
3240	Gragnano Trebbiense                                         	24	E132
3241	Grammichele                                                 	18	E133
3242	Grana                                                       	56	E134
3243	Granaglione                                                 	29	E135
3244	Granarolo dell'Emilia                                       	30	E136
3245	Grancona                                                    	45	E138
3246	Grandate                                                    	110	E139
3247	Grandola ed Uniti                                           	111	E141
3248	Graniti                                                     	34	E142
3249	Granozzo con Monticello                                     	77	E143
3250	Grantola                                                    	81	E144
3251	Grantorto                                                   	42	E145
3252	Granze                                                      	43	E146
3253	Grassano                                                    	11	E147
3254	Grassobbio                                                  	117	E148
3255	Gratteri                                                    	41	E149
3256	Grauno                                                      	94	E150
3257	Gravellona Lomellina                                        	75	E152
3258	Gravellona Toce                                             	35	E153
3259	Gravere                                                     	117	E154
3260	Gravina in Puglia                                           	23	E155
3261	Gravina di Catania                                          	19	E156
3262	Grazzanise                                                  	42	E158
3263	Grazzano Badoglio                                           	57	E159
3264	Greccio                                                     	31	E160
3265	Greci                                                       	37	E161
3266	Greggio                                                     	65	E163
3267	Gremiasco                                                   	83	E164
3268	Gressan                                                     	31	E165
3269	Gressoney-La-Trinit‚                                        	32	E167
3270	Gressoney-Saint-Jean                                        	33	E168
3271	Greve in Chianti                                            	21	E169
3272	Grezzago                                                    	110	E170
3273	Grezzana                                                    	38	E171
3274	Griante                                                     	113	E172
3275	Gricignano di Aversa                                        	43	E173
3276	Grignasco                                                   	79	E177
3277	Grigno                                                      	95	E178
3278	Grimacco                                                    	45	E179
3279	Grimaldi                                                    	59	E180
3280	Grinzane Cavour                                             	100	E182
3281	Grisignano di Zocco                                         	46	E184
3282	Grisolia                                                    	60	E185
3283	Grizzana Morandi                                            	31	E187
3284	Grognardo                                                   	84	E188
3285	Gromo                                                       	118	E189
3286	Grondona                                                    	85	E191
3287	Grone                                                       	119	E192
3288	Grontardo                                                   	50	E193
3289	Gropello Cairoli                                            	76	E195
3290	Gropparello                                                 	25	E196
3291	Groscavallo                                                 	118	E199
3292	Grosio                                                      	33	E200
3293	Grosotto                                                    	34	E201
3294	Grosseto                                                    	11	E202
3295	Grosso                                                      	119	E203
3296	Grottaferrata                                               	46	E204
3297	Grottaglie                                                  	8	E205
3298	Grottaminarda                                               	38	E206
3299	Grottammare                                                 	23	E207
3300	Grottazzolina                                               	8	E208
3301	Grotte                                                      	18	E209
3302	Grotte di Castro                                            	30	E210
3303	Grotteria                                                   	40	E212
3304	Grottole                                                    	12	E213
3305	Grottolella                                                 	39	E214
3306	Gruaro                                                      	18	E215
3307	Grugliasco                                                  	120	E216
3308	Grumello Cremonese ed Uniti                                 	51	E217
3309	Grumello del Monte                                          	120	E219
3310	Grumento Nova                                               	37	E221
3311	Grumes                                                      	96	E222
3312	Grumo Appula                                                	24	E223
3313	Grumo Nevano                                                	36	E224
3314	Grumolo delle Abbadesse                                     	47	E226
3315	Guagnano                                                    	34	E227
3316	Gualdo                                                      	21	E228
3317	Gualdo Cattaneo                                             	22	E229
3318	Gualdo Tadino                                               	23	E230
3319	Gualtieri                                                   	23	E232
3320	Gualtieri Sicamin•                                          	35	E233
3321	Guamaggiore                                                 	30	E234
3322	Guanzate                                                    	114	E235
3323	Guarcino                                                    	42	E236
3324	Guardabosone                                                	66	E237
3325	Guardamiglio                                                	29	E238
3326	Guardavalle                                                 	61	E239
3327	Guarda Veneta                                               	28	E240
3328	Guardea                                                     	15	E241
3329	Guardia Piemontese                                          	61	E242
3330	Guardiagrele                                                	43	E243
3331	Guardialfiera                                               	27	E244
3332	Guardia Lombardi                                            	40	E245
3333	Guardia Perticara                                           	38	E246
3334	Guardiaregia                                                	28	E248
3335	Guardia Sanframondi                                         	37	E249
3336	Guardistallo                                                	15	E250
3337	Guarene                                                     	101	E251
3338	Guasila                                                     	31	E252
3339	Guastalla                                                   	24	E253
3340	Guazzora                                                    	86	E255
3341	Gubbio                                                      	24	E256
3342	Gudo Visconti                                               	112	E258
3343	Guglionesi                                                  	29	E259
3344	Guidizzolo                                                  	28	E261
3345	Guidonia Montecelio                                         	47	E263
3346	Guiglia                                                     	17	E264
3347	Siziano                                                     	150	E265
3348	Guilmi                                                      	44	E266
3349	Gurro                                                       	36	E269
3350	Guspini                                                     	8	E270
3351	Gussago                                                     	81	E271
3352	Gussola                                                     	52	E272
3353	H“ne                                                        	34	E273
3354	Jacurso                                                     	65	E274
3355	Idro                                                        	82	E280
3356	Iglesias                                                    	9	E281
3357	Igliano                                                     	102	E282
3358	Ilbono                                                      	8	E283
3359	Illasi                                                      	39	E284
3360	Illorai                                                     	31	E285
3361	Imbersago                                                   	39	E287
3362	Imer                                                        	97	E288
3363	Imola                                                       	32	E289
3364	Imperia                                                     	31	E290
3365	Impruneta                                                   	22	E291
3366	Inarzo                                                      	82	E292
3367	Incisa Scapaccino                                           	58	E295
3368	Incudine                                                    	83	E297
3369	Induno Olona                                                	83	E299
3370	Ingria                                                      	121	E301
3371	Intragna                                                    	37	E304
3372	Introbio                                                    	40	E305
3373	Introd                                                      	35	E306
3374	Introdacqua                                                 	48	E307
3375	Introzzo                                                    	41	E308
3376	Inverigo                                                    	118	E309
3377	Inverno e Monteleone                                        	77	E310
3378	Inverso Pinasca                                             	122	E311
3379	Inveruno                                                    	113	E313
3380	Invorio                                                     	82	E314
3381	Inzago                                                      	114	E317
3382	Jolanda di Savoia                                           	10	E320
3383	Ionadi                                                      	17	E321
3384	Irgoli                                                      	33	E323
3385	Irma                                                        	84	E325
3386	Irsina                                                      	13	E326
3387	Isasca                                                      	103	E327
3388	Isca sullo Ionio                                            	63	E328
3389	Ischia                                                      	37	E329
3390	Ischia di Castro                                            	31	E330
3391	Ischitella                                                  	25	E332
3392	Iseo                                                        	85	E333
3393	Isera                                                       	98	E334
3394	Isernia                                                     	23	E335
3395	Isili                                                       	114	E336
3396	Isnello                                                     	42	E337
3397	Isola d'Asti                                                	59	E338
3398	Isola di Capo Rizzuto                                       	13	E339
3399	Isola del Liri                                              	43	E340
3400	Isola del Cantone                                           	27	E341
3401	Madesimo                                                    	35	E342
3402	Isola del Gran Sasso d'Italia                               	26	E343
3403	Isolabella                                                  	123	E345
3404	Isolabona                                                   	32	E346
3405	Isola del Giglio                                            	12	E348
3406	Isola della Scala                                           	40	E349
3407	Isola delle Femmine                                         	43	E350
3408	Isola del Piano                                             	21	E351
3409	Isola di Fondra                                             	121	E353
3410	Isola Vicentina                                             	48	E354
3411	Isola Dovarese                                              	53	E356
3412	Isola Rizza                                                 	41	E358
3413	Isola Sant'Antonio                                          	87	E360
3414	Isole Tremiti                                               	26	E363
3415	Isorella                                                    	86	E364
3416	Ispani                                                      	59	E365
3417	Ispica                                                      	5	E366
3418	Ispra                                                       	84	E367
3419	Issiglio                                                    	124	E368
3420	Issime                                                      	36	E369
3421	Isso                                                        	122	E370
3422	Issogne                                                     	37	E371
3423	Vasto                                                       	99	E372
3424	Istrana                                                     	35	E373
3425	Itala                                                       	36	E374
3426	Itri                                                        	10	E375
3427	Ittireddu                                                   	32	E376
3428	Ittiri                                                      	33	E377
3429	Ivano-Fracena                                               	99	E378
3430	Ivrea                                                       	125	E379
3431	Izano                                                       	54	E380
3432	Jelsi                                                       	30	E381
3433	Jenne                                                       	48	E382
3434	Jerago con Orago                                            	85	E386
3435	Jerzu                                                       	9	E387
3436	Jesi                                                        	21	E388
3437	Joppolo                                                     	18	E389
3438	Joppolo Giancaxio                                           	19	E390
3439	Joven‡an                                                    	38	E391
3440	Labico                                                      	49	E392
3441	Labro                                                       	32	E393
3442	La Cassa                                                    	126	E394
3443	Lacchiarella                                                	115	E395
3444	Lacco Ameno                                                 	38	E396
3445	Lacedonia                                                   	41	E397
3446	Laces                                                       	37	E398
3447	Laconi                                                      	82	E400
3448	Laerru                                                      	34	E401
3449	Laganadi                                                    	41	E402
3450	Laghi                                                       	49	E403
3451	Laglio                                                      	119	E405
3452	Lagnasco                                                    	104	E406
3453	Lago                                                        	62	E407
3454	Lagonegro                                                   	39	E409
3455	Lagosanto                                                   	11	E410
3456	Lagundo                                                     	38	E412
3457	Lajatico                                                    	16	E413
3458	Laigueglia                                                  	33	E414
3459	Lainate                                                     	116	E415
3460	Laino                                                       	120	E416
3461	Laino Borgo                                                 	63	E417
3462	Laino Castello                                              	64	E419
3463	Laion                                                       	39	E420
3464	Laives                                                      	40	E421
3465	Lallio                                                      	123	E422
3466	La Loggia                                                   	127	E423
3467	Lama dei Peligni                                            	45	E424
3468	La Maddalena                                                	12	E425
3469	Lama Mocogno                                                	18	E426
3470	Lambrugo                                                    	121	E428
3471	Lamon                                                       	26	E429
3472	La Morra                                                    	105	E430
3473	Lampedusa e Linosa                                          	20	E431
3474	Lamporecchio                                                	5	E432
3475	Lamporo                                                     	67	E433
3476	Lana                                                        	41	E434
3477	Lanciano                                                    	46	E435
3478	Landiona                                                    	83	E436
3479	Landriano                                                   	78	E437
3480	Langhirano                                                  	18	E438
3481	Langosco                                                    	79	E439
3482	Lanusei                                                     	10	E441
3483	Lanzada                                                     	36	E443
3484	Lanzo d'Intelvi                                             	122	E444
3485	Lanzo Torinese                                              	128	E445
3486	Lapedona                                                    	9	E447
3487	Lapio                                                       	42	E448
3488	Lappano                                                     	65	E450
3489	Larciano                                                    	6	E451
3490	Lardaro                                                     	100	E452
3491	Lardirago                                                   	80	E454
3492	Larino                                                      	31	E456
3493	Lasa                                                        	42	E457
3494	La Salle                                                    	40	E458
3495	Lascari                                                     	44	E459
3496	Lasino                                                      	101	E461
3497	Lasnigo                                                     	123	E462
3498	La Spezia                                                   	15	E463
3499	Las Plassas                                                 	9	E464
3500	Lastebasse                                                  	50	E465
3501	Lastra a Signa                                              	24	E466
3502	Latera                                                      	32	E467
3503	Laterina                                                    	19	E468
3504	Laterza                                                     	9	E469
3505	La Thuile                                                   	41	E470
3506	Latiano                                                     	9	E471
3507	Latina                                                      	11	E472
3508	Latisana                                                    	46	E473
3509	Latronico                                                   	40	E474
3510	Lattarico                                                   	66	E475
3511	Lauco                                                       	47	E476
3512	Laureana di Borrello                                        	42	E479
3513	Laureana Cilento                                            	60	E480
3514	Lauregno                                                    	43	E481
3515	Laurenzana                                                  	41	E482
3516	Lauria                                                      	42	E483
3517	Lauriano                                                    	129	E484
3518	Laurino                                                     	61	E485
3519	Laurito                                                     	62	E486
3520	Lauro                                                       	43	E487
3521	Lavagna                                                     	28	E488
3522	Lavagno                                                     	42	E489
3523	La Valle Agordina                                           	27	E490
3524	La Valle                                                    	117	E491
3525	Lavarone                                                    	102	E492
3526	Lavello                                                     	43	E493
3527	Lavena Ponte Tresa                                          	86	E494
3528	Laveno-Mombello                                             	87	E496
3529	Lavenone                                                    	87	E497
3530	Laviano                                                     	63	E498
3531	Lavis                                                       	103	E500
3532	Lazise                                                      	43	E502
3533	Lazzate                                                     	25	E504
3534	Lecce nei Marsi                                             	50	E505
3535	Lecce                                                       	35	E506
3536	Lecco                                                       	42	E507
3537	Leffe                                                       	124	E509
3538	Leggiuno                                                    	88	E510
3539	Legnago                                                     	44	E512
3540	Legnano                                                     	118	E514
3541	Legnaro                                                     	44	E515
3542	Lei                                                         	38	E517
3543	Leini                                                       	130	E518
3544	Leivi                                                       	29	E519
3545	Lemie                                                       	131	E520
3546	Lendinara                                                   	29	E522
3547	Leni                                                        	37	E523
3548	Lenna                                                       	125	E524
3549	Leno                                                        	88	E526
3550	Lenola                                                      	12	E527
3551	Lenta                                                       	68	E528
3552	Osmate                                                      	111	E529
3553	Lentate sul Seveso                                          	54	E530
3554	Lentella                                                    	47	E531
3555	Lentini                                                     	11	E532
3556	Leonessa                                                    	33	E535
3557	Leonforte                                                   	11	E536
3558	Leporano                                                    	10	E537
3559	Lequile                                                     	36	E538
3560	Lequio Tanaro                                               	107	E539
3561	Lequio Berria                                               	106	E540
3562	Lercara Friddi                                              	45	E541
3563	Lerici                                                      	16	E542
3564	Lerma                                                       	88	E543
3565	Lesa                                                        	84	E544
3566	Lesegno                                                     	108	E546
3567	Lesignano de' Bagni                                         	19	E547
3568	Terenzo                                                     	38	E548
3569	Lesina                                                      	27	E549
3570	Lesmo                                                       	26	E550
3571	Lessolo                                                     	132	E551
3572	Lessona                                                     	29	E552
3573	Lestizza                                                    	48	E553
3574	Letino                                                      	44	E554
3575	Letojanni                                                   	38	E555
3576	Lettere                                                     	39	E557
3577	Lettomanoppello                                             	20	E558
3578	Lettopalena                                                 	48	E559
3579	Levanto                                                     	17	E560
3580	Levate                                                      	126	E562
3581	Leverano                                                    	37	E563
3582	Levice                                                      	109	E564
3583	Levico Terme                                                	104	E565
3584	Levone                                                      	133	E566
3585	Lezzeno                                                     	126	E569
3586	Liberi                                                      	45	E570
3587	Librizzi                                                    	39	E571
3588	Licata                                                      	21	E573
3589	Licciana Nardi                                              	9	E574
3590	Licenza                                                     	51	E576
3591	Licodia Eubea                                               	20	E578
3592	Lierna                                                      	43	E581
3593	Lignana                                                     	70	E583
3594	Lignano Sabbiadoro                                          	49	E584
3595	Ligonchio                                                   	25	E585
3596	Ligosullo                                                   	50	E586
3597	Lillianes                                                   	42	E587
3598	Limana                                                      	29	E588
3599	Limatola                                                    	38	E589
3600	Limbadi                                                     	19	E590
3601	Limbiate                                                    	27	E591
3602	Limena                                                      	45	E592
3603	Limido Comasco                                              	128	E593
3604	Limina                                                      	40	E594
3605	Limone sul Garda                                            	89	E596
3606	Limone Piemonte                                             	110	E597
3607	Limosano                                                    	32	E599
3608	Linarolo                                                    	81	E600
3609	Linguaglossa                                                	21	E602
3610	Lioni                                                       	44	E605
3611	Lipari                                                      	41	E606
3612	Lipomo                                                      	129	E607
3613	Lirio                                                       	82	E608
3614	Liscate                                                     	122	E610
3615	Liscia                                                      	49	E611
3616	Lisciano Niccone                                            	25	E613
3617	Lisignago                                                   	105	E614
3618	Lisio                                                       	111	E615
3619	Lissone                                                     	28	E617
3620	Milena                                                      	10	E618
3621	Liveri                                                      	40	E620
3622	Livigno                                                     	37	E621
3623	Livinallongo del Col di Lana                                	30	E622
3624	Livo                                                        	130	E623
3625	Livo                                                        	106	E624
3626	Livorno                                                     	9	E625
3627	Livorno Ferraris                                            	71	E626
3628	Livraga                                                     	30	E627
3629	Lizzanello                                                  	38	E629
3630	Lizzano                                                     	11	E630
3631	Loano                                                       	34	E632
3632	Loazzolo                                                    	60	E633
3633	Locana                                                      	134	E635
3634	Locate Varesino                                             	131	E638
3635	Locate di Triulzi                                           	125	E639
3636	Locatello                                                   	127	E640
3637	Loceri                                                      	11	E644
3638	Locorotondo                                                 	25	E645
3639	Loculi                                                      	40	E646
3640	LodŠ                                                        	41	E647
3641	Lodi                                                        	31	E648
3642	Lodine                                                      	104	E649
3643	Lodi Vecchio                                                	32	E651
3644	Lodrino                                                     	90	E652
3645	Lograto                                                     	91	E654
3646	Loiano                                                      	34	E655
3647	Lomagna                                                     	44	E656
3648	Lomazzo                                                     	133	E659
3649	Lombardore                                                  	135	E660
3650	Lombriasco                                                  	136	E661
3651	Lomello                                                     	83	E662
3652	Lona-Lases                                                  	108	E664
3653	Lonate Ceppino                                              	89	E665
3654	Lonate Pozzolo                                              	90	E666
3655	Londa                                                       	25	E668
3656	Longano                                                     	24	E669
3657	Longare                                                     	51	E671
3658	Longhena                                                    	93	E673
3659	Longi                                                       	42	E674
3660	Longiano                                                    	18	E675
3661	Longobardi                                                  	67	E677
3662	Longobucco                                                  	68	E678
3663	Longone al Segrino                                          	134	E679
3664	Porto Azzurro                                               	13	E680
3665	Longone Sabino                                              	34	E681
3666	Lonigo                                                      	52	E682
3667	LoranzŠ                                                     	137	E683
3668	Loreggia                                                    	46	E684
3669	Loreglia                                                    	38	E685
3670	Lorenzago di Cadore                                         	32	E687
3671	Loreo                                                       	30	E689
3672	Loreto                                                      	22	E690
3673	Loreto Aprutino                                             	21	E691
3674	Loria                                                       	36	E692
3675	Loro Ciuffenna                                              	20	E693
3676	Loro Piceno                                                 	22	E694
3677	Lorsica                                                     	30	E695
3678	Losine                                                      	94	E698
3679	Lotzorai                                                    	12	E700
3680	Lovere                                                      	128	E704
3681	Lovero                                                      	38	E705
3682	Lozio                                                       	95	E706
3683	Lozza                                                       	91	E707
3684	Lozzo di Cadore                                             	33	E708
3685	Lozzo Atestino                                              	47	E709
3686	Lozzolo                                                     	72	E711
3687	Lu                                                          	89	E712
3688	Lubriano                                                    	33	E713
3689	Lucca Sicula                                                	22	E714
3690	Lucca                                                       	17	E715
3691	Lucera                                                      	28	E716
3692	Lucignano                                                   	21	E718
3693	Lucinasco                                                   	33	E719
3694	Lucito                                                      	33	E722
3695	Luco dei Marsi                                              	51	E723
3696	Lucoli                                                      	52	E724
3697	Lugagnano Val d'Arda                                        	26	E726
3698	Lugnacco                                                    	138	E727
3699	Lugnano in Teverina                                         	16	E729
3700	Lugo                                                        	12	E730
3701	Lugo di Vicenza                                             	53	E731
3702	Luino                                                       	92	E734
3703	Luisago                                                     	135	E735
3704	Lula                                                        	43	E736
3705	Lumarzo                                                     	31	E737
3706	Lumezzane                                                   	96	E738
3707	Lunamatrona                                                 	10	E742
3708	Lunano                                                      	22	E743
3709	Lungro                                                      	69	E745
3710	Luogosano                                                   	45	E746
3711	Luogosanto                                                  	14	E747
3712	Lupara                                                      	34	E748
3713	Lurago d'Erba                                               	136	E749
3714	Lurago Marinone                                             	137	E750
3715	Lurano                                                      	129	E751
3716	Luras                                                       	15	E752
3717	Lurate Caccivio                                             	138	E753
3718	Lusciano                                                    	46	E754
3719	Luserna                                                     	109	E757
3720	Luserna San Giovanni                                        	139	E758
3721	Lusernetta                                                  	140	E759
3722	Lusevera                                                    	51	E760
3723	Lusia                                                       	31	E761
3724	Lusiana                                                     	54	E762
3725	LusigliŠ                                                    	141	E763
3726	Luson                                                       	44	E764
3727	Lustra                                                      	64	E767
3728	Luvinate                                                    	93	E769
3729	Luzzana                                                     	130	E770
3730	Luzzara                                                     	26	E772
3731	Luzzi                                                       	70	E773
3732	Maccastorna                                                 	33	E777
3733	Macchia d'Isernia                                           	25	E778
3734	Macchiagodena                                               	26	E779
3735	Macchia Valfortore                                          	35	E780
3736	Macello                                                     	142	E782
3737	Macerata                                                    	23	E783
3738	Macerata Campania                                           	47	E784
3739	Macerata Feltria                                            	23	E785
3740	Macherio                                                    	29	E786
3741	Maclodio                                                    	97	E787
3742	Macomer                                                     	44	E788
3743	Macra                                                       	112	E789
3744	Macugnaga                                                   	39	E790
3745	Maddaloni                                                   	48	E791
3746	Madignano                                                   	55	E793
3747	Madone                                                      	131	E794
3748	Madonna del Sasso                                           	40	E795
3749	Maenza                                                      	13	E798
3750	Mafalda                                                     	36	E799
3751	Magasa                                                      	98	E800
3752	Magenta                                                     	130	E801
3753	Maggiora                                                    	88	E803
3754	Magherno                                                    	85	E804
3755	Magione                                                     	26	E805
3756	Magisano                                                    	68	E806
3757	Magliano di Tenna                                           	10	E807
3758	Magliano Alpi                                               	114	E808
3759	Magliano Alfieri                                            	113	E809
3760	Magliano in Toscana                                         	13	E810
3761	Magliano de' Marsi                                          	53	E811
3762	Magliano Sabina                                             	35	E812
3763	Magliano Romano                                             	52	E813
3764	Magliano Vetere                                             	65	E814
3765	Maglie                                                      	39	E815
3766	Magliolo                                                    	35	E816
3767	Maglione                                                    	143	E817
3768	Magnacavallo                                                	29	E818
3769	Magnago                                                     	131	E819
3770	Magnano in Riviera                                          	52	E820
3771	Magnano                                                     	30	E821
3772	Magomadas                                                   	83	E825
3773	MagrŠ sulla strada del vino                                 	45	E829
3774	Magreglio                                                   	139	E830
3775	Majano                                                      	53	E833
3776	Maida                                                       	69	E834
3777	Maier…                                                      	71	E835
3778	Maierato                                                    	20	E836
3779	Maiolati Spontini                                           	23	E837
3780	Maiolo                                                      	22	E838
3781	Maiori                                                      	66	E839
3782	Mairago                                                     	34	E840
3783	Mairano                                                     	99	E841
3784	Maissana                                                    	18	E842
3785	Malagnino                                                   	56	E843
3786	Malalbergo                                                  	35	E844
3787	Malborghetto Valbruna                                       	54	E847
3788	Malcesine                                                   	45	E848
3789	MalŠ                                                        	110	E850
3790	Malegno                                                     	100	E851
3791	Maleo                                                       	35	E852
3792	Malesco                                                     	41	E853
3793	Maletto                                                     	22	E854
3794	Malfa                                                       	43	E855
3795	Malgesso                                                    	95	E856
3796	Malgrate                                                    	45	E858
3797	Malito                                                      	72	E859
3798	Mallare                                                     	36	E860
3799	Malles Venosta                                              	46	E862
3800	Malnate                                                     	96	E863
3801	Malo                                                        	55	E864
3802	Malonno                                                     	101	E865
3803	Malosco                                                     	111	E866
3804	Maltignano                                                  	27	E868
3805	Malvagna                                                    	44	E869
3806	Malvicino                                                   	90	E870
3807	Malvito                                                     	73	E872
3808	Mammola                                                     	44	E873
3809	Mamoiada                                                    	46	E874
3810	Manciano                                                    	14	E875
3811	Mandanici                                                   	45	E876
3812	Mandas                                                      	36	E877
3813	Mandatoriccio                                               	74	E878
3814	Mandello del Lario                                          	46	E879
3815	Mandello Vitta                                              	90	E880
3816	Manduria                                                    	12	E882
3817	Manerba del Garda                                           	102	E883
3818	Manerbio                                                    	103	E884
3819	Manfredonia                                                 	29	E885
3820	Mango                                                       	115	E887
3821	Mangone                                                     	75	E888
3822	Maniago                                                     	25	E889
3823	Manocalzati                                                 	46	E891
3824	Manoppello                                                  	22	E892
3825	MansuŠ                                                      	37	E893
3826	Manta                                                       	116	E894
3827	Mantello                                                    	39	E896
3828	Mantova                                                     	30	E897
3829	Manzano                                                     	55	E899
3830	Manziana                                                    	54	E900
3831	Mapello                                                     	132	E901
3832	Mara                                                        	38	E902
3833	Maracalagonis                                               	37	E903
3834	Maranello                                                   	19	E904
3835	Marano sul Panaro                                           	20	E905
3836	Marano di Napoli                                            	41	E906
3837	Marano Ticino                                               	91	E907
3838	Marano Equo                                                 	55	E908
3839	Marano Lagunare                                             	56	E910
3840	Marano di Valpolicella                                      	46	E911
3841	Marano Vicentino                                            	56	E912
3842	Marano Marchesato                                           	76	E914
3843	Marano Principato                                           	77	E915
3844	Maranzana                                                   	61	E917
3845	Maratea                                                     	44	E919
3846	Marcallo con Casone                                         	134	E921
3847	Marcaria                                                    	31	E922
3848	Marcedusa                                                   	71	E923
3849	Marcellina                                                  	56	E924
3850	Marcellinara                                                	72	E925
3851	Marcetelli                                                  	36	E927
3852	Marcheno                                                    	104	E928
3853	Marchirolo                                                  	97	E929
3854	Marciana                                                    	10	E930
3855	Marciana Marina                                             	11	E931
3856	Marcianise                                                  	49	E932
3857	Marciano della Chiana                                       	22	E933
3858	Marcignago                                                  	86	E934
3859	Marcon                                                      	20	E936
3860	Marebbe                                                     	47	E938
3861	Marene                                                      	117	E939
3862	Mareno di Piave                                             	38	E940
3863	Marentino                                                   	144	E941
3864	Maretto                                                     	62	E944
3865	Margarita                                                   	118	E945
3866	Margherita di Savoia                                        	5	E946
3867	Margno                                                      	47	E947
3868	Mariana Mantovana                                           	32	E949
3869	Mariano Comense                                             	143	E951
3870	Mariano del Friuli                                          	10	E952
3871	Marianopoli                                                 	8	E953
3872	Mariglianella                                               	42	E954
3873	Marigliano                                                  	43	E955
3874	Marina di Gioiosa Ionica                                    	45	E956
3875	Marineo                                                     	46	E957
3876	Marino                                                      	57	E958
3877	Marlengo                                                    	48	E959
3878	Marliana                                                    	7	E960
3879	Marmentino                                                  	105	E961
3880	Marmirolo                                                   	33	E962
3881	Marmora                                                     	119	E963
3882	Marnate                                                     	98	E965
3883	Marone                                                      	106	E967
3884	Maropati                                                    	46	E968
3885	Marostica                                                   	57	E970
3886	Marradi                                                     	26	E971
3887	Marrubiu                                                    	25	E972
3888	Marsaglia                                                   	120	E973
3889	Marsala                                                     	11	E974
3890	Marsciano                                                   	27	E975
3891	Marsico Nuovo                                               	45	E976
3892	Marsicovetere                                               	46	E977
3893	Marta                                                       	34	E978
3894	Martano                                                     	40	E979
3895	Martellago                                                  	21	E980
3896	Martello                                                    	49	E981
3897	Martignacco                                                 	57	E982
3898	Martignana di Po                                            	57	E983
3899	Martignano                                                  	41	E984
3900	Martina Franca                                              	13	E986
3901	Martinengo                                                  	133	E987
3902	Martiniana Po                                               	121	E988
3903	Martinsicuro                                                	47	E989
3904	Martirano                                                   	73	E990
3905	Martirano Lombardo                                          	74	E991
3906	Martis                                                      	39	E992
3907	Martone                                                     	47	E993
3908	Marudo                                                      	36	E994
3909	Maruggio                                                    	14	E995
3910	Marzano di Nola                                             	47	E997
3911	Marzano Appio                                               	50	E998
3912	Marzano                                                     	87	E999
3913	Marzi                                                       	78	F001
3914	Marzio                                                      	99	F002
3915	Masate                                                      	136	F003
3916	Mascali                                                     	23	F004
3917	Mascalucia                                                  	24	F005
3918	Maschito                                                    	47	F006
3919	Masciago Primo                                              	100	F007
3920	Maser                                                       	39	F009
3921	Masera                                                      	42	F010
3922	Maser… di Padova                                            	48	F011
3923	Maserada sul Piave                                          	40	F012
3924	Masi                                                        	49	F013
3925	Masio                                                       	91	F015
3926	Masi Torello                                                	12	F016
3927	Maslianico                                                  	144	F017
3928	Mason Vicentino                                             	58	F019
3929	Masone                                                      	32	F020
3930	Massa Fermana                                               	11	F021
3931	Massa d'Albe                                                	54	F022
3932	Massa                                                       	10	F023
3933	Massa Martana                                               	28	F024
3934	Massa e Cozzile                                             	8	F025
3935	Massafra                                                    	15	F027
3936	Massalengo                                                  	37	F028
3937	Massa Lombarda                                              	13	F029
3938	Massa Lubrense                                              	44	F030
3939	Massa Marittima                                             	15	F032
3940	Massanzago                                                  	50	F033
3941	Massarosa                                                   	18	F035
3942	Massazza                                                    	31	F037
3943	Massello                                                    	145	F041
3944	Masserano                                                   	32	F042
3945	San Marco Evangelista                                       	104	F043
3946	Massignano                                                  	29	F044
3947	Massimeno                                                   	112	F045
3948	Massimino                                                   	37	F046
3949	Massino Visconti                                            	93	F047
3950	Massiola                                                    	43	F048
3951	Masullas                                                    	26	F050
3952	Matelica                                                    	24	F051
3953	Matera                                                      	14	F052
3954	Mathi                                                       	146	F053
3955	Matino                                                      	42	F054
3956	Matrice                                                     	37	F055
3957	Mattie                                                      	147	F058
3958	Mattinata                                                   	31	F059
3959	Mazara del Vallo                                            	12	F061
3960	Mazzano                                                     	107	F063
3961	Mazzano Romano                                              	58	F064
3962	Mazzarino                                                   	9	F065
3963	Mazzarr… Sant'Andrea                                        	46	F066
3964	MazzŠ                                                       	148	F067
3965	Mazzin                                                      	113	F068
3966	Mazzo di Valtellina                                         	40	F070
3967	Meana Sardo                                                 	47	F073
3968	Meana di Susa                                               	149	F074
3969	Meda                                                        	30	F078
3970	Mede                                                        	88	F080
3971	Medea                                                       	11	F081
3972	Medesano                                                    	20	F082
3973	Medicina                                                    	37	F083
3974	Mediglia                                                    	139	F084
3975	Medolago                                                    	250	F085
3976	Medole                                                      	34	F086
3977	Medolla                                                     	21	F087
3978	Meduna di Livenza                                           	41	F088
3979	Meduno                                                      	26	F089
3980	Megliadino San Fidenzio                                     	51	F091
3981	Megliadino San Vitale                                       	52	F092
3982	Meina                                                       	95	F093
3983	Mel                                                         	34	F094
3984	Melara                                                      	32	F095
3985	Melazzo                                                     	92	F096
3986	Meldola                                                     	19	F097
3987	Mele                                                        	33	F098
3988	Melegnano                                                   	140	F100
3989	Melendugno                                                  	43	F101
3990	Meleti                                                      	38	F102
3991	Melfi                                                       	48	F104
3992	Melicucc…                                                   	48	F105
3993	Melicucco                                                   	49	F106
3994	Melilli                                                     	12	F107
3995	Melissa                                                     	14	F108
3996	Melissano                                                   	44	F109
3997	Melito Irpino                                               	48	F110
3998	Melito di Napoli                                            	45	F111
3999	Melito di Porto Salvo                                       	50	F112
4000	Melizzano                                                   	39	F113
4001	Melle                                                       	122	F114
4002	Mello                                                       	41	F115
4003	Silea                                                       	81	F116
4004	Melpignano                                                  	45	F117
4005	Meltina                                                     	50	F118
4006	Melzo                                                       	142	F119
4007	Menaggio                                                    	145	F120
4008	Menarola                                                    	42	F121
4009	Menconico                                                   	89	F122
4010	Mendatica                                                   	34	F123
4011	Mendicino                                                   	79	F125
4012	Menfi                                                       	23	F126
4013	Mentana                                                     	59	F127
4014	Meolo                                                       	22	F130
4015	Merana                                                      	93	F131
4016	Merano                                                      	51	F132
4017	Merate                                                      	48	F133
4018	Mercallo                                                    	101	F134
4019	Mercatello sul Metauro                                      	25	F135
4020	Mercatino Conca                                             	26	F136
4021	Novafeltria                                                 	23	F137
4022	Mercato San Severino                                        	67	F138
4023	Mercato Saraceno                                            	20	F139
4024	Mercenasco                                                  	150	F140
4025	Mercogliano                                                 	49	F141
4026	Mereto di Tomba                                             	58	F144
4027	Mergo                                                       	24	F145
4028	Mergozzo                                                    	44	F146
4029	Mer�                                                        	47	F147
4030	Merlara                                                     	53	F148
4031	Merlino                                                     	39	F149
4032	Merone                                                      	147	F151
4033	Mesagne                                                     	10	F152
4034	Mese                                                        	43	F153
4035	Mesenzana                                                   	102	F154
4036	Mesero                                                      	144	F155
4037	Mesola                                                      	14	F156
4038	Mesoraca                                                    	15	F157
4039	Messina                                                     	48	F158
4040	Mestrino                                                    	54	F161
4041	Meta                                                        	46	F162
4042	Meugliano                                                   	151	F164
4043	Mezzago                                                     	31	F165
4044	Mezzana Mortigliengo                                        	33	F167
4045	Mezzana                                                     	114	F168
4046	Mezzana Bigli                                               	90	F170
4047	Mezzana Rabattone                                           	91	F171
4048	Mezzane di Sotto                                            	47	F172
4049	Mezzanego                                                   	34	F173
4050	Mezzani                                                     	21	F174
4051	Mezzanino                                                   	92	F175
4052	Mezzano                                                     	115	F176
4053	Mezzenile                                                   	152	F182
4054	Mezzocorona                                                 	116	F183
4055	Mezzojuso                                                   	47	F184
4056	Mezzoldo                                                    	134	F186
4057	Mezzolombardo                                               	117	F187
4058	Mezzomerico                                                 	97	F188
4059	Miagliano                                                   	34	F189
4060	Miane                                                       	42	F190
4061	Miasino                                                     	98	F191
4062	Miazzina                                                    	45	F192
4063	Micigliano                                                  	37	F193
4064	Miggiano                                                    	46	F194
4065	Miglianico                                                  	50	F196
4066	Miglierina                                                  	77	F200
4067	Miglionico                                                  	15	F201
4068	Mignanego                                                   	35	F202
4069	Mignano Monte Lungo                                         	51	F203
4070	Milano                                                      	146	F205
4071	Milazzo                                                     	49	F206
4072	Mileto                                                      	21	F207
4073	Milis                                                       	27	F208
4074	Militello in Val di Catania                                 	25	F209
4075	Militello Rosmarino                                         	50	F210
4076	Millesimo                                                   	38	F213
4077	Milo                                                        	26	F214
4078	Milzano                                                     	108	F216
4079	Mineo                                                       	27	F217
4080	Minerbe                                                     	48	F218
4081	Minerbio                                                    	38	F219
4082	Minervino Murge                                             	6	F220
4083	Minervino di Lecce                                          	47	F221
4084	Minori                                                      	68	F223
4085	Minturno                                                    	14	F224
4086	Minucciano                                                  	19	F225
4087	Mioglia                                                     	39	F226
4088	Mira                                                        	23	F229
4089	Mirabella Eclano                                            	50	F230
4090	Mirabella Imbaccari                                         	28	F231
4091	Mirabello Monferrato                                        	94	F232
4092	Mirabello Sannitico                                         	38	F233
4093	Mirabello                                                   	16	F235
4094	Miradolo Terme                                              	93	F238
4095	Miranda                                                     	27	F239
4096	Mirandola                                                   	22	F240
4097	Mirano                                                      	24	F241
4098	Mirto                                                       	51	F242
4099	Misano di Gera d'Adda                                       	135	F243
4100	Misano Adriatico                                            	5	F244
4101	Misilmeri                                                   	48	F246
4102	Misinto                                                     	32	F247
4103	Missaglia                                                   	49	F248
4104	Missanello                                                  	49	F249
4105	Misterbianco                                                	29	F250
4106	Mistretta                                                   	52	F251
4107	Moasca                                                      	63	F254
4108	Moconesi                                                    	36	F256
4109	Modena                                                      	23	F257
4110	Modica                                                      	6	F258
4111	Modigliana                                                  	22	F259
4112	Tavazzano con Villavesco                                    	56	F260
4113	Modolo                                                      	84	F261
4114	Modugno                                                     	27	F262
4115	Moena                                                       	118	F263
4116	Moggio                                                      	50	F265
4117	Moggio Udinese                                              	59	F266
4118	Moglia                                                      	35	F267
4119	Mogliano                                                    	25	F268
4120	Mogliano Veneto                                             	43	F269
4121	Mogorella                                                   	28	F270
4122	Ruinas                                                      	44	F271
4123	Mogoro                                                      	29	F272
4124	Moiano                                                      	40	F274
4125	Moimacco                                                    	60	F275
4126	Moio de' Calvi                                              	136	F276
4127	Moio Alcantara                                              	53	F277
4128	Moio della Civitella                                        	69	F278
4129	Moiola                                                      	123	F279
4130	Mola di Bari                                                	28	F280
4131	Molare                                                      	95	F281
4132	Molazzana                                                   	20	F283
4133	Molfetta                                                    	29	F284
4134	Molinara                                                    	41	F287
4135	Molinella                                                   	39	F288
4136	Molini di Triora                                            	35	F290
4137	Molino dei Torti                                            	96	F293
4138	Molise                                                      	39	F294
4139	Moliterno                                                   	50	F295
4140	Mollia                                                      	78	F297
4141	Porto Empedocle                                             	28	F299
4142	Molochio                                                    	51	F301
4143	Molteno                                                     	51	F304
4144	Moltrasio                                                   	152	F305
4145	Molvena                                                     	59	F306
4146	Molveno                                                     	120	F307
4147	Mombaldone                                                  	64	F308
4148	Mombarcaro                                                  	124	F309
4149	Mombaroccio                                                 	27	F310
4150	Mombaruzzo                                                  	65	F311
4151	Mombasiglio                                                 	125	F312
4152	Mombello Monferrato                                         	97	F313
4153	Mombello di Torino                                          	153	F315
4154	Mombercelli                                                 	66	F316
4155	Momo                                                        	100	F317
4156	Mompantero                                                  	154	F318
4157	Mompeo                                                      	38	F319
4158	Momperone                                                   	98	F320
4159	Monacilioni                                                 	40	F322
4160	Monale                                                      	67	F323
4161	Monasterace                                                 	52	F324
4162	Monastero Bormida                                           	68	F325
4163	Monastero di Vasco                                          	126	F326
4164	Monastero di Lanzo                                          	155	F327
4165	Monasterolo del Castello                                    	137	F328
4166	Monasterolo Casotto                                         	127	F329
4167	Monasterolo di Savigliano                                   	128	F330
4168	Monastier di Treviso                                        	44	F332
4169	Monastir                                                    	38	F333
4170	Moncalieri                                                  	156	F335
4171	Moncalvo                                                    	69	F336
4172	Moncestino                                                  	99	F337
4173	Monchiero                                                   	129	F338
4174	Monchio delle Corti                                         	22	F340
4175	Monclassico                                                 	121	F341
4176	Moncrivello                                                 	79	F342
4177	Moncucco Torinese                                           	70	F343
4178	Mondaino                                                    	6	F346
4179	Mondavio                                                    	28	F347
4180	Mondolfo                                                    	29	F348
4181	Mondov�                                                     	130	F351
4182	Mondragone                                                  	52	F352
4183	Moneglia                                                    	37	F354
4184	Monesiglio                                                  	131	F355
4185	Monfalcone                                                  	12	F356
4186	Serramazzoni                                                	42	F357
4187	Monforte d'Alba                                             	132	F358
4188	Monforte San Giorgio                                        	54	F359
4189	Monfumo                                                     	45	F360
4190	Mongardino                                                  	71	F361
4191	Monghidoro                                                  	40	F363
4192	Mongiana                                                    	22	F364
4193	Mongiardino Ligure                                          	100	F365
4194	Montjovet                                                   	43	F367
4195	Mongiuffi Melia                                             	55	F368
4196	Mongrando                                                   	35	F369
4197	Mongrassano                                                 	80	F370
4198	Monguelfo-Tesido                                            	52	F371
4199	Monguzzo                                                    	153	F372
4200	Moniga del Garda                                            	109	F373
4201	Monleale                                                    	101	F374
4202	Monno                                                       	110	F375
4203	Monopoli                                                    	30	F376
4204	Monreale                                                    	49	F377
4205	Monrupino                                                   	2	F378
4206	Monsampietro Morico                                         	12	F379
4207	Monsampolo del Tronto                                       	31	F380
4208	Monsano                                                     	25	F381
4209	Monselice                                                   	55	F382
4210	Monserrato                                                  	109	F383
4211	Monsummano Terme                                            	9	F384
4212	Mont…                                                       	133	F385
4213	Montabone                                                   	72	F386
4214	Montacuto                                                   	102	F387
4215	Montafia                                                    	73	F390
4216	Montagano                                                   	41	F391
4217	Montagna                                                    	53	F392
4218	Montagna in Valtellina                                      	44	F393
4219	Montagnana                                                  	56	F394
4220	Montagnareale                                               	56	F395
4221	Montagne                                                    	122	F396
4222	Montaguto                                                   	51	F397
4223	Montaione                                                   	27	F398
4224	Montalbano Jonico                                           	16	F399
4225	Montalbano Elicona                                          	57	F400
4226	Ostra                                                       	35	F401
4227	Montalcino                                                  	14	F402
4228	Montaldeo                                                   	103	F403
4229	Montaldo Bormida                                            	104	F404
4230	Montaldo di Mondov�                                         	134	F405
4231	Montalto Ligure                                             	36	F406
4232	Montaldo Torinese                                           	158	F407
4233	Montaldo Roero                                              	135	F408
4234	Montaldo Scarampi                                           	74	F409
4235	Montale                                                     	10	F410
4236	Montalenghe                                                 	159	F411
4237	Montallegro                                                 	24	F414
4238	Montalto delle Marche                                       	32	F415
4239	Montalto Uffugo                                             	81	F416
4240	Montalto Pavese                                             	94	F417
4241	Montalto di Castro                                          	35	F419
4242	Montalto Dora                                               	160	F420
4243	Montanaro                                                   	161	F422
4244	Montanaso Lombardo                                          	40	F423
4245	Montanera                                                   	136	F424
4246	Montano Antilia                                             	70	F426
4247	Montano Lucino                                              	154	F427
4248	Montappone                                                  	13	F428
4249	Montaquila                                                  	28	F429
4250	Montasola                                                   	39	F430
4251	Montauro                                                    	80	F432
4252	Montazzoli                                                  	51	F433
4253	Monte Cremasco                                              	58	F434
4254	Monte Argentario                                            	16	F437
4255	Montebello della Battaglia                                  	95	F440
4256	Montebello di Bertona                                       	23	F441
4257	Montebello Vicentino                                        	60	F442
4258	Montebelluna                                                	46	F443
4259	Montebruno                                                  	38	F445
4260	Montebuono                                                  	40	F446
4261	Montecalvo Irpino                                           	52	F448
4262	Montecalvo Versiggia                                        	96	F449
4263	Montecalvo in Foglia                                        	30	F450
4264	Montecarlo                                                  	21	F452
4265	Montecarotto                                                	26	F453
4266	Montecassiano                                               	26	F454
4267	Montecastello                                               	105	F455
4268	Monte Castello di Vibio                                     	29	F456
4269	Montecastrilli                                              	17	F457
4270	Montecatini Val di Cecina                                   	19	F458
4271	Monte Cavallo                                               	27	F460
4272	Montecchia di Crosara                                       	49	F461
4273	Montecchio                                                  	18	F462
4274	Montecchio Emilia                                           	27	F463
4275	Montecchio Maggiore                                         	61	F464
4276	Montecchio Precalcino                                       	62	F465
4277	Monte Cerignone                                             	31	F467
4278	Montechiaro d'Asti                                          	75	F468
4279	Montechiaro d'Acqui                                         	106	F469
4280	Montichiari                                                 	113	F471
4281	Montechiarugolo                                             	23	F473
4282	Monteciccardo                                               	32	F474
4283	Montecilfone                                                	42	F475
4284	Monte Colombo                                               	7	F476
4285	Monte Compatri                                              	60	F477
4286	Montecopiolo                                                	33	F478
4287	Montecorice                                                 	71	F479
4288	Montecorvino Pugliano                                       	72	F480
4289	Montecorvino Rovella                                        	73	F481
4290	Montecosaro                                                 	28	F482
4291	Montecrestese                                               	46	F483
4292	Montecreto                                                  	24	F484
4293	Monte di Malo                                               	63	F486
4294	Montedinove                                                 	34	F487
4295	Monte di Procida                                            	47	F488
4296	Montedoro                                                   	11	F489
4297	Montefalcione                                               	53	F491
4298	Montefalco                                                  	30	F492
4299	Montefalcone Appennino                                      	14	F493
4300	Montefalcone di Val Fortore                                 	42	F494
4301	Montefalcone nel Sannio                                     	43	F495
4302	Montefano                                                   	29	F496
4303	Montefelcino                                                	34	F497
4304	Monteferrante                                               	52	F498
4305	Montefiascone                                               	36	F499
4306	Montefino                                                   	27	F500
4307	Montefiore dell'Aso                                         	36	F501
4308	Montefiore Conca                                            	8	F502
4309	Montefiorino                                                	25	F503
4310	Monteflavio                                                 	61	F504
4311	Monteforte Irpino                                           	54	F506
4312	Monteforte Cilento                                          	74	F507
4313	Monteforte d'Alpone                                         	50	F508
4314	Montefortino                                                	15	F509
4315	Montefranco                                                 	19	F510
4316	Montefredane                                                	55	F511
4317	Montefusco                                                  	56	F512
4318	Montegabbione                                               	20	F513
4319	Montegalda                                                  	64	F514
4320	Montegaldella                                               	65	F515
4321	Montegallo                                                  	38	F516
4322	Monte Giberto                                               	16	F517
4323	Montegioco                                                  	107	F518
4324	Montegiordano                                               	82	F519
4325	Montegiorgio                                                	17	F520
4326	Montegranaro                                                	18	F522
4327	Montegridolfo                                               	9	F523
4328	Monte Grimano Terme                                         	35	F524
4329	Montegrino Valtravaglia                                     	103	F526
4330	Montegrosso d'Asti                                          	76	F527
4331	Montegrosso Pian Latte                                      	37	F528
4332	Montegrotto Terme                                           	57	F529
4333	Monteiasi                                                   	16	F531
4334	Monte Isola                                                 	111	F532
4335	Montelabbate                                                	36	F533
4336	Montelanico                                                 	62	F534
4337	Montelapiano                                                	53	F535
4338	Monteleone di Fermo                                         	19	F536
4339	Vibo Valentia                                               	47	F537
4340	Monteleone di Puglia                                        	32	F538
4341	Monteleone di Spoleto                                       	31	F540
4342	Monteleone Sabino                                           	41	F541
4343	Monteleone Rocca Doria                                      	40	F542
4344	Monteleone d'Orvieto                                        	21	F543
4345	Montelepre                                                  	50	F544
4346	Montelibretti                                               	63	F545
4347	Montella                                                    	57	F546
4348	Montello                                                    	139	F547
4349	Montelongo                                                  	44	F548
4350	Montelparo                                                  	20	F549
4351	Montelupo Albese                                            	137	F550
4352	Montelupo Fiorentino                                        	28	F551
4353	Montelupone                                                 	30	F552
4354	Montemaggiore Belsito                                       	51	F553
4355	Montemaggiore al Metauro                                    	37	F555
4356	Montemagno                                                  	77	F556
4357	Sant'Arcangelo Trimonte                                     	78	F557
4358	Montemale di Cuneo                                          	138	F558
4359	Montemarano                                                 	58	F559
4360	Montemarciano                                               	27	F560
4361	Monte Marenzo                                               	52	F561
4362	Montemarzino                                                	108	F562
4363	Montemesola                                                 	17	F563
4364	Montemezzo                                                  	155	F564
4365	Montemignaio                                                	23	F565
4366	Montemiletto                                                	59	F566
4367	Pollenza                                                    	41	F567
4368	Montemilone                                                 	51	F568
4369	Montemitro                                                  	45	F569
4370	Montemonaco                                                 	44	F570
4371	Montemurlo                                                  	3	F572
4372	Montemurro                                                  	52	F573
4373	Montenars                                                   	61	F574
4374	Montenero di Bisaccia                                       	46	F576
4375	Montenerodomo                                               	54	F578
4376	Montenero Sabino                                            	42	F579
4377	Montenero Val Cocchiara                                     	29	F580
4378	Ostra Vetere                                                	36	F581
4379	Monteodorisio                                               	55	F582
4380	Roseto degli Abruzzi                                        	37	F585
4381	Montepaone                                                  	81	F586
4382	Monteparano                                                 	18	F587
4383	Monte Porzio                                                	38	F589
4384	Monte Porzio Catone                                         	64	F590
4385	Monteprandone                                               	45	F591
4386	Montepulciano                                               	15	F592
4387	Monterchi                                                   	24	F594
4388	Montereale                                                  	56	F595
4389	Montereale Valcellina                                       	27	F596
4390	Monterenzio                                                 	41	F597
4391	Monteriggioni                                               	16	F598
4392	Monte Rinaldo                                               	21	F599
4393	Monte Roberto                                               	29	F600
4394	Monteroduni                                                 	30	F601
4395	Monte Romano                                                	37	F603
4396	Monteroni di Lecce                                          	48	F604
4397	Monteroni d'Arbia                                           	17	F605
4398	Monterosi                                                   	38	F606
4399	Monterosso Calabro                                          	23	F607
4400	Monterosso Grana                                            	139	F608
4401	Monterosso al Mare                                          	19	F609
4402	Monterosso Almo                                             	7	F610
4403	Monterotondo                                                	65	F611
4404	Monterotondo Marittimo                                      	27	F612
4405	Monterubbiano                                               	22	F614
4406	Monte San Biagio                                            	15	F616
4407	Monte San Giacomo                                           	75	F618
4408	Monte San Giovanni in Sabina                                	43	F619
4409	Monte San Giovanni Campano                                  	44	F620
4410	Monte San Giusto                                            	31	F621
4411	Monte San Martino                                           	32	F622
4412	Montesano Salentino                                         	49	F623
4413	Montesano sulla Marcellana                                  	76	F625
4414	Monte San Pietrangeli                                       	23	F626
4415	Monte San Pietro                                            	42	F627
4416	Monte San Savino                                            	25	F628
4417	Monte Santa Maria Tiberina                                  	32	F629
4418	Monte Sant'Angelo                                           	33	F631
4419	Potenza Picena                                              	43	F632
4420	Monte San Vito                                              	30	F634
4421	Montesarchio                                                	43	F636
4422	Montescaglioso                                              	17	F637
4423	Montescano                                                  	97	F638
4424	Montescheno                                                 	47	F639
4425	Montescudaio                                                	20	F640
4426	Montescudo                                                  	10	F641
4427	Montese                                                     	26	F642
4428	Montesegale                                                 	98	F644
4429	Montesilvano                                                	24	F646
4430	Montespertoli                                               	30	F648
4431	Monteu da Po                                                	162	F651
4432	Monte Urano                                                 	24	F653
4433	Monteu Roero                                                	140	F654
4434	Montevago                                                   	25	F655
4435	Montevarchi                                                 	26	F656
4436	Montevecchia                                                	53	F657
4437	Monteverde                                                  	60	F660
4438	Monteverdi Marittimo                                        	21	F661
4439	Monteviale                                                  	66	F662
4440	Monte Vidon Combatte                                        	25	F664
4441	Monte Vidon Corrado                                         	26	F665
4442	Montezemolo                                                 	141	F666
4443	Monti                                                       	16	F667
4444	Montiano                                                    	28	F668
4445	Monticello d'Alba                                           	142	F669
4446	Monticelli Pavese                                           	99	F670
4447	Monticelli d'Ongina                                         	27	F671
4448	Monticelli Brusati                                          	112	F672
4449	Monticello Brianza                                          	54	F674
4450	Monticello Conte Otto                                       	67	F675
4451	Monticiano                                                  	18	F676
4452	Montieri                                                    	17	F677
4453	Montignoso                                                  	11	F679
4454	Montirone                                                   	114	F680
4455	Montodine                                                   	59	F681
4456	Montoggio                                                   	39	F682
4457	Montone                                                     	33	F685
4458	Montopoli in Val d'Arno                                     	22	F686
4459	Montopoli di Sabina                                         	44	F687
4460	Montorfano                                                  	157	F688
4461	Montorio nei Frentani                                       	47	F689
4462	Montorio al Vomano                                          	28	F690
4463	Montorio Romano                                             	66	F692
4464	Montorso Vicentino                                          	68	F696
4465	Montottone                                                  	27	F697
4466	Montresta                                                   	85	F698
4467	Mont— Beccaria                                              	100	F701
4468	Monvalle                                                    	104	F703
4469	Monza                                                       	33	F704
4470	Monzambano                                                  	36	F705
4471	Monzuno                                                     	44	F706
4472	Morano sul Po                                               	109	F707
4473	Morano Calabro                                              	83	F708
4474	Moransengo                                                  	79	F709
4475	Moraro                                                      	13	F710
4476	Morazzone                                                   	105	F711
4477	Morbegno                                                    	45	F712
4478	Morbello                                                    	110	F713
4479	Morciano di Romagna                                         	11	F715
4480	Morciano di Leuca                                           	50	F716
4481	Morcone                                                     	44	F717
4482	Mordano                                                     	45	F718
4483	Morengo                                                     	140	F720
4484	Mores                                                       	42	F721
4485	Moresco                                                     	28	F722
4486	Moretta                                                     	143	F723
4487	Morfasso                                                    	28	F724
4488	Morgano                                                     	47	F725
4489	Morgex                                                      	44	F726
4490	Morgongiori                                                 	30	F727
4491	Mori                                                        	123	F728
4492	Moriago della Battaglia                                     	48	F729
4493	Moricone                                                    	67	F730
4494	Morigerati                                                  	77	F731
4495	Morino                                                      	57	F732
4496	Moriondo Torinese                                           	163	F733
4497	Morlupo                                                     	68	F734
4498	Mormanno                                                    	84	F735
4499	Mornago                                                     	106	F736
4500	Mornese                                                     	111	F737
4501	Mornico al Serio                                            	141	F738
4502	Mornico Losana                                              	101	F739
4503	Morolo                                                      	45	F740
4504	Morozzo                                                     	144	F743
4505	Morra De Sanctis                                            	63	F744
4506	Morro d'Alba                                                	31	F745
4507	Morro Reatino                                               	45	F746
4508	Morro d'Oro                                                 	29	F747
4509	Morrone del Sannio                                          	48	F748
4510	Morrovalle                                                  	33	F749
4511	Morsano al Tagliamento                                      	28	F750
4512	Morsasco                                                    	112	F751
4513	Mortara                                                     	102	F754
4514	Mortegliano                                                 	62	F756
4515	Morterone                                                   	55	F758
4516	Moruzzo                                                     	63	F760
4517	Moscazzano                                                  	60	F761
4518	Moschiano                                                   	64	F762
4519	Mosciano Sant'Angelo                                        	30	F764
4520	Moscufo                                                     	25	F765
4521	Moso in Passiria                                            	54	F766
4522	Mossa                                                       	14	F767
4523	Mossano                                                     	69	F768
4524	Motta di Livenza                                            	49	F770
4525	Motta Baluffi                                               	61	F771
4526	Motta Camastra                                              	58	F772
4527	Motta d'Affermo                                             	59	F773
4528	Motta de' Conti                                             	82	F774
4529	Mottafollone                                                	85	F775
4530	Mottalciata                                                 	37	F776
4531	Motta Montecorvino                                          	34	F777
4532	Motta San Giovanni                                          	54	F779
4533	Motta Santa Lucia                                           	83	F780
4534	Motta Sant'Anastasia                                        	30	F781
4535	Motta Visconti                                              	151	F783
4536	Mottola                                                     	19	F784
4537	Mozzagrogna                                                 	56	F785
4538	Mozzanica                                                   	142	F786
4539	Mozzate                                                     	159	F788
4540	Mozzecane                                                   	51	F789
4541	Mozzo                                                       	143	F791
4542	Muccia                                                      	34	F793
4543	Muggia                                                      	3	F795
4544	Muggi•                                                      	34	F797
4545	Mugnano del Cardinale                                       	65	F798
4546	Mugnano di Napoli                                           	48	F799
4547	Mulazzano                                                   	41	F801
4548	Mulazzo                                                     	12	F802
4549	Villa Poma                                                  	67	F804
4550	Mura                                                        	115	F806
4551	Muravera                                                    	39	F808
4552	Murazzano                                                   	145	F809
4553	Salcedo                                                     	90	F810
4554	Murello                                                     	146	F811
4555	Murialdo                                                    	40	F813
4556	Murisengo                                                   	113	F814
4557	Murlo                                                       	19	F815
4558	Muro Leccese                                                	51	F816
4559	Muro Lucano                                                 	53	F817
4560	Muros                                                       	43	F818
4561	Muscoline                                                   	116	F820
4562	Musei                                                       	11	F822
4563	Musile di Piave                                             	25	F826
4564	Musso                                                       	160	F828
4565	Mussolente                                                  	70	F829
4566	Mussomeli                                                   	12	F830
4567	Pineto                                                      	35	F831
4568	Muzzana del Turgnano                                        	64	F832
4569	Muzzano                                                     	38	F833
4570	Nago-Torbole                                                	124	F835
4571	Nalles                                                      	55	F836
4572	Nanno                                                       	125	F837
4573	Nanto                                                       	71	F838
4574	Napoli                                                      	49	F839
4575	Narbolia                                                    	31	F840
4576	Narcao                                                      	12	F841
4577	Nard•                                                       	52	F842
4578	Nardodipace                                                 	24	F843
4579	Narni                                                       	22	F844
4580	Naro                                                        	26	F845
4581	Narzole                                                     	147	F846
4582	Nasino                                                      	41	F847
4583	Naso                                                        	60	F848
4584	Naturno                                                     	56	F849
4585	Nave                                                        	117	F851
4586	Navelli                                                     	58	F852
4587	Nave San Rocco                                              	126	F853
4588	Naz-Sciaves                                                 	57	F856
4589	Nazzano                                                     	69	F857
4590	Ne                                                          	40	F858
4591	Nebbiuno                                                    	103	F859
4592	Negrar                                                      	52	F861
4593	Neirone                                                     	41	F862
4594	Neive                                                       	148	F863
4595	Nembro                                                      	144	F864
4596	Nemi                                                        	70	F865
4597	Nemoli                                                      	54	F866
4598	Neoneli                                                     	32	F867
4599	Nepi                                                        	39	F868
4600	Nereto                                                      	31	F870
4601	Nerola                                                      	71	F871
4602	Nervesa della Battaglia                                     	50	F872
4603	Nerviano                                                    	154	F874
4604	Nespolo                                                     	46	F876
4605	Nesso                                                       	161	F877
4606	Netro                                                       	39	F878
4607	Nettuno                                                     	72	F880
4608	Neviano                                                     	53	F881
4609	Neviano degli Arduini                                       	24	F882
4610	Neviglie                                                    	149	F883
4611	Niardo                                                      	118	F884
4612	Nibbiano                                                    	29	F885
4613	Nibbiola                                                    	104	F886
4614	Nibionno                                                    	56	F887
4615	Nichelino                                                   	164	F889
4616	Nicolosi                                                    	31	F890
4617	Nicorvo                                                     	103	F891
4618	Nicosia                                                     	12	F892
4619	Nicotera                                                    	25	F893
4620	Niella Belbo                                                	150	F894
4621	Niella Tanaro                                               	151	F895
4622	Nimis                                                       	65	F898
4623	Niscemi                                                     	13	F899
4624	Nissoria                                                    	13	F900
4625	Nizza di Sicilia                                            	61	F901
4626	Nizza Monferrato                                            	80	F902
4627	Noale                                                       	26	F904
4628	Noasca                                                      	165	F906
4629	Nocara                                                      	86	F907
4630	Nocciano                                                    	26	F908
4631	Nocera Terinese                                             	87	F910
4632	Nocera Umbra                                                	34	F911
4633	Nocera Inferiore                                            	78	F912
4634	Nocera Superiore                                            	79	F913
4635	Noceto                                                      	25	F914
4636	Noci                                                        	31	F915
4637	Nociglia                                                    	54	F916
4638	Noepoli                                                     	55	F917
4639	Nogara                                                      	53	F918
4640	Nogaredo                                                    	127	F920
4641	Nogarole Rocca                                              	54	F921
4642	Nogarole Vicentino                                          	72	F922
4643	Noicattaro                                                  	32	F923
4644	Nola                                                        	50	F924
4645	Nole                                                        	166	F925
4646	Noli                                                        	42	F926
4647	Nomaglio                                                    	167	F927
4648	Nomi                                                        	128	F929
4649	Nonantola                                                   	27	F930
4650	None                                                        	168	F931
4651	Nonio                                                       	48	F932
4652	Noragugume                                                  	50	F933
4653	Norbello                                                    	33	F934
4654	Norcia                                                      	35	F935
4655	Norma                                                       	16	F937
4656	Nosate                                                      	155	F939
4657	Ponte Nossa                                                 	168	F941
4658	Notaresco                                                   	32	F942
4659	Noto                                                        	13	F943
4660	Nova Milanese                                               	35	F944
4661	Novaledo                                                    	129	F947
4662	Novalesa                                                    	169	F948
4663	Nova Levante                                                	58	F949
4664	Nova Ponente                                                	59	F950
4665	Novara di Sicilia                                           	62	F951
4666	Novara                                                      	106	F952
4667	Novate Milanese                                             	157	F955
4668	Novate Mezzola                                              	46	F956
4669	Nove                                                        	73	F957
4670	Novedrate                                                   	163	F958
4671	Novellara                                                   	28	F960
4672	Novello                                                     	152	F961
4673	Noventa Padovana                                            	58	F962
4674	Noventa di Piave                                            	27	F963
4675	Noventa Vicentina                                           	74	F964
4676	Novi Ligure                                                 	114	F965
4677	Novi di Modena                                              	28	F966
4678	Novi Velia                                                  	80	F967
4679	Noviglio                                                    	158	F968
4680	Novoli                                                      	55	F970
4681	Nucetto                                                     	153	F972
4682	Nughedu Santa Vittoria                                      	34	F974
4683	Nughedu San Nicol•                                          	44	F975
4684	Nule                                                        	45	F976
4685	Nulvi                                                       	46	F977
4686	Numana                                                      	32	F978
4687	Nuoro                                                       	51	F979
4688	Nurachi                                                     	35	F980
4689	Nuragus                                                     	115	F981
4690	Nurallao                                                    	116	F982
4691	Nuraminis                                                   	42	F983
4692	Nureci                                                      	36	F985
4693	Nurri                                                       	117	F986
4694	Nus                                                         	45	F987
4695	Nusco                                                       	66	F988
4696	Nuvolento                                                   	119	F989
4697	Nuvolera                                                    	120	F990
4698	Nuxis                                                       	13	F991
4699	Occhieppo Inferiore                                         	40	F992
4700	Occhieppo Superiore                                         	41	F993
4701	Occhiobello                                                 	33	F994
4702	Occimiano                                                   	115	F995
4703	Ocre                                                        	59	F996
4704	Odalengo Grande                                             	116	F997
4705	Odalengo Piccolo                                            	117	F998
4706	Oderzo                                                      	51	F999
4707	Odolo                                                       	121	G001
4708	Ofena                                                       	60	G002
4709	Offagna                                                     	33	G003
4710	Offanengo                                                   	62	G004
4711	Offida                                                      	54	G005
4712	Offlaga                                                     	122	G006
4713	Oggebbio                                                    	49	G007
4714	Oggiona con Santo Stefano                                   	107	G008
4715	Oggiono                                                     	57	G009
4716	Oglianico                                                   	170	G010
4717	Ogliastro Cilento                                           	81	G011
4718	Oyace                                                       	47	G012
4719	Olbia                                                       	17	G015
4720	Olcenengo                                                   	88	G016
4721	Oldenico                                                    	89	G018
4722	Oleggio                                                     	108	G019
4723	Oleggio Castello                                            	109	G020
4724	Olevano di Lomellina                                        	104	G021
4725	Olevano Romano                                              	73	G022
4726	Olevano sul Tusciano                                        	82	G023
4727	Olgiate Comasco                                             	165	G025
4728	Olgiate Molgora                                             	58	G026
4729	Olgiate Olona                                               	108	G028
4730	Olginate                                                    	59	G030
4731	Oliena                                                      	55	G031
4732	Oliva Gessi                                                 	105	G032
4733	Olivadi                                                     	88	G034
4734	Oliveri                                                     	63	G036
4735	Oliveto Lucano                                              	19	G037
4736	Oliveto Citra                                               	83	G039
4737	Oliveto Lario                                               	60	G040
4738	Olivetta San Michele                                        	38	G041
4739	Olivola                                                     	118	G042
4740	Ollastra                                                    	37	G043
4741	Ollolai                                                     	56	G044
4742	Ollomont                                                    	46	G045
4743	Olmedo                                                      	48	G046
4744	Olmeneta                                                    	63	G047
4745	Olmo Gentile                                                	81	G048
4746	Olmo al Brembo                                              	145	G049
4747	Oltre il Colle                                              	146	G050
4748	Oltressenda Alta                                            	147	G054
4749	Oltrona di San Mamette                                      	169	G056
4750	Olzai                                                       	57	G058
4751	Ome                                                         	123	G061
4752	Omegna                                                      	50	G062
4753	Omignano                                                    	84	G063
4754	Onan�                                                       	58	G064
4755	Onano                                                       	40	G065
4756	Oncino                                                      	154	G066
4757	Oneta                                                       	148	G068
4758	Onifai                                                      	59	G070
4759	Oniferi                                                     	60	G071
4760	Ono San Pietro                                              	124	G074
4761	Onore                                                       	149	G075
4762	Onzo                                                        	43	G076
4763	Opera                                                       	159	G078
4764	Opi                                                         	61	G079
4765	Oppeano                                                     	55	G080
4766	Oppido Lucano                                               	56	G081
4767	Oppido Mamertina                                            	55	G082
4768	Ora                                                         	60	G083
4769	Orani                                                       	61	G084
4770	Oratino                                                     	49	G086
4771	Orbassano                                                   	171	G087
4772	Orbetello                                                   	18	G088
4773	Orciano di Pesaro                                           	40	G089
4774	Orciano Pisano                                              	23	G090
4775	Orero                                                       	42	G093
4776	Orgiano                                                     	75	G095
4777	Pieve Fissiraga                                             	45	G096
4778	Orgosolo                                                    	62	G097
4779	Oria                                                        	11	G098
4780	Oricola                                                     	62	G102
4781	Origgio                                                     	109	G103
4782	Orino                                                       	110	G105
4783	Orio Litta                                                  	42	G107
4784	Orio al Serio                                               	150	G108
4785	Orio Canavese                                               	172	G109
4786	Oriolo                                                      	87	G110
4787	Oriolo Romano                                               	41	G111
4788	Oristano                                                    	38	G113
4789	Ormea                                                       	155	G114
4790	Ormelle                                                     	52	G115
4791	Ornago                                                      	36	G116
4792	Ornavasso                                                   	51	G117
4793	Ornica                                                      	151	G118
4794	Orosei                                                      	63	G119
4795	Orotelli                                                    	64	G120
4796	Orria                                                       	85	G121
4797	Orroli                                                      	118	G122
4798	Orsago                                                      	53	G123
4799	Orsara Bormida                                              	119	G124
4800	Orsara di Puglia                                            	35	G125
4801	Orsenigo                                                    	170	G126
4802	Orsogna                                                     	57	G128
4803	Orsomarso                                                   	88	G129
4804	Orta di Atella                                              	53	G130
4805	Orta Nova                                                   	36	G131
4806	Ortacesus                                                   	44	G133
4807	Orta San Giulio                                             	112	G134
4808	Orte                                                        	42	G135
4809	Ortelle                                                     	56	G136
4810	Ortezzano                                                   	29	G137
4811	Ortignano Raggiolo                                          	27	G139
4812	Ortisei                                                     	61	G140
4813	Ortona                                                      	58	G141
4814	Ortona dei Marsi                                            	63	G142
4815	Ortonovo                                                    	20	G143
4816	Ortovero                                                    	45	G144
4817	Ortucchio                                                   	64	G145
4818	Ortueri                                                     	66	G146
4819	Orune                                                       	67	G147
4820	Orvieto                                                     	23	G148
4821	Orzinuovi                                                   	125	G149
4822	Orzivecchi                                                  	126	G150
4823	Osasco                                                      	173	G151
4824	Osasio                                                      	174	G152
4825	Oschiri                                                     	18	G153
4826	Osidda                                                      	68	G154
4827	Osiglia                                                     	46	G155
4828	Osilo                                                       	50	G156
4829	Osimo                                                       	34	G157
4830	Osini                                                       	13	G158
4831	Osio Sopra                                                  	152	G159
4832	Osio Sotto                                                  	153	G160
4833	Osnago                                                      	61	G161
4834	Osoppo                                                      	66	G163
4835	Ospedaletti                                                 	39	G164
4836	Ospedaletto d'Alpinolo                                      	67	G165
4837	Ospedaletto Lodigiano                                       	43	G166
4838	Ospedaletto Euganeo                                         	59	G167
4839	Ospedaletto                                                 	130	G168
4840	Ospitale di Cadore                                          	35	G169
4841	Ospitaletto                                                 	127	G170
4842	Ossago Lodigiano                                            	44	G171
4843	Ossana                                                      	131	G173
4844	Ossi                                                        	51	G178
4845	Ossimo                                                      	128	G179
4846	Ossona                                                      	164	G181
4847	Ostana                                                      	156	G183
4848	Ostellato                                                   	17	G184
4849	Ostiano                                                     	64	G185
4850	Ostiglia                                                    	38	G186
4851	Ostuni                                                      	12	G187
4852	Otranto                                                     	57	G188
4853	Otricoli                                                    	24	G189
4854	Ottaviano                                                   	51	G190
4855	Ottana                                                      	70	G191
4856	Ottati                                                      	86	G192
4857	Ottiglio                                                    	120	G193
4858	Ottobiano                                                   	106	G194
4859	Ottone                                                      	30	G195
4860	Oulx                                                        	175	G196
4861	Ovada                                                       	121	G197
4862	Ovaro                                                       	67	G198
4863	Oviglio                                                     	122	G199
4864	Ovindoli                                                    	65	G200
4865	Ovodda                                                      	71	G201
4866	Ozegna                                                      	176	G202
4867	Ozieri                                                      	52	G203
4868	Ozzano Monferrato                                           	123	G204
4869	Ozzano dell'Emilia                                          	46	G205
4870	Ozzero                                                      	165	G206
4871	Pabillonis                                                  	11	G207
4872	Paceco                                                      	13	G208
4873	Pace del Mela                                               	64	G209
4874	Pacentro                                                    	66	G210
4875	Pachino                                                     	14	G211
4876	Paciano                                                     	36	G212
4877	Padenghe sul Garda                                          	129	G213
4878	Padergnone                                                  	132	G214
4879	Paderna                                                     	124	G215
4880	Paderno Franciacorta                                        	130	G217
4881	Paderno d'Adda                                              	62	G218
4882	Paderno Dugnano                                             	166	G220
4883	Paderno del Grappa                                          	54	G221
4884	Paderno Ponchielli                                          	65	G222
4885	Robbiate                                                    	71	G223
4886	Padova                                                      	60	G224
4887	Padria                                                      	53	G225
4888	Padula                                                      	87	G226
4889	Paduli                                                      	45	G227
4890	Paesana                                                     	157	G228
4891	Paese                                                       	55	G229
4892	Pagani                                                      	88	G230
4893	Paganico Sabino                                             	48	G232
4894	Pagazzano                                                   	154	G233
4895	Pagliara                                                    	65	G234
4896	Paglieta                                                    	59	G237
4897	Pagnacco                                                    	68	G238
4898	Pagno                                                       	158	G240
4899	Pagnona                                                     	63	G241
4900	Pago del Vallo di Lauro                                     	68	G242
4901	Pago Veiano                                                 	46	G243
4902	Paisco Loveno                                               	131	G247
4903	Paitone                                                     	132	G248
4904	Paladina                                                    	155	G249
4905	Palagano                                                    	29	G250
4906	Palagianello                                                	20	G251
4907	Palagiano                                                   	21	G252
4908	Palagonia                                                   	32	G253
4909	Palaia                                                      	24	G254
4910	Palanzano                                                   	26	G255
4911	Palata                                                      	50	G257
4912	Palau                                                       	20	G258
4913	Palazzago                                                   	156	G259
4914	Palazzo Pignano                                             	66	G260
4915	Palazzo San Gervasio                                        	57	G261
4916	Palazzo Canavese                                            	177	G262
4917	Palazzo Adriano                                             	52	G263
4918	Palazzolo sull'Oglio                                        	133	G264
4919	Palazzolo Vercellese                                        	90	G266
4920	Palazzolo Acreide                                           	15	G267
4921	Palazzolo dello Stella                                      	69	G268
4922	Palazzuolo sul Senio                                        	31	G270
4923	Palena                                                      	60	G271
4924	Palermiti                                                   	89	G272
4925	Palermo                                                     	53	G273
4926	Palestrina                                                  	74	G274
4927	Palestro                                                    	107	G275
4928	Paliano                                                     	46	G276
4929	Palizzi                                                     	56	G277
4930	Pallagorio                                                  	16	G278
4931	Pallanzeno                                                  	52	G280
4932	Pallare                                                     	47	G281
4933	Palma di Montechiaro                                        	27	G282
4934	Palma Campania                                              	52	G283
4935	Palmanova                                                   	70	G284
4936	Palmariggi                                                  	58	G285
4937	Palmas Arborea                                              	39	G286
4938	San Giovanni Suergiu                                        	17	G287
4939	Palmi                                                       	57	G288
4940	Palmiano                                                    	56	G289
4941	Palmoli                                                     	61	G290
4942	Palo del Colle                                              	33	G291
4943	Palomonte                                                   	89	G292
4944	Palombara Sabina                                            	75	G293
4945	Palombaro                                                   	62	G294
4946	Palosco                                                     	157	G295
4947	Pal— del Fersina                                            	133	G296
4948	Pal—                                                        	56	G297
4949	Paludi                                                      	89	G298
4950	Plaus                                                       	64	G299
4951	Paluzza                                                     	71	G300
4952	Pamparato                                                   	159	G302
4953	Pancalieri                                                  	178	G303
4954	Pancarana                                                   	108	G304
4955	Panchi…                                                     	134	G305
4956	Pandino                                                     	67	G306
4957	Panettieri                                                  	90	G307
4958	Panicale                                                    	37	G308
4959	Villaricca                                                  	87	G309
4960	Pannarano                                                   	47	G311
4961	Panni                                                       	37	G312
4962	Pantelleria                                                 	14	G315
4963	Pantigliate                                                 	167	G316
4964	Paola                                                       	91	G317
4965	Paolisi                                                     	48	G318
4966	Valderice                                                   	22	G319
4967	Papasidero                                                  	92	G320
4968	Papozze                                                     	34	G323
4969	Parabiago                                                   	168	G324
4970	Parabita                                                    	59	G325
4971	Paratico                                                    	134	G327
4972	Parcines                                                    	62	G328
4973	Parella                                                     	179	G330
4974	Parenti                                                     	93	G331
4975	Parete                                                      	54	G333
4976	Pareto                                                      	125	G334
4977	Parghelia                                                   	26	G335
4978	Parlasco                                                    	64	G336
4979	Parma                                                       	27	G337
4980	Parodi Ligure                                               	126	G338
4981	Paroldo                                                     	160	G339
4982	Parolise                                                    	69	G340
4983	Parona                                                      	109	G342
4984	Parrano                                                     	25	G344
4985	Parre                                                       	158	G346
4986	Partanna                                                    	15	G347
4987	Partinico                                                   	54	G348
4988	Paruzzaro                                                   	114	G349
4989	Parzanica                                                   	159	G350
4990	Pasian di Prato                                             	72	G352
4991	Pasiano di Pordenone                                        	29	G353
4992	Paspardo                                                    	135	G354
4993	Passerano Marmorito                                         	82	G358
4994	Passignano sul Trasimeno                                    	38	G359
4995	Passirano                                                   	136	G361
4996	Pastena                                                     	47	G362
4997	Pastorano                                                   	55	G364
4998	Pastrengo                                                   	57	G365
4999	Pasturana                                                   	127	G367
5000	Pasturo                                                     	65	G368
5001	Paternopoli                                                 	70	G370
5002	Patern•                                                     	33	G371
5003	Paterno Calabro                                             	94	G372
5004	Patrica                                                     	48	G374
5005	Pattada                                                     	55	G376
5006	Patti                                                       	66	G377
5007	Pat—                                                        	60	G378
5008	Pau                                                         	40	G379
5009	Paularo                                                     	73	G381
5010	Pauli Arbarei                                               	12	G382
5011	San Nicol• Gerrei                                           	58	G383
5012	Paulilatino                                                 	41	G384
5013	Paullo                                                      	169	G385
5014	Paupisi                                                     	49	G386
5015	Pavarolo                                                    	180	G387
5016	Pavia                                                       	110	G388
5017	Pavia di Udine                                              	74	G389
5018	Pavone del Mella                                            	137	G391
5019	Pavone Canavese                                             	181	G392
5020	Pavullo nel Frignano                                        	30	G393
5021	Pazzano                                                     	58	G394
5022	Peccioli                                                    	25	G395
5023	Pecco                                                       	182	G396
5024	Pecetto di Valenza                                          	128	G397
5025	Pecetto Torinese                                            	183	G398
5026	Pecorara                                                    	31	G399
5027	Pedace                                                      	95	G400
5028	Pedara                                                      	34	G402
5029	Pedaso                                                      	30	G403
5030	Pedavena                                                    	36	G404
5031	Pedemonte                                                   	76	G406
5032	San Paolo                                                   	138	G407
5033	Pederobba                                                   	56	G408
5034	Pedesina                                                    	47	G410
5035	Pedivigliano                                                	96	G411
5036	Pedrengo                                                    	160	G412
5037	Peglio                                                      	178	G415
5038	Peglio                                                      	41	G416
5039	Pegognaga                                                   	39	G417
5040	Peia                                                        	161	G418
5041	Peio                                                        	136	G419
5042	Pelago                                                      	32	G420
5043	Pella                                                       	115	G421
5044	Pellegrino Parmense                                         	28	G424
5045	Pellezzano                                                  	90	G426
5046	Pellio Intelvi                                              	179	G427
5047	Pellizzano                                                  	137	G428
5048	Pelugo                                                      	138	G429
5049	Penango                                                     	83	G430
5050	Poggiridenti                                                	51	G431
5051	Penna in Teverina                                           	26	G432
5052	Pennabilli                                                  	24	G433
5053	Pennadomo                                                   	63	G434
5054	Pennapiedimonte                                             	64	G435
5055	Penna San Giovanni                                          	35	G436
5056	Penna Sant'Andrea                                           	33	G437
5057	Penne                                                       	27	G438
5058	Pentone                                                     	92	G439
5059	Perano                                                      	65	G441
5060	Perarolo di Cadore                                          	37	G442
5061	Perca                                                       	63	G443
5062	Percile                                                     	76	G444
5063	Perdasdefogu                                                	14	G445
5064	Perdaxius                                                   	14	G446
5065	Perdifumo                                                   	91	G447
5066	Perego                                                      	66	G448
5067	Pereto                                                      	67	G449
5068	Perfugas                                                    	56	G450
5069	Pergine Valdarno                                            	28	G451
5070	Pergine Valsugana                                           	139	G452
5071	Pergola                                                     	43	G453
5072	Perinaldo                                                   	40	G454
5073	Perito                                                      	92	G455
5074	Perledo                                                     	67	G456
5075	Perletto                                                    	161	G457
5076	Perlo                                                       	162	G458
5077	Perloz                                                      	48	G459
5078	Pernumia                                                    	61	G461
5079	Perosa Canavese                                             	185	G462
5080	Perosa Argentina                                            	184	G463
5081	Perrero                                                     	186	G465
5082	San Giovanni in Persiceto                                   	53	G467
5083	Persico Dosimo                                              	68	G469
5084	Pertengo                                                    	91	G471
5085	Pertica Alta                                                	139	G474
5086	Pertica Bassa                                               	140	G475
5087	Pertosa                                                     	93	G476
5088	Pertusio                                                    	187	G477
5089	Perugia                                                     	39	G478
5090	Pesaro                                                      	44	G479
5091	Pescaglia                                                   	22	G480
5092	Pescantina                                                  	58	G481
5093	Pescara                                                     	28	G482
5094	Pescarolo ed Uniti                                          	69	G483
5095	Pescasseroli                                                	68	G484
5096	Pescate                                                     	68	G485
5097	Pesche                                                      	31	G486
5098	Peschici                                                    	38	G487
5099	Peschiera Borromeo                                          	171	G488
5100	Peschiera del Garda                                         	59	G489
5101	Pescia                                                      	12	G491
5102	Pescina                                                     	69	G492
5103	Pescocostanzo                                               	70	G493
5104	Pesco Sannita                                               	50	G494
5105	Pescolanciano                                               	32	G495
5106	Pescopagano                                                 	58	G496
5107	Pescopennataro                                              	33	G497
5108	Pescorocchiano                                              	49	G498
5109	Pescosansonesco                                             	29	G499
5110	Pescosolido                                                 	49	G500
5111	Pessano con Bornago                                         	172	G502
5112	Pessina Cremonese                                           	70	G504
5113	Pessinetto                                                  	188	G505
5114	Petacciato                                                  	51	G506
5115	Turania                                                     	71	G507
5116	Petilia Policastro                                          	17	G508
5117	Petina                                                      	94	G509
5118	Petralia Soprana                                            	55	G510
5119	Petralia Sottana                                            	56	G511
5120	Petrella Tifernina                                          	52	G512
5121	Petrella Salto                                              	50	G513
5122	Petriano                                                    	45	G514
5123	Petriolo                                                    	36	G515
5124	Petritoli                                                   	31	G516
5125	Petrizzi                                                    	94	G517
5126	Petron…                                                     	95	G518
5127	Petruro Irpino                                              	71	G519
5128	Pettenasco                                                  	116	G520
5129	Pettinengo                                                  	42	G521
5130	Pettineo                                                    	67	G522
5131	Pettoranello del Molise                                     	34	G523
5132	Pettorano sul Gizio                                         	71	G524
5133	Pettorazza Grimani                                          	35	G525
5134	Peveragno                                                   	163	G526
5135	Pezzana                                                     	93	G528
5136	Pezzaze                                                     	141	G529
5137	Pezzolo Valle Uzzone                                        	164	G532
5138	Piacenza d'Adige                                            	62	G534
5139	Piacenza                                                    	32	G535
5140	Piadena                                                     	71	G536
5141	Piagge                                                      	46	G537
5142	Piaggine                                                    	95	G538
5143	Valle dell'Angelo                                           	153	G540
5144	Piana di Monte Verna                                        	56	G541
5145	Piana Crixia                                                	48	G542
5146	Piana degli Albanesi                                        	57	G543
5147	Pontboset                                                   	50	G545
5148	Pian Camuno                                                 	142	G546
5149	Piancastagnaio                                              	20	G547
5150	Piancogno                                                   	206	G549
5151	Piandimeleto                                                	47	G551
5152	Piane Crati                                                 	97	G553
5153	Pianella                                                    	30	G555
5154	Pianello del Lario                                          	183	G556
5155	Pianello Val Tidone                                         	33	G557
5156	Pianengo                                                    	72	G558
5157	Pianezza                                                    	189	G559
5158	Pianezze                                                    	77	G560
5159	Pianfei                                                     	165	G561
5160	Pianico                                                     	162	G564
5161	Pianiga                                                     	28	G565
5162	San Benedetto Val di Sambro                                 	51	G566
5163	Piano di Sorrento                                           	53	G568
5164	Pianoro                                                     	47	G570
5165	Piansano                                                    	43	G571
5166	Piantedo                                                    	48	G572
5167	Piario                                                      	163	G574
5168	Piasco                                                      	166	G575
5169	Piateda                                                     	49	G576
5170	Piatto                                                      	43	G577
5171	Piazza Brembana                                             	164	G579
5172	Piazza Armerina                                             	14	G580
5173	Piazza al Serchio                                           	23	G582
5174	Piazzatorre                                                 	165	G583
5175	Piazzola sul Brenta                                         	63	G587
5176	Piazzolo                                                    	166	G588
5177	Picciano                                                    	31	G589
5178	Picerno                                                     	59	G590
5179	Picinisco                                                   	50	G591
5180	Pico                                                        	51	G592
5181	Piea                                                        	84	G593
5182	Piedicavallo                                                	44	G594
5183	Piedimonte Matese                                           	57	G596
5184	Piedimonte Etneo                                            	35	G597
5185	Piedimonte San Germano                                      	52	G598
5186	Piedimulera                                                 	53	G600
5187	Piegaro                                                     	40	G601
5188	Pienza                                                      	21	G602
5189	Pieranica                                                   	73	G603
5190	Pietramontecorvino                                          	39	G604
5191	Pietra Ligure                                               	49	G605
5192	Pietrabbondante                                             	35	G606
5193	Pietrabruna                                                 	41	G607
5194	Pietracamela                                                	34	G608
5195	Pietracatella                                               	53	G609
5196	Pietracupa                                                  	54	G610
5197	Pietradefusi                                                	72	G611
5198	Pietra de' Giorgi                                           	111	G612
5199	Pietraferrazzana                                            	103	G613
5200	Satriano di Lucania                                         	83	G614
5201	Pietrafitta                                                 	98	G615
5202	Pietragalla                                                 	60	G616
5203	Pietralunga                                                 	41	G618
5204	Pietra Marazzi                                              	129	G619
5205	Pietramelara                                                	58	G620
5206	Pietranico                                                  	32	G621
5207	Pietrapaola                                                 	99	G622
5208	Pietrapertosa                                               	61	G623
5209	Pietraperzia                                                	15	G624
5210	Pietraporzio                                                	167	G625
5211	Pietraroja                                                  	51	G626
5212	Pietrarubbia                                                	48	G627
5213	Pietrasanta                                                 	24	G628
5214	Pietrastornina                                              	73	G629
5215	Pietravairano                                               	59	G630
5216	Pietrelcina                                                 	52	G631
5217	Pieve di Teco                                               	42	G632
5218	Pieve di Coriano                                            	40	G633
5219	Pieve Emanuele                                              	173	G634
5220	Pieve Albignola                                             	112	G635
5221	Pieve a Nievole                                             	13	G636
5222	Pievebovigliana                                             	37	G637
5223	Pieve d'Alpago                                              	38	G638
5224	Pieve del Cairo                                             	113	G639
5225	Pieve di Bono                                               	140	G641
5226	Pieve di Cadore                                             	39	G642
5227	Pieve di Cento                                              	48	G643
5228	Pieve di Soligo                                             	57	G645
5229	Pieve Ligure                                                	43	G646
5230	Pieve d'Olmi                                                	74	G647
5231	Pieve Fosciana                                              	25	G648
5232	Pievepelago                                                 	31	G649
5233	Pieve Porto Morone                                          	114	G650
5234	Pieve San Giacomo                                           	75	G651
5235	Pieve Santo Stefano                                         	30	G653
5236	Ramiseto                                                    	31	G654
5237	Pieve Tesino                                                	142	G656
5238	Pieve Torina                                                	38	G657
5239	Pieve Vergonte                                              	54	G658
5240	Piglio                                                      	53	G659
5241	Pigna                                                       	43	G660
5242	Pignataro Maggiore                                          	60	G661
5243	Pignataro Interamna                                         	54	G662
5244	Pignola                                                     	62	G663
5245	Pignone                                                     	21	G664
5246	Pigra                                                       	184	G665
5247	Pila                                                        	96	G666
5248	Pimentel                                                    	48	G669
5249	Pimonte                                                     	54	G670
5250	Pinarolo Po                                                 	115	G671
5251	Pinasca                                                     	190	G672
5252	Pincara                                                     	36	G673
5253	Pinerolo                                                    	191	G674
5254	Pino d'Asti                                                 	85	G676
5255	Pino Torinese                                               	192	G678
5256	Pinzano al Tagliamento                                      	30	G680
5257	Pinzolo                                                     	143	G681
5258	Piobbico                                                    	49	G682
5259	Piobesi d'Alba                                              	168	G683
5260	Piobesi Torinese                                            	193	G684
5261	Piode                                                       	97	G685
5262	Pioltello                                                   	175	G686
5263	Piombino                                                    	12	G687
5264	Piombino Dese                                               	64	G688
5265	Pioraco                                                     	39	G690
5266	Piossasco                                                   	194	G691
5267	Piov… Massaia                                               	86	G692
5268	Piove di Sacco                                              	65	G693
5269	Piovene Rocchette                                           	78	G694
5270	Piovera                                                     	130	G695
5271	Piozzano                                                    	34	G696
5272	Piozzo                                                      	169	G697
5273	Priverno                                                    	19	G698
5274	Piraino                                                     	68	G699
5275	Pisa                                                        	26	G702
5276	Pisano                                                      	119	G703
5277	Pisoniano                                                   	77	G704
5278	Piscina                                                     	195	G705
5279	Pisciotta                                                   	96	G707
5280	Pisogne                                                     	143	G710
5281	Pisticci                                                    	20	G712
5282	Pistoia                                                     	14	G713
5283	Piteglio                                                    	15	G715
5284	Pitigliano                                                  	19	G716
5285	Piubega                                                     	41	G717
5286	Piuro                                                       	50	G718
5287	Piverone                                                    	196	G719
5288	Pizzale                                                     	116	G720
5289	Pizzighettone                                               	76	G721
5290	Pizzo                                                       	27	G722
5291	Pizzoferrato                                                	66	G724
5292	Pizzoli                                                     	72	G726
5293	Pizzone                                                     	36	G727
5294	Pizzoni                                                     	28	G728
5295	Placanica                                                   	59	G729
5296	Plataci                                                     	100	G733
5297	Platania                                                    	99	G734
5298	Plat�                                                       	60	G735
5299	Taipana                                                     	113	G736
5300	Plesio                                                      	185	G737
5301	Ploaghe                                                     	57	G740
5302	Plodio                                                      	50	G741
5303	Pocapaglia                                                  	170	G742
5304	Pocenia                                                     	75	G743
5305	Podenzana                                                   	13	G746
5306	Podenzano                                                   	35	G747
5307	Pofi                                                        	55	G749
5308	Poggiardo                                                   	61	G751
5309	Poggibonsi                                                  	22	G752
5310	Poggio Rusco                                                	42	G753
5311	Poggio a Caiano                                             	4	G754
5312	Poggio Bustone                                              	51	G756
5313	Poggio Catino                                               	52	G757
5314	Poggiodomo                                                  	42	G758
5315	Poggiofiorito                                               	67	G760
5316	Poggio Imperiale                                            	40	G761
5317	Poggiomarino                                                	55	G762
5318	Poggio Mirteto                                              	53	G763
5319	Poggio Moiano                                               	54	G764
5320	Poggio Nativo                                               	55	G765
5321	Poggio Picenze                                              	73	G766
5322	Poggioreale                                                 	16	G767
5323	Poggio Renatico                                             	18	G768
5324	Poggiorsini                                                 	34	G769
5325	Poggio San Lorenzo                                          	56	G770
5326	Poggio San Marcello                                         	37	G771
5327	Pogliano Milanese                                           	176	G772
5328	Pognana Lario                                               	186	G773
5329	Pognano                                                     	167	G774
5330	Pogno                                                       	120	G775
5331	Pojana Maggiore                                             	79	G776
5332	Poirino                                                     	197	G777
5333	Polaveno                                                    	144	G779
5334	Polcenigo                                                   	31	G780
5335	Polesella                                                   	37	G782
5336	Polesine Parmense                                           	29	G783
5337	Poli                                                        	78	G784
5338	Polia                                                       	29	G785
5339	Policoro                                                    	21	G786
5340	Polignano a Mare                                            	35	G787
5341	San Pietro in Cerro                                         	41	G788
5342	Polinago                                                    	32	G789
5343	Polino                                                      	27	G790
5344	Polistena                                                   	61	G791
5345	Polizzi Generosa                                            	58	G792
5346	Polla                                                       	97	G793
5347	Pollein                                                     	49	G794
5348	Pollena Trocchia                                            	56	G795
5349	Pollica                                                     	98	G796
5350	Pollina                                                     	59	G797
5351	Pollone                                                     	46	G798
5352	Pollutri                                                    	68	G799
5353	Polonghera                                                  	171	G800
5354	Polpenazze del Garda                                        	145	G801
5355	Polverara                                                   	66	G802
5356	Polverigi                                                   	38	G803
5357	Pomarance                                                   	27	G804
5358	Pomaretto                                                   	198	G805
5359	Pomarico                                                    	22	G806
5360	Pomaro Monferrato                                           	131	G807
5361	Pomarolo                                                    	144	G808
5362	Pombia                                                      	121	G809
5363	Pomezia                                                     	79	G811
5364	Pomigliano d'Arco                                           	57	G812
5365	Pompei                                                      	58	G813
5366	Pompeiana                                                   	44	G814
5367	Pompiano                                                    	146	G815
5368	Pomponesco                                                  	43	G816
5369	Pompu                                                       	42	G817
5370	Poncarale                                                   	147	G818
5371	Ponderano                                                   	47	G820
5372	Ponna                                                       	187	G821
5373	Ponsacco                                                    	28	G822
5374	Ponso                                                       	67	G823
5375	Pontassieve                                                 	33	G825
5376	Pont-Canavese                                               	199	G826
5377	Ponte                                                       	53	G827
5378	Ponte in Valtellina                                         	52	G829
5379	Ponte Gardena                                               	65	G830
5380	Pontebba                                                    	76	G831
5381	Ponte Buggianese                                            	16	G833
5382	Pontecagnano Faiano                                         	99	G834
5383	Pontecchio Polesine                                         	38	G836
5384	Pontechianale                                               	172	G837
5385	Pontecorvo                                                  	56	G838
5386	Pontecurone                                                 	132	G839
5387	Pontedassio                                                 	45	G840
5388	Ponte dell'Olio                                             	36	G842
5389	Pontedera                                                   	29	G843
5390	Ponte di Legno                                              	148	G844
5391	Ponte di Piave                                              	58	G846
5392	Ponte Lambro                                                	188	G847
5393	Pontelandolfo                                               	54	G848
5394	Pontelatone                                                 	61	G849
5395	Pontelongo                                                  	68	G850
5396	Ponte Nizza                                                 	117	G851
5397	Pontenure                                                   	37	G852
5398	Ponteranica                                                 	169	G853
5399	Pont-Saint-Martin                                           	52	G854
5400	Ponte San Nicol•                                            	69	G855
5401	Ponte San Pietro                                            	170	G856
5402	Pontestura                                                  	133	G858
5403	Pontevico                                                   	149	G859
5404	Pontey                                                      	51	G860
5405	Ponti                                                       	134	G861
5406	Ponti sul Mincio                                            	44	G862
5407	Pontida                                                     	171	G864
5408	Pontinia                                                    	17	G865
5409	Pontinvrea                                                  	51	G866
5410	Pontirolo Nuovo                                             	172	G867
5411	Pontoglio                                                   	150	G869
5412	Pontremoli                                                  	14	G870
5413	Ponza                                                       	18	G871
5414	Ponzano Monferrato                                          	135	G872
5415	Ponzano di Fermo                                            	32	G873
5416	Ponzano Romano                                              	80	G874
5417	Ponzano Veneto                                              	59	G875
5418	Ponzone                                                     	136	G877
5419	Popoli                                                      	33	G878
5420	Poppi                                                       	31	G879
5421	Porano                                                      	28	G881
5422	Porcari                                                     	26	G882
5423	Porcia                                                      	32	G886
5424	Stella Cilento                                              	144	G887
5425	Pordenone                                                   	33	G888
5426	Porlezza                                                    	189	G889
5427	Pornassio                                                   	46	G890
5428	Porpetto                                                    	77	G891
5429	Portacomaro                                                 	87	G894
5430	Portalbera                                                  	118	G895
5431	Porte                                                       	200	G900
5432	Portici                                                     	59	G902
5433	Portico di Caserta                                          	62	G903
5434	Portico e San Benedetto                                     	31	G904
5435	Portigliola                                                 	62	G905
5436	Porto Ceresio                                               	113	G906
5437	Porto Valtravaglia                                          	114	G907
5438	PortobuffolŠ                                                	60	G909
5439	Portocannone                                                	55	G910
5440	Portoferraio                                                	14	G912
5441	Portofino                                                   	44	G913
5442	Portogruaro                                                 	29	G914
5443	Portomaggiore                                               	19	G916
5444	Porto Mantovano                                             	45	G917
5445	Porto Recanati                                              	42	G919
5446	Porto San Giorgio                                           	33	G920
5447	Porto Sant'Elpidio                                          	34	G921
5448	Portoscuso                                                  	16	G922
5449	Porto Tolle                                                 	39	G923
5450	Porto Torres                                                	58	G924
5451	Portovenere                                                 	22	G925
5452	Porto Viro                                                  	52	G926
5453	Portula                                                     	48	G927
5454	Posada                                                      	73	G929
5455	Posina                                                      	80	G931
5456	Positano                                                    	100	G932
5457	Possagno                                                    	61	G933
5458	Posta                                                       	57	G934
5459	Posta Fibreno                                               	57	G935
5460	Postal                                                      	66	G936
5461	Postalesio                                                  	53	G937
5462	Postiglione                                                 	101	G939
5463	Postua                                                      	102	G940
5464	Potenza                                                     	63	G942
5465	Pove del Grappa                                             	81	G943
5466	Povegliano                                                  	62	G944
5467	Povegliano Veronese                                         	60	G945
5468	Poviglio                                                    	29	G947
5469	Povoletto                                                   	78	G949
5470	Pozza di Fassa                                              	145	G950
5471	Pozzaglia Sabina                                            	58	G951
5472	Pozzallo                                                    	8	G953
5473	Pozzilli                                                    	38	G954
5474	Pozzo d'Adda                                                	177	G955
5475	Pozzoleone                                                  	82	G957
5476	Pozzolengo                                                  	151	G959
5477	Pozzol Groppo                                               	137	G960
5478	Pozzolo Formigaro                                           	138	G961
5479	Pozzomaggiore                                               	59	G962
5480	Pozzonovo                                                   	70	G963
5481	Pozzuoli                                                    	60	G964
5482	Pozzuolo Martesana                                          	178	G965
5483	Pozzuolo del Friuli                                         	79	G966
5484	Pradalunga                                                  	173	G968
5485	Pradamano                                                   	80	G969
5486	Pradleves                                                   	173	G970
5487	Sasso Marconi                                               	57	G972
5488	Pragelato                                                   	201	G973
5489	Pray                                                        	50	G974
5490	Praia a Mare                                                	101	G975
5491	Praiano                                                     	102	G976
5492	Pralboino                                                   	152	G977
5493	Prali                                                       	202	G978
5494	Pralormo                                                    	203	G979
5495	Pralungo                                                    	49	G980
5496	Pramaggiore                                                 	30	G981
5497	Pramollo                                                    	204	G982
5498	Prarolo                                                     	104	G985
5499	Prarostino                                                  	205	G986
5500	Prasco                                                      	139	G987
5501	Prascorsano                                                 	206	G988
5502	Praso                                                       	146	G989
5503	Prata di Principato Ultra                                   	74	G990
5504	Prata Sannita                                               	63	G991
5505	Prata d'Ansidonia                                           	74	G992
5506	Prata Camportaccio                                          	54	G993
5507	Prata di Pordenone                                          	34	G994
5508	Pratella                                                    	64	G995
5509	Pratiglione                                                 	207	G997
5510	Prato                                                       	5	G999
5511	Prato Sesia                                                 	122	H001
5512	Prato Carnico                                               	81	H002
5513	Prato allo Stelvio                                          	67	H004
5514	Pratola Serra                                               	75	H006
5515	Pratola Peligna                                             	75	H007
5516	Pravisdomini                                                	35	H010
5517	Prazzo                                                      	174	H011
5518	Samo                                                        	70	H013
5519	Precenicco                                                  	82	H014
5520	Preci                                                       	43	H015
5521	Predappio                                                   	32	H017
5522	Predazzo                                                    	147	H018
5523	Predoi                                                      	68	H019
5524	Predore                                                     	174	H020
5525	Predosa                                                     	140	H021
5526	Preganziol                                                  	63	H022
5527	Pregnana Milanese                                           	179	H026
5528	Prel…                                                       	47	H027
5529	Premana                                                     	69	H028
5530	Premariacco                                                 	83	H029
5531	Premeno                                                     	55	H030
5532	Premia                                                      	56	H033
5533	Premilcuore                                                 	33	H034
5534	Premolo                                                     	175	H036
5535	Premosello-Chiovenda                                        	57	H037
5536	Preone                                                      	84	H038
5537	Preore                                                      	148	H039
5538	Prepotto                                                    	85	H040
5539	Pr‚-Saint-Didier                                            	53	H042
5540	Preseglie                                                   	153	H043
5541	Presenzano                                                  	65	H045
5542	Presezzo                                                    	176	H046
5543	Presicce                                                    	62	H047
5544	Pressana                                                    	61	H048
5545	Prestine                                                    	154	H050
5546	Pretoro                                                     	69	H052
5547	Prevalle                                                    	155	H055
5548	Prezza                                                      	76	H056
5549	Prezzo                                                      	149	H057
5550	Priero                                                      	175	H059
5551	Prignano sulla Secchia                                      	33	H061
5552	Prignano Cilento                                            	103	H062
5553	Primaluna                                                   	70	H063
5554	Priocca                                                     	176	H068
5555	Priola                                                      	177	H069
5556	Prizzi                                                      	60	H070
5557	Proceno                                                     	44	H071
5558	Procida                                                     	61	H072
5559	Propata                                                     	45	H073
5560	Proserpio                                                   	192	H074
5561	Prossedi                                                    	20	H076
5562	Provaglio Val Sabbia                                        	157	H077
5563	Provaglio d'Iseo                                            	156	H078
5564	Proves                                                      	69	H081
5565	Provvidenti                                                 	56	H083
5566	Prunetto                                                    	178	H085
5567	Puegnago sul Garda                                          	158	H086
5568	Puglianello                                                 	55	H087
5569	Pula                                                        	50	H088
5570	Pulfero                                                     	86	H089
5571	Pulsano                                                     	22	H090
5572	Pumenengo                                                   	177	H091
5573	Puos d'Alpago                                               	41	H092
5574	Pusiano                                                     	193	H094
5575	Putifigari                                                  	60	H095
5576	Putignano                                                   	36	H096
5577	Quadrelle                                                   	76	H097
5578	Quadri                                                      	70	H098
5579	Quagliuzzo                                                  	208	H100
5580	Qualiano                                                    	62	H101
5581	Quaranti                                                    	88	H102
5582	Quaregna                                                    	51	H103
5583	Quargnento                                                  	141	H104
5584	Quarna Sopra                                                	58	H106
5585	Quarna Sotto                                                	59	H107
5586	Quarona                                                     	107	H108
5587	Quarrata                                                    	17	H109
5588	Quart                                                       	54	H110
5589	Quarto                                                      	63	H114
5590	Quarto d'Altino                                             	31	H117
5591	Quartu Sant'Elena                                           	51	H118
5592	Quartucciu                                                  	105	H119
5593	Quassolo                                                    	209	H120
5594	Quattordio                                                  	142	H121
5595	Quattro Castella                                            	30	H122
5596	Quiliano                                                    	52	H126
5597	Quincinetto                                                 	210	H127
5598	Quindici                                                    	77	H128
5599	Quingentole                                                 	46	H129
5600	Quintano                                                    	78	H130
5601	Quinto di Treviso                                           	64	H131
5602	Quinto Vercellese                                           	108	H132
5603	Quinto Vicentino                                            	83	H134
5604	Quinzano d'Oglio                                            	159	H140
5605	Quistello                                                   	47	H143
5606	Quittengo                                                   	52	H145
5607	Rabbi                                                       	150	H146
5608	Racale                                                      	63	H147
5609	Racalmuto                                                   	29	H148
5610	Racconigi                                                   	179	H150
5611	Raccuja                                                     	69	H151
5612	Racines                                                     	70	H152
5613	Radda in Chianti                                            	23	H153
5614	Raddusa                                                     	36	H154
5615	Radicofani                                                  	24	H156
5616	Radicondoli                                                 	25	H157
5617	Raffadali                                                   	30	H159
5618	Ragogna                                                     	87	H161
5619	Ragoli                                                      	151	H162
5620	Ragusa                                                      	9	H163
5621	Ruviano                                                     	73	H165
5622	Raiano                                                      	77	H166
5623	Ramacca                                                     	37	H168
5624	Ramponio Verna                                              	194	H171
5625	Rancio Valcuvia                                             	115	H173
5626	Ranco                                                       	116	H174
5627	Randazzo                                                    	38	H175
5628	Ranica                                                      	178	H176
5629	Ranzanico                                                   	179	H177
5630	Ranzo                                                       	48	H180
5631	Rapagnano                                                   	35	H182
5632	Rapallo                                                     	46	H183
5633	Rapino                                                      	71	H184
5634	Rapolano Terme                                              	26	H185
5635	Rapolla                                                     	64	H186
5636	Rapone                                                      	65	H187
5637	Rassa                                                       	110	H188
5638	Rasun-Anterselva                                            	71	H189
5639	Rasura                                                      	55	H192
5640	Ravanusa                                                    	31	H194
5641	Ravarino                                                    	34	H195
5642	Ravascletto                                                 	88	H196
5643	Ravello                                                     	104	H198
5644	Ravenna                                                     	14	H199
5645	Raveo                                                       	89	H200
5646	Raviscanina                                                 	66	H202
5647	Re                                                          	60	H203
5648	Rea                                                         	119	H204
5649	Realmonte                                                   	32	H205
5650	Reana del Rojale                                            	90	H206
5651	Reano                                                       	211	H207
5652	Recale                                                      	67	H210
5653	Recanati                                                    	44	H211
5654	Recco                                                       	47	H212
5655	Recetto                                                     	129	H213
5656	Recoaro Terme                                               	84	H214
5657	Redavalle                                                   	120	H216
5658	Redondesco                                                  	48	H218
5659	Refrancore                                                  	89	H219
5660	Refrontolo                                                  	65	H220
5661	Regalbuto                                                   	16	H221
5662	Reggello                                                    	35	H222
5663	REGGIO EMILIA                                               	33	H223
5664	Reggio di Calabria                                          	63	H224
5665	Reggiolo                                                    	32	H225
5666	Reino                                                       	56	H227
5667	Reitano                                                     	70	H228
5668	Remanzacco                                                  	91	H229
5669	Remedello                                                   	160	H230
5670	Renate                                                      	37	H233
5671	Rende                                                       	102	H235
5672	Renon                                                       	72	H236
5673	Resana                                                      	66	H238
5674	Rescaldina                                                  	181	H240
5675	Resia                                                       	92	H242
5676	Ercolano                                                    	64	H243
5677	Resiutta                                                    	93	H244
5678	Resuttano                                                   	14	H245
5679	Retorbido                                                   	121	H246
5680	Revello                                                     	180	H247
5681	Revere                                                      	49	H248
5682	Revigliasco d'Asti                                          	90	H250
5683	Revine Lago                                                 	67	H253
5684	Rev•                                                        	152	H254
5685	Rezzago                                                     	195	H255
5686	Rezzato                                                     	161	H256
5687	Rezzo                                                       	49	H257
5688	Rezzoaglio                                                  	48	H258
5689	Val Rezzo                                                   	233	H259
5690	Rhˆmes-Notre-Dame                                           	55	H262
5691	Rhˆmes-Saint-Georges                                        	56	H263
5692	Rho                                                         	182	H264
5693	Riace                                                       	64	H265
5694	Rialto                                                      	53	H266
5695	Riano                                                       	81	H267
5696	Riardo                                                      	68	H268
5697	Ribera                                                      	33	H269
5698	Ribordone                                                   	212	H270
5699	Ricadi                                                      	30	H271
5700	Ricaldone                                                   	143	H272
5701	Riccia                                                      	57	H273
5702	Riccione                                                    	13	H274
5703	Ricc• del Golfo di Spezia                                   	23	H275
5704	Ricengo                                                     	79	H276
5705	Ricigliano                                                  	105	H277
5706	Riese Pio X                                                 	68	H280
5707	Riesi                                                       	15	H281
5708	Rieti                                                       	59	H282
5709	Rifiano                                                     	73	H284
5710	Rifreddo                                                    	181	H285
5711	Rignano sull'Arno                                           	36	H286
5712	Rignano Garganico                                           	41	H287
5713	Rignano Flaminio                                            	82	H288
5714	Rigolato                                                    	94	H289
5715	Rima San Giuseppe                                           	111	H291
5716	Rimasco                                                     	112	H292
5717	Rimella                                                     	113	H293
5718	Rimini                                                      	14	H294
5719	Rio nell'Elba                                               	16	H297
5720	Rio Saliceto                                                	34	H298
5721	Rio di Pusteria                                             	74	H299
5722	Riofreddo                                                   	83	H300
5723	Riola Sardo                                                 	43	H301
5724	Riolo Terme                                                 	15	H302
5725	Riolunato                                                   	35	H303
5726	Riomaggiore                                                 	24	H304
5727	Rio Marina                                                  	15	H305
5728	Rionero in Vulture                                          	66	H307
5729	Rionero Sannitico                                           	39	H308
5730	Ripabottoni                                                 	58	H311
5731	Ripacandida                                                 	67	H312
5732	Ripalimosani                                                	59	H313
5733	Ripalta Arpina                                              	80	H314
5734	Ripalta Cremasca                                            	81	H315
5735	Ripalta Guerina                                             	82	H316
5736	Riparbella                                                  	30	H319
5737	Ripa Teatina                                                	72	H320
5738	Ripatransone                                                	63	H321
5739	Ripe San Ginesio                                            	45	H323
5740	Ripi                                                        	58	H324
5741	Riposto                                                     	39	H325
5742	Rittana                                                     	182	H326
5743	Rivamonte Agordino                                          	43	H327
5744	Riva Ligure                                                 	50	H328
5745	Riva Valdobbia                                              	114	H329
5746	Riva del Garda                                              	153	H330
5747	Riva di Solto                                               	180	H331
5748	Rivalba                                                     	213	H333
5749	Rivalta Bormida                                             	144	H334
5750	Rivalta di Torino                                           	214	H335
5751	Rivanazzano Terme                                           	122	H336
5752	Riva presso Chieri                                          	215	H337
5753	Rivara                                                      	216	H338
5754	Rivarolo Canavese                                           	217	H340
5755	Rivarolo del Re ed Uniti                                    	83	H341
5756	Rivarolo Mantovano                                          	50	H342
5757	Rivarone                                                    	145	H343
5758	Rivarossa                                                   	218	H344
5759	Rive                                                        	115	H346
5760	Rive d'Arcano                                               	95	H347
5761	Rivello                                                     	68	H348
5762	Rivergaro                                                   	38	H350
5763	Rivisondoli                                                 	78	H353
5764	Rivodutri                                                   	60	H354
5765	Rivoli                                                      	219	H355
5766	Rivoli Veronese                                             	62	H356
5767	Rivolta d'Adda                                              	84	H357
5768	Rizziconi                                                   	65	H359
5769	Ro                                                          	20	H360
5770	Roana                                                       	85	H361
5771	Roaschia                                                    	183	H362
5772	Roascio                                                     	184	H363
5773	Rovasenda                                                   	122	H364
5774	Roasio                                                      	116	H365
5775	Roatto                                                      	91	H366
5776	Robassomero                                                 	220	H367
5777	Robbio                                                      	123	H369
5778	Robecchetto con Induno                                      	183	H371
5779	Robecco d'Oglio                                             	85	H372
5780	Robecco sul Naviglio                                        	184	H373
5781	Robecco Pavese                                              	124	H375
5782	Robella                                                     	92	H376
5783	Robilante                                                   	185	H377
5784	Roburent                                                    	186	H378
5785	Rocca Pietore                                               	44	H379
5786	Roccavaldina                                                	73	H380
5787	Roccabascerana                                              	78	H382
5788	Roccabernarda                                               	18	H383
5789	Roccabianca                                                 	30	H384
5790	Roccabruna                                                  	187	H385
5791	Rocca Canavese                                              	221	H386
5792	Rocca Canterano                                             	84	H387
5793	Roccacasale                                                 	79	H389
5794	Roccafluvione                                               	64	H390
5795	Rocca CigliŠ                                                	188	H391
5796	Rocca d'Arazzo                                              	93	H392
5797	Rocca d'Arce                                                	59	H393
5798	Roccadaspide                                                	106	H394
5799	Rocca de' Baldi                                             	189	H395
5800	Rocca de' Giorgi                                            	125	H396
5801	Rocca d'Evandro                                             	69	H398
5802	Rocca di Botte                                              	80	H399
5803	Rocca di Cambio                                             	81	H400
5804	Rocca di Cave                                               	85	H401
5805	Rocca di Mezzo                                              	82	H402
5806	Rocca di Neto                                               	19	H403
5807	Rocca di Papa                                               	86	H404
5808	Roccafiorita                                                	71	H405
5809	Roccaforte Ligure                                           	146	H406
5810	Roccaforte Mondov�                                          	190	H407
5811	Roccaforte del Greco                                        	66	H408
5812	Roccaforzata                                                	23	H409
5813	Roccafranca                                                 	162	H410
5814	Roccagiovine                                                	87	H411
5815	Roccagloriosa                                               	107	H412
5816	Roccagorga                                                  	21	H413
5817	Rocca Grimalda                                              	147	H414
5818	Rocca Imperiale                                             	103	H416
5819	Roccalbegna                                                 	20	H417
5820	Roccalumera                                                 	72	H418
5821	Roccamandolfi                                               	40	H420
5822	Rocca Massima                                               	22	H421
5823	Roccamena                                                   	61	H422
5824	Roccamonfina                                                	70	H423
5825	Roccamontepiano                                             	73	H424
5826	Roccamorice                                                 	34	H425
5827	Roccanova                                                   	69	H426
5828	Roccantica                                                  	61	H427
5829	Roccapalumba                                                	62	H428
5830	Rocca Pia                                                   	83	H429
5831	Roccapiemonte                                               	108	H431
5832	Rocca Priora                                                	88	H432
5833	Roccarainola                                                	65	H433
5834	Roccaraso                                                   	84	H434
5835	Roccaromana                                                 	71	H436
5836	Rocca San Casciano                                          	36	H437
5837	Rocca San Felice                                            	79	H438
5838	Rocca San Giovanni                                          	74	H439
5839	Rocca Santa Maria                                           	36	H440
5840	Rocca Santo Stefano                                         	89	H441
5841	Roccascalegna                                               	75	H442
5842	Roccasecca                                                  	60	H443
5843	Roccasecca dei Volsci                                       	23	H444
5844	Roccasicura                                                 	41	H445
5845	Rocca Sinibalda                                             	62	H446
5846	Roccasparvera                                               	191	H447
5847	Roccaspinalveti                                             	76	H448
5848	Roccastrada                                                 	21	H449
5849	Rocca Susella                                               	126	H450
5850	Roccaverano                                                 	94	H451
5851	Roccavignale                                                	54	H452
5852	Roccavione                                                  	192	H453
5853	Roccavivara                                                 	60	H454
5854	Roccella Valdemone                                          	74	H455
5855	Roccella Ionica                                             	67	H456
5856	Rocchetta a Volturno                                        	42	H458
5857	Rocchetta e Croce                                           	72	H459
5858	Rocchetta Nervina                                           	51	H460
5859	Rocchetta di Vara                                           	25	H461
5860	Rocchetta Belbo                                             	193	H462
5861	Rocchetta Ligure                                            	148	H465
5862	Rocchetta Palafea                                           	95	H466
5863	Rocchetta Sant'Antonio                                      	42	H467
5864	Rocchetta Tanaro                                            	96	H468
5865	Rodano                                                      	185	H470
5866	Roddi                                                       	194	H472
5867	Roddino                                                     	195	H473
5868	Rodello                                                     	196	H474
5869	Rodengo                                                     	75	H475
5870	Rodengo Saiano                                              	163	H477
5871	Rodero                                                      	197	H478
5872	Rod� Milici                                                 	75	H479
5873	Rodi Garganico                                              	43	H480
5874	Rodigo                                                      	51	H481
5875	RoŠ Volciano                                                	164	H484
5876	Rofrano                                                     	109	H485
5877	Rogeno                                                      	72	H486
5878	Roggiano Gravina                                            	104	H488
5879	Roghudi                                                     	68	H489
5880	Rogliano                                                    	105	H490
5881	Rognano                                                     	127	H491
5882	Rogno                                                       	182	H492
5883	Rogolo                                                      	56	H493
5884	Roiate                                                      	90	H494
5885	Roio del Sangro                                             	77	H495
5886	Roisan                                                      	57	H497
5887	Roletto                                                     	222	H498
5888	Rolo                                                        	35	H500
5889	Roma                                                        	91	H501
5890	Romagnano Sesia                                             	130	H502
5891	Romagnano al Monte                                          	110	H503
5892	Romagnese                                                   	128	H505
5893	Romallo                                                     	154	H506
5894	Romana                                                      	61	H507
5895	Romanengo                                                   	86	H508
5896	Romano di Lombardia                                         	183	H509
5897	Romano Canavese                                             	223	H511
5898	Romano d'Ezzelino                                           	86	H512
5899	Romans d'Isonzo                                             	15	H514
5900	Rombiolo                                                    	31	H516
5901	Romeno                                                      	155	H517
5902	Romentino                                                   	131	H518
5903	Rometta                                                     	76	H519
5904	Ronago                                                      	199	H521
5905	Ronc…                                                       	63	H522
5906	Roncade                                                     	69	H523
5907	Roncadelle                                                  	165	H525
5908	Roncaro                                                     	129	H527
5909	Roncegno Terme                                              	156	H528
5910	Roncello                                                    	55	H529
5911	Ronchi dei Legionari                                        	16	H531
5912	Ronchi Valsugana                                            	157	H532
5913	Ronchis                                                     	97	H533
5914	Ronciglione                                                 	45	H534
5915	Roncobello                                                  	184	H535
5916	Ronco Scrivia                                               	49	H536
5917	Ronco Briantino                                             	38	H537
5918	Ronco Biellese                                              	53	H538
5919	Ronco Canavese                                              	224	H539
5920	Ronco all'Adige                                             	64	H540
5921	Roncoferraro                                                	52	H541
5922	Roncofreddo                                                 	37	H542
5923	Roncola                                                     	185	H544
5924	Roncone                                                     	158	H545
5925	Rondanina                                                   	50	H546
5926	Rondissone                                                  	225	H547
5927	Ronsecco                                                    	118	H549
5928	Ronzone                                                     	159	H552
5929	Roppolo                                                     	54	H553
5930	Ror…                                                        	226	H554
5931	Roure                                                       	227	H555
5932	Ros…                                                        	87	H556
5933	Rosarno                                                     	69	H558
5934	Rosasco                                                     	130	H559
5935	Rosate                                                      	188	H560
5936	Rosazza                                                     	55	H561
5937	Rosciano                                                    	35	H562
5938	Roscigno                                                    	111	H564
5939	Rose                                                        	106	H565
5940	Rosello                                                     	78	H566
5941	Roseto Valfortore                                           	44	H568
5942	Rosignano Monferrato                                        	149	H569
5943	Rosignano Marittimo                                         	17	H570
5944	Roseto Capo Spulico                                         	107	H572
5945	Rosolina                                                    	40	H573
5946	Rosolini                                                    	16	H574
5947	Rosora                                                      	40	H575
5948	Rossa                                                       	121	H577
5949	Rossana                                                     	197	H578
5950	Rossano                                                     	108	H579
5951	Rossano Veneto                                              	88	H580
5952	Rossiglione                                                 	51	H581
5953	Rosta                                                       	228	H583
5954	Rota d'Imagna                                               	186	H584
5955	Rota Greca                                                  	109	H585
5956	Rotella                                                     	65	H588
5957	Rotello                                                     	61	H589
5958	Rotonda                                                     	70	H590
5959	Rotondella                                                  	23	H591
5960	Rotondi                                                     	80	H592
5961	Rottofreno                                                  	39	H593
5962	Rotzo                                                       	89	H594
5963	Rovagnate                                                   	73	H596
5964	Rovato                                                      	166	H598
5965	Rovegno                                                     	52	H599
5966	Rovellasca                                                  	201	H601
5967	Rovello Porro                                               	202	H602
5968	Roverbella                                                  	53	H604
5969	Roverchiara                                                 	65	H606
5970	RoverŠ della Luna                                           	160	H607
5971	RoverŠ Veronese                                             	67	H608
5972	Roveredo in Piano                                           	36	H609
5973	Roveredo di Gu…                                             	66	H610
5974	Rovereto                                                    	161	H612
5975	Rovescala                                                   	131	H614
5976	Rovetta                                                     	187	H615
5977	Roviano                                                     	92	H618
5978	Rovigo                                                      	41	H620
5979	Rovito                                                      	110	H621
5980	Rovolon                                                     	71	H622
5981	Rozzano                                                     	189	H623
5982	Rubano                                                      	72	H625
5983	Rubiana                                                     	229	H627
5984	Rubiera                                                     	36	H628
5985	Ruda                                                        	98	H629
5986	Rudiano                                                     	167	H630
5987	Rueglio                                                     	230	H631
5988	Ruffano                                                     	64	H632
5989	Ruffia                                                      	198	H633
5990	RuffrŠ-Mendola                                              	162	H634
5991	Rufina                                                      	37	H635
5992	Ruino                                                       	132	H637
5993	Rumo                                                        	163	H639
5994	Ruoti                                                       	71	H641
5995	Russi                                                       	16	H642
5996	Rutigliano                                                  	37	H643
5997	Rutino                                                      	112	H644
5998	Ruvo di Puglia                                              	38	H645
5999	Ruvo del Monte                                              	72	H646
6000	Sabaudia                                                    	24	H647
6001	Sabbia                                                      	123	H648
6002	Sabbio Chiese                                               	168	H650
6003	Sabbioneta                                                  	54	H652
6004	Sacco                                                       	113	H654
6005	Saccolongo                                                  	73	H655
6006	Sacile                                                      	37	H657
6007	Sacrofano                                                   	93	H658
6008	Sadali                                                      	119	H659
6009	Sagama                                                      	86	H661
6010	Sagliano Micca                                              	56	H662
6011	Sagrado                                                     	17	H665
6012	Sagron Mis                                                  	164	H666
6013	Saint-Christophe                                            	58	H669
6014	Saint-Denis                                                 	59	H670
6015	Saint-Marcel                                                	60	H671
6016	Saint-Nicolas                                               	61	H672
6017	Saint-Oyen                                                  	62	H673
6018	Saint-Pierre                                                	63	H674
6019	Saint-Rh‚my-en-Bosses                                       	64	H675
6020	Saint-Vincent                                               	65	H676
6021	Sala Monferrato                                             	150	H677
6022	Sala Bolognese                                              	50	H678
6023	Sala Comacina                                               	203	H679
6024	Sala Biellese                                               	57	H681
6025	Sala Baganza                                                	31	H682
6026	Sala Consilina                                              	114	H683
6027	Salbertrand                                                 	232	H684
6028	Salento                                                     	115	H686
6029	Salandra                                                    	24	H687
6030	Salaparuta                                                  	17	H688
6031	Salara                                                      	42	H689
6032	Salasco                                                     	126	H690
6033	Salassa                                                     	231	H691
6034	Salcito                                                     	62	H693
6035	Sale                                                        	151	H694
6036	Sale delle Langhe                                           	199	H695
6037	Sale Marasino                                               	169	H699
6038	Salemi                                                      	18	H700
6039	Salerano sul Lambro                                         	46	H701
6040	Salerano Canavese                                           	233	H702
6041	Salerno                                                     	116	H703
6042	Sale San Giovanni                                           	200	H704
6043	Saletto                                                     	74	H705
6044	Salgareda                                                   	70	H706
6045	Sali Vercellese                                             	127	H707
6046	Salice Salentino                                            	65	H708
6047	Saliceto                                                    	201	H710
6048	San Mauro di Saline                                         	74	H712
6049	Salisano                                                    	63	H713
6050	Salizzole                                                   	68	H714
6051	Salle                                                       	36	H715
6052	Salmour                                                     	202	H716
6053	Sal•                                                        	170	H717
6054	Salorno                                                     	76	H719
6055	Salsomaggiore Terme                                         	32	H720
6056	Saltara                                                     	50	H721
6057	Saltrio                                                     	117	H723
6058	Saludecio                                                   	15	H724
6059	Saluggia                                                    	128	H725
6060	Salussola                                                   	58	H726
6061	Saluzzo                                                     	203	H727
6062	Salve                                                       	66	H729
6063	Savoia di Lucania                                           	84	H730
6064	Salvirola                                                   	87	H731
6065	Salvitelle                                                  	117	H732
6066	Salza Irpina                                                	81	H733
6067	Salza di Pinerolo                                           	234	H734
6068	Salzano                                                     	32	H735
6069	Samarate                                                    	118	H736
6070	Samassi                                                     	13	H738
6071	Samatzai                                                    	53	H739
6072	Sambuca di Sicilia                                          	34	H743
6073	Sambuca Pistoiese                                           	18	H744
6074	Sambuci                                                     	94	H745
6075	Sambuco                                                     	204	H746
6076	Sammichele di Bari                                          	39	H749
6077	Samolaco                                                    	57	H752
6078	Samone                                                      	235	H753
6079	Samone                                                      	165	H754
6080	Sampeyre                                                    	205	H755
6081	Samugheo                                                    	45	H756
6082	Sanarica                                                    	67	H757
6083	San Bartolomeo Val Cavargna                                 	204	H760
6084	San Bartolomeo al Mare                                      	52	H763
6085	San Bartolomeo in Galdo                                     	57	H764
6086	San Basile                                                  	111	H765
6087	San Basilio                                                 	54	H766
6088	San Bassano                                                 	88	H767
6089	San Bellino                                                 	43	H768
6090	San Benedetto del Tronto                                    	66	H769
6091	San Benedetto Belbo                                         	206	H770
6092	San Benedetto Po                                            	55	H771
6093	San Benedetto dei Marsi                                     	85	H772
6094	San Benedetto in Perillis                                   	86	H773
6095	San Benedetto Ullano                                        	112	H774
6096	San Benigno Canavese                                        	236	H775
6097	San Bernardino Verbano                                      	61	H777
6098	San Biagio Platani                                          	35	H778
6099	San Biagio Saracinisco                                      	61	H779
6100	San Biagio della Cima                                       	53	H780
6101	San Biagio di Callalta                                      	71	H781
6102	San Biase                                                   	63	H782
6103	San Bonifacio                                               	69	H783
6104	San Buono                                                   	79	H784
6105	San Calogero                                                	32	H785
6106	San Candido                                                 	77	H786
6107	San Canzian d'Isonzo                                        	18	H787
6108	San Carlo Canavese                                          	237	H789
6109	San Casciano dei Bagni                                      	27	H790
6110	San Casciano in Val di Pesa                                 	38	H791
6111	San Cataldo                                                 	16	H792
6112	San Cesario di Lecce                                        	68	H793
6113	San Cesario sul Panaro                                      	36	H794
6114	San Chirico Nuovo                                           	73	H795
6115	San Chirico Raparo                                          	74	H796
6116	San Cipirello                                               	63	H797
6117	San Cipriano d'Aversa                                       	74	H798
6118	San Cipriano Po                                             	133	H799
6119	San Cipriano Picentino                                      	118	H800
6120	San Clemente                                                	16	H801
6121	San Colombano Certenoli                                     	53	H802
6122	San Colombano al Lambro                                     	191	H803
6123	San Colombano Belmonte                                      	238	H804
6124	San Cono                                                    	40	H805
6125	San Cosmo Albanese                                          	113	H806
6126	San Costantino Calabro                                      	33	H807
6127	San Costantino Albanese                                     	75	H808
6128	San Costanzo                                                	51	H809
6129	San Cristoforo                                              	152	H810
6130	San Damiano d'Asti                                          	97	H811
6131	San Damiano Macra                                           	207	H812
6132	San Damiano al Colle                                        	134	H814
6133	San Daniele Po                                              	89	H815
6134	San Daniele del Friuli                                      	99	H816
6135	San Demetrio Corone                                         	114	H818
6136	San Demetrio ne' Vestini                                    	87	H819
6137	San Didero                                                  	239	H820
6138	Sandigliano                                                 	59	H821
6139	San Donaci                                                  	13	H822
6140	San Don… di Piave                                           	33	H823
6141	San Donato Val di Comino                                    	62	H824
6142	San Donato di Ninea                                         	115	H825
6143	San Donato di Lecce                                         	69	H826
6144	San Donato Milanese                                         	192	H827
6145	Sandrigo                                                    	91	H829
6146	San Fedele Intelvi                                          	205	H830
6147	San Fele                                                    	76	H831
6148	San Felice del Molise                                       	64	H833
6149	San Felice a Cancello                                       	75	H834
6150	San Felice sul Panaro                                       	37	H835
6151	San Felice Circeo                                           	25	H836
6152	San Felice del Benaco                                       	171	H838
6153	San Ferdinando di Puglia                                    	7	H839
6154	San Fermo della Battaglia                                   	206	H840
6155	San Fili                                                    	116	H841
6156	San Filippo del Mela                                        	77	H842
6157	San Fior                                                    	72	H843
6158	San Fiorano                                                 	47	H844
6159	San Floriano del Collio                                     	19	H845
6160	San Floro                                                   	108	H846
6161	San Francesco al Campo                                      	240	H847
6162	Aglientu                                                    	2	H848
6163	San Fratello                                                	78	H850
6164	SanfrŠ                                                      	208	H851
6165	Sanfront                                                    	209	H852
6166	Sangano                                                     	241	H855
6167	San Gavino Monreale                                         	14	H856
6168	San Gemini                                                  	29	H857
6169	San Genesio Atesino                                         	79	H858
6170	San Genesio ed Uniti                                        	135	H859
6171	San Gennaro Vesuviano                                       	66	H860
6172	San Germano Vercellese                                      	131	H861
6173	San Germano Chisone                                         	242	H862
6174	San Germano dei Berici                                      	92	H863
6175	San Gervasio Bresciano                                      	172	H865
6176	San Giacomo degli Schiavoni                                 	65	H867
6177	San Giacomo Filippo                                         	58	H868
6178	San Giacomo delle Segnate                                   	56	H870
6179	Sangiano                                                    	141	H872
6180	San Gillio                                                  	243	H873
6181	San Gimignano                                               	28	H875
6182	San Ginesio                                                 	46	H876
6183	Sangineto                                                   	117	H877
6184	San Giorgio Monferrato                                      	153	H878
6185	San Giorgio a Liri                                          	63	H880
6186	San Giorgio Albanese                                        	118	H881
6187	San Giorgio Ionico                                          	24	H882
6188	San Giorgio di Mantova                                      	57	H883
6189	San Giorgio su Legnano                                      	194	H884
6190	San Giorgio di Lomellina                                    	136	H885
6191	San Giorgio di Pesaro                                       	52	H886
6192	San Giorgio Piacentino                                      	40	H887
6193	San Giorgio Lucano                                          	25	H888
6194	San Giorgio Morgeto                                         	71	H889
6195	San Giorgio Canavese                                        	244	H890
6196	San Giorgio della Richinvelda                               	38	H891
6197	San Giorgio a Cremano                                       	67	H892
6198	San Giorgio delle Pertiche                                  	75	H893
6199	San Giorgio del Sannio                                      	58	H894
6200	San Giorgio di Nogaro                                       	100	H895
6201	San Giorgio di Piano                                        	52	H896
6202	San Giorgio in Bosco                                        	76	H897
6203	San Giorgio La Molara                                       	59	H898
6204	San Giorgio Scarampi                                        	98	H899
6205	San Giorio di Susa                                          	245	H900
6206	San Giovanni Valdarno                                       	33	H901
6207	San Giovanni di Gerace                                      	72	H903
6208	San Giovanni al Natisone                                    	101	H906
6209	San Giovanni a Piro                                         	119	H907
6210	San Giovanni Bianco                                         	188	H910
6211	San Giovanni d'Asso                                         	29	H911
6212	San Giovanni del Dosso                                      	58	H912
6213	Villa San Giovanni in Tuscia                                	46	H913
6214	San Giovanni Gemini                                         	36	H914
6215	San Giovanni Ilarione                                       	70	H916
6216	San Giovanni Incarico                                       	64	H917
6217	San Giovanni in Croce                                       	90	H918
6218	San Giovanni in Fiore                                       	119	H919
6219	San Giovanni in Galdo                                       	66	H920
6220	San Giovanni in Marignano                                   	17	H921
6221	San Giovanni la Punta                                       	41	H922
6222	San Giovanni Lipioni                                        	80	H923
6223	San Giovanni Lupatoto                                       	71	H924
6224	San Giovanni Rotondo                                        	46	H926
6225	San Giuliano del Sannio                                     	67	H928
6226	San Giuliano di Puglia                                      	68	H929
6227	San Giuliano Milanese                                       	195	H930
6228	San Giuseppe Vesuviano                                      	68	H931
6229	San Giuseppe Jato                                           	64	H933
6230	San Giustino                                                	44	H935
6231	San Giusto Canavese                                         	246	H936
6232	San Godenzo                                                 	39	H937
6233	San Gregorio nelle Alpi                                     	45	H938
6234	San Gregorio Matese                                         	76	H939
6235	San Gregorio di Catania                                     	42	H940
6236	San Gregorio d'Ippona                                       	34	H941
6237	San Gregorio da Sassola                                     	95	H942
6238	San Gregorio Magno                                          	120	H943
6239	Sanguinetto                                                 	72	H944
6240	San Lazzaro di Savena                                       	54	H945
6241	San Leo                                                     	25	H949
6242	San Leonardo                                                	102	H951
6243	San Leonardo in Passiria                                    	80	H952
6244	San Leucio del Sannio                                       	60	H953
6245	San Lorenzello                                              	61	H955
6246	San Lorenzo di Sebato                                       	81	H956
6247	San Lorenzo al Mare                                         	54	H957
6248	San Lorenzo in Campo                                        	54	H958
6249	San Lorenzo                                                 	73	H959
6250	San Lorenzo Bellizzi                                        	120	H961
6251	San Lorenzo del Vallo                                       	121	H962
6252	San Lorenzo Isontino                                        	20	H964
6253	San Lorenzo in Banale                                       	166	H966
6254	San Lorenzo Maggiore                                        	62	H967
6255	San Lorenzo Nuovo                                           	47	H969
6256	San Luca                                                    	74	H970
6257	San Lucido                                                  	122	H971
6258	San Lupo                                                    	63	H973
6259	Sanluri                                                     	15	H974
6260	San Mango sul Calore                                        	82	H975
6261	San Mango d'Aquino                                          	110	H976
6262	San Mango Piemonte                                          	121	H977
6263	San Marcellino                                              	77	H978
6264	San Marcello                                                	41	H979
6265	San Marcello Pistoiese                                      	19	H980
6266	San Marco Argentano                                         	123	H981
6267	San Marco d'Alunzio                                         	79	H982
6268	San Marco dei Cavoti                                        	64	H984
6269	San Marco in Lamis                                          	47	H985
6270	San Marco la Catola                                         	48	H986
6271	San Martino Alfieri                                         	99	H987
6272	San Martino in Badia                                        	82	H988
6273	San Martino in Passiria                                     	83	H989
6274	San Martino in Pensilis                                     	69	H990
6275	San Martino sulla Marrucina                                 	82	H991
6276	San Martino di Finita                                       	124	H992
6277	San Martino d'Agri                                          	77	H994
6278	San Martino di Venezze                                      	44	H996
6279	San Martino Canavese                                        	247	H997
6280	San Martino al Tagliamento                                  	39	H999
6281	San Martino Sannita                                         	65	I002
6282	San Martino Buon Albergo                                    	73	I003
6283	San Martino dall'Argine                                     	59	I005
6284	San Martino del Lago                                        	91	I007
6285	San Martino di Lupari                                       	77	I008
6286	San Martino in Rio                                          	37	I011
6287	San Martino in Strada                                       	48	I012
6288	San Martino Siccomario                                      	137	I014
6289	San Martino Valle Caudina                                   	83	I016
6290	San Marzano Oliveto                                         	100	I017
6291	San Marzano di San Giuseppe                                 	25	I018
6292	San Marzano sul Sarno                                       	122	I019
6293	San Massimo                                                 	70	I023
6294	San Maurizio Canavese                                       	248	I024
6295	San Maurizio d'Opaglio                                      	133	I025
6296	San Mauro Marchesato                                        	20	I026
6297	San Mauro Pascoli                                           	41	I027
6298	San Mauro Castelverde                                       	65	I028
6299	San Mauro Forte                                             	26	I029
6300	San Mauro Torinese                                          	249	I030
6301	San Mauro Cilento                                           	123	I031
6302	San Mauro la Bruca                                          	124	I032
6303	San Michele di Serino                                       	84	I034
6304	San Michele di Ganzaria                                     	43	I035
6305	San Michele Mondov�                                         	210	I037
6306	San Michele al Tagliamento                                  	34	I040
6307	San Michele all'Adige                                       	167	I042
6308	San Michele Salentino                                       	14	I045
6309	San Miniato                                                 	32	I046
6310	San Nazario                                                 	93	I047
6311	Sannazzaro de' Burgondi                                     	138	I048
6312	San Nazzaro                                                 	66	I049
6313	San Nazzaro Val Cavargna                                    	207	I051
6314	San Nazzaro Sesia                                           	134	I052
6315	Sannicandro di Bari                                         	40	I053
6316	San Nicandro Garganico                                      	49	I054
6317	San Nicola la Strada                                        	78	I056
6318	San Nicola dell'Alto                                        	21	I057
6319	San Nicola da Crissa                                        	35	I058
6320	Sannicola                                                   	70	I059
6321	San Nicola Arcella                                          	125	I060
6322	San Nicola Baronia                                          	85	I061
6323	San Nicola Manfredi                                         	67	I062
6324	San Nicol• di Comelico                                      	46	I063
6325	San Pancrazio                                               	84	I065
6326	San Pancrazio Salentino                                     	15	I066
6327	San Paolo di Jesi                                           	42	I071
6328	San Paolo di Civitate                                       	50	I072
6329	San Paolo Bel Sito                                          	69	I073
6330	San Paolo Cervo                                             	60	I074
6331	San Paolo Solbrito                                          	101	I076
6332	San Pellegrino Terme                                        	190	I079
6333	San Pier d'Isonzo                                           	21	I082
6334	San Pier Niceto                                             	80	I084
6335	San Piero Patti                                             	81	I086
6336	San Pietro di Cadore                                        	47	I088
6337	San Pietro al Tanagro                                       	125	I089
6338	San Pietro Val Lemina                                       	250	I090
6339	San Pietro al Natisone                                      	103	I092
6340	San Pietro a Maida                                          	114	I093
6341	San Pietro Apostolo                                         	115	I095
6342	San Pietro Avellana                                         	43	I096
6343	San Pietro Clarenza                                         	44	I098
6344	San Pietro di Carid…                                        	75	I102
6345	San Pietro di Feletto                                       	73	I103
6346	San Pietro di Morubio                                       	75	I105
6347	San Pietro in Gu                                            	78	I107
6348	San Pietro in Amantea                                       	126	I108
6349	San Pietro in Cariano                                       	76	I109
6350	San Pietro in Casale                                        	55	I110
6351	San Pietro Infine                                           	79	I113
6352	San Pietro in Guarano                                       	127	I114
6353	San Pietro in Lama                                          	71	I115
6354	San Pietro Mosezzo                                          	135	I116
6355	San Pietro Mussolino                                        	94	I117
6356	Villa San Pietro                                            	99	I118
6357	San Pietro Vernotico                                        	16	I119
6358	San Pietro Viminario                                        	79	I120
6359	San Pio delle Camere                                        	88	I121
6360	San Polo Matese                                             	71	I122
6361	San Polo d'Enza                                             	38	I123
6362	San Polo di Piave                                           	74	I124
6363	San Polo dei Cavalieri                                      	96	I125
6364	San Ponso                                                   	251	I126
6365	San Possidonio                                              	38	I128
6366	San Potito Ultra                                            	86	I129
6367	San Potito Sannitico                                        	80	I130
6368	San Prisco                                                  	81	I131
6369	San Procopio                                                	76	I132
6370	San Prospero                                                	39	I133
6371	San Quirico d'Orcia                                         	30	I135
6372	San Quirino                                                 	40	I136
6373	San Raffaele Cimena                                         	252	I137
6374	Sanremo                                                     	55	I138
6375	San Roberto                                                 	77	I139
6376	San Rocco al Porto                                          	49	I140
6377	San Romano in Garfagnana                                    	27	I142
6378	San Rufo                                                    	126	I143
6379	San Salvatore Monferrato                                    	154	I144
6380	San Salvatore Telesino                                      	68	I145
6381	San Salvatore di Fitalia                                    	82	I147
6382	San Salvo                                                   	83	I148
6383	San Sebastiano Curone                                       	155	I150
6384	San Sebastiano al Vesuvio                                   	70	I151
6385	San Sebastiano da Po                                        	253	I152
6386	San Secondo Parmense                                        	33	I153
6387	San Secondo di Pinerolo                                     	254	I154
6388	Sansepolcro                                                 	34	I155
6389	San Severino Marche                                         	47	I156
6390	San Severino Lucano                                         	78	I157
6391	San Severo                                                  	51	I158
6392	San Siro                                                    	248	I162
6393	San Sossio Baronia                                          	87	I163
6394	San Sostene                                                 	116	I164
6395	San Sosti                                                   	128	I165
6396	San Sperate                                                 	59	I166
6397	Santa Brigida                                               	191	I168
6398	Santa Caterina Villarmosa                                   	17	I169
6399	Santa Caterina dello Ionio                                  	117	I170
6400	Santa Caterina Albanese                                     	129	I171
6401	Santa Cesarea Terme                                         	72	I172
6402	Santa Cristina Valgardena                                   	85	I173
6403	Santa Cristina Gela                                         	66	I174
6404	Santa Cristina e Bissone                                    	139	I175
6405	Santa Cristina d'Aspromonte                                 	78	I176
6406	Santa Croce sull'Arno                                       	33	I177
6407	Santa Croce Camerina                                        	10	I178
6408	Santa Croce del Sannio                                      	69	I179
6409	Santa Croce di Magliano                                     	72	I181
6410	Santadi                                                     	18	I182
6411	Santa Domenica Talao                                        	130	I183
6412	Santa Domenica Vittoria                                     	83	I184
6413	Santa Elisabetta                                            	37	I185
6414	Santa Fiora                                                 	22	I187
6415	Santa Flavia                                                	67	I188
6416	Sant'Agapito                                                	44	I189
6417	Sant'Agata Fossili                                          	156	I190
6418	Sant'Agata Bolognese                                        	56	I191
6419	Sant'Agata di Esaro                                         	131	I192
6420	Sant'Agata di Puglia                                        	52	I193
6421	Sant'Agata sul Santerno                                     	17	I196
6422	Sant'Agata de' Goti                                         	70	I197
6423	Sant'Agata del Bianco                                       	79	I198
6424	Sant'Agata di Militello                                     	84	I199
6425	Sant'Agata Feltria                                          	26	I201
6426	Sant'Agata li Battiati                                      	45	I202
6427	Santa Giuletta                                              	140	I203
6428	Santa Giusta                                                	47	I205
6429	Santa Giustina                                              	48	I206
6430	Santa Giustina in Colle                                     	80	I207
6431	Sant'Agnello                                                	71	I208
6432	Sant'Agostino                                               	21	I209
6433	Sant'Albano Stura                                           	211	I210
6434	Sant'Alessio con Vialone                                    	141	I213
6435	Sant'Alessio in Aspromonte                                  	80	I214
6436	Sant'Alessio Siculo                                         	85	I215
6437	Sant'Alfio                                                  	46	I216
6438	Santa Luce                                                  	34	I217
6439	Santa Lucia di Serino                                       	88	I219
6440	Santa Lucia del Mela                                        	86	I220
6441	Santa Lucia di Piave                                        	75	I221
6442	Santa Margherita di Belice                                  	38	I224
6443	Santa Margherita Ligure                                     	54	I225
6444	Santa Margherita d'Adige                                    	81	I226
6445	Santa Margherita di Staffora                                	142	I230
6446	Santa Maria a Monte                                         	35	I232
6447	Santa Maria a Vico                                          	82	I233
6448	Santa Maria Capua Vetere                                    	83	I234
6449	Travac• Siccomario                                          	162	I236
6450	Santa Maria della Versa                                     	143	I237
6451	Santa Maria del Molise                                      	45	I238
6452	Santa Maria di Licodia                                      	47	I240
6453	Santa Maria di Sala                                         	35	I242
6454	Santa Maria HoŠ                                             	74	I243
6455	Santa Maria Imbaro                                          	84	I244
6456	Santa Maria la Fossa                                        	84	I247
6457	Santa Maria la Longa                                        	104	I248
6458	Santa Maria Maggiore                                        	62	I249
6459	Santa Maria Nuova                                           	43	I251
6460	Santa Marina                                                	127	I253
6461	Santa Marina Salina                                         	87	I254
6462	Santa Marinella                                             	97	I255
6463	Sant'Ambrogio sul Garigliano                                	65	I256
6464	Sant'Ambrogio di Torino                                     	255	I258
6465	Sant'Ambrogio di Valpolicella                               	77	I259
6466	Santomenna                                                  	131	I260
6467	San Tammaro                                                 	85	I261
6468	Sant'Anastasia                                              	72	I262
6469	Sant'Anatolia di Narco                                      	45	I263
6470	Sant'Andrea di Conza                                        	89	I264
6471	Sant'Andrea del Garigliano                                  	66	I265
6472	Sant'Andrea Apostolo dello Ionio                            	118	I266
6473	Sant'Andrea Frius                                           	61	I271
6474	Sant'Angelo d'Alife                                         	86	I273
6475	Sant'Angelo Lodigiano                                       	50	I274
6476	Sant'Angelo di Piove di Sacco                               	82	I275
6477	Sant'Angelo Lomellina                                       	144	I276
6478	Sant'Angelo a Cupolo                                        	71	I277
6479	Sant'Angelo a Fasanella                                     	128	I278
6480	Sant'Angelo all'Esca                                        	90	I279
6481	Sant'Angelo a Scala                                         	91	I280
6482	Sant'Angelo dei Lombardi                                    	92	I281
6483	Sant'Angelo del Pesco                                       	46	I282
6484	Sant'Angelo di Brolo                                        	88	I283
6485	Sant'Angelo Romano                                          	98	I284
6486	Sant'Angelo in Pontano                                      	48	I286
6487	Sant'Angelo in Vado                                         	57	I287
6488	Sant'Angelo Le Fratte                                       	79	I288
6489	Sant'Angelo Limosano                                        	73	I289
6490	Sant'Angelo Muxaro                                          	39	I290
6491	Santa Ninfa                                                 	19	I291
6492	Sant'Anna d'Alfaedo                                         	78	I292
6493	Sant'Antimo                                                 	73	I293
6494	Sant'Antioco                                                	20	I294
6495	Sant'Antonino di Susa                                       	256	I296
6496	Villa Sant'Antonio                                          	48	I298
6497	Sant'Antonio Abate                                          	74	I300
6498	Santa Paolina                                               	93	I301
6499	Sant'Apollinare                                             	67	I302
6500	Santarcangelo di Romagna                                    	18	I304
6501	Sant'Arcangelo                                              	80	I305
6502	Sant'Arpino                                                 	87	I306
6503	Sant'Arsenio                                                	129	I307
6504	Santa Severina                                              	22	I308
6505	Santa Sofia d'Epiro                                         	133	I309
6506	Santa Sofia                                                 	43	I310
6507	Santa Teresa di Riva                                        	89	I311
6508	Santa Teresa Gallura                                        	22	I312
6509	Santa Venerina                                              	48	I314
6510	Santa Vittoria in Matenano                                  	36	I315
6511	Santa Vittoria d'Alba                                       	212	I316
6512	Sant'Egidio del Monte Albino                                	130	I317
6513	Sant'Egidio alla Vibrata                                    	38	I318
6514	Sant'Elena                                                  	83	I319
6515	Sant'Elia a Pianisi                                         	74	I320
6516	Sant'Elia Fiumerapido                                       	68	I321
6517	Vallefiorita                                                	151	I322
6518	Sant'Elpidio a Mare                                         	37	I324
6519	Sante Marie                                                 	89	I326
6520	Santena                                                     	257	I327
6521	San Teodoro                                                 	90	I328
6522	San Teodoro                                                 	23	I329
6523	Santeramo in Colle                                          	41	I330
6524	Sant'Eufemia a Maiella                                      	37	I332
6525	Sant'Eufemia d'Aspromonte                                   	81	I333
6526	Sant'Eusanio del Sangro                                     	85	I335
6527	Sant'Eusanio Forconese                                      	90	I336
6528	Santhi…                                                     	133	I337
6529	Santi Cosma e Damiano                                       	26	I339
6530	Sant'Ilario dello Ionio                                     	82	I341
6531	Sant'Ilario d'Enza                                          	39	I342
6532	Sant'Ippolito                                               	58	I344
6533	Zoldo Alto                                                  	68	I345
6534	Sant'Olcese                                                 	55	I346
6535	San Tomaso Agordino                                         	49	I347
6536	Sant'Omero                                                  	39	I348
6537	Sant'Onofrio                                                	36	I350
6538	Santopadre                                                  	69	I351
6539	Sant'Oreste                                                 	99	I352
6540	Santorso                                                    	95	I353
6541	Sant'Orsola Terme                                           	168	I354
6542	Santo Stefano Quisquina                                     	40	I356
6543	Santo Stefano del Sole                                      	95	I357
6544	Santo Stefano di Rogliano                                   	134	I359
6545	Santo Stefano di Sessanio                                   	91	I360
6546	Santo Stefano Ticino                                        	200	I361
6547	Santo Stefano Lodigiano                                     	51	I362
6548	Santo Stefano di Magra                                      	26	I363
6549	Villa Santo Stefano                                         	90	I364
6550	Santo Stefano al Mare                                       	56	I365
6551	Santo Stefano Belbo                                         	213	I367
6552	Santo Stefano d'Aveto                                       	56	I368
6553	Santo Stefano di Camastra                                   	91	I370
6554	Santo Stefano in Aspromonte                                 	83	I371
6555	Santo Stefano Roero                                         	214	I372
6556	San Stino di Livenza                                        	36	I373
6557	Santu Lussurgiu                                             	49	I374
6558	Sant'Urbano                                                 	84	I375
6559	San Valentino in Abruzzo Citeriore                          	38	I376
6560	San Valentino Torio                                         	132	I377
6561	San Venanzo                                                 	30	I381
6562	San Vendemiano                                              	76	I382
6563	San Vero Milis                                              	50	I384
6564	San Vincenzo La Costa                                       	135	I388
6565	San Vincenzo Valle Roveto                                   	92	I389
6566	San Vincenzo                                                	18	I390
6567	San Vitaliano                                               	75	I391
6568	San Vito di Cadore                                          	51	I392
6569	San Vito sullo Ionio                                        	122	I393
6570	San Vito Chietino                                           	86	I394
6571	San Vito dei Normanni                                       	17	I396
6572	San Vito Romano                                             	100	I400
6573	San Vito di Leguzzano                                       	96	I401
6574	San Vito                                                    	64	I402
6575	San Vito al Tagliamento                                     	41	I403
6576	San Vito al Torre                                           	105	I404
6577	San Vito di Fagagna                                         	106	I405
6578	San Vito Lo Capo                                            	20	I407
6579	San Vittore del Lazio                                       	70	I408
6580	San Vittore Olona                                           	201	I409
6581	Sanza                                                       	133	I410
6582	Sanzeno                                                     	169	I411
6583	San Zeno Naviglio                                           	173	I412
6584	San Zeno di Montagna                                        	79	I414
6585	San Zenone al Lambro                                        	202	I415
6586	San Zenone al Po                                            	145	I416
6587	San Zenone degli Ezzelini                                   	77	I417
6588	Saonara                                                     	85	I418
6589	Saponara                                                    	92	I420
6590	Sappada                                                     	52	I421
6591	Sapri                                                       	134	I422
6592	Saracena                                                    	136	I423
6593	Saracinesco                                                 	101	I424
6594	Sarcedo                                                     	97	I425
6595	Sarconi                                                     	81	I426
6596	Sardara                                                     	16	I428
6597	Sardigliano                                                 	157	I429
6598	Sarego                                                      	98	I430
6599	Sarentino                                                   	86	I431
6600	Sarezzano                                                   	158	I432
6601	Sarezzo                                                     	174	I433
6602	Sarmato                                                     	42	I434
6603	Sarmede                                                     	78	I435
6604	Sarnano                                                     	49	I436
6605	Sarnico                                                     	193	I437
6606	Sarno                                                       	135	I438
6607	Sarnonico                                                   	170	I439
6608	Saronno                                                     	119	I441
6609	Sarre                                                       	66	I442
6610	Sarroch                                                     	66	I443
6611	Sarsina                                                     	44	I444
6612	Sarteano                                                    	31	I445
6613	Sartirana Lomellina                                         	146	I447
6614	Sarule                                                      	77	I448
6615	Sarzana                                                     	27	I449
6616	Sassano                                                     	136	I451
6617	Sassari                                                     	64	I452
6618	Sassello                                                    	55	I453
6619	Sassetta                                                    	19	I454
6620	Sassinoro                                                   	72	I455
6621	Sasso di Castalda                                           	82	I457
6622	Sassocorvaro                                                	59	I459
6623	Sassofeltrio                                                	60	I460
6624	Sassoferrato                                                	44	I461
6625	Sassuolo                                                    	40	I462
6626	Satriano                                                    	123	I463
6627	Sauris                                                      	107	I464
6628	Sauze di Cesana                                             	258	I465
6629	Sauze d'Oulx                                                	259	I466
6630	Sava                                                        	26	I467
6631	Savelli                                                     	23	I468
6632	Saviano                                                     	76	I469
6633	Savigliano                                                  	215	I470
6634	Savignano Irpino                                            	96	I471
6635	Savignano sul Rubicone                                      	45	I472
6636	Savignano sul Panaro                                        	41	I473
6637	Savignone                                                   	57	I475
6638	Saviore dell'Adamello                                       	175	I476
6639	Savoca                                                      	93	I477
6640	Savogna                                                     	108	I478
6641	Savogna d'Isonzo                                            	22	I479
6642	Savona                                                      	56	I480
6643	Scafa                                                       	39	I482
6644	Scafati                                                     	137	I483
6645	Scagnello                                                   	216	I484
6646	Scala Coeli                                                 	137	I485
6647	Scala                                                       	138	I486
6648	Scaldasole                                                  	147	I487
6649	Scalea                                                      	138	I489
6650	Scalenghe                                                   	260	I490
6651	Scaletta Zanclea                                            	94	I492
6652	Scampitella                                                 	97	I493
6653	Scandale                                                    	24	I494
6654	Scandiano                                                   	40	I496
6655	Scandolara Ravara                                           	92	I497
6656	Scandolara Ripa d'Oglio                                     	93	I498
6657	Scandriglia                                                 	64	I499
6658	Scanno                                                      	93	I501
6659	Scano di Montiferro                                         	51	I503
6660	Scansano                                                    	23	I504
6661	Scanzorosciate                                              	194	I506
6662	Scapoli                                                     	48	I507
6663	Scarlino                                                    	24	I510
6664	Scarmagno                                                   	261	I511
6665	Scarnafigi                                                  	217	I512
6666	Scena                                                       	87	I519
6667	Scerni                                                      	87	I520
6668	Scheggia e Pascelupo                                        	46	I522
6669	Scheggino                                                   	47	I523
6670	Schiavi di Abruzzo                                          	88	I526
6671	Schiavon                                                    	99	I527
6672	Schignano                                                   	211	I529
6673	Schilpario                                                  	195	I530
6674	Schio                                                       	100	I531
6675	Schivenoglia                                                	60	I532
6676	Sciacca                                                     	41	I533
6677	Sciara                                                      	68	I534
6678	Scicli                                                      	11	I535
6679	Scido                                                       	84	I536
6680	Scilla                                                      	85	I537
6681	Scillato                                                    	81	I538
6682	Sciolze                                                     	262	I539
6683	Scisciano                                                   	77	I540
6684	Sclafani Bagni                                              	69	I541
6685	Scontrone                                                   	94	I543
6686	Scopa                                                       	134	I544
6687	Scopello                                                    	135	I545
6688	Scoppito                                                    	95	I546
6689	Scordia                                                     	49	I548
6690	Scorrano                                                    	73	I549
6691	ScorzŠ                                                      	37	I551
6692	Scurcola Marsicana                                          	96	I553
6693	Scurelle                                                    	171	I554
6694	Scurzolengo                                                 	103	I555
6695	Seborga                                                     	57	I556
6696	Secinaro                                                    	97	I558
6697	Secl�                                                       	74	I559
6698	Secugnago                                                   	52	I561
6699	Sedegliano                                                  	109	I562
6700	Sedico                                                      	53	I563
6701	Sedilo                                                      	52	I564
6702	Sedini                                                      	65	I565
6703	Sedriano                                                    	204	I566
6704	Sedrina                                                     	196	I567
6705	Sefro                                                       	50	I569
6706	Segariu                                                     	17	I570
6707	Seggiano                                                    	25	I571
6708	Segni                                                       	102	I573
6709	Segonzano                                                   	172	I576
6710	Segrate                                                     	205	I577
6711	Segusino                                                    	79	I578
6712	Selargius                                                   	68	I580
6713	Selci                                                       	65	I581
6714	Selegas                                                     	69	I582
6715	Sellano                                                     	48	I585
6716	Sellero                                                     	176	I588
6717	Sellia                                                      	126	I589
6718	Sellia Marina                                               	127	I590
6719	Selva di Val Gardena                                        	89	I591
6720	Selva di Cadore                                             	54	I592
6721	Selva dei Molini                                            	88	I593
6722	Selva di Progno                                             	80	I594
6723	Selvazzano Dentro                                           	86	I595
6724	Selve Marcone                                               	61	I596
6725	Selvino                                                     	197	I597
6726	Semestene                                                   	66	I598
6727	Semiana                                                     	148	I599
6728	Seminara                                                    	86	I600
6729	Semproniano                                                 	28	I601
6730	Senago                                                      	206	I602
6731	Senale-San Felice                                           	118	I603
6732	Senales                                                     	91	I604
6733	Seneghe                                                     	53	I605
6734	Senerchia                                                   	98	I606
6735	Seniga                                                      	177	I607
6736	Senigallia                                                  	45	I608
6737	Senis                                                       	54	I609
6738	Senise                                                      	85	I610
6739	Senna Comasco                                               	212	I611
6740	Senna Lodigiana                                             	53	I612
6741	Sennariolo                                                  	55	I613
6742	Sennori                                                     	67	I614
6743	Senorb�                                                     	70	I615
6744	Sepino                                                      	75	I618
6745	Seppiana                                                    	63	I619
6746	Sequals                                                     	42	I621
6747	Seravezza                                                   	28	I622
6748	Serdiana                                                    	71	I624
6749	Seregno                                                     	39	I625
6750	Seren del Grappa                                            	55	I626
6751	Sergnano                                                    	94	I627
6752	Seriate                                                     	198	I628
6753	Serina                                                      	199	I629
6754	Serino                                                      	99	I630
6755	Serle                                                       	178	I631
6756	Sermide                                                     	61	I632
6757	Sirmione                                                    	179	I633
6758	Sermoneta                                                   	27	I634
6759	Sernaglia della Battaglia                                   	80	I635
6760	Sernio                                                      	59	I636
6761	Serole                                                      	104	I637
6762	Serra San Bruno                                             	37	I639
6763	Serra Ricc•                                                 	58	I640
6764	Serracapriola                                               	53	I641
6765	Serra d'Aiello                                              	140	I642
6766	Serra de' Conti                                             	46	I643
6767	Serradifalco                                                	18	I644
6768	Serralunga di Crea                                          	159	I645
6769	Serralunga d'Alba                                           	218	I646
6770	Serramanna                                                  	18	I647
6771	Serramezzana                                                	139	I648
6772	Serramonacesca                                              	40	I649
6773	Serra Pedace                                                	141	I650
6774	Serrapetrona                                                	51	I651
6775	Serrara Fontana                                             	78	I652
6776	Serra San Quirico                                           	47	I653
6777	Serra Sant'Abbondio                                         	61	I654
6778	Serrastretta                                                	129	I655
6779	Serrata                                                     	87	I656
6780	Serravalle Scrivia                                          	160	I657
6781	Serravalle Langhe                                           	219	I659
6782	Serravalle Pistoiese                                        	20	I660
6783	Serravalle di Chienti                                       	52	I661
6784	Serravalle a Po                                             	62	I662
6785	Serravalle Sesia                                            	137	I663
6786	Serre                                                       	140	I666
6787	Serrenti                                                    	19	I667
6788	Serri                                                       	120	I668
6789	Serrone                                                     	71	I669
6790	Serrungarina                                                	62	I670
6791	Sersale                                                     	130	I671
6792	Sovramonte                                                  	58	I673
6793	Sessa Aurunca                                               	88	I676
6794	Sessa Cilento                                               	141	I677
6795	Sessame                                                     	105	I678
6796	Sessano del Molise                                          	49	I679
6797	Sestino                                                     	35	I681
6798	Sesto Campano                                               	50	I682
6799	Sesto ed Uniti                                              	95	I683
6800	Sesto Fiorentino                                            	43	I684
6801	Sesto al Reghena                                            	43	I686
6802	Sesto                                                       	92	I687
6803	Sesto Calende                                               	120	I688
6804	Sestola                                                     	43	I689
6805	Sesto San Giovanni                                          	209	I690
6806	Sestriere                                                   	263	I692
6807	Sestri Levante                                              	59	I693
6808	Sestu                                                       	74	I695
6809	Settala                                                     	210	I696
6810	Settefrati                                                  	72	I697
6811	Settime                                                     	106	I698
6812	Settimo San Pietro                                          	75	I699
6813	Settimo Milanese                                            	211	I700
6814	Settimo Rottaro                                             	264	I701
6815	Settimo Vittone                                             	266	I702
6816	Settimo Torinese                                            	265	I703
6817	Settingiano                                                 	131	I704
6818	Setzu                                                       	20	I705
6819	Seui                                                        	15	I706
6820	Seulo                                                       	121	I707
6821	Seveso                                                      	40	I709
6822	Sezzadio                                                    	161	I711
6823	Sezze                                                       	28	I712
6824	Sfruz                                                       	173	I714
6825	Sgonico                                                     	5	I715
6826	Sgurgola                                                    	73	I716
6827	Siamaggiore                                                 	56	I717
6828	Siamanna                                                    	57	I718
6829	Siano                                                       	142	I720
6830	Siapiccia                                                   	76	I721
6831	Siculiana                                                   	42	I723
6832	Siddi                                                       	21	I724
6833	Siderno                                                     	88	I725
6834	Siena                                                       	32	I726
6835	Sigillo                                                     	49	I727
6836	Signa                                                       	44	I728
6837	Silandro                                                    	93	I729
6838	Silanus                                                     	83	I730
6839	Siligo                                                      	68	I732
6840	Siliqua                                                     	78	I734
6841	Silius                                                      	79	I735
6842	Sillavengo                                                  	138	I736
6843	Sillano                                                     	29	I737
6844	Silvano d'Orba                                              	162	I738
6845	Silvano Pietra                                              	149	I739
6846	Silvi                                                       	40	I741
6847	Simala                                                      	58	I742
6848	Simaxis                                                     	59	I743
6849	Simbario                                                    	38	I744
6850	Simeri Crichi                                               	133	I745
6851	Sinagra                                                     	95	I747
6852	Sindia                                                      	84	I748
6853	Sini                                                        	60	I749
6854	Sinio                                                       	220	I750
6855	Siniscola                                                   	85	I751
6856	Sinnai                                                      	80	I752
6857	Sinopoli                                                    	89	I753
6858	Siracusa                                                    	17	I754
6859	Sirignano                                                   	100	I756
6860	Siris                                                       	61	I757
6861	Sirolo                                                      	48	I758
6862	Sirone                                                      	75	I759
6863	Siror                                                       	174	I760
6864	Sirtori                                                     	76	I761
6865	Siurgus Donigala                                            	81	I765
6866	Sizzano                                                     	139	I767
6867	Sluderno                                                    	94	I771
6868	Smarano                                                     	175	I772
6869	Smerillo                                                    	39	I774
6870	Soave                                                       	81	I775
6871	Socchieve                                                   	110	I777
6872	Sodd�                                                       	78	I778
6873	Sogliano al Rubicone                                        	46	I779
6874	Sogliano Cavour                                             	75	I780
6875	Soglio                                                      	107	I781
6876	Soiano del Lago                                             	180	I782
6877	Solagna                                                     	101	I783
6878	Solarino                                                    	18	I785
6879	Solaro                                                      	213	I786
6880	Solarolo                                                    	18	I787
6881	Solarolo Rainerio                                           	96	I790
6882	Solarussa                                                   	62	I791
6883	Solbiate                                                    	215	I792
6884	Solbiate Arno                                               	121	I793
6885	Solbiate Olona                                              	122	I794
6886	Soldano                                                     	58	I796
6887	Soleminis                                                   	82	I797
6888	Solero                                                      	163	I798
6889	Solesino                                                    	87	I799
6890	Soleto                                                      	76	I800
6891	Solferino                                                   	63	I801
6892	Soliera                                                     	44	I802
6893	Solignano                                                   	35	I803
6894	Sulmona                                                     	98	I804
6895	Solofra                                                     	101	I805
6896	Solonghello                                                 	164	I808
6897	Solopaca                                                    	73	I809
6898	Solto Collina                                               	200	I812
6899	Solza                                                       	251	I813
6900	Somaglia                                                    	54	I815
6901	Somano                                                      	221	I817
6902	Somma Lombardo                                              	123	I819
6903	Somma Vesuviana                                             	79	I820
6904	Sommacampagna                                               	82	I821
6905	Sommariva del Bosco                                         	222	I822
6906	Sommariva Perno                                             	223	I823
6907	Sommatino                                                   	19	I824
6908	Sommo                                                       	151	I825
6909	Sona                                                        	83	I826
6910	Soncino                                                     	97	I827
6911	Sondalo                                                     	60	I828
6912	Sondrio                                                     	61	I829
6913	Songavazzo                                                  	201	I830
6914	Sonico                                                      	181	I831
6915	Sonnino                                                     	29	I832
6916	Soprana                                                     	62	I835
6917	Sora                                                        	74	I838
6918	Soraga                                                      	176	I839
6919	Soragna                                                     	36	I840
6920	Sorano                                                      	26	I841
6921	Sorbo Serpico                                               	102	I843
6922	Sorbo San Basile                                            	134	I844
6923	Sorbolo                                                     	37	I845
6924	Sordevolo                                                   	63	I847
6925	Sordio                                                      	55	I848
6926	Soresina                                                    	98	I849
6927	Sorg…                                                       	84	I850
6928	Sorgono                                                     	86	I851
6929	Sori                                                        	60	I852
6930	Sorianello                                                  	39	I853
6931	Soriano Calabro                                             	40	I854
6932	Soriano nel Cimino                                          	48	I855
6933	Sorico                                                      	216	I856
6934	Soriso                                                      	140	I857
6935	Sorisole                                                    	202	I858
6936	Sormano                                                     	217	I860
6937	Sorradile                                                   	63	I861
6938	Sorrento                                                    	80	I862
6939	Sorso                                                       	69	I863
6940	Sortino                                                     	19	I864
6941	Sospiro                                                     	99	I865
6942	Sospirolo                                                   	56	I866
6943	Sossano                                                     	102	I867
6944	Sostegno                                                    	64	I868
6945	Sotto il Monte Giovanni XXIII                               	203	I869
6946	Sover                                                       	177	I871
6947	Soverato                                                    	137	I872
6948	Sovere                                                      	204	I873
6949	Soveria Mannelli                                            	138	I874
6950	Soveria Simeri                                              	139	I875
6951	Soverzene                                                   	57	I876
6952	Sovicille                                                   	34	I877
6953	Sovico                                                      	41	I878
6954	Sovizzo                                                     	103	I879
6955	Sozzago                                                     	141	I880
6956	Spadafora                                                   	96	I881
6957	Spadola                                                     	41	I884
6958	Sparanise                                                   	89	I885
6959	Sparone                                                     	267	I886
6960	Specchia                                                    	77	I887
6961	Spello                                                      	50	I888
6962	Spera                                                       	178	I889
6963	Sperlinga                                                   	17	I891
6964	Sperlonga                                                   	30	I892
6965	Sperone                                                     	103	I893
6966	Spessa                                                      	152	I894
6967	Spezzano Albanese                                           	142	I895
6968	Spezzano della Sila                                         	143	I896
6969	Spezzano Piccolo                                            	144	I898
6970	Spiazzo                                                     	179	I899
6971	Spigno Monferrato                                           	165	I901
6972	Spigno Saturnia                                             	31	I902
6973	Spilamberto                                                 	45	I903
6974	Spilimbergo                                                 	44	I904
6975	Spilinga                                                    	42	I905
6976	Spinadesco                                                  	100	I906
6977	Spinazzola                                                  	8	I907
6978	Spinea                                                      	38	I908
6979	Spineda                                                     	101	I909
6980	Spinete                                                     	76	I910
6981	Spineto Scrivia                                             	166	I911
6982	Spinetoli                                                   	71	I912
6983	Spino d'Adda                                                	102	I914
6984	Spinone al Lago                                             	205	I916
6985	Spinoso                                                     	86	I917
6986	Spirano                                                     	206	I919
6987	Spoleto                                                     	51	I921
6988	Spoltore                                                    	41	I922
6989	Spongano                                                    	78	I923
6990	Spormaggiore                                                	180	I924
6991	Sporminore                                                  	181	I925
6992	Spotorno                                                    	57	I926
6993	Spresiano                                                   	82	I927
6994	Spriana                                                     	62	I928
6995	Squillace                                                   	142	I929
6996	Squinzano                                                   	79	I930
6997	Staffolo                                                    	49	I932
6998	Stagno Lombardo                                             	103	I935
6999	Staiti                                                      	90	I936
7000	Stalett�                                                    	143	I937
7001	Stanghella                                                  	88	I938
7002	Staranzano                                                  	23	I939
7003	Stazzano                                                    	167	I941
7004	Stazzema                                                    	30	I942
7005	Stazzona                                                    	218	I943
7006	Stefanaconi                                                 	43	I945
7007	Stella                                                      	58	I946
7008	Stellanello                                                 	59	I947
7009	Stelvio                                                     	95	I948
7010	Stenico                                                     	182	I949
7011	Sternatia                                                   	80	I950
7012	Stezzano                                                    	207	I951
7013	Stienta                                                     	45	I953
7014	Stigliano                                                   	27	I954
7015	Stignano                                                    	91	I955
7016	Stilo                                                       	92	I956
7017	Stimigliano                                                 	66	I959
7018	Stio                                                        	145	I960
7019	Stornara                                                    	54	I962
7020	Stornarella                                                 	55	I963
7021	Storo                                                       	183	I964
7022	Stra                                                        	39	I965
7023	Stradella                                                   	153	I968
7024	Strambinello                                                	268	I969
7025	Strambino                                                   	269	I970
7026	Strangolagalli                                              	75	I973
7027	Stregna                                                     	111	I974
7028	Strembo                                                     	184	I975
7029	Stresa                                                      	64	I976
7030	Strevi                                                      	168	I977
7031	Striano                                                     	81	I978
7032	Strigno                                                     	185	I979
7033	Strona                                                      	65	I980
7034	Stroncone                                                   	31	I981
7035	Strongoli                                                   	25	I982
7036	Stroppiana                                                  	142	I984
7037	Stroppo                                                     	224	I985
7038	Strozza                                                     	208	I986
7039	Sturno                                                      	104	I990
7040	Subbiano                                                    	37	I991
7041	Subiaco                                                     	103	I992
7042	Succivo                                                     	90	I993
7043	Sueglio                                                     	77	I994
7044	Suelli                                                      	83	I995
7045	Suello                                                      	78	I996
7046	Suisio                                                      	209	I997
7047	Sulbiate                                                    	42	I998
7048	Sulzano                                                     	182	L002
7049	Sumirago                                                    	124	L003
7050	Summonte                                                    	105	L004
7051	Suni                                                        	87	L006
7052	Suno                                                        	143	L007
7053	Supersano                                                   	81	L008
7054	Supino                                                      	76	L009
7055	Surano                                                      	82	L010
7056	Surbo                                                       	83	L011
7057	Susa                                                        	270	L013
7058	Susegana                                                    	83	L014
7059	Sustinente                                                  	64	L015
7060	Sutera                                                      	20	L016
7061	Sutri                                                       	49	L017
7062	Sutrio                                                      	112	L018
7063	Suvereto                                                    	20	L019
7064	Suzzara                                                     	65	L020
7065	Taceno                                                      	79	L022
7066	Tadasuni                                                    	64	L023
7067	Taggia                                                      	59	L024
7068	Tagliacozzo                                                 	99	L025
7069	Taglio di Po                                                	46	L026
7070	Tagliolo Monferrato                                         	169	L027
7071	Taibon Agordino                                             	59	L030
7072	Taino                                                       	125	L032
7073	Taio                                                        	186	L033
7074	Talamello                                                   	27	L034
7075	Talamona                                                    	63	L035
7076	Talana                                                      	16	L036
7077	Taleggio                                                    	210	L037
7078	Talla                                                       	38	L038
7079	Talmassons                                                  	114	L039
7080	Tambre                                                      	60	L040
7081	Taormina                                                    	97	L042
7082	Tarano                                                      	67	L046
7083	Taranta Peligna                                             	89	L047
7084	Tarantasca                                                  	225	L048
7085	Taranto                                                     	27	L049
7086	Tarcento                                                    	116	L050
7087	Tarsia                                                      	145	L055
7088	Tartano                                                     	64	L056
7089	Tarvisio                                                    	117	L057
7090	Tarzo                                                       	84	L058
7091	Tassarolo                                                   	170	L059
7092	Tassullo                                                    	187	L060
7093	Taurano                                                     	106	L061
7094	Taurasi                                                     	107	L062
7095	Taurianova                                                  	93	L063
7096	Taurisano                                                   	84	L064
7097	Tavagnacco                                                  	118	L065
7098	Tavagnasco                                                  	271	L066
7099	Tavarnelle Val di Pesa                                      	45	L067
7100	Tavenna                                                     	77	L069
7101	Taverna                                                     	146	L070
7102	Tavernerio                                                  	222	L071
7103	Tavernola Bergamasca                                        	211	L073
7104	Taviano                                                     	85	L074
7105	Tavigliano                                                  	66	L075
7106	Tavoleto                                                    	64	L078
7107	Tavullia                                                    	65	L081
7108	Teana                                                       	87	L082
7109	Teano                                                       	91	L083
7110	Teglio                                                      	65	L084
7111	Teglio Veneto                                               	40	L085
7112	Telese Terme                                                	74	L086
7113	Telgate                                                     	212	L087
7114	Telti                                                       	24	L088
7115	Telve                                                       	188	L089
7116	Telve di Sopra                                              	189	L090
7117	Tempio Pausania                                             	25	L093
7118	Tem—                                                        	184	L094
7119	Tenna                                                       	190	L096
7120	Tenno                                                       	191	L097
7121	Teolo                                                       	89	L100
7122	Teora                                                       	108	L102
7123	Teramo                                                      	41	L103
7124	Terdobbiate                                                 	144	L104
7125	Terelle                                                     	77	L105
7126	Terento                                                     	96	L106
7127	Terlago                                                     	192	L107
7128	Terlano                                                     	97	L108
7129	Terlizzi                                                    	43	L109
7130	Termeno sulla strada del vino                               	98	L111
7131	Termini Imerese                                             	70	L112
7132	Termoli                                                     	78	L113
7133	Ternate                                                     	126	L115
7134	Ternengo                                                    	67	L116
7135	Terni                                                       	32	L117
7136	Terno d'Isola                                               	213	L118
7137	Terracina                                                   	32	L120
7138	Terragnolo                                                  	193	L121
7139	Terralba                                                    	65	L122
7140	Terranuova Bracciolini                                      	39	L123
7141	Terranova da Sibari                                         	146	L124
7142	Terranova dei Passerini                                     	57	L125
7143	Terranova di Pollino                                        	88	L126
7144	Terranova Sappo Minulio                                     	94	L127
7145	Terrasini                                                   	71	L131
7146	Terrassa Padovana                                           	90	L132
7147	Terravecchia                                                	147	L134
7148	Terrazzo                                                    	85	L136
7149	Terres                                                      	194	L137
7150	Terricciola                                                 	36	L138
7151	Terruggia                                                   	171	L139
7152	Tertenia                                                    	17	L140
7153	Terzigno                                                    	82	L142
7154	Terzo                                                       	172	L143
7155	Terzo d'Aquileia                                            	120	L144
7156	Terzolas                                                    	195	L145
7157	Terzorio                                                    	60	L146
7158	Tesero                                                      	196	L147
7159	Tesimo                                                      	99	L149
7160	Tessennano                                                  	51	L150
7161	Testico                                                     	60	L152
7162	Teti                                                        	90	L153
7163	Teulada                                                     	84	L154
7164	Teverola                                                    	92	L155
7165	Tezze sul Brenta                                            	104	L156
7166	Thiene                                                      	105	L157
7167	Thiesi                                                      	71	L158
7168	Tiana                                                       	91	L160
7169	Ticengo                                                     	104	L164
7170	Ticineto                                                    	173	L165
7171	Tiggiano                                                    	86	L166
7172	Tiglieto                                                    	61	L167
7173	Tigliole                                                    	108	L168
7174	Tignale                                                     	185	L169
7175	Tinnura                                                     	88	L172
7176	Tione degli Abruzzi                                         	100	L173
7177	Tione di Trento                                             	199	L174
7178	Tirano                                                      	66	L175
7179	Tires                                                       	100	L176
7180	Tiriolo                                                     	147	L177
7181	Tirolo                                                      	101	L178
7182	Tissi                                                       	72	L180
7183	Tito                                                        	89	L181
7184	Tivoli                                                      	104	L182
7185	Tizzano Val Parma                                           	39	L183
7186	Toano                                                       	41	L184
7187	Tocco Caudio                                                	75	L185
7188	Tocco da Casauria                                           	42	L186
7189	Toceno                                                      	65	L187
7190	Todi                                                        	52	L188
7191	Toffia                                                      	68	L189
7192	Toirano                                                     	61	L190
7193	Tolentino                                                   	53	L191
7194	Tolfa                                                       	105	L192
7195	Tollegno                                                    	68	L193
7196	Tollo                                                       	90	L194
7197	Tolmezzo                                                    	121	L195
7198	Tolve                                                       	90	L197
7199	Tombolo                                                     	91	L199
7200	Ton                                                         	200	L200
7201	Tonadico                                                    	201	L201
7202	Tonara                                                      	93	L202
7203	Tonco                                                       	109	L203
7204	Tonengo                                                     	110	L204
7205	Tora e Piccilli                                             	93	L205
7206	Torano Castello                                             	148	L206
7207	Torano Nuovo                                                	42	L207
7208	Torbole Casaglia                                            	186	L210
7209	Torcegno                                                    	202	L211
7210	Torchiara                                                   	147	L212
7211	Torchiarolo                                                 	18	L213
7212	Torella dei Lombardi                                        	109	L214
7213	Torella del Sannio                                          	79	L215
7214	Torgiano                                                    	53	L216
7215	Torgnon                                                     	67	L217
7216	Torino di Sangro                                            	91	L218
7217	Torino                                                      	272	L219
7218	Toritto                                                     	44	L220
7219	Torlino Vimercati                                           	105	L221
7220	Tornaco                                                     	146	L223
7221	Tornareccio                                                 	92	L224
7222	Tornata                                                     	106	L225
7223	Tornimparte                                                 	101	L227
7224	Torno                                                       	223	L228
7225	Tornolo                                                     	40	L229
7226	Toro                                                        	80	L230
7227	TorpŠ                                                       	94	L231
7228	Torraca                                                     	148	L233
7229	Torralba                                                    	73	L235
7230	Torrazza Coste                                              	155	L237
7231	Torrazza Piemonte                                           	273	L238
7232	Torrazzo                                                    	69	L239
7233	Torre di Ruggiero                                           	148	L240
7234	Torre Mondov�                                               	227	L241
7235	Torre Cajetani                                              	78	L243
7236	Torre di Santa Maria                                        	67	L244
7237	Torre Annunziata                                            	83	L245
7238	Torreano                                                    	122	L246
7239	Torre Canavese                                              	274	L247
7240	Torrebelvicino                                              	107	L248
7241	Torre Beretti e Castellaro                                  	156	L250
7242	Torre Boldone                                               	214	L251
7243	Torre Bormida                                               	226	L252
7244	Torrebruna                                                  	93	L253
7245	Torrecuso                                                   	76	L254
7246	Torre d'Arese                                               	157	L256
7247	Torre de' Busi                                              	80	L257
7248	Torre de' Picenardi                                         	107	L258
7249	Torre del Greco                                             	84	L259
7250	Torre de' Negri                                             	158	L262
7251	Torre de' Passeri                                           	43	L263
7252	Torre de' Roveri                                            	216	L265
7253	Torre di Mosto                                              	41	L267
7254	Torre d'Isola                                               	159	L269
7255	Torreglia                                                   	92	L270
7256	Torregrotta                                                 	98	L271
7257	Torre Le Nocelle                                            	110	L272
7258	Torremaggiore                                               	56	L273
7259	Torre Orsaia                                                	149	L274
7260	Torre Pallavicina                                           	217	L276
7261	Torre Pellice                                               	275	L277
7262	Torre San Giorgio                                           	228	L278
7263	Torre San Patrizio                                          	40	L279
7264	Torre Santa Susanna                                         	19	L280
7265	Torresina                                                   	229	L281
7266	Torretta                                                    	72	L282
7267	Torrevecchia Teatina                                        	94	L284
7268	Torrevecchia Pia                                            	160	L285
7269	Torri in Sabina                                             	70	L286
7270	Torri del Benaco                                            	86	L287
7271	Torrice                                                     	79	L290
7272	Torricella Peligna                                          	95	L291
7273	Torricella Verzate                                          	161	L292
7274	Torricella in Sabina                                        	69	L293
7275	Torricella                                                  	28	L294
7276	Torricella Sicura                                           	43	L295
7277	Torricella del Pizzo                                        	108	L296
7278	Torri di Quartesolo                                         	108	L297
7279	Torriglia                                                   	62	L298
7280	Torrile                                                     	41	L299
7281	Torrioni                                                    	111	L301
7282	Torrita Tiberina                                            	106	L302
7283	Torrita di Siena                                            	35	L303
7284	Tortona                                                     	174	L304
7285	Tortora                                                     	149	L305
7286	Tortorella                                                  	150	L306
7287	Tortoreto                                                   	44	L307
7288	Tortorici                                                   	99	L308
7289	Torviscosa                                                  	123	L309
7290	Tuscania                                                    	52	L310
7291	Toscolano-Maderno                                           	187	L312
7292	Tossicia                                                    	45	L314
7293	Tovo San Giacomo                                            	62	L315
7294	Tovo di Sant'Agata                                          	68	L316
7295	Trabia                                                      	73	L317
7296	Tradate                                                     	127	L319
7297	Tramatza                                                    	66	L321
7298	Trambileno                                                  	203	L322
7299	Tramonti                                                    	151	L323
7300	Tramonti di Sopra                                           	45	L324
7301	Tramonti di Sotto                                           	46	L325
7302	Tramutola                                                   	91	L326
7303	Trana                                                       	276	L327
7304	Trani                                                       	9	L328
7305	Transacqua                                                  	204	L329
7306	Traona                                                      	69	L330
7307	Trapani                                                     	21	L331
7308	Trappeto                                                    	74	L332
7309	Trarego Viggiona                                            	66	L333
7310	Trasacco                                                    	102	L334
7311	Trasaghis                                                   	124	L335
7312	Trasquera                                                   	67	L336
7313	Tratalias                                                   	21	L337
7314	Trausella                                                   	277	L338
7315	Travagliato                                                 	188	L339
7316	Traves                                                      	279	L340
7317	Travedona-Monate                                            	128	L342
7318	Traversella                                                 	278	L345
7319	Traversetolo                                                	42	L346
7320	Travesio                                                    	47	L347
7321	Travo                                                       	43	L348
7322	Trebaseleghe                                                	93	L349
7323	Trebisacce                                                  	150	L353
7324	Trecastagni                                                 	50	L355
7325	Trecate                                                     	149	L356
7326	Trecchina                                                   	92	L357
7327	Trecenta                                                    	47	L359
7328	Tredozio                                                    	49	L361
7329	Treglio                                                     	96	L363
7330	Tregnago                                                    	87	L364
7331	Treia                                                       	54	L366
7332	Treiso                                                      	230	L367
7333	Tremenico                                                   	81	L368
7334	Tremestieri Etneo                                           	51	L369
7335	Tremosine sul Garda                                         	189	L372
7336	Trenta                                                      	151	L375
7337	Trentinara                                                  	152	L377
7338	Trento                                                      	205	L378
7339	Trentola-Ducenta                                            	94	L379
7340	Trenzano                                                    	190	L380
7341	Treppo Carnico                                              	125	L381
7342	Treppo Grande                                               	126	L382
7343	Trepuzzi                                                    	87	L383
7344	Trequanda                                                   	36	L384
7345	Tres                                                        	206	L385
7346	Tresana                                                     	15	L386
7347	Trescore Balneario                                          	218	L388
7348	Trescore Cremasco                                           	109	L389
7349	Tresigallo                                                  	24	L390
7350	Tresivio                                                    	70	L392
7351	Tresnuraghes                                                	67	L393
7352	Trevenzuolo                                                 	88	L396
7353	Trevi                                                       	54	L397
7354	Trevi nel Lazio                                             	80	L398
7355	Trevico                                                     	112	L399
7356	Treviglio                                                   	219	L400
7357	Trevignano Romano                                           	107	L401
7358	Trevignano                                                  	85	L402
7359	Treville                                                    	175	L403
7360	Treviolo                                                    	220	L404
7361	Treviso Bresciano                                           	191	L406
7362	Treviso                                                     	86	L407
7363	Trezzano Rosa                                               	219	L408
7364	Trezzano sul Naviglio                                       	220	L409
7365	Trezzo Tinella                                              	231	L410
7366	Trezzo sull'Adda                                            	221	L411
7367	Trezzone                                                    	226	L413
7368	Tribano                                                     	94	L414
7369	Tribiano                                                    	222	L415
7370	Tribogna                                                    	63	L416
7371	Tricarico                                                   	28	L418
7372	Tricase                                                     	88	L419
7373	Tricerro                                                    	147	L420
7374	Tricesimo                                                   	127	L421
7375	Trichiana                                                   	61	L422
7376	Triei                                                       	19	L423
7377	Trieste                                                     	6	L424
7378	Triggiano                                                   	46	L425
7379	Trigolo                                                     	110	L426
7380	Trinit…                                                     	232	L427
7381	Trinit… d'Agultu e Vignola                                  	26	L428
7382	Trino                                                       	148	L429
7383	Triora                                                      	61	L430
7384	Tripi                                                       	100	L431
7385	Trisobbio                                                   	176	L432
7386	Trissino                                                    	110	L433
7387	Triuggio                                                    	43	L434
7388	Trivento                                                    	81	L435
7389	Trivero                                                     	70	L436
7390	Trivigliano                                                 	81	L437
7391	Trivignano Udinese                                          	128	L438
7392	Trivigno                                                    	93	L439
7393	Trivolzio                                                   	163	L440
7394	Trodena nel parco naturale                                  	102	L444
7395	Trofarello                                                  	280	L445
7396	Troia                                                       	58	L447
7397	Troina                                                      	18	L448
7398	Tromello                                                    	164	L449
7399	Trontano                                                    	68	L450
7400	Tronzano Vercellese                                         	150	L451
7401	Tropea                                                      	44	L452
7402	Trovo                                                       	165	L453
7403	Truccazzano                                                 	224	L454
7404	Tubre                                                       	103	L455
7405	Tuenno                                                      	207	L457
7406	Tufara                                                      	82	L458
7407	Tufillo                                                     	97	L459
7408	Tufino                                                      	85	L460
7409	Tufo                                                        	113	L461
7410	Tuglie                                                      	89	L462
7411	Tuili                                                       	22	L463
7412	Tula                                                        	75	L464
7413	Tuoro sul Trasimeno                                         	55	L466
7414	Valvestino                                                  	194	L468
7415	Turano Lodigiano                                            	58	L469
7416	Turate                                                      	227	L470
7417	Turbigo                                                     	226	L471
7418	Turi                                                        	47	L472
7419	Turri                                                       	23	L473
7420	Turriaco                                                    	24	L474
7421	Turrivalignani                                              	44	L475
7422	Tursi                                                       	29	L477
7423	Tusa                                                        	101	L478
7424	Uboldo                                                      	130	L480
7425	Ucria                                                       	102	L482
7426	Udine                                                       	129	L483
7427	Ugento                                                      	90	L484
7428	Uggiano la Chiesa                                           	91	L485
7429	Uggiate-Trevano                                             	228	L487
7430	Ul… Tirso                                                   	68	L488
7431	Ulassai                                                     	20	L489
7432	Ultimo                                                      	104	L490
7433	Umbriatico                                                  	26	L492
7434	Urago d'Oglio                                               	192	L494
7435	Uras                                                        	69	L496
7436	Urbana                                                      	95	L497
7437	Urbania                                                     	66	L498
7438	Urbe                                                        	63	L499
7439	Urbino                                                      	67	L500
7440	Urbisaglia                                                  	55	L501
7441	Urgnano                                                     	222	L502
7442	Uri                                                         	76	L503
7443	Ururi                                                       	83	L505
7444	Urzulei                                                     	21	L506
7445	Uscio                                                       	64	L507
7446	Usellus                                                     	70	L508
7447	Usini                                                       	77	L509
7448	Usmate Velate                                               	44	L511
7449	Ussana                                                      	88	L512
7450	Ussaramanna                                                 	24	L513
7451	Ussassai                                                    	22	L514
7452	Usseaux                                                     	281	L515
7453	Usseglio                                                    	282	L516
7454	Ussita                                                      	56	L517
7455	Ustica                                                      	75	L519
7456	Uta                                                         	90	L521
7457	Uzzano                                                      	21	L522
7458	Vaccarizzo Albanese                                         	152	L524
7459	Vacone                                                      	72	L525
7460	Vacri                                                       	98	L526
7461	Vadena                                                      	105	L527
7462	Vado Ligure                                                 	64	L528
7463	Vaglia                                                      	46	L529
7464	Vaglio Serra                                                	111	L531
7465	Vaglio Basilicata                                           	94	L532
7466	Vagli Sotto                                                 	31	L533
7467	Vaiano Cremasco                                             	111	L535
7468	Vaiano                                                      	6	L537
7469	Vaie                                                        	283	L538
7470	Vailate                                                     	112	L539
7471	Vairano Patenora                                            	95	L540
7472	Valbondione                                                 	223	L544
7473	Valbrembo                                                   	224	L545
7474	Valbrevenna                                                 	65	L546
7475	Valbrona                                                    	229	L547
7476	Vico Canavese                                               	297	L548
7477	Valda                                                       	208	L550
7478	Valdagno                                                    	111	L551
7479	Valdaora                                                    	106	L552
7480	Valdastico                                                  	112	L554
7481	Val della Torre                                             	284	L555
7482	Valdengo                                                    	71	L556
7483	Valdidentro                                                 	71	L557
7484	Valdieri                                                    	233	L558
7485	Valdina                                                     	103	L561
7486	Val di Nizza                                                	166	L562
7487	Valdisotto                                                  	72	L563
7488	Val di Vizze                                                	107	L564
7489	Valdobbiadene                                               	87	L565
7490	Valduggia                                                   	152	L566
7491	Valeggio sul Mincio                                         	89	L567
7492	Valeggio                                                    	167	L568
7493	Valentano                                                   	53	L569
7494	Valenza                                                     	177	L570
7495	Valenzano                                                   	48	L571
7496	Valera Fratta                                               	59	L572
7497	Valfabbrica                                                 	57	L573
7498	Valfenera                                                   	112	L574
7499	Valfloriana                                                 	209	L575
7500	Valfurva                                                    	73	L576
7501	Valganna                                                    	131	L577
7502	Valgioie                                                    	285	L578
7503	Valgoglio                                                   	225	L579
7504	Valgrana                                                    	234	L580
7505	Valgreghentino                                              	82	L581
7506	Valgrisenche                                                	68	L582
7507	Valguarnera Caropepe                                        	19	L583
7508	Vallada Agordina                                            	62	L584
7509	Vallanzengo                                                 	72	L586
7510	Vallarsa                                                    	210	L588
7511	Vallata                                                     	114	L589
7512	Valle di Cadore                                             	63	L590
7513	Valle di Maddaloni                                          	97	L591
7514	Valle Lomellina                                             	168	L593
7515	Valle Agricola                                              	96	L594
7516	Valle Aurina                                                	108	L595
7517	Vallebona                                                   	62	L596
7518	Valle Castellana                                            	46	L597
7519	Vallecorsa                                                  	82	L598
7520	Vallecrosia                                                 	63	L599
7521	Valle di Casies                                             	109	L601
7522	Valledolmo                                                  	76	L603
7523	Valledoria                                                  	79	L604
7524	Vallemaio                                                   	83	L605
7525	Valle Mosso                                                 	73	L606
7526	Vallelonga                                                  	45	L607
7527	Vallelunga Pratameno                                        	21	L609
7528	Vallepietra                                                 	108	L611
7529	Vallerano                                                   	54	L612
7530	Vallermosa                                                  	91	L613
7531	Vallerotonda                                                	84	L614
7532	Vallesaccarda                                               	115	L616
7533	Valle Salimbene                                             	169	L617
7534	Valle San Nicolao                                           	74	L620
7535	Valleve                                                     	226	L623
7536	Valli del Pasubio                                           	113	L624
7537	Vallinfreda                                                 	109	L625
7538	Vallio Terme                                                	193	L626
7539	Vallo di Nera                                               	58	L627
7540	Vallo della Lucania                                         	154	L628
7541	Vallo Torinese                                              	286	L629
7542	Valloriate                                                  	235	L631
7543	Valmacca                                                    	178	L633
7544	Valmadrera                                                  	83	L634
7545	Valmala                                                     	236	L636
7546	Val Masino                                                  	74	L638
7547	Valmontone                                                  	110	L639
7548	Valmorea                                                    	232	L640
7549	Valmozzola                                                  	44	L641
7550	Valnegra                                                    	227	L642
7551	Valpelline                                                  	69	L643
7552	Valperga                                                    	287	L644
7553	Valsavarenche                                               	70	L647
7554	Valstagna                                                   	114	L650
7555	Valstrona                                                   	69	L651
7556	Valtopina                                                   	59	L653
7557	Valtournenche                                               	71	L654
7558	Valtorta                                                    	229	L655
7559	Valva                                                       	155	L656
7560	Valvasone                                                   	48	L657
7561	Valverde                                                    	52	L658
7562	Valverde                                                    	170	L659
7563	Vandoies                                                    	110	L660
7564	Vanzaghello                                                 	249	L664
7565	Vanzago                                                     	229	L665
7566	Vanzone con San Carlo                                       	70	L666
7567	Vaprio d'Adda                                               	230	L667
7568	Vaprio d'Agogna                                             	153	L668
7569	Varallo                                                     	156	L669
7570	Varallo Pombia                                              	154	L670
7571	Varano Borghi                                               	132	L671
7572	Varano de' Melegari                                         	45	L672
7573	Varapodio                                                   	95	L673
7574	Varazze                                                     	65	L675
7575	Varco Sabino                                                	73	L676
7576	Varedo                                                      	45	L677
7577	Varena                                                      	211	L678
7578	Varenna                                                     	84	L680
7579	Varese Ligure                                               	29	L681
7580	Varese                                                      	133	L682
7581	Varisella                                                   	289	L685
7582	Varmo                                                       	130	L686
7583	Varna                                                       	111	L687
7584	Varsi                                                       	46	L689
7585	Varzi                                                       	171	L690
7586	Varzo                                                       	71	L691
7587	Vasia                                                       	64	L693
7588	Vastogirardi                                                	51	L696
7589	Vattaro                                                     	212	L697
7590	Vauda Canavese                                              	290	L698
7591	Vazzano                                                     	46	L699
7592	Vazzola                                                     	88	L700
7593	Vecchiano                                                   	37	L702
7594	Vedano Olona                                                	134	L703
7595	Vedano al Lambro                                            	46	L704
7596	Vedelago                                                    	89	L706
7597	Vedeseta                                                    	230	L707
7598	Veduggio con Colzano                                        	47	L709
7599	Veggiano                                                    	96	L710
7600	Veglie                                                      	92	L711
7601	Veglio                                                      	75	L712
7602	Vejano                                                      	56	L713
7603	Veleso                                                      	236	L715
7604	Velezzo Lomellina                                           	172	L716
7605	Velletri                                                    	111	L719
7606	Vellezzo Bellini                                            	173	L720
7607	Velo Veronese                                               	90	L722
7608	Velo d'Astico                                               	115	L723
7609	Velturno                                                    	116	L724
7610	Venafro                                                     	52	L725
7611	Venaus                                                      	291	L726
7612	Venaria Reale                                               	292	L727
7613	Venarotta                                                   	73	L728
7614	Venasca                                                     	237	L729
7615	Vendone                                                     	66	L730
7616	Vendrogno                                                   	85	L731
7617	Venegono Inferiore                                          	136	L733
7618	Venegono Superiore                                          	137	L734
7619	Venetico                                                    	104	L735
7620	Venezia                                                     	42	L736
7621	Veniano                                                     	238	L737
7622	Venosa                                                      	95	L738
7623	Venticano                                                   	116	L739
7624	Ventimiglia di Sicilia                                      	77	L740
7625	Ventimiglia                                                 	65	L741
7626	Ventotene                                                   	33	L742
7627	Venzone                                                     	131	L743
7628	Verano Brianza                                              	48	L744
7629	Verano                                                      	112	L745
7630	Verbania                                                    	72	L746
7631	Verbicaro                                                   	153	L747
7632	Vercana                                                     	239	L748
7633	Verceia                                                     	75	L749
7634	Vercelli                                                    	158	L750
7635	Vercurago                                                   	86	L751
7636	Verdellino                                                  	232	L752
7637	Verdello                                                    	233	L753
7638	Verduno                                                     	238	L758
7639	Vergato                                                     	59	L762
7640	Verghereto                                                  	50	L764
7641	Vergiate                                                    	138	L765
7642	Vermezzo                                                    	235	L768
7643	Vermiglio                                                   	213	L769
7644	Vernante                                                    	239	L771
7645	Vernasca                                                    	44	L772
7646	Vernate                                                     	236	L773
7647	Vernazza                                                    	30	L774
7648	Vernio                                                      	7	L775
7649	Vernole                                                     	93	L776
7650	Verolanuova                                                 	195	L777
7651	Verolavecchia                                               	196	L778
7652	Verolengo                                                   	293	L779
7653	Veroli                                                      	85	L780
7654	Verona                                                      	91	L781
7655	Verrayes                                                    	72	L783
7656	Verretto                                                    	174	L784
7657	Verrone                                                     	76	L785
7658	Verrua Savoia                                               	294	L787
7659	Verrua Po                                                   	175	L788
7660	Vertemate con Minoprio                                      	242	L792
7661	Vertova                                                     	234	L795
7662	Verucchio                                                   	20	L797
7663	Veruno                                                      	157	L798
7664	Vervio                                                      	76	L799
7665	Verv•                                                       	214	L800
7666	Verzegnis                                                   	132	L801
7667	Verzino                                                     	27	L802
7668	Verzuolo                                                    	240	L804
7669	Vescovana                                                   	97	L805
7670	Vescovato                                                   	113	L806
7671	Vesime                                                      	113	L807
7672	Vespolate                                                   	158	L808
7673	Vessalico                                                   	66	L809
7674	Vestenanova                                                 	93	L810
7675	VestignŠ                                                    	295	L811
7676	Vestone                                                     	197	L812
7677	Vestreno                                                    	89	L813
7678	Vetralla                                                    	57	L814
7679	Vetto                                                       	42	L815
7680	Vezza d'Oglio                                               	198	L816
7681	Vezza d'Alba                                                	241	L817
7682	Vezzano Ligure                                              	31	L819
7683	Vezzano sul Crostolo                                        	43	L820
7684	Vezzano                                                     	215	L821
7685	Vezzi Portio                                                	67	L823
7686	Viadana                                                     	66	L826
7687	Viadanica                                                   	235	L827
7688	Viagrande                                                   	53	L828
7689	Viale                                                       	114	L829
7690	VialfrŠ                                                     	296	L830
7691	Viano                                                       	44	L831
7692	Viareggio                                                   	33	L833
7693	Viarigi                                                     	115	L834
7694	Vibonati                                                    	156	L835
7695	Vicalvi                                                     	86	L836
7696	Vicari                                                      	78	L837
7697	Vicchio                                                     	49	L838
7698	Vicenza                                                     	116	L840
7699	Vicoforte                                                   	242	L841
7700	Vico del Gargano                                            	59	L842
7701	Vico nel Lazio                                              	87	L843
7702	Villa Literno                                               	99	L844
7703	Vico Equense                                                	86	L845
7704	Vicoli                                                      	45	L846
7705	Vicolungo                                                   	159	L847
7706	Ziano Piacentino                                            	48	L848
7707	Vicopisano                                                  	38	L850
7708	Vicovaro                                                    	112	L851
7709	Vidigulfo                                                   	176	L854
7710	Vidor                                                       	90	L856
7711	Vidracco                                                    	298	L857
7712	Vieste                                                      	60	L858
7713	Vietri di Potenza                                           	96	L859
7714	Vietri sul Mare                                             	157	L860
7715	Viganella                                                   	73	L864
7716	Vigano San Martino                                          	236	L865
7717	Vigan•                                                      	90	L866
7718	Vigarano Mainarda                                           	22	L868
7719	Vigasio                                                     	94	L869
7720	Vigevano                                                    	177	L872
7721	Viggianello                                                 	97	L873
7722	Viggiano                                                    	98	L874
7723	Viggi—                                                      	139	L876
7724	Vighizzolo d'Este                                           	98	L878
7725	Vigliano d'Asti                                             	116	L879
7726	Vigliano Biellese                                           	77	L880
7727	Vignale Monferrato                                          	179	L881
7728	Vignanello                                                  	58	L882
7729	Vignate                                                     	237	L883
7730	Vignola                                                     	46	L885
7731	Vignola-Falesina                                            	216	L886
7732	Vignole Borbera                                             	180	L887
7733	Vignolo                                                     	243	L888
7734	Vignone                                                     	74	L889
7735	Vigo di Cadore                                              	65	L890
7736	Vigodarzere                                                 	99	L892
7737	Vigo di Fassa                                               	217	L893
7738	Vigolo                                                      	237	L894
7739	Vigolo Vattaro                                              	219	L896
7740	Vigolzone                                                   	45	L897
7741	Vigone                                                      	299	L898
7742	Vigonovo                                                    	43	L899
7743	Vigonza                                                     	100	L900
7744	Vigo Rendena                                                	220	L903
7745	Viguzzolo                                                   	181	L904
7746	Villa Santa Lucia                                           	89	L905
7747	Villadossola                                                	75	L906
7748	Villa di Chiavenna                                          	77	L907
7749	Villa di Tirano                                             	78	L908
7750	Villa Santina                                               	133	L909
7751	Villa Agnedo                                                	221	L910
7752	Villa Bartolomea                                            	95	L912
7753	Villa Basilica                                              	34	L913
7754	Villabassa                                                  	113	L915
7755	Villabate                                                   	79	L916
7756	Villa Biscossi                                              	178	L917
7757	Villa Carcina                                               	199	L919
7758	Villa Castelli                                              	20	L920
7759	Villa Celiera                                               	46	L922
7760	Villachiara                                                 	200	L923
7761	Villacidro                                                  	25	L924
7762	Villa Collemandina                                          	35	L926
7763	Villa Cortese                                               	248	L928
7764	Villa d'Adda                                                	238	L929
7765	Villadeati                                                  	182	L931
7766	Villa del Bosco                                             	78	L933
7767	Villa del Conte                                             	101	L934
7768	Villa di Serio                                              	240	L936
7769	Villa Estense                                               	102	L937
7770	Villa d'Ogna                                                	241	L938
7771	Villadose                                                   	48	L939
7772	Villafalletto                                               	244	L942
7773	Villa Faraldi                                               	67	L943
7774	Villafranca Sicula                                          	43	L944
7775	Villafranca d'Asti                                          	117	L945
7776	Villafranca in Lunigiana                                    	16	L946
7777	Villafranca Padovana                                        	103	L947
7778	Villafranca Piemonte                                        	300	L948
7779	Villafranca di Verona                                       	96	L949
7780	Villafranca Tirrena                                         	105	L950
7781	Villafrati                                                  	80	L951
7782	Villaga                                                     	117	L952
7783	Villagrande Strisaili                                       	23	L953
7784	Villa Guardia                                               	245	L956
7785	Villa Lagarina                                              	222	L957
7786	Villalago                                                   	103	L958
7787	Villalba                                                    	22	L959
7788	Villalfonsina                                               	100	L961
7789	Villalvernia                                                	183	L963
7790	Villamagna                                                  	101	L964
7791	Villamaina                                                  	117	L965
7792	Villamar                                                    	26	L966
7793	Villamarzana                                                	49	L967
7794	Villamassargia                                              	22	L968
7795	Villa Minozzo                                               	45	L969
7796	Villamiroglio                                               	184	L970
7797	Villandro                                                   	114	L971
7798	Villanova Monferrato                                        	185	L972
7799	Villanova del Battista                                      	118	L973
7800	Villanova Mondov�                                           	245	L974
7801	Villanova d'Albenga                                         	68	L975
7802	Villanova del Sillaro                                       	60	L977
7803	Villanova Biellese                                          	79	L978
7804	Villanova di Camposampiero                                  	104	L979
7805	Villanova sull'Arda                                         	46	L980
7806	Villeneuve                                                  	74	L981
7807	Villanova Canavese                                          	301	L982
7808	Villanova d'Ardenghi                                        	179	L983
7809	Villanova d'Asti                                            	118	L984
7810	Villanova del Ghebbo                                        	50	L985
7811	Villanovaforru                                              	27	L986
7812	Villanovafranca                                             	28	L987
7813	Villanova Marchesana                                        	51	L988
7814	Villanova Monteleone                                        	78	L989
7815	Villanova Solaro                                            	246	L990
7816	Villanova Truschedu                                         	71	L991
7817	Villanova Tulo                                              	122	L992
7818	Villanterio                                                 	180	L994
7819	Villanuova sul Clisi                                        	201	L995
7820	Villaputzu                                                  	97	L998
7821	Villar Dora                                                 	303	L999
7822	Villarbasse                                                 	302	M002
7823	Villarboit                                                  	163	M003
7824	Villareggia                                                 	304	M004
7825	Villa Rendena                                               	223	M006
7826	Villar Focchiardo                                           	305	M007
7827	Villaromagnano                                              	186	M009
7828	Villarosa                                                   	20	M011
7829	Villar Pellice                                              	306	M013
7830	Villar Perosa                                               	307	M014
7831	Villar San Costanzo                                         	247	M015
7832	Villasalto                                                  	98	M016
7833	Villasanta                                                  	49	M017
7834	Villa San Giovanni                                          	96	M018
7835	Villa San Secondo                                           	119	M019
7836	Villa Santa Lucia degli Abruzzi                             	104	M021
7837	Villa Santa Maria                                           	102	M022
7838	Villa Sant'Angelo                                           	105	M023
7839	Villasor                                                    	101	M025
7840	Villaspeciosa                                               	102	M026
7841	Villastellone                                               	308	M027
7842	Villata                                                     	164	M028
7843	Villaurbana                                                 	72	M030
7844	Villavallelonga                                             	106	M031
7845	Villaverla                                                  	118	M032
7846	Villa Vicentina                                             	134	M034
7847	Villetta Barrea                                             	107	M041
7848	Villette                                                    	76	M042
7849	Villesse                                                    	25	M043
7850	Villimpenta                                                 	68	M044
7851	Villongo                                                    	242	M045
7852	Villorba                                                    	91	M048
7853	Vilminore di Scalve                                         	243	M050
7854	Vimercate                                                   	50	M052
7855	Vimodrone                                                   	242	M053
7856	Vinadio                                                     	248	M055
7857	Vinchiaturo                                                 	84	M057
7858	Vinchio                                                     	120	M058
7859	Vinci                                                       	50	M059
7860	Vinovo                                                      	309	M060
7861	Vinzaglio                                                   	164	M062
7862	Viola                                                       	249	M063
7863	Vione                                                       	202	M065
7864	Vipiteno                                                    	115	M067
7865	Virle Piemonte                                              	310	M069
7866	Visano                                                      	203	M070
7867	Vische                                                      	311	M071
7868	Visciano                                                    	88	M072
7869	Visco                                                       	135	M073
7870	Visone                                                      	187	M077
7871	Visso                                                       	57	M078
7872	Vistarino                                                   	181	M079
7873	Vistrorio                                                   	312	M080
7874	Vita                                                        	23	M081
7875	Viterbo                                                     	59	M082
7876	Viticuso                                                    	91	M083
7877	Vito d'Asio                                                 	49	M085
7878	Vitorchiano                                                 	60	M086
7879	Vittoria                                                    	12	M088
7880	Vittorio Veneto                                             	92	M089
7881	Vittorito                                                   	108	M090
7882	Vittuone                                                    	243	M091
7883	Vitulazio                                                   	100	M092
7884	Vitulano                                                    	77	M093
7885	Vi—                                                         	313	M094
7886	Vivaro Romano                                               	113	M095
7887	Vivaro                                                      	50	M096
7888	Viverone                                                    	80	M098
7889	Vizzini                                                     	54	M100
7890	Vizzola Ticino                                              	140	M101
7891	Vizzolo Predabissi                                          	244	M102
7892	Vo'                                                         	105	M103
7893	Vobarno                                                     	204	M104
7894	Vobbia                                                      	66	M105
7895	Vocca                                                       	166	M106
7896	Vodo Cadore                                                 	66	M108
7897	Voghera                                                     	182	M109
7898	Voghiera                                                    	23	M110
7899	Vogogna                                                     	77	M111
7900	Volano                                                      	224	M113
7901	Volla                                                       	89	M115
7902	Volongo                                                     	114	M116
7903	Volpago del Montello                                        	93	M118
7904	Volpara                                                     	183	M119
7905	Volpedo                                                     	188	M120
7906	Volpeglino                                                  	189	M121
7907	Volpiano                                                    	314	M122
7908	Voltaggio                                                   	190	M123
7909	Voltago Agordino                                            	67	M124
7910	Volta Mantovana                                             	70	M125
7911	Volterra                                                    	39	M126
7912	Voltido                                                     	115	M127
7913	Volturara Irpina                                            	119	M130
7914	Volturara Appula                                            	61	M131
7915	Volturino                                                   	62	M132
7916	Volvera                                                     	315	M133
7917	Vottignasco                                                 	250	M136
7918	Zaccanopoli                                                 	48	M138
7919	Zafferana Etnea                                             	55	M139
7920	Zagarise                                                    	157	M140
7921	Zagarolo                                                    	114	M141
7922	Zambana                                                     	225	M142
7923	Zambrone                                                    	49	M143
7924	Zandobbio                                                   	244	M144
7925	ZanŠ                                                        	119	M145
7926	Zanica                                                      	245	M147
7927	Zavattarello                                                	184	M150
7928	Zeccone                                                     	185	M152
7929	Zeddiani                                                    	74	M153
7930	Zelbio                                                      	246	M156
7931	Zelo Buon Persico                                           	61	M158
7932	Zelo Surrigone                                              	246	M160
7933	Zeme                                                        	186	M161
7934	Zenevredo                                                   	187	M162
7935	Zenson di Piave                                             	94	M163
7936	Zerba                                                       	47	M165
7937	Zerbo                                                       	188	M166
7938	Zerbol•                                                     	189	M167
7939	Zerfaliu                                                    	75	M168
7940	Zeri                                                        	17	M169
7941	Zermeghedo                                                  	120	M170
7942	Zero Branco                                                 	95	M171
7943	Zevio                                                       	97	M172
7944	Ziano di Fiemme                                             	226	M173
7945	Zibello                                                     	48	M174
7946	Zibido San Giacomo                                          	247	M176
7947	Zignago                                                     	32	M177
7948	Zimella                                                     	98	M178
7949	Zimone                                                      	81	M179
7950	Zinasco                                                     	190	M180
7951	Zoagli                                                      	67	M182
7952	Zocca                                                       	47	M183
7953	Zogno                                                       	246	M184
7954	Zola Predosa                                                	60	M185
7955	Zollino                                                     	94	M187
7956	Zone                                                        	205	M188
7957	ZoppŠ di Cadore                                             	69	M189
7958	Zoppola                                                     	51	M190
7959	Zovencedo                                                   	121	M194
7960	Zubiena                                                     	82	M196
7961	Zuccarello                                                  	69	M197
7962	Zuclo                                                       	227	M198
7963	Zugliano                                                    	122	M199
7964	Zuglio                                                      	136	M200
7965	Zumaglia                                                    	83	M201
7966	Zumpano                                                     	155	M202
7967	Zungoli                                                     	120	M203
7968	Zungri                                                      	50	M204
7969	Lariano                                                     	115	M207
7970	Lamezia Terme                                               	160	M208
7971	Sant'Anna Arresi                                            	19	M209
7972	Terme Vigliatore                                            	106	M210
7973	Acquedolci                                                  	107	M211
7974	Ladispoli                                                   	116	M212
7975	Ardea                                                       	117	M213
7976	Badesi                                                      	5	M214
7977	Sicignano degli Alburni                                     	143	M253
7978	Molina Aterno                                               	55	M255
7979	Scanzano Jonico                                             	31	M256
7980	Portopalo di Capo Passero                                   	20	M257
7981	Avigliano Umbro                                             	33	M258
7982	Viddalba                                                    	82	M259
7983	Casapesenna                                                 	103	M260
7984	Castro                                                      	96	M261
7985	Cellole                                                     	102	M262
7986	Porto Cesareo                                               	97	M263
7987	San Cassiano                                                	95	M264
7988	Vajont                                                      	52	M265
7989	Ordona                                                      	63	M266
7990	Zapponeta                                                   	64	M267
7991	Blufi                                                       	82	M268
7992	Paterno                                                     	100	M269
7993	Masainas                                                    	10	M270
7994	Mazzarrone                                                  	56	M271
7995	Ciampino                                                    	118	M272
7996	Santa Maria la Carit…                                       	90	M273
7997	Golfo Aranci                                                	11	M274
7998	Loiri Porto San Paolo                                       	13	M275
7999	Sant'Antonio di Gallura                                     	21	M276
8000	San Ferdinando                                              	97	M277
8001	Villaperuccio                                               	23	M278
8002	Priolo Gargallo                                             	21	M279
8003	Trecase                                                     	91	M280
8004	Petrosino                                                   	24	M281
8005	Tergu                                                       	86	M282
8006	Maniace                                                     	57	M283
8007	Santa Maria Coghinas                                        	87	M284
8008	Cardedu                                                     	4	M285
8009	Torrenova                                                   	108	M286
8010	Ragalna                                                     	58	M287
8011	Castiadas                                                   	106	M288
8012	Massa di Somma                                              	92	M289
8013	Stintino                                                    	89	M290
8014	Piscinas                                                    	15	M291
8015	Erula                                                       	88	M292
8016	Bellizzi                                                    	158	M294
8017	San Cesareo                                                 	119	M295
8018	Fiumicino                                                   	120	M297
8019	Statte                                                      	29	M298
8020	Due Carrare                                                 	106	M300
8021	Padru                                                       	19	M301
8022	Montiglio Monferrato                                        	121	M302
8023	Ronzo-Chienis                                               	135	M303
8024	Mosso                                                       	84	M304
8025	Cavallino-Treporti                                          	44	M308
8026	Fonte Nuova                                                 	122	M309
8027	Campolongo Tapogliano                                       	138	M311
8028	Lonato del Garda                                            	92	M312
8029	Ledro                                                       	229	M313
8030	Comano Terme                                                	228	M314
8031	Gravedona ed Uniti                                          	249	M315
8032	Rivignano Teor                                              	188	M317
8033	Trecastelli                                                 	50	M318
8034	Fabbriche di Vergemoli                                      	36	M319
8035	Valsamoggia                                                 	61	M320
8036	Figline e Incisa Valdarno                                   	52	M321
8037	Castelfranco Piandisc•                                      	40	M322
8038	Fiscaglia                                                   	27	M323
8039	Poggio Torriana                                             	28	M324
8040	Sissa Trecasali                                             	49	M325
8041	Scarperia e San Piero                                       	53	M326
8042	Casciana Terme Lari                                         	40	M327
8043	Crespina Lorenzana                                          	41	M328
8044	Pratovecchio Stia                                           	41	M329
8045	Montoro                                                     	121	M330
8046	Vallefoglia                                                 	68	M331
8047	Quero Vas                                                   	70	M332
8048	Sant'Omobono Terme                                          	252	M333
8049	Val Brembilla                                               	253	M334
8050	Bellagio                                                    	250	M335
8051	Colverde                                                    	251	M336
8052	Verderio                                                    	91	M337
8053	Cornale e Bastida                                           	191	M338
8054	Maccagno con Pino e Veddasca                                	142	M339
8055	Borgo Virgilio                                              	71	M340
8056	Tremezzina                                                  	252	M341
8057	Longarone                                                   	71	M342
18493	Montemale di Cuneo                                          	0	    
\.


--
-- Data for Name: config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.config (id, chiave, valore, descrizione, categoria, data_creazione, data_modifica) FROM stdin;
2	COMPANY_cloud_CREATED	TRUE	Tabelle create per azienda cloud	COMPANY_SETUP	2025-04-18 14:15:02.89	2025-04-18 14:15:02.89
4	COMPANY_frant_CREATED	TRUE	Tabelle create per azienda frant	COMPANY_SETUP	2025-04-19 06:01:06.459	2025-04-19 06:01:06.459
1	SCHEMA_VERSION	6	Versione dello schema del database	SYSTEM	2025-04-18 13:29:26.969	2025-04-19 12:38:15.389
\.


--
-- Data for Name: frant_articoli; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.frant_articoli (id, tipologia, descrizione, categ_olio, macroarea, origispeci, flag_ps, flag_ef, flag_bio, flag_conv, cod_iva, varieta, flag_in_uso, unita_misura, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: frant_calendario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.frant_calendario (id, id_cliente, tipologia_oliva, quantita_kg, data_inizio, data_fine, id_linea, stato, note, id_user, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: frant_cisterne; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.frant_cisterne (id, descrizione, id_magazzino, capacita, giacenza, id_articolo, id_codicesoggetto, flagobso, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: frant_linee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.frant_linee (id, descrizione, id_magazzino, cap_oraria, id_oliva, created_at, updated_at) FROM stdin;
1	Linea Veloce	1	2500.00	\N	2025-04-19 18:22:35.099715	2025-04-19 18:22:35.099715
\.


--
-- Data for Name: frant_listini; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.frant_listini (id, descrizione, anno, data_inizio, data_fine, cod_articolo, qta_da, qta_a, prezzo, um, cod_iva, note, "flagAttivo", created_at, updated_at) FROM stdin;
1	Listino 2025	2025	2025-01-01	2026-12-31	5	1.00	500.00	2.70	KG	4	\N	t	2025-04-19 09:00:15.540203	2025-04-19 09:00:15.540203
2	Listino 2025	2025	2025-01-01	2026-12-31	5	501.00	99999999.00	2.30	KG	4	\N	t	2025-04-19 09:01:06.756	2025-04-19 09:01:19.564483
\.


--
-- Data for Name: frant_magazzini; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.frant_magazzini (id, descrizione, cod_sian, created_at, updated_at) FROM stdin;
1	Magazzino Arenzano	2332558	2025-04-19 18:20:45.390674	2025-04-19 18:20:45.390674
\.


--
-- Data for Name: frant_movimenti; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.frant_movimenti (id, nome_file, campo01, campo02, campo03, campo04, campo05, campo06, campo07, campo08, campo09, campo10, campo11, campo12, campo13, campo14, campo15, campo16, campo17, campo18, campo19, campo20, campo21, campo22, campo23, campo24, campo25, campo26, campo27, campo28, campo29, campo30, campo31, campo32, campo33, campo34, campo35, campo36, campo37, campo38, campo39, campo40, campo41, campo42, campo43, campo44, campo45, campo46, campo47, campo48, campo49, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: frant_soggetti; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.frant_soggetti (id, descrizione, indirizzo, cap, comune, provincia, nazione, id_sian, telefono, cellulare, mail, partiva, codfisc, "flagForn", flagdoc, olivedef, created_at, updated_at) FROM stdin;
1	Gabriele Baccino	Via delle mimose	17019	7574	9	1	\N	019 66 66 66 8	\N	g.baccino@cloud3.srl	\N	BCCGRL85C15Z404U	f	f	3	2025-04-19 08:56:48.261758	2025-04-19 08:56:48.261758
2	Baccino Samuele	Via Gerani	17019	7574	9	1	\N	010 666666	347 2100	samuelebaccino@gmail.com	\N	bccsmdkfmd	f	f	1	2025-04-19 17:49:29.136924	2025-04-19 17:49:29.136924
3	Sergio Cola	Via Mimosa	17019	7574	10	1	\N	\N	348 9015870	cola@cloud3.srl	\N	CLLSRLDSCJ948	f	f	1	2025-04-19 18:06:54.865003	2025-04-19 18:06:54.865003
\.


--
-- Data for Name: frant_terreni; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.frant_terreni (id, cod_cli, annata, orig_spec, cod_catastale, metriq, ettari, qtamaxq, num_alberi, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: macroaree; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.macroaree (id, acronimo, descrizione, flag_orig) FROM stdin;
2	PUE  	Paese dell' Unione europea	f
3	UE   	Unione europea	f
4	EXT  	Paese extra Unione europea	f
5	MXUE 	Miscela di oli di oliva originari dell' Unione europea	f
6	CUE  	Combinazione Stati dell‟Unione europea/o regione dell‟Unione europea	f
7	MXN  	Miscela di oli di oliva non originari dell‟Unione europea	f
8	CEX  	Combinazione Stati non dell‟Unione europea/o regione extra Unione	f
9	MXX  	Miscela di oli di oliva originari dell' Unione europea e non originari dell‟Unione	f
10	CCE  	Combinazione Stati extra UE e UE/ combinazione di Regioni extra UE e UE	f
11	OSP  	Olio (extra) vergine ottenuto nell‟Unione (o in un Stato membro) da olive raccolte nell‟Unione (o in un Stato membro o in un paese terzo)	f
12	DOP  	DOP/IGP	f
13	ADD  	Olio/olive atto a divenire DOP/IGP	f
14	DOE  	DOP/IGP (Estero)	f
1	ITA  	Italia	f
\.


--
-- Data for Name: nazioni; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nazioni (id, cod_nazione, descrizione, cod_istat) FROM stdin;
1	ITA	Italia                                                      	23 
\.


--
-- Data for Name: olive_to_oli; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.olive_to_oli (id, cod_olive, cod_olio, flag_default) FROM stdin;
1	1	2	t
2	3	4	t
3	6	7	t
4	8	9	t
\.


--
-- Data for Name: origini_specifiche; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.origini_specifiche (id, acronimo, descrizione, flag_dop, flag_raccolta, flag_molitura, flag_annata, flag_colla_da, flag_colla_a, flag_capacita, flag_certifi) FROM stdin;
12	ET 	Egitto	f	f	f	f	f	f	f	f
14	LAR	Libia	f	f	f	f	f	f	f	f
15	RL 	Libano	f	f	f	f	f	f	f	f
16	HKJ	Giordania	f	f	f	f	f	f	f	f
17	DZ 	Algeria	f	f	f	f	f	f	f	f
18	PS 	Palestina	f	f	f	f	f	f	f	f
19	IL 	Israele	f	f	f	f	f	f	f	f
20	RCH	Cile	f	f	f	f	f	f	f	f
21	RA 	Argentina	f	f	f	f	f	f	f	f
22	AUS	Australia	f	f	f	f	f	f	f	f
23	ALT	Altro 23	f	f	f	f	f	f	f	f
2	E  	Spagna	f	f	f	f	f	f	f	f
3	GR 	Grecia	f	f	f	f	f	f	f	f
4	P  	Portogallo	f	f	f	f	f	f	f	f
5	F  	Francia	f	f	f	f	f	f	f	f
6	M  	Malta	f	f	f	f	f	f	f	f
7	CY 	Cipro	f	f	f	f	f	f	f	f
8	IBE	Penisola Iberica	f	f	f	f	f	f	f	f
9	TN 	Tunisia	f	f	f	f	f	f	f	f
10	MA 	Marocco	f	f	f	f	f	f	f	f
24	   	ALTO CROTONESE	f	t	t	t	t	t	t	t
1	I  	Italia	f	f	f	f	f	f	f	f
25	   	APRUTINO PESCARESE	f	t	t	t	t	t	t	t
26	   	BRISIGHELLA	f	t	t	t	t	t	t	t
28	   	BRUZIO - FASCIA PREPOLLINICA	f	t	t	f	t	t	t	t
29	   	BRUZIO - VALLE CRATI	f	t	t	f	t	t	t	t
30	   	BRUZIO - COLLINE JONICHE PRESILANE	f	t	t	f	t	t	t	t
31	   	BRUZIO - SIBARITIDE	f	t	t	f	t	t	t	t
32	   	CANINO	f	t	t	f	t	t	t	t
33	   	CARTOCETO	f	t	t	f	t	t	t	t
34	   	CHIANTI CLASSICO	f	t	t	f	t	t	t	t
35	   	CILENTO	f	t	t	t	t	t	t	t
36	   	COLLINA DI BRINDISI	f	t	t	t	t	t	t	t
37	   	IRPINIA - COLLINE DELL'UFITA	f	t	t	f	t	t	t	t
38	   	COLLINE DI ROMAGNA	f	t	t	t	t	t	t	t
39	   	COLLINE PONTINE	f	t	t	t	t	t	t	t
40	   	COLLINE SALERNITANE	f	t	t	t	t	t	t	t
41	   	COLLINE TEATINE	f	t	t	f	t	t	t	t
42	   	COLLINE TEATINE - FRENTANO	f	t	t	f	t	t	t	t
43	   	COLLINE TEATINE - VASTESE	f	t	t	f	t	t	t	t
45	   	DAUNO - ALTO TAVOLIERE	f	t	t	f	t	t	t	t
46	   	DAUNO - BASSO TAVOLIERE	f	t	t	f	t	t	t	t
47	   	DAUNO - GARGANO	f	t	t	f	t	t	t	t
48	   	DAUNO - SUBAPPENNINO	f	t	t	f	t	t	t	t
49	   	GARDA	f	t	t	t	t	t	t	t
50	   	GARDA - BRESCIANO	f	t	t	t	t	t	t	t
51	   	GARDA - ORIENTALE	f	t	t	t	t	t	t	t
52	   	GARDA - TRENTINO	f	t	t	t	t	t	t	t
53	   	SICILIA	f	t	t	t	t	t	t	t
54	   	LAGHI LOMBARDI	f	t	t	t	t	t	t	t
55	   	LAGHI LOMBARDI - SEBINO	f	t	t	t	t	t	t	t
56	   	LAGHI LOMBARDI - LARIO	f	t	t	t	t	t	t	t
57	   	LAMETIA	f	t	t	t	t	t	t	t
58	   	LUCCA	f	t	t	f	t	t	t	t
59	   	MOLISE	f	t	t	f	t	t	t	t
60	   	MONTE ETNA	f	t	t	t	t	t	t	t
62	   	MONTI IBLEI - MONTE LAURO	f	t	t	t	t	t	t	t
63	   	MONTI IBLEI - VAL D'ANAPO	f	t	t	t	t	t	t	t
64	   	MONTI IBLEI - VAL TELLARO	f	t	t	t	t	t	t	t
65	   	MONTI IBLEI - FRIGINTINI	f	t	t	t	t	t	t	t
66	   	MONTI IBLEI - GULFI	f	t	t	t	t	t	t	t
67	   	MONTI IBLEI - VALLE DELL'IRMINIO	f	t	t	t	t	t	t	t
68	   	MONTI IBLEI - CALATINO	f	t	t	t	t	t	t	t
69	   	MONTI IBLEI - TRIGONA-PANCALI	f	t	t	t	t	t	t	t
70	   	OLIO DI CALABRIA	f	t	t	t	t	t	t	t
71	   	PENISOLA SORRENTINA	f	t	t	t	t	t	t	t
72	   	PRETUZIANO DELLE COLLINE TERAMANE	f	t	t	f	t	t	t	t
73	   	RIVIERA LIGURE	f	f	f	t	t	t	t	t
74	   	RIVIERA LIGURE - RIVIERA DEI FIORI	f	t	t	f	t	t	t	t
75	   	RIVIERA LIGURE - RIVIERA DEL PONENTE SAVONESE	f	t	t	f	t	t	t	t
77	   	RIVIERA LIGURE - RIVIERA DI LEVANTE	f	t	t	f	t	t	t	t
78	   	SABINA	f	t	t	f	t	t	t	t
79	   	SARDEGNA	f	t	t	f	t	t	t	t
80	   	SEGGIANO	f	t	t	t	t	t	t	t
81	   	TERGESTE	f	t	t	t	t	t	t	t
82	   	TERRE AURUNCHE	f	t	t	t	t	t	t	t
83	   	TERRE DI BARI	f	t	t	t	t	t	t	t
84	   	TERRE DI BARI - CASTEL DEL MONTE	f	t	t	t	t	t	t	t
85	   	TERRE DI BARI - BITONTO	f	t	t	t	t	t	t	t
86	   	TERRE DI BARI -MURGIA DEI TRULLI E DELLE GROTTE	f	t	t	t	t	t	t	t
87	   	TERRE D'OTRANTO	f	t	t	t	t	t	t	t
88	   	TERRE SIENA	f	t	t	t	t	t	t	t
89	   	TERRE TARENTINE	f	t	t	t	t	t	t	t
90	   	TOSCANO	f	t	f	f	f	t	t	t
91	   	TOSCANO - SEGGIANO DOP	t	f	f	f	t	t	t	t
92	   	TOSCANO - COLLINE LUCCHESI	f	t	t	f	f	t	t	t
93	   	TOSCANO - COLLINE DELLA LUNIGIANA	f	t	t	f	f	t	t	t
94	   	TOSCANO - COLLINE DI AREZZO	f	t	t	f	f	t	t	t
95	   	TOSCANO - COLLINE SENESI	f	t	t	f	f	t	t	t
96	   	TOSCANO - COLLINE DI FIRENZE	f	t	t	f	f	t	t	t
97	   	TOSCANO - MONTALBANO	f	t	t	f	f	t	t	t
98	   	TOSCANO - MONTI PISANI	f	t	t	f	f	t	t	t
99	   	TUSCIA	f	t	t	t	t	t	t	t
101	   	UMBRIA - COLLI ASSISI-SPOLETO	f	t	t	f	t	t	t	t
102	   	UMBRIA - COLLI MARTANI	f	t	t	f	t	t	t	t
103	   	UMBRIA - COLLI AMERINI	f	t	t	f	t	t	t	t
104	   	UMBRIA - COLLI DEL TRASIMENO	f	t	t	f	t	t	t	t
105	   	UMBRIA - COLLI ORVIETANI	f	t	t	f	t	t	t	t
106	   	VAL DI MAZARA	f	t	t	t	t	t	t	t
107	   	VALDEMONE	f	t	t	f	t	t	t	t
108	   	VALLE DEL BELICE	f	t	t	t	t	t	t	t
109	   	VALLI TRAPANESI	f	t	t	t	t	t	t	t
111	   	VULTURE	f	t	t	t	t	t	t	t
112	   	VENETO - EUGANEI E BERICI	f	t	t	f	t	t	t	t
113	   	VENETO - VENETO DEL GRAPPA	f	t	t	f	t	t	t	t
11	TR 	Turchia	f	f	f	f	f	f	f	f
13	SYR	Siria	f	f	f	f	f	f	f	f
114	   	VENETO - VALPOLICELLA	f	t	t	f	t	t	t	t
115	   	IGP MARCHE	f	t	t	t	t	t	t	t
116	   	IGP OLIO DI PUGLIA	f	t	t	t	t	t	t	t
117	   	IGP OLIO LUCANO	f	t	t	t	t	t	t	t
119	   	MONTI IBLEI	f	t	t	t	t	t	t	t
\.


--
-- Data for Name: province; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.province (id, descrizione, targa) FROM stdin;
16	Bergamo                                                     	BG
17	Brescia                                                     	BS
10	Genova                                                      	GE
100	Prato                                                       	PO
101	Crotone                                                     	KR
102	Vibo Valentia                                               	VV
103	Verbano-Cusio-Ossola                                        	VB
104	Olbia-Tempio                                                	OT
105	Ogliastra                                                   	OG
106	Medio Campidano                                             	VS
107	Carbonia-Iglesias                                           	CI
108	Monza e della Brianza                                       	MB
109	Fermo                                                       	FM
11	La Spezia                                                   	SP
110	Barletta-Andria-Trani                                       	BT
12	Varese                                                      	VA
13	Como                                                        	CO
14	Sondrio                                                     	SO
15	Milano                                                      	MI
49	Livorno                                                     	LI
5	Asti                                                        	AT
50	Pisa                                                        	PI
51	Arezzo                                                      	AR
52	Siena                                                       	SI
53	Grosseto                                                    	GR
54	Perugia                                                     	PG
55	Terni                                                       	TR
56	Viterbo                                                     	VT
58	Roma                                                        	RM
59	Latina                                                      	LT
6	Alessandria                                                 	AL
60	Frosinone                                                   	FR
61	Caserta                                                     	CE
62	Benevento                                                   	BN
63	Napoli                                                      	NA
64	Avellino                                                    	AV
65	Salerno                                                     	SA
66	L'Aquila                                                    	AQ
67	Teramo                                                      	TE
68	Pescara                                                     	PE
69	Chieti                                                      	CH
7	Valle d'Aosta/Vall�e d'Aoste                                	AO
70	Campobasso                                                  	CB
71	Foggia                                                      	FG
72	Bari                                                        	BA
73	Taranto                                                     	TA
74	Brindisi                                                    	BR
75	Lecce                                                       	LE
76	Potenza                                                     	PZ
77	Matera                                                      	MT
78	Cosenza                                                     	CS
79	Catanzaro                                                   	CZ
80	Reggio di Calabria                                          	RC
81	Trapani                                                     	TP
82	Palermo                                                     	PA
83	Messina                                                     	ME
84	Agrigento                                                   	AG
85	Caltanissetta                                               	CL
86	Enna                                                        	EN
87	Catania                                                     	CT
88	Ragusa                                                      	RG
89	Siracusa                                                    	SR
9	Savona                                                      	SV
90	Sassari                                                     	SS
19	Cremona                                                     	CR
2	Vercelli                                                    	VC
20	Mantova                                                     	MN
21	Bolzano/Bozen                                               	BZ
22	Trento                                                      	TN
23	Verona                                                      	VR
24	Vicenza                                                     	VI
25	Belluno                                                     	BL
26	Treviso                                                     	TV
27	Venezia                                                     	VE
28	Padova                                                      	PD
29	Rovigo                                                      	RO
3	Novara                                                      	NO
30	Udine                                                       	UD
31	Gorizia                                                     	GO
32	Trieste                                                     	TS
33	Piacenza                                                    	PC
35	Reggio nell'Emilia                                          	RE
36	Modena                                                      	MO
37	Bologna                                                     	BO
38	Ferrara                                                     	FE
39	Ravenna                                                     	RA
4	Cuneo                                                       	CN
40	Forl�-Cesena                                                	FC
41	Pesaro e Urbino                                             	PU
42	Ancona                                                      	AN
43	Macerata                                                    	MC
44	Ascoli Piceno                                               	AP
45	Massa-Carrara                                               	MS
46	Lucca                                                       	LU
47	Pistoia                                                     	PT
48	Firenze                                                     	FI
96	Biella                                                      	BI
97	Lecco                                                       	LC
98	Lodi                                                        	LO
99	Rimini                                                      	RN
18	Pavia                                                       	PV
34	Parma                                                       	PR
57	Rieti                                                       	RI
8	Imperia                                                     	IM
91	Nuoro                                                       	NU
92	Cagliari                                                    	CA
93	Pordenone                                                   	PN
94	Isernia                                                     	IS
95	Oristano                                                    	OR
\.


--
-- Data for Name: syslog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.syslog (id, livello, messaggio, dettagli, user_id, ip_address, data) FROM stdin;
1	INFO	Creato utente amministratore iniziale	Creato utente admin con ID 1	1	\N	2025-04-18 13:28:11.854
2	ERROR	POST /auth/login 401 - 90ms	{"method":"POST","url":"/auth/login","statusCode":401,"duration":90,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 13:32:42.258
3	ERROR	POST /auth/login 401 - 3ms	{"method":"POST","url":"/auth/login","statusCode":401,"duration":3,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 13:32:49.914
4	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-18T13:32:55.180Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-18 13:32:55.18
5	INFO	POST /auth/login 200 - 63ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":63,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 13:32:55.185
6	INFO	Creata azienda Frantoio cloud3 (cloud)	Creazione avviata	1	\N	2025-04-18 13:50:49.98
7	ERROR	Errore creazione azienda Frantoio cloud3 (cloud)	Errore nella creazione delle tabelle: \nInvalid `prisma.$executeRawUnsafe()` invocation:\n\n\nRaw query failed. Code: `42P01`. Message: `la relazione "cloud_magazzini" non esiste`	1	\N	2025-04-18 13:50:50.054
8	ERROR	POST /companies 500 - 117ms	{"method":"POST","url":"/companies","statusCode":500,"duration":117,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-18 13:50:50.059
9	ERROR	Errore creazione azienda Frantoio cloud3 (cloud)	Il codice azienda cloud è già in uso.	1	\N	2025-04-18 13:51:39.121
10	ERROR	POST /companies 500 - 198ms	{"method":"POST","url":"/companies","statusCode":500,"duration":198,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-18 13:51:39.134
11	ERROR	POST /auth/login 401 - 87ms	{"method":"POST","url":"/auth/login","statusCode":401,"duration":87,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 14:01:36.531
12	ERROR	POST /auth/login 401 - 51ms	{"method":"POST","url":"/auth/login","statusCode":401,"duration":51,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 14:01:41.763
13	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-18T14:01:47.260Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-18 14:01:47.261
14	INFO	POST /auth/login 200 - 57ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":57,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 14:01:47.264
15	INFO	Creata azienda Frantoio Cl3 (fracl)	Creazione avviata	1	\N	2025-04-18 14:02:19.165
16	ERROR	Errore creazione azienda Frantoio Cl3 (fracl)	Errore nella creazione delle tabelle: \nInvalid `prisma.$executeRawUnsafe()` invocation:\n\n\nRaw query failed. Code: `42P01`. Message: `la relazione "fracl_magazzini" non esiste`	1	\N	2025-04-18 14:02:19.231
17	ERROR	POST /companies 500 - 137ms	{"method":"POST","url":"/companies","statusCode":500,"duration":137,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-18 14:02:19.28
18	ERROR	POST /auth/login 401 - 133ms	{"method":"POST","url":"/auth/login","statusCode":401,"duration":133,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 14:08:25.458
19	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-18T14:08:31.912Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-18 14:08:31.913
20	INFO	POST /auth/login 200 - 63ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":63,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 14:08:31.917
21	ERROR	Errore creazione azienda Frantoio Cloud3 (cloud)	Esistono già tabelle con il prefisso cloud. Scegliere un altro codice.	1	\N	2025-04-18 14:08:55.239
22	ERROR	POST /companies 500 - 27ms	{"method":"POST","url":"/companies","statusCode":500,"duration":27,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-18 14:08:55.244
23	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-18T14:14:41.606Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-18 14:14:41.607
24	INFO	POST /auth/login 200 - 147ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":147,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 14:14:41.613
25	INFO	Creata azienda Frantoio Cloud3 (cloud)	Creazione avviata	1	\N	2025-04-18 14:15:02.601
26	INFO	Completata creazione azienda Frantoio Cloud3 (cloud)	Tabelle create correttamente	1	\N	2025-04-18 14:15:02.893
27	INFO	Aggiornato utente admin	\N	1	127.0.0.1	2025-04-18 14:15:32.284
28	INFO	Creato utente gb	\N	1	127.0.0.1	2025-04-18 14:16:10.326
29	INFO	Utente 2 assegnato all'azienda 3	\N	1	\N	2025-04-18 14:16:22.472
30	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-18T14:16:28.712Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-18 14:16:28.713
31	INFO	POST /auth/login 200 - 53ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":53,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 14:16:28.716
32	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-18T14:20:48.418Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-18 14:20:48.419
33	INFO	POST /auth/login 200 - 112ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":112,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 14:20:48.423
34	INFO	Azienda 3 aggiornata	{"descrizione":"Frantoio Cloud3                         ","ultimoidsoggetto":254,"email_mittente":"admin.cloud@adhocoil.com","email_password":"!Localcloud3","email_smtp_server":"mail.infomaniak.com","email_smtp_port":465,"email_ssl":true,"email_default_oggetto":"Frantoio","email_firma":"Frantoio Cloud3"}	1	\N	2025-04-18 14:22:49.905
35	ERROR	POST /companies/3/test-email 500 - 1349ms	{"method":"POST","url":"/companies/3/test-email","statusCode":500,"duration":1349,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-18 14:23:12.539
36	INFO	Azienda 3 aggiornata	{"descrizione":"Frantoio Cloud3                         ","ultimoidsoggetto":254,"email_mittente":"admin.cloud@adhocoil.com","email_password":"!Localcloud3","email_smtp_server":"mail.infomaniak.com","email_smtp_port":465,"email_ssl":true,"email_default_oggetto":"Frantoio","email_firma":"Frantoio Cloud3"}	1	\N	2025-04-18 14:23:37.381
37	ERROR	POST /companies/3/test-email 500 - 1245ms	{"method":"POST","url":"/companies/3/test-email","statusCode":500,"duration":1245,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-18 14:23:51.563
38	INFO	Azienda 3 aggiornata	{"descrizione":"Frantoio Cloud3                         ","ultimoidsoggetto":254,"email_mittente":"frantoio@cloud3.help","email_password":"!Localcloud3","email_smtp_server":"mail.cloud3.help","email_smtp_port":465,"email_ssl":true,"email_default_oggetto":"Frantoio","email_firma":"Frantoio Cloud3"}	1	\N	2025-04-18 14:28:41.322
39	INFO	Azienda 3 aggiornata	{"descrizione":"Frantoio Cloud3                         ","ultimoidsoggetto":254,"email_mittente":"frantoio@cloud3.help","email_password":"!Localcloud3","email_smtp_server":"mail.cloud3.help","email_smtp_port":465,"email_ssl":true,"email_default_oggetto":"Frantoio","email_firma":"Frantoio Cloud3"}	1	\N	2025-04-18 14:30:01.307
40	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-18T14:33:34.822Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","method":"login"}	2	127.0.0.1	2025-04-18 14:33:34.823
41	INFO	POST /auth/login 200 - 226ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":226,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 14:33:34.856
42	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-18T14:49:38.607Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","method":"login"}	2	127.0.0.1	2025-04-18 14:49:38.608
43	INFO	POST /auth/login 200 - 128ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":128,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 14:49:38.626
44	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-18T14:57:30.717Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-18 14:57:30.718
45	INFO	POST /auth/login 200 - 145ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":145,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 14:57:30.727
46	ERROR	POST /auth/register 500 - 149ms	{"method":"POST","url":"/auth/register","statusCode":500,"duration":149,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 15:13:11.069
47	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-18T15:14:37.825Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","method":"login"}	2	127.0.0.1	2025-04-18 15:14:37.826
48	INFO	POST /auth/login 200 - 68ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":68,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","contentType":"application/json"}	\N	127.0.0.1	2025-04-18 15:14:37.831
49	ERROR	GET /company/3/tables/soggetti 500 - 107ms	{"method":"GET","url":"/company/3/tables/soggetti","statusCode":500,"duration":107,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2	127.0.0.1	2025-04-18 15:14:45.337
50	ERROR	GET /company/3/tables/soggetti 500 - 7ms	{"method":"GET","url":"/company/3/tables/soggetti","statusCode":500,"duration":7,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2	127.0.0.1	2025-04-18 15:14:45.496
51	ERROR	GET /company/3/tables/soggetti 500 - 7ms	{"method":"GET","url":"/company/3/tables/soggetti","statusCode":500,"duration":7,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2	127.0.0.1	2025-04-18 15:15:02.616
52	ERROR	GET /company/3/tables/soggetti 500 - 9ms	{"method":"GET","url":"/company/3/tables/soggetti","statusCode":500,"duration":9,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2	127.0.0.1	2025-04-18 15:15:02.938
53	ERROR	GET /company/3/tables/soggetti 500 - 7ms	{"method":"GET","url":"/company/3/tables/soggetti","statusCode":500,"duration":7,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2	127.0.0.1	2025-04-18 15:15:11.928
54	ERROR	GET /company/3/tables/soggetti 500 - 7ms	{"method":"GET","url":"/company/3/tables/soggetti","statusCode":500,"duration":7,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2	127.0.0.1	2025-04-18 15:15:12.24
55	ERROR	POST /company/3/tables/soggetti 500 - 9ms	{"method":"POST","url":"/company/3/tables/soggetti","statusCode":500,"duration":9,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","contentType":"application/json"}	2	127.0.0.1	2025-04-18 15:16:20.68
56	INFO	Creata azienda Frantoio cloud3 (cloud)	Creazione avviata	1	\N	2025-04-18 15:29:46.652
57	ERROR	Errore creazione azienda Frantoio cloud3 (cloud)	Errore nella creazione delle tabelle: \nInvalid `this.prisma.config.create()` invocation in\n/mnt/c/Users/Gabriele/CLOUD3 SRL/File - Sviluppo/AppFrantoi2/src/backend/services/company/company-tables-creator.ts:91:32\n\n  88 }\n  89 \n  90 // Registrazione nella configurazione\n→ 91 await this.prisma.config.create(\nUnique constraint failed on the fields: (`chiave`)	1	\N	2025-04-18 15:29:46.836
58	ERROR	POST /companies 500 - 209ms	{"method":"POST","url":"/companies","statusCode":500,"duration":209,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-18 15:29:46.839
59	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T05:07:24.344Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 05:07:24.345
60	INFO	POST /auth/login 200 - 241ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":241,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 05:07:24.351
61	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T05:07:31.314Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 05:07:31.315
62	INFO	POST /auth/login 200 - 52ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":52,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 05:07:31.317
63	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T05:14:09.807Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 05:14:09.808
64	INFO	POST /auth/login 200 - 141ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":141,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 05:14:09.815
65	ERROR	POST /auth/login 401 - 130ms	{"method":"POST","url":"/auth/login","statusCode":401,"duration":130,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 05:26:20.942
66	ERROR	POST /auth/login 401 - 46ms	{"method":"POST","url":"/auth/login","statusCode":401,"duration":46,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 05:26:28.246
67	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T05:26:30.386Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 05:26:30.387
68	INFO	POST /auth/login 200 - 55ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":55,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 05:26:30.39
69	ERROR	Backup database fallito	Command failed: PGPASSWORD=!Nuvola3 pg_dump -h 10.0.50.53 -p 5432 -U postgres -d frantoio -F p > "/mnt/c/Users/Gabriele/CLOUD3 SRL/File - Sviluppo/AppFrantoi2/backups/frantoio_20250419_072638.sql"\n/bin/sh: 1: pg_dump: not found\n	1	\N	2025-04-19 05:26:39.032
70	ERROR	POST /admin/backup-database 500 - 215ms	{"method":"POST","url":"/admin/backup-database","statusCode":500,"duration":215,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-19 05:26:39.038
71	ERROR	Backup database fallito	Command failed: PGPASSWORD=!Nuvola3 pg_dump -h 10.0.50.53 -p 5432 -U postgres -d frantoio -F p > "/mnt/c/Users/Gabriele/CLOUD3 SRL/File - Sviluppo/AppFrantoi2/backups/frantoio_20250419_072812.sql"\n/bin/sh: 1: pg_dump: not found\n	1	\N	2025-04-19 05:28:12.337
72	ERROR	POST /admin/backup-database 500 - 58ms	{"method":"POST","url":"/admin/backup-database","statusCode":500,"duration":58,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-19 05:28:12.34
73	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T05:31:20.489Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 05:31:20.489
74	INFO	POST /auth/login 200 - 140ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":140,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 05:31:20.495
75	WARNING	Backup database limitato	Backup limitato creato perché pg_dump non è disponibile	1	\N	2025-04-19 05:31:24.775
76	INFO	POST /admin/backup-database 202 - 222ms	{"method":"POST","url":"/admin/backup-database","statusCode":202,"duration":222,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-19 05:31:24.781
77	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T05:36:25.354Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 05:36:25.355
78	INFO	POST /auth/login 200 - 147ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":147,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 05:36:25.364
79	WARNING	Backup database limitato	Backup limitato creato perché pg_dump non è disponibile	1	\N	2025-04-19 05:36:44.268
80	ERROR	POST /admin/backup-database 500 - 225ms	{"method":"POST","url":"/admin/backup-database","statusCode":500,"duration":225,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-19 05:36:44.274
81	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T05:39:04.889Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 05:39:04.89
82	INFO	POST /auth/login 200 - 145ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":145,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 05:39:04.896
83	INFO	Backup database completato	File: frantoio_20250419_073910.sql, Dimensione: 0.65 MB	1	\N	2025-04-19 05:39:11.552
84	INFO	POST /admin/backup-database 200 - 1177ms	{"method":"POST","url":"/admin/backup-database","statusCode":200,"duration":1177,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-19 05:39:11.559
85	ERROR	Errore creazione azienda Frantoio Cloud3 (cloud)	Il codice azienda cloud è già in uso.	1	\N	2025-04-19 05:50:13.049
86	ERROR	POST /companies 500 - 21ms	{"method":"POST","url":"/companies","statusCode":500,"duration":21,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-19 05:50:13.054
87	INFO	Utente 2 assegnato all'azienda 4	\N	1	\N	2025-04-19 05:52:28.793
88	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T06:00:46.114Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 06:00:46.114
89	INFO	POST /auth/login 200 - 143ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":143,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 06:00:46.121
90	INFO	Creata azienda Frantoio (frant)	Creazione avviata	1	\N	2025-04-19 06:01:06.328
91	INFO	Completata creazione azienda Frantoio (frant)	Tabelle create correttamente	1	\N	2025-04-19 06:01:06.462
92	INFO	Utente 2 assegnato all'azienda 5	\N	1	\N	2025-04-19 06:01:42.877
93	INFO	Utente 2 rimosso dall'azienda 4	\N	1	\N	2025-04-19 06:01:49.283
94	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T06:12:40.919Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 06:12:40.92
95	INFO	POST /auth/login 200 - 56ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":56,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 06:12:40.924
96	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T06:12:48.551Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 06:12:48.552
97	INFO	POST /auth/login 200 - 52ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":52,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 06:12:48.554
98	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T06:25:17.312Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 06:25:17.312
99	INFO	POST /auth/login 200 - 146ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":146,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 06:25:17.346
100	ERROR	PUT /tables/codici_iva/22 500 - 45ms	{"method":"PUT","url":"/tables/codici_iva/22","statusCode":500,"duration":45,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-19 06:29:10.526
101	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T06:38:44.399Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 06:38:44.4
102	INFO	POST /auth/login 200 - 264ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":264,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 06:38:44.435
103	INFO	Backup database completato	File: frantoio_20250419_085002.sql, Dimensione: 0.67 MB	1	\N	2025-04-19 06:50:03.705
104	INFO	POST /admin/backup-database 200 - 955ms	{"method":"POST","url":"/admin/backup-database","statusCode":200,"duration":955,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	1	127.0.0.1	2025-04-19 06:50:03.712
105	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T06:53:36.192Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 06:53:36.193
106	INFO	POST /auth/login 200 - 141ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":141,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 06:53:36.201
107	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T06:54:21.082Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 06:54:21.083
108	INFO	POST /auth/login 200 - 55ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":55,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 06:54:21.085
109	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T12:15:37.111Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 12:15:37.111
110	INFO	POST /auth/login 200 - 116ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":116,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 12:15:37.127
111	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T12:16:51.092Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 12:16:51.093
112	INFO	POST /auth/login 200 - 55ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":55,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 12:16:51.095
113	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T12:19:39.227Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 12:19:39.227
114	INFO	POST /auth/login 200 - 128ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":128,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 12:19:39.243
115	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T12:26:22.911Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 12:26:22.912
116	INFO	POST /auth/login 200 - 143ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":143,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 12:26:22.917
117	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T12:39:07.664Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 12:39:07.665
118	INFO	POST /auth/login 200 - 141ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":141,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 12:39:07.67
119	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T12:47:40.408Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 12:47:40.409
120	INFO	POST /auth/login 200 - 140ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":140,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 12:47:40.416
121	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T12:48:06.075Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 12:48:06.076
122	INFO	POST /auth/login 200 - 54ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":54,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 12:48:06.078
123	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T12:50:14.731Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	1	127.0.0.1	2025-04-19 12:50:14.732
124	INFO	POST /auth/login 200 - 60ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":60,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 12:50:14.734
125	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T12:56:07.470Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 12:56:07.471
126	INFO	POST /auth/login 200 - 227ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":227,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 12:56:07.485
127	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T13:02:55.054Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 13:02:55.055
128	INFO	POST /auth/login 200 - 141ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":141,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 13:02:55.062
129	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T15:40:08.340Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","method":"login"}	1	127.0.0.1	2025-04-19 15:40:08.341
130	INFO	POST /auth/login 200 - 174ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":174,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 15:40:08.345
131	INFO	Azienda 4 aggiornata	{"descrizione":"Frantoio cloud3                         ","ultimoidsoggetto":258,"email_mittente":"frantoio@cloud3.help","email_password":"!Localcloud3","email_smtp_server":"mail.cloud3.help","email_smtp_port":465,"email_ssl":true,"email_default_oggetto":"Frantoio Cloud3","email_firma":"Cloud3 Srl"}	1	\N	2025-04-19 15:41:21.675
132	INFO	Azienda 5 aggiornata	{"descrizione":"Frantoio                                ","ultimoidsoggetto":521,"email_mittente":"frantoio@cloud3.help","email_password":"!Localcloud3","email_smtp_server":"mail.cloud3.help","email_smtp_port":465,"email_ssl":true,"email_default_oggetto":"Frantoio cloud3","email_firma":"Cloud3 Srl"}	1	\N	2025-04-19 15:42:27.425
133	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T15:44:19.636Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 15:44:19.637
134	INFO	POST /auth/login 200 - 140ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":140,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 15:44:19.644
135	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T15:47:33.626Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 15:47:33.627
136	INFO	POST /auth/login 200 - 142ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":142,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 15:47:33.633
137	ERROR	POST /auth/login 401 - 50ms	{"method":"POST","url":"/auth/login","statusCode":401,"duration":50,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 15:51:31.283
138	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T15:51:43.027Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","method":"login"}	1	127.0.0.1	2025-04-19 15:51:43.028
139	INFO	POST /auth/login 200 - 54ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":54,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 15:51:43.03
140	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T15:53:24.726Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 15:53:24.727
141	INFO	POST /auth/login 200 - 158ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":158,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 15:53:24.732
142	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T15:58:23.041Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 15:58:23.042
143	INFO	POST /auth/login 200 - 204ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":204,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 15:58:23.076
144	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T16:03:20.431Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 16:03:20.432
145	INFO	POST /auth/login 200 - 144ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":144,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 16:03:20.439
146	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T16:04:08.795Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 16:04:08.796
147	INFO	POST /auth/login 200 - 53ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":53,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 16:04:08.798
148	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T16:09:11.027Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 16:09:11.028
149	INFO	POST /auth/login 200 - 139ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":139,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 16:09:11.033
150	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T16:14:48.233Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 16:14:48.234
151	INFO	POST /auth/login 200 - 144ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":144,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 16:14:48.24
152	INFO	Login utente g.baccino@cloud3.srl	{"timestamp":"2025-04-19T16:23:41.827Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","method":"login"}	2	127.0.0.1	2025-04-19 16:23:41.828
153	INFO	POST /auth/login 200 - 176ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":176,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 16:23:41.832
154	ERROR	GET /company/5/tables/linee_lavorazione 500 - 66ms	{"method":"GET","url":"/company/5/tables/linee_lavorazione","statusCode":500,"duration":66,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"}	2	127.0.0.1	2025-04-19 16:23:44.683
155	ERROR	GET /company/5/tables/linee_lavorazione 500 - 28ms	{"method":"GET","url":"/company/5/tables/linee_lavorazione","statusCode":500,"duration":28,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"}	2	127.0.0.1	2025-04-19 16:23:44.901
156	INFO	Login utente admin.cloud@adhocoil.com	{"timestamp":"2025-04-19T16:28:36.812Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","method":"login"}	1	127.0.0.1	2025-04-19 16:28:36.813
157	INFO	POST /auth/login 200 - 145ms	{"method":"POST","url":"/auth/login","statusCode":200,"duration":145,"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0","contentType":"application/json"}	\N	127.0.0.1	2025-04-19 16:28:36.819
\.


--
-- Data for Name: user_aziende; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_aziende (id, user_id, azienda_id, created_at) FROM stdin;
3	2	5	2025-04-19 06:01:42.874
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, nome, cognome, ruolo, username, password, email, ultimo_login, created_at, updated_at, data_token, email_verificata, profilo_completo, token_verifica) FROM stdin;
2	Gabriele            	Baccino             	2	gb	$2b$10$AlaIijOc/3DTef5eY9Aa5OAL2FozTcNU0YpYIgGe28rzryHZZU.zy	g.baccino@cloud3.srl	2025-04-19 16:23:41.822	2025-04-18 14:16:10.323	2025-04-19 16:23:41.823	\N	f	f	\N
1	Amministratore      	Sistema             	1	admin	$2b$10$1F2VGZjvlcslTFcUA.z6jOV.CNLkUxO9j0kOykYQlFSf7aY8tOML.	admin.cloud@adhocoil.com	2025-04-19 16:28:36.809	2025-04-18 13:28:11.823	2025-04-19 16:28:36.81	\N	f	f	\N
\.


--
-- Name: articoli_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.articoli_id_seq', 9, true);


--
-- Name: aziende_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.aziende_id_seq', 5, true);


--
-- Name: categorie_olio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorie_olio_id_seq', 12, true);


--
-- Name: cloud_articoli_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cloud_articoli_id_seq', 1, false);


--
-- Name: cloud_calendario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cloud_calendario_id_seq', 1, false);


--
-- Name: cloud_linee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cloud_linee_id_seq', 1, false);


--
-- Name: cloud_listini_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cloud_listini_id_seq', 1, false);


--
-- Name: cloud_magazzini_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cloud_magazzini_id_seq', 1, false);


--
-- Name: cloud_movimenti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cloud_movimenti_id_seq', 1, false);


--
-- Name: cloud_soggetti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cloud_soggetti_id_seq', 1, false);


--
-- Name: cloud_terreni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cloud_terreni_id_seq', 1, false);


--
-- Name: comuni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comuni_id_seq', 3, true);


--
-- Name: config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.config_id_seq', 4, true);


--
-- Name: frant_articoli_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.frant_articoli_id_seq', 1, false);


--
-- Name: frant_calendario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.frant_calendario_id_seq', 1, false);


--
-- Name: frant_linee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.frant_linee_id_seq', 1, false);


--
-- Name: frant_listini_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.frant_listini_id_seq', 2, true);


--
-- Name: frant_magazzini_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.frant_magazzini_id_seq', 1, true);


--
-- Name: frant_movimenti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.frant_movimenti_id_seq', 1, false);


--
-- Name: frant_soggetti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.frant_soggetti_id_seq', 4, true);


--
-- Name: frant_terreni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.frant_terreni_id_seq', 1, false);


--
-- Name: macroaree_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.macroaree_id_seq', 13, true);


--
-- Name: nazioni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nazioni_id_seq', 1, false);


--
-- Name: olive_to_oli_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.olive_to_oli_id_seq', 4, true);


--
-- Name: origini_specifiche_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.origini_specifiche_id_seq', 22, true);


--
-- Name: province_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.province_id_seq', 109, true);


--
-- Name: syslog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.syslog_id_seq', 157, true);


--
-- Name: user_aziende_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_aziende_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: articoli articoli_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articoli
    ADD CONSTRAINT articoli_pkey PRIMARY KEY (id);


--
-- Name: aziende aziende_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aziende
    ADD CONSTRAINT aziende_pkey PRIMARY KEY (id);


--
-- Name: categorie_olio categorie_olio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorie_olio
    ADD CONSTRAINT categorie_olio_pkey PRIMARY KEY (id);


--
-- Name: cloud_articoli cloud_articoli_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_articoli
    ADD CONSTRAINT cloud_articoli_pkey PRIMARY KEY (id);


--
-- Name: cloud_calendario cloud_calendario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_calendario
    ADD CONSTRAINT cloud_calendario_pkey PRIMARY KEY (id);


--
-- Name: cloud_cisterne cloud_cisterne_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_cisterne
    ADD CONSTRAINT cloud_cisterne_pkey PRIMARY KEY (id);


--
-- Name: cloud_linee cloud_linee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_linee
    ADD CONSTRAINT cloud_linee_pkey PRIMARY KEY (id);


--
-- Name: cloud_listini cloud_listini_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_listini
    ADD CONSTRAINT cloud_listini_pkey PRIMARY KEY (id);


--
-- Name: cloud_magazzini cloud_magazzini_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_magazzini
    ADD CONSTRAINT cloud_magazzini_pkey PRIMARY KEY (id);


--
-- Name: cloud_movimenti cloud_movimenti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_movimenti
    ADD CONSTRAINT cloud_movimenti_pkey PRIMARY KEY (id);


--
-- Name: cloud_soggetti cloud_soggetti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_soggetti
    ADD CONSTRAINT cloud_soggetti_pkey PRIMARY KEY (id);


--
-- Name: cloud_terreni cloud_terreni_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_terreni
    ADD CONSTRAINT cloud_terreni_pkey PRIMARY KEY (id);


--
-- Name: codici_iva codici_iva_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.codici_iva
    ADD CONSTRAINT codici_iva_pkey PRIMARY KEY (id);


--
-- Name: comuni comuni_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comuni
    ADD CONSTRAINT comuni_pkey PRIMARY KEY (id);


--
-- Name: config config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.config
    ADD CONSTRAINT config_pkey PRIMARY KEY (id);


--
-- Name: frant_articoli frant_articoli_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_articoli
    ADD CONSTRAINT frant_articoli_pkey PRIMARY KEY (id);


--
-- Name: frant_calendario frant_calendario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_calendario
    ADD CONSTRAINT frant_calendario_pkey PRIMARY KEY (id);


--
-- Name: frant_cisterne frant_cisterne_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_cisterne
    ADD CONSTRAINT frant_cisterne_pkey PRIMARY KEY (id);


--
-- Name: frant_linee frant_linee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_linee
    ADD CONSTRAINT frant_linee_pkey PRIMARY KEY (id);


--
-- Name: frant_listini frant_listini_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_listini
    ADD CONSTRAINT frant_listini_pkey PRIMARY KEY (id);


--
-- Name: frant_magazzini frant_magazzini_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_magazzini
    ADD CONSTRAINT frant_magazzini_pkey PRIMARY KEY (id);


--
-- Name: frant_movimenti frant_movimenti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_movimenti
    ADD CONSTRAINT frant_movimenti_pkey PRIMARY KEY (id);


--
-- Name: frant_soggetti frant_soggetti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_soggetti
    ADD CONSTRAINT frant_soggetti_pkey PRIMARY KEY (id);


--
-- Name: frant_terreni frant_terreni_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_terreni
    ADD CONSTRAINT frant_terreni_pkey PRIMARY KEY (id);


--
-- Name: macroaree macroaree_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.macroaree
    ADD CONSTRAINT macroaree_pkey PRIMARY KEY (id);


--
-- Name: nazioni nazioni_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nazioni
    ADD CONSTRAINT nazioni_pkey PRIMARY KEY (id);


--
-- Name: olive_to_oli olive_to_oli_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olive_to_oli
    ADD CONSTRAINT olive_to_oli_pkey PRIMARY KEY (id);


--
-- Name: origini_specifiche origini_specifiche_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.origini_specifiche
    ADD CONSTRAINT origini_specifiche_pkey PRIMARY KEY (id);


--
-- Name: province province_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.province
    ADD CONSTRAINT province_pkey PRIMARY KEY (id);


--
-- Name: syslog syslog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.syslog
    ADD CONSTRAINT syslog_pkey PRIMARY KEY (id);


--
-- Name: user_aziende user_aziende_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_aziende
    ADD CONSTRAINT user_aziende_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: aziende_codice_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX aziende_codice_key ON public.aziende USING btree (codice);


--
-- Name: config_chiave_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX config_chiave_key ON public.config USING btree (chiave);


--
-- Name: idx_cloud_articoli_categ_olio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_articoli_categ_olio ON public.cloud_articoli USING btree (categ_olio);


--
-- Name: idx_cloud_articoli_descrizione; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_articoli_descrizione ON public.cloud_articoli USING btree (descrizione);


--
-- Name: idx_cloud_articoli_tipologia; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_articoli_tipologia ON public.cloud_articoli USING btree (tipologia);


--
-- Name: idx_cloud_calendario_data_fine; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_calendario_data_fine ON public.cloud_calendario USING btree (data_fine);


--
-- Name: idx_cloud_calendario_data_inizio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_calendario_data_inizio ON public.cloud_calendario USING btree (data_inizio);


--
-- Name: idx_cloud_calendario_id_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_calendario_id_cliente ON public.cloud_calendario USING btree (id_cliente);


--
-- Name: idx_cloud_calendario_id_linea; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_calendario_id_linea ON public.cloud_calendario USING btree (id_linea);


--
-- Name: idx_cloud_calendario_id_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_calendario_id_user ON public.cloud_calendario USING btree (id_user);


--
-- Name: idx_cloud_calendario_stato; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_calendario_stato ON public.cloud_calendario USING btree (stato);


--
-- Name: idx_cloud_cisterne_id_articolo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_cisterne_id_articolo ON public.cloud_cisterne USING btree (id_articolo);


--
-- Name: idx_cloud_cisterne_id_codicesoggetto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_cisterne_id_codicesoggetto ON public.cloud_cisterne USING btree (id_codicesoggetto);


--
-- Name: idx_cloud_cisterne_id_magazzino; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_cisterne_id_magazzino ON public.cloud_cisterne USING btree (id_magazzino);


--
-- Name: idx_cloud_linee_id_magazzino; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_linee_id_magazzino ON public.cloud_linee USING btree (id_magazzino);


--
-- Name: idx_cloud_linee_id_oliva; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_linee_id_oliva ON public.cloud_linee USING btree (id_oliva);


--
-- Name: idx_cloud_listini_cod_articolo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_listini_cod_articolo ON public.cloud_listini USING btree (cod_articolo);


--
-- Name: idx_cloud_movimenti_campo01; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_movimenti_campo01 ON public.cloud_movimenti USING btree (campo01);


--
-- Name: idx_cloud_soggetti_descrizione; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_soggetti_descrizione ON public.cloud_soggetti USING btree (descrizione);


--
-- Name: idx_cloud_terreni_cod_cli; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cloud_terreni_cod_cli ON public.cloud_terreni USING btree (cod_cli);


--
-- Name: idx_frant_articoli_categ_olio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_articoli_categ_olio ON public.frant_articoli USING btree (categ_olio);


--
-- Name: idx_frant_articoli_descrizione; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_articoli_descrizione ON public.frant_articoli USING btree (descrizione);


--
-- Name: idx_frant_articoli_tipologia; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_articoli_tipologia ON public.frant_articoli USING btree (tipologia);


--
-- Name: idx_frant_calendario_data_fine; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_calendario_data_fine ON public.frant_calendario USING btree (data_fine);


--
-- Name: idx_frant_calendario_data_inizio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_calendario_data_inizio ON public.frant_calendario USING btree (data_inizio);


--
-- Name: idx_frant_calendario_id_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_calendario_id_cliente ON public.frant_calendario USING btree (id_cliente);


--
-- Name: idx_frant_calendario_id_linea; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_calendario_id_linea ON public.frant_calendario USING btree (id_linea);


--
-- Name: idx_frant_calendario_id_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_calendario_id_user ON public.frant_calendario USING btree (id_user);


--
-- Name: idx_frant_calendario_stato; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_calendario_stato ON public.frant_calendario USING btree (stato);


--
-- Name: idx_frant_cisterne_id_articolo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_cisterne_id_articolo ON public.frant_cisterne USING btree (id_articolo);


--
-- Name: idx_frant_cisterne_id_codicesoggetto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_cisterne_id_codicesoggetto ON public.frant_cisterne USING btree (id_codicesoggetto);


--
-- Name: idx_frant_cisterne_id_magazzino; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_cisterne_id_magazzino ON public.frant_cisterne USING btree (id_magazzino);


--
-- Name: idx_frant_linee_id_magazzino; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_linee_id_magazzino ON public.frant_linee USING btree (id_magazzino);


--
-- Name: idx_frant_linee_id_oliva; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_linee_id_oliva ON public.frant_linee USING btree (id_oliva);


--
-- Name: idx_frant_listini_cod_articolo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_listini_cod_articolo ON public.frant_listini USING btree (cod_articolo);


--
-- Name: idx_frant_movimenti_campo01; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_movimenti_campo01 ON public.frant_movimenti USING btree (campo01);


--
-- Name: idx_frant_soggetti_descrizione; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_soggetti_descrizione ON public.frant_soggetti USING btree (descrizione);


--
-- Name: idx_frant_terreni_cod_cli; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_frant_terreni_cod_cli ON public.frant_terreni USING btree (cod_cli);


--
-- Name: user_aziende_user_id_azienda_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_aziende_user_id_azienda_id_key ON public.user_aziende USING btree (user_id, azienda_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: articoli articoli_categ_olio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articoli
    ADD CONSTRAINT articoli_categ_olio_fkey FOREIGN KEY (categ_olio) REFERENCES public.categorie_olio(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: articoli articoli_cod_iva_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articoli
    ADD CONSTRAINT articoli_cod_iva_fkey FOREIGN KEY (cod_iva) REFERENCES public.codici_iva(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: articoli articoli_macroarea_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articoli
    ADD CONSTRAINT articoli_macroarea_fkey FOREIGN KEY (macroarea) REFERENCES public.macroaree(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cloud_articoli cloud_articoli_categ_olio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_articoli
    ADD CONSTRAINT cloud_articoli_categ_olio_fkey FOREIGN KEY (categ_olio) REFERENCES public.categorie_olio(id);


--
-- Name: cloud_articoli cloud_articoli_cod_iva_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_articoli
    ADD CONSTRAINT cloud_articoli_cod_iva_fkey FOREIGN KEY (cod_iva) REFERENCES public.codici_iva(id);


--
-- Name: cloud_articoli cloud_articoli_macroarea_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_articoli
    ADD CONSTRAINT cloud_articoli_macroarea_fkey FOREIGN KEY (macroarea) REFERENCES public.macroaree(id);


--
-- Name: cloud_calendario cloud_calendario_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_calendario
    ADD CONSTRAINT cloud_calendario_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.cloud_soggetti(id);


--
-- Name: cloud_calendario cloud_calendario_id_linea_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_calendario
    ADD CONSTRAINT cloud_calendario_id_linea_fkey FOREIGN KEY (id_linea) REFERENCES public.cloud_linee(id);


--
-- Name: cloud_calendario cloud_calendario_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_calendario
    ADD CONSTRAINT cloud_calendario_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: cloud_calendario cloud_calendario_tipologia_oliva_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_calendario
    ADD CONSTRAINT cloud_calendario_tipologia_oliva_fkey FOREIGN KEY (tipologia_oliva) REFERENCES public.cloud_articoli(id);


--
-- Name: cloud_cisterne cloud_cisterne_id_articolo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_cisterne
    ADD CONSTRAINT cloud_cisterne_id_articolo_fkey FOREIGN KEY (id_articolo) REFERENCES public.articoli(id);


--
-- Name: cloud_cisterne cloud_cisterne_id_codicesoggetto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_cisterne
    ADD CONSTRAINT cloud_cisterne_id_codicesoggetto_fkey FOREIGN KEY (id_codicesoggetto) REFERENCES public.cloud_soggetti(id);


--
-- Name: cloud_cisterne cloud_cisterne_id_magazzino_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_cisterne
    ADD CONSTRAINT cloud_cisterne_id_magazzino_fkey FOREIGN KEY (id_magazzino) REFERENCES public.cloud_magazzini(id);


--
-- Name: cloud_linee cloud_linee_id_magazzino_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_linee
    ADD CONSTRAINT cloud_linee_id_magazzino_fkey FOREIGN KEY (id_magazzino) REFERENCES public.cloud_magazzini(id);


--
-- Name: cloud_linee cloud_linee_id_oliva_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_linee
    ADD CONSTRAINT cloud_linee_id_oliva_fkey FOREIGN KEY (id_oliva) REFERENCES public.cloud_articoli(id);


--
-- Name: cloud_listini cloud_listini_cod_articolo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_listini
    ADD CONSTRAINT cloud_listini_cod_articolo_fkey FOREIGN KEY (cod_articolo) REFERENCES public.articoli(id);


--
-- Name: cloud_listini cloud_listini_cod_iva_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_listini
    ADD CONSTRAINT cloud_listini_cod_iva_fkey FOREIGN KEY (cod_iva) REFERENCES public.codici_iva(id);


--
-- Name: cloud_soggetti cloud_soggetti_comune_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_soggetti
    ADD CONSTRAINT cloud_soggetti_comune_fkey FOREIGN KEY (comune) REFERENCES public.comuni(id);


--
-- Name: cloud_soggetti cloud_soggetti_nazione_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_soggetti
    ADD CONSTRAINT cloud_soggetti_nazione_fkey FOREIGN KEY (nazione) REFERENCES public.nazioni(id);


--
-- Name: cloud_soggetti cloud_soggetti_olivedef_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_soggetti
    ADD CONSTRAINT cloud_soggetti_olivedef_fkey FOREIGN KEY (olivedef) REFERENCES public.articoli(id);


--
-- Name: cloud_soggetti cloud_soggetti_provincia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_soggetti
    ADD CONSTRAINT cloud_soggetti_provincia_fkey FOREIGN KEY (provincia) REFERENCES public.province(id);


--
-- Name: cloud_terreni cloud_terreni_cod_cli_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloud_terreni
    ADD CONSTRAINT cloud_terreni_cod_cli_fkey FOREIGN KEY (cod_cli) REFERENCES public.cloud_soggetti(id);


--
-- Name: frant_articoli frant_articoli_categ_olio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_articoli
    ADD CONSTRAINT frant_articoli_categ_olio_fkey FOREIGN KEY (categ_olio) REFERENCES public.categorie_olio(id);


--
-- Name: frant_articoli frant_articoli_cod_iva_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_articoli
    ADD CONSTRAINT frant_articoli_cod_iva_fkey FOREIGN KEY (cod_iva) REFERENCES public.codici_iva(id);


--
-- Name: frant_articoli frant_articoli_macroarea_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_articoli
    ADD CONSTRAINT frant_articoli_macroarea_fkey FOREIGN KEY (macroarea) REFERENCES public.macroaree(id);


--
-- Name: frant_calendario frant_calendario_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_calendario
    ADD CONSTRAINT frant_calendario_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.frant_soggetti(id);


--
-- Name: frant_calendario frant_calendario_id_linea_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_calendario
    ADD CONSTRAINT frant_calendario_id_linea_fkey FOREIGN KEY (id_linea) REFERENCES public.frant_linee(id);


--
-- Name: frant_calendario frant_calendario_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_calendario
    ADD CONSTRAINT frant_calendario_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: frant_calendario frant_calendario_tipologia_oliva_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_calendario
    ADD CONSTRAINT frant_calendario_tipologia_oliva_fkey FOREIGN KEY (tipologia_oliva) REFERENCES public.frant_articoli(id);


--
-- Name: frant_cisterne frant_cisterne_id_articolo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_cisterne
    ADD CONSTRAINT frant_cisterne_id_articolo_fkey FOREIGN KEY (id_articolo) REFERENCES public.articoli(id);


--
-- Name: frant_cisterne frant_cisterne_id_codicesoggetto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_cisterne
    ADD CONSTRAINT frant_cisterne_id_codicesoggetto_fkey FOREIGN KEY (id_codicesoggetto) REFERENCES public.frant_soggetti(id);


--
-- Name: frant_cisterne frant_cisterne_id_magazzino_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_cisterne
    ADD CONSTRAINT frant_cisterne_id_magazzino_fkey FOREIGN KEY (id_magazzino) REFERENCES public.frant_magazzini(id);


--
-- Name: frant_linee frant_linee_id_magazzino_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_linee
    ADD CONSTRAINT frant_linee_id_magazzino_fkey FOREIGN KEY (id_magazzino) REFERENCES public.frant_magazzini(id);


--
-- Name: frant_linee frant_linee_id_oliva_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_linee
    ADD CONSTRAINT frant_linee_id_oliva_fkey FOREIGN KEY (id_oliva) REFERENCES public.frant_articoli(id);


--
-- Name: frant_listini frant_listini_cod_articolo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_listini
    ADD CONSTRAINT frant_listini_cod_articolo_fkey FOREIGN KEY (cod_articolo) REFERENCES public.articoli(id);


--
-- Name: frant_listini frant_listini_cod_iva_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_listini
    ADD CONSTRAINT frant_listini_cod_iva_fkey FOREIGN KEY (cod_iva) REFERENCES public.codici_iva(id);


--
-- Name: frant_soggetti frant_soggetti_comune_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_soggetti
    ADD CONSTRAINT frant_soggetti_comune_fkey FOREIGN KEY (comune) REFERENCES public.comuni(id);


--
-- Name: frant_soggetti frant_soggetti_nazione_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_soggetti
    ADD CONSTRAINT frant_soggetti_nazione_fkey FOREIGN KEY (nazione) REFERENCES public.nazioni(id);


--
-- Name: frant_soggetti frant_soggetti_olivedef_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_soggetti
    ADD CONSTRAINT frant_soggetti_olivedef_fkey FOREIGN KEY (olivedef) REFERENCES public.articoli(id);


--
-- Name: frant_soggetti frant_soggetti_provincia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_soggetti
    ADD CONSTRAINT frant_soggetti_provincia_fkey FOREIGN KEY (provincia) REFERENCES public.province(id);


--
-- Name: frant_terreni frant_terreni_cod_cli_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frant_terreni
    ADD CONSTRAINT frant_terreni_cod_cli_fkey FOREIGN KEY (cod_cli) REFERENCES public.frant_soggetti(id);


--
-- Name: olive_to_oli olive_to_oli_cod_olio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olive_to_oli
    ADD CONSTRAINT olive_to_oli_cod_olio_fkey FOREIGN KEY (cod_olio) REFERENCES public.articoli(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: olive_to_oli olive_to_oli_cod_olive_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olive_to_oli
    ADD CONSTRAINT olive_to_oli_cod_olive_fkey FOREIGN KEY (cod_olive) REFERENCES public.articoli(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: syslog syslog_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.syslog
    ADD CONSTRAINT syslog_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_aziende user_aziende_azienda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_aziende
    ADD CONSTRAINT user_aziende_azienda_id_fkey FOREIGN KEY (azienda_id) REFERENCES public.aziende(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_aziende user_aziende_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_aziende
    ADD CONSTRAINT user_aziende_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

