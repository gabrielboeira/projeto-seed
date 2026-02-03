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

  const tamanhosHTML = product.tamanhos && product.tamanhos.length > 0 
    ? `
      <div class="product-sizes">
        <h3>Tamanho</h3>
        <div class="size-options">
          ${product.tamanhos.map(tamanho => {
            const estoque = product.estoque && product.estoque[tamanho] !== undefined 
              ? product.estoque[tamanho] 
              : null;
            const disponivel = estoque === null || estoque > 0;
            
            return `
              <button 
                class="size-btn ${!disponivel ? 'unavailable' : ''}" 
                data-size="${tamanho}" 
                ${!disponivel ? 'disabled' : `onclick="selectSize('${tamanho}')"`}
                title="${!disponivel ? 'Tamanho esgotado' : ''}"
              >
                ${tamanho}
              </button>
            `;
          }).join('')}
        </div>
        <p class="size-error" id="size-error" style="display: none; color: #ff6b6b; font-size: 14px; margin-top: 8px;">
          Selecione um tamanho
        </p>
      </div>
    `
    : '';

  document.querySelector('.product-info-detail').innerHTML = `
    <h1>${product.nome}</h1>
    <div class="product-price-detail">
      <span class="price">${formatPrice(product.preco)}</span>
    </div>
    ${tamanhosHTML}
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
  
  // Armazenar tamanhos do produto globalmente
  window.currentProductSizes = product.tamanhos || [];
}

function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(price);
}

// Variável global para tamanho selecionado
let selectedSize = null;

function selectSize(tamanho) {
  selectedSize = tamanho;
  
  // Atualizar visual dos botões
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.size === tamanho) {
      btn.classList.add('active');
    }
  });
  
  // Esconder erro se existir
  const errorMsg = document.getElementById('size-error');
  if (errorMsg) {
    errorMsg.style.display = 'none';
  }
}

function addToCartFromDetail(productId) {
  const product = produtos.find(p => p.id === productId);
  if (!product) return;
  
  // Validar tamanho se o produto tiver tamanhos
  if (product.tamanhos && product.tamanhos.length > 0) {
    if (!selectedSize) {
      const errorMsg = document.getElementById('size-error');
      if (errorMsg) {
        errorMsg.style.display = 'block';
      }
      // Scroll suave até os tamanhos
      document.querySelector('.product-sizes')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      return;
    }
    
    // Verificar se o tamanho está disponível
    const estoque = product.estoque && product.estoque[selectedSize] !== undefined 
      ? product.estoque[selectedSize] 
      : null;
    
    if (estoque !== null && estoque <= 0) {
      alert('Este tamanho está esgotado!');
      return;
    }
  }
  
  // Adicionar produto com tamanho ao carrinho
  const productWithSize = {
    ...product,
    tamanhoSelecionado: selectedSize || null
  };
  
  cartManager.addItem(productWithSize);
  
  // Atualizar estoque local (quando integrar com Firebase, isso será feito no backend)
  if (product.estoque && selectedSize && product.estoque[selectedSize] !== undefined) {
    product.estoque[selectedSize] -= 1;
    updateSizeButtons(product);
  }
  
  // Resetar seleção
  selectedSize = null;
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.classList.remove('active');
  });
}

// Função para atualizar botões de tamanho após mudança no estoque
function updateSizeButtons(product) {
  if (!product.tamanhos || !product.estoque) return;
  
  product.tamanhos.forEach(tamanho => {
    const estoque = product.estoque[tamanho];
    const btn = document.querySelector(`.size-btn[data-size="${tamanho}"]`);
    if (btn) {
      const disponivel = estoque > 0;
      
      if (!disponivel) {
        btn.classList.add('unavailable');
        btn.disabled = true;
        btn.removeAttribute('onclick');
        btn.title = 'Tamanho esgotado';
      } else {
        btn.classList.remove('unavailable');
        btn.disabled = false;
        btn.setAttribute('onclick', `selectSize('${tamanho}')`);
        btn.title = '';
      }
      
      // Manter apenas o texto do tamanho (sem quantidade)
      btn.textContent = tamanho;
    }
  });
}

function buyNow(productId) {
  const product = produtos.find(p => p.id === productId);
  if (!product) return;
  
  // Validar tamanho se o produto tiver tamanhos
  if (product.tamanhos && product.tamanhos.length > 0) {
    if (!selectedSize) {
      const errorMsg = document.getElementById('size-error');
      if (errorMsg) {
        errorMsg.style.display = 'block';
      }
      document.querySelector('.product-sizes')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      return;
    }
    
    // Verificar se o tamanho está disponível
    const estoque = product.estoque && product.estoque[selectedSize] !== undefined 
      ? product.estoque[selectedSize] 
      : null;
    
    if (estoque !== null && estoque <= 0) {
      alert('Este tamanho está esgotado!');
      return;
    }
  }
  
  // Adicionar produto com tamanho ao carrinho
  const productWithSize = {
    ...product,
    tamanhoSelecionado: selectedSize || null
  };
  
  cartManager.clearCart();
  cartManager.addItem(productWithSize);
  
  // Atualizar estoque local (quando integrar com Firebase, isso será feito no backend)
  if (product.estoque && selectedSize && product.estoque[selectedSize] !== undefined) {
    product.estoque[selectedSize] -= 1;
  }
  
  window.location.href = 'carrinho.html';
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

// Carregar detalhes quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductPage);
} else {
  initProductPage();
}

