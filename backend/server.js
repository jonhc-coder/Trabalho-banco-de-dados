const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ mensagem: 'API do Delivery rodando com sucesso!' });
});

app.get('/produtos', (req, res) => {
    db.all('SELECT * FROM produtos', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json({ produtos: rows });
    });
});

app.post('/produtos', (req, res) => {
    const { categoria_id, nome, descricao, preco, imagem_url } = req.body;
    
    const query = `INSERT INTO produtos (categoria_id, nome, descricao, preco, imagem_url) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(query, [categoria_id, nome, descricao, preco, imagem_url], function(err) {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json({ mensagem: 'Produto cadastrado com sucesso!', id: this.lastID });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} (http://localhost:${PORT})`);
});