/*const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;

// Conexão com o Banco de Dados
const db = mysql.createConnection({
    host: "aws-0-sa-east-1.pooler.supabase.com",
    user: "postgres.dtfhnixrqylyicvyqqlt",
    password: "G9bQbJZjB9jntcpU",
    database: "postgres",
    port:"6543"
});

db.connect((err) => {
    if (err) throw err;
    console.log("Conectado ao banco de dados MySQL!");
});

app.use(bodyParser.json());
app.use(express.static("."));*/
const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3001;

// Middleware
app.use(bodyParser.json());

// Configuração do Pool de Conexões PostgreSQL
const pool = new Pool({
  host: "aws-0-sa-east-1.pooler.supabase.com",
  user: "postgres.dtfhnixrqylyicvyqqlt",
  password: "ecvLlMTPSIsivRCq",
  database: "postgres",
  port: 6543,
  ssl: {
    rejectUnauthorized: false // Necessário para conexões SSL do Supabase
  },
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo máximo que uma conexão pode ficar inativa
  connectionTimeoutMillis: 2000 // tempo máximo para estabelecer uma conexão
});

// Teste inicial da conexão
pool.connect()
  .then(client => {
    console.log("Conectado ao PostgreSQL via Supabase com sucesso!");
    client.release();
  })
  .catch(err => {
    console.error("Erro ao conectar ao PostgreSQL:", err);
  });

// Função utilitária para executar queries
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (err) {
    console.error("Erro na query:", err);
    throw err;
  } finally {
    client.release();
  }
};

// Exemplo de rota para criar usuário
app.post("/users", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Query para inserir usuário
    const result = await query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    
    res.status(201).json({
      success: true,
      user: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Exemplo de rota para login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Senha incorreta"
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Erro interno do servidor"
  });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  pool.end()
    .then(() => {
      console.log('Pool de conexões fechado');
      process.exit(0);
    })
    .catch(err => {
      console.error('Erro ao fechar pool de conexões:', err);
      process.exit(1);
    });
});
// Rota para Cadastro
app.post("/register", (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
    db.query(sql, [username, hashedPassword], (err, result) => {
        if (err) {
            return res.json({ message: "Erro ao cadastrar usuário!" });
        }
        res.json({ message: "Usuário cadastrado com sucesso!" });
    });
});

// Rota para Login
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username = ?";
    db.query(sql, [username], (err, results) => {
        if (err || results.length === 0) {
            return res.json({ message: "Usuário não encontrado!" });
        }

        const user = results[0];
        const passwordMatch = bcrypt.compareSync(password, user.password);

        if (passwordMatch) {
            res.json({ message: "Login bem-sucedido!" });
        } else {
            res.json({ message: "Senha incorreta!" });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
