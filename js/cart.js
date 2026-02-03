// Sistema de Gerenciamento de Carrinho
class CartManager {
  constructor() {
    this.cart = this.loadCart();
    this.updateCartCount();
  }

  loadCart() {
    const cartData = localStorage.getItem('s33d_cart');
    return cartData ? JSON.parse(cartData) : [];
  }

  saveCart() {
    localStorage.setItem('s33d_cart', JSON.stringify(this.cart));
    this.updateCartCount();
  }

  addItem(product) {
    // Verificar se já existe o mesmo produto com o mesmo tamanho
    const existingItem = this.cart.find(item => 
      item.id === product.id && 
      item.tamanho === (product.tamanhoSelecionado || null)
    );
    
    if (existingItem) {
      existingItem.quantidade += 1;
    } else {
      this.cart.push({
        id: product.id,
        nome: product.nome,
        preco: product.preco,
        imagem: product.imagem,
        tamanho: product.tamanhoSelecionado || null,
        quantidade: 1
      });
    }
    
    this.saveCart();
    this.showNotification('Produto adicionado ao carrinho!');
    return this.cart;
  }

  removeItem(productId, tamanho = null) {
    if (tamanho) {
      // Remover item específico com tamanho
      this.cart = this.cart.filter(item => 
        !(item.id === productId && item.tamanho === tamanho)
      );
    } else {
      // Remover primeiro item encontrado (compatibilidade)
      const index = this.cart.findIndex(item => item.id === productId);
      if (index > -1) {
        this.cart.splice(index, 1);
      }
    }
    this.saveCart();
    return this.cart;
  }

  updateQuantity(productId, quantity) {
    const item = this.cart.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantidade = quantity;
        this.saveCart();
      }
    }
    return this.cart;
  }

  getTotal() {
    return this.cart.reduce((total, item) => {
      return total + (item.preco * item.quantidade);
    }, 0);
  }

  getTotalItems() {
    return this.cart.reduce((total, item) => total + item.quantidade, 0);
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
  }

  updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
      const count = this.getTotalItems();
      cartCount.textContent = count;
      cartCount.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }

  showNotification(message) {
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}

// Instância global
const cartManager = new CartManager();

// Exportar para uso global
window.cartManager = cartManager;

