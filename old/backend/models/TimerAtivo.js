const mongoose = require('mongoose');

const TimerAtivoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plano: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plano',
    required: true,
    index: true
  },
  disciplinaId: {
    type: String,
    required: true,
    index: true
  },
  topico: {
    type: String,
    required: true,
    index: true
  },
  indice: {
    type: Number,
    default: 0
  },
  tempo: {
    type: Number, // tempo em segundos
    required: true,
    default: 0
  },
  ativo: {
    type: Boolean,
    default: false,
    index: true
  },
  disciplinaNome: {
    type: String,
    required: false
  },
  ultimoSalvamento: {
    type: Date,
    default: Date.now
  },
  sessaoId: {
    type: String,
    required: false,
    index: true
  },
  dataInicio: {
    type: Date,
    default: Date.now
  },
  dataUltimaAtualizacao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  // Índice composto para buscas eficientes
  indexes: [
    { usuario: 1, plano: 1, disciplinaId: 1, topico: 1 },
    { usuario: 1, ativo: 1 }
  ]
});

// Método para atualizar tempo
TimerAtivoSchema.methods.atualizarTempo = function(novoTempo) {
  this.tempo = novoTempo;
  this.dataUltimaAtualizacao = new Date();
  return this.save();
};

// Método para pausar/retomar timer
TimerAtivoSchema.methods.toggleAtivo = function() {
  this.ativo = !this.ativo;
  this.dataUltimaAtualizacao = new Date();
  return this.save();
};

// Método estático para buscar timers ativos de um usuário
TimerAtivoSchema.statics.buscarTimersAtivos = function(usuarioId) {
  return this.find({ usuario: usuarioId, ativo: true });
};

// Método estático para buscar timer específico
TimerAtivoSchema.statics.buscarTimer = function(usuarioId, planoId, disciplinaId, topico, indice = 0) {
  return this.findOne({
    usuario: usuarioId,
    plano: planoId,
    disciplinaId: disciplinaId,
    topico: topico,
    indice: indice
  });
};

module.exports = mongoose.model('TimerAtivo', TimerAtivoSchema);