# Como Compartilhar o Site sem Deploy

Existem várias formas de compartilhar seu site localmente com clientes. Aqui estão as melhores opções:

## 🚀 Opção 1: ngrok (Mais Rápido - Recomendado)

### Passos:

1. **Instalar ngrok:**
   ```bash
   # Linux/Mac
   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok
   
   # Ou baixar de: https://ngrok.com/download
   ```

2. **Criar conta gratuita:**
   - Acesse: https://ngrok.com/
   - Crie uma conta gratuita
   - Copie seu authtoken

3. **Configurar ngrok:**
   ```bash
   ngrok config add-authtoken SEU_TOKEN_AQUI
   ```

4. **Iniciar servidor local:**
   ```bash
   # Opção A: Usando Python (se tiver instalado)
   python3 -m http.server 8000
   
   # Opção B: Usando Node.js (se tiver instalado)
   npx http-server -p 8000
   
   # Opção C: Usando PHP (se tiver instalado)
   php -S localhost:8000
   ```

5. **Criar túnel:**
   ```bash
   ngrok http 8000
   ```

6. **Compartilhar o link:**
   - O ngrok vai gerar um link como: `https://abc123.ngrok.io`
   - Compartilhe esse link com seu cliente
   - O link funciona até você fechar o ngrok

### Vantagens:
- ✅ Muito rápido de configurar
- ✅ Link HTTPS automático
- ✅ Gratuito (com algumas limitações)
- ✅ Funciona imediatamente

### Desvantagens:
- ⚠️ Link muda a cada vez (versão gratuita)
- ⚠️ Precisa manter o computador ligado

---

## 🌐 Opção 2: Vercel (Deploy Temporário Gratuito)

### Passos:

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Fazer deploy:**
   ```bash
   cd /home/gabriel/projetos/proj-seed
   vercel
   ```

3. **Seguir as instruções:**
   - Primeira vez: fazer login
   - Escolher opções padrão
   - Vercel vai gerar um link como: `https://proj-seed.vercel.app`

4. **Compartilhar o link:**
   - O link fica ativo permanentemente
   - Pode deletar depois se quiser

### Vantagens:
- ✅ Link permanente
- ✅ HTTPS automático
- ✅ Gratuito
- ✅ Muito rápido
- ✅ Não precisa manter computador ligado

### Desvantagens:
- ⚠️ Precisa fazer "deploy" (mas é instantâneo)

---

## 🎨 Opção 3: Netlify Drop (Mais Simples)

### Passos:

1. **Acesse:** https://app.netlify.com/drop

2. **Arraste a pasta do projeto:**
   - Arraste a pasta `proj-seed` para a área de drop
   - Ou arraste um arquivo ZIP do projeto

3. **Compartilhar o link:**
   - Netlify gera um link automaticamente
   - Exemplo: `https://random-name-123.netlify.app`

### Vantagens:
- ✅ Extremamente simples (só arrastar)
- ✅ Gratuito
- ✅ HTTPS automático
- ✅ Link permanente

### Desvantagens:
- ⚠️ Precisa fazer upload do projeto

---

## 🔧 Opção 4: Cloudflare Tunnel (Alternativa ao ngrok)

### Passos:

1. **Instalar cloudflared:**
   ```bash
   # Linux
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
   chmod +x cloudflared-linux-amd64
   sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
   ```

2. **Iniciar servidor local:**
   ```bash
   python3 -m http.server 8000
   ```

3. **Criar túnel:**
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```

### Vantagens:
- ✅ Gratuito
- ✅ Sem necessidade de conta
- ✅ Link HTTPS

---

## 📋 Comparação Rápida

| Opção | Velocidade | Permanência | Facilidade | Recomendação |
|-------|-----------|-------------|------------|--------------|
| **ngrok** | ⚡⚡⚡ | Temporário | ⭐⭐⭐ | Para testes rápidos |
| **Vercel** | ⚡⚡ | Permanente | ⭐⭐⭐⭐ | **Melhor opção geral** |
| **Netlify Drop** | ⚡⚡ | Permanente | ⭐⭐⭐⭐⭐ | Mais fácil |
| **Cloudflare** | ⚡⚡⚡ | Temporário | ⭐⭐ | Alternativa ao ngrok |

---

## 🎯 Recomendação Final

**Para mostrar ao cliente rapidamente:**
- Use **Vercel** ou **Netlify Drop** (mais profissional e permanente)

**Para testes rápidos durante desenvolvimento:**
- Use **ngrok** (mais rápido para testes)

---

## 📝 Script Rápido para ngrok

Crie um arquivo `start-server.sh`:

```bash
#!/bin/bash
# Iniciar servidor e ngrok

# Iniciar servidor em background
python3 -m http.server 8000 &
SERVER_PID=$!

# Aguardar servidor iniciar
sleep 2

# Iniciar ngrok
ngrok http 8000

# Quando ngrok fechar, matar o servidor
kill $SERVER_PID
```

Torne executável:
```bash
chmod +x start-server.sh
```

Execute:
```bash
./start-server.sh
```


