#!/usr/bin/env node
/*
Atualiza os documentos da coleção 'produtos' no Firestore trocando o campo 'imagem'
pelo URL retornado pelo Cloudinary (arquivo cloudinary-mapping.json).

Requisitos:
  npm install firebase-admin dotenv

Variáveis de ambiente:
  GOOGLE_APPLICATION_CREDENTIALS -> caminho para serviceAccountKey.json
  FIREBASE_PROJECT_ID -> opcional (se necessário)

Uso:
  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/update-firestore-images.js
*/
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const admin = require('firebase-admin');

const MAPPING_FILE = path.join(__dirname, '..', 'cloudinary-mapping.json');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Erro: defina a variável GOOGLE_APPLICATION_CREDENTIALS apontando para o service account JSON.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function main() {
  if (!fs.existsSync(MAPPING_FILE)) {
    console.error('Arquivo de mapping não encontrado:', MAPPING_FILE);
    process.exit(1);
  }

  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));

  console.log('Buscando produtos no Firestore...');
  const produtosSnapshot = await db.collection('produtos').get();
  console.log(`Encontrados ${produtosSnapshot.size} produtos.`);

  let updated = 0;

  for (const doc of produtosSnapshot.docs) {
    const data = doc.data();
    let imagemAtual = data.imagem || data.imagemPath || '';
    // tentar encontrar correspondência pelo caminho relativo ou pelo nome do arquivo
    const filename = imagemAtual.split('/').pop();
    const possibleKeys = [
      imagemAtual,
      `assets/produtos/${filename}`,
      `produtos/${filename}`,
      filename
    ];

    let newUrl = null;
    for (const k of possibleKeys) {
      if (mapping[k]) { newUrl = mapping[k]; break; }
    }

    if (newUrl) {
      await db.collection('produtos').doc(doc.id).update({ imagem: newUrl });
      updated++;
      console.log(`Atualizado ${doc.id} -> ${newUrl}`);
    }
  }

  console.log(`Atualização concluída. ${updated} documentos atualizados.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});






