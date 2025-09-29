// Dados Fictícios de Produtos (Fake Store)
// NOTA: Os produtos iniciais usam URLs de imagens de exemplo (picsum.photos).
// Produtos cadastrados pelo usuário usarão URLs temporárias do navegador.
let products = [
  {
    id: 1,
    name: "Mouse Gamer Ultra",
    price: 159.9,
    image: "https://picsum.photos/400/300?random=1",
    stock: 10,
  },
  {
    id: 2,
    name: "Teclado Mecânico RGB",
    price: 349.0,
    image: "https://picsum.photos/400/300?random=2",
    stock: 5,
  },
  {
    id: 3,
    name: "Monitor 27' 4K Curvo",
    price: 2999.99,
    image: "https://picsum.photos/400/300?random=3",
    stock: 3,
  },
  {
    id: 4,
    name: "Webcam Streaming HD",
    price: 199.5,
    image: "https://picsum.photos/400/300?random=4",
    stock: 12,
  },
  {
    id: 5,
    name: "Fone Bluetooth Cancelamento",
    price: 499.0,
    image: "https://picsum.photos/400/300?random=5",
    stock: 8,
  },
  {
    id: 6,
    name: "Placa Gráfica XGT 4090",
    price: 8999.0,
    image: "https://picsum.photos/400/300?random=6",
    stock: 1,
  },
];

// Estado global do carrinho
let cart = [];
const SHIPPING_COST = 20.0;
let nextProductId = products.length + 1;

// Elementos DOM
const productsListEl = document.getElementById("products-list");
const cartItemsEl = document.getElementById("cart-items");
const cartCountEl = document.getElementById("cart-count");
const cartSubtotalEl = document.getElementById("cart-subtotal");
const cartTotalEl = document.getElementById("cart-total");
const checkoutButton = document.querySelector(".checkout-button");
const emptyCartMessage = document.getElementById("empty-cart-message");
const addProductForm = document.getElementById("add-product-form");

// --- Funções Auxiliares (Mantidas) ---

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// --- Funções de Renderização do Catálogo (Atualizada para remover products.find) ---

function renderProducts() {
  productsListEl.innerHTML = "";
  products.forEach((product, index) => {
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    productCard.style.animation = `slideUp 0.5s ease-out ${
      index * 0.1
    }s forwards`;

    const isOutOfStock = product.stock === 0;
    const buttonText = isOutOfStock ? "Esgotado" : "Adicionar ao Carrinho";

    const stockMessage =
      product.stock < 5 && product.stock > 0
        ? `<p class="stock-info">Apenas ${product.stock} em estoque!</p>`
        : "";

    productCard.innerHTML = `
            <button class="remove-product-btn" data-id="${
              product.id
            }">×</button>
            <img src="${product.image}" alt="${product.name}">
            <div class="card-info">
                <h3>${product.name}</h3>
                <p class="product-price">${formatCurrency(product.price)}</p>
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
  const price = parseFloat(document.getElementById("product-price").value);
  const stock = parseInt(document.getElementById("product-stock").value);
  const fileInput = document.getElementById("product-image-file");

  // NOVO: Pega o arquivo de imagem selecionado
  const file = fileInput.files[0];

  if (!file) {
    alert("Por favor, selecione uma imagem.");
    return;
  }

  // Cria uma URL de Objeto temporária para exibição da imagem
  const tempImageUrl = URL.createObjectURL(file);

  const newProduct = {
    id: nextProductId++,
    name: name,
    price: price,
    image: tempImageUrl, // Usa a URL temporária
    stock: stock,
  };

  products.push(newProduct);
  addProductForm.reset();

  renderProducts();

  alert(
    `Produto "${name}" cadastrado com sucesso! \n(Lembre-se: A imagem só é visível enquanto a página estiver aberta).`
  );
}

function handleRemoveProductFromCatalog(e) {
  const productIdToRemove = parseInt(e.currentTarget.getAttribute("data-id"));

  // Otimização: Libera a URL de objeto se for um produto criado pelo usuário
  const removedProduct = products.find((p) => p.id === productIdToRemove);
  if (removedProduct && removedProduct.image.startsWith("blob:")) {
    URL.revokeObjectURL(removedProduct.image);
  }

  products = products.filter((p) => p.id !== productIdToRemove);
  cart = cart.filter((item) => item.id !== productIdToRemove);

  renderProducts();
  renderCart();

  alert("Produto removido do catálogo.");
}

// --- Funções do Carrinho (Mantidas) ---

// (renderCart, updateCartSummary, handleAddToCart, handleRemoveFromCart e handleCheckout permanecem os mesmos)
// ... (Copie as funções do script.js anterior e cole aqui, ou use as mesmas)

function renderCart() {
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
                <span>${formatCurrency(item.price * item.quantity)}</span>
                <button class="remove-item-btn" data-id="${item.id}">×</button>
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
  const product = products.find((p) => p.id === productId);

  if (!product || product.stock === 0) {
    alert("Produto esgotado!");
    return;
  }

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }

  product.stock--;
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
  const product = products.find((p) => p.id === itemId);

  if (itemIndex > -1) {
    cart[itemIndex].quantity--;

    if (cart[itemIndex].quantity === 0) {
      cart.splice(itemIndex, 1);
    }
  }

  if (product) product.stock++;

  renderProducts();
  renderCart();
}

function handleCheckout() {
  if (cart.length > 0) {
    alert(
      `Obrigado por sua compra! Total: ${cartTotalEl.textContent}. O pedido será enviado.`
    );

    cart = [];

    renderCart();
  } else {
    alert("Seu carrinho está vazio. Adicione itens para finalizar a compra.");
  }
}

// --- Inicialização ---

function initStore() {
  renderProducts();
  renderCart();

  checkoutButton.addEventListener("click", handleCheckout);
  addProductForm.addEventListener("submit", handleAddProduct);
}

document.addEventListener("DOMContentLoaded", initStore);
