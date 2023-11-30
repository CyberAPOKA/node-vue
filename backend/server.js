const express = require('express');
const cors = require('cors');
const app = express();

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
