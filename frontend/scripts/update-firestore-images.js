#!/usr/bin/env node
/*
Atualiza a coleção 'produtos' no Firestore com URLs do Cloudinary.

- Lê cloudinary-by-folder.json: se o produto tiver campo "cloudinaryPasta", usa a lista de URLs
  daquela pasta e grava "imagem" (primeira) e "imagens" (array).
- Caso contrário, usa cloudinary-mapping.json para atualizar só o campo "imagem" (uma URL).

Requisitos: npm install firebase-admin dotenv
Uso: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/update-firestore-images.js
*/
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const admin = require('firebase-admin');

const MAPPING_FILE = path.join(__dirname, '..', 'cloudinary-mapping.json');
const BY_FOLDER_FILE = path.join(__dirname, '..', 'cloudinary-by-folder.json');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Erro: defina GOOGLE_APPLICATION_CREDENTIALS apontando para serviceAccountKey.json');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

async function main() {
  const byFolder = fs.existsSync(BY_FOLDER_FILE)
    ? JSON.parse(fs.readFileSync(BY_FOLDER_FILE, 'utf-8'))
    : {};
  const mapping = fs.existsSync(MAPPING_FILE)
    ? JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'))
    : {};

  const snapshot = await db.collection('produtos').get();
  console.log(`Produtos no Firestore: ${snapshot.size}`);

  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const pasta = data.cloudinaryPasta || data.cloudinary_pasta;

    if (pasta && byFolder[pasta] && byFolder[pasta].length > 0) {
      const urls = byFolder[pasta];
      await db.collection('produtos').doc(doc.id).update({
        imagem: urls[0],
        imagens: urls,
      });
      updated++;
      console.log(`${doc.id} (pasta "${pasta}"): imagem + ${urls.length} em imagens`);
    } else {
      let imagemAtual = data.imagem || data.imagemPath || '';
      const filename = imagemAtual.split('/').pop();
      const possibleKeys = [
        imagemAtual,
        `assets/produtos/img/${filename}`,
        `assets/produtos/${filename}`,
        `produtos/${filename}`,
        `img/${filename}`,
        filename,
      ];
      let newUrl = null;
      for (const k of possibleKeys) {
        if (mapping[k]) { newUrl = mapping[k]; break; }
      }
      if (newUrl) {
        await db.collection('produtos').doc(doc.id).update({ imagem: newUrl });
        updated++;
        console.log(`${doc.id} -> imagem atualizada`);
      }
    }
  }

  console.log(`Concluído. ${updated} documentos atualizados.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
