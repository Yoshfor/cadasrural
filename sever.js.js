const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require('cors');
const { Script } = require("vm");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração básica do CORS
app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(express.static("."));

// Configuração corrigida do Pool de Conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

module.exports = app;

// Função simplificada para testar a conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Conexão com banco de dados estabelecida:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('Erro ao conectar ao banco:', err.message);
    process.exit(1); // Encerra o processo se não conseguir conectar
  }
};

// Função para executar queries com retry
const executeQuery = async (text, params, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(text, params);
        return result;
      } finally {
        client.release();
      }
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
};
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  console.log("Recebido no login:", username); // Para verificar se o username chegou corretamente

  try {
    // Executa a consulta SQL
    const result = await executeQuery(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    // Verifica se o usuário foi encontrado
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado!",
      });
    }

    const user = result.rows[0];
    console.log("Usuário encontrado:", user);

    // Valida a senha usando bcrypt
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Senha incorreta!",
      });
    }

    // Login bem-sucedido
    res.json({
      success: true,
      message: "Login bem-sucedido!",
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    // Tratamento detalhado de erro
    console.error("Erro no login:", err);

    res.status(500).json({
      success: false,
      message: "Erro ao realizar login. Tente novamente mais tarde.",
    });
  }
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
  }

  try {
    // Verifica se o usuário já existe
    const result = await executeQuery(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length > 0) {
      return res.status(409).json({ message: 'Nome de usuário já existe!' });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insere o novo usuário no banco de dados
    await executeQuery(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Usuário cadastrado com sucesso!"
    });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ message: 'Erro ao registrar usuário!' });
  }
});


app.post("/clientes", async (req, res) => {
    const { nome, telefone, email } = req.body;
    
    console.log('/clientes:', nome, telefone, email)

    const sql = "INSERT INTO clientes (nome, telefone, email) VALUES ($1, $2, $3)";
    
    try {
      console.log('start transaction database')
      await executeQuery(sql,[nome, telefone, email]);
      
      console.log('success!')

      res.json({
        success: true,
        message: "Cadastro realizado com sucesso!",
        user: {          
          nome,
          telefone,
          email,
        }
      });
    } catch (err) {
      console.error('Erro no cadastro:', err);
      res.status(500).json({
        success: false,
        message: "Erro ao realizar cadastro!"
      });
    }

  });

app.post("/produtos", async (req, res) => {
  const { nome, quantidade, valor } = req.body;

   console.log('/produtos:', nome, quantidade, valor)

  const sql = "INSERT INTO produtos (nome, quantidade, preco) VALUES ($1, $2, $3)";
  
  try {
    console.log('start transaction database')
    await executeQuery(sql,[nome, quantidade, valor]);
    
    console.log('success!')

    res.json({
      success: true,
      message: "Cadastro realizado com sucesso!",
      user: {          
        nome,
        quantidade,
        valor,
      }
    });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    res.status(500).json({
      success: false,
      message: "Erro ao realizar cadastro!"
    });
  }

});
// Rota para listar produtos
app.get("/produtos", async (req, res) => {
  try {
    const result = await executeQuery("SELECT * FROM produtos ORDER BY id ASC");
    const produtos = result.rows.map(produto => ({
      ...produto,
      preco: produto.preco || 0.00 // Valor padrão caso `preco` esteja ausente ou `null`
    }));
    res.json({ success: true, produtos });
  } catch (err) {
    console.error("Erro ao buscar produtos:", err.message);
    res.status(500).json({ success: false, message: "Erro ao buscar produtos!" });
  }
});

// Rota para excluir produto
app.delete("/produtos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await executeQuery("DELETE FROM produtos WHERE id = $1", [id]);
    if (result.rowCount > 0) {
      res.json({ success: true, message: "Produto excluído com sucesso!" });
    } else {
      res.status(404).json({ success: false, message: "Produto não encontrado!" });
    }
  } catch (err) {
    console.error("Erro ao excluir produto:", err);
    res.status(500).json({ success: false, message: "Erro ao excluir produto!" });
  }
});

// Rota para atualizar informações de um produto
app.put("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, preco, quantidade } = req.body;

  // Validar os campos obrigatórios
  if (!nome || preco == null || quantidade == null) {
    return res.status(400).json({ 
      success: false, 
      message: "Nome, preço e quantidade são obrigatórios!" 
    });
  }

  try {
    // Verificar se o produto existe
    const produtoExistente = await executeQuery("SELECT * FROM produtos WHERE id = $1", [id]);
    if (produtoExistente.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Produto não encontrado!" 
      });
    }

    // Atualizar o produto
    const result = await executeQuery(
      "UPDATE produtos SET nome = $1, preco = $2, quantidade = $3 WHERE id = $4",
      [nome, preco, quantidade, id]
    );

    if (result.rowCount > 0) {
      res.json({ success: true, message: "Produto atualizado com sucesso!" });
    } else {
      res.status(400).json({ 
        success: false, 
        message: "Erro ao atualizar produto!" 
      });
    }
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    res.status(500).json({ success: false, message: "Erro ao atualizar produto!" });
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Erro interno do servidor"
  });
});
app.get("/clientes", async (_req, res) => {
  try {
    const result = await executeQuery("SELECT * FROM clientes ORDER BY id ASC");
    res.json({
      success: true,
      clientes: result.rows,
    });
  } catch (err) {
    console.error("Erro ao listar clientes:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar clientes.",
    });
  }
});
// Rota para excluir cliente
app.delete("/clientes/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await executeQuery("DELETE FROM clientes WHERE id = $1", [id]);
    
    if (result.rowCount > 0) {
      res.json({ success: true, message: "Cliente excluído com sucesso!" });
    } else {
      res.status(404).json({ success: false, message: "Cliente não encontrado!" });
    }
  } catch (err) {
    console.error('Erro ao excluir cliente:', err);
    res.status(500).json({ success: false, message: "Erro ao excluir cliente!" });
  }
});

// Graceful shutdown
async function shutdown() {
  try {
    await pool.end();
    console.log('Pool de conexões fechado');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao fechar pool de conexões:', err);
    process.exit(1);
  }
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Inicialização do servidor com teste de conexão
(async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Falha ao iniciar servidor:', err);
    process.exit(1);
  }
})();
