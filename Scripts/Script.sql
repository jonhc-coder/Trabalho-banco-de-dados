CREATE TABLE Clientes (
    id_cliente SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) UNIQUE,
    email VARCHAR(100),
    endereco TEXT
);

CREATE TABLE Funcionarios (
    id_funcionario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    salario NUMERIC(10, 2) NOT NULL,
    data_admissao DATE NOT NULL
);

CREATE TABLE Mesas (
    id_mesa SERIAL PRIMARY KEY,
    numero_mesa INT UNIQUE NOT NULL,
    capacidade INT NOT NULL,
    status VARCHAR(20) DEFAULT 'Livre'
);

CREATE TABLE Produtos (
    id_produto SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE Pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_mesa INT,
    id_cliente INT,
    id_funcionario INT NOT NULL,
    data_hora_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_hora_fechamento TIMESTAMP,
    tipo_pedido VARCHAR(20) NOT NULL,
    status_pedido VARCHAR(20) NOT NULL DEFAULT 'Em Aberto',
    CONSTRAINT fk_pedidos_mesa FOREIGN KEY (id_mesa) REFERENCES Mesas(id_mesa),
    CONSTRAINT fk_pedidos_cliente FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente),
    CONSTRAINT fk_pedidos_funcionario FOREIGN KEY (id_funcionario) REFERENCES Funcionarios(id_funcionario)
);

CREATE TABLE Itens_Pedido (
    id_item SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario_historico NUMERIC(10, 2) NOT NULL,
    observacoes TEXT,
    CONSTRAINT fk_itens_pedido FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_itens_produto FOREIGN KEY (id_produto) REFERENCES Produtos(id_produto)
);

CREATE TABLE Pagamentos (
    id_pagamento SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    forma_pagamento VARCHAR(30) NOT NULL,
    valor_pago NUMERIC(10, 2) NOT NULL,
    data_hora_pagamento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pagamentos_pedido FOREIGN KEY (id_pedido) REFERENCES Pagamentos(id_pedido)
);
