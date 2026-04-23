-- Add Google login method tracking to users table
ALTER TABLE users ADD COLUMN googleId VARCHAR(255) UNIQUE AFTER email;
ALTER TABLE users ADD COLUMN twoFactorEnabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN twoFactorSecret VARCHAR(255);

-- Create table for 2FA codes
CREATE TABLE two_factor_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  code VARCHAR(6) NOT NULL,
  email VARCHAR(320) NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_code (code),
  INDEX idx_expiresAt (expiresAt)
);

-- Create table for OAuth sessions (temporary storage)
CREATE TABLE oauth_sessions (
  id VARCHAR(64) PRIMARY KEY,
  googleIdToken VARCHAR(2000) NOT NULL,
  email VARCHAR(320) NOT NULL,
  name VARCHAR(255),
  googleId VARCHAR(255) NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_expiresAt (expiresAt)
);
