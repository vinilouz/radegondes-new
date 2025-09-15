const mongoose = require('mongoose');

const RegistroEstudoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plano: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plano',
    required: true
  },
  disciplinaId: {
    type: String,
    required: true
  },
  disciplinaNome: {
    type: String,
    required: true
  },
  sessaoId: {
    type: String,
    required: false,
    trim: true,
    index: true // Para busca rápida
  },
  topico: {
    type: String,
    trim: true,
    required: false
  },
  indice: {
    type: Number,
    default: 0
  },
  tempoEstudo: {
    type: Number, // tempo em segundos
    required: true,
    default: 0
  },
  observacoes: {
    type: String,
    trim: true,
    required: false
  },
  links: [{
    titulo: String,
    url: String
  }],
  questoesPlanejadas: {
    type: Number,
    default: 0
  },
  questoesRealizadas: {
    type: Number,
    default: 0
  },
  tipoAtividade: {
    type: String,
    enum: ['estudo', 'revisao', 'simulado'],
    default: 'estudo'
  },
  material: {
    type: String,
    trim: true,
    required: false
  },
  estudoFinalizado: {
    type: Boolean,
    default: false
  },
  marcarComoEstudado: {
    type: Boolean,
    default: false
  },
  dataOpcao: {
    type: String,
    enum: ['hoje', 'estudando', 'ja-estudei', 'agendar'],
    default: 'estudando'
  },
  dataAgendada: {
    type: String,
    required: false
  },
  horarioAgendado: {
    type: String,
    required: false
  },
  data: {
    type: Date,
    default: Date.now
  },
  iniciadaEm: {
    type: Date,
    required: false
  },
  finalizadaEm: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RegistroEstudo', RegistroEstudoSchema);
