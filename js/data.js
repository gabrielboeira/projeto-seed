// Dados locais dos produtos (será substituído por Firebase)
// TODO: Migrar para Firebase Firestore
let produtos = [
    {
      id: 1,
      nome: "SEED Essential Black",
      preco: 89.90,
      imagem: "assets/produtos/img/S33D.png",
      categoria: "essential",
      tamanhos: ["P", "M", "G", "GG"],
      estoque: {
        "P": 5,
        "M": 10,
        "G": 8,
        "GG": 3
      }
    },
    {
      id: 2,
      nome: "SEED Essential White",
      preco: 89.90,
      imagem: "assets/produtos/img/S33D.png",
      categoria: "essential",
      tamanhos: ["P", "M", "G", "GG"],
      estoque: {
        "P": 0,  // Esgotado para exemplo
        "M": 0,
        "G": 0,
        "GG": 0
      }
    },
    {
      id: 3,
      nome: "SEED Oversized - Limited",
      preco: 99.90,
      imagem: "assets/produtos/img/S33D.png",
      categoria: "oversized",
      tamanhos: ["P", "M", "G", "GG", "XG"],
      estoque: {
        "P": 2,
        "M": 5,
        "G": 4,
        "GG": 1,
        "XG": 0  // Esgotado para exemplo
      }
    },
    {
      id: 4,
      nome: "SEED Essential Gray",
      preco: 89.90,
      imagem: "assets/produtos/img/S33D.png",
      categoria: "essential",
      tamanhos: ["P", "M", "G", "GG"],
      estoque: {
        "P": 7,
        "M": 12,
        "G": 9,
        "GG": 4
      }
    },
    {
      id: 5,
      nome: "SEED Oversized - Exclusive",
      preco: 99.90,
      imagem: "assets/produtos/img/S33D.png",
      categoria: "oversized",
      tamanhos: ["P", "M", "G", "GG", "XG"],
      estoque: {
        "P": 3,
        "M": 6,
        "G": 5,
        "GG": 2,
        "XG": 1
      }
    },
    {
      id: 6,
      nome: "SEED Limited Edition",
      preco: 119.90,
      imagem: "assets/produtos/img/S33D.png",
      categoria: "limited",
      tamanhos: ["P", "M", "G", "GG"],
      estoque: {
        "P": 1,
        "M": 3,
        "G": 2,
        "GG": 0  // Esgotado para exemplo
      }
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
  