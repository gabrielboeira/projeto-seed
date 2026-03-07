// Página de Detalhes do Produto
const urlParams = new URLSearchParams(window.location.search);
const productIdParam = urlParams.get('id');

function waitForFirebase(callback, tentativas = 0) {
  if (window.firebaseUtils) {
    callback();
  } else if (tentativas < 20) {
    setTimeout(() => waitForFirebase(callback, tentativas + 1), 100);
  } else {
    callback();
  }
}

async function initProductPage() {
  // Sempre busca do Firebase primeiro
  if (window.firebaseUtils) {
    const lista = await window.firebaseUtils.fetchProdutosFromFirebase();
    if (lista && lista.length > 0) {
      window.produtos = lista;
      produtos = lista;
    }
  }
  loadProductDetails();
}

function loadProductDetails() {
  // Busca pelo ID como string ou número (Firestore usa string)
  const product = produtos.find(p =>
    String(p.id) === String(productIdParam)
  );

  if (!product) {
    document.querySelector('.product-details').innerHTML = `
      <div class="error-message" style="text-align:center;padding:60px 20px;">
        <h2>Produto não encontrado</h2>
        <p style="margin:12px 0 24px;color:#aaa;">ID: ${productIdParam}</p>
        <a href="index.html" class="btn-back" style="display:inline-block;padding:12px 24px;border:1px solid #fff;color:#fff;text-decoration:none;">Voltar para a loja</a>
      </div>
    `;
    return;
  }

  const imagens = (product.imagens && product.imagens.length > 0) ? product.imagens : [product.imagem].filter(Boolean);
  const imgPrincipal = imagens[0] || '';

  const galeriaHTML = imagens.length > 1
    ? `<div class="product-gallery-thumbs">
        ${imagens.map((url, i) =>
          `<button type="button" class="thumb ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Ver imagem ${i + 1}">
            <img src="${url}" alt="">
          </button>`
        ).join('')}
      </div>`
    : '';

  document.querySelector('.product-image').innerHTML = `
    <div class="product-image-main">
      <img src="${imgPrincipal}" alt="${product.nome}" id="product-main-img">
    </div>
    ${galeriaHTML}
  `;

  // Clique nas thumbnails
  document.querySelectorAll('.product-gallery-thumbs .thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.index, 10);
      document.getElementById('product-main-img').src = imagens[idx];
      document.querySelectorAll('.product-gallery-thumbs .thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  const tamanhosHTML = product.tamanhos && product.tamanhos.length > 0
    ? `<div class="product-sizes">
        <h3>Tamanho</h3>
        <div class="size-options">
          ${product.tamanhos.map(tamanho => {
            const estoque = product.estoque?.[tamanho] ?? null;
            const disponivel = estoque === null || estoque > 0;
            return `<button class="size-btn ${!disponivel ? 'unavailable' : ''}"
              data-size="${tamanho}" ${!disponivel ? 'disabled' : `onclick="selectSize('${tamanho}')"`}
              title="${!disponivel ? 'Tamanho esgotado' : ''}">${tamanho}</button>`;
          }).join('')}
        </div>
        <p class="size-error" id="size-error" style="display:none;color:#ff6b6b;font-size:14px;margin-top:8px;">
          Selecione um tamanho
        </p>
      </div>`
    : '';

  document.querySelector('.product-info-detail').innerHTML = `
    <h1>${product.nome}</h1>
    <div class="product-price-detail">
      <span class="price">${formatPrice(product.preco)}</span>
    </div>
    ${tamanhosHTML}
    <div class="product-description">
      <h3>Descrição</h3>
      <p>Camiseta de alta qualidade com design exclusivo. Tecido macio e confortável, perfeita para o dia a dia.</p>
    </div>
    <div class="product-actions">
      <button class="btn-add-to-cart" onclick="addToCartFromDetail('${product.id}')">Adicionar ao Carrinho</button>
      <button class="btn-buy-now" onclick="buyNow('${product.id}')">Comprar Agora</button>
    </div>
    <div class="product-features">
      <div class="feature"><span>✓</span> Pagamento Seguro</div>
    </div>
  `;

  window.currentProductSizes = product.tamanhos || [];
}

function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(price);
}

let selectedSize = null;

function selectSize(tamanho) {
  selectedSize = tamanho;
  document.querySelectorAll('.size-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.size === tamanho));
  const errorMsg = document.getElementById('size-error');
  if (errorMsg) errorMsg.style.display = 'none';
}

function getProductById(id) {
  return produtos.find(p => String(p.id) === String(id));
}

function addToCartFromDetail(productId) {
  const product = getProductById(productId);
  if (!product) return;

  if (product.tamanhos && product.tamanhos.length > 0) {
    if (!selectedSize) {
      const errorMsg = document.getElementById('size-error');
      if (errorMsg) errorMsg.style.display = 'block';
      document.querySelector('.product-sizes')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const estoque = product.estoque?.[selectedSize] ?? null;
    if (estoque !== null && estoque <= 0) { alert('Este tamanho está esgotado!'); return; }
  }

  cartManager.addItem({ ...product, tamanhoSelecionado: selectedSize || null });

  if (product.estoque && selectedSize && product.estoque[selectedSize] !== undefined) {
    product.estoque[selectedSize] -= 1;
    updateSizeButtons(product);
  }

  selectedSize = null;
  document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
}

function updateSizeButtons(product) {
  if (!product.tamanhos || !product.estoque) return;
  product.tamanhos.forEach(tamanho => {
    const btn = document.querySelector(`.size-btn[data-size="${tamanho}"]`);
    if (!btn) return;
    const disponivel = product.estoque[tamanho] > 0;
    btn.classList.toggle('unavailable', !disponivel);
    btn.disabled = !disponivel;
    if (disponivel) btn.setAttribute('onclick', `selectSize('${tamanho}')`);
    else btn.removeAttribute('onclick');
    btn.title = disponivel ? '' : 'Tamanho esgotado';
    btn.textContent = tamanho;
  });
}

function buyNow(productId) {
  const product = getProductById(productId);
  if (!product) return;

  if (product.tamanhos && product.tamanhos.length > 0) {
    if (!selectedSize) {
      const errorMsg = document.getElementById('size-error');
      if (errorMsg) errorMsg.style.display = 'block';
      document.querySelector('.product-sizes')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const estoque = product.estoque?.[selectedSize] ?? null;
    if (estoque !== null && estoque <= 0) { alert('Este tamanho está esgotado!'); return; }
  }

  cartManager.clearCart();
  cartManager.addItem({ ...product, tamanhoSelecionado: selectedSize || null });
  if (product.estoque && selectedSize) product.estoque[selectedSize] -= 1;
  window.location.href = 'carrinho.html';
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => waitForFirebase(initProductPage));
} else {
  waitForFirebase(initProductPage);
}