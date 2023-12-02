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
    const token = generateToken(); // Gera um token único

    try {
        for (const note of notes) {
            let sql = 'INSERT INTO notes SET ?, token = ?';
            await queryAsync(sql, [note, token]);
        }
        res.json({ message: 'Notas salvas com sucesso', token: token });
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

// Era usado inicialmente para recuperar todos as anotações do banco de dados mysql.
// app.get('/getnotes', async (req, res) => {
//     try {
//         let sql = 'SELECT * FROM notes';
//         const notes = await queryAsync(sql);
//         res.json(notes);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Erro ao recuperar notas do banco de dados');
//     }
// });

app.delete('/deletenote/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let sql = 'DELETE FROM notes WHERE id = ?';
        await queryAsync(sql, [id]);
        res.send('Nota excluída com sucesso');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao excluir nota do banco de dados');
    }
});

app.get('/getnote/:token', async (req, res) => {
    const { token } = req.params;
    try {
        let sql = 'SELECT * FROM notes WHERE token = ?';
        const notes = await queryAsync(sql, [token]);
        if (notes.length > 0) {
            res.json(notes);
        } else {
            res.status(404).send('Nenhuma nota encontrada para este token');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao recuperar notas do banco de dados');
    }
});

