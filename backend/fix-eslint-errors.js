#!/usr/bin/env node

/**
 * سكريبت لإصلاح أخطاء ESLint المتبقية
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixes = [
  // Fix unused 'next' parameters
  {
    file: 'src/controllers/superAdminController.js',
    replacements: [
      { from: 'async (req, res, next) =>', to: 'async (req, res) =>' },
    ],
  },
  // Fix unused imports
  {
    file: 'src/middleware/errorHandler.js',
    replacements: [
      { from: "import { successResponse, errorResponse } from '../utils/helpers.js';", to: "import { successResponse } from '../utils/helpers.js';" },
    ],
  },
  // Fix console.log in models/index.js
  {
    file: 'src/models/index.js',
    replacements: [
      { from: "console.log('⚠️ WhatsAppMessage table already exists or has conflicts, continuing...');", to: "// Table already exists" },
      { from: "console.log('⚠️ WhatsAppContact table already exists or has conflicts, continuing...');", to: "// Table already exists" },
      { from: "console.log('✅ Models initialized successfully');", to: "logger.info('✅ Models initialized successfully');" },
      { from: "console.log('✅ Model associations set up successfully');", to: "logger.info('✅ Model associations set up successfully');" },
    ],
  },
  // Fix unused variables
  {
    file: 'src/middleware/upload.js',
    replacements: [
      { from: "import path from 'path';", to: "// import path from 'path';" },
    ],
  },
  {
    file: 'src/models/WhatsAppMessage.js',
    replacements: [
      { from: "import { DataTypes, Op } from 'sequelize';", to: "import { DataTypes } from 'sequelize';" },
    ],
  },
  {
    file: 'src/models/WhatsAppSession.js',
    replacements: [
      { from: "import { DataTypes, getSequelize } from 'sequelize';", to: "import { DataTypes } from 'sequelize';" },
    ],
  },
];

console.log('🔧 Starting ESLint fixes...\n');

fixes.forEach(({ file, replacements }) => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.replace(from, to);
      modified = true;
      console.log(`✅ Fixed in ${file}`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('\n✅ ESLint fixes completed!');

