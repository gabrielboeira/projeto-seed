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
      insurance_value: 0,
      receipt: false,
      own_hand: false,
      collect: false,
      reverse: false,
      non_commercial: false,
      invoice: { key: '' },
    },
  };

  const resposta = await axios.post(`${ME_BASE}/api/v2/me/cart`, payload, {
    headers: {
      Authorization: `Bearer ${process.env.ME_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'S33D Loja (contato@s33d.com.br)',
    }
  });

  return resposta.data.id;
}

// ── Asaas ─────────────────────────────────────────────

const ASAAS_URL = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://www.asaas.com/api/v3';

const asaas = axios.create({
  baseURL: ASAAS_URL,
  headers: {
    access_token: process.env.ASAAS_API_KEY,
    'Content-Type': 'application/json',
    'User-Agent': 'S33D/1.0',
  },
});

// ────────────────────────────────────────────────────
// Busca ou cria cliente no Asaas
// ────────────────────────────────────────────────────

async function buscarOuCriarCliente({ nome, email, cpfCnpj, telefone }) {

  const busca = await asaas.get(`/customers?cpfCnpj=${cpfCnpj}`);

  if (busca.data.data && busca.data.data.length > 0) {
    return busca.data.data[0].id;
  }

  const novo = await asaas.post('/customers', {
    name: nome,
    email,
    cpfCnpj,
    mobilePhone: telefone
  });

  return novo.data.id;
}

// ────────────────────────────────────────────────────
// Salva pedido no Firestore
// ────────────────────────────────────────────────────

async function salvarPedido(pagamentoId, dados) {

  await db.collection('pedidos').doc(pagamentoId).set({

    cliente: {
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpfCnpj,
      telefone: dados.telefone || '',
    },

    endereco: {
      cep: dados.cep || '',
      numero: dados.numero || '',
      complemento: dados.complemento || '',
      rua: dados.endereco || '',
      bairro: dados.bairro || '',
      cidade: dados.cidade || '',
      uf: dados.uf || '',
    },

    itens: dados.itens || [],
    frete: dados.frete || null,

    pagamento: {
      metodo: dados.metodo,
      asaasId: pagamentoId,
      status: 'PENDING',
      valor: dados.valor,
      parcelas: dados.parcelas || 1,
    },

    total: dados.valor,

    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });
}

// ────────────────────────────────────────────────────
// PIX
// ────────────────────────────────────────────────────

router.post('/pix', async (req, res) => {

  try {

    const {
      nome, email, cpfCnpj, telefone,
      valor, itens, frete,
      cep, numero, complemento,
      endereco, bairro, cidade, uf
    } = req.body;

    if (!nome || !email || !cpfCnpj || !valor) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, cpfCnpj, valor' });
    }

    const customerId = await buscarOuCriarCliente({ nome, email, cpfCnpj, telefone });

    const cobranca = await asaas.post('/payments', {
      customer: customerId,
      billingType: 'PIX',
      value: valor,
      dueDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
      description: 'Pedido S33D',
    });

    const qrCode = await asaas.get(`/payments/${cobranca.data.id}/pixQrCode`);

    await salvarPedido(cobranca.data.id, {
      nome,email,cpfCnpj,telefone,valor,
      itens,frete,cep,numero,complemento,endereco,bairro,cidade,uf,
      metodo:'pix'
    });

    try {
      const pedidoSalvo = await db.collection('pedidos').doc(cobranca.data.id).get();
      await enviarConfirmacaoPedido({ id: cobranca.data.id, ...pedidoSalvo.data() });
    } catch(e){
      console.error('Erro email PIX',e.message);
    }

    return res.json({
      pagamentoId:cobranca.data.id,
      status:cobranca.data.status,
      valor:cobranca.data.value,
      vencimento:cobranca.data.dueDate,
      pix:{
        qrCode:qrCode.data.encodedImage,
        copiaECola:qrCode.data.payload,
        expiracao:qrCode.data.expirationDate
      }
    });

  } catch(err){

    console.error('Erro PIX',err.response?.data||err.message);

    return res.status(500).json({
      erro:err.response?.data?.errors?.[0]?.description||err.message
    });

  }

});

// ────────────────────────────────────────────────────
// WEBHOOK
// ────────────────────────────────────────────────────

router.post('/webhook', async (req, res) => {

  const evento = req.body;

  console.log('📩 Webhook Asaas:', evento.event, evento.payment?.id, evento.payment?.status);

  try {

    const pagamentoId = evento.payment?.id;

    if (!pagamentoId) return res.sendStatus(200);

    const statusMap = {
      PAYMENT_CONFIRMED:'CONFIRMED',
      PAYMENT_RECEIVED:'RECEIVED',
      PAYMENT_OVERDUE:'OVERDUE',
      PAYMENT_DELETED:'CANCELLED',
      PAYMENT_REFUNDED:'REFUNDED'
    };

    const novoStatus = statusMap[evento.event];

    if (!novoStatus) return res.sendStatus(200);

    await db.collection('pedidos').doc(pagamentoId).update({
      'pagamento.status':novoStatus,
      atualizadoEm:new Date()
    });

    console.log(`✅ Pedido ${pagamentoId} atualizado para ${novoStatus}`);

    if(novoStatus==='CONFIRMED'||novoStatus==='RECEIVED'){

      const pedidoDoc = await db.collection('pedidos').doc(pagamentoId).get();

      if(!pedidoDoc.exists) return res.sendStatus(200);

      const pedido = { id:pagamentoId, ...pedidoDoc.data() };

      await enviarPagamentoConfirmado(pedido);

      console.log(`📧 Email pagamento confirmado enviado`);

      try{

        const carrinhoId = await adicionarCarrinhoME(pedido);

        console.log(`🛒 Carrinho criado no Melhor Envio: ${carrinhoId}`);

        await axios.post(`${ME_BASE}/api/v2/me/shipment/checkout`,
          {orders:[carrinhoId]},
          {headers:{Authorization:`Bearer ${process.env.ME_TOKEN}`,'Content-Type':'application/json',Accept:'application/json'}}
        );

        console.log('💳 Frete comprado');

        await axios.post(`${ME_BASE}/api/v2/me/shipment/generate`,
          {orders:[carrinhoId]},
          {headers:{Authorization:`Bearer ${process.env.ME_TOKEN}`,'Content-Type':'application/json',Accept:'application/json'}}
        );

        console.log('🏷️ Etiqueta gerada');

        await db.collection('pedidos').doc(pagamentoId).update({
          envio:{
            melhorEnvioId:carrinhoId,
            status:'etiqueta_gerada'
          },
          atualizadoEm:new Date()
        });

        console.log('📦 Envio salvo no banco');

      }catch(meErr){

        console.error('Erro Melhor Envio',meErr.response?.data||meErr.message);

      }

    }

  } catch(err){

    console.error('Erro webhook',err.message);

  }

  return res.sendStatus(200);

});

module.exports = router;