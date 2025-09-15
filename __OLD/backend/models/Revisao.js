const mongoose = require('mongoose');

const RevisaoSchema = new mongoose.Schema({
  topico: {
    type: String,
    required: true,
    trim: true
  },
  disciplinaId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  disciplinaNome: {
    type: String,
    required: true,
    trim: true
  },
  planoId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Plano'
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dataInicio: {
    type: Date,
    required: true,
    default: Date.now
  },
  cor: {
    type: String,
    enum: ['azul', 'verde', 'vermelho', 'amarelo', 'roxo', 'laranja', 'rosa', 'cinza'],
    default: 'azul'
  },
  ativo: {
    type: Boolean,
    default: true
  },
  dataFinalizacao: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices para melhor performance
RevisaoSchema.index({ usuario: 1, ativo: 1 });
RevisaoSchema.index({ planoId: 1, disciplinaId: 1, topico: 1 });

module.exports = mongoose.model('Revisao', RevisaoSchema);
