#!/bin/bash
# Script para iniciar servidor local e compartilhar via ngrok

echo "🚀 Iniciando servidor local..."

# Verificar se Python está instalado
if command -v python3 &> /dev/null; then
    SERVER_CMD="python3 -m http.server"
elif command -v python &> /dev/null; then
    SERVER_CMD="python -m http.server"
elif command -v php &> /dev/null; then
    SERVER_CMD="php -S localhost:8000"
elif command -v npx &> /dev/null; then
    SERVER_CMD="npx http-server -p 8000"
else
    echo "❌ Erro: Nenhum servidor encontrado (Python, PHP ou Node.js)"
    exit 1
fi

# Iniciar servidor em background
$SERVER_CMD 8000 > /dev/null 2>&1 &
SERVER_PID=$!

echo "✅ Servidor iniciado na porta 8000 (PID: $SERVER_PID)"
echo "📡 Aguardando ngrok..."

# Verificar se ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok não encontrado!"
    echo "📥 Instale em: https://ngrok.com/download"
    kill $SERVER_PID
    exit 1
fi

# Iniciar ngrok
echo "🌐 Criando túnel público..."
echo "🔗 Seu link será exibido abaixo:"
echo ""
ngrok http 8000

# Quando ngrok fechar, matar o servidor
echo ""
echo "🛑 Encerrando servidor..."
kill $SERVER_PID 2>/dev/null
echo "✅ Servidor encerrado"


