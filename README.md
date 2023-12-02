Como rodar:
na raíz do projeto rode o comando 'npm install' e depois deixe rodando o comando 'npm run dev'.
entre na pasta backend e rode o comando 'npm install' e depois deixe rodando o comando 'node server.js'.

crie um banco de dados com o nome 'speedio' por exemplo e crie o banco de dados com o seguinte sql:
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT,
    potential DECIMAL(9,2),
    categorization VARCHAR(255),
    reminder DATETIME,
    token VARCHAR(255)
);