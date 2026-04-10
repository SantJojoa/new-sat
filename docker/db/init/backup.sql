--
-- PostgreSQL database dump
--

\restrict 2pI8ihkp6y7Gc2ffUzfjrDL8eWaVNcbCYLuZt6UVvcADbxIujI466WUMcwBTf8e

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: SCHEMA; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA "SCHEMA";


ALTER SCHEMA "SCHEMA" OWNER TO postgres;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _SalidasAreasParticipantes; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA"."_SalidasAreasParticipantes" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "SCHEMA"."_SalidasAreasParticipantes" OWNER TO postgres;

--
-- Name: _SalidasEntidades; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA"."_SalidasEntidades" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "SCHEMA"."_SalidasEntidades" OWNER TO postgres;

--
-- Name: _SalidasIdsn; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA"."_SalidasIdsn" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "SCHEMA"."_SalidasIdsn" OWNER TO postgres;

--
-- Name: _SalidasIps; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA"."_SalidasIps" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "SCHEMA"."_SalidasIps" OWNER TO postgres;

--
-- Name: _SalidasMunicipios; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA"."_SalidasMunicipios" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "SCHEMA"."_SalidasMunicipios" OWNER TO postgres;

--
-- Name: _SalidasOrganizaciones; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA"."_SalidasOrganizaciones" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "SCHEMA"."_SalidasOrganizaciones" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA"._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE "SCHEMA"._prisma_migrations OWNER TO postgres;

--
-- Name: areas; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".areas (
    id text NOT NULL,
    name text NOT NULL,
    subdireccion_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".areas OWNER TO postgres;

--
-- Name: articulaciones; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".articulaciones (
    id text NOT NULL,
    codigo text NOT NULL,
    tipo_programacion text NOT NULL,
    tema text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_final timestamp(3) without time zone NOT NULL,
    jornada text NOT NULL,
    instituciones_convocadas text,
    transporte_medio text,
    transporte_num_instituciones integer,
    lugar_evento_id text,
    responsable_articulacion text,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    observaciones text,
    fecha_solicitud timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    solicitante_id text NOT NULL,
    area_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".articulaciones OWNER TO postgres;

--
-- Name: eapb; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".eapb (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".eapb OWNER TO postgres;

--
-- Name: eapb_actores; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".eapb_actores (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".eapb_actores OWNER TO postgres;

--
-- Name: entidades; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".entidades (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".entidades OWNER TO postgres;

--
-- Name: idsn; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".idsn (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".idsn OWNER TO postgres;

--
-- Name: ips; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".ips (
    id text NOT NULL,
    name text NOT NULL,
    nit text,
    municipio_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".ips OWNER TO postgres;

--
-- Name: ivc; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".ivc (
    id text NOT NULL,
    codigo text NOT NULL,
    tipo_programacion text NOT NULL,
    tema text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_final timestamp(3) without time zone NOT NULL,
    jornada text NOT NULL,
    instituciones_convocadas text,
    transporte_medio text,
    transporte_num_instituciones integer,
    lugar_evento_id text,
    responsable_articulacion text,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    observaciones text,
    fecha_solicitud timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    solicitante_id text NOT NULL,
    area_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".ivc OWNER TO postgres;

--
-- Name: modules; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".modules (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    path text,
    "order" integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    parent_id text
);


ALTER TABLE "SCHEMA".modules OWNER TO postgres;

--
-- Name: municipios; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".municipios (
    id text NOT NULL,
    name text NOT NULL,
    code text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".municipios OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".notifications (
    id text NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    link text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "SCHEMA".notifications OWNER TO postgres;

--
-- Name: organizaciones; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".organizaciones (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".organizaciones OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".permissions (
    id text NOT NULL,
    user_type_id text NOT NULL,
    module_id text NOT NULL,
    can_view boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    can_approve boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".permissions OWNER TO postgres;

--
-- Name: salida_eapb; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".salida_eapb (
    id text NOT NULL,
    salida_id text NOT NULL,
    eapb_id text NOT NULL,
    actor_id text
);


ALTER TABLE "SCHEMA".salida_eapb OWNER TO postgres;

--
-- Name: salidas; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".salidas (
    id text NOT NULL,
    codigo text NOT NULL,
    tipo_salida text NOT NULL,
    subtipo_salida text,
    tema text NOT NULL,
    descripcion text,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_final timestamp(3) without time zone NOT NULL,
    jornada text NOT NULL,
    fecha_solicitud timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_aprobacion timestamp(3) without time zone,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    observaciones text,
    solicitante_id text NOT NULL,
    aprobador_id text,
    area_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    lugar_evento_id text,
    transporte_medio text,
    transporte_responsables text,
    instituciones_convocadas integer DEFAULT 0,
    municipios_convocados text
);


ALTER TABLE "SCHEMA".salidas OWNER TO postgres;

--
-- Name: solicitudes_union; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".solicitudes_union (
    id text NOT NULL,
    salida_id text NOT NULL,
    solicitante_id text NOT NULL,
    area_solicitante_id text NOT NULL,
    mensaje text,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    respuesta text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".solicitudes_union OWNER TO postgres;

--
-- Name: subdirecciones; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".subdirecciones (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE "SCHEMA".subdirecciones OWNER TO postgres;

--
-- Name: user_types; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".user_types (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    level integer DEFAULT 0 NOT NULL
);


ALTER TABLE "SCHEMA".user_types OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: SCHEMA; Owner: postgres
--

CREATE TABLE "SCHEMA".users (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    user_type_id text NOT NULL,
    names text NOT NULL,
    last_name text NOT NULL,
    num_id text NOT NULL,
    area_id text,
    charge text,
    email text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    subdireccion_id text
);


ALTER TABLE "SCHEMA".users OWNER TO postgres;

--
-- Name: _SalidasAreasParticipantes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_SalidasAreasParticipantes" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_SalidasAreasParticipantes" OWNER TO postgres;

--
-- Name: _SalidasEntidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_SalidasEntidades" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_SalidasEntidades" OWNER TO postgres;

--
-- Name: _SalidasIdsn; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_SalidasIdsn" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_SalidasIdsn" OWNER TO postgres;

--
-- Name: _SalidasMunicipios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_SalidasMunicipios" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_SalidasMunicipios" OWNER TO postgres;

--
-- Name: _SalidasOrganizaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_SalidasOrganizaciones" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_SalidasOrganizaciones" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.areas (
    id text NOT NULL,
    name text NOT NULL,
    subdireccion_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.areas OWNER TO postgres;

--
-- Name: articulaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.articulaciones (
    id text NOT NULL,
    codigo text NOT NULL,
    tipo_programacion text NOT NULL,
    tema text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_final timestamp(3) without time zone NOT NULL,
    jornada text NOT NULL,
    instituciones_convocadas text,
    transporte_medio text,
    transporte_num_instituciones integer,
    lugar_evento_id text,
    responsable_articulacion text,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    observaciones text,
    fecha_solicitud timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    solicitante_id text NOT NULL,
    area_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.articulaciones OWNER TO postgres;

--
-- Name: eapb; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eapb (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.eapb OWNER TO postgres;

--
-- Name: eapb_actores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eapb_actores (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.eapb_actores OWNER TO postgres;

--
-- Name: entidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entidades (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.entidades OWNER TO postgres;

--
-- Name: idsn; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.idsn (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.idsn OWNER TO postgres;

--
-- Name: ips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ips (
    id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    type text NOT NULL
);


ALTER TABLE public.ips OWNER TO postgres;

--
-- Name: ips_actores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ips_actores (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ips_actores OWNER TO postgres;

--
-- Name: ivc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ivc (
    id text NOT NULL,
    codigo text NOT NULL,
    tipo_programacion text NOT NULL,
    tema text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_final timestamp(3) without time zone NOT NULL,
    jornada text NOT NULL,
    instituciones_convocadas text,
    transporte_medio text,
    transporte_num_instituciones integer,
    lugar_evento_id text,
    responsable_articulacion text,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    observaciones text,
    fecha_solicitud timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    solicitante_id text NOT NULL,
    area_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ivc OWNER TO postgres;

--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    path text,
    "order" integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    parent_id text
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- Name: municipios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.municipios (
    id text NOT NULL,
    name text NOT NULL,
    code text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.municipios OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    link text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: organizaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizaciones (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.organizaciones OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    user_type_id text NOT NULL,
    module_id text NOT NULL,
    can_view boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    can_approve boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: salida_eapb; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salida_eapb (
    id text NOT NULL,
    salida_id text NOT NULL,
    eapb_id text NOT NULL,
    actor_id text
);


ALTER TABLE public.salida_eapb OWNER TO postgres;

--
-- Name: salida_ips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salida_ips (
    id text NOT NULL,
    salida_id text NOT NULL,
    ips_id text NOT NULL,
    actor_id text
);


ALTER TABLE public.salida_ips OWNER TO postgres;

--
-- Name: salidas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salidas (
    id text NOT NULL,
    codigo text NOT NULL,
    tipo_salida text NOT NULL,
    subtipo_salida text,
    tema text NOT NULL,
    descripcion text,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_final timestamp(3) without time zone NOT NULL,
    jornada text NOT NULL,
    fecha_solicitud timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_aprobacion timestamp(3) without time zone,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    observaciones text,
    solicitante_id text NOT NULL,
    aprobador_id text,
    area_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    lugar_evento_id text,
    transporte_medio text,
    transporte_responsables text,
    instituciones_convocadas integer DEFAULT 0,
    municipios_convocados text
);


ALTER TABLE public.salidas OWNER TO postgres;

--
-- Name: solicitudes_union; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitudes_union (
    id text NOT NULL,
    salida_id text NOT NULL,
    solicitante_id text NOT NULL,
    area_solicitante_id text NOT NULL,
    mensaje text,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    respuesta text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.solicitudes_union OWNER TO postgres;

--
-- Name: subdirecciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subdirecciones (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subdirecciones OWNER TO postgres;

--
-- Name: user_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_types (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    level integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.user_types OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    user_type_id text NOT NULL,
    names text NOT NULL,
    last_name text NOT NULL,
    num_id text NOT NULL,
    area_id text,
    charge text,
    email text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    subdireccion_id text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: ventana_programacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ventana_programacion (
    id text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_fin timestamp(3) without time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ventana_programacion OWNER TO postgres;

--
-- Data for Name: _SalidasAreasParticipantes; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA"."_SalidasAreasParticipantes" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _SalidasEntidades; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA"."_SalidasEntidades" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _SalidasIdsn; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA"."_SalidasIdsn" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _SalidasIps; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA"."_SalidasIps" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _SalidasMunicipios; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA"."_SalidasMunicipios" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _SalidasOrganizaciones; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA"."_SalidasOrganizaciones" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA"._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
2c2acaf5-597d-40f4-9631-06413e8b972b	d09136244fd8dd8b9b0e9160bfb7d5f58433a6716086493c3dabdc0d73977566	2026-04-07 09:31:10.738328-05	20260325214457_add_articulaciones_and_ivc	\N	\N	2026-04-07 09:31:10.712379-05	1
31cb63f4-3307-44cb-9dfb-32f74f432769	7a6158567e3450370cce6b7b52186bc4b2f2e4183b65ec686685c98d50cb53c0	2026-04-07 09:31:10.374433-05	20260130164213_init_complete_schema	\N	\N	2026-04-07 09:31:10.31386-05	1
dc3770f0-3eaa-4641-bc81-0aff4c4d66f2	9764541c000ea094a7dc72e5c0400e3e96a02aaefaa77c0c58da841c76eecce4	2026-04-07 09:31:10.538992-05	20260202200436_refactor_salidas_comisiones	\N	\N	2026-04-07 09:31:10.375504-05	1
36a824d9-f551-4b0d-87c0-f834d5818faf	49c42c57d2df80a4b1723f889bf45f53653d466c336b7ffd2a7041c808e83755	2026-04-07 09:31:10.545198-05	20260203164422_add_transporte_fields	\N	\N	2026-04-07 09:31:10.539572-05	1
b780f5c8-5ef6-4d25-aedb-b45368d94b7e	7bf75438e9b72b7d35ea25d2b87a74c6266617fd7618cfd6cf252331f5a834d9	2026-04-07 09:31:10.778925-05	20260330000000_add_eapb_actores_junction	\N	\N	2026-04-07 09:31:10.740047-05	1
63b91b94-4136-48f0-a3b1-4d885b2653c5	d13d9dcd53359bb8d39343e78deb65004d9e141cb697370d7da6b4a9c733bc07	2026-04-07 09:31:10.564918-05	20260210155211_change_instituciones_to_string	\N	\N	2026-04-07 09:31:10.545903-05	1
a3277a63-be7d-45c6-9993-e15ad4a7cdb1	4b350c412bf96808f8461da49ffbf2150ca9883a4482595e880191e6933162a3	2026-04-07 09:31:10.569077-05	20260210160017_revert_instituciones_to_int	\N	\N	2026-04-07 09:31:10.565666-05	1
969d75da-93f8-4d2b-ba69-71b12f67ba73	c64abf76926875283e41b5fb980c28c5239f2cd1585dc3276df27e8b2f44e7fe	2026-04-07 09:31:10.572215-05	20260210163453_add_municipios_convocados	\N	\N	2026-04-07 09:31:10.569631-05	1
334da55b-17aa-459d-b4e8-89ea54702ea9	5197508639e4c1fbd8670c3bc0d36591e44a4377c1c2d286a566c72b4052cd55	2026-04-07 09:31:10.60593-05	20260303152655_add_idsn_participant	\N	\N	2026-04-07 09:31:10.572838-05	1
f3e8b542-f88c-410e-99ea-c0d31ac63470	3c4a92a241bc28367083262967300fd3f3d73dad7d22d1f46002dec7ab4cc3f4	2026-04-07 09:31:10.613926-05	20260311190000_add_subdireccion_to_users	\N	\N	2026-04-07 09:31:10.607381-05	1
6168d9ec-b1d5-4928-9407-c85835297d30	646080089e2913802d32d89cc0eb6270ae8cfc1fd9c4c5ae305d94f20c89b00e	2026-04-07 09:31:10.637261-05	20260316205148_add_solicitudes_union	\N	\N	2026-04-07 09:31:10.615047-05	1
3135e2ca-be79-4cbd-af17-2e6c476d4336	dd1cbcbb44755f41d8f3d909e5a5fad4ceacb81fd1c61fc928830c676624d163	2026-04-07 09:31:10.660692-05	20260318160928_add_areas_participantes	\N	\N	2026-04-07 09:31:10.638763-05	1
c90151f9-5551-4211-ad2b-647206c83db6	9710be351d3686c5ebf65a28d70fe2a5f9820362e8ed6fd13b78ba1f05220cd6	2026-04-07 09:31:10.676508-05	20260318164419_add_notifications_and_areas_participantes	\N	\N	2026-04-07 09:31:10.662226-05	1
c976c440-b0da-4843-917f-b5e4ab6de028	cf9462bcdc273d08e7a2f0288a3c373755c570438453a6b5c6f0c7651563218f	2026-04-07 09:31:10.711755-05	20260325212656_add_articulaciones	\N	\N	2026-04-07 09:31:10.678463-05	1
\.


--
-- Data for Name: areas; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".areas (id, name, subdireccion_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: articulaciones; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".articulaciones (id, codigo, tipo_programacion, tema, fecha_inicio, fecha_final, jornada, instituciones_convocadas, transporte_medio, transporte_num_instituciones, lugar_evento_id, responsable_articulacion, estado, observaciones, fecha_solicitud, solicitante_id, area_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: eapb; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".eapb (id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: eapb_actores; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".eapb_actores (id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: entidades; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".entidades (id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: idsn; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".idsn (id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ips; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".ips (id, name, nit, municipio_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ivc; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".ivc (id, codigo, tipo_programacion, tema, fecha_inicio, fecha_final, jornada, instituciones_convocadas, transporte_medio, transporte_num_instituciones, lugar_evento_id, responsable_articulacion, estado, observaciones, fecha_solicitud, solicitante_id, area_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".modules (id, name, description, icon, path, "order", is_active, created_at, updated_at, parent_id) FROM stdin;
\.


--
-- Data for Name: municipios; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".municipios (id, name, code, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".notifications (id, user_id, type, title, message, read, link, created_at) FROM stdin;
\.


--
-- Data for Name: organizaciones; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".organizaciones (id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".permissions (id, user_type_id, module_id, can_view, can_create, can_edit, can_delete, can_approve, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: salida_eapb; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".salida_eapb (id, salida_id, eapb_id, actor_id) FROM stdin;
\.


--
-- Data for Name: salidas; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".salidas (id, codigo, tipo_salida, subtipo_salida, tema, descripcion, fecha_inicio, fecha_final, jornada, fecha_solicitud, fecha_aprobacion, estado, observaciones, solicitante_id, aprobador_id, area_id, created_at, updated_at, lugar_evento_id, transporte_medio, transporte_responsables, instituciones_convocadas, municipios_convocados) FROM stdin;
\.


--
-- Data for Name: solicitudes_union; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".solicitudes_union (id, salida_id, solicitante_id, area_solicitante_id, mensaje, estado, respuesta, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subdirecciones; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".subdirecciones (id, name, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_types; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".user_types (id, name, description, created_at, updated_at, level) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: SCHEMA; Owner: postgres
--

COPY "SCHEMA".users (id, username, password, user_type_id, names, last_name, num_id, area_id, charge, email, is_active, created_at, updated_at, subdireccion_id) FROM stdin;
\.


--
-- Data for Name: _SalidasAreasParticipantes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_SalidasAreasParticipantes" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _SalidasEntidades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_SalidasEntidades" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _SalidasIdsn; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_SalidasIdsn" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _SalidasMunicipios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_SalidasMunicipios" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _SalidasOrganizaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_SalidasOrganizaciones" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
e636f61d-e23e-4120-b164-d8b1cf867981	d09136244fd8dd8b9b0e9160bfb7d5f58433a6716086493c3dabdc0d73977566	2026-04-07 09:50:24.117016-05	20260325214457_add_articulaciones_and_ivc	\N	\N	2026-04-07 09:50:24.102411-05	1
e81e5757-ba7d-4832-a1e1-63dfd0d650b0	7a6158567e3450370cce6b7b52186bc4b2f2e4183b65ec686685c98d50cb53c0	2026-04-07 09:50:23.858134-05	20260130164213_init_complete_schema	\N	\N	2026-04-07 09:50:23.770765-05	1
872cf28b-35c4-4139-9fb3-63b53328d36d	9764541c000ea094a7dc72e5c0400e3e96a02aaefaa77c0c58da841c76eecce4	2026-04-07 09:50:23.997843-05	20260202200436_refactor_salidas_comisiones	\N	\N	2026-04-07 09:50:23.860061-05	1
070e725c-708e-4eb1-b836-9b4f3a8fc200	49c42c57d2df80a4b1723f889bf45f53653d466c336b7ffd2a7041c808e83755	2026-04-07 09:50:24.002915-05	20260203164422_add_transporte_fields	\N	\N	2026-04-07 09:50:23.998644-05	1
95acacf8-2cfd-418b-95b0-ee1d1aec8b2d	7bf75438e9b72b7d35ea25d2b87a74c6266617fd7618cfd6cf252331f5a834d9	2026-04-07 09:50:24.152568-05	20260330000000_add_eapb_actores_junction	\N	\N	2026-04-07 09:50:24.117704-05	1
31a52dff-7415-4484-90c8-c3912f75852a	d13d9dcd53359bb8d39343e78deb65004d9e141cb697370d7da6b4a9c733bc07	2026-04-07 09:50:24.014052-05	20260210155211_change_instituciones_to_string	\N	\N	2026-04-07 09:50:24.003582-05	1
68c11337-2d99-4931-aa5b-25bf18cea825	4b350c412bf96808f8461da49ffbf2150ca9883a4482595e880191e6933162a3	2026-04-07 09:50:24.017944-05	20260210160017_revert_instituciones_to_int	\N	\N	2026-04-07 09:50:24.014716-05	1
c31ce61d-d904-4916-9f47-9033165179e6	c64abf76926875283e41b5fb980c28c5239f2cd1585dc3276df27e8b2f44e7fe	2026-04-07 09:50:24.020955-05	20260210163453_add_municipios_convocados	\N	\N	2026-04-07 09:50:24.018588-05	1
720cb287-b27d-4e0b-ae9e-935df3da7934	b0d358aaa94adaebfe080182ac6fde886f5d58038e3196089258ae3bb4d7cf07	2026-04-08 11:10:01.697703-05	20260408000000_ips_type_and_actors	\N	\N	2026-04-08 11:10:01.602398-05	1
d8372729-bc7c-4e57-929d-1463a35c9b7e	5197508639e4c1fbd8670c3bc0d36591e44a4377c1c2d286a566c72b4052cd55	2026-04-07 09:50:24.041819-05	20260303152655_add_idsn_participant	\N	\N	2026-04-07 09:50:24.0215-05	1
bf214f61-1f2c-4bd9-b77f-9062191349bf	3c4a92a241bc28367083262967300fd3f3d73dad7d22d1f46002dec7ab4cc3f4	2026-04-07 09:50:24.046423-05	20260311190000_add_subdireccion_to_users	\N	\N	2026-04-07 09:50:24.042609-05	1
ecc69e20-8c96-4431-9d06-b49a4903113c	4c83ac007505dc58ee60036ab596c42572d178feee5904e335aab9247491f870	2026-04-08 16:23:47.184813-05	20260408172000_reset_entidades	\N	\N	2026-04-08 16:23:47.166585-05	1
c2208387-99ba-4444-9a91-7deb42c0a93f	646080089e2913802d32d89cc0eb6270ae8cfc1fd9c4c5ae305d94f20c89b00e	2026-04-07 09:50:24.060475-05	20260316205148_add_solicitudes_union	\N	\N	2026-04-07 09:50:24.047052-05	1
92183d2a-0eb4-42aa-97a1-4e588a18421d	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2026-04-08 11:10:18.774087-05	20260408161002_ips_type_and_actors	\N	\N	2026-04-08 11:10:18.77231-05	1
a805bfa1-f6b5-40fb-860d-82309a55ff5e	dd1cbcbb44755f41d8f3d909e5a5fad4ceacb81fd1c61fc928830c676624d163	2026-04-07 09:50:24.07461-05	20260318160928_add_areas_participantes	\N	\N	2026-04-07 09:50:24.061099-05	1
84967b64-2504-45fa-ab5a-8eed68c49650	9710be351d3686c5ebf65a28d70fe2a5f9820362e8ed6fd13b78ba1f05220cd6	2026-04-07 09:50:24.085532-05	20260318164419_add_notifications_and_areas_participantes	\N	\N	2026-04-07 09:50:24.075249-05	1
9e0ee178-1e9a-4a8f-9a70-c03d5933fb9a	cf9462bcdc273d08e7a2f0288a3c373755c570438453a6b5c6f0c7651563218f	2026-04-07 09:50:24.101709-05	20260325212656_add_articulaciones	\N	\N	2026-04-07 09:50:24.086496-05	1
d90bde62-337d-43dd-9f09-5ec0428b8382	1275ef3ebd322289414f418ce2446ac4b91baa56364e3e5d19475d78c84af4b8	2026-04-08 16:41:04.244646-05	20260408180000_multi_actors_per_eapb	\N	\N	2026-04-08 16:41:04.141605-05	1
962036c3-119e-4834-85a1-f84250923683	fc75e68b9beddb8e9412c2a547ff681f1161ce5ba0af4c0a62805e4a0ca768a0	\N	20260408170000_multi_actors_per_ips	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260408170000_multi_actors_per_ips\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: la relación «salida_ips_salida_id_ips_id_actor_id_key» ya existe\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "la relación «salida_ips_salida_id_ips_id_actor_id_key» ya existe", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("index.c"), line: Some(902), routine: Some("index_create") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260408170000_multi_actors_per_ips"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260408170000_multi_actors_per_ips"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:255	2026-04-08 16:17:48.73839-05	2026-04-08 16:16:46.58784-05	0
a58e7fbd-62a1-4524-afa8-40f80bcc9f4e	fc75e68b9beddb8e9412c2a547ff681f1161ce5ba0af4c0a62805e4a0ca768a0	2026-04-08 16:17:48.742879-05	20260408170000_multi_actors_per_ips		\N	2026-04-08 16:17:48.742879-05	0
33b64a70-9a5b-46d6-9d5a-779bfa7a0ec0	99d3875ca75a567f79c6d178862beb59297ea8bb0407959868f0392b33666fb8	2026-04-08 16:33:16.153801-05	20260408173000_reset_eapb_actores	\N	\N	2026-04-08 16:33:16.138841-05	1
b8496627-31cc-4ad1-9799-ffea7baf3d3b	6088ca83a9aef5f8e526baeca2f6ed1629b805031094e1ecfa9379cbceb961e2	2026-04-08 16:37:33.937341-05	20260408174000_reset_organizaciones	\N	\N	2026-04-08 16:37:33.9174-05	1
c1aea1e8-5891-4fe5-823a-9f7db26a03fc	71d542a2d2655d6f6466e98dbc72940eace21a34af419e234104ab15b293b2ad	2026-04-08 16:38:14.030764-05	20260408175000_add_idsn_auxiliar	\N	\N	2026-04-08 16:38:14.019934-05	1
\.


--
-- Data for Name: areas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.areas (id, name, subdireccion_id, created_at, updated_at) FROM stdin;
cmnqa6jhs0009don9uu73xd22	Sistemas de Informacion	cmnq9rg5j0001don9j8v4fe4l	2026-04-08 16:47:05.775	2026-04-08 16:47:05.775
cmnqa6p9e000adon95q2ky2qc	Proyectos	cmnq9rg5j0001don9j8v4fe4l	2026-04-08 16:47:13.249	2026-04-08 16:47:13.249
cmnqa6uht000bdon92ts293a2	Red de Servicios	cmnq9rg5j0001don9j8v4fe4l	2026-04-08 16:47:20.033	2026-04-08 16:47:20.033
cmnqa6zbg000cdon9iegijjy0	Calidad	cmnq9rg5j0001don9j8v4fe4l	2026-04-08 16:47:26.284	2026-04-08 16:47:26.284
cmnqa8dth000ddon9u7bo6ebk	Oficina Direccion	cmnqa1nep0007don9xsuici49	2026-04-08 16:48:31.733	2026-04-08 16:48:31.733
cmnqa8k96000edon9wpavj72a	Salud Infantil: Prmera infancia, infancia y adolescentes	cmnq9rg5j0001don9j8v4fe4l	2026-04-08 16:48:40.074	2026-04-08 16:48:40.074
cmnqa8ptd000fdon9sdd920mz	Salud Ambiental	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:48:47.281	2026-04-08 16:48:47.281
cmnqa8uup000gdon98g2m0y90	Sexualidad, derechos sexuales y reproductivos	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:48:53.809	2026-04-08 16:48:53.809
cmnqa90lo000hdon958ljhhqx	Salud Oral	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:49:01.26	2026-04-08 16:49:01.26
cmnqa95is000idon9uyxyz7da	Vida saludable y enfermedades transmisibles 	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:49:07.636	2026-04-08 16:49:07.636
cmnqa9ael000jdon9erkugcwb	 Salud y ámbito laboral	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:49:13.965	2026-04-08 16:49:13.965
cmnqa9inz000kdon9o9gdmfis	Contratacion	cmnqa0ujl0003don9u3xapmyb	2026-04-08 16:49:24.671	2026-04-08 16:49:24.671
cmnqa9owb000ldon9pr4ftgjk	Tutelas	cmnqa0ujl0003don9u3xapmyb	2026-04-08 16:49:32.747	2026-04-08 16:49:32.747
cmnqa9yzp000mdon99z7xv3rt	Habilitacion	cmnqa17jx0004don935h8ejn9	2026-04-08 16:49:45.829	2026-04-08 16:49:45.829
cmnqaa4kl000ndon9jkycgd8z	Atencion al usuario	cmnqa17jx0004don935h8ejn9	2026-04-08 16:49:53.061	2026-04-08 16:49:53.061
cmnqaaatx000odon980lphm63	Contabilidad	cmnqa1byz0005don9rzivtauo	2026-04-08 16:50:01.173	2026-04-08 16:50:01.173
cmnqaah80000pdon9yb1fzcgu	Presupuesto	cmnqa1byz0005don9rzivtauo	2026-04-08 16:50:09.456	2026-04-08 16:50:09.456
cmnqaat5c000qdon9l6b2uwce	Tesoreria	cmnqa1byz0005don9rzivtauo	2026-04-08 16:50:24.912	2026-04-08 16:50:24.912
cmnqab1sq000rdon9te69l3dc	OCIG	cmnqa1h0f0006don9eyp4686z	2026-04-08 16:50:36.122	2026-04-08 16:50:36.122
cmnqab7td000sdon9sxik36l1	OCID	cmnqa1roj0008don9b8f9fmt1	2026-04-08 16:50:43.921	2026-04-08 16:50:43.921
cmnqabhef000tdon91uadwcrp	Convivencia social  y salud mental	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:50:56.343	2026-04-08 16:50:56.343
cmnqablnr000udon98i45f1kn	Seguridad alimentaria y nutricional	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:51:01.863	2026-04-08 16:51:01.863
cmnqabrk6000vdon9zva27ddt	Laboratorio de Salud Pública	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:51:09.51	2026-04-08 16:51:09.51
cmnqabyhb000wdon988wu29k3	Vigilancia en Salud Pública	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:51:18.479	2026-04-08 16:51:18.479
cmnqac4qq000xdon9txhsteze	Movilización	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:51:26.594	2026-04-08 16:51:26.594
cmnqac8ve000ydon9e1976vuy	Gestión de conocimiento	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:51:31.946	2026-04-08 16:51:31.946
cmnqacfss000zdon9wvdnl36n	Enfermedades Transmitidas por Vectores -ETV-	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:51:40.924	2026-04-08 16:51:40.924
cmnqaclei0010don99r3cpd0o	Salud pública en emergencias y desastres	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:51:48.186	2026-04-08 16:51:48.186
cmnqacqd30011don9vkly2m0r	Envejecimiento y vejez	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:51:54.615	2026-04-08 16:51:54.615
cmnqacxt90012don9thffohea	Salud y género	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:52:04.269	2026-04-08 16:52:04.269
cmnqad3h60013don9hdvp2wfz	Asuntos etnicos	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:52:11.61	2026-04-08 16:52:11.61
cmnqad7ly0014don9r76i47kl	Discapacidad	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:52:16.966	2026-04-08 16:52:16.966
cmnqadc6a0015don9591gemcv	Víctimas del conflicto	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:52:22.882	2026-04-08 16:52:22.882
cmnqadgfk0016don9bkj07br8	Modelo Integral de atencion	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:52:28.4	2026-04-08 16:52:28.4
cmnqadkd30017don9r7cl2b2x	Comunicaciones en salud	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:52:33.495	2026-04-08 16:52:33.495
cmnqadssh0018don9rlmj23ge	Plan Territorial de Salud	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:52:44.417	2026-04-08 16:52:44.417
cmnqadxpq0019don9uvlnv2g1	Control de Medicamentos	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:52:50.798	2026-04-08 16:52:50.798
cmnqae1o5001adon9whfx50vw	Vida Saludable y condiciones no transmisibles	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:52:55.925	2026-04-08 16:52:55.925
cmnqae75a001bdon93r31dta1	Subdireccion de salud pública	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:53:03.022	2026-04-08 16:53:03.022
cmnqaeegl001cdon9mgkcl46v	DLS	cmnqa17jx0004don935h8ejn9	2026-04-08 16:53:12.501	2026-04-08 16:53:12.501
cmnqaelip001ddon90eh50dfx	Aseguramiento	cmnqa17jx0004don935h8ejn9	2026-04-08 16:53:21.649	2026-04-08 16:53:21.649
cmnqaeqlf001edon99tid6jpe	Cuentas Medicas	cmnqa17jx0004don935h8ejn9	2026-04-08 16:53:28.227	2026-04-08 16:53:28.227
cmnqaevos001fdon9n43ftz3g	CRUE	cmnqa17jx0004don935h8ejn9	2026-04-08 16:53:34.828	2026-04-08 16:53:34.828
cmnqaf199001gdon98ga9tasy	Registro de Profesionales	cmnqa17jx0004don935h8ejn9	2026-04-08 16:53:42.045	2026-04-08 16:53:42.045
cmnqaf737001hdon91b2i4zc6	Procesos Admin. Sancionatorios	cmnqa17jx0004don935h8ejn9	2026-04-08 16:53:49.603	2026-04-08 16:53:49.603
cmnqafcju001idon9yu5xs2d7	IVC	cmnqa17jx0004don935h8ejn9	2026-04-08 16:53:56.682	2026-04-08 16:53:56.682
cmnqafimk001jdon9kcvj7zij	Gestión Intervenciones Colectivas	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:54:04.556	2026-04-08 16:54:04.556
cmnqafrya001kdon9iulxq8cs	Talento Humano	cmnqa1byz0005don9rzivtauo	2026-04-08 16:54:16.641	2026-04-08 16:54:16.641
cmnqafzcw001ldon9lq3p1y3v	Cancer	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:54:26.24	2026-04-08 16:54:26.24
cmnqag4gn001mdon9bmi99bfz	Participacion Social	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:54:32.855	2026-04-08 16:54:32.855
cmnqagahn001ndon9uol8uq87	Programa Ampliado de Inmunizaciones (PAI)	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:54:40.667	2026-04-08 16:54:40.667
cmnqagi59001odon91z5knh0s	Habitante de calle	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:54:50.589	2026-04-08 16:54:50.589
cmnqagphp001pdon9kqvu6weq	GAUDI	cmnqa17jx0004don935h8ejn9	2026-04-08 16:55:00.109	2026-04-08 16:55:00.109
cmnqagufl001qdon9e5ho4wpg	Infraestructura	cmnq9rg5j0001don9j8v4fe4l	2026-04-08 16:55:06.513	2026-04-08 16:55:06.513
cmnqagz6s001rdon9amx4a8mr	Atención primaria en salud (APS)	cmnq9rt6l0002don9rojgpg0i	2026-04-08 16:55:12.676	2026-04-08 16:55:12.676
cmnqah5cu001sdon9u3t92ez9	Almacen	cmnqa1byz0005don9rzivtauo	2026-04-08 16:55:20.67	2026-04-08 16:55:20.67
cmnqah9yd001tdon9u94akyur	Apoyo Logistico	cmnqa1byz0005don9rzivtauo	2026-04-08 16:55:26.629	2026-04-08 16:55:26.629
cmnqahgvj001udon98ik9dp44	Gestión Documental	cmnqa1byz0005don9rzivtauo	2026-04-08 16:55:35.599	2026-04-08 16:55:35.599
cmnqahoc7001vdon9iphnqk40	Seguridad y salud en el trabajo	cmnqa1byz0005don9rzivtauo	2026-04-08 16:55:45.271	2026-04-08 16:55:45.271
\.


--
-- Data for Name: articulaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.articulaciones (id, codigo, tipo_programacion, tema, fecha_inicio, fecha_final, jornada, instituciones_convocadas, transporte_medio, transporte_num_instituciones, lugar_evento_id, responsable_articulacion, estado, observaciones, fecha_solicitud, solicitante_id, area_id, created_at, updated_at) FROM stdin;
cmnrpd4yl0001vgn927z0hkv1	ART-20260409-SIS01	Articulación Intersectorial	Ejemplo Articulación 	2026-03-11 17:00:00	2026-05-01 17:00:00	Completa	PASTO	Pasajero	10	cmnorjks000003sn9tlt6sc9o	D	pendiente	\N	2026-04-09 16:39:53.942	cmnqiexkc0001dgn9jfrmkycr	cmnqa6jhs0009don9uu73xd22	2026-04-09 16:39:53.942	2026-04-09 16:39:53.942
\.


--
-- Data for Name: eapb; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eapb (id, name, created_at, updated_at) FROM stdin;
cmnoqkuzp0020xkn90g9kv6h0	Emssanar	2026-04-07 14:50:35.365	2026-04-07 14:50:35.365
cmnoqkuzp0021xkn99f6njsjo	Asmet Salud	2026-04-07 14:50:35.365	2026-04-07 14:50:35.365
cmnoqkuzp0022xkn96hy07jaq	Sanitas	2026-04-07 14:50:35.365	2026-04-07 14:50:35.365
cmnoqkuzp0023xkn99pyt93dj	Nueva EPS	2026-04-07 14:50:35.365	2026-04-07 14:50:35.365
\.


--
-- Data for Name: eapb_actores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eapb_actores (id, name, created_at, updated_at) FROM stdin;
fd8fbf70-a00b-4685-b5c3-bf9fc4c1c385	Gerente o delegado	2026-04-08 16:33:16.147	2026-04-08 16:33:16.147
32415781-6d53-4613-aa69-2b3d756281dc	Gestor Municipal	2026-04-08 16:33:16.147	2026-04-08 16:33:16.147
3374ce04-7137-4515-9e20-b53e930b5085	Coord. de Vigilancia SP	2026-04-08 16:33:16.147	2026-04-08 16:33:16.147
\.


--
-- Data for Name: entidades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.entidades (id, name, created_at, updated_at) FROM stdin;
48a7ba0c-ca36-420d-820d-5f2633bf0c99	DLS/Secretario de Salud	2026-04-08 16:23:47.179	2026-04-08 16:23:47.179
711c69d5-137e-485e-bf44-29e2f8af8aaa	Coord. Salud Publica	2026-04-08 16:23:47.179	2026-04-08 16:23:47.179
48e465cf-d516-4041-b111-11ddaf79b97b	Coord. Aseguramiento	2026-04-08 16:23:47.179	2026-04-08 16:23:47.179
d8e968c0-9fbd-4298-8c1b-2e43614b90c8	Técnico de Saneamiento	2026-04-08 16:23:47.179	2026-04-08 16:23:47.179
696b48dd-6e89-4eeb-8427-cb4dee322814	Financiero	2026-04-08 16:23:47.179	2026-04-08 16:23:47.179
2d0001fc-b3da-4697-bbf0-18b1e1505b04	Coord. Gestion del Riesgo	2026-04-08 16:23:47.179	2026-04-08 16:23:47.179
f0044728-8d04-4a1e-82d2-560e25470d71	Alcalde	2026-04-08 16:23:47.179	2026-04-08 16:23:47.179
7b9f2e42-d22a-4a89-92a5-493fbb168bbc	Referente PIC	2026-04-08 16:23:47.179	2026-04-08 16:23:47.179
\.


--
-- Data for Name: idsn; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.idsn (id, name, created_at, updated_at) FROM stdin;
290687e2-63e9-404e-bcb1-e3c4e6028b82	Auxiliar en salud	2026-04-08 16:38:14.023	2026-04-08 16:38:14.023
\.


--
-- Data for Name: ips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ips (id, created_at, updated_at, type) FROM stdin;
cmnq8vpdd00007wn9cjk484kd	2026-04-08 16:10:40.561	2026-04-08 16:10:40.561	Publicas
cmnq8vpdr00017wn9egvhv0m1	2026-04-08 16:10:40.575	2026-04-08 16:10:40.575	Privadas
cmnq8vpdt00027wn9l6ij9auk	2026-04-08 16:10:40.577	2026-04-08 16:10:40.577	Indigenas
cmnq8vpdv00037wn9b4bno8q5	2026-04-08 16:10:40.579	2026-04-08 16:10:40.579	Regimen Excepcion
cmnq8vpdx00047wn9399jat4i	2026-04-08 16:10:40.581	2026-04-08 16:10:40.581	Regimen Especial
\.


--
-- Data for Name: ips_actores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ips_actores (id, name, created_at, updated_at) FROM stdin;
cmnq8vpe000057wn93l00wy6i	Gerente o delegado	2026-04-08 16:10:40.584	2026-04-08 16:10:40.584
cmnq8vpe300067wn9okasijp5	Médico	2026-04-08 16:10:40.587	2026-04-08 16:10:40.587
cmnq8vpe600077wn9huxslq69	Enfermero	2026-04-08 16:10:40.59	2026-04-08 16:10:40.59
cmnq8vpe700087wn9prqq831y	Psicologo	2026-04-08 16:10:40.591	2026-04-08 16:10:40.591
cmnq8vpe900097wn9vp9uhei1	Odontologo	2026-04-08 16:10:40.593	2026-04-08 16:10:40.593
cmnq8vpeb000a7wn969eyj1n2	Bacteriologo	2026-04-08 16:10:40.595	2026-04-08 16:10:40.595
cmnq8vpec000b7wn97m92ea3c	Coord. PYP	2026-04-08 16:10:40.596	2026-04-08 16:10:40.596
cmnq8vpee000c7wn93rw2d2bd	Coord. SP	2026-04-08 16:10:40.598	2026-04-08 16:10:40.598
cmnq8vpef000d7wn90dbtb4vr	Tecnico Sivigila	2026-04-08 16:10:40.599	2026-04-08 16:10:40.599
cmnq8vpeg000e7wn9lh629ceu	Responsable PAI	2026-04-08 16:10:40.6	2026-04-08 16:10:40.6
cmnq8vpei000f7wn9hjb60z5l	Regente Farmacia	2026-04-08 16:10:40.602	2026-04-08 16:10:40.602
cmnq8vpej000g7wn9dvtw55yy	Quim. Farmaceutico	2026-04-08 16:10:40.603	2026-04-08 16:10:40.603
cmnq8vpel000h7wn9ehdf3ajk	Coord./lider SGSST	2026-04-08 16:10:40.605	2026-04-08 16:10:40.605
cmnq8vpen000i7wn95ppivvwd	Ref. Afiliación	2026-04-08 16:10:40.607	2026-04-08 16:10:40.607
cmnq8vpep000j7wn9wwlukaxu	Coord. Cartera	2026-04-08 16:10:40.609	2026-04-08 16:10:40.609
cmnq8vpeq000k7wn9tppcpmuj	Coord. Facturación	2026-04-08 16:10:40.61	2026-04-08 16:10:40.61
cmnq8vper000l7wn9xshadsvv	Coord. Aten. Usuario	2026-04-08 16:10:40.611	2026-04-08 16:10:40.611
cmnq8vpes000m7wn9g4267j3u	Ref. PIC	2026-04-08 16:10:40.612	2026-04-08 16:10:40.612
cmnq8vpeu000n7wn96jpkffcm	Cor. Seg Paciente	2026-04-08 16:10:40.614	2026-04-08 16:10:40.614
\.


--
-- Data for Name: ivc; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ivc (id, codigo, tipo_programacion, tema, fecha_inicio, fecha_final, jornada, instituciones_convocadas, transporte_medio, transporte_num_instituciones, lugar_evento_id, responsable_articulacion, estado, observaciones, fecha_solicitud, solicitante_id, area_id, created_at, updated_at) FROM stdin;
cmnrp8p2o0000vgn9xmwax0xk	IVC-00001	IVC	Ejemplo IVC	2026-04-01 00:00:00	2026-04-09 00:00:00	Manana	Ejemplo	No Aplica	2	cmnorjksi00073sn9r1tb28fd	Santiaog	pendiente	\N	2026-04-09 16:36:26.72	cmnqiexkc0001dgn9jfrmkycr	cmnqa6jhs0009don9uu73xd22	2026-04-09 16:36:26.72	2026-04-09 16:36:26.72
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modules (id, name, description, icon, path, "order", is_active, created_at, updated_at, parent_id) FROM stdin;
cmnoqktz80007xkn9ywwx4gy0	areas	Gestión de Áreas	layers	/areas	5	t	2026-04-07 14:50:34.052	2026-04-07 14:50:34.052	\N
cmnoqktz80005xkn9l54urwjb	usuarios	Gestión de Usuarios	person_add	/users	6	t	2026-04-07 14:50:34.052	2026-04-07 14:50:34.052	\N
cmnoqktzd000bxkn9d9kmhv1j	solicitar_ivc	IVC	verified_user	/solicitar-ivc	8	t	2026-04-07 14:50:34.057	2026-04-07 14:50:34.057	\N
cmnoqktzd000axkn9hes8ls8x	solicitar_articulacion	Articulación	hub	/solicitar-articulacion	7	t	2026-04-07 14:50:34.057	2026-04-07 14:50:34.057	\N
cmnoqktz80006xkn9ki738gk3	subdirecciones	Gestión de Subdirecciones	domain	/subdirecciones	4	t	2026-04-07 14:50:34.052	2026-04-07 14:50:34.052	\N
cmnoqktzd000fxkn95q9b37df	calendario_ivc	Calendario IVC	event	/calendario-ivc	12	t	2026-04-07 14:50:34.057	2026-04-07 14:50:34.057	\N
cmnoqktzb0008xkn9cdw74m1k	solicitar_salida	Solicitar Programación	add_box	/solicitar-salida	2	t	2026-04-07 14:50:34.055	2026-04-07 14:50:34.055	\N
cmnoqktzd000cxkn9lmwbtexo	gestionar_articulacion	Gestionar Articulaciones	table_view	/gestionar-articulacion	9	t	2026-04-07 14:50:34.057	2026-04-07 14:50:34.057	\N
cmnoqktz60004xkn9soczfy3s	dashboard	Panel Principal	dashboard	/dashboard	1	t	2026-04-07 14:50:34.05	2026-04-07 14:50:34.05	\N
cmnoqktzd000exkn9p0nw58a2	gestionar_ivc	Gestionar IVC	table_view	/gestionar-ivc	11	t	2026-04-07 14:50:34.057	2026-04-07 14:50:34.057	\N
cmnoqktzc0009xkn9om864x48	gestionar_salida	Gestionar Programación	data_table	/gestionar-salida	3	t	2026-04-07 14:50:34.056	2026-04-07 14:50:34.056	\N
cmnoqktzd000dxkn9tzbj691v	calendario_articulaciones	Calendario Articulaciones	event	/calendario-articulaciones	10	t	2026-04-07 14:50:34.057	2026-04-07 14:50:34.057	\N
\.


--
-- Data for Name: municipios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.municipios (id, name, code, created_at, updated_at) FROM stdin;
cmnorjks000003sn9tlt6sc9o	PASTO	52001	2026-04-07 15:17:35.088	2026-04-07 15:17:35.088
cmnorjks700013sn9r3zuo7dx	ALBAN	52019	2026-04-07 15:17:35.095	2026-04-07 15:17:35.095
cmnorjksa00023sn9c07gvm5a	ALDANA	52022	2026-04-07 15:17:35.098	2026-04-07 15:17:35.098
cmnorjksc00033sn973b158iw	ANCUYA	52036	2026-04-07 15:17:35.1	2026-04-07 15:17:35.1
cmnorjksd00043sn9xs5uw888	ARBOLEDA	52051	2026-04-07 15:17:35.101	2026-04-07 15:17:35.101
cmnorjksf00053sn9pkodgkrn	BARBACOAS	52079	2026-04-07 15:17:35.103	2026-04-07 15:17:35.103
cmnorjksh00063sn96xatwi66	BELEN	52083	2026-04-07 15:17:35.105	2026-04-07 15:17:35.105
cmnorjksi00073sn9r1tb28fd	BUESACO	52110	2026-04-07 15:17:35.106	2026-04-07 15:17:35.106
cmnorjksj00083sn9hmpmr5xx	COLON	52203	2026-04-07 15:17:35.107	2026-04-07 15:17:35.107
cmnorjksk00093sn9v11m4v6e	CONSACA	52207	2026-04-07 15:17:35.108	2026-04-07 15:17:35.108
cmnorjksl000a3sn9ou0a81l1	CONTADERO	52210	2026-04-07 15:17:35.109	2026-04-07 15:17:35.109
cmnorjksn000b3sn92gfvs6ky	CORDOBA	52215	2026-04-07 15:17:35.111	2026-04-07 15:17:35.111
cmnorjkso000c3sn9uon8irqi	CUASPUD	52224	2026-04-07 15:17:35.112	2026-04-07 15:17:35.112
cmnorjksp000d3sn9hlpxu4by	CUMBAL	52227	2026-04-07 15:17:35.113	2026-04-07 15:17:35.113
cmnorjksr000e3sn9egn506p1	CUMBITARA	52233	2026-04-07 15:17:35.115	2026-04-07 15:17:35.115
cmnorjkss000f3sn9bzkvonts	CHACHAGUI	52240	2026-04-07 15:17:35.116	2026-04-07 15:17:35.116
cmnorjkst000g3sn9hqpakmaf	EL CHARCO	52250	2026-04-07 15:17:35.117	2026-04-07 15:17:35.117
cmnorjkst000h3sn9fmodx8ki	EL PEÑOL	52254	2026-04-07 15:17:35.117	2026-04-07 15:17:35.117
cmnorjksu000i3sn9o94axjum	EL ROSARIO	52256	2026-04-07 15:17:35.118	2026-04-07 15:17:35.118
cmnorjksv000j3sn94ul8akkr	EL TABLON DE GOMEZ	52258	2026-04-07 15:17:35.119	2026-04-07 15:17:35.119
cmnorjksw000k3sn9ckfdhamt	EL TAMBO	52260	2026-04-07 15:17:35.12	2026-04-07 15:17:35.12
cmnorjksx000l3sn97kb1s1ls	FUNES	52287	2026-04-07 15:17:35.121	2026-04-07 15:17:35.121
cmnorjksx000m3sn9jwsalt9w	GUACHUCAL	52317	2026-04-07 15:17:35.121	2026-04-07 15:17:35.121
cmnorjksy000n3sn9cjtny9ue	GUAITARILLA	52320	2026-04-07 15:17:35.122	2026-04-07 15:17:35.122
cmnorjksy000o3sn9kdncgzc6	GUALMATAN	52323	2026-04-07 15:17:35.122	2026-04-07 15:17:35.122
cmnorjkt0000p3sn9f8hw7y6k	ILES	52352	2026-04-07 15:17:35.124	2026-04-07 15:17:35.124
cmnorjkt1000q3sn9g6y2qe1t	IMUES	52354	2026-04-07 15:17:35.125	2026-04-07 15:17:35.125
cmnorjkt2000r3sn9l6vyve3d	IPIALES	52356	2026-04-07 15:17:35.126	2026-04-07 15:17:35.126
cmnorjkt3000s3sn9u4y8n9yq	LA CRUZ	52378	2026-04-07 15:17:35.127	2026-04-07 15:17:35.127
cmnorjkt4000t3sn90oh3w327	LA FLORIDA	52381	2026-04-07 15:17:35.128	2026-04-07 15:17:35.128
cmnorjkt5000u3sn9n391fr9y	LA LLANADA	52385	2026-04-07 15:17:35.129	2026-04-07 15:17:35.129
cmnorjkt5000v3sn92y4nmo5j	LA TOLA	52390	2026-04-07 15:17:35.129	2026-04-07 15:17:35.129
cmnorjkt7000w3sn9e81mm3zd	LA UNION	52399	2026-04-07 15:17:35.131	2026-04-07 15:17:35.131
cmnorjkt7000x3sn9e2dwhm3z	LEIVA	52405	2026-04-07 15:17:35.131	2026-04-07 15:17:35.131
cmnorjkt8000y3sn9nriofmyz	LINARES	52411	2026-04-07 15:17:35.132	2026-04-07 15:17:35.132
cmnorjkt9000z3sn9ofahaxp5	LOS ANDES	52418	2026-04-07 15:17:35.133	2026-04-07 15:17:35.133
cmnorjkta00103sn9e4hke80e	MAGUI	52427	2026-04-07 15:17:35.134	2026-04-07 15:17:35.134
cmnorjktb00113sn9mk17cwy3	MALLAMA	52435	2026-04-07 15:17:35.135	2026-04-07 15:17:35.135
cmnorjktb00123sn9d0x2nc20	MOSQUERA	52473	2026-04-07 15:17:35.135	2026-04-07 15:17:35.135
cmnorjktc00133sn9ww26lc97	NARIÑO	52480	2026-04-07 15:17:35.136	2026-04-07 15:17:35.136
cmnorjktd00143sn9tm0qzmlz	OLAYA HERRERA	52490	2026-04-07 15:17:35.137	2026-04-07 15:17:35.137
cmnorjkte00153sn92dxymfn3	OSPINA	52506	2026-04-07 15:17:35.138	2026-04-07 15:17:35.138
cmnorjkte00163sn96uk9xara	FRANCISCO PIZARRO	52520	2026-04-07 15:17:35.138	2026-04-07 15:17:35.138
cmnorjktf00173sn9yknclndg	POLICARPA	52540	2026-04-07 15:17:35.139	2026-04-07 15:17:35.139
cmnorjkth00183sn933k3uid2	POTOSI	52560	2026-04-07 15:17:35.141	2026-04-07 15:17:35.141
cmnorjkti00193sn9gpsq22q0	PROVIDENCIA	52565	2026-04-07 15:17:35.142	2026-04-07 15:17:35.142
cmnorjktj001a3sn98ifgmc0c	PUERRES	52573	2026-04-07 15:17:35.142	2026-04-07 15:17:35.142
cmnorjktj001b3sn9akag5hfl	PUPIALES	52585	2026-04-07 15:17:35.143	2026-04-07 15:17:35.143
cmnorjktk001c3sn9yiye30r5	RICAURTE	52612	2026-04-07 15:17:35.144	2026-04-07 15:17:35.144
cmnorjktl001d3sn96t7oghae	ROBERTO PAYAN	52621	2026-04-07 15:17:35.145	2026-04-07 15:17:35.145
cmnorjktm001e3sn9wufvo7fw	SAMANIEGO	52678	2026-04-07 15:17:35.146	2026-04-07 15:17:35.146
cmnorjktn001f3sn9jxwgoekv	SANDONA	52683	2026-04-07 15:17:35.147	2026-04-07 15:17:35.147
cmnorjkto001g3sn9ha4y5em1	SAN BERNARDO	52685	2026-04-07 15:17:35.148	2026-04-07 15:17:35.148
cmnorjktp001h3sn9k1ajgjuw	SAN LORENZO	52687	2026-04-07 15:17:35.149	2026-04-07 15:17:35.149
cmnorjktq001i3sn9eplisjcb	SAN PABLO	52693	2026-04-07 15:17:35.15	2026-04-07 15:17:35.15
cmnorjktr001j3sn9y91rav0y	SAN PEDRO DE CARTAGO	52694	2026-04-07 15:17:35.151	2026-04-07 15:17:35.151
cmnorjktt001k3sn9xcw5br19	SANTA BARBARA	52696	2026-04-07 15:17:35.153	2026-04-07 15:17:35.153
cmnorjktu001l3sn9b9ss8nwr	SANTACRUZ	52699	2026-04-07 15:17:35.154	2026-04-07 15:17:35.154
cmnorjktv001m3sn9bkf46lu8	SAPUYES	52720	2026-04-07 15:17:35.155	2026-04-07 15:17:35.155
cmnorjktx001n3sn9qudtbr8z	TAMINANGO	52786	2026-04-07 15:17:35.157	2026-04-07 15:17:35.157
cmnorjktx001o3sn9ljlrdpfe	TANGUA	52788	2026-04-07 15:17:35.157	2026-04-07 15:17:35.157
cmnorjkty001p3sn9kd1po1b6	TUMACO	52835	2026-04-07 15:17:35.158	2026-04-07 15:17:35.158
cmnorjktz001q3sn9l1xxycoc	TUQUERRES	52838	2026-04-07 15:17:35.159	2026-04-07 15:17:35.159
cmnorjku0001r3sn9zihb8zuk	YACUANQUER	52885	2026-04-07 15:17:35.16	2026-04-07 15:17:35.16
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, read, link, created_at) FROM stdin;
cmnrptfy3000cvgn974zqv6rs	cmnqibmw60000dgn9e0b71jqj	salida_pendiente	Nueva Solicitud de Programación	Sebastian solicitó la programación 20260409-SIS01: "Ejemplo Programacion"	t	/gestionar-salida	2026-04-09 16:52:34.682
cmnrpubwh000dvgn9mrxkokdn	cmnqiexkc0001dgn9jfrmkycr	salida_aprobada	✅ Programación Aprobada	Tu programación 20260409-SIS01 fue aprobada.	t	/gestionar-salida	2026-04-09 16:53:16.097
cmnrrmnie0007zkn98xkvqqox	cmnqibmw60000dgn9e0b71jqj	salida_pendiente	Nueva Solicitud de Programación	Sebastian solicitó la programación 20260409-SIS02: "Ejemplo Articulación "	f	/gestionar-salida	2026-04-09 17:43:17.126
cmnrrmnie0006zkn90rkuzl6p	cmnq9l4590000don9we0a68oo	salida_pendiente	Nueva Solicitud de Programación	Sebastian solicitó la programación 20260409-SIS02: "Ejemplo Articulación "	t	/gestionar-salida	2026-04-09 17:43:17.126
\.


--
-- Data for Name: organizaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizaciones (id, name, created_at, updated_at) FROM stdin;
7227d5f6-2ebd-4890-bcba-bc9bdd88dbba	Etnicas	2026-04-08 16:37:33.931	2026-04-08 16:37:33.931
1025ab55-c1b6-48ce-bb0a-75e93f0ac5c7	Academia	2026-04-08 16:37:33.931	2026-04-08 16:37:33.931
9272004d-80b6-46d0-8f2d-c98a04fb84b7	Estable. Farmaceuticos	2026-04-08 16:37:33.931	2026-04-08 16:37:33.931
42b8d770-b29d-440b-a177-6eb9c97af20d	Sociales Y comunitarias	2026-04-08 16:37:33.931	2026-04-08 16:37:33.931
5a874f77-1b4c-413d-b1b5-2080afd8710f	Lab. Clinico Privados	2026-04-08 16:37:33.931	2026-04-08 16:37:33.931
b7559ae5-ccc7-4bac-9f8a-f2cef57f9a99	Registraduria-Notarias	2026-04-08 16:37:33.931	2026-04-08 16:37:33.931
c8322a4a-e467-4336-a6f6-50fb923e9898	Personeria	2026-04-08 16:37:33.931	2026-04-08 16:37:33.931
adc772f0-7a2d-4bb1-be1b-d1b17250aeef	Comites	2026-04-08 16:37:33.931	2026-04-08 16:37:33.931
551b5ad6-d524-4d2f-b25d-05e6eb3b6273	ARL	2026-04-08 16:37:33.931	2026-04-08 16:37:33.931
2aacfa8a-f533-41db-8a1f-fd0ccdfd738c	Estable. objeto de Vigilancia	2026-04-08 16:37:33.931	2026-04-08 16:37:33.931
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, user_type_id, module_id, can_view, can_create, can_edit, can_delete, can_approve, created_at, updated_at) FROM stdin;
cmnoqku3v000gxkn9gjh7mjg3	cmnoqktvt0000xkn9ge22j55w	cmnoqktz60004xkn9soczfy3s	t	t	t	t	t	2026-04-07 14:50:34.206	2026-04-07 14:50:34.206
cmnoqku4g000hxkn925u7bxmy	cmnoqktvt0000xkn9ge22j55w	cmnoqktz80005xkn9l54urwjb	t	t	t	t	t	2026-04-07 14:50:34.236	2026-04-07 14:50:34.236
cmnoqku4q000ixkn9wmul0ls4	cmnoqktvt0000xkn9ge22j55w	cmnoqktz80006xkn9ki738gk3	t	t	t	t	t	2026-04-07 14:50:34.247	2026-04-07 14:50:34.247
cmnoqku4y000jxkn9sxv6cwxr	cmnoqktvt0000xkn9ge22j55w	cmnoqktz80007xkn9ywwx4gy0	t	t	t	t	t	2026-04-07 14:50:34.256	2026-04-07 14:50:34.256
cmnoqku56000kxkn9vdnfhii6	cmnoqktvt0000xkn9ge22j55w	cmnoqktzb0008xkn9cdw74m1k	t	t	t	t	t	2026-04-07 14:50:34.263	2026-04-07 14:50:34.263
cmnoqku5g000lxkn9v98xzprr	cmnoqktvt0000xkn9ge22j55w	cmnoqktzc0009xkn9om864x48	t	t	t	t	t	2026-04-07 14:50:34.274	2026-04-07 14:50:34.274
cmnoqku5o000mxkn90cq4zzfq	cmnoqktvt0000xkn9ge22j55w	cmnoqktzd000axkn9hes8ls8x	t	t	t	t	t	2026-04-07 14:50:34.281	2026-04-07 14:50:34.281
cmnoqku5x000nxkn9q3l9d7hx	cmnoqktvt0000xkn9ge22j55w	cmnoqktzd000bxkn9d9kmhv1j	t	t	t	t	t	2026-04-07 14:50:34.291	2026-04-07 14:50:34.291
cmnoqku63000oxkn9tyzlp68o	cmnoqktvt0000xkn9ge22j55w	cmnoqktzd000cxkn9lmwbtexo	t	t	t	t	t	2026-04-07 14:50:34.297	2026-04-07 14:50:34.297
cmnoqku7a000pxkn9mmjfj47k	cmnoqktvt0000xkn9ge22j55w	cmnoqktzd000dxkn9tzbj691v	t	t	t	t	t	2026-04-07 14:50:34.339	2026-04-07 14:50:34.339
cmnoqku7h000qxkn90gxw1mnh	cmnoqktvt0000xkn9ge22j55w	cmnoqktzd000exkn9p0nw58a2	t	t	t	t	t	2026-04-07 14:50:34.346	2026-04-07 14:50:34.346
cmnoqku7n000rxkn9riuo4xt8	cmnoqktvt0000xkn9ge22j55w	cmnoqktzd000fxkn95q9b37df	t	t	t	t	t	2026-04-07 14:50:34.353	2026-04-07 14:50:34.353
cmnoqku7w000sxkn9d09z8sov	cmnoqktvt0001xkn9rn0klx0g	cmnoqktz60004xkn9soczfy3s	t	t	t	t	t	2026-04-07 14:50:34.361	2026-04-07 14:50:34.361
cmnoqku86000txkn9gxm7ltqh	cmnoqktvt0001xkn9rn0klx0g	cmnoqktz80005xkn9l54urwjb	f	f	f	f	f	2026-04-07 14:50:34.371	2026-04-07 14:50:34.371
cmnoqku8e000uxkn9hc52es1d	cmnoqktvt0001xkn9rn0klx0g	cmnoqktz80006xkn9ki738gk3	f	f	f	f	f	2026-04-07 14:50:34.379	2026-04-07 14:50:34.379
cmnoqku8l000vxkn9r7w2ikaj	cmnoqktvt0001xkn9rn0klx0g	cmnoqktz80007xkn9ywwx4gy0	f	f	f	f	f	2026-04-07 14:50:34.387	2026-04-07 14:50:34.387
cmnoqku8x000wxkn94ancxlrt	cmnoqktvt0001xkn9rn0klx0g	cmnoqktzb0008xkn9cdw74m1k	t	f	f	f	t	2026-04-07 14:50:34.398	2026-04-07 14:50:34.398
cmnoqku94000xxkn96zwqv3yb	cmnoqktvt0001xkn9rn0klx0g	cmnoqktzc0009xkn9om864x48	t	f	f	f	t	2026-04-07 14:50:34.405	2026-04-07 14:50:34.405
cmnoqku9c000yxkn91l9kls7y	cmnoqktvt0001xkn9rn0klx0g	cmnoqktzd000axkn9hes8ls8x	t	t	t	t	t	2026-04-07 14:50:34.413	2026-04-07 14:50:34.413
cmnoqku9k000zxkn9zxhvrnqp	cmnoqktvt0001xkn9rn0klx0g	cmnoqktzd000bxkn9d9kmhv1j	t	t	t	t	t	2026-04-07 14:50:34.422	2026-04-07 14:50:34.422
cmnoqku9s0010xkn9nsw4yfus	cmnoqktvt0001xkn9rn0klx0g	cmnoqktzd000cxkn9lmwbtexo	t	t	t	t	t	2026-04-07 14:50:34.43	2026-04-07 14:50:34.43
cmnoqku9y0011xkn9qrpk4io0	cmnoqktvt0001xkn9rn0klx0g	cmnoqktzd000dxkn9tzbj691v	t	t	t	t	t	2026-04-07 14:50:34.436	2026-04-07 14:50:34.436
cmnoqkua40012xkn9d5fwgkmy	cmnoqktvt0001xkn9rn0klx0g	cmnoqktzd000exkn9p0nw58a2	t	t	t	t	t	2026-04-07 14:50:34.442	2026-04-07 14:50:34.442
cmnoqkuac0013xkn9rfpjro67	cmnoqktvt0001xkn9rn0klx0g	cmnoqktzd000fxkn95q9b37df	t	t	t	t	t	2026-04-07 14:50:34.45	2026-04-07 14:50:34.45
cmnoqkual0014xkn9nx7fgf9k	cmnoqktvt0002xkn9vm3m04in	cmnoqktz60004xkn9soczfy3s	t	f	f	f	f	2026-04-07 14:50:34.459	2026-04-07 14:50:34.459
cmnoqkuat0015xkn9hwjxboef	cmnoqktvt0002xkn9vm3m04in	cmnoqktz80005xkn9l54urwjb	f	f	f	f	f	2026-04-07 14:50:34.469	2026-04-07 14:50:34.469
cmnoqkuax0016xkn9fhvh1kc5	cmnoqktvt0002xkn9vm3m04in	cmnoqktz80006xkn9ki738gk3	f	f	f	f	f	2026-04-07 14:50:34.473	2026-04-07 14:50:34.473
cmnoqkub10017xkn9q5yy42ly	cmnoqktvt0002xkn9vm3m04in	cmnoqktz80007xkn9ywwx4gy0	f	f	f	f	f	2026-04-07 14:50:34.477	2026-04-07 14:50:34.477
cmnoqkub90018xkn9hac7pcnl	cmnoqktvt0002xkn9vm3m04in	cmnoqktzb0008xkn9cdw74m1k	t	t	t	t	f	2026-04-07 14:50:34.483	2026-04-07 14:50:34.483
cmnoqkubm0019xkn9vcry1u8l	cmnoqktvt0002xkn9vm3m04in	cmnoqktzc0009xkn9om864x48	t	t	t	f	f	2026-04-07 14:50:34.495	2026-04-07 14:50:34.495
cmnoqkubw001axkn9kwr5ryf3	cmnoqktvt0002xkn9vm3m04in	cmnoqktzd000axkn9hes8ls8x	t	t	t	t	f	2026-04-07 14:50:34.505	2026-04-07 14:50:34.505
cmnoqkuc2001bxkn9o0p592wb	cmnoqktvt0002xkn9vm3m04in	cmnoqktzd000bxkn9d9kmhv1j	t	t	t	t	f	2026-04-07 14:50:34.513	2026-04-07 14:50:34.513
cmnoqkuc9001cxkn9p6n07734	cmnoqktvt0002xkn9vm3m04in	cmnoqktzd000cxkn9lmwbtexo	t	t	t	t	f	2026-04-07 14:50:34.519	2026-04-07 14:50:34.519
cmnoqkuch001dxkn97z7k30mo	cmnoqktvt0002xkn9vm3m04in	cmnoqktzd000dxkn9tzbj691v	t	t	t	t	f	2026-04-07 14:50:34.527	2026-04-07 14:50:34.527
cmnoqkucn001exkn9aq5ad958	cmnoqktvt0002xkn9vm3m04in	cmnoqktzd000exkn9p0nw58a2	t	t	t	t	f	2026-04-07 14:50:34.533	2026-04-07 14:50:34.533
cmnoqkucw001fxkn9xuhupz7i	cmnoqktvt0002xkn9vm3m04in	cmnoqktzd000fxkn95q9b37df	t	t	t	t	f	2026-04-07 14:50:34.542	2026-04-07 14:50:34.542
cmnoqkud4001gxkn9ufbkew50	cmnoqktvt0003xkn9gj90un8x	cmnoqktz60004xkn9soczfy3s	t	f	f	f	f	2026-04-07 14:50:34.55	2026-04-07 14:50:34.55
\.


--
-- Data for Name: salida_eapb; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.salida_eapb (id, salida_id, eapb_id, actor_id) FROM stdin;
\.


--
-- Data for Name: salida_ips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.salida_ips (id, salida_id, ips_id, actor_id) FROM stdin;
\.


--
-- Data for Name: salidas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.salidas (id, codigo, tipo_salida, subtipo_salida, tema, descripcion, fecha_inicio, fecha_final, jornada, fecha_solicitud, fecha_aprobacion, estado, observaciones, solicitante_id, aprobador_id, area_id, created_at, updated_at, lugar_evento_id, transporte_medio, transporte_responsables, instituciones_convocadas, municipios_convocados) FROM stdin;
\.


--
-- Data for Name: solicitudes_union; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitudes_union (id, salida_id, solicitante_id, area_solicitante_id, mensaje, estado, respuesta, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subdirecciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subdirecciones (id, name, description, created_at, updated_at) FROM stdin;
cmnq9rg5j0001don9j8v4fe4l	Oficina Asesora de Planeación		2026-04-08 16:35:21.607	2026-04-08 16:35:21.607
cmnq9rt6l0002don9rojgpg0i	Subdirección de Salud Publica		2026-04-08 16:35:38.492	2026-04-08 16:35:38.492
cmnqa0ujl0003don9u3xapmyb	Oficina Asesora Juridica		2026-04-08 16:42:40.16	2026-04-08 16:42:40.16
cmnqa17jx0004don935h8ejn9	Subdirección de Calidad y Aseguramiento		2026-04-08 16:42:57.021	2026-04-08 16:42:57.021
cmnqa1byz0005don9rzivtauo	Secretaria General		2026-04-08 16:43:02.747	2026-04-08 16:43:02.747
cmnqa1h0f0006don9eyp4686z	Control Interno de Gestión		2026-04-08 16:43:09.279	2026-04-08 16:43:09.279
cmnqa1nep0007don9xsuici49	Direccion		2026-04-08 16:43:17.568	2026-04-08 16:43:17.568
cmnqa1roj0008don9b8f9fmt1	Control Interno Disciplinario		2026-04-08 16:43:23.106	2026-04-08 16:43:23.106
\.


--
-- Data for Name: user_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_types (id, name, description, created_at, updated_at, level) FROM stdin;
cmnoqktvt0003xkn9gj90un8x	usuario	Usuario Normal - Funciones básicas	2026-04-07 14:50:33.929	2026-04-07 14:50:33.929	3
cmnoqktvt0001xkn9rn0klx0g	admin_subdireccion	Administrador de Subdirección - Aprueba salidas	2026-04-07 14:50:33.929	2026-04-07 14:50:33.929	1
cmnoqktvt0002xkn9vm3m04in	lider	Líder - Crea y modifica salidas	2026-04-07 14:50:33.929	2026-04-07 14:50:33.929	2
cmnoqktvt0000xkn9ge22j55w	superadmin	Super Administrador - Acceso completo	2026-04-07 14:50:33.928	2026-04-07 14:50:33.928	0
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, user_type_id, names, last_name, num_id, area_id, charge, email, is_active, created_at, updated_at, subdireccion_id) FROM stdin;
cmnq9l4590000don9we0a68oo	superadminsivat	$2b$10$mFsYyH.4NTzGOSRh19HRueahy1jvE2zfde8wN0nPekm.BmiphZ9om	cmnoqktvt0000xkn9ge22j55w	SUPERADMIN	SIVAT	891280001	\N		superadmin@sivat.com	t	2026-04-08 16:30:26.108	2026-04-08 16:30:26.108	\N
cmnqibmw60000dgn9e0b71jqj	santiagojojoa	$2b$10$Y474ashPk2Gt7DQV0pbxZuDzy6PkgLFl9aoaok7sh8ylBfaMfhOtS	cmnoqktvt0001xkn9rn0klx0g	Santiago	Jojoa	1080691332	\N		santiago.jojoan@gmail.com	t	2026-04-08 20:35:00.389	2026-04-08 20:35:00.389	cmnq9rg5j0001don9j8v4fe4l
cmnqiexkc0001dgn9jfrmkycr	sebastianm	$2b$10$Htt84s5zjHZF2o8rwFGEU.v0L1U6fPFVfsWcFr8.U7/.eXBd7KNEO	cmnoqktvt0002xkn9vm3m04in	Sebastian	Montenegro	123456	cmnqa6jhs0009don9uu73xd22		sebastian@idsn.com	t	2026-04-08 20:37:34.188	2026-04-08 20:37:34.188	\N
\.


--
-- Data for Name: ventana_programacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ventana_programacion (id, fecha_inicio, fecha_fin, activo, created_at, updated_at) FROM stdin;
cmnrqetrf000024n9eso8b7sn	2026-04-01 05:00:00	2026-04-11 04:59:59	f	2026-04-09 17:09:12.363	2026-04-09 17:09:20.825
cmnrqg43s000124n9paxpxsmh	2026-04-08 05:00:00	2026-04-23 04:59:59	f	2026-04-09 17:10:12.424	2026-04-09 17:10:23.265
cmnrqlcwj000224n9ooi2fi0e	2026-04-09 05:00:00	2026-04-20 04:59:59	f	2026-04-09 17:14:17.107	2026-04-09 17:20:35.537
cmnrqtlu700008wn9pi7n628p	2026-04-09 05:00:00	2026-04-21 04:59:59	f	2026-04-09 17:20:41.934	2026-04-09 17:20:50.797
cmnrqtuyk00018wn9nphjfe0f	2026-04-09 05:00:00	2026-04-22 04:59:59	f	2026-04-09 17:20:53.756	2026-04-09 17:20:55.717
cmnrqtyiq00028wn9a3x0ukj3	2026-04-09 05:00:00	2026-04-23 04:59:59	f	2026-04-09 17:20:58.37	2026-04-09 17:21:00.071
cmnrquwet00038wn93nnjnmsj	2026-04-09 05:00:00	2026-04-24 04:59:59	f	2026-04-09 17:21:42.293	2026-04-09 17:25:14.385
cmnrqzk370000zkn9aw2046r0	2026-04-09 00:00:00	2026-04-24 00:00:00	f	2026-04-09 17:25:19.603	2026-04-09 17:32:55.562
cmnrr9ydp0001zkn9vbm66r15	2026-04-09 17:35:00	2026-04-30 17:32:00	f	2026-04-09 17:33:24.685	2026-04-09 17:35:20.339
cmnrrcptp0002zkn9lihdnvvu	2026-04-09 22:06:00	2026-04-30 22:32:00	f	2026-04-09 17:35:33.565	2026-04-09 17:35:47.649
cmnrrd0pv0003zkn9ou2awq4s	2026-04-09 17:36:00	2026-05-01 03:32:00	f	2026-04-09 17:35:47.683	2026-04-09 17:39:26.417
cmnrri5qz0004zkn9hmxwjlxi	2026-04-09 17:41:00	2026-05-01 08:32:00	f	2026-04-09 17:39:47.483	2026-04-09 18:44:27.006
\.


--
-- Name: _SalidasAreasParticipantes _SalidasAreasParticipantes_AB_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasAreasParticipantes"
    ADD CONSTRAINT "_SalidasAreasParticipantes_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SalidasEntidades _SalidasEntidades_AB_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasEntidades"
    ADD CONSTRAINT "_SalidasEntidades_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SalidasIdsn _SalidasIdsn_AB_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasIdsn"
    ADD CONSTRAINT "_SalidasIdsn_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SalidasIps _SalidasIps_AB_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasIps"
    ADD CONSTRAINT "_SalidasIps_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SalidasMunicipios _SalidasMunicipios_AB_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasMunicipios"
    ADD CONSTRAINT "_SalidasMunicipios_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SalidasOrganizaciones _SalidasOrganizaciones_AB_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasOrganizaciones"
    ADD CONSTRAINT "_SalidasOrganizaciones_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);


--
-- Name: articulaciones articulaciones_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".articulaciones
    ADD CONSTRAINT articulaciones_pkey PRIMARY KEY (id);


--
-- Name: eapb_actores eapb_actores_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".eapb_actores
    ADD CONSTRAINT eapb_actores_pkey PRIMARY KEY (id);


--
-- Name: eapb eapb_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".eapb
    ADD CONSTRAINT eapb_pkey PRIMARY KEY (id);


--
-- Name: entidades entidades_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".entidades
    ADD CONSTRAINT entidades_pkey PRIMARY KEY (id);


--
-- Name: idsn idsn_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".idsn
    ADD CONSTRAINT idsn_pkey PRIMARY KEY (id);


--
-- Name: ips ips_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".ips
    ADD CONSTRAINT ips_pkey PRIMARY KEY (id);


--
-- Name: ivc ivc_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".ivc
    ADD CONSTRAINT ivc_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: municipios municipios_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".municipios
    ADD CONSTRAINT municipios_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizaciones organizaciones_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".organizaciones
    ADD CONSTRAINT organizaciones_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: salida_eapb salida_eapb_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".salida_eapb
    ADD CONSTRAINT salida_eapb_pkey PRIMARY KEY (id);


--
-- Name: salidas salidas_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".salidas
    ADD CONSTRAINT salidas_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_union solicitudes_union_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".solicitudes_union
    ADD CONSTRAINT solicitudes_union_pkey PRIMARY KEY (id);


--
-- Name: subdirecciones subdirecciones_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".subdirecciones
    ADD CONSTRAINT subdirecciones_pkey PRIMARY KEY (id);


--
-- Name: user_types user_types_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".user_types
    ADD CONSTRAINT user_types_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: _SalidasAreasParticipantes _SalidasAreasParticipantes_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasAreasParticipantes"
    ADD CONSTRAINT "_SalidasAreasParticipantes_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SalidasEntidades _SalidasEntidades_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasEntidades"
    ADD CONSTRAINT "_SalidasEntidades_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SalidasIdsn _SalidasIdsn_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasIdsn"
    ADD CONSTRAINT "_SalidasIdsn_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SalidasMunicipios _SalidasMunicipios_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasMunicipios"
    ADD CONSTRAINT "_SalidasMunicipios_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SalidasOrganizaciones _SalidasOrganizaciones_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasOrganizaciones"
    ADD CONSTRAINT "_SalidasOrganizaciones_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);


--
-- Name: articulaciones articulaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articulaciones
    ADD CONSTRAINT articulaciones_pkey PRIMARY KEY (id);


--
-- Name: eapb_actores eapb_actores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eapb_actores
    ADD CONSTRAINT eapb_actores_pkey PRIMARY KEY (id);


--
-- Name: eapb eapb_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eapb
    ADD CONSTRAINT eapb_pkey PRIMARY KEY (id);


--
-- Name: entidades entidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_pkey PRIMARY KEY (id);


--
-- Name: idsn idsn_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idsn
    ADD CONSTRAINT idsn_pkey PRIMARY KEY (id);


--
-- Name: ips_actores ips_actores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ips_actores
    ADD CONSTRAINT ips_actores_pkey PRIMARY KEY (id);


--
-- Name: ips ips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ips
    ADD CONSTRAINT ips_pkey PRIMARY KEY (id);


--
-- Name: ivc ivc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ivc
    ADD CONSTRAINT ivc_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: municipios municipios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizaciones organizaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizaciones
    ADD CONSTRAINT organizaciones_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: salida_eapb salida_eapb_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_eapb
    ADD CONSTRAINT salida_eapb_pkey PRIMARY KEY (id);


--
-- Name: salida_ips salida_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_ips
    ADD CONSTRAINT salida_ips_pkey PRIMARY KEY (id);


--
-- Name: salidas salidas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salidas
    ADD CONSTRAINT salidas_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_union solicitudes_union_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_union
    ADD CONSTRAINT solicitudes_union_pkey PRIMARY KEY (id);


--
-- Name: subdirecciones subdirecciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subdirecciones
    ADD CONSTRAINT subdirecciones_pkey PRIMARY KEY (id);


--
-- Name: user_types user_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_types
    ADD CONSTRAINT user_types_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ventana_programacion ventana_programacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventana_programacion
    ADD CONSTRAINT ventana_programacion_pkey PRIMARY KEY (id);


--
-- Name: _SalidasAreasParticipantes_B_index; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE INDEX "_SalidasAreasParticipantes_B_index" ON "SCHEMA"."_SalidasAreasParticipantes" USING btree ("B");


--
-- Name: _SalidasEntidades_B_index; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE INDEX "_SalidasEntidades_B_index" ON "SCHEMA"."_SalidasEntidades" USING btree ("B");


--
-- Name: _SalidasIdsn_B_index; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE INDEX "_SalidasIdsn_B_index" ON "SCHEMA"."_SalidasIdsn" USING btree ("B");


--
-- Name: _SalidasIps_B_index; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE INDEX "_SalidasIps_B_index" ON "SCHEMA"."_SalidasIps" USING btree ("B");


--
-- Name: _SalidasMunicipios_B_index; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE INDEX "_SalidasMunicipios_B_index" ON "SCHEMA"."_SalidasMunicipios" USING btree ("B");


--
-- Name: _SalidasOrganizaciones_B_index; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE INDEX "_SalidasOrganizaciones_B_index" ON "SCHEMA"."_SalidasOrganizaciones" USING btree ("B");


--
-- Name: areas_name_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX areas_name_key ON "SCHEMA".areas USING btree (name);


--
-- Name: articulaciones_codigo_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX articulaciones_codigo_key ON "SCHEMA".articulaciones USING btree (codigo);


--
-- Name: eapb_actores_name_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX eapb_actores_name_key ON "SCHEMA".eapb_actores USING btree (name);


--
-- Name: ivc_codigo_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX ivc_codigo_key ON "SCHEMA".ivc USING btree (codigo);


--
-- Name: modules_name_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX modules_name_key ON "SCHEMA".modules USING btree (name);


--
-- Name: municipios_code_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX municipios_code_key ON "SCHEMA".municipios USING btree (code);


--
-- Name: permissions_user_type_id_module_id_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX permissions_user_type_id_module_id_key ON "SCHEMA".permissions USING btree (user_type_id, module_id);


--
-- Name: salida_eapb_salida_id_eapb_id_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX salida_eapb_salida_id_eapb_id_key ON "SCHEMA".salida_eapb USING btree (salida_id, eapb_id);


--
-- Name: salidas_codigo_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX salidas_codigo_key ON "SCHEMA".salidas USING btree (codigo);


--
-- Name: subdirecciones_name_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX subdirecciones_name_key ON "SCHEMA".subdirecciones USING btree (name);


--
-- Name: user_types_name_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX user_types_name_key ON "SCHEMA".user_types USING btree (name);


--
-- Name: users_email_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON "SCHEMA".users USING btree (email);


--
-- Name: users_num_id_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX users_num_id_key ON "SCHEMA".users USING btree (num_id);


--
-- Name: users_username_key; Type: INDEX; Schema: SCHEMA; Owner: postgres
--

CREATE UNIQUE INDEX users_username_key ON "SCHEMA".users USING btree (username);


--
-- Name: _SalidasAreasParticipantes_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_SalidasAreasParticipantes_B_index" ON public."_SalidasAreasParticipantes" USING btree ("B");


--
-- Name: _SalidasEntidades_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_SalidasEntidades_B_index" ON public."_SalidasEntidades" USING btree ("B");


--
-- Name: _SalidasIdsn_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_SalidasIdsn_B_index" ON public."_SalidasIdsn" USING btree ("B");


--
-- Name: _SalidasMunicipios_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_SalidasMunicipios_B_index" ON public."_SalidasMunicipios" USING btree ("B");


--
-- Name: _SalidasOrganizaciones_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_SalidasOrganizaciones_B_index" ON public."_SalidasOrganizaciones" USING btree ("B");


--
-- Name: areas_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX areas_name_key ON public.areas USING btree (name);


--
-- Name: articulaciones_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX articulaciones_codigo_key ON public.articulaciones USING btree (codigo);


--
-- Name: eapb_actores_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX eapb_actores_name_key ON public.eapb_actores USING btree (name);


--
-- Name: ips_actores_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ips_actores_name_key ON public.ips_actores USING btree (name);


--
-- Name: ips_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ips_type_key ON public.ips USING btree (type);


--
-- Name: ivc_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ivc_codigo_key ON public.ivc USING btree (codigo);


--
-- Name: modules_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX modules_name_key ON public.modules USING btree (name);


--
-- Name: municipios_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX municipios_code_key ON public.municipios USING btree (code);


--
-- Name: permissions_user_type_id_module_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX permissions_user_type_id_module_id_key ON public.permissions USING btree (user_type_id, module_id);


--
-- Name: salida_eapb_salida_id_eapb_id_actor_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX salida_eapb_salida_id_eapb_id_actor_id_key ON public.salida_eapb USING btree (salida_id, eapb_id, actor_id);


--
-- Name: salida_ips_salida_id_ips_id_actor_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX salida_ips_salida_id_ips_id_actor_id_key ON public.salida_ips USING btree (salida_id, ips_id, actor_id);


--
-- Name: salidas_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX salidas_codigo_key ON public.salidas USING btree (codigo);


--
-- Name: subdirecciones_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX subdirecciones_name_key ON public.subdirecciones USING btree (name);


--
-- Name: user_types_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_types_name_key ON public.user_types USING btree (name);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_num_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_num_id_key ON public.users USING btree (num_id);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: _SalidasAreasParticipantes _SalidasAreasParticipantes_A_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasAreasParticipantes"
    ADD CONSTRAINT "_SalidasAreasParticipantes_A_fkey" FOREIGN KEY ("A") REFERENCES "SCHEMA".areas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasAreasParticipantes _SalidasAreasParticipantes_B_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasAreasParticipantes"
    ADD CONSTRAINT "_SalidasAreasParticipantes_B_fkey" FOREIGN KEY ("B") REFERENCES "SCHEMA".salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasEntidades _SalidasEntidades_A_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasEntidades"
    ADD CONSTRAINT "_SalidasEntidades_A_fkey" FOREIGN KEY ("A") REFERENCES "SCHEMA".entidades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasEntidades _SalidasEntidades_B_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasEntidades"
    ADD CONSTRAINT "_SalidasEntidades_B_fkey" FOREIGN KEY ("B") REFERENCES "SCHEMA".salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasIdsn _SalidasIdsn_A_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasIdsn"
    ADD CONSTRAINT "_SalidasIdsn_A_fkey" FOREIGN KEY ("A") REFERENCES "SCHEMA".idsn(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasIdsn _SalidasIdsn_B_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasIdsn"
    ADD CONSTRAINT "_SalidasIdsn_B_fkey" FOREIGN KEY ("B") REFERENCES "SCHEMA".salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasIps _SalidasIps_A_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasIps"
    ADD CONSTRAINT "_SalidasIps_A_fkey" FOREIGN KEY ("A") REFERENCES "SCHEMA".ips(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasIps _SalidasIps_B_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasIps"
    ADD CONSTRAINT "_SalidasIps_B_fkey" FOREIGN KEY ("B") REFERENCES "SCHEMA".salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasMunicipios _SalidasMunicipios_A_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasMunicipios"
    ADD CONSTRAINT "_SalidasMunicipios_A_fkey" FOREIGN KEY ("A") REFERENCES "SCHEMA".municipios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasMunicipios _SalidasMunicipios_B_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasMunicipios"
    ADD CONSTRAINT "_SalidasMunicipios_B_fkey" FOREIGN KEY ("B") REFERENCES "SCHEMA".salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasOrganizaciones _SalidasOrganizaciones_A_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasOrganizaciones"
    ADD CONSTRAINT "_SalidasOrganizaciones_A_fkey" FOREIGN KEY ("A") REFERENCES "SCHEMA".organizaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasOrganizaciones _SalidasOrganizaciones_B_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA"."_SalidasOrganizaciones"
    ADD CONSTRAINT "_SalidasOrganizaciones_B_fkey" FOREIGN KEY ("B") REFERENCES "SCHEMA".salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: areas areas_subdireccion_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".areas
    ADD CONSTRAINT areas_subdireccion_id_fkey FOREIGN KEY (subdireccion_id) REFERENCES "SCHEMA".subdirecciones(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articulaciones articulaciones_area_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".articulaciones
    ADD CONSTRAINT articulaciones_area_id_fkey FOREIGN KEY (area_id) REFERENCES "SCHEMA".areas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articulaciones articulaciones_lugar_evento_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".articulaciones
    ADD CONSTRAINT articulaciones_lugar_evento_id_fkey FOREIGN KEY (lugar_evento_id) REFERENCES "SCHEMA".municipios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: articulaciones articulaciones_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".articulaciones
    ADD CONSTRAINT articulaciones_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES "SCHEMA".users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ips ips_municipio_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".ips
    ADD CONSTRAINT ips_municipio_id_fkey FOREIGN KEY (municipio_id) REFERENCES "SCHEMA".municipios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ivc ivc_area_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".ivc
    ADD CONSTRAINT ivc_area_id_fkey FOREIGN KEY (area_id) REFERENCES "SCHEMA".areas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ivc ivc_lugar_evento_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".ivc
    ADD CONSTRAINT ivc_lugar_evento_id_fkey FOREIGN KEY (lugar_evento_id) REFERENCES "SCHEMA".municipios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ivc ivc_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".ivc
    ADD CONSTRAINT ivc_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES "SCHEMA".users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: modules modules_parent_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".modules
    ADD CONSTRAINT modules_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES "SCHEMA".modules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES "SCHEMA".users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: permissions permissions_module_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".permissions
    ADD CONSTRAINT permissions_module_id_fkey FOREIGN KEY (module_id) REFERENCES "SCHEMA".modules(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: permissions permissions_user_type_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".permissions
    ADD CONSTRAINT permissions_user_type_id_fkey FOREIGN KEY (user_type_id) REFERENCES "SCHEMA".user_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: salida_eapb salida_eapb_actor_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".salida_eapb
    ADD CONSTRAINT salida_eapb_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES "SCHEMA".eapb_actores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: salida_eapb salida_eapb_eapb_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".salida_eapb
    ADD CONSTRAINT salida_eapb_eapb_id_fkey FOREIGN KEY (eapb_id) REFERENCES "SCHEMA".eapb(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: salida_eapb salida_eapb_salida_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".salida_eapb
    ADD CONSTRAINT salida_eapb_salida_id_fkey FOREIGN KEY (salida_id) REFERENCES "SCHEMA".salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: salidas salidas_aprobador_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".salidas
    ADD CONSTRAINT salidas_aprobador_id_fkey FOREIGN KEY (aprobador_id) REFERENCES "SCHEMA".users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: salidas salidas_area_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".salidas
    ADD CONSTRAINT salidas_area_id_fkey FOREIGN KEY (area_id) REFERENCES "SCHEMA".areas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: salidas salidas_lugar_evento_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".salidas
    ADD CONSTRAINT salidas_lugar_evento_id_fkey FOREIGN KEY (lugar_evento_id) REFERENCES "SCHEMA".municipios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: salidas salidas_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".salidas
    ADD CONSTRAINT salidas_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES "SCHEMA".users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: solicitudes_union solicitudes_union_area_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".solicitudes_union
    ADD CONSTRAINT solicitudes_union_area_solicitante_id_fkey FOREIGN KEY (area_solicitante_id) REFERENCES "SCHEMA".areas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: solicitudes_union solicitudes_union_salida_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".solicitudes_union
    ADD CONSTRAINT solicitudes_union_salida_id_fkey FOREIGN KEY (salida_id) REFERENCES "SCHEMA".salidas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: solicitudes_union solicitudes_union_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".solicitudes_union
    ADD CONSTRAINT solicitudes_union_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES "SCHEMA".users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_area_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".users
    ADD CONSTRAINT users_area_id_fkey FOREIGN KEY (area_id) REFERENCES "SCHEMA".areas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_subdireccion_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".users
    ADD CONSTRAINT users_subdireccion_id_fkey FOREIGN KEY (subdireccion_id) REFERENCES "SCHEMA".subdirecciones(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_user_type_id_fkey; Type: FK CONSTRAINT; Schema: SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SCHEMA".users
    ADD CONSTRAINT users_user_type_id_fkey FOREIGN KEY (user_type_id) REFERENCES "SCHEMA".user_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _SalidasAreasParticipantes _SalidasAreasParticipantes_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasAreasParticipantes"
    ADD CONSTRAINT "_SalidasAreasParticipantes_A_fkey" FOREIGN KEY ("A") REFERENCES public.areas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasAreasParticipantes _SalidasAreasParticipantes_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasAreasParticipantes"
    ADD CONSTRAINT "_SalidasAreasParticipantes_B_fkey" FOREIGN KEY ("B") REFERENCES public.salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasEntidades _SalidasEntidades_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasEntidades"
    ADD CONSTRAINT "_SalidasEntidades_A_fkey" FOREIGN KEY ("A") REFERENCES public.entidades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasEntidades _SalidasEntidades_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasEntidades"
    ADD CONSTRAINT "_SalidasEntidades_B_fkey" FOREIGN KEY ("B") REFERENCES public.salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasIdsn _SalidasIdsn_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasIdsn"
    ADD CONSTRAINT "_SalidasIdsn_A_fkey" FOREIGN KEY ("A") REFERENCES public.idsn(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasIdsn _SalidasIdsn_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasIdsn"
    ADD CONSTRAINT "_SalidasIdsn_B_fkey" FOREIGN KEY ("B") REFERENCES public.salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasMunicipios _SalidasMunicipios_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasMunicipios"
    ADD CONSTRAINT "_SalidasMunicipios_A_fkey" FOREIGN KEY ("A") REFERENCES public.municipios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasMunicipios _SalidasMunicipios_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasMunicipios"
    ADD CONSTRAINT "_SalidasMunicipios_B_fkey" FOREIGN KEY ("B") REFERENCES public.salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasOrganizaciones _SalidasOrganizaciones_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasOrganizaciones"
    ADD CONSTRAINT "_SalidasOrganizaciones_A_fkey" FOREIGN KEY ("A") REFERENCES public.organizaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SalidasOrganizaciones _SalidasOrganizaciones_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_SalidasOrganizaciones"
    ADD CONSTRAINT "_SalidasOrganizaciones_B_fkey" FOREIGN KEY ("B") REFERENCES public.salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: areas areas_subdireccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_subdireccion_id_fkey FOREIGN KEY (subdireccion_id) REFERENCES public.subdirecciones(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articulaciones articulaciones_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articulaciones
    ADD CONSTRAINT articulaciones_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articulaciones articulaciones_lugar_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articulaciones
    ADD CONSTRAINT articulaciones_lugar_evento_id_fkey FOREIGN KEY (lugar_evento_id) REFERENCES public.municipios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: articulaciones articulaciones_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articulaciones
    ADD CONSTRAINT articulaciones_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ivc ivc_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ivc
    ADD CONSTRAINT ivc_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ivc ivc_lugar_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ivc
    ADD CONSTRAINT ivc_lugar_evento_id_fkey FOREIGN KEY (lugar_evento_id) REFERENCES public.municipios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ivc ivc_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ivc
    ADD CONSTRAINT ivc_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: modules modules_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: permissions permissions_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: permissions permissions_user_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_user_type_id_fkey FOREIGN KEY (user_type_id) REFERENCES public.user_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: salida_eapb salida_eapb_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_eapb
    ADD CONSTRAINT salida_eapb_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.eapb_actores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: salida_eapb salida_eapb_eapb_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_eapb
    ADD CONSTRAINT salida_eapb_eapb_id_fkey FOREIGN KEY (eapb_id) REFERENCES public.eapb(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: salida_eapb salida_eapb_salida_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_eapb
    ADD CONSTRAINT salida_eapb_salida_id_fkey FOREIGN KEY (salida_id) REFERENCES public.salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: salida_ips salida_ips_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_ips
    ADD CONSTRAINT salida_ips_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.ips_actores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: salida_ips salida_ips_ips_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_ips
    ADD CONSTRAINT salida_ips_ips_id_fkey FOREIGN KEY (ips_id) REFERENCES public.ips(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: salida_ips salida_ips_salida_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_ips
    ADD CONSTRAINT salida_ips_salida_id_fkey FOREIGN KEY (salida_id) REFERENCES public.salidas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: salidas salidas_aprobador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salidas
    ADD CONSTRAINT salidas_aprobador_id_fkey FOREIGN KEY (aprobador_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: salidas salidas_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salidas
    ADD CONSTRAINT salidas_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: salidas salidas_lugar_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salidas
    ADD CONSTRAINT salidas_lugar_evento_id_fkey FOREIGN KEY (lugar_evento_id) REFERENCES public.municipios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: salidas salidas_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salidas
    ADD CONSTRAINT salidas_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: solicitudes_union solicitudes_union_area_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_union
    ADD CONSTRAINT solicitudes_union_area_solicitante_id_fkey FOREIGN KEY (area_solicitante_id) REFERENCES public.areas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: solicitudes_union solicitudes_union_salida_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_union
    ADD CONSTRAINT solicitudes_union_salida_id_fkey FOREIGN KEY (salida_id) REFERENCES public.salidas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: solicitudes_union solicitudes_union_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_union
    ADD CONSTRAINT solicitudes_union_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_subdireccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_subdireccion_id_fkey FOREIGN KEY (subdireccion_id) REFERENCES public.subdirecciones(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_user_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_type_id_fkey FOREIGN KEY (user_type_id) REFERENCES public.user_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 2pI8ihkp6y7Gc2ffUzfjrDL8eWaVNcbCYLuZt6UVvcADbxIujI466WUMcwBTf8e

