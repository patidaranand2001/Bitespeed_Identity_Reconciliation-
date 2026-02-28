-- SQL schema for identity reconciliation task

CREATE DATABASE IF NOT EXISTS testdb;
USE testdb;

CREATE TABLE IF NOT EXISTS Contact (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phoneNumber VARCHAR(50),
  email VARCHAR(255),
  linkedId INT DEFAULT NULL,
  linkPrecedence ENUM('primary','secondary') NOT NULL DEFAULT 'primary',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  INDEX idx_email (email),
  INDEX idx_phone (phoneNumber)
);
