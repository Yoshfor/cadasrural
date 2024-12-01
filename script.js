// URL base para todas as requisições
const BASE_URL = 'http://localhost:3000';

// Função auxiliar para fazer requisições
async function makeRequest(endpoint, data) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                // Adicione aqui outros headers necessários, como Authorization se precisar
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        return { ok: response.ok, data: result };
    } catch (error) {
        console.error('Erro na requisição:', error);
        return { ok: false, data: { message: "Erro na conexão com o servidor" } };
    }
}

// Função para exibir mensagens
function showMessage(elementId, message, isSuccess) {
    const messageDiv = document.getElementById(elementId);
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = isSuccess ? 'success' : 'error';
        messageDiv.style.display = 'block';
    } /*else {
        alert(message); // Fallback para alert se o elemento de mensagem não existir
    }*/
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {

                window.location.href = "dashboard.html";
            }

            document.getElementById('message').textContent = data.message;
            document.getElementById('message').style.color = response.ok ? 'green' : 'red';
        } catch (error) {
            document.getElementById('message').textContent = 'Erro ao conectar com o servidor.';
            document.getElementById('message').style.color = 'red';
        }
    });
});

// Login
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
        username: document.getElementById("loginUsername").value,
        password: document.getElementById("loginPassword").value
    };
    try {
    const result = await makeRequest('/login',{ username, password });
    showMessage("message", result.data.message, result.ok);

    if (result.ok) {
      window.location.href = "dashboard.html";   
    }
} catch (error) {
   showMessage("message", 'Erro ao conectar com o servidor.', false); 
  }
});

// Registro de usuário
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
        username: document.getElementById("newUsername").value,
        password: document.getElementById("newPassword").value
    };

    const result = await makeRequest('/register', data);
    showMessage("message", result.data.message, result.ok);
});



// Cadastro de clientes
document.getElementById("clientForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
        nome: document.getElementById("nome").value,
        telefone: document.getElementById("telefone").value,
        email: document.getElementById("email").value
    };

    const result = await makeRequest('/clientes', data);
    showMessage("message", result.data.message, result.ok);
    
    if (result.ok) {
        document.getElementById("clientForm").reset();
    }
});

// Gestão de Estoque
document.getElementById("productForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
        nome: document.getElementById("productName").value,
        quantidade: document.getElementById("quantity").value,
        preco: document.getElementById("price").value
    };

    const result = await makeRequest('/produtos', data);
    showMessage("message", result.data.message, result.ok);
    
    if (result.ok) {
        document.getElementById("productForm").reset();
    }
});

// Função para carregar os produtos no formulário para edição
async function carregarProdutosParaEdicao() {
  try {
    const response = await fetch("http://localhost:3000/produtos");
    const result = await response.json();

    if (response.ok) {
      const produtoSelect = document.getElementById("produtoId");
      produtoSelect.innerHTML = ""; // Limpar opções anteriores

      result.produtos.forEach(produto => {
        const option = document.createElement("option");
        option.value = produto.id;
        option.textContent = `${produto.nome} (ID: ${produto.id})`;
        produtoSelect.appendChild(option);
      });
    } else {
      alert(result.message);
    }
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
    alert("Erro ao carregar produtos.");
  }
}

// Função para atualizar um produto
document.getElementById("atualizarProdutoForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = document.getElementById("produtoId").value;
  const nome = document.getElementById("produtoNome").value;
  const preco = document.getElementById("produtoPreco").value;
  const quantidade = document.getElementById("produtoQuantidade").value;

  const data = { nome, preco: parseFloat(preco), quantidade: parseInt(quantidade) };

  try {
    const response = await fetch(`http://localhost:3000/produtos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
      alert(result.message); // Mensagem de sucesso
      carregarProdutosParaEdicao(); // Recarregar a lista de produtos
    } else {
      alert(result.message); // Mensagem de erro
    }
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    alert("Erro ao atualizar produto.");
  }
});
