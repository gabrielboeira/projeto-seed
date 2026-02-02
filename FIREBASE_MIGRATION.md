# Guia de Migração para Firebase

Este documento descreve como migrar os dados e imagens para o Firebase.

## Estrutura Preparada

O código já está preparado para receber dados do Firebase. As seguintes funções estão prontas para serem implementadas:

### Arquivos Criados

1. **`js/firebase-config.js`** - Configuração e funções utilitárias do Firebase
2. **`js/data.js`** - Estrutura de dados com funções de inicialização

### Estrutura de Dados no Firestore

Crie uma coleção chamada `produtos` no Firestore com a seguinte estrutura:

```javascript
{
  id: "string",           // ID do documento
  nome: "string",          // Nome do produto
  preco: number,          // Preço do produto
  imagem: "string",        // Path da imagem no Storage (ex: "produtos/camiseta-1.jpg")
  categoria: "string"      // Categoria: "essential", "oversized", "limited"
}
```

### Estrutura no Firebase Storage

Organize as imagens no Storage:
```
produtos/
  ├── camiseta-1.jpg
  ├── camiseta-2.jpg
  └── ...
```

## Passos para Migração

### 1. Instalar Firebase SDK

```bash
npm install firebase
```

### 2. Configurar Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Vá em "Configurações do Projeto" > "Seus apps" > "Web"
4. Copie as credenciais e cole em `js/firebase-config.js`

### 3. Atualizar `firebase-config.js`

Descomente e configure:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
```

### 4. Implementar Funções

Descomente e implemente as funções em `firebase-config.js`:
- `fetchProdutosFromFirebase()` - Buscar produtos do Firestore
- `getImageUrlFromFirebase()` - Buscar URLs das imagens do Storage
- `processProdutosWithImages()` - Processar produtos com URLs das imagens

### 5. Atualizar Inicialização

Nos arquivos que usam produtos, descomente as linhas marcadas com `TODO`:
- `js/home.js` - Função `initHomePage()`
- `js/product.js` - Função `initProductPage()`
- `js/data.js` - Função `initProdutos()`

### 6. Atualizar HTML

Adicione o script do Firebase antes dos outros scripts:

```html
<!-- Firebase SDK -->
<script type="module" src="js/firebase-config.js"></script>
<script src="js/data.js"></script>
```

## Estrutura de Dados Esperada

### Firestore Collection: `produtos`

```javascript
{
  nome: "SEED Essential Black",
  preco: 89.90,
  imagem: "produtos/camiseta-preta.jpg",  // Path no Storage
  categoria: "essential"
}
```

### Storage Path

As imagens devem estar em: `produtos/nome-do-arquivo.jpg`

## Benefícios da Estrutura Atual

✅ Código já preparado para Firebase
✅ Funções assíncronas prontas
✅ Fallback para dados locais durante desenvolvimento
✅ Estrutura de dados consistente
✅ Fácil migração quando Firebase estiver pronto

## Notas Importantes

- As imagens serão carregadas dinamicamente do Firebase Storage
- Os produtos serão buscados do Firestore em tempo real
- O código atual funciona normalmente com dados locais
- Quando Firebase estiver configurado, apenas descomente as linhas marcadas com `TODO`

