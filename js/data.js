// Dados locais dos produtos (será substituído por Firebase)
// TODO: Migrar para Firebase Firestore
let produtos = [
    {
      id: 1,
      nome: "SEED Essential Black",
      preco: 89.90,
      imagem: "assets/produtos/img/S33D.png",
      categoria: "essential"
    },
    {
      id: 2,
      nome: "SEED Essential White",
      preco: 89.90,
      imagem: "assets/produtos/img/S33D.png",
      categoria: "essential"
    },
    {
      id: 3,
      nome: "SEED Oversized - Limited",
      preco: 99.90,
      imagem: "assets/produtos/img/S33D.png",
      categoria: "oversized"
    },
    {
      id: 4,
      nome: "SEED Essential Gray",
      preco: 89.90,
      imagem: "assets/produtos/img/S33D.png",
      categoria: "essential"
    },
    {
      id: 5,
      nome: "SEED Oversized - Exclusive",
      preco: 99.90,
      imagem: "assets/produtos/img/S33D.png",
      categoria: "oversized"
    },
    {
      id: 6,
      nome: "SEED Limited Edition",
      preco: 119.90,
      imagem: "assets/produtos/img/S33D.png",
      categoria: "limited"
    }
  ];

// Função para inicializar produtos (será substituída por Firebase)
async function initProdutos() {
  // TODO: Quando Firebase estiver configurado, usar:
  // produtos = await firebaseUtils.fetchProdutosFromFirebase();
  // produtos = await firebaseUtils.processProdutosWithImages(produtos);
  
  return produtos;
}

// Exportar para uso global
window.produtos = produtos;
window.initProdutos = initProdutos;
  