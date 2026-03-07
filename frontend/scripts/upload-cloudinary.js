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

const CLOUDINARY_FOLDER = 'home/seed';

function findImages(dir, base = '') {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const rel = path.join(base, e.name);
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...findImages(full, rel));
    } else if (/\.(jpe?g|png|webp|gif)$/i.test(e.name)) {
      results.push({ rel, full });
    }
  }
  return results;
}

async function main() {
  const files = findImages(PRODUTOS_DIR);
  if (files.length === 0) {
    console.log('Nenhuma imagem encontrada em', PRODUTOS_DIR);
    return;
  }

  const mapping = {};

  for (const { rel, full } of files) {
    const localPath = path.join('assets', 'produtos', rel).replace(/\\/g, '/');
    const publicId = 'produtos/' + rel.replace(/\\/g, '/').replace(/\.[^.]+$/, '');
    try {
      console.log(`Enviando ${localPath}...`);
      const res = await cloudinary.uploader.upload(full, { folder: CLOUDINARY_FOLDER, overwrite: true });
      mapping[localPath] = res.secure_url;
      mapping[rel] = res.secure_url;
      mapping[path.basename(rel)] = res.secure_url;
      console.log('OK ->', res.secure_url);
    } catch (err) {
      console.error('Erro ao enviar', localPath, err.message || err);
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(mapping, null, 2), 'utf-8');
  console.log('Mapping salvo em', OUT_FILE);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});






