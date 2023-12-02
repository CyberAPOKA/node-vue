const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// gera um token de numeros e letras com 16 caracteres.
function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}

// configuração inicial do servidor Express
const app = express();
app.use(cors());
app.use(express.json());

// verifica se o servidor está funcionando.
app.get('/', (req, res) => {
    res.send('Servidor Express rodando!');
});

// inicialização do servidor na porta especificada
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

const mysql = require('mysql');

// configuração da conexão com o banco de dados MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'speedio'
});

// faz a conexão
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conectado ao MySQL');
});

// salva uma anotação com o token no banco de dados.
app.post('/persistnotes', async (req, res) => {
    const notes = req.body;
    const token = generateToken();

    try {
        for (const note of notes) {
            let sql = 'INSERT INTO notes SET ?, token = ?';
            await queryAsync(sql, [note, token]);
        }
        res.json({ message: 'Notas salvas com sucesso', token: token });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao salvar anotações no banco de dados');
    }
});

// função para realizar queries SQL de forma assíncrona
function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

// deleta uma anotação do banco de dados.
app.delete('/deletenote/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let sql = 'DELETE FROM notes WHERE id = ?';
        await queryAsync(sql, [id]);
        res.send('Anotação excluída com sucesso');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao excluir anotação do banco de dados');
    }
});

// recupera uma anotação específica através do token inserido, fazendo a verificação com o where na coluna token do banco de dados.
app.get('/getnote/:token', async (req, res) => {
    const { token } = req.params;
    try {
        let sql = 'SELECT * FROM notes WHERE token = ?';
        const notes = await queryAsync(sql, [token]);
        if (notes.length > 0) {
            res.json(notes);
        } else {
            res.status(404).send('Nenhuma anotação encontrada para este token');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao recuperar anotações do banco de dados');
    }
});

