BEGIN;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS salutation (
  ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salutation VARCHAR(40),
  male BOOL,
  female BOOL,
  genderless BOOL,
  createdat DATE DEFAULT now()
);
END;