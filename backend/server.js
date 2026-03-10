require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const asaasRoutes      = require('./routes/asaas');
const melhorEnvioRoutes = require('./routes/melhorenvio');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────
app.use(cors({
  origin: [
    'https://s33d.com.br',
    'https://www.s33d.com.br',
    'https://projeto-seed.vercel.app',
  ],
}));
app.use(express.json());

// ── Rotas ────────────────────────────────────────────
app.use('/api/pagamento', asaasRoutes);
app.use('/api/frete',     melhorEnvioRoutes);

//email-auto
const pedidosRoutes = require('./routes/pedidos');
app.use('/api/pedidos', pedidosRoutes);

// ── Health check ─────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'S33D Backend rodando 🌱' });
});

// ── Start ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});