// ── Utilitários ──────────────────────────────────────
function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(price);
}

// ── Renderizar carrinho ───────────────────────────────
function renderCart() {
  const cartItems   = document.getElementById('cart-items');
  const cartEmpty   = document.getElementById('cart-empty');
  const cartWrapper = document.querySelector('.cart-wrapper');
  const cart        = cartManager.cart;

  if (cart.length === 0) {
    if (cartWrapper) cartWrapper.style.display = 'none';
    cartEmpty.style.display = 'block';
    updateSummary();
    return;
  }

  if (cartWrapper) cartWrapper.style.display = 'grid';
  cartEmpty.style.display = 'none';

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item" data-index="${index}">
      <a href="produto.html?id=${item.id}" class="cart-item-image">
        <img src="${item.imagem}" alt="${item.nome}" onerror="this.style.opacity=0.3">
      </a>
      <div class="cart-item-info">
        <h3><a href="produto.html?id=${item.id}">${item.nome}</a></h3>
        ${item.tamanho ? `<p class="cart-item-size">Tamanho: ${item.tamanho}</p>` : ''}
        <div class="cart-item-price">
          <span class="price">${formatPrice(item.preco)}</span>
        </div>
      </div>
      <div class="cart-item-quantity">
        <button class="qty-btn" onclick="alterarQuantidade(${index}, -1)">−</button>
        <input type="number" value="${item.quantidade}" min="1"
          onchange="definirQuantidade(${index}, this.value)">
        <button class="qty-btn" onclick="alterarQuantidade(${index}, 1)">+</button>
      </div>
      <div class="cart-item-total">
        ${formatPrice(item.preco * item.quantidade)}
      </div>
      <button class="cart-item-remove" onclick="removerItem(${index})" title="Remover item">×</button>
    </div>
  `).join('');

  updateSummary();
}

// ── Alterar quantidade (+1 ou -1) ─────────────────────
function alterarQuantidade(index, delta) {
  const item = cartManager.cart[index];
  if (!item) return;

  const novaQtd = item.quantidade + delta;

  if (novaQtd < 1) {
    removerItem(index);
    return;
  }

  cartManager.cart[index].quantidade = novaQtd;
  cartManager.saveCart();
  renderCart();
}

// ── Definir quantidade manualmente ───────────────────
function definirQuantidade(index, valor) {
  let quantidade = parseInt(valor);
  if (!quantidade || quantidade < 1) quantidade = 1;

  const item = cartManager.cart[index];
  if (!item) return;

  cartManager.cart[index].quantidade = quantidade;
  cartManager.saveCart();
  renderCart();
}

// ── Remover item ──────────────────────────────────────
function removerItem(index) {
  const item = cartManager.cart[index];
  if (!item) return;

  if (confirm(`Remover "${item.nome}" do carrinho?`)) {
    cartManager.cart.splice(index, 1);
    cartManager.saveCart();
    renderCart();
  }
}

// ── Atualizar resumo ──────────────────────────────────
function updateSummary() {
  const total = cartManager.getTotal();
  document.getElementById('subtotal').textContent = formatPrice(total);
  document.getElementById('total').textContent    = formatPrice(total);
}

// ── Ir para checkout ──────────────────────────────────
function checkout() {
  if (cartManager.cart.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }
  window.location.href = 'checkout.html';
}

// ── Init ─────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderCart);
} else {
  renderCart();
}