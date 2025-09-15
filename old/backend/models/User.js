const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
  },
  sobrenome: {
    type: String,
    required: false,
    trim: true,
  },
  dataAniversario: {
    type: Date,
    required: false,
  },
  genero: {
    type: String,
    required: false,
    enum: ['masculino', 'feminino', 'outro'],
  },
  cidade: {
    type: String,
    required: false,
    trim: true,
  },
  estado: {
    type: String,
    required: false,
    enum: [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
      'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
      'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  avatar: {
    type: String,
    required: false,
    default: null,
  },
  // Campos de preferências
  diasEstudo: {
    type: [String],
    default: []
  },
  periodosDisponiveis: {
    type: [String],
    default: ['1', '7', '30', '60', '120']
  },
  primeiroDiaSemana: {
    type: String,
    enum: ['domingo', 'segunda'],
    default: 'domingo'
  },
  audioAlerta: {
    type: String,
    default: 'alerta1.wav'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);