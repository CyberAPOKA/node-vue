const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}

const app = express();

// Middleware
app.use(cors()); // Habilita o CORS
app.use(express.json()); // Permite que o servidor entenda JSON

// Rota de Teste
app.get('/', (req, res) => {
    res.send('Servidor Express rodando!');
});

// Definindo a porta do servidor
const PORT = process.env.PORT || 3000;

// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

const mysql = require('mysql');

// Configuração da conexão com o banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'speedio'
});

// Conectando ao banco de dados
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conectado ao MySQL');
});

app.post('/persistnotes', async (req, res) => {
    const notes = req.body;

    try {
        for (const note of notes) {
            let sql = 'INSERT INTO notes SET ?';
            await queryAsync(sql, note);
        }
        res.send('Notas salvas com sucesso');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao salvar notas no banco de dados');
    }
});

function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}
