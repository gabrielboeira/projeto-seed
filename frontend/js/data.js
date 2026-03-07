// Dados locais de fallback (usados se Firebase falhar ou estiver offline)
let produtos = [];

// Fallback local caso o Firebase não carregue
const produtosFallback = [
  {
    id: "1",
    nome: "Seed Oversized",
    preco: 99.90,
    imagem: "assets/produtos/img/camiseta.png",
    imagens: ["assets/produtos/img/camiseta.png"],
    categoria: "oversized",
    tamanhos: ["P", "M", "G", "GG"],
    estoque: { "P": 5, "M": 10, "G": 8, "GG": 3 }
  }
];

// Inicializa produtos — tenta Firebase primeiro, usa fallback se falhar
async function initProdutos() {
  if (window.firebaseUtils) {
    const lista = await window.firebaseUtils.fetchProdutosFromFirebase();
    if (lista && lista.length > 0) {
      produtos = lista;
      window.produtos = produtos;
      return produtos;
    }
  }
  // Fallback local
  console.warn("⚠️ Usando dados locais (Firebase não disponível)");
  produtos = produtosFallback;
  window.produtos = produtos;
  return produtos;
}

window.produtos = produtos;
window.initProdutos = initProdutos;