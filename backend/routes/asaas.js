const express = require('express');
const axios   = require('axios');
const router  = express.Router();
const { db }  = require('../firebase-admin');
const { enviarConfirmacaoPedido, enviarPagamentoConfirmado, enviarRastreio } = require('../email');

// ── Melhor Envio ─────────────────────────────────────
const ME_BASE = 'https://melhorenvio.com.br';
async function adicionarCarrinhoME(pedido) {
  const { cliente, endereco, itens, frete } = pedido;
  const produtos = (itens || []).map(p => ({
    name:          p.nome       || 'Camiseta S33D',
    quantity:      p.quantidade || 1,
    unitary_value: p.preco      || 0,
    weight:        0.3,
    width:         30,
    height:        4,
    length:        40,
  }));

  const payload = {
    service: frete?.id,
    from: {
      name:             process.env.REMETENTE_NOME     || 'S33D',
      phone:            process.env.REMETENTE_FONE     || '',
      email:            process.env.REMETENTE_EMAIL    || '',
      company_document: process.env.REMETENTE_CNPJ     || '',
      address:          process.env.REMETENTE_ENDERECO || '',
      number:           process.env.REMETENTE_NUMERO   || '',
      district:         process.env.REMETENTE_BAIRRO   || '',
      city:             process.env.REMETENTE_CIDADE   || '',
      country_id:       'BR',
      postal_code:      process.env.CEP_ORIGEM         || '',
      state_abbr:       process.env.REMETENTE_UF       || '',
    },
    to: {
      name:        cliente?.nome,
      phone:       cliente?.telefone,
      email:       cliente?.email,
      document:    cliente?.cpf,
      address:     endereco?.rua,
      number:      endereco?.numero,
      complement:  endereco?.complemento || '',
      district:    endereco?.bairro,
      city:        endereco?.cidade,
      country_id:  'BR',
      postal_code: endereco?.cep?.replace(/\D/g, ''),
      state_abbr:  endereco?.uf,
    },
    products: produtos,
    volumes: [{ height: 10, width: 30, length: 40, weight: 0.5 }],
    options: {
      insurance_value: 0, receipt: false, own_hand: false,
      collect: false, reverse: false, non_commercial: false,
      invoice: { key: '' },
    },
  };

  const resposta = await axios.post(`${ME_BASE}/api/v2/me/cart`, payload, {
    headers: {
      'Authorization': `Bearer ${process.env.ME_TOKEN}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      'User-Agent':    'S33D Loja (contato@s33d.com.br)',
    }
  });
  return resposta.data.id;
}

const ASAAS_URL = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://www.asaas.com/api/v3';

const asaas = axios.create({
  baseURL: ASAAS_URL,
  headers: {
    'access_token': process.env.ASAAS_API_KEY,
    'Content-Type': 'application/json',
    'User-Agent': 'S33D/1.0',
  },
});

// ────────────────────────────────────────────────────
// Busca ou cria cliente no Asaas pelo CPF/CNPJ
// ────────────────────────────────────────────────────
async function buscarOuCriarCliente({ nome, email, cpfCnpj, telefone }) {
  const busca = await asaas.get(`/customers?cpfCnpj=${cpfCnpj}`);
  if (busca.data.data && busca.data.data.length > 0) {
    return busca.data.data[0].id;
  }
  const novo = await asaas.post('/customers', { name: nome, email, cpfCnpj, mobilePhone: telefone });
  return novo.data.id;
}

// ────────────────────────────────────────────────────
// Gera número sequencial de pedido
// ────────────────────────────────────────────────────
async function gerarNumeroPedido() {
  const contadorRef = db.collection('config').doc('contadores');
  const snap = await contadorRef.get();
  const atual = snap.exists ? (snap.data().numeroPedido || 0) : 0;
  const proximo = atual + 1;
  await contadorRef.set({ numeroPedido: proximo }, { merge: true });
  return proximo;
}

// ────────────────────────────────────────────────────
// Salva pedido no Firestore
// ────────────────────────────────────────────────────
async function salvarPedido(pagamentoId, dados) {
  const numeroPedido = await gerarNumeroPedido();
  await db.collection('pedidos').doc(pagamentoId).set({
    numeroPedido,
    cliente: {
      nome:     dados.nome,
      email:    dados.email,
      cpf:      dados.cpfCnpj,
      telefone: dados.telefone || '',
    },
    endereco: {
      cep:         dados.cep || '',
      numero:      dados.numero || '',
      complemento: dados.complemento || '',
      rua:         dados.endereco || '',
      bairro:      dados.bairro || '',
      cidade:      dados.cidade || '',
      uf:          dados.uf || '',
    },
    itens: dados.itens || [],
    frete: dados.frete || null,
    pagamento: {
      metodo:   dados.metodo,
      asaasId:  pagamentoId,
      status:   'PENDING',
      valor:    dados.valor,
      parcelas: dados.parcelas || 1,
    },
    total:        dados.valor,
    criadoEm:     new Date(),
    atualizadoEm: new Date(),
  });
}

// ────────────────────────────────────────────────────
// POST /api/pagamento/pix
// ────────────────────────────────────────────────────
router.post('/pix', async (req, res) => {
  try {
    const { nome, email, cpfCnpj, telefone, valor, itens, frete, cep, numero, complemento, endereco, bairro, cidade, uf } = req.body;

    if (!nome || !email || !cpfCnpj || !valor) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, cpfCnpj, valor' });
    }

    const customerId = await buscarOuCriarCliente({ nome, email, cpfCnpj, telefone });

    const cobranca = await asaas.post('/payments', {
      customer:    customerId,
      billingType: 'PIX',
      value:       valor,
      dueDate:     new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Pedido S33D',
    });

    const qrCode = await asaas.get(`/payments/${cobranca.data.id}/pixQrCode`);

    // Salva pedido no Firestore
    await salvarPedido(cobranca.data.id, {
      nome, email, cpfCnpj, telefone, valor,
      itens, frete, cep, numero, complemento,
      endereco, bairro, cidade, uf,
      metodo: 'pix',
    });

    // Envia e-mail de confirmação
    try {
      const pedidoSalvo = await db.collection('pedidos').doc(cobranca.data.id).get();
      await enviarConfirmacaoPedido({ id: cobranca.data.id, ...pedidoSalvo.data() });
    } catch (emailErr) {
      console.error('Erro ao enviar e-mail PIX:', emailErr.message);
    }

    return res.json({
      pagamentoId: cobranca.data.id,
      status:      cobranca.data.status,
      valor:       cobranca.data.value,
      vencimento:  cobranca.data.dueDate,
      pix: {
        qrCode:     qrCode.data.encodedImage,
        copiaECola: qrCode.data.payload,
        expiracao:  qrCode.data.expirationDate,
      },
    });
  } catch (err) {
    console.error('Erro PIX:', err.response?.data || err.message);
    return res.status(500).json({ erro: err.response?.data?.errors?.[0]?.description || err.message });
  }
});

// ────────────────────────────────────────────────────
// POST /api/pagamento/cartao
// ────────────────────────────────────────────────────
router.post('/cartao', async (req, res) => {
  try {
    const { nome, email, cpfCnpj, telefone, valor, parcelas = 1, cartao, itens, frete, cep, numero, complemento, endereco, bairro, cidade, uf } = req.body;

    if (!nome || !email || !cpfCnpj || !valor || !cartao) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, cpfCnpj, valor, cartao' });
    }

    const customerId = await buscarOuCriarCliente({ nome, email, cpfCnpj, telefone });

    const [mesVal, anoVal] = cartao.validade.split('/');

    const cobranca = await asaas.post('/payments', {
      customer:         customerId,
      billingType:      'CREDIT_CARD',
      value:            valor,
      dueDate:          new Date().toISOString().split('T')[0],
      description:      'Pedido S33D',
      installmentCount: parcelas > 1 ? parcelas : undefined,
      installmentValue: parcelas > 1 ? (valor / parcelas).toFixed(2) : undefined,
      creditCard: {
        holderName:  cartao.nome,
        number:      cartao.numero.replace(/\s/g, ''),
        expiryMonth: mesVal,
        expiryYear:  anoVal.length === 2 ? `20${anoVal}` : anoVal,
        ccv:         cartao.cvv,
      },
      creditCardHolderInfo: {
        name:          nome,
        email,
        cpfCnpj,
        mobilePhone:   telefone,
        postalCode:    cep || '',
        addressNumber: numero || 'S/N',
      },
      remoteIp: req.ip,
    });

    // Salva pedido no Firestore
    await salvarPedido(cobranca.data.id, {
      nome, email, cpfCnpj, telefone, valor, parcelas,
      itens, frete, cep, numero, complemento,
      endereco, bairro, cidade, uf,
      metodo: 'cartao',
    });

    // Envia e-mail de confirmação
    try {
      const pedidoSalvo = await db.collection('pedidos').doc(cobranca.data.id).get();
      await enviarConfirmacaoPedido({ id: cobranca.data.id, ...pedidoSalvo.data() });
    } catch (emailErr) {
      console.error('Erro ao enviar e-mail cartão:', emailErr.message);
    }

    return res.json({
      pagamentoId: cobranca.data.id,
      status:      cobranca.data.status,
      valor:       cobranca.data.value,
      parcelas:    cobranca.data.installmentCount || 1,
    });
  } catch (err) {
    console.error('Erro cartão:', err.response?.data || err.message);
    return res.status(500).json({ erro: err.response?.data?.errors?.[0]?.description || err.message });
  }
});

// ────────────────────────────────────────────────────
// GET /api/pagamento/status/:id
// ────────────────────────────────────────────────────
router.get('/status/:id', async (req, res) => {
  try {
    const pagamento = await asaas.get(`/payments/${req.params.id}`);
    return res.json({
      pagamentoId: pagamento.data.id,
      status:      pagamento.data.status,
      valor:       pagamento.data.value,
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// ────────────────────────────────────────────────────
// POST /api/pagamento/webhook
// ────────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  const evento = req.body;
  console.log('📩 Webhook Asaas:', evento.event, evento.payment?.id, evento.payment?.status);

  try {
    const pagamentoId = evento.payment?.id;
    if (!pagamentoId) return res.sendStatus(200);

    // Mapeia eventos do Asaas para status internos
    const statusMap = {
      PAYMENT_CONFIRMED:  'CONFIRMED',
      PAYMENT_RECEIVED:   'RECEIVED',
      PAYMENT_OVERDUE:    'OVERDUE',
      PAYMENT_DELETED:    'CANCELLED',
      PAYMENT_REFUNDED:   'REFUNDED',
    };

    const novoStatus = statusMap[evento.event];
    if (!novoStatus) return res.sendStatus(200);

    // Atualiza status no Firestore
    await db.collection('pedidos').doc(pagamentoId).update({
      'pagamento.status': novoStatus,
      atualizadoEm: new Date(),
    });

    console.log(`✅ Pedido ${pagamentoId} atualizado para ${novoStatus}`);

    if (novoStatus === 'CONFIRMED' || novoStatus === 'RECEIVED') {
      try {
        const pedidoDoc = await db.collection('pedidos').doc(pagamentoId).get();
        if (pedidoDoc.exists) {
          const pedido = { id: pagamentoId, ...pedidoDoc.data() };

          // 1. Envia e-mail de pagamento confirmado
          await enviarPagamentoConfirmado(pedido);
          console.log(`📧 E-mail pagamento confirmado enviado para ${pedido.cliente?.email}`);

          // 2. Baixa estoque dos produtos
          try {
            const itens = pedido.itens || [];
            for (const item of itens) {
              if (!item.produtoId || !item.tamanho) continue;
              const produtoRef = db.collection('produtos').doc(item.produtoId);
              const produtoDoc = await produtoRef.get();
              if (!produtoDoc.exists) continue;
              const estoque = produtoDoc.data().estoque || {};
              const atual = estoque[item.tamanho] || 0;
              const novo  = Math.max(0, atual - (item.quantidade || 1));
              await produtoRef.update({ [`estoque.${item.tamanho}`]: novo });
              console.log(`📦 Estoque ${item.nome} ${item.tamanho}: ${atual} → ${novo}`);
            }
          } catch (estoqueErr) {
            console.error('Erro ao baixar estoque:', estoqueErr.message);
          }

          // 3. Adiciona ao carrinho do Melhor Envio
          try {
            const carrinhoId = await adicionarCarrinhoME(pedido);
            await db.collection('pedidos').doc(pagamentoId).update({
              'envio.melhorEnvioId': carrinhoId,
              'envio.status':        'aguardando',
              atualizadoEm:          new Date(),
            });
            console.log(`📦 Adicionado ao Melhor Envio: ${carrinhoId}`);
          } catch (meErr) {
            console.error('Erro ao adicionar ao ME:', meErr.response?.data || meErr.message);
          }
        }
      } catch (emailErr) {
        console.error('Erro ao processar confirmação:', emailErr.message);
      }
    }
  } catch (err) {
    console.error('Erro webhook:', err.message);
  }

  return res.sendStatus(200);
});

module.exports = router;