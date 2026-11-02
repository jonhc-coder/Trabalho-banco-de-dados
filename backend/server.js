const express = require('express');
const cors = require('cors');
const db = require('./db'); // Importa a nossa conexão do Supabase

const app = express();
app.use(express.json());
app.use(cors());

// Função para popular dados iniciais automaticamente se as tabelas estiverem vazias
async function inicializarBanco() {
    try {
        // 1. Tabela de Lojas
        await db.query(`
            CREATE TABLE IF NOT EXISTS lojas (
                id SERIAL PRIMARY KEY,
                nome TEXT,
                descricao TEXT,
                categoria TEXT,
                avaliacao REAL,
                tempo_entrega TEXT,
                taxa_entrega REAL
            )
        `);

        // 2. Tabela de Produtos
        await db.query(`
            CREATE TABLE IF NOT EXISTS produtos (
                id SERIAL PRIMARY KEY,
                loja_id INTEGER REFERENCES lojas(id),
                nome TEXT,
                descricao TEXT,
                preco REAL,
                categoria TEXT
            )
        `);

        // 3. Tabela de Pedidos
        await db.query(`
            CREATE TABLE IF NOT EXISTS pedidos (
                id SERIAL PRIMARY KEY,
                itens TEXT,
                total REAL,
                status TEXT DEFAULT 'Em preparação',
                data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Inserir dados iniciais na tabela produtos se estiver vazia
        const resProdutos = await db.query(`SELECT COUNT(*) as count FROM produtos`);
        if (parseInt(resProdutos.rows[0].count) === 0) {
            // Insere também uma loja padrão se não existir
            const resLojas = await db.query(`SELECT COUNT(*) as count FROM lojas`);
            if (parseInt(resLojas.rows[0].count) === 0) {
                await db.query(`
                    INSERT INTO lojas (id, nome, descricao, categoria, avaliacao, tempo_entrega, taxa_entrega) 
                    VALUES (1, 'DTudo Burger', 'Os melhores lanches e combos da região.', 'Lanches', 4.8, '30-40 min', 5.00)
                    ON CONFLICT (id) DO NOTHING
                `);
            }

            await db.query(`
                INSERT INTO produtos (loja_id, nome, descricao, preco, categoria) VALUES 
                (1, 'Burger Smash Duplo', 'Dois hambúrgueres de 100g, queijo cheddar inglês, bacon caramelizado no pão brioche.', 28.90, 'Destaques'),
                (1, 'Burger Crispy Chicken', 'Frango empanado crocante, alface americana, molho ranch e pão brioche.', 26.50, 'Destaques'),
                (1, 'Combo Bacon King', 'Burger triplo bacon, batata rústica G e refrigerante lata 350ml.', 42.00, 'Combos'),
                (1, 'Combo Família Smash', '4 Burger Smash Duplos, 2 batatas grandes e refrigerante 2 litros.', 89.90, 'Combos'),
                (1, 'Milkshake de Nutella 500ml', 'Milkshake cremoso com gelato de baunilha e muita Nutella pura.', 21.90, 'Sobremesas'),
                (1, 'Pudim Leite Condensado', 'Fatia generosa de pudim tradicional com calda de caramelo.', 12.00, 'Sobremesas')
            `);
            console.log('Dados iniciais inseridos com sucesso no Supabase!');
        }
    } catch (err) {
        console.error('Erro ao inicializar tabelas:', err.message);
    }
}

inicializarBanco();

// --- ROTAS DA API ---

// Listar Lojas
app.get('/lojas', async (req, res) => {
    try {
        const resultado = await db.query(`SELECT * FROM lojas`);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Listar Produtos de uma Loja específica
app.get('/lojas/:id/produtos', async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await db.query(`SELECT * FROM produtos WHERE loja_id = $1`, [id]);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Criar Pedido (Checkout)
app.post('/pedidos', async (req, res) => {
    const { itens, total } = req.body;
    try {
        const resultado = await db.query(
            `INSERT INTO pedidos (itens, total) VALUES ($1, $2) RETURNING id`, 
            [JSON.stringify(itens), total]
        );
        res.json({ id: resultado.rows[0].id, mensagem: 'Pedido realizado com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Listar Histórico de Pedidos
app.get('/pedidos', async (req, res) => {
    try {
        const resultado = await db.query(`SELECT * FROM pedidos ORDER BY id DESC`);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// --- NOVAS ROTAS PARA O RASTREAMENTO E PAINEL ---

// 1. Buscar um pedido específico pelo ID
app.get('/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await db.query(`SELECT * FROM pedidos WHERE id = $1`, [id]);
        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Pedido não encontrado' });
        }
        
        const row = resultado.rows[0];
        res.json({
            id: row.id,
            itens: typeof row.itens === 'string' ? JSON.parse(row.itens) : row.itens,
            total: row.total,
            status: row.status,
            data: row.data,
            pixCopiaECola: `00020126580014BR.GOV.BCB.PIX0136DTUDO-PAYMENT-${row.id}-${row.data}`
        });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// 2. Atualizar o status do pedido
app.put('/pedidos/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const resultado = await db.query(
            `UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING id`, 
            [status, id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Pedido não encontrado' });
        }
        
        res.json({ sucesso: true, mensagem: `Status atualizado para: ${status}` });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Iniciar Servidor
app.listen(3000, () => {
    console.log('Servidor a correr na porta 3000 (http://localhost:3000)');
});