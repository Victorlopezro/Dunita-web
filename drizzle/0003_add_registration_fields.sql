-- Add registration fields to users table
ALTER TABLE users
  ADD COLUMN nickname VARCHAR(255) UNIQUE AFTER googleId,
  ADD COLUMN passwordHash TEXT NULL AFTER email,
  ADD COLUMN birthDate TIMESTAMP NULL AFTER passwordHash;
