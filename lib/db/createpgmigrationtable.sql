BEGIN;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS pgmigration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(10),
  scriptname VARCHAR(100),
  dateapplied DATE DEFAULT now()
);
END;