// Página do Carrinho
function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(price);
}

function renderCart() {
  const cartItems = document.getElementById('cart-items');
  const cartEmpty = document.getElementById('cart-empty');
  const cart = cartManager.cart;

  if (cart.length === 0) {
    cartItems.parentElement.style.display = 'none';
    cartEmpty.style.display = 'block';
    updateSummary();
    return;
  }

  cartItems.innerHTML = cart.map(item => {
    const product = produtos.find(p => p.id === item.id);
    return `
      <div class="cart-item" data-id="${item.id}">
        <a href="produto.html?id=${item.id}" class="cart-item-image">
          <img src="${item.imagem}" alt="${item.nome}">
        </a>
        <div class="cart-item-info">
          <h3><a href="produto.html?id=${item.id}">${item.nome}</a></h3>
          <div class="cart-item-price">
            <span class="price">${formatPrice(item.preco)}</span>
          </div>
        </div>
        <div class="cart-item-quantity">
          <button class="qty-btn" onclick="updateItemQuantity(${item.id}, ${item.quantidade - 1})">-</button>
          <input type="number" value="${item.quantidade}" min="1" 
                 onchange="updateItemQuantity(${item.id}, parseInt(this.value))">
          <button class="qty-btn" onclick="updateItemQuantity(${item.id}, ${item.quantidade + 1})">+</button>
        </div>
        <div class="cart-item-total">
          <span>${formatPrice(item.preco * item.quantidade)}</span>
        </div>
        <button class="cart-item-remove" onclick="removeItem(${item.id})" title="Remover">
          ×
        </button>
      </div>
    `;
  }).join('');

  cartItems.parentElement.style.display = 'grid';
  cartEmpty.style.display = 'none';
  updateSummary();
}

function updateItemQuantity(productId, quantity) {
  cartManager.updateQuantity(productId, quantity);
  renderCart();
}

function removeItem(productId) {
  if (confirm('Deseja remover este item do carrinho?')) {
    cartManager.removeItem(productId);
    renderCart();
  }
}

function updateSummary() {
  const total = cartManager.getTotal();
  document.getElementById('subtotal').textContent = formatPrice(total);
  document.getElementById('total').textContent = formatPrice(total);
}

function checkout() {
  const cart = cartManager.cart;
  if (cart.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }
  
  // Aqui você pode redirecionar para uma página de checkout
  alert('Redirecionando para o checkout...\n\nEm desenvolvimento: Integração com gateway de pagamento');
  // window.location.href = 'checkout.html';
}

// Renderizar carrinho quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderCart);
} else {
  renderCart();
}

