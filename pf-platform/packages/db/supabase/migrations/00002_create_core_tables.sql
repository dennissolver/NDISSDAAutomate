-- Migration: 00002_create_core_tables
-- Create foundational tables: clients, rental_agencies, plan_managers, properties, participants, occupancies

CREATE TABLE clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    uuid REFERENCES auth.users(id),
  full_name       text NOT NULL,
  email           text NOT NULL UNIQUE,
  phone           text,
  entity_type     client_entity_type DEFAULT 'individual',
  entity_name     text,
  abn             varchar(11),
  bank_bsb        varchar(7),
  bank_account_number varchar(10),
  notification_email  boolean DEFAULT true,
  notification_voice  boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE rental_agencies (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  email                 text,
  phone                 text,
  fee_rate              decimal(5,4) NOT NULL,
  statement_format      statement_format NOT NULL,
  sender_email_pattern  text,
  created_at            timestamptz DEFAULT now()
);

CREATE TABLE plan_managers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  email           text NOT NULL,
  phone           text,
  abn             varchar(11),
  xero_contact_id text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE properties (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address_line_1        text NOT NULL,
  address_line_2        text,
  suburb                text NOT NULL,
  state                 varchar(3) NOT NULL,
  postcode              varchar(4) NOT NULL,
  property_label        text,
  building_type         building_type NOT NULL,
  design_category       design_category NOT NULL,
  has_ooa               boolean DEFAULT false,
  has_breakout_room     boolean DEFAULT false,
  has_fire_sprinklers   boolean DEFAULT false,
  location_factor       decimal(4,2) NOT NULL,
  max_residents         int NOT NULL,
  sda_enrolment_id      text,
  sda_enrolment_status  sda_enrolment_status DEFAULT 'pending',
  sda_enrolment_date    date,
  annual_sda_amount     decimal(10,2),
  owner_id              uuid NOT NULL REFERENCES clients(id),
  rental_agency_id      uuid REFERENCES rental_agencies(id),
  drive_folder_id       text,
  storage_path          text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE TABLE participants (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ndis_number           varchar(20) NOT NULL UNIQUE,
  first_name            text NOT NULL,
  last_name             text NOT NULL,
  date_of_birth         date NOT NULL,
  email                 text,
  phone                 text,
  plan_management_type  plan_management_type NOT NULL,
  plan_manager_id       uuid REFERENCES plan_managers(id),
  plan_status           plan_status NOT NULL,
  plan_start_date       date,
  plan_end_date         date,
  pace_transitioned     boolean DEFAULT false,
  my_provider_status    my_provider_status,
  sda_category_funded   design_category,
  ndia_last_synced_at   timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE TABLE occupancies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     uuid NOT NULL REFERENCES properties(id),
  participant_id  uuid NOT NULL REFERENCES participants(id),
  start_date      date NOT NULL,
  end_date        date,
  room_number     int,
  mrrc_fortnightly decimal(8,2),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  UNIQUE (property_id, participant_id, start_date),
  CHECK (end_date IS NULL OR end_date > start_date)
);
