#!/usr/bin/env node
/*
Upload de imagens da pasta assets/produtos para Cloudinary e geração de mapping JSON.

Requisitos:
  npm install cloudinary dotenv

Variáveis de ambiente:
  CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET

Uso:
  CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... node scripts/upload-cloudinary.js
*/
const fs = require('fs');
const path = require('path');
const util = require('util');
const cloudinary = require('cloudinary').v2;

require('dotenv').config();

const PRODUTOS_DIR = path.join(__dirname, '..', 'assets', 'produtos');
const OUT_FILE = path.join(__dirname, '..', 'cloudinary-mapping.json');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Erro: configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET no ambiente.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadFile(filePath, publicId) {
  return cloudinary.uploader.upload(filePath, { folder: 'produtos', public_id: publicId, overwrite: true });
}

async function main() {
  const files = fs.readdirSync(PRODUTOS_DIR).filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f));
  if (files.length === 0) {
    console.log('Nenhuma imagem encontrada em', PRODUTOS_DIR);
    return;
  }

  const mapping = {};

  for (const filename of files) {
    try {
      const localPath = path.join('assets', 'produtos', filename); // caminho usado no projeto
      const fullPath = path.join(PRODUTOS_DIR, filename);
      const publicId = path.parse(filename).name;
      console.log(`Enviando ${filename}...`);
      const res = await uploadFile(fullPath, publicId);
      mapping[localPath] = res.secure_url;
      console.log('OK ->', res.secure_url);
    } catch (err) {
      console.error('Erro ao enviar', filename, err.message || err);
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(mapping, null, 2), 'utf-8');
  console.log('Mapping salvo em', OUT_FILE);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});






