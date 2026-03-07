const express = require('express');
const axios   = require('axios');
const router  = express.Router();

const ASAAS_URL = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/api/v3';

const asaas = axios.create({
  baseURL: ASAAS_URL,
  headers: {
    'access_token': process.env.ASAAS_API_KEY,
    'Content-Type': 'application/json',
  },
});

// ────────────────────────────────────────────────────
// Busca ou cria cliente no Asaas pelo CPF/CNPJ
// ────────────────────────────────────────────────────
async function buscarOuCriarCliente({ nome, email, cpfCnpj, telefone }) {
  // Tenta buscar pelo CPF/CNPJ
  const busca = await asaas.get(`/customers?cpfCnpj=${cpfCnpj}`);
  if (busca.data.data && busca.data.data.length > 0) {
    return busca.data.data[0].id;
  }

  // Cria novo cliente
  const novo = await asaas.post('/customers', { name: nome, email, cpfCnpj, mobilePhone: telefone });
  return novo.data.id;
}

// ────────────────────────────────────────────────────
// POST /api/pagamento/pix
// Body: { nome, email, cpfCnpj, telefone, valor }
// ────────────────────────────────────────────────────
router.post('/pix', async (req, res) => {
  try {
    const { nome, email, cpfCnpj, telefone, valor } = req.body;

    if (!nome || !email || !cpfCnpj || !valor) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, cpfCnpj, valor' });
    }

    const customerId = await buscarOuCriarCliente({ nome, email, cpfCnpj, telefone });

    const cobranca = await asaas.post('/payments', {
      customer:    customerId,
      billingType: 'PIX',
      value:       valor,
      dueDate:     new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // vence amanhã
      description: 'Pedido S33D',
    });

    // Busca QR Code do PIX
    const qrCode = await asaas.get(`/payments/${cobranca.data.id}/pixQrCode`);

    return res.json({
      pagamentoId:  cobranca.data.id,
      status:       cobranca.data.status,
      valor:        cobranca.data.value,
      vencimento:   cobranca.data.dueDate,
      pix: {
        qrCode:      qrCode.data.encodedImage, // base64 da imagem
        copiaECola:  qrCode.data.payload,       // texto para copiar
        expiracao:   qrCode.data.expirationDate,
      },
    });
  } catch (err) {
    console.error('Erro PIX:', err.response?.data || err.message);
    return res.status(500).json({ erro: err.response?.data?.errors?.[0]?.description || err.message });
  }
});

// ────────────────────────────────────────────────────
// POST /api/pagamento/cartao
// Body: { nome, email, cpfCnpj, telefone, valor, parcelas,
//         cartao: { numero, nome, validade, cvv } }
// ────────────────────────────────────────────────────
router.post('/cartao', async (req, res) => {
  try {
    const { nome, email, cpfCnpj, telefone, valor, parcelas = 1, cartao, enderecoIp } = req.body;

    if (!nome || !email || !cpfCnpj || !valor || !cartao) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, cpfCnpj, valor, cartao' });
    }

    const customerId = await buscarOuCriarCliente({ nome, email, cpfCnpj, telefone });

    const [mesVal, anoVal] = cartao.validade.split('/');

    const cobranca = await asaas.post('/payments', {
      customer:           customerId,
      billingType:        'CREDIT_CARD',
      value:              valor,
      dueDate:            new Date().toISOString().split('T')[0],
      description:        'Pedido S33D',
      installmentCount:   parcelas > 1 ? parcelas : undefined,
      installmentValue:   parcelas > 1 ? (valor / parcelas).toFixed(2) : undefined,
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
        postalCode:    req.body.cep || '',
        addressNumber: req.body.numero || 'S/N',
      },
      remoteIp: enderecoIp || req.ip,
    });

    return res.json({
      pagamentoId: cobranca.data.id,
      status:      cobranca.data.status,        // CONFIRMED = aprovado
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
// POST /api/pagamento/webhook  (Asaas notifica aqui)
// Configure no painel do Asaas: Settings > Webhooks
// ────────────────────────────────────────────────────
router.post('/webhook', (req, res) => {
  const evento = req.body;
  console.log('📩 Webhook Asaas:', evento.event, evento.payment?.id, evento.payment?.status);

  // Aqui você pode salvar o status no Firestore, enviar e-mail, etc.
  // Ex: se evento.event === 'PAYMENT_CONFIRMED' → marcar pedido como pago

  return res.sendStatus(200);
});

module.exports = router;