// Configuração do Firebase
// TODO: Substituir pelos dados reais do Firebase quando disponível

// Estrutura de configuração do Firebase
const firebaseConfig = {
  // TODO: Adicionar configuração do Firebase
  // apiKey: "your-api-key",
  // authDomain: "your-auth-domain",
  // projectId: "your-project-id",
  // storageBucket: "your-storage-bucket",
  // messagingSenderId: "your-messaging-sender-id",
  // appId: "your-app-id"
};

// Inicialização do Firebase (comentado até ter as credenciais)
// import { initializeApp } from 'firebase/app';
// import { getFirestore, collection, getDocs } from 'firebase/firestore';
// import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
// const storage = getStorage(app);

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


