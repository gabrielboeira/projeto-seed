const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM || 'onboarding@resend.dev';

const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ── Template base ─────────────────────────────────────
function templateBase(conteudo) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#f5f5f5; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; color:#1a1a1a; }
    .wrapper { max-width:600px; margin:40px auto; background:#ffffff; border:1px solid #e0e0e0; }
    .header { background:#1a1a1a; padding:32px 40px; text-align:center; }
    .header img { height:48px; width:auto; }
    .header-text { color:white; font-size:24px; font-weight:300; letter-spacing:6px; text-transform:uppercase; }
    .body { padding:40px; }
    .greeting { font-size:16px; margin-bottom:24px; line-height:1.6; color:#1a1a1a; }
    .section-title { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#999; margin:28px 0 12px; padding-bottom:8px; border-bottom:1px solid #e0e0e0; }
    .info-row { display:flex; justify-content:space-between; padding:8px 0; font-size:14px; border-bottom:1px solid #f0f0f0; }
    .info-row:last-child { border-bottom:none; }
    .info-label { color:#666; }
    .info-value { font-weight:600; text-align:right; }
    .item-row { display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f0f0f0; font-size:14px; }
    .item-row:last-child { border-bottom:none; }
    .item-nome { font-weight:600; margin-bottom:3px; }
    .item-detalhe { color:#999; font-size:12px; }
    .item-preco { font-weight:700; white-space:nowrap; margin-left:16px; }
    .total-row { display:flex; justify-content:space-between; padding:16px 0 0; font-size:16px; font-weight:700; border-top:2px solid #1a1a1a; margin-top:8px; }
    .status-box { background:#f5f5f5; border-left:3px solid #1a1a1a; padding:16px 20px; margin:24px 0; font-size:14px; line-height:1.6; }
    .rastreio-box { background:#1a1a1a; color:white; padding:20px; text-align:center; margin:24px 0; border-radius:2px; }
    .rastreio-code { font-size:22px; font-weight:700; letter-spacing:3px; margin:8px 0; }
    .rastreio-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#999; }
    .btn { display:block; text-align:center; background:#1a1a1a; color:white; padding:14px 32px; text-decoration:none; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin:24px auto; max-width:220px; }
    .footer { background:#f5f5f5; border-top:1px solid #e0e0e0; padding:24px 40px; text-align:center; font-size:12px; color:#999; line-height:1.8; }
    .footer a { color:#1a1a1a; text-decoration:none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-text">S33D</div>
    </div>
    <div class="body">${conteudo}</div>
    <div class="footer">
      <p>S33D — streetwear com propósito</p>
      <p style="margin-top:8px;">
        <a href="https://projeto-seed.vercel.app">Visite nossa loja</a>
        &nbsp;·&nbsp;
        <a href="https://www.instagram.com/seed.______">@seed.______</a>
      </p>
      <p style="margin-top:12px;font-size:11px;">Você está recebendo este e-mail porque realizou uma compra na S33D.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── E-mail 1: Confirmação de pedido ───────────────────
async function enviarConfirmacaoPedido(pedido) {
  const { cliente, itens = [], frete, pagamento, total, id } = pedido;

  const itensHtml = itens.map(item => `
    <div class="item-row">
      <div>
        <div class="item-nome">${item.nome}</div>
        <div class="item-detalhe">Tam: ${item.tamanho || '—'} · Qtd: ${item.quantidade}</div>
      </div>
      <div class="item-preco">${fmt(item.preco * item.quantidade)}</div>
    </div>
  `).join('');

  const metodo = pagamento?.metodo === 'pix' ? 'PIX' : `Cartão — ${pagamento?.parcelas || 1}x`;
  const pedidoId = id ? `#${id.slice(-8).toUpperCase()}` : '';

  const conteudo = `
    <p class="greeting">Olá, <strong>${cliente?.nome?.split(' ')[0] || 'cliente'}</strong>! 🌱<br>
    Seu pedido foi recebido e está sendo processado. Obrigado por escolher a S33D.</p>

    <div class="status-box">
      <strong>Pedido ${pedidoId}</strong><br>
      ${pagamento?.metodo === 'pix'
        ? 'Aguardando confirmação do pagamento PIX. Assim que identificarmos o pagamento, você receberá uma nova confirmação.'
        : 'Pagamento aprovado! Seu pedido será preparado e enviado em breve.'}
    </div>

    <div class="section-title">Itens do pedido</div>
    ${itensHtml}
    <div class="info-row" style="margin-top:8px;">
      <span class="info-label">Frete (${frete?.empresa || '—'} ${frete?.servico || ''})</span>
      <span class="info-value">${fmt(frete?.preco || 0)}</span>
    </div>
    <div class="total-row">
      <span>Total</span>
      <span>${fmt(total || 0)}</span>
    </div>

    <div class="section-title">Entrega</div>
    <div class="info-row"><span class="info-label">Método</span><span class="info-value">${metodo}</span></div>
    <div class="info-row"><span class="info-label">Prazo estimado</span><span class="info-value">${frete?.prazo || '—'} dias úteis</span></div>

    <a href="https://projeto-seed.vercel.app" class="btn">Continuar comprando</a>
  `;

  return resend.emails.send({
    from:    FROM,
    to:      cliente?.email,
    subject: `S33D — Pedido recebido ${pedidoId}`,
    html:    templateBase(conteudo),
  });
}

// ── E-mail 2: Pagamento confirmado ────────────────────
async function enviarPagamentoConfirmado(pedido) {
  const { cliente, total, id } = pedido;
  const pedidoId = id ? `#${id.slice(-8).toUpperCase()}` : '';

  const conteudo = `
    <p class="greeting">Olá, <strong>${cliente?.nome?.split(' ')[0] || 'cliente'}</strong>! ✅<br>
    Seu pagamento foi confirmado. Estamos preparando seu pedido com cuidado.</p>

    <div class="status-box">
      <strong>Pedido ${pedidoId} — Pagamento confirmado</strong><br>
      Total: <strong>${fmt(total || 0)}</strong><br><br>
      Você receberá um novo e-mail com o código de rastreio assim que seu pedido for postado.
    </div>

    <a href="https://projeto-seed.vercel.app" class="btn">Continuar comprando</a>
  `;

  return resend.emails.send({
    from:    FROM,
    to:      cliente?.email,
    subject: `S33D — Pagamento confirmado ${pedidoId} ✅`,
    html:    templateBase(conteudo),
  });
}

// ── E-mail 3: Pedido postado com rastreio ─────────────
async function enviarRastreio(pedido, codigoRastreio) {
  const { cliente, frete, id } = pedido;
  const pedidoId = id ? `#${id.slice(-8).toUpperCase()}` : '';

  const urlRastreio = `https://www.linkcorreios.com.br/?id=${codigoRastreio}`;

  const conteudo = `
    <p class="greeting">Olá, <strong>${cliente?.nome?.split(' ')[0] || 'cliente'}</strong>! 📦<br>
    Seu pedido foi postado e já está a caminho!</p>

    <div class="rastreio-box">
      <div class="rastreio-label">Código de rastreio</div>
      <div class="rastreio-code">${codigoRastreio}</div>
      <div class="rastreio-label">${frete?.empresa || 'Transportadora'} — ${frete?.servico || ''}</div>
    </div>

    <div class="status-box">
      <strong>Pedido ${pedidoId}</strong><br>
      Prazo estimado: <strong>${frete?.prazo || '—'} dias úteis</strong> a partir da postagem.<br><br>
      Use o código acima para rastrear seu pedido no site da transportadora.
    </div>

    <a href="${urlRastreio}" class="btn">Rastrear pedido</a>
  `;

  return resend.emails.send({
    from:    FROM,
    to:      cliente?.email,
    subject: `S33D — Seu pedido foi postado! ${pedidoId} 📦`,
    html:    templateBase(conteudo),
  });
}

module.exports = { enviarConfirmacaoPedido, enviarPagamentoConfirmado, enviarRastreio };