# 🔥 Guia Completo de Configuração do Firebase

Este guia vai te ajudar a configurar o Firebase do zero para o projeto S33D.

## 📋 Índice
1. [Criar Projeto no Firebase](#1-criar-projeto-no-firebase)
2. [Configurar Firestore (Banco de Dados)](#2-configurar-firestore-banco-de-dados)
3. [Configurar Storage (Imagens)](#3-configurar-storage-imagens)
4. [Instalar Firebase SDK](#4-instalar-firebase-sdk)
5. [Configurar Credenciais](#5-configurar-credenciais)
6. [Estrutura de Dados](#6-estrutura-de-dados)
7. [Popular o Banco](#7-popular-o-banco)

---

## 1. Criar Projeto no Firebase

### Passo 1: Acessar Firebase Console
1. Acesse: https://console.firebase.google.com/
2. Clique em **"Adicionar projeto"** ou **"Create a project"**

### Passo 2: Configurar Projeto
1. **Nome do projeto**: `s33d` (ou o nome que preferir)
2. Clique em **"Continuar"**
3. **Google Analytics**: Pode desabilitar por enquanto (ou habilitar se quiser)
4. Clique em **"Criar projeto"**
5. Aguarde a criação (pode levar alguns segundos)

---

## 2. Configurar Firestore (Banco de Dados)

### Passo 1: Criar Banco Firestore
1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. **Modo de segurança**: Escolha **"Modo de teste"** (para desenvolvimento)
   - ⚠️ **IMPORTANTE**: Depois você vai precisar configurar regras de segurança
4. **Localização**: Escolha `southamerica-east1` (São Paulo) - melhor para Brasil
5. Clique em **"Ativar"**

### Passo 2: Criar Coleção `produtos`
1. Clique em **"Iniciar coleção"**
2. **ID da coleção**: `produtos`
3. Clique em **"Próximo"**

### Passo 3: Adicionar Primeiro Documento
1. **ID do documento**: Deixe em branco (Firebase gera automaticamente)
2. Adicione os seguintes campos:

| Campo | Tipo | Valor |
|-------|------|-------|
| `nome` | string | `SEED Essential Black` |
| `preco` | number | `89.90` |
| `imagem` | string | `produtos/camiseta-preta.jpg` |
| `categoria` | string | `essential` |
| `tamanhos` | array | `["P", "M", "G", "GG"]` |
| `estoque` | map | Veja estrutura abaixo |

#### Estrutura do campo `estoque` (map):
Clique em **"Adicionar campo"** → Escolha **"map"** → Nome: `estoque`

Dentro do map, adicione:
- `P` (number): `5`
- `M` (number): `10`
- `G` (number): `8`
- `GG` (number): `3`

3. Clique em **"Salvar"**

### Passo 4: Adicionar Mais Produtos
Repita o processo para adicionar mais produtos. Você pode usar os dados do arquivo `js/data.js` como referência.

**Dica**: Depois de criar o primeiro, você pode duplicar e editar para criar os outros mais rápido.

---

## 3. Hospedar imagens (alternativas sem alterar o plano)

Se você não pode alterar o plano do Firebase agora, não é necessário usar o Storage do Firebase imediatamente — existem alternativas simples e gratuitas para hospedar as imagens dos produtos. Escolha a que for mais conveniente:

- **Opção A — Manter imagens no repositório (recomendado para desenvolvimento)**  
  - Coloque as imagens em `assets/produtos/` no seu projeto (já temos essa pasta).  
  - No Firestore, armazene o campo `imagem` como o caminho relativo ou o nome do arquivo, por exemplo: `assets/produtos/camiseta-preta.jpg`.  
  - No código, use esse caminho direto (o site servirá as imagens quando hospedado via Vercel/Netlify/GitHub Pages). Não precisa tocar no plano do Firebase.

- **Opção B — Hospedar no GitHub (GitHub Pages / Raw)**  
  - Crie um repositório público (ou privado com Pages) e faça push da pasta de imagens.  
  - Use a URL bruta (`https://raw.githubusercontent.com/usuario/repo/branch/path/to/img.jpg`) ou publique via GitHub Pages (`https://usuario.github.io/repo/produtos/img.jpg`).  
  - Salve essa URL no campo `imagem` do Firestore.

- **Opção C — Cloudinary (ou serviço de CDN de imagens, free tier)**  
  - Crie conta gratuita em https://cloudinary.com/  
  - Faça upload das imagens e copie as URLs CDN fornecidas.  
  - Salve essas URLs no campo `imagem` do Firestore. Cloudinary tem API para uploads automatizados se você quiser integrar depois.

- **Opção D — Imgur / Upload manual rápido**  
  - Para testes rápidos, pode subir em Imgur e usar o link direto. Não recomendo para produção por limitações de API/terms.

### O que eu recomendo agora
1. Para desenvolvimento e demonstração ao cliente: use **Opção A** (manter em `assets/produtos/`) — é a forma mais simples e não precisa mexer em planos.  
2. Se quiser links públicos gerenciáveis sem alterar o Firebase: use **Cloudinary** (Opção C) — tem integração e CDN.

### Como referenciar no Firestore / código
- Se usar caminhos locais (Opção A): no Firestore coloque `imagem: "assets/produtos/camiseta-preta.jpg"` e mantenha `firebaseUtils.getImageUrlFromFirebase` com fallback para caminhos locais.  
- Se usar URLs públicas (Opção B/C/D): coloque a URL completa em `imagem` e o front usa diretamente.

### Nota sobre migração futura para Firebase Storage
Quando conseguir alterar o plano ou quiser consolidar tudo no Firebase Storage, basta:  
- Fazer upload das imagens para `produtos/` no Storage;  
- Atualizar os campos `imagem` no Firestore para os paths (ou URLs) do Storage;  
- Ajustar as funções em `js/firebase-config.js` / `firebaseUtils` para buscar `getDownloadURL` do Storage.

---

## 4. Instalar Firebase SDK

### Opção A: Via npm (Recomendado)
```bash
cd /home/gabriel/projetos/proj-seed
npm init -y
npm install firebase
```

### Opção B: Via CDN (Mais Simples)
Não precisa instalar nada, vamos usar CDN no HTML.

---

## 5. Configurar Credenciais

### Passo 1: Obter Credenciais
1. No Firebase Console, clique no ícone de **engrenagem** ⚙️ ao lado de "Visão geral do projeto"
2. Clique em **"Configurações do projeto"**
3. Role até **"Seus apps"**
4. Clique no ícone **`</>`** (Web)
5. **Nome do app**: `S33D Web`
6. **Firebase Hosting**: Pode desmarcar por enquanto
7. Clique em **"Registrar app"**
8. **Copie as credenciais** que aparecem (firebaseConfig)

### Passo 2: Configurar no Projeto

Vou atualizar o arquivo `js/firebase-config.js` com as credenciais.

---

## 6. Estrutura de Dados

### Coleção: `produtos`

Cada documento deve ter:

```javascript
{
  nome: "SEED Essential Black",        // string
  preco: 89.90,                        // number
  imagem: "produtos/camiseta-preta.jpg", // string (path no Storage)
  categoria: "essential",              // string: "essential" | "oversized" | "limited"
  tamanhos: ["P", "M", "G", "GG"],     // array de strings
  estoque: {                            // map
    "P": 5,                             // number
    "M": 10,                            // number
    "G": 8,                             // number
    "GG": 3                             // number
  }
}
```

### Exemplo Completo de Produto:

```javascript
{
  nome: "SEED Essential Black",
  preco: 89.90,
  imagem: "produtos/camiseta-preta.jpg",
  categoria: "essential",
  tamanhos: ["P", "M", "G", "GG"],
  estoque: {
    "P": 5,
    "M": 10,
    "G": 8,
    "GG": 3
  }
}
```

---

## 7. Popular o Banco

### Opção A: Manual (Firebase Console)
1. Vá em Firestore Database
2. Clique em "Adicionar documento"
3. Preencha os campos conforme a estrutura acima
4. Repita para cada produto

### Opção B: Script de Migração (Recomendado)

Crie um arquivo `migrate-to-firebase.html` para popular o banco automaticamente.

---

## 🔐 Regras de Segurança (Importante!)

Depois de testar, configure as regras de segurança:

### Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura pública de produtos
    match /produtos/{produtoId} {
      allow read: if true;
      allow write: if false; // Apenas via admin
    }
  }
}
```

### Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /produtos/{allPaths=**} {
      allow read: if true;
      allow write: if false; // Apenas via admin
    }
  }
}
```

---

## 📝 Próximos Passos

1. ✅ Criar projeto no Firebase
2. ✅ Configurar Firestore
3. ✅ Configurar Storage
4. ✅ Obter credenciais
5. ⏳ Configurar código (próximo passo)
6. ⏳ Testar conexão
7. ⏳ Popular banco de dados

---

## 🆘 Precisa de Ajuda?

Se tiver dúvidas em algum passo, me avise que eu te ajudo!

