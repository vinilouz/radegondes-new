require('dotenv').config();
const mongoose = require('mongoose');
const Categoria = require('../models/Categoria');
const Instituicao = require('../models/Instituicao');
const seedDatabase = require('../config/seedDatabase');

async function resetAndSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado ao MongoDB');
    
    // Limpar dados existentes
    await Categoria.deleteMany({});
    await Instituicao.deleteMany({});
    console.log('Dados limpos');
    
    // Executar seed novamente
    await seedDatabase();
    console.log('Seed executado com sucesso');
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

resetAndSeed();