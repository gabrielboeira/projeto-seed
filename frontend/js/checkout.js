// ── Configuração ─────────────────────────────────────
const BACKEND_URL = 'https://s33d.com.br';

// ── Estado ───────────────────────────────────────────
const checkoutState = {
  step: 1,
  freteSelecionado: null,
  metodoPagamento: 'cartao',
};

// ── Utilitários ──────────────────────────────────────
function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function toggleErro(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? 'block' : 'none';
}

function showStatus(step, msg, tipo) {
  const el = document.getElementById(`status-${step}`);
  if (!el) return;
  el.textContent = msg;
  el.className = `status-banner ${tipo}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

// ── Resumo do pedido ─────────────────────────────────
function carregarResumo() {
  const cart = cartManager.cart;
  const container = document.getElementById('summary-items');
  if (!container) return;

  container.innerHTML = '';
  cart.forEach(item => {
    const d = document.createElement('div');
    d.className = 'summary-item';
    d.innerHTML = `
      <div class="summary-item-img-wrap">
        <img class="summary-item-img" src="${item.imagem}" alt="${item.nome}" onerror="this.style.opacity=0.2">
        <span class="summary-item-qty">${item.quantidade}</span>
      </div>
      <div>
        <h4>${item.nome}</h4>
        <span>${item.tamanho ? 'Tam: ' + item.tamanho : ''}</span>
      </div>
      <span class="summary-item-price">${fmt(item.preco * item.quantidade)}</span>
    `;
    container.appendChild(d);
  });

  atualizarTotais();
}

function atualizarTotais() {
  const sub   = cartManager.getTotal();
  const frete = checkoutState.freteSelecionado?.preco || 0;

  document.getElementById('summary-subtotal').textContent = fmt(sub);
  document.getElementById('summary-total').textContent    = fmt(sub + frete);

  const freteRow = document.getElementById('summary-frete-row');
  if (checkoutState.freteSelecionado && freteRow) {
    freteRow.style.display = 'flex';
    document.getElementById('summary-frete').textContent = frete === 0 ? 'Grátis' : fmt(frete);
  }
}

// ── Navegação entre steps ────────────────────────────
function irParaStep(n) {
  if (n > checkoutState.step && !validarStep(checkoutState.step)) return;

  document.getElementById(`step-${checkoutState.step}`).classList.remove('active');

  document.querySelectorAll('.step-item').forEach(el => {
    const i = parseInt(el.dataset.step);
    el.classList.remove('active', 'done');
    if (i < n) el.classList.add('done');
    if (i === n) el.classList.add('active');
  });

  checkoutState.step = n;
  document.getElementById(`step-${n}`).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validarStep(s) {
  if (s === 1) {
    const nome  = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const cpf   = document.getElementById('cpf').value.replace(/\D/g, '');
    let ok = true;

    toggleErro('err-nome',  !nome);                           if (!nome)  ok = false;
    toggleErro('err-email', !email || !email.includes('@'));  if (!email || !email.includes('@')) ok = false;
    toggleErro('err-cpf',   cpf.length < 11);                if (cpf.length < 11) ok = false;

    return ok;
  }

  if (s === 2) {
    if (!document.getElementById('endereco').value.trim()) {
      showStatus(2, 'Preencha o endereço completo.', 'error');
      return false;
    }
    if (!checkoutState.freteSelecionado) {
      showStatus(2, 'Selecione uma opção de frete.', 'error');
      return false;
    }
    return true;
  }

  return true;
}

// ── Máscaras ─────────────────────────────────────────
function mascaraCPF(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2')
       .replace(/(\d{3})(\d)/, '$1.$2')
       .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  input.value = v;
}

function mascaraTelefone(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{2})(\d)/, '($1) $2')
       .replace(/(\d{5})(\d)/, '$1-$2');
  input.value = v;
}

function mascaraCEP(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 8);
  v = v.replace(/(\d{5})(\d)/, '$1-$2');
  input.value = v;
}

function mascaraCartao(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 16);
  v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
  input.value = v;
}

function mascaraValidade(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 4);
  v = v.replace(/(\d{2})(\d)/, '$1/$2');
  input.value = v;
}

// ── Card display ─────────────────────────────────────
function atualizarCardDisplay() {
  const num    = document.getElementById('card-numero').value.replace(/\s/g, '');
  const masked = (num + '????????????????').slice(0, 16);
  document.getElementById('card-number-display').textContent =
    masked.slice(0,4) + ' ' + masked.slice(4,8) + ' ' + masked.slice(8,12) + ' ' + masked.slice(12,16);
}

function atualizarNomeCard() {
  const val = document.getElementById('card-nome').value.toUpperCase();
  document.getElementById('card-name-display').textContent = val || 'NOME NO CARTÃO';
}

function atualizarValidadeCard() {
  const val = document.getElementById('card-validade').value;
  document.getElementById('card-exp-display').textContent = val || 'MM/AA';
}

// ── Buscar CEP ───────────────────────────────────────
async function buscarCEP() {
  const cep = document.getElementById('cep').value.replace(/\D/g, '');
  if (cep.length !== 8) { showStatus(2, 'CEP inválido.', 'error'); return; }

  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const d = await r.json();
    if (d.erro) { showStatus(2, 'CEP não encontrado.', 'error'); return; }

    document.getElementById('endereco').value = d.logradouro || '';
    document.getElementById('bairro').value   = d.bairro     || '';
    document.getElementById('cidade').value   = d.localidade || '';
    document.getElementById('uf').value       = d.uf         || '';

    calcularFrete(cep);
  } catch {
    showStatus(2, 'Erro ao buscar CEP. Tente novamente.', 'error');
  }
}

// ── Calcular frete ───────────────────────────────────
async function calcularFrete(cep) {
  const wrap = document.getElementById('frete-wrap');
  const opts = document.getElementById('frete-options');
  wrap.style.display = 'block';
  opts.innerHTML = '<div class="frete-loading"><div class="spinner-sm"></div>Calculando opções de frete...</div>';

  const produtos = cartManager.cart.map(item => ({
    peso: 0.3, altura: 4, largura: 30, comprimento: 40,
    quantidade: item.quantidade,
    valor: item.preco,
  }));

  try {
    const r = await fetch(`${BACKEND_URL}/api/frete/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cepDestino: cep, produtos }),
    });
    const data = await r.json();

    if (!data.opcoes || data.opcoes.length === 0) {
      opts.innerHTML = '<p style="font-size:13px;color:var(--text-light);">Nenhuma opção disponível para este CEP.</p>';
      return;
    }

    opts.innerHTML = '';
    data.opcoes.forEach((op, i) => {
      const div = document.createElement('div');
      div.className = `frete-option${i === 0 ? ' selected' : ''}`;
      div.innerHTML = `
        <div class="frete-radio"><div class="frete-radio-dot"></div></div>
        <div class="frete-info">
          <h4>${op.nome} — ${op.empresa}</h4>
          <span>${op.prazo} dia${op.prazo !== 1 ? 's' : ''} útil${op.prazo !== 1 ? 'eis' : ''}</span>
        </div>
        <div class="frete-preco">
          ${op.preco === 0 ? '<span style="color:#4caf50">Grátis</span>' : fmt(op.preco)}
        </div>
      `;
      div.addEventListener('click', () => selecionarFrete(div, op));
      opts.appendChild(div);
    });

    // Seleciona a primeira automaticamente
    selecionarFrete(opts.querySelector('.frete-option'), data.opcoes[0]);

  } catch {
    opts.innerHTML = '<p style="font-size:13px;color:#e05c5c;">Erro ao calcular frete. Verifique se o backend está rodando.</p>';
  }
}

function selecionarFrete(el, opcao) {
  document.querySelectorAll('.frete-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  checkoutState.freteSelecionado = opcao;
  atualizarTotais();
}

// ── Trocar pagamento ─────────────────────────────────
function trocarPagamento(tipo, btn) {
  checkoutState.metodoPagamento = tipo;
  document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.pay-form').forEach(f => f.classList.remove('active'));
  document.getElementById(`form-${tipo}`).classList.add('active');
}

// ── Processar pagamento ──────────────────────────────
async function processarPagamento() {
  const btn = document.getElementById('btn-pagar');
  btn.disabled = true;
  btn.textContent = 'Processando...';

  const total = +(cartManager.getTotal() + (checkoutState.freteSelecionado?.preco || 0)).toFixed(2);

  // Monta itens do carrinho para salvar no Firestore
  const itens = cartManager.cart.map(item => ({
    produtoId:  String(item.id),
    nome:       item.nome,
    tamanho:    item.tamanho || null,
    quantidade: item.quantidade,
    preco:      item.preco,
  }));

  const payload = {
    nome:        document.getElementById('nome').value.trim(),
    email:       document.getElementById('email').value.trim(),
    cpfCnpj:     document.getElementById('cpf').value.replace(/\D/g, ''),
    telefone:    document.getElementById('telefone').value.replace(/\D/g, ''),
    cep:         document.getElementById('cep').value.replace(/\D/g, ''),
    numero:      document.getElementById('numero').value,
    complemento: document.getElementById('complemento').value,
    endereco:    document.getElementById('endereco').value,
    bairro:      document.getElementById('bairro').value,
    cidade:      document.getElementById('cidade').value,
    uf:          document.getElementById('uf').value,
    valor:       total,
    itens,
    frete:       checkoutState.freteSelecionado,
  };

  try {
    if (checkoutState.metodoPagamento === 'pix') {
      const r = await fetch(`${BACKEND_URL}/api/pagamento/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.erro) throw new Error(d.erro);

      document.getElementById('pix-qr-img').src = `data:image/png;base64,${d.pix.qrCode}`;
      document.getElementById('pix-codigo').value = d.pix.copiaECola;
      document.getElementById('pix-qr-wrap').style.display = 'block';
      btn.textContent = 'Aguardando pagamento...';
      aguardarPIX(d.pagamentoId);
      return;

    } else {
      const cartao = {
        numero:   document.getElementById('card-numero').value.replace(/\s/g, ''),
        nome:     document.getElementById('card-nome').value,
        validade: document.getElementById('card-validade').value,
        cvv:      document.getElementById('card-cvv').value,
      };

      if (!cartao.numero || !cartao.nome || !cartao.validade || !cartao.cvv) {
        showStatus(3, 'Preencha todos os dados do cartão.', 'error');
        btn.disabled = false;
        btn.textContent = 'Finalizar pedido →';
        return;
      }

      const r = await fetch(`${BACKEND_URL}/api/pagamento/cartao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          parcelas: parseInt(document.getElementById('parcelas').value),
          cartao,
        }),
      });
      const d = await r.json();
      if (d.erro) throw new Error(d.erro);
      confirmarPedido(d.pagamentoId);
    }
  } catch (err) {
    showStatus(3, 'Erro: ' + err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Finalizar pedido →';
  }
}

// ── Aguardar PIX ─────────────────────────────────────
async function aguardarPIX(id, tentativas = 0) {
  if (tentativas > 40) {
    showStatus(3, 'Tempo expirado. Tente gerar um novo PIX.', 'error');
    return;
  }
  try {
    const r = await fetch(`${BACKEND_URL}/api/pagamento/status/${id}`);
    const d = await r.json();
    if (d.status === 'RECEIVED' || d.status === 'CONFIRMED') {
      confirmarPedido(id);
      return;
    }
  } catch {}
  setTimeout(() => aguardarPIX(id, tentativas + 1), 3000);
}

function copiarPIX() {
  const codigo = document.getElementById('pix-codigo').value;
  navigator.clipboard.writeText(codigo).then(() => {
    const btn = document.querySelector('.pix-copy-btn');
    btn.textContent = '✓ Copiado!';
    setTimeout(() => { btn.textContent = '📋 Copiar código PIX'; }, 2000);
  });
}

// ── Confirmar pedido ─────────────────────────────────
function confirmarPedido(id) {
  cartManager.clearCart();
  document.getElementById('pedido-id').textContent = id;
  irParaStep(4);
}

// ── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (cartManager.cart.length === 0) {
    window.location.href = 'index.html';
    return;
  }
  carregarResumo();
});