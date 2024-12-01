CREATE DATABASE IF NOT EXISTS postgres;
USE postgres

CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id serial PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100),

    INSERT INTO clientes (nome, telefone, email) VALUES
('João Silva', '123456789', 'joao.silva@email.com'),
('Maria Oliveira', '987654321', 'maria.oliveira@email.com');

);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id serial PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    quantidade INT DEFAULT 0,
    preco DECIMAL(10, 2) not null

    SELECT * FROM produtos;
UPDATE produtos SET preco = 0.00 WHERE preco IS NULL;

UPDATE produtos 
SET nome = $1, preco = $2, quantidade = $3 
WHERE id = $4;


);



