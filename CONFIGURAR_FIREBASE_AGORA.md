# Configurar o Firebase agora

Siga estes passos na ordem. No final, o site passa a ler os produtos do Firestore.

---

## 1. Criar o projeto no Firebase (se ainda não tiver)

1. Acesse https://console.firebase.google.com/
2. **Adicionar projeto** → Nome: `s33d` (ou outro) → Avançar → Criar projeto.

---

## 2. Ativar o Firestore (banco de dados)

1. No menu lateral: **Build** → **Firestore Database**.
2. **Criar banco de dados**.
3. **Modo de teste** (para desenvolvimento) → Avançar.
4. **Localização**: `southamerica-east1` (São Paulo).
5. **Ativar**.

---

## 3. Criar a coleção `produtos`

1. Em Firestore: **Iniciar coleção**.
2. **ID da coleção**: `produtos` → Próximo.
3. **ID do documento**: deixe em branco (gerar automaticamente).
4. Adicione os campos do primeiro produto:

| Campo     | Tipo   | Exemplo / Valor                          |
|----------|--------|------------------------------------------|
| `nome`   | string | `Seed Oversized`                         |
| `preco`  | number | `99.9`                                   |
| `imagem` | string | URL da Cloudinary ou `assets/produtos/…` |
| `categoria` | string | `oversized`                           |
| `tamanhos` | array | `["P","M","G","GG"]`                  |
| `estoque`  | map   | Campos: `P` (number), `M` (number), etc. |

5. Dentro de **estoque** (map):  
   - Campo `P`, tipo number, valor `5`  
   - Campo `M`, tipo number, valor `10`  
   - E o mesmo para `G`, `GG` (e `XG` se tiver).
6. **Salvar**.
7. Repita “Adicionar documento” para cada produto (ou use o `migrate-to-firebase.html` para enviar vários de uma vez).

---

## 4. Pegar as credenciais do app Web

1. **Configurações do projeto** (ícone de engrenagem) → **Visão geral do projeto**.
2. Em **Seus apps**, clique no ícone **</>** (Web).
3. **Apelido do app**: `S33D Web` → **Registrar app**.
4. Copie o objeto `firebaseConfig` que aparecer (algo assim):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

---

## 5. Colar as credenciais no projeto

1. Abra o arquivo **`js/firebase-config.js`** no projeto.
2. Substitua o objeto `firebaseConfig` inteiro pelo que você copiou (mantenha o nome `firebaseConfig`).
3. Salve o arquivo.

O código que lê o Firestore já está preparado nesse arquivo; com as credenciais corretas, ele passa a buscar os produtos no Firebase.

---

## 6. Regras do Firestore (segurança)

1. No Firestore: aba **Regras**.
2. Para desenvolvimento (qualquer um pode ler):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /produtos/{produtoId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

3. **Publicar**.  
Em produção, troque depois por regras que exijam autenticação para escrita.

---

## 7. Usar o Firebase no site

- O **index.html** e as outras páginas precisam carregar o Firebase antes dos outros scripts.
- Inclua o script do Firebase (com suas credenciais) em todas as páginas que listam ou mostram produtos, por exemplo:

```html
<script type="module" src="js/firebase-config.js"></script>
<script src="js/data.js"></script>
<script src="js/cart.js"></script>
<script src="js/home.js"></script>
```

- Em **`js/firebase-config.js`** já existe a lógica que:
  - Inicializa o app com o `firebaseConfig`
  - Lê os documentos da coleção `produtos`
  - Disponibiliza `window.firebaseUtils.fetchProdutosFromFirebase()` para o resto do site.

Assim que as credenciais estiverem em `firebase-config.js` e o script estiver incluído nas páginas, o site passa a usar os produtos do Firestore.

---

## Resumo rápido

| Onde              | O que fazer |
|-------------------|-------------|
| Firebase Console  | Criar projeto → Firestore → Coleção `produtos` → Adicionar documentos. |
| Firebase Console  | Registrar app Web → Copiar `firebaseConfig`. |
| Projeto           | Colar credenciais em `js/firebase-config.js`. |
| Firestore → Regras| Publicar regra de leitura para `produtos`. |
| HTML              | Incluir `<script type="module" src="js/firebase-config.js"></script>` antes de `data.js` nas páginas que usam produtos. |

Se algo não funcionar, confira:  
- Nome da coleção exatamente `produtos`.  
- Nomes dos campos iguais ao da tabela (`nome`, `preco`, `imagem`, `categoria`, `tamanhos`, `estoque`).  
- Credenciais coladas corretamente em `js/firebase-config.js` (sem apagar aspas ou vírgulas).
