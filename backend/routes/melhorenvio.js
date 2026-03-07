const express = require('express');
const axios   = require('axios');
const router  = express.Router();

const ME_URL = process.env.ME_SANDBOX === 'true'
  ? 'https://sandbox.melhorenvio.com.br/api/v2'
  : 'https://melhorenvio.com.br/api/v2';

const melhorEnvio = axios.create({
  baseURL: ME_URL,
  headers: {
    'Authorization': `Bearer ${process.env.ME_TOKEN}`,
    'Content-Type':  'application/json',
    'Accept':        'application/json',
    'User-Agent':    'S33D Loja (contato@seed.com.br)', // troque pelo seu e-mail
  },
});

// ────────────────────────────────────────────────────
// POST /api/frete/calcular
// Calcula opções de frete para o CEP do cliente
//
// Body: {
//   cepDestino: "90000000",
//   produtos: [{ peso: 0.3, altura: 4, largura: 30, comprimento: 40, quantidade: 1 }]
// }
// ────────────────────────────────────────────────────
router.post('/calcular', async (req, res) => {
  try {
    const { cepDestino, produtos } = req.body;

    if (!cepDestino || !produtos || produtos.length === 0) {
      return res.status(400).json({ erro: 'Campos obrigatórios: cepDestino, produtos' });
    }

    // Dimensões padrão para camisetas (ajuste conforme seu produto)
    const itensPadrao = produtos.map(p => ({
      id:         '1',
      width:      p.largura    || 30,   // cm
      height:     p.altura     || 4,    // cm
      length:     p.comprimento || 40,  // cm
      weight:     p.peso       || 0.3,  // kg
      insurance_value: p.valor || 0,
      quantity:   p.quantidade || 1,
    }));

    const payload = {
      from: { postal_code: process.env.CEP_ORIGEM || '01310100' }, // CEP do remetente
      to:   { postal_code: cepDestino.replace(/\D/g, '') },
      products: itensPadrao,
      options: {
        receipt:           false,
        own_hand:          false,
        collect:           false,
        reverse:           false,
        non_commercial:    false,
      },
      services: '1,2,3,4,17', // PAC, SEDEX, PAC Mini, SEDEX 10, Jadlog
    };

    const resposta = await melhorEnvio.post('/me/shipment/calculate', payload);

    // Filtra apenas opções sem erro e formata a resposta
    const opcoes = resposta.data
      .filter(op => !op.error)
      .map(op => ({
        id:           op.id,
        nome:         op.name,
        empresa:      op.company.name,
        preco:        parseFloat(op.price),
        prazo:        op.delivery_time, // dias úteis
        logo:         op.company.picture,
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
// Adiciona envio ao carrinho do Melhor Envio
// (necessário antes de gerar a etiqueta)
//
// Body: { pedido, freteId, destinatario, produtos }
// ────────────────────────────────────────────────────
router.post('/adicionar-carrinho', async (req, res) => {
  try {
    const { pedido, freteId, destinatario, produtos } = req.body;

    const itensPadrao = produtos.map((p, i) => ({
      name:            p.nome || 'Camiseta S33D',
      quantity:        p.quantidade || 1,
      unitary_value:   p.preco || 0,
      weight:          p.peso || 0.3,
      width:           p.largura || 30,
      height:          p.altura || 4,
      length:          p.comprimento || 40,
    }));

    const payload = {
      service:  freteId,
      agency:   null,
      from: {
        name:          process.env.REMETENTE_NOME || 'S33D',
        phone:         process.env.REMETENTE_FONE || '',
        email:         process.env.REMETENTE_EMAIL || '',
        company_document: process.env.REMETENTE_CNPJ || '',
        address:       process.env.REMETENTE_ENDERECO || '',
        complement:    '',
        number:        process.env.REMETENTE_NUMERO || '',
        district:      process.env.REMETENTE_BAIRRO || '',
        city:          process.env.REMETENTE_CIDADE || '',
        country_id:    'BR',
        postal_code:   process.env.CEP_ORIGEM || '',
        state_abbr:    process.env.REMETENTE_UF || '',
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
      volumes: [{
        height: 10, width: 30, length: 40, weight: 0.5,
      }],
      options: {
        insurance_value: 0,
        receipt: false,
        own_hand: false,
        collect: false,
        reverse: false,
        non_commercial: false,
        invoice: { key: '' },
        tags: [{ tag: pedido, url: null }],
      },
    };

    const resposta = await melhorEnvio.post('/me/cart', payload);
    return res.json({ carrinhoId: resposta.data.id });
  } catch (err) {
    console.error('Erro ao adicionar ao carrinho ME:', err.response?.data || err.message);
    return res.status(500).json({ erro: err.response?.data?.message || err.message });
  }
});

// ────────────────────────────────────────────────────
// POST /api/frete/comprar
// Compra o frete (desconta do saldo do Melhor Envio)
// Body: { carrinhoIds: ["id1", "id2"] }
// ────────────────────────────────────────────────────
router.post('/comprar', async (req, res) => {
  try {
    const { carrinhoIds } = req.body;
    const resposta = await melhorEnvio.post('/me/shipment/checkout', { orders: carrinhoIds });
    return res.json(resposta.data);
  } catch (err) {
    return res.status(500).json({ erro: err.response?.data?.message || err.message });
  }
});

// ────────────────────────────────────────────────────
// POST /api/frete/etiqueta
// Gera a etiqueta para impressão
// Body: { carrinhoIds: ["id1"] }
// ────────────────────────────────────────────────────
router.post('/etiqueta', async (req, res) => {
  try {
    const { carrinhoIds } = req.body;
    await melhorEnvio.post('/me/shipment/generate', { orders: carrinhoIds });
    const etiqueta = await melhorEnvio.post('/me/shipment/print', { orders: carrinhoIds });
    return res.json({ url: etiqueta.data.url });
  } catch (err) {
    return res.status(500).json({ erro: err.response?.data?.message || err.message });
  }
});

module.exports = router;