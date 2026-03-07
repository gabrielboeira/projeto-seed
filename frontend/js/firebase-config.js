// Firebase Config - compatível com HTML sem bundler
// Usa CDN via importmap ou carregamento direto

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDA7rYcAyjiaC21ZjC5g7m9cegSkZyAQs0",
  authDomain: "seed-b9834.firebaseapp.com",
  projectId: "seed-b9834",
  storageBucket: "seed-b9834.firebasestorage.app",
  messagingSenderId: "623181920881",
  appId: "1:623181920881:web:6cd7d2e38ed18c981ef9d0",
  measurementId: "G-LCN0VBHVRY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Busca todos os produtos da coleção 'produtos' no Firestore
async function fetchProdutosFromFirebase() {
  try {
    const snapshot = await getDocs(collection(db, "produtos"));
    const produtos = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      produtos.push({
        id: doc.id,           // ID do documento Firestore (string)
        nome: data.nome,
        preco: data.preco,
        categoria: data.categoria,
        tamanhos: data.tamanhos || [],
        estoque: data.estoque || {},
        // Suporta campo "imagens" (array) ou "imagem" (string única)
        imagens: data.imagens || (data.imagem ? [data.imagem] : []),
        imagem: data.imagens ? data.imagens[0] : data.imagem,
      });
    });

    console.log(`✅ ${produtos.length} produtos carregados do Firebase`);
    return produtos;
  } catch (error) {
    console.error("❌ Erro ao buscar produtos do Firebase:", error);
    return [];
  }
}

// Expõe globalmente para home.js, product.js, etc.
window.firebaseUtils = {
  fetchProdutosFromFirebase,
  db,
};