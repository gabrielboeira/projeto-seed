const express = require('express');
const router  = express.Router();
const { db }  = require('../firebase-admin');
const { enviarRastreio } = require('../email');

// POST /api/pedidos/:id/rastreio
router.post('/:id/rastreio', async (req, res) => {
  const { id }       = req.params;
  const { rastreio } = req.body;

  if (!rastreio) return res.status(400).json({ erro: 'Código de rastreio obrigatório.' });

  try {
    const pedidoDoc = await db.collection('pedidos').doc(id).get();
    if (!pedidoDoc.exists) return res.status(404).json({ erro: 'Pedido não encontrado.' });

    const pedido = { id, ...pedidoDoc.data() };

    // Atualiza status no Firestore
    await db.collection('pedidos').doc(id).update({
      'envio.rastreio': rastreio,
      'envio.status':   'postado',
      atualizadoEm:     new Date(),
    });

    // Envia e-mail de rastreio para o cliente
    await enviarRastreio(pedido, rastreio);
    console.log(`📧 E-mail de rastreio enviado para ${pedido.cliente?.email} — ${rastreio}`);

    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao enviar e-mail rastreio:', err.message);
    return res.status(500).json({ erro: err.message });
  }
});

// POST /api/pedidos/:id/entregue
router.post('/:id/entregue', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('pedidos').doc(id).update({
      'envio.status': 'entregue',
      atualizadoEm:   new Date(),
    });
    console.log(`✅ Pedido ${id} marcado como entregue`);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

module.exports = router;