const grid = document.getElementById("product-grid");
let produtosFiltrados = [];

// Inicializar produtos (será substituído por Firebase)
async function initHomePage() {
  // TODO: Quando Firebase estiver configurado, usar:
  // await initProdutos();
  // produtosFiltrados = [...produtos];
  
  produtosFiltrados = [...produtos];
  renderizarProdutos();
}

// Função para formatar preço
function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(price);
}


// Função para filtrar produtos por categoria
function filtrarProdutos(categoria) {
  if (categoria === 'all') {
    produtosFiltrados = [...produtos];
  } else {
    produtosFiltrados = produtos.filter(p => p.categoria === categoria);
  }
  renderizarProdutos();
}

// Adicionar event listeners nas categorias
document.querySelectorAll('.category-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    filtrarProdutos(tab.dataset.category);
  });
});

// Função para adicionar ao carrinho (global para uso inline)
window.addToCart = function(productId, event) {
  if (event) event.stopPropagation();
  
  const product = produtos.find(p => p.id === productId);
  if (!product) return;
  
  cartManager.addItem(product);
  
  // Animação de feedback no botão
  if (event && event.target) {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '✓ Adicionado!';
    button.style.background = '#4caf50';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  }
};

// Função para renderizar produtos
function renderizarProdutos() {
  grid.innerHTML = '';
  
  produtosFiltrados.forEach((produto, index) => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
      <div class="product-image-wrapper">
        <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
        <div class="product-overlay">
          <button class="btn-quick-view">Ver Detalhes</button>
        </div>
      </div>
      <div class="product-info">
        <h3>${produto.nome}</h3>
        <div class="product-price">
          <div class="price-wrapper">
            <span class="price">${formatPrice(produto.preco)}</span>
          </div>
          <button class="btn-add-cart" onclick="addToCart(${produto.id}, event)">
            Adicionar
          </button>
        </div>
      </div>
    `;

  // Click no card para ver detalhes
  card.addEventListener("click", (e) => {
    // Não redirecionar se clicou no botão
    if (!e.target.classList.contains('btn-add-cart')) {
      window.location.href = `produto.html?id=${produto.id}`;
    }
  });

  // Efeito de parallax suave no hover
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = '';
  });

    grid.appendChild(card);
  });
  
  // Observar cards de produtos após renderização
  setTimeout(() => {
    document.querySelectorAll('.product-card').forEach(card => {
      observer.observe(card);
    });
  }, 100);
}

// Animação de scroll suave
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

// Intersection Observer para animações ao scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Inicializar página quando carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomePage);
} else {
  initHomePage();
}

// Newsletter form
document.querySelector('.newsletter-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;
  alert('Obrigado por se inscrever! Você receberá nossas novidades em breve.');
  e.target.reset();
});
