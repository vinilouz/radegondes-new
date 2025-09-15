const mongoose = require('mongoose');
const Edital = require('../models/Edital');
require('dotenv').config();

const createEditalPersonalizado = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingEdital = await Edital.findOne({ nome: 'EditalPersonalizado' });
    
    if (!existingEdital) {
      await Edital.create({
        nome: 'EditalPersonalizado'
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Erro ao criar EditalPersonalizado:', error);
    process.exit(1);
  }
};

createEditalPersonalizado();
