const mongoose = require('mongoose');
require('dotenv').config();

// Importar o modelo
const Disciplina = require('../models/Disciplina');

async function updateDisciplinas() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado ao MongoDB');

    // Buscar todas as disciplinas que não têm o campo cor
    const disciplinasSemCor = await Disciplina.find({ cor: { $exists: false } });
    console.log(`Encontradas ${disciplinasSemCor.length} disciplinas sem cor`);

    // Cores disponíveis
    const coresDisponiveis = ['azul', 'verde', 'vermelho', 'amarelo', 'roxo', 'laranja', 'rosa', 'cinza'];

    // Atualizar cada disciplina
    for (let i = 0; i < disciplinasSemCor.length; i++) {
      const cor = coresDisponiveis[i % coresDisponiveis.length];
      await Disciplina.findByIdAndUpdate(disciplinasSemCor[i]._id, { cor });
      console.log(`Disciplina "${disciplinasSemCor[i].nome}" atualizada com cor: ${cor}`);
    }

    // Também atualizar disciplinas que podem ter cor undefined ou null
    await Disciplina.updateMany(
      { $or: [{ cor: null }, { cor: undefined }, { cor: '' }] },
      { $set: { cor: 'azul' } }
    );

    console.log('Atualização concluída!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao atualizar disciplinas:', error);
    process.exit(1);
  }
}

updateDisciplinas();
