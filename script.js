// Remove os dados fictícios locais, agora usaremos a API
let products = [];
let cart = [];
const SHIPPING_COST = 20.0;

// URL da sua API (ajuste se necessário, dependendo da sua porta/ambiente)
const BASE_URL = "./api/";

const API_URL = BASE_URL + "produtos.php";
const VENDAS_API_URL = BASE_URL + "vendas.php";

// Elementos DOM (mantidos)
const productsListEl = document.getElementById("products-list");
const cartItemsEl = document.getElementById("cart-items");
const cartCountEl = document.getElementById("cart-count");
const cartSubtotalEl = document.getElementById("cart-subtotal");
const cartTotalEl = document.getElementById("cart-total");
const checkoutButton = document.querySelector(".checkout-button");
const emptyCartMessage = document.getElementById("empty-cart-message");
const addProductForm = document.getElementById("add-product-form");
let nextProductId = 1; // Não é mais estritamente necessário, mas mantemos para o formulário

// --- API FUNCTIONS (Comunicação com PHP) ---

// R: READ (Ler Produtos)
async function fetchProducts() {
  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (result.success) {
      products = result.data; // Atualiza o array global com dados do BD
      renderProducts();
    } else {
      console.error("Erro ao buscar produtos:", result.message);
      alert(
        "Erro ao carregar o catálogo. Verifique a conexão com o banco de dados."
      );
    }
  } catch (error) {
    console.error("Erro na requisição GET:", error);
    alert("Falha na comunicação com o servidor PHP.");
  }
}

// C: CREATE (Criar Produto)
async function apiCreateProduct(formData) {
  try {
    // ATENÇÃO: Ao usar FormData, o cabeçalho 'Content-Type': 'application/json' NÃO DEVE ser enviado.
    const response = await fetch(API_URL, {
      method: "POST",
      // O navegador configura o cabeçalho 'Content-Type: multipart/form-data' automaticamente com FormData.
      body: formData,
    });
    const result = await response.json();

    if (result.success) {
      alert(`Produto cadastrado com sucesso!`);
      fetchProducts(); // Recarrega a lista
      addProductForm.reset();
    } else {
      alert(`Erro ao cadastrar produto: ${result.message}`);
    }
  } catch (error) {
    console.error("Erro na requisição POST:", error);
    alert("Falha na comunicação com o servidor ao cadastrar.");
  }
}

// D: DELETE (Deletar Produto)
async function apiDeleteProduct(id) {
  try {
    const response = await fetch(`${API_URL}?id=${id}`, {
      method: "DELETE",
    });
    const result = await response.json();

    if (result.success) {
      alert(result.message);
      fetchProducts(); // Recarrega a lista
    } else {
      alert(`Erro ao deletar produto: ${result.message}`);
    }
  } catch (error) {
    console.error("Erro na requisição DELETE:", error);
    alert("Falha na comunicação com o servidor ao deletar.");
  }
}

// --- Funções Auxiliares (Mantidas) ---

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// --- Funções de Renderização do Catálogo (Atualizada para usar 'products' vindo da API) ---

function renderProducts() {
  productsListEl.innerHTML = "";
  products.forEach((product, index) => {
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    productCard.style.animation = `slideUp 0.5s ease-out ${
      index * 0.1
    }s forwards`;

    const isOutOfStock = product.estoque <= 0; // Usa 'estoque' do BD
    const buttonText = isOutOfStock ? "Esgotado" : "Adicionar ao Carrinho";

    const stockMessage =
      product.estoque < 5 && product.estoque > 0
        ? `<p class="stock-info">Apenas ${product.estoque} em estoque!</p>`
        : "";

    productCard.innerHTML = `
            <button class="remove-product-btn" data-id="${
              product.id
            }">×</button>
            <img src="${product.imagem_url}" alt="${product.nome}">
            <div class="card-info">
                <h3>${product.nome}</h3>
                <p class="product-price">${formatCurrency(
                  parseFloat(product.preco)
                )}</p>
                ${stockMessage}
                <button class="add-to-cart-btn" data-id="${product.id}" ${
      isOutOfStock ? "disabled" : ""
    }>
                    ${buttonText}
                </button>
            </div>
        `;
    productsListEl.appendChild(productCard);
  });

  document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
    button.addEventListener("click", handleAddToCart);
  });

  document.querySelectorAll(".remove-product-btn").forEach((button) => {
    button.addEventListener("click", handleRemoveProductFromCatalog);
  });
}

// --- Funções de Manipulação do Catálogo (Atualizada) ---

function handleAddProduct(e) {
  e.preventDefault();

  const name = document.getElementById("product-name").value;
  const price = document.getElementById("product-price").value; // Envia como string, PHP converte
  const stock = document.getElementById("product-stock").value; // Envia como string
  const fileInput = document.getElementById("product-image-file");

  // 1. Cria um objeto FormData
  const formData = new FormData();
  formData.append("nome", name);
  formData.append("preco", price);
  formData.append("estoque", stock);

  // 2. Anexa o arquivo SE ele existir
  if (fileInput.files.length > 0) {
    // 'imagem_arquivo' é o nome que o PHP usará para acessar o arquivo (no $_FILES)
    formData.append("imagem_arquivo", fileInput.files[0]);
  } else {
    alert("Por favor, selecione uma imagem para o produto.");
    return;
  }

  apiCreateProduct(formData);
}

function handleRemoveProductFromCatalog(e) {
  const productIdToRemove = parseInt(e.currentTarget.getAttribute("data-id"));

  // Confirmação antes de deletar
  if (confirm("Tem certeza que deseja remover este produto do catálogo?")) {
    apiDeleteProduct(productIdToRemove);
    // Não precisa manipular o array local, pois a API fará o fetch de novo
  }
}

// --- Funções do Carrinho (Pequenas Modificações para usar 'estoque') ---

function renderCart() {
  // ... (Mantém a lógica de renderização do carrinho)
  // ... (Certifique-se de que a lógica aqui seja copiada do seu script.js original)
  cartItemsEl.innerHTML = "";

  if (cart.length === 0) {
    emptyCartMessage.style.display = "block";
    checkoutButton.disabled = true;
  } else {
    emptyCartMessage.style.display = "none";
    checkoutButton.disabled = false;

    cart.forEach((item, index) => {
      const cartItemEl = document.createElement("div");
      cartItemEl.className = "cart-item";
      cartItemEl.style.animation = `slideUp 0.3s ease-out ${
        index * 0.05
      }s forwards`;

      cartItemEl.innerHTML = `
                        <div class="cart-item-details">
                            ${item.quantity}x <strong>${item.name}</strong>
                        </div>
                        <span>${formatCurrency(
                          item.price * item.quantity
                        )}</span>
                        <button class="remove-item-btn" data-id="${
                          item.id
                        }">×</button>
                    `;
      cartItemsEl.appendChild(cartItemEl);
    });

    document.querySelectorAll(".remove-item-btn").forEach((button) => {
      button.addEventListener("click", handleRemoveFromCart);
    });
  }

  updateCartSummary();
}

function updateCartSummary() {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal + SHIPPING_COST;

  cartCountEl.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartSubtotalEl.textContent = formatCurrency(subtotal);
  cartTotalEl.textContent = formatCurrency(total);
}

function handleAddToCart(e) {
  const productId = parseInt(e.currentTarget.getAttribute("data-id"));
  // Encontra o produto no array 'products' (que agora é do BD)
  const product = products.find((p) => p.id == productId);

  if (!product || product.estoque <= 0) {
    // Usa 'estoque' do BD
    alert("Produto esgotado!");
    return;
  }

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.nome, // Usa 'nome' do BD
      price: parseFloat(product.preco), // Converte para número
      quantity: 1,
    });
  }

  // AQUI: Diminuir estoque no banco de dados (PRÓXIMO PASSO)
  // Por enquanto, diminuiremos só no Front-end para refletir a mudança
  product.estoque--;

  renderProducts();
  renderCart();

  e.currentTarget.style.backgroundColor = "gold";
  setTimeout(() => {
    e.currentTarget.style.backgroundColor = "var(--cor-secundaria)";
  }, 150);
}

function handleRemoveFromCart(e) {
  const itemId = parseInt(e.currentTarget.getAttribute("data-id"));
  const itemIndex = cart.findIndex((item) => item.id === itemId);
  const product = products.find((p) => p.id == itemId);

  if (itemIndex > -1) {
    cart[itemIndex].quantity--;

    if (cart[itemIndex].quantity === 0) {
      cart.splice(itemIndex, 1);
    }
  }

  if (product) product.estoque++; // Aumenta estoque no Front-end

  renderProducts();
  renderCart();
}

// ... (restante do código JS)

async function handleCheckout() {
  if (cart.length === 0) {
    alert("Seu carrinho está vazio. Adicione itens para finalizar a compra.");
    return;
  }

  const subtotalValue = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalValue = subtotalValue + SHIPPING_COST;

  // 1. Monta o objeto de dados para o PHP
  const checkoutData = {
    cart: cart.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price, // O PHP usará o preço do BD, mas enviamos para referência
    })),
    total: totalValue,
    shipping: SHIPPING_COST,
  };

  try {
    const response = await fetch(VENDAS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutData),
    });

    const result = await response.json();

    if (result.success) {
      alert(
        `Compra finalizada! Total: ${formatCurrency(
          totalValue
        )}. ID da Venda: ${result.venda_id}.`
      );

      // 2. Limpa o Front-end e recarrega os dados
      cart = [];
      renderCart();
      await fetchProducts(); // Recarrega para ver o estoque atualizado
    } else {
      alert(`Erro ao finalizar a compra: ${result.message}`);
    }
  } catch (error) {
    console.error("Erro no checkout:", error);
    alert("Falha na comunicação com o servidor ao finalizar a compra.");
  }
}

// --- Inicialização ---

function initStore() {
  fetchProducts(); // NOVO: Carrega os produtos da API ao invés do array local
  renderCart();

  checkoutButton.addEventListener("click", handleCheckout);
  addProductForm.addEventListener("submit", handleAddProduct);
}

document.addEventListener("DOMContentLoaded", initStore);
