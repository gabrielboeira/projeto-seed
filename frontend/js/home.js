const grid = document.getElementById("product-grid");
let produtosFiltrados = [];

function waitForFirebase(callback, tentativas = 0) {
  if (window.firebaseUtils) {
    callback();
  } else if (tentativas < 20) {
    setTimeout(() => waitForFirebase(callback, tentativas + 1), 100);
  } else {
    console.warn("Firebase não carregou, usando dados locais.");
    callback();
  }
}

async function initHomePage() {
  let lista = [];
  if (window.firebaseUtils) {
    lista = await window.firebaseUtils.fetchProdutosFromFirebase();
  }
  if (lista && lista.length > 0) {
    window.produtos = lista;
    produtos = lista;
  }
  produtosFiltrados = [...produtos];
  renderizarProdutos();
}

function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(price);
}

function filtrarProdutos(categoria) {
  produtosFiltrados = categoria === 'all' ? [...produtos] : produtos.filter(p => p.categoria === categoria);
  renderizarProdutos();
}

document.querySelectorAll('.category-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    filtrarProdutos(tab.dataset.category);
  });
});

window.addToCart = function(productId, event) {
  if (event) event.stopPropagation();
  const product = produtos.find(p => String(p.id) === String(productId));
  if (!product) return;
  cartManager.addItem(product);
  if (event && event.target) {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '✓ Adicionado!';
    button.style.background = '#4caf50';
    setTimeout(() => { button.textContent = originalText; button.style.background = ''; }, 2000);
  }
};

// Índice de imagem atual por produto
const imageIndexMap = {};

window.changeImage = function(productId, direction, event) {
  if (event) event.stopPropagation();
  const product = produtos.find(p => String(p.id) === String(productId));
  if (!product) return;

  const imagens = (product.imagens && product.imagens.length > 0) ? product.imagens : [product.imagem];
  if (imagens.length <= 1) return;

  if (imageIndexMap[productId] === undefined) imageIndexMap[productId] = 0;
  imageIndexMap[productId] = (imageIndexMap[productId] + direction + imagens.length) % imagens.length;

  const imgEl = document.querySelector(`.product-card[data-id="${productId}"] .product-card-img`);
  const dotsEl = document.querySelectorAll(`.product-card[data-id="${productId}"] .img-dot`);

  if (imgEl) {
    imgEl.style.opacity = '0';
    setTimeout(() => { imgEl.src = imagens[imageIndexMap[productId]]; imgEl.style.opacity = '1'; }, 150);
  }
  dotsEl.forEach((dot, i) => dot.classList.toggle('active', i === imageIndexMap[productId]));
};

function renderizarProdutos() {
  grid.innerHTML = '';

  if (produtosFiltrados.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px 0;">Nenhum produto encontrado.</p>';
    return;
  }

  produtosFiltrados.forEach((produto, index) => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.dataset.id = produto.id;
    card.style.animationDelay = `${index * 0.1}s`;

    const imagens = (produto.imagens && produto.imagens.length > 0) ? produto.imagens : [produto.imagem].filter(Boolean);
    const imgSrc = imagens[0] || 'assets/produtos/img/S33D.png';
    const temVarias = imagens.length > 1;

    const dotsHTML = temVarias
      ? `<div class="img-dots">${imagens.map((_, i) => `<span class="img-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}</div>`
      : '';

    const setasHTML = temVarias
      ? `<button class="img-arrow img-arrow-left" onclick="changeImage('${produto.id}', -1, event)">&#8249;</button>
         <button class="img-arrow img-arrow-right" onclick="changeImage('${produto.id}', 1, event)">&#8250;</button>`
      : '';

    card.innerHTML = `
      <div class="product-image-wrapper">
        <img class="product-card-img" src="${imgSrc}" alt="${produto.nome}" loading="lazy"
          style="transition: opacity 0.15s;" onerror="this.src='assets/produtos/img/S33D.png'">
        ${setasHTML}
        ${dotsHTML}
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
          <button class="btn-add-cart" onclick="addToCart('${produto.id}', event)">Adicionar</button>
        </div>
      </div>
    `;

    card.addEventListener("click", (e) => {
      const tag = e.target.classList;
      if (!tag.contains('btn-add-cart') && !tag.contains('img-arrow') &&
          !tag.contains('img-arrow-left') && !tag.contains('img-arrow-right')) {
        window.location.href = `produto.html?id=${produto.id}`;
      }
    });

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const rotateX = (e.clientY - rect.top - rect.height / 2) / 20;
      const rotateY = (rect.width / 2 - (e.clientX - rect.left)) / 20;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });
    card.addEventListener("mouseleave", () => { card.style.transform = ''; });

    grid.appendChild(card);
  });

  setTimeout(() => {
    document.querySelectorAll('.product-card').forEach(c => observer.observe(c));
  }, 100);
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => waitForFirebase(initHomePage));
} else {
  waitForFirebase(initHomePage);
}

document.querySelector('.newsletter-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Obrigado por se inscrever! Você receberá nossas novidades em breve.');
  e.target.reset();
});