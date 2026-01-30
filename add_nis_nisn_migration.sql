-- Migration to add NIS and NISN columns to users table
ALTER TABLE users 
ADD COLUMN nisn VARCHAR(20) UNIQUE;