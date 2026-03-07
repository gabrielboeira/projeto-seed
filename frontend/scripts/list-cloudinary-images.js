#!/usr/bin/env node
/*
Lista imagens em home/seed/ no Cloudinary.
Estrutura esperada: home/seed/<pasta-produto>/foto1.jpg, foto2.jpg, ...

Gera:
  - cloudinary-mapping.json: mapeamento nome/caminho -> URL (para compatibilidade)
  - cloudinary-by-folder.json: { "nome-pasta": [url1, url2, ...], ... } para vários produtos com várias fotos

Requisitos: npm install cloudinary dotenv
Uso: node scripts/list-cloudinary-images.js (com .env configurado)
*/
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

require('dotenv').config();

const CLOUDINARY_FOLDER = 'home/seed';
const OUT_MAPPING = path.join(__dirname, '..', 'cloudinary-mapping.json');
const OUT_BY_FOLDER = path.join(__dirname, '..', 'cloudinary-by-folder.json');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Erro: configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET no .env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  console.log(`Listando imagens em ${CLOUDINARY_FOLDER}/...`);

  const res = await cloudinary.api.resources({
    type: 'upload',
    prefix: CLOUDINARY_FOLDER,
    max_results: 500,
  });

  const resources = res.resources || [];
  const mapping = {};
  const byFolder = {};

  for (const r of resources) {
    const publicId = r.public_id;
    const secureUrl = r.secure_url;
    const parts = publicId.split('/');
    const filename = parts.pop();

    mapping[filename] = secureUrl;
    mapping[`img/${filename}`] = secureUrl;
    mapping[`assets/produtos/img/${filename}`] = secureUrl;
    mapping[`produtos/${filename}`] = secureUrl;

    const folderName = parts[parts.length - 1];
    if (folderName && folderName !== 'seed') {
      if (!byFolder[folderName]) byFolder[folderName] = [];
      byFolder[folderName].push(secureUrl);
    }
  }

  for (const folder of Object.keys(byFolder)) {
    byFolder[folder].sort();
  }

  fs.writeFileSync(OUT_MAPPING, JSON.stringify(mapping, null, 2), 'utf-8');
  fs.writeFileSync(OUT_BY_FOLDER, JSON.stringify(byFolder, null, 2), 'utf-8');

  console.log(`${resources.length} imagens encontradas.`);
  console.log(`  ${OUT_MAPPING}`);
  console.log(`  ${OUT_BY_FOLDER} (${Object.keys(byFolder).length} pastas)`);
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
