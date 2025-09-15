const mongoose = require('mongoose');

const DisciplinaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
  },
  cor: {
    type: String,
    required: true,
    enum: ['azul', 'verde', 'vermelho', 'amarelo', 'roxo', 'laranja', 'rosa', 'cinza'],
    default: 'azul'
  },
  topicos: [{
    type: String,
    trim: true,
  }],
  instituicao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instituicao',
    required: false
  },
  edital: {
    type: String,
    required: true,
    trim: true,
  },
  // Estatísticas de estudo
  tempoTotalEstudo: {
    type: Number, // tempo em segundos
    default: 0
  },
  topicosEstudados: {
    type: Number,
    default: 0
  },
  questoesResolvidas: {
    type: Number,
    default: 0
  },
  topicosTotal: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Middleware para calcular topicosTotal quando topicos é modificado
DisciplinaSchema.pre('save', function(next) {
  if (this.isModified('topicos')) {
    this.topicosTotal = this.topicos.length;
  }
  next();
});

module.exports = mongoose.model('Disciplina', DisciplinaSchema);
