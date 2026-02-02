# 🚀 Início Rápido - Compartilhar Site

## Opção Mais Rápida: Vercel (Recomendado)

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Fazer Deploy
```bash
cd /home/gabriel/projetos/proj-seed
vercel
```

### 3. Compartilhar o Link
O Vercel vai gerar um link como: `https://proj-seed-abc123.vercel.app`
Compartilhe esse link com seu cliente!

---

## Opção Alternativa: ngrok (Para Testes Rápidos)

### 1. Instalar ngrok
```bash
# Baixar de: https://ngrok.com/download
# Ou usar o script abaixo
```

### 2. Configurar ngrok
```bash
# Criar conta em https://ngrok.com e copiar o token
ngrok config add-authtoken SEU_TOKEN
```

### 3. Usar o Script Automático
```bash
./start-server.sh
```

### 4. Ou Manualmente
```bash
# Terminal 1: Iniciar servidor
python3 -m http.server 8000

# Terminal 2: Iniciar ngrok
ngrok http 8000
```

---

## Opção Mais Simples: Netlify Drop

1. Acesse: https://app.netlify.com/drop
2. Arraste a pasta do projeto
3. Compartilhe o link gerado

---

## 📝 Nota

Para mais detalhes, consulte: `COMPARTILHAR_SITE.md`


