// Configuração do Firebase
// ⚠️ SUBSTITUA pelas suas credenciais do Firebase Console

const firebaseConfig = {
  // Cole suas credenciais aqui (obtenha em: Firebase Console > Configurações do Projeto > Seus apps)
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

// Inicialização do Firebase
// Descomente quando tiver as credenciais configuradas
/*
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
*/

// Função para buscar produtos do Firebase
async function fetchProdutosFromFirebase() {
  // TODO: Implementar quando Firebase estiver configurado
  /*
  try {
    const produtosCollection = collection(db, 'produtos');
    const produtosSnapshot = await getDocs(produtosCollection);
    const produtosList = [];
    
    produtosSnapshot.forEach((doc) => {
      produtosList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return produtosList;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
  */
  
  // Por enquanto retorna os dados locais
  return produtos;
}

// Função para buscar URL da imagem do Firebase Storage
async function getImageUrlFromFirebase(imagePath) {
  // TODO: Implementar quando Firebase Storage estiver configurado
  /*
  try {
    const imageRef = ref(storage, imagePath);
    const url = await getDownloadURL(imageRef);
    return url;
  } catch (error) {
    console.error('Erro ao buscar imagem:', error);
    return imagePath; // Fallback para path local
  }
  */
  
  // Por enquanto retorna o path local
  return imagePath;
}

// Função para processar produtos e adicionar URLs das imagens
async function processProdutosWithImages(produtosList) {
  const produtosProcessados = await Promise.all(
    produtosList.map(async (produto) => {
      return {
        ...produto,
        imagem: await getImageUrlFromFirebase(produto.imagem || produto.imagemPath)
      };
    })
  );
  
  return produtosProcessados;
}

// Exportar funções
window.firebaseUtils = {
  fetchProdutosFromFirebase,
  getImageUrlFromFirebase,
  processProdutosWithImages
};


