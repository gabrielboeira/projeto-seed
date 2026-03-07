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

  cartItems.innerHTML = cart.map((item, index) => {
    const product = produtos.find(p => p.id === item.id);
    // Criar ID único para cada item (produto + tamanho + índice)
    const itemUniqueId = `${item.id}_${item.tamanho || 'no-size'}_${index}`;
    return `
      <div class="cart-item" data-id="${item.id}" data-index="${index}" data-tamanho="${item.tamanho || ''}">
        <a href="produto.html?id=${item.id}" class="cart-item-image">
          <img src="${item.imagem}" alt="${item.nome}">
        </a>
        <div class="cart-item-info">
          <h3><a href="produto.html?id=${item.id}">${item.nome}</a></h3>
          ${item.tamanho ? `<p class="cart-item-size">Tamanho: ${item.tamanho}</p>` : ''}
          <div class="cart-item-price">
            <span class="price">${formatPrice(item.preco)}</span>
          </div>
        </div>
        <div class="cart-item-quantity">
          <button class="qty-btn" onclick="updateItemQuantity(${item.id}, ${item.quantidade - 1}, '${item.tamanho || ''}', ${index})">-</button>
          <input type="number" value="${item.quantidade}" min="1" 
                 onchange="updateItemQuantity(${item.id}, parseInt(this.value), '${item.tamanho || ''}', ${index})">
          <button class="qty-btn" onclick="updateItemQuantity(${item.id}, ${item.quantidade + 1}, '${item.tamanho || ''}', ${index})">+</button>
        </div>
        <div class="cart-item-total">
          <span>${formatPrice(item.preco * item.quantidade)}</span>
        </div>
        <button class="cart-item-remove" onclick="removeItem(${item.id}, '${item.tamanho || ''}', ${index})" title="Remover">
          ×
        </button>
      </div>
    `;
  }).join('');

  cartItems.parentElement.style.display = 'grid';
  cartEmpty.style.display = 'none';
  updateSummary();
}

function updateItemQuantity(productId, quantity, tamanho, index) {
  // Encontrar item específico pelo índice
  const item = cartManager.cart[index];
  if (!item) return;
  
  const oldQuantity = item.quantidade;
  const difference = quantity - oldQuantity;
  
  // Validar estoque antes de aumentar
  if (difference > 0 && tamanho) {
    const product = produtos.find(p => p.id === productId);
    if (product && product.estoque && product.estoque[tamanho] !== undefined) {
      if (product.estoque[tamanho] < difference) {
        alert(`Apenas ${product.estoque[tamanho]} unidades disponíveis em estoque!`);
        renderCart();
        return;
      }
    }
  }
  
  cartManager.updateQuantity(productId, quantity, tamanho, index);
  
  // Atualizar estoque quando mudar quantidade (quando integrar com Firebase, isso será feito no backend)
  if (item && item.tamanho && difference !== 0) {
    const product = produtos.find(p => p.id === productId);
    if (product && product.estoque && product.estoque[item.tamanho] !== undefined) {
      product.estoque[item.tamanho] -= difference;
      
      // Não permitir estoque negativo
      if (product.estoque[item.tamanho] < 0) {
        product.estoque[item.tamanho] = 0;
      }
    }
  }
  
  renderCart();
}

function removeItem(productId, tamanho, index) {
  if (confirm('Deseja remover este item do carrinho?')) {
    // Encontrar o item antes de remover para restaurar estoque
    const item = cartManager.cart[index];
    
    if (item) {
      // Restaurar estoque quando remover do carrinho (quando integrar com Firebase, isso será feito no backend)
      if (item.tamanho) {
        const product = produtos.find(p => p.id === productId);
        if (product && product.estoque && product.estoque[item.tamanho] !== undefined) {
          product.estoque[item.tamanho] += item.quantidade;
        }
      }
    }
    
    cartManager.removeItem(productId, tamanho);
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

// Scroll suave para links âncora
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Renderizar carrinho quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderCart);
} else {
  renderCart();
}

