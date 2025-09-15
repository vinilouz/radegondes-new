const mongoose = require('mongoose');

const PlanoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  descricao: {
    type: String,
    default: 'Sem informações extras',
    trim: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Snapshot dos editais no momento da criação (dados imutáveis)
  editais: [{
    nome: String,
    instituicao: {
      nome: String,
      sigla: String,
      _id: mongoose.Schema.Types.ObjectId
    },
    disciplinas: [{
      nome: String,
      cor: {
        type: String,
        enum: ['azul', 'verde', 'vermelho', 'amarelo', 'roxo', 'laranja', 'rosa', 'cinza'],
        default: 'azul'
      },
      topicos: [String]
    }]
  }],
  // Campos de estatísticas calculadas no momento da criação
  totalDisciplinas: {
    type: Number,
    default: 0
  },
  totalTopicos: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['ativo', 'pausado', 'concluido'],
    default: 'ativo'
  },
  // Campos para futuras funcionalidades
  horasEstudo: {
    type: Number,
    default: 0
  },
  questoesResolvidas: {
    type: Number,
    default: 0
  },
  // Campo para ordenação personalizada
  posicao: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Plano', PlanoSchema);
