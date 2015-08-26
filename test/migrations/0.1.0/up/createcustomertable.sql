BEGIN;
-- DROP TABLE IF EXISTS customer;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS Customer (
  ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  companyname1 VARCHAR(40),
  companyname2 VARCHAR(40),
  addressline1 VARCHAR(40),
  addressline2 VARCHAR(40),
  zipcode VARCHAR(10),
  city VARCHAR(40),
  existingcustomernumber VARCHAR(40),
  salestaxidentificationnumber VARCHAR(14),
    customersuppliernumber VARCHAR(40),
  createdat DATE DEFAULT now()
);
END;