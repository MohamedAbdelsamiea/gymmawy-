-- Make gymuser a superuser
ALTER USER gymuser WITH SUPERUSER CREATEDB CREATEROLE;

-- Grant all privileges on the gymmawy database
GRANT ALL PRIVILEGES ON DATABASE gymmawy TO gymuser;

-- Grant all privileges on the public schema
GRANT ALL PRIVILEGES ON SCHEMA public TO gymuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gymuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gymuser;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gymuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gymuser;

