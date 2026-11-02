const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexão com o SQLite (cria o ficheiro delivery.db se não existir)
const db = new sqlite3.Database('./delivery.db', (err) => {
    if (err) console.error('Erro ao abrir o BD:', err.message);
    else console.log('Conectado ao SQLite com sucesso.');
});

// Criar tabelas e popular dados iniciais
db.serialize(() => {
    // 1. Tabela de Lojas
    db.run(`CREATE TABLE IF NOT EXISTS lojas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        descricao TEXT,
        categoria TEXT,
        avaliacao REAL,
        tempo_entrega TEXT,
        taxa_entrega REAL
    )`);

    // 2. Tabela de Produtos (ATUALIZADA COM O CAMPO 'categoria')
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loja_id INTEGER,
        nome TEXT,
        descricao TEXT,
        preco REAL,
        categoria TEXT,
        FOREIGN KEY(loja_id) REFERENCES lojas(id)
    )`);

    // 3. Tabela de Pedidos
    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        itens TEXT,
        total REAL,
        status TEXT DEFAULT 'Em preparação',
        data DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Inserir os produtos com as categorias (Destaques, Combos, Sobremesas)
    db.get(`SELECT COUNT(*) as count FROM produtos`, (err, row) => {
        if (row.count === 0) {
            db.run(`INSERT INTO produtos (loja_id, nome, descricao, preco, categoria) VALUES 
                (1, 'Burger Smash Duplo', 'Dois hambúrgueres de 100g, queijo cheddar inglês, bacon caramelizado no pão brioche.', 28.90, 'Destaques'),
                (1, 'Burger Crispy Chicken', 'Frango empanado crocante, alface americana, molho ranch e pão brioche.', 26.50, 'Destaques'),
                (1, 'Combo Bacon King', 'Burger triplo bacon, batata rústica G e refrigerante lata 350ml.', 42.00, 'Combos'),
                (1, 'Combo Família Smash', '4 Burger Smash Duplos, 2 batatas grandes e refrigerante 2 litros.', 89.90, 'Combos'),
                (1, 'Milkshake de Nutella 500ml', 'Milkshake cremoso com gelato de baunilha e muita Nutella pura.', 21.90, 'Sobremesas'),
                (1, 'Pudim Leite Condensado', 'Fatia generosa de pudim tradicional com calda de caramelo.', 12.00, 'Sobremesas')`);
            console.log('Produtos de lanches, combos e sobremesas inseridos!');
        }
    });
});
// --- ROTAS DA API ---

// Listar Lojas
app.get('/lojas', (req, res) => {
    db.all(`SELECT * FROM lojas`, [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// Listar Produtos de uma Loja específica
app.get('/lojas/:id/produtos', (req, res) => {
    const { id } = req.params;
    db.all(`SELECT * FROM produtos WHERE loja_id = ?`, [id], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// Criar Pedido (Checkout)
app.post('/pedidos', (req, res) => {
    const { itens, total } = req.body;
    db.run(`INSERT INTO pedidos (itens, total) VALUES (?, ?)`, [JSON.stringify(itens), total], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ id: this.lastID, mensagem: 'Pedido realizado com sucesso!' });
    });
});

// Listar Histórico de Pedidos
app.get('/pedidos', (req, res) => {
    db.all(`SELECT * FROM pedidos ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});
// --- NOVAS ROTAS PARA O RASTREAMENTO E PAINEL ---

// 1. Buscar um pedido específico pelo ID (Para a tela de acompanhamento/Pix)
app.get('/pedidos/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT * FROM pedidos WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (!row) return res.status(404).json({ mensagem: 'Pedido não encontrado' });
        
        // Retorna os dados convertendo o JSON dos itens de volta para objeto
        res.json({
            id: row.id,
            itens: JSON.parse(row.itens),
            total: row.total,
            status: row.status,
            data: row.data,
            pixCopiaECola: `00020126580014BR.GOV.BCB.PIX0136DTUDO-PAYMENT-${row.id}-${row.data}`
        });
    });
});

// 2. Atualizar o status do pedido (Para o painel da cozinha/admin)
app.put('/pedidos/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    db.run(`UPDATE pedidos SET status = ? WHERE id = ?`, [status, id], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        if (this.changes === 0) return res.status(404).json({ mensagem: 'Pedido não encontrado' });
        
        res.json({ sucesso: true, mensagem: `Status atualizado para: ${status}` });
    });
});
// Iniciar Servidor
app.listen(3000, () => {
    console.log('Servidor a correr na porta 3000 (http://localhost:3000)');
});