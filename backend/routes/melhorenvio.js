const express = require('express');
const axios   = require('axios');
const router  = express.Router();

const ME_BASE = process.env.ME_SANDBOX === 'true'
  ? 'https://sandbox.melhorenvio.com.br'
  : 'https://melhorenvio.com.br';

const ME_URL = `${ME_BASE}/api/v2`;

// ── Token em memória ─────────────────────────────────
let currentToken = process.env.ME_TOKEN;

// ── Renova o token usando o refresh_token ────────────
async function renovarToken() {
  try {
    console.log('🔄 Renovando token Melhor Envio...');
    const resposta = await axios.post(`${ME_BASE}/oauth/token`, {
      grant_type:    'refresh_token',
      refresh_token: process.env.ME_REFRESH_TOKEN,
      client_id:     process.env.ME_CLIENT_ID,
      client_secret: process.env.ME_CLIENT_SECRET,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':   'S33D Loja (contato@s33d.com.br)',
      }
    });

    currentToken = resposta.data.access_token;

    // Atualiza o refresh_token em memória também
    process.env.ME_REFRESH_TOKEN = resposta.data.refresh_token;
    process.env.ME_TOKEN         = currentToken;

    console.log('✅ Token Melhor Envio renovado com sucesso!');
    return currentToken;
  } catch (err) {
    console.error('❌ Erro ao renovar token ME:', err.response?.data || err.message);
    throw err;
  }
}

// ── Cria instância axios com token atual ─────────────
function criarCliente() {
  return axios.create({
    baseURL: ME_URL,
    headers: {
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      'User-Agent':    'S33D Loja (contato@s33d.com.br)',
    },
  });
}

// ── Executa requisição com retry automático se 401 ───
async function requisicaoME(fn) {
  try {
    const cliente = criarCliente();
    return await fn(cliente);
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('⚠️ Token expirado, renovando...');
      await renovarToken();
      const cliente = criarCliente();
      return await fn(cliente);
    }
    throw err;
  }
}

// ────────────────────────────────────────────────────
// POST /api/frete/calcular
// ────────────────────────────────────────────────────
router.post('/calcular', async (req, res) => {
  try {
    const { cepDestino, produtos } = req.body;

    if (!cepDestino || !produtos || produtos.length === 0) {
      return res.status(400).json({ erro: 'Campos obrigatórios: cepDestino, produtos' });
    }

    const itensPadrao = produtos.map(p => ({
      id:              '1',
      width:           p.largura     || 30,
      height:          p.altura      || 4,
      length:          p.comprimento || 40,
      weight:          p.peso        || 0.3,
      insurance_value: p.valor       || 0,
      quantity:        p.quantidade  || 1,
    }));

    const payload = {
      from: { postal_code: process.env.CEP_ORIGEM || '01310100' },
      to:   { postal_code: cepDestino.replace(/\D/g, '') },
      products: itensPadrao,
      options: {
        receipt:        false,
        own_hand:       false,
        collect:        false,
        reverse:        false,
        non_commercial: false,
      },
      services: '1,2,3,4,17',
    };

    const resposta = await requisicaoME(c => c.post('/me/shipment/calculate', payload));

    const opcoes = resposta.data
      .filter(op => !op.error)
      .map(op => ({
        id:      op.id,
        nome:    op.name,
        empresa: op.company.name,
        preco:   parseFloat(op.price),
        prazo:   op.delivery_time,
        logo:    op.company.picture,
      }))
      .sort((a, b) => a.preco - b.preco);

    return res.json({ opcoes });
  } catch (err) {
    console.error('Erro Melhor Envio:', err.response?.data || err.message);
    return res.status(500).json({ erro: err.response?.data?.message || err.message });
  }
});

// ────────────────────────────────────────────────────
// POST /api/frete/adicionar-carrinho
// ────────────────────────────────────────────────────
router.post('/adicionar-carrinho', async (req, res) => {
  try {
    const { pedido, freteId, destinatario, produtos } = req.body;

    const itensPadrao = produtos.map(p => ({
      name:          p.nome       || 'Camiseta S33D',
      quantity:      p.quantidade || 1,
      unitary_value: p.preco      || 0,
      weight:        p.peso       || 0.3,
      width:         p.largura    || 30,
      height:        p.altura     || 4,
      length:        p.comprimento || 40,
    }));

    const payload = {
      service: freteId,
      agency:  null,
      from: {
        name:             process.env.REMETENTE_NOME     || 'S33D',
        phone:            process.env.REMETENTE_FONE     || '',
        email:            process.env.REMETENTE_EMAIL    || '',
        company_document: process.env.REMETENTE_CNPJ     || '',
        address:          process.env.REMETENTE_ENDERECO || '',
        complement:       '',
        number:           process.env.REMETENTE_NUMERO   || '',
        district:         process.env.REMETENTE_BAIRRO   || '',
        city:             process.env.REMETENTE_CIDADE   || '',
        country_id:       'BR',
        postal_code:      process.env.CEP_ORIGEM         || '',
        state_abbr:       process.env.REMETENTE_UF       || '',
      },
      to: {
        name:        destinatario.nome,
        phone:       destinatario.telefone,
        email:       destinatario.email,
        document:    destinatario.cpf,
        address:     destinatario.endereco,
        complement:  destinatario.complemento || '',
        number:      destinatario.numero,
        district:    destinatario.bairro,
        city:        destinatario.cidade,
        country_id:  'BR',
        postal_code: destinatario.cep.replace(/\D/g, ''),
        state_abbr:  destinatario.uf,
      },
      products: itensPadrao,
      volumes: [{ height: 10, width: 30, length: 40, weight: 0.5 }],
      options: {
        insurance_value: 0,
        receipt:         false,
        own_hand:        false,
        collect:         false,
        reverse:         false,
        non_commercial:  false,
        invoice:         { key: '' },
        tags:            [{ tag: pedido, url: null }],
      },
    };

    const resposta = await requisicaoME(c => c.post('/me/cart', payload));
    return res.json({ carrinhoId: resposta.data.id });
  } catch (err) {
    console.error('Erro ao adicionar ao carrinho ME:', err.response?.data || err.message);
    return res.status(500).json({ erro: err.response?.data?.message || err.message });
  }
});

// ────────────────────────────────────────────────────
// POST /api/frete/comprar
// ────────────────────────────────────────────────────
router.post('/comprar', async (req, res) => {
  try {
    const { carrinhoIds } = req.body;
    const resposta = await requisicaoME(c => c.post('/me/shipment/checkout', { orders: carrinhoIds }));
    return res.json(resposta.data);
  } catch (err) {
    return res.status(500).json({ erro: err.response?.data?.message || err.message });
  }
});

// ────────────────────────────────────────────────────
// POST /api/frete/etiqueta
// ────────────────────────────────────────────────────
router.post('/etiqueta', async (req, res) => {
  try {
    const ids = req.body.ids || req.body.carrinhoIds;
    await requisicaoME(c => c.post('/me/shipment/generate', { orders: ids }));
    const etiqueta = await requisicaoME(c => c.post('/me/shipment/print', { orders: ids }));
    return res.json({ url: etiqueta.data.url });
  } catch (err) {
    return res.status(500).json({ erro: err.response?.data?.message || err.message });
  }
});

module.exports = router;