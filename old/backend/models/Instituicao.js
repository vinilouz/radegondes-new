const mongoose = require('mongoose');

const InstituicaoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
  },
  sigla: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  logotipo: {
    type: String,
    trim: true,
  },
  estado: {
    type: String,
    required: true,
    trim: true,
  },
  cidade: {
    type: String,
    required: true,
    trim: true,
  },
  tipo: {
    type: String,
    required: true,
    enum: ['Concurso Público', 'Enem', 'Vestibular', 'Residência Médica', 'OAB', 'Concurso Militar', 'Outros'],
    default: 'Concurso Público'
  },
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true
  },
  cargos: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Instituicao', InstituicaoSchema);
