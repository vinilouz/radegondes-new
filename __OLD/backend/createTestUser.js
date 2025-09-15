require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado ao MongoDB');

    // Verificar se já existe um usuário teste
    const existingUser = await User.findOne({ email: 'teste@teste.com' });
    if (existingUser) {
      console.log('Usuário teste já existe:', existingUser.email);
      return;
    }

    // Criar usuário teste
    const testUser = new User({
      nome: 'Usuário Teste',
      email: 'teste@teste.com',
      password: '123456',
      role: 'user'
    });

    await testUser.save();
    console.log('Usuário teste criado:', testUser.email);

    // Verificar se existe admin
    const adminUser = await User.findOne({ email: 'admin@radegondes.com' });
    if (!adminUser) {
      const admin = new User({
        nome: 'Administrador',
        email: 'admin@radegondes.com',
        password: 'admin123',
        role: 'admin'
      });
      await admin.save();
      console.log('Usuário admin criado:', admin.email);
    } else {
      console.log('Admin já existe:', adminUser.email);
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestUser();
