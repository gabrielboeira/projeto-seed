require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const asaasRoutes      = require('./routes/asaas');
const melhorEnvioRoutes = require('./routes/melhorenvio');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // em produção coloque a URL do seu site
}));
app.use(express.json());

// ── Rotas ────────────────────────────────────────────
app.use('/api/pagamento', asaasRoutes);
app.use('/api/frete',     melhorEnvioRoutes);

// ── Health check ─────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'S33D Backend rodando 🌱' });
});

// ── Start ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});