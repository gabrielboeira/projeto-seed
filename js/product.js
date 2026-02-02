// Página de Detalhes do Produto
const urlParams = new URLSearchParams(window.location.search);
const productId = parseInt(urlParams.get('id'));

// Inicializar produtos antes de carregar detalhes
async function initProductPage() {
  // TODO: Quando Firebase estiver configurado, usar:
  // await initProdutos();
  
  loadProductDetails();
}

function loadProductDetails() {
  const product = produtos.find(p => p.id === productId);
  
  if (!product) {
    document.querySelector('.product-details').innerHTML = `
      <div class="error-message">
        <h2>Produto não encontrado</h2>
        <a href="index.html" class="btn-back">Voltar para a loja</a>
      </div>
    `;
    return;
  }

  document.querySelector('.product-image').innerHTML = `
    <img src="${product.imagem}" alt="${product.nome}">
  `;

  document.querySelector('.product-info-detail').innerHTML = `
    <h1>${product.nome}</h1>
    <div class="product-price-detail">
      <span class="price">${formatPrice(product.preco)}</span>
    </div>
    <div class="product-description">
      <h3>Descrição</h3>
      <p>Camiseta de alta qualidade com design exclusivo. Tecido macio e confortável, perfeita para o dia a dia. Confeccionada com materiais premium e atenção aos detalhes.</p>
    </div>
    <div class="product-actions">
      <button class="btn-add-to-cart" onclick="addToCartFromDetail(${product.id})">
        Adicionar ao Carrinho
      </button>
      <button class="btn-buy-now" onclick="buyNow(${product.id})">
        Comprar Agora
      </button>
    </div>
    <div class="product-features">
      <div class="feature">
        <span>✓</span> Troca e Devolução em 7 dias
      </div>
      <div class="feature">
        <span>✓</span> Pagamento Seguro
      </div>
    </div>
  `;
}

function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(price);
}

function addToCartFromDetail(productId) {
  const product = produtos.find(p => p.id === productId);
  if (product) {
    cartManager.addItem(product);
  }
}

function buyNow(productId) {
  const product = produtos.find(p => p.id === productId);
  if (product) {
    cartManager.clearCart();
    cartManager.addItem(product);
    window.location.href = 'carrinho.html';
  }
}

// Carregar detalhes quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductPage);
} else {
  initProductPage();
}

