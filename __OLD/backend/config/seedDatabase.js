const User = require('../models/User');
const Categoria = require('../models/Categoria');
const Instituicao = require('../models/Instituicao');
const Edital = require('../models/Edital');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    await seedAdminUser();
    await seedCategorias();
    await seedInstituicoes();
    await seedEditalPersonalizado();

    console.log('✅ Seed do banco de dados concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed do banco:', error);
  }
};

const seedAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const adminUser = new User({
        nome: 'Administrador',
        sobrenome: 'Sistema',
        email: 'admin@radegondes.com',
        password: 'admin123',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('👤 Usuário administrador criado: admin@radegondes.com / admin123');
    } else {
      console.log('👤 Usuário administrador já existe');
    }
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
  }
};

const seedCategorias = async () => {
  try {
    await Categoria.deleteMany({});
    
    const categorias = [
      { nome: 'Português', cor: '#FF6B6B' },
      { nome: 'Matemática', cor: '#4ECDC4' },
      { nome: 'Raciocínio Lógico', cor: '#45B7D1' },
      { nome: 'Informática', cor: '#96CEB4' },
      { nome: 'Direito Constitucional', cor: '#FFEAA7' },
      { nome: 'Direito Administrativo', cor: '#DDA0DD' },
      { nome: 'Conhecimentos Gerais', cor: '#98D8C8' },
      { nome: 'Atualidades', cor: '#F7DC6F' }
    ];
    
    await Categoria.insertMany(categorias);
    console.log(`📚 ${categorias.length} categorias criadas`);
  } catch (error) {
    console.error('Erro ao criar categorias:', error);
  }
};

const seedInstituicoes = async () => {
  try {
    await Instituicao.deleteMany({});
    const primeiraCategoria = await Categoria.findOne();
    
    if (primeiraCategoria) {
      const instituicoes = [
        {
          nome: 'CESPE/CEBRASPE',
          sigla: 'CESPE',
          tipo: 'Concurso Público',
          estado: 'DF',
          cidade: 'Brasília',
          categoria: primeiraCategoria._id
        },
        {
          nome: 'Fundação Carlos Chagas',
          sigla: 'FCC',
          tipo: 'Concurso Público',
          estado: 'SP',
          cidade: 'São Paulo',
          categoria: primeiraCategoria._id
        },
        {
          nome: 'Fundação Getúlio Vargas',
          sigla: 'FGV',
          tipo: 'Concurso Público',
          estado: 'RJ',
          cidade: 'Rio de Janeiro',
          categoria: primeiraCategoria._id
        },
        {
          nome: 'VUNESP',
          sigla: 'VUNESP',
          tipo: 'Concurso Público',
          estado: 'SP',
          cidade: 'São Paulo',
          categoria: primeiraCategoria._id
        },
        {
          nome: 'IBFC',
          sigla: 'IBFC',
          tipo: 'Concurso Público',
          estado: 'RJ',
          cidade: 'Rio de Janeiro',
          categoria: primeiraCategoria._id
        },
        {
          nome: 'Tribunal de Justiça',
          sigla: 'TJ',
          tipo: 'Concurso Público',
          estado: 'SP',
          cidade: 'São Paulo',
          categoria: primeiraCategoria._id
        },
        {
          nome: 'Tribunal Regional Federal',
          sigla: 'TRF',
          tipo: 'Concurso Público',
          estado: 'SP',
          cidade: 'São Paulo',
          categoria: primeiraCategoria._id
        },
        {
          nome: 'Ministério Público',
          sigla: 'MP',
          tipo: 'Concurso Público',
          estado: 'SP',
          cidade: 'São Paulo',
          categoria: primeiraCategoria._id
        },
        {
          nome: 'Polícia Civil',
          sigla: 'PC',
          tipo: 'Concurso Público',
          estado: 'SP',
          cidade: 'São Paulo',
          categoria: primeiraCategoria._id
        },
        {
          nome: 'Polícia Militar',
          sigla: 'PM',
          tipo: 'Concurso Militar',
          estado: 'SP',
          cidade: 'São Paulo',
          categoria: primeiraCategoria._id
        }
      ];
      
      await Instituicao.insertMany(instituicoes);
      console.log(`🏛️ ${instituicoes.length} instituições criadas`);
    } else {
      console.log('⚠️ Não foi possível criar instituições: nenhuma categoria encontrada');
    }
  } catch (error) {
    console.error('Erro ao criar instituições:', error);
  }
};

const seedEditalPersonalizado = async () => {
  try {
    const editalExists = await Edital.findOne({ nome: 'EditalPersonalizado' });
    
    if (!editalExists) {
      const editalPersonalizado = new Edital({
        nome: 'EditalPersonalizado'
      });
      
      await editalPersonalizado.save();
      console.log('📝 EditalPersonalizado criado com sucesso');
    } else {
      console.log('📝 EditalPersonalizado já existe no banco');
    }
  } catch (error) {
    console.error('Erro ao criar EditalPersonalizado:', error);
  }
};

module.exports = seedDatabase;