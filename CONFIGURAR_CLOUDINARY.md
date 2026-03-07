# Configurar Cloudinary no Projeto

Guia para fazer as imagens aparecerem no site e salvar as URLs no Firestore.

---

## Estrutura no Cloudinary

O projeto espera as imagens em:

- **Caminho:** `home/seed/`
- **Dentro de `seed`:** uma pasta por produto, cada pasta com uma ou mais fotos.

Exemplo:

```
home/seed/
  ├── seed-essential-black/
  │   ├── frente.jpg
  │   ├── costas.jpg
  │   └── detalhe.jpg
  ├── seed-oversized/
  │   ├── 1.jpg
  │   └── 2.jpg
  └── outro-produto/
      └── foto.jpg
```

O **nome da pasta** (ex: `seed-essential-black`) é usado para ligar ao produto no Firestore através do campo **`cloudinaryPasta`**.

---

## Escolha o seu cenário

### Cenário A: Imagens já estão no Cloudinary (pasta home/seed)

Se você já fez upload manual no Cloudinary, com pastas dentro de `home/seed/`:

1. **Listar imagens e gerar os arquivos**
2. **No Firestore:** em cada produto, preencher o campo **`cloudinaryPasta`** com o nome da pasta (ex: `seed-essential-black`)
3. **Atualizar o Firestore** com o script

### Cenário B: Imagens estão na pasta local (assets/produtos)

Se as imagens estão no projeto em `assets/produtos/img/`:

1. **Enviar imagens para o Cloudinary**
2. **Atualizar o Firestore com as URLs**

---

## Passo 0: Configuração inicial (ambos os cenários)

### 1. Instalar dependências

```bash
cd /home/gabriel/projetos/proj-seed
npm init -y
npm install cloudinary dotenv firebase-admin
```

### 2. Criar arquivo `.env`

Crie o arquivo `.env` na raiz do projeto com suas credenciais do Cloudinary:

```
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
```

*(Obtenha em: Cloudinary Dashboard → Account Details)*

### 3. Service Account do Firebase

Para atualizar o Firestore, você precisa da chave de serviço:

1. Firebase Console → Configurações do projeto → Contas de serviço
2. Gerar nova chave privada
3. Salvar como `serviceAccountKey.json` na raiz do projeto
4. Adicionar ao `.gitignore`: `serviceAccountKey.json`

---

## Cenário A: Imagens já no Cloudinary

### Passo 1: Listar imagens e gerar arquivos

O script `scripts/list-cloudinary-images.js` lista tudo que está em `home/seed/` (incluindo subpastas) e gera:

- **`cloudinary-mapping.json`** – mapeamento nome/caminho → URL (para produtos com uma só imagem)
- **`cloudinary-by-folder.json`** – `{ "nome-pasta": [url1, url2, ...], ... }` para vários produtos com várias fotos

```bash
node scripts/list-cloudinary-images.js
```

### Passo 2: Campo `cloudinaryPasta` no Firestore

Para produtos que têm **várias fotos** em uma pasta no Cloudinary:

1. Abra cada documento da coleção **`produtos`** no Firestore.
2. Adicione o campo **`cloudinaryPasta`** (tipo string) com o **nome exato da pasta** no Cloudinary.  
   Exemplo: se a pasta é `seed-essential-black`, use `cloudinaryPasta: "seed-essential-black"`.

Assim o script sabe qual pasta usar e preenche **`imagem`** (primeira foto) e **`imagens`** (array com todas as URLs).

Produtos sem `cloudinaryPasta` continuam sendo atualizados pelo `cloudinary-mapping.json` (campo `imagem` apenas).

### Passo 3: Atualizar o Firestore

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
node scripts/update-firestore-images.js
```

Pronto. As URLs do Cloudinary estarão no Firestore e o site exibirá as imagens.

---

## Cenário B: Imagens locais (assets/produtos)

### Passo 1: Enviar imagens para o Cloudinary

O script `scripts/upload-cloudinary.js` envia todas as imagens de `assets/produtos/` para a pasta `home/seed` no Cloudinary.

```bash
node scripts/upload-cloudinary.js
```

**Resultado:** arquivo `cloudinary-mapping.json` gerado automaticamente.

### Passo 2: Atualizar o Firestore

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
node scripts/update-firestore-images.js
```

---

## Resumo do fluxo

```
Cenário A (imagens já no Cloudinary):
  node scripts/list-cloudinary-images.js  →  cloudinary-mapping.json
  node scripts/update-firestore-images.js →  Firestore atualizado

Cenário B (imagens locais):
  node scripts/upload-cloudinary.js      →  cloudinary-mapping.json
  node scripts/update-firestore-images.js →  Firestore atualizado
```

---

## Estrutura esperada no Firestore

**Produto com várias fotos (pasta no Cloudinary):**  
Antes do script, adicione o campo **`cloudinaryPasta`** com o nome da pasta:

```javascript
{
  nome: "SEED Essential Black",
  cloudinaryPasta: "seed-essential-black",
  preco: 89.90,
  categoria: "essential",
  tamanhos: ["P", "M", "G", "GG"],
  estoque: { "P": 5, "M": 10, "G": 8, "GG": 3 }
}
```

Depois do script, o Firestore ficará com:

```javascript
imagem: "https://res.cloudinary.com/.../frente.jpg",
imagens: ["https://res.cloudinary.com/.../frente.jpg", "https://.../costas.jpg", ...]
```

**Produto com uma só imagem (sem pasta):**  
Mantenha o campo `imagem` com caminho ou nome do arquivo (ex: `assets/produtos/img/camiseta.png`). O script atualiza para a URL do Cloudinary usando `cloudinary-mapping.json`.

---

## O front-end

- Na **listagem**, é usada a primeira imagem: `imagens[0]` ou `imagem`.
- Na **página do produto**, se existir o array `imagens`, é exibida uma galeria com miniaturas; ao clicar, a imagem principal troca.
