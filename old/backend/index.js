require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');
const Categoria = require('./models/Categoria');
const Disciplina = require('./models/Disciplina');
const Edital = require('./models/Edital');
const Instituicao = require('./models/Instituicao');
const Plano = require('./models/Plano');
const RegistroEstudo = require('./models/RegistroEstudo');
const Revisao = require('./models/Revisao');
const TimerAtivo = require('./models/TimerAtivo');
const jwt = require('jsonwebtoken');
const { protect, isAdmin } = require('./middleware/authMiddleware');
const seedDatabase = require('./config/seedDatabase');


const app = express();
const port = process.env.PORT || 5000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (req.route && req.route.path && req.route.path.includes('avatar')) {
      uploadPath = './uploads/avatars';
    } else {
      uploadPath = './uploads/logotipos';
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let prefix;
    if (req.route && req.route.path && req.route.path.includes('avatar')) {
      prefix = 'avatar-';
    } else {
      prefix = 'logo-';
    }
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Conectado ao MongoDB Atlas!');
    await seedDatabase();
  })
  .catch(err => console.error('Erro ao conectar ao MongoDB Atlas:', err));

app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.BACKEND_URL].filter(Boolean) 
    : true,
  credentials: true
}));
app.use('/uploads', express.static('uploads'));


const generateToken = (id, email, role, nome) => {
  return jwt.sign({ id, email, role, nome }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

app.get('/', (req, res) => {
  res.send('Bem-vindo ao Backend do Projeto Radegondes!');
});

// Endpoint de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!', timestamp: new Date().toISOString() });
});

app.post('/api/register', async (req, res) => {
  console.log('=== ENDPOINT REGISTER INICIADO ===');
  console.log('📦 Dados recebidos no body:', JSON.stringify(req.body, null, 2));
  
  const { 
    nome, 
    sobrenome, 
    email, 
    password, 
    dataAniversario, 
    genero, 
    estado, 
    cidade 
  } = req.body;

  try {
    // Validação básica - apenas campos obrigatórios
    if (!nome || !email || !password) {
      console.log('❌ Validação falhou - campos obrigatórios ausentes');
      console.log('nome:', nome);
      console.log('email:', email);
      console.log('password:', password ? '[SENHA PRESENTE]' : '[SENHA AUSENTE]');
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    }

    console.log('✅ Validação básica passou');
    console.log('🔍 Verificando se usuário já existe...');
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ Usuário já existe com este email');
      return res.status(400).json({ message: 'Email já cadastrado.' });
    }

    console.log('✅ Email disponível, criando usuário...');
    
    // Criar objeto com todos os dados do usuário
    const userData = { 
      nome, 
      email, 
      password 
    };

    // Adicionar campos opcionais apenas se fornecidos
    if (sobrenome) userData.sobrenome = sobrenome;
    if (dataAniversario) userData.dataAniversario = dataAniversario;
    if (genero) userData.genero = genero;
    if (estado) userData.estado = estado;
    if (cidade) userData.cidade = cidade;

    console.log('📋 Dados do usuário para criação:', { ...userData, password: '[OCULTA]' });
    
    const user = await User.create(userData);

    console.log('✅ Usuário criado com sucesso:', user.email);
    
    const token = generateToken(user._id, user.email, user.role, user.nome);

    console.log('✅ Token gerado, enviando resposta...');

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      user: user.email,
      token,
    });

  } catch (error) {
    console.error('❌ ERRO ao registrar usuário:', error);
    console.error('Stack trace completo:', error.stack);
    res.status(500).json({ message: 'Erro no servidor ao tentar cadastrar usuário.' });
  }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        console.log('🔍 DEBUG Login - Usuário encontrado:', user ? user.email : 'não encontrado');
        console.log('🔍 DEBUG Login - Role do usuário:', user ? user.role : 'N/A');

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Atualizar o último login
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id, user.email, user.role, user.nome);
        console.log('🔍 DEBUG Login - Token gerado:', token);

        res.json({
          message: 'Login bem-sucedido!',
          user: user.email,
          token,
        });

    } catch (error) {
        console.error('Erro ao logar usuário:', error);
        res.status(500).json({ message: 'Erro no servidor ao tentar logar usuário.' });
    }
});

app.get('/api/dashboard-data', protect, async (req, res) => {
  res.json({
    message: `Bem-vindo ao Dashboard, ${req.user.email}!`,
    data: 'Aqui estão os dados secretos do dashboard.',
    userId: req.user._id,
  });
});

app.get('/api/users/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.put('/api/users/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    const { nome, sobrenome, email, dataAniversario, genero, cidade, estado } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { nome, sobrenome, email, dataAniversario, genero, cidade, estado },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.put('/api/users/:id/preferencias', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔧 Debug - Dados de autorização:', {
      idParam: id,
      userIdFromToken: req.user._id.toString(),
      userIdFromTokenOriginal: req.user._id,
      saoIguais: req.user._id.toString() === id,
      tipoId: typeof id,
      tipoUserId: typeof req.user._id
    });
    
    console.log('Atualizando preferências para usuário:', id);
    console.log('Dados recebidos:', req.body);
    
    // Verificar se o usuário está tentando editar suas próprias preferências
    if (req.user._id.toString() !== id) {
      console.log('❌ ACESSO NEGADO - IDs não coincidem');
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    const { diasEstudo, periodosDisponiveis, primeiroDiaSemana, audioAlerta } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { diasEstudo, periodosDisponiveis, primeiroDiaSemana, audioAlerta },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    console.log('Preferências atualizadas com sucesso para:', user.nome);
    res.json({ message: 'Preferências atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.put('/api/users/:id/senha', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário está tentando alterar sua própria senha
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    const { senhaAtual, novaSenha } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Verificar senha atual
    const isMatch = await user.matchPassword(senhaAtual);
    if (!isMatch) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }
    
    // Atualizar senha
    user.password = novaSenha;
    await user.save();
    
    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/admin/users', protect, isAdmin, async (req, res) => {
  try {
    console.log('Buscando usuários...');
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    console.log(`Encontrados ${users.length} usuários`);
    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar usuários.', error: error.message });
  }
});

app.post('/api/admin/users', protect, isAdmin, async (req, res) => {
  try {
    const { nome, sobrenome, dataAniversario, genero, cidade, estado, email, password, role } = req.body;
    const user = await User.create({
      nome,
      sobrenome,
      dataAniversario,
      genero,
      cidade,
      estado,
      email,
      password,
      role: role || 'user'
    });
    const userResponse = await User.findById(user._id).select('-password');
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro no servidor ao criar usuário.' });
  }
});

app.put('/api/admin/users/:id', protect, isAdmin, async (req, res) => {
  try {
    const { nome, sobrenome, dataAniversario, genero, cidade, estado, email, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { nome, sobrenome, dataAniversario, genero, cidade, estado, email, role },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro no servidor ao atualizar usuário.' });
  }
});

app.delete('/api/admin/users/:id', protect, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro no servidor ao excluir usuário.' });
  }
});

// Endpoints públicos para usuários normais
app.get('/api/categorias', protect, async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ nome: 1 });
    res.json(categorias);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar categorias.' });
  }
});

app.get('/api/instituicoes', protect, async (req, res) => {
  try {
    const instituicoes = await Instituicao.find().populate('categoria', 'nome').sort({ nome: 1 });
    
    // Filtrar apenas editais que possuem disciplinas
    const instituicoesFiltradas = await Promise.all(
      instituicoes.map(async (instituicao) => {
        if (!instituicao.cargos || instituicao.cargos.length === 0) {
          return null; // Instituição sem cargos
        }
        
        // Verificar quais cargos (editais) têm disciplinas
        const cargosComDisciplinas = [];
        for (const cargo of instituicao.cargos) {
          const disciplinasCount = await Disciplina.countDocuments({ edital: cargo });
          if (disciplinasCount > 0) {
            cargosComDisciplinas.push(cargo);
          }
        }
        
        // Se não há cargos com disciplinas, não incluir a instituição
        if (cargosComDisciplinas.length === 0) {
          return null;
        }
        
        // Retornar instituição apenas com cargos que têm disciplinas
        return {
          ...instituicao.toObject(),
          cargos: cargosComDisciplinas
        };
      })
    );
    
    // Filtrar valores null
    const resultado = instituicoesFiltradas.filter(inst => inst !== null);
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar instituições:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar instituições.' });
  }
});

// Rotas de Planos
app.get('/api/planos', protect, async (req, res) => {
  try {
    const planos = await Plano.find({ usuario: req.user._id }).sort({ posicao: 1, createdAt: -1 });
    
    // Para cada plano, calcular estatísticas detalhadas
    const planosComEstatisticas = await Promise.all(planos.map(async (plano) => {
      // Buscar todos os registros de estudo deste plano
      const todosRegistrosEstudo = await RegistroEstudo.find({
        usuario: req.user._id,
        plano: plano._id
      });
      
      // Calcular questões totais (soma da última atividade de cada disciplina)
      const questoesPorDisciplina = {};
      todosRegistrosEstudo.forEach(registro => {
        const disciplinaId = registro.disciplinaId.toString();
        if (!questoesPorDisciplina[disciplinaId] || 
            new Date(registro.dataEstudo) > new Date(questoesPorDisciplina[disciplinaId].dataEstudo)) {
          questoesPorDisciplina[disciplinaId] = registro;
        }
      });
      
      const questoesTotais = Object.values(questoesPorDisciplina)
        .reduce((total, registro) => total + (registro.questoesRealizadas || 0), 0);
      
      // Calcular status do estudo (baseado nas disciplinas)
      let statusEstudo = 'pendente';
      let totalDisciplinas = 0;
      let disciplinasCompletas = 0;
      
      if (plano.editais && plano.editais.length > 0) {
        for (const edital of plano.editais) {
          for (const disc of edital.disciplinas) {
            totalDisciplinas++;
            
            // Verificar se tem registros de estudo finalizados para esta disciplina
            const registrosFinalizados = todosRegistrosEstudo.filter(r => 
              r.disciplinaId.toString() === disc._id.toString() && 
              r.estudoFinalizado === true
            );
            
            // Contar tópicos únicos estudados
            const topicosEstudados = new Set(
              registrosFinalizados
                .map(r => r.topico)
                .filter(topico => topico && topico.trim() !== '')
            ).size;
            
            // Considerar completa se estudou todos os tópicos
            if (topicosEstudados >= disc.topicos.length && disc.topicos.length > 0) {
              disciplinasCompletas++;
            }
          }
        }
        
        if (disciplinasCompletas === totalDisciplinas && totalDisciplinas > 0) {
          statusEstudo = 'concluido';
        } else if (disciplinasCompletas > 0) {
          statusEstudo = 'em_progresso';
        }
      } else if (questoesTotais > 0) {
        // Para planos personalizados, considerar em progresso se há questões resolvidas
        statusEstudo = 'em_progresso';
      }
      
      // Calcular disciplinas e tópicos totais dinamicamente a partir dos editais
      let disciplinasTotal = 0;
      let topicosTotal = 0;
      if (plano.editais && plano.editais.length > 0) {
        console.log(`🔍 Plano ${plano.nome} - Calculando disciplinas e tópicos:`);
        for (const edital of plano.editais) {
          if (edital.disciplinas) {
            disciplinasTotal += edital.disciplinas.length;
            console.log(`  📚 Edital: ${edital.nome} - ${edital.disciplinas.length} disciplinas`);
            for (const disciplina of edital.disciplinas) {
              const topicosDisciplina = disciplina.topicos ? disciplina.topicos.length : 0;
              topicosTotal += topicosDisciplina;
              console.log(`    📖 ${disciplina.nome}: ${topicosDisciplina} tópicos`);
            }
          }
        }
        console.log(`  🎯 Total final: ${disciplinasTotal} disciplinas, ${topicosTotal} tópicos`);
      }
      
      return {
        ...plano.toObject(),
        disciplinas: disciplinasTotal, // Usar valor calculado dinamicamente
        topicos: topicosTotal, // Usar valor calculado dinamicamente
        questoesTotais: questoesTotais,
        statusEstudo: statusEstudo
      };
    }));
    
    res.json(planosComEstatisticas);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar planos.' });
  }
});

// Rota para reordenar planos
app.put('/api/planos/reorder', protect, async (req, res) => {
  try {
    console.log('=== REORDER PLANOS ===');
    console.log('Usuario:', req.user._id);
    console.log('Body recebido:', JSON.stringify(req.body, null, 2));
    
    const { planos } = req.body;
    
    if (!planos || !Array.isArray(planos)) {
      console.log('Erro: Lista de planos inválida');
      return res.status(400).json({ message: 'Lista de planos é obrigatória.' });
    }
    
    console.log('Processando', planos.length, 'planos para reordenação');
    
    // Atualizar a posição de cada plano
    const updatePromises = planos.map(async (planoInfo) => {
      console.log(`Atualizando plano ${planoInfo.id} para posição ${planoInfo.posicao}`);
      const resultado = await Plano.findOneAndUpdate(
        { _id: planoInfo.id, usuario: req.user._id },
        { posicao: planoInfo.posicao },
        { new: true }
      );
      console.log('Resultado da atualização:', resultado ? 'sucesso' : 'não encontrado');
      return resultado;
    });
    
    const resultados = await Promise.all(updatePromises);
    console.log('Atualizações concluídas:', resultados.filter(r => r).length, 'de', planos.length);
    
    res.json({ message: 'Ordem dos planos atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao reordenar planos:', error);
    res.status(500).json({ message: 'Erro no servidor ao reordenar planos.' });
  }
});

app.post('/api/planos', protect, async (req, res) => {
  try {
    console.log('=== CRIANDO PLANO ===');
    console.log('Usuario:', req.user._id);
    console.log('Body recebido:', JSON.stringify(req.body, null, 2));
    
    const { nome, cargos, descricao } = req.body;
    
    // Verificar se é um plano personalizado (nome específico e sem cargos)
    const isPlanoPersonalizado = (nome === 'Plano Personalizado' || nome === 'Estudo Personalizado') && (!cargos || cargos.length === 0);
    
    if (!nome || (!isPlanoPersonalizado && (!cargos || cargos.length === 0))) {
      console.log('Erro: dados obrigatórios ausentes');
      return res.status(400).json({ message: 'Nome e cargos são obrigatórios.' });
    }

    console.log('Criando plano com:', { nome, descricao, usuario: req.user._id, cargos: cargos?.length || 0, personalizado: isPlanoPersonalizado });
    
    // Para planos personalizados, criar um plano vinculado ao EditalPersonalizado
    if (isPlanoPersonalizado) {
      // Buscar o EditalPersonalizado no banco
      const editalPersonalizado = await Edital.findOne({ nome: 'EditalPersonalizado' });
      
      if (!editalPersonalizado) {
        console.log('Erro: EditalPersonalizado não encontrado no banco');
        return res.status(500).json({ message: 'Erro interno: EditalPersonalizado não configurado.' });
      }

      const plano = await Plano.create({
        nome,
        descricao: descricao || 'Plano personalizado criado pelo usuário',
        usuario: req.user._id,
        editais: [{
          nome: 'EditalPersonalizado',
          instituicao: {
            nome: 'Personalizado',
            sigla: 'PERS',
            _id: new mongoose.Types.ObjectId()
          },
          disciplinas: []
        }],
        totalDisciplinas: 0,
        totalTopicos: 0
      });

      console.log('Plano personalizado criado com sucesso:', plano._id);
      console.log('Vinculado ao EditalPersonalizado:', editalPersonalizado._id);
      return res.status(201).json(plano);
    }
    
    // Criar snapshot completo dos editais e disciplinas (para planos normais)
    const editaisSnapshot = [];
    let totalDisciplinas = 0;
    let totalTopicos = 0;
    
    for (const cargo of cargos) {
      // Buscar todas as disciplinas deste edital
      const disciplinas = await Disciplina.find({ edital: cargo.cargo });
      
      const disciplinasSnapshot = disciplinas.map(disciplina => ({
        nome: disciplina.nome,
        cor: disciplina.cor,
        topicos: [...(disciplina.topicos || [])] // Cópia completa dos tópicos
      }));
      
      // Contar totais
      totalDisciplinas += disciplinas.length;
      totalTopicos += disciplinas.reduce((total, d) => total + (d.topicos?.length || 0), 0);
      
      editaisSnapshot.push({
        nome: cargo.cargo,
        instituicao: {
          nome: cargo.instituicao.nome,
          sigla: cargo.instituicao.sigla,
          _id: cargo.instituicao._id
        },
        disciplinas: disciplinasSnapshot
      });
    }
    
    const plano = await Plano.create({
      nome,
      descricao: descricao || 'Sem informações extras',
      usuario: req.user._id,
      editais: editaisSnapshot,
      totalDisciplinas,
      totalTopicos
    });

    console.log('Plano criado com sucesso:', plano._id);
    console.log('Snapshot criado com:', { editais: editaisSnapshot.length, totalDisciplinas, totalTopicos });
    
    res.status(201).json(plano);
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    res.status(500).json({ message: 'Erro no servidor ao criar plano.', error: error.message });
  }
});

// Buscar um plano específico
app.get('/api/planos/:id', protect, async (req, res) => {
  try {
    const plano = await Plano.findOne({ 
      _id: req.params.id, 
      usuario: req.user._id 
    });
    
    if (!plano) {
      return res.status(404).json({ message: 'Plano não encontrado.' });
    }
    
    // Dados já estão em snapshot, mas precisamos calcular progresso real
    const disciplinasDetalhadas = [];
    
    if (plano.editais && plano.editais.length > 0) {
      for (const edital of plano.editais) {
        for (const disciplina of edital.disciplinas) {
          // Buscar registros de estudo para esta disciplina
          const registrosEstudo = await RegistroEstudo.find({
            usuario: req.user._id,
            plano: req.params.id,
            disciplinaId: disciplina._id.toString(),
            estudoFinalizado: true
          });
          
          // Contar tópicos únicos estudados
          const topicosEstudados = new Set(
            registrosEstudo
              .map(r => r.topico)
              .filter(topico => topico && topico.trim() !== '')
          ).size;
          
          // Calcular questões da última atividade de cada tópico
          const questoesPorTopico = {};
          const temposPorTopico = {};
          
          // Agrupar registros por tópico e pegar o mais recente
          registrosEstudo.forEach(registro => {
            const topico = registro.topico || 'sem-topico';
            
            if (!questoesPorTopico[topico] || new Date(registro.createdAt) > new Date(questoesPorTopico[topico].createdAt)) {
              questoesPorTopico[topico] = {
                questoesPlanejadas: registro.questoesPlanejadas || 0,
                questoesRealizadas: registro.questoesRealizadas || 0,
                createdAt: registro.createdAt
              };
            }
            
            if (!temposPorTopico[topico] || new Date(registro.createdAt) > new Date(temposPorTopico[topico].createdAt)) {
              temposPorTopico[topico] = {
                tempoEstudo: registro.tempoEstudo || 0,
                createdAt: registro.createdAt
              };
            }
          });
          
          // Somar apenas as questões da última atividade de cada tópico
          const questoesResolvidas = Object.values(questoesPorTopico)
            .reduce((total, topico) => total + topico.questoesRealizadas, 0);

          // Calcular totais de questões planejadas e realizadas
          const questoesPlanejadas = Object.values(questoesPorTopico)
            .reduce((total, topico) => total + topico.questoesPlanejadas, 0);
          
          // Somar apenas o tempo da última atividade de cada tópico (converter segundos para minutos)
          const horasEstudo = Math.round(
            Object.values(temposPorTopico)
              .reduce((total, topico) => total + topico.tempoEstudo, 0) / 60
          );

          // Criar detalhes dos tópicos com questões
          const topicosComQuestoes = {};
          Object.keys(questoesPorTopico).forEach(topico => {
            const dados = questoesPorTopico[topico];
            topicosComQuestoes[topico] = {
              questoesPlanejadas: dados.questoesPlanejadas,
              questoesRealizadas: dados.questoesRealizadas,
              questoesErradas: Math.max(0, dados.questoesPlanejadas - dados.questoesRealizadas)
            };
          });
          
          disciplinasDetalhadas.push({
            _id: disciplina._id, // Usar o ID real do Mongoose
            nome: disciplina.nome,
            cor: disciplina.cor,
            topicos: disciplina.topicos || [],
            topicosEstudados: topicosEstudados,
            topicosTotal: disciplina.topicos ? disciplina.topicos.length : 0,
            questoesResolvidas: questoesResolvidas,
            questoesPlanejadas: questoesPlanejadas,
            horasEstudo: horasEstudo,
            topicosComQuestoes: topicosComQuestoes,
            edital: edital.nome,
            instituicao: edital.instituicao
          });
        }
      }
    }
    
    // Calcular estatísticas gerais do plano usando a mesma lógica de última atividade por tópico
    const todosRegistrosEstudo = await RegistroEstudo.find({
      usuario: req.user._id,
      plano: req.params.id
    });
    
    // Agrupar por disciplina + tópico para pegar a última atividade
    const questoesGeraisPorTopico = {};
    const temposGeraisPorTopico = {};
    
    todosRegistrosEstudo.forEach(registro => {
      const chaveTopico = `${registro.disciplinaId}-${registro.topico || 'sem-topico'}`;
      
      if (!questoesGeraisPorTopico[chaveTopico] || new Date(registro.createdAt) > new Date(questoesGeraisPorTopico[chaveTopico].createdAt)) {
        questoesGeraisPorTopico[chaveTopico] = {
          questoesRealizadas: registro.questoesRealizadas || 0,
          createdAt: registro.createdAt
        };
      }
      
      if (!temposGeraisPorTopico[chaveTopico] || new Date(registro.createdAt) > new Date(temposGeraisPorTopico[chaveTopico].createdAt)) {
        temposGeraisPorTopico[chaveTopico] = {
          tempoEstudo: registro.tempoEstudo || 0,
          createdAt: registro.createdAt
        };
      }
    });
    
    const horasEstudo = Math.round(
      Object.values(temposGeraisPorTopico)
        .reduce((total, topico) => total + topico.tempoEstudo, 0) / 60
    );
    
    const questoesTotal = Object.values(questoesGeraisPorTopico)
      .reduce((total, topico) => total + topico.questoesRealizadas, 0);
    
    // Calcular totais dinâmicos a partir das disciplinas detalhadas
    const totalTopicos = disciplinasDetalhadas.reduce((total, disciplina) => {
      return total + (disciplina.topicosTotal || 0);
    }, 0);
    
    // Calcular total de disciplinas dinamicamente
    const totalDisciplinas = disciplinasDetalhadas.length;
    
    const planoCompleto = {
      ...plano.toObject(),
      disciplinas: totalDisciplinas, // Usar valor calculado dinamicamente
      topicos: totalTopicos, // Usar valor calculado dinamicamente
      disciplinasDetalhadas,
      horasEstudo: horasEstudo,
      questoesTotal: questoesTotal
    };
    
    res.json(planoCompleto);
  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar plano.' });
  }
});

// Atualizar um plano específico
app.put('/api/planos/:id', protect, async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    
    const plano = await Plano.findOneAndUpdate(
      { _id: req.params.id, usuario: req.user._id },
      { nome, descricao },
      { new: true, runValidators: true }
    );
    
    if (!plano) {
      return res.status(404).json({ message: 'Plano não encontrado.' });
    }
    
    res.json(plano);
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    res.status(500).json({ message: 'Erro no servidor ao atualizar plano.' });
  }
});

// Atualizar uma disciplina específica de um plano
app.put('/api/planos/:planoId/disciplinas/:disciplinaId', protect, async (req, res) => {
  try {
    const { nome, cor, topicos } = req.body;
    const { planoId, disciplinaId } = req.params;
    
    console.log('Atualizando disciplina:', { planoId, disciplinaId, nome, cor, topicos });
    console.log('User ID:', req.user._id);
    
    // if (topicos && Array.isArray(topicos)) {
    //   const topicosExistentes = new Set(topicos);
    //   for (const topico of topicos) {
    //     if (topicosSet.has(topico.toLowerCase())) {
    //       return res.status(400).json({ error: 'Os tópicos não podem ser iguais.' });
    //     }
    //   }
    // }
    const plano = await Plano.findOne({ 
      _id: planoId, 
      usuario: req.user._id 
    });
    
    if (!plano) {
      console.log('Plano não encontrado para:', { planoId, userId: req.user._id });
      return res.status(404).json({ message: 'Plano não encontrado.' });
    }
    
    console.log('Plano encontrado:', plano.nome);
    console.log('Editais no plano:', plano.editais.length);
    
    // Encontrar e atualizar a disciplina dentro dos editais
    let disciplinaEncontrada = false;
    
    for (let i = 0; i < plano.editais.length; i++) {
      const edital = plano.editais[i];
      console.log(`Edital ${i}:`, edital.nome, 'Disciplinas:', edital.disciplinas.length);
      
      for (let j = 0; j < edital.disciplinas.length; j++) {
        const disc = edital.disciplinas[j];
        console.log(`  Disciplina ${j}:`, disc.nome, 'ID:', disc._id.toString());
        
        if (disc._id.toString() === disciplinaId) {
          console.log('Disciplina encontrada! Atualizando...');
          disc.nome = nome;
          disc.cor = cor;
          if (topicos && Array.isArray(topicos)) {
            disc.topicos = topicos;
          }
          disciplinaEncontrada = true;
          break;
        }
      }
      
      if (disciplinaEncontrada) break;
    }
    
    if (!disciplinaEncontrada) {
      console.log('Disciplina não encontrada. ID procurado:', disciplinaId);
      return res.status(404).json({ message: 'Disciplina não encontrada.' });
    }
    
    await plano.save();
    
    // Buscar o plano atualizado com os dados formatados
    const planoAtualizado = await Plano.findById(planoId);
    
    // Calcular estatísticas com base nos registros de estudo
    let disciplinasDetalhadas = [];
    let totalTopicos = 0;
    
    for (const edital of planoAtualizado.editais) {
      for (const disc of edital.disciplinas) {
        // Buscar registros de estudo para esta disciplina
        const registrosEstudo = await RegistroEstudo.find({
          usuario: req.user._id,
          plano: planoId,
          disciplinaId: disc._id.toString(),
          estudoFinalizado: true
        });
        
        // Contar tópicos únicos estudados
        const topicosEstudados = new Set(
          registrosEstudo
            .map(r => r.topico)
            .filter(topico => topico && topico.trim() !== '')
        ).size;
        
        // Somar questões realizadas
        const questoesResolvidas = registrosEstudo.reduce((total, r) => total + (r.questoesRealizadas || 0), 0);
        
        disciplinasDetalhadas.push({
          _id: disc._id,
          nome: disc.nome,
          cor: disc.cor,
          topicosTotal: disc.topicos.length,
          topicosEstudados: topicosEstudados,
          questoesResolvidas: questoesResolvidas
        });
        totalTopicos += disc.topicos.length;
      }
    }
    
    // Calcular estatísticas gerais do plano
    const todosRegistrosEstudo = await RegistroEstudo.find({
      usuario: req.user._id,
      plano: planoId
    });
    
    const horasEstudo = Math.round(todosRegistrosEstudo.reduce((total, r) => total + (r.tempoEstudo || 0), 0) / 60); // converter segundos para minutos
    const questoesTotal = todosRegistrosEstudo.reduce((total, r) => total + (r.questoesRealizadas || 0), 0);
    
    const response = {
      ...planoAtualizado.toObject(),
      disciplinas: disciplinasDetalhadas.length,
      topicos: totalTopicos,
      disciplinasDetalhadas,
      questoesTotal: questoesTotal,
      horasEstudo: horasEstudo
    };
    
    console.log('Disciplina atualizada com sucesso');
    res.json(response);
  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    res.status(500).json({ message: 'Erro no servidor ao atualizar disciplina.' });
  }
});

// Remover uma disciplina específica de um plano
app.delete('/api/planos/:planoId/disciplinas/:disciplinaId', protect, async (req, res) => {
  try {
    const { planoId, disciplinaId } = req.params;
    
    console.log('Removendo disciplina:', { planoId, disciplinaId });
    console.log('User ID:', req.user._id);
    
    const plano = await Plano.findOne({ 
      _id: planoId, 
      usuario: req.user._id 
    });
    
    if (!plano) {
      console.log('Plano não encontrado para:', { planoId, userId: req.user._id });
      return res.status(404).json({ message: 'Plano não encontrado.' });
    }
    
    console.log('Plano encontrado:', plano.nome);
    
    // Encontrar e remover a disciplina dentro dos editais
    let disciplinaEncontrada = false;
    let disciplinaNome = '';
    
    for (let i = 0; i < plano.editais.length; i++) {
      const edital = plano.editais[i];
      
      for (let j = 0; j < edital.disciplinas.length; j++) {
        const disc = edital.disciplinas[j];
        
        if (disc._id.toString() === disciplinaId) {
          console.log('Disciplina encontrada! Removendo...');
          disciplinaNome = disc.nome;
          edital.disciplinas.splice(j, 1); // Remove a disciplina do array
          disciplinaEncontrada = true;
          break;
        }
      }
      
      if (disciplinaEncontrada) break;
    }
    
    if (!disciplinaEncontrada) {
      console.log('Disciplina não encontrada. ID procurado:', disciplinaId);
      return res.status(404).json({ message: 'Disciplina não encontrada.' });
    }
    
    await plano.save();
    
    // Remover também todos os registros de estudo relacionados a esta disciplina
    await RegistroEstudo.deleteMany({
      usuario: req.user._id,
      plano: planoId,
      disciplinaId: disciplinaId
    });
    
    console.log(`Disciplina "${disciplinaNome}" removida com sucesso`);
    res.json({ message: `Disciplina "${disciplinaNome}" removida com sucesso!` });
  } catch (error) {
    console.error('Erro ao remover disciplina:', error);
    res.status(500).json({ message: 'Erro no servidor ao remover disciplina.' });
  }
});

// Adicionar uma nova disciplina a um plano
app.post('/api/planos/:planoId/disciplinas', protect, async (req, res) => {
  try {
    console.log('');
    console.log('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨');
    console.log('🚨 ENDPOINT DE CRIAÇÃO DE DISCIPLINA EXECUTADO! 🚨');
    console.log('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔄 Este endpoint foi ATUALIZADO para resolver o erro!');
    console.log('');
    
    const { nome, cor, topicos } = req.body;
    const { planoId } = req.params;
    
    // const topicosSet = new Set(topicos.map(t => t.toLowerCase()));
    // for (const topico of topicos) {
    //   if (topicosSet.has(topico.toLowerCase())) {
    //     return res.status(400).json({ error: 'Os tópicos não podem ser iguais.' });
    //   }
    // }
    console.log('=== DADOS DA REQUISIÇÃO ===');
    console.log('PlanoId:', planoId);
    console.log('Nome da disciplina:', nome);
    console.log('Cor:', cor);
    console.log('Tópicos:', topicos);
    console.log('User ID:', req.user._id);
    
    console.log('=== VERIFICANDO SE ESTE É O ENDPOINT CORRETO ===');
    console.log('Se você vê estas mensagens, nosso endpoint está sendo executado!');
    
    // Buscar o plano ANTES de qualquer validação
    console.log('� Buscando plano no banco de dados...');
    const plano = await Plano.findOne({ 
      _id: planoId, 
      usuario: req.user._id 
    });
    
    if (!plano) {
      console.log('❌ Plano não encontrado');
      return res.status(404).json({ message: 'Plano não encontrado.' });
    }
    
    console.log('✅ Plano encontrado:', plano.nome);
    console.log('📋 Editais atuais:', plano.editais?.length || 0);
    
    // Criar nova disciplina
    const novaDisciplina = {
      _id: new mongoose.Types.ObjectId(),
      nome: nome,
      cor: cor || 'azul',
      topicos: topicos || []
    };
    
    console.log('🆕 Nova disciplina preparada:', novaDisciplina);
    
    // SEMPRE criar ou adicionar ao edital, sem verificações que possam gerar erro
    if (!plano.editais || plano.editais.length === 0) {
      console.log('🎨 Criando edital EditalPersonalizado para plano personalizado');
      plano.editais = [{
        nome: 'EditalPersonalizado',
        instituicao: {
          nome: 'Personalizado',
          sigla: 'PERS',
          _id: new mongoose.Types.ObjectId()
        },
        disciplinas: [novaDisciplina]
      }];
    } else {
      console.log('📚 Adicionando ao edital existente');
      plano.editais[0].disciplinas.push(novaDisciplina);
    }
    
    // Atualizar estatísticas
    plano.totalDisciplinas = (plano.totalDisciplinas || 0) + 1;
    plano.totalTopicos = (plano.totalTopicos || 0) + novaDisciplina.topicos.length;
    
    console.log('💾 Salvando plano...');
    
    // Salvar com try-catch específico para capturar erros do Mongoose
    try {
      const planoSalvo = await plano.save();
      console.log('✅ Plano salvo com sucesso!');
      console.log('📊 Disciplinas no plano:', planoSalvo.editais[0]?.disciplinas?.length || 0);
    } catch (saveError) {
      console.log('🚨 ERRO ENCONTRADO NO SAVE!');
      console.log('Tipo:', saveError.name);
      console.log('Mensagem:', saveError.message);
      console.log('Stack:', saveError.stack);
      
      // Se encontrarmos o erro específico
      if (saveError.message.includes('editais')) {
        console.log('🎯 ESTE É O ERRO QUE ESTÁVAMOS PROCURANDO!');
        console.log('🔍 Erro vem do Mongoose/MongoDB durante o save()');
        return res.status(400).json({ 
          message: saveError.message,
          source: 'mongoose_save_error',
          debug: {
            errorName: saveError.name,
            errorCode: saveError.code
          }
        });
      }
      
      // Re-throw se não é o erro que estamos procurando
      throw saveError;
    }
    
    // Buscar plano atualizado
    console.log('🔄 Recarregando plano do banco...');
    const planoAtualizado = await Plano.findById(planoId);
    
    // Construir resposta
    let disciplinasDetalhadas = [];
    let totalTopicos = 0;
    
    planoAtualizado.editais.forEach(edital => {
      edital.disciplinas.forEach(disc => {
        disciplinasDetalhadas.push({
          _id: disc._id,
          nome: disc.nome,
          cor: disc.cor,
          topicos: disc.topicos || [],
          topicosTotal: disc.topicos.length,
          topicosEstudados: 0,
          questoesResolvidas: 0,
          edital: edital.nome,
          instituicao: edital.instituicao
        });
        totalTopicos += disc.topicos.length;
      });
    });

    const response = {
      ...planoAtualizado.toObject(),
      disciplinas: disciplinasDetalhadas.length,
      topicos: totalTopicos,
      disciplinasDetalhadas,
      questoesTotal: 0,
      horasEstudo: 0
    };

    console.log('📤 Sucesso! Enviando resposta...');
    console.log('📊 Total de disciplinas na resposta:', disciplinasDetalhadas.length);
    
    res.status(201).json(response);
    
  } catch (error) {
    console.error('💥 ERRO GERAL NO ENDPOINT:');
    console.error('Tipo:', error.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    
    // Se o erro contém a mensagem específica
    if (error.message && error.message.includes('editais')) {
      console.error('🎯 ERRO RELACIONADO A EDITAIS CAPTURADO!');
      return res.status(400).json({ 
        message: error.message,
        source: 'general_catch_error'
      });
    }
    
    res.status(500).json({ message: 'Erro no servidor ao criar disciplina.' });
  }
});

// Deletar um plano específico
app.delete('/api/planos/:id', protect, async (req, res) => {
  try {
    const plano = await Plano.findOneAndDelete({ 
      _id: req.params.id, 
      usuario: req.user._id 
    });
    
    if (!plano) {
      return res.status(404).json({ message: 'Plano não encontrado.' });
    }

    // Limpar revisões associadas ao plano deletado
    await Revisao.updateMany(
      { planoId: req.params.id, usuario: req.user._id },
      { ativo: false, dataFinalizacao: new Date() }
    );

    // Limpar registros de estudo agendados associados ao plano deletado
    await RegistroEstudo.deleteMany({
      plano: req.params.id,
      usuario: req.user._id,
      dataOpcao: 'agendar'
    });

    console.log(`✅ Plano "${plano.nome}" e suas revisões foram removidos`);
    res.json({ message: 'Plano excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir plano:', error);
    res.status(500).json({ message: 'Erro no servidor ao excluir plano.' });
  }
});

app.get('/api/admin/categorias', protect, isAdmin, async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ createdAt: -1 });
    res.json(categorias);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar categorias.' });
  }
});

app.post('/api/admin/categorias', protect, isAdmin, async (req, res) => {
  try {
    const { nome } = req.body;
    const categoria = await Categoria.create({ nome });
    res.status(201).json(categoria);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ message: 'Erro no servidor ao criar categoria.' });
  }
});

app.put('/api/admin/categorias/:id', protect, isAdmin, async (req, res) => {
  try {
    const { nome } = req.body;
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      { nome },
      { new: true }
    );
    res.json(categoria);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ message: 'Erro no servidor ao atualizar categoria.' });
  }
});

app.delete('/api/admin/categorias/:id', protect, isAdmin, async (req, res) => {
  try {
    await Categoria.findByIdAndDelete(req.params.id);
    res.json({ message: 'Categoria excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({ message: 'Erro no servidor ao excluir categoria.' });
  }
});

app.get('/api/admin/disciplinas', protect, isAdmin, async (req, res) => {
  try {
    const { edital } = req.query;
    const filter = {};
    
    if (edital) {
      filter.edital = edital;
    }
    
    const disciplinas = await Disciplina.find(filter).populate('instituicao', 'nome sigla').sort({ createdAt: -1 });
    res.json(disciplinas);
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar disciplinas.' });
  }
});

app.post('/api/admin/disciplinas', protect, isAdmin, async (req, res) => {
  try {
    const { nome, cor, topicos, instituicao, edital } = req.body;
    const corFinal = cor || 'azul';
    
    // Preparar dados para criação
    const disciplinaData = { 
      nome, 
      cor: corFinal, 
      topicos: topicos || [],
      edital
    };
    
    // Só incluir instituicao se for um ObjectId válido
    if (instituicao && mongoose.Types.ObjectId.isValid(instituicao)) {
      disciplinaData.instituicao = instituicao;
    }
    
    const disciplina = await Disciplina.create(disciplinaData);
    
    res.status(201).json(disciplina);
  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    res.status(500).json({ message: 'Erro no servidor ao criar disciplina.' });
  }
});

app.put('/api/admin/disciplinas/:id', protect, isAdmin, async (req, res) => {
  try {
    const { nome, cor, topicos, instituicao, edital } = req.body;
    
    // Filtrar apenas campos válidos e não vazios
    const updateData = { nome, cor, topicos, edital };
    
    // Só incluir instituicao se for um ObjectId válido
    if (instituicao && mongoose.Types.ObjectId.isValid(instituicao)) {
      updateData.instituicao = instituicao;
    }
    
    const disciplina = await Disciplina.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(disciplina);
  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    res.status(500).json({ message: 'Erro no servidor ao atualizar disciplina.' });
  }
});

app.delete('/api/admin/disciplinas/:id', protect, isAdmin, async (req, res) => {
  try {
    const disciplina = await Disciplina.findById(req.params.id);
    
    if (!disciplina) {
      return res.status(404).json({ message: 'Disciplina não encontrada.' });
    }

    // Limpar revisões associadas à disciplina que será deletada
    await Revisao.updateMany(
      { disciplinaId: req.params.id },
      { ativo: false, dataFinalizacao: new Date() }
    );

    // Limpar registros de estudo agendados associados à disciplina
    await RegistroEstudo.deleteMany({
      disciplinaId: req.params.id,
      dataOpcao: 'agendar'
    });

    // Deletar a disciplina
    await Disciplina.findByIdAndDelete(req.params.id);

    console.log(`✅ Disciplina "${disciplina.nome}" e suas revisões foram removidas`);
    res.json({ message: 'Disciplina excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir disciplina:', error);
    res.status(500).json({ message: 'Erro no servidor ao excluir disciplina.' });
  }
});

app.get('/api/admin/editais', protect, isAdmin, async (req, res) => {
  try {
    const editais = await Edital.find().sort({ createdAt: -1 });
    res.json(editais);
  } catch (error) {
    console.error('Erro ao buscar editais:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar editais.' });
  }
});

app.post('/api/admin/editais', protect, isAdmin, async (req, res) => {
  try {
    const { nome } = req.body;
    const edital = await Edital.create({ nome });
    res.status(201).json(edital);
  } catch (error) {
    console.error('Erro ao criar edital:', error);
    res.status(500).json({ message: 'Erro no servidor ao criar edital.' });
  }
});

app.put('/api/admin/editais/:id', protect, isAdmin, async (req, res) => {
  try {
    const { nome } = req.body;
    const edital = await Edital.findByIdAndUpdate(
      req.params.id,
      { nome },
      { new: true }
    );
    res.json(edital);
  } catch (error) {
    console.error('Erro ao atualizar edital:', error);
    res.status(500).json({ message: 'Erro no servidor ao atualizar edital.' });
  }
});

app.delete('/api/admin/editais/:id', protect, isAdmin, async (req, res) => {
  try {
    await Edital.findByIdAndDelete(req.params.id);
    res.json({ message: 'Edital excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir edital:', error);
    res.status(500).json({ message: 'Erro no servidor ao excluir edital.' });
  }
});

// Endpoint público para buscar estatísticas de um edital
app.get('/api/edital/:nome/stats', async (req, res) => {
  try {
    const { nome } = req.params;
    
    // Buscar todas as disciplinas do edital
    const disciplinas = await Disciplina.find({ edital: nome });
    
    // Calcular estatísticas
    const totalDisciplinas = disciplinas.length;
    const totalTopicos = disciplinas.reduce((total, disciplina) => {
      return total + (disciplina.topicos ? disciplina.topicos.length : 0);
    }, 0);
    
    res.json({
      edital: nome,
      disciplinas: totalDisciplinas,
      topicos: totalTopicos
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do edital:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar estatísticas do edital.' });
  }
});

app.get('/api/admin/instituicoes', protect, isAdmin, async (req, res) => {
  try {
    const instituicoes = await Instituicao.find().populate('categoria', 'nome').sort({ createdAt: -1 });
    res.json(instituicoes);
  } catch (error) {
    console.error('Erro ao buscar instituições:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar instituições.' });
  }
});

app.post('/api/admin/upload-logotipo', protect, isAdmin, upload.single('logotipo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }
    
    const fileUrl = `/uploads/logotipos/${req.file.filename}`;
    res.json({ 
      message: 'Logotipo enviado com sucesso!',
      filename: req.file.filename,
      url: fileUrl
    });
  } catch (error) {
    console.error('Erro ao fazer upload do logotipo:', error);
    res.status(500).json({ message: 'Erro no servidor ao fazer upload.' });
  }
});

app.post('/api/users/upload-avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }
    
    const fileUrl = `/uploads/avatars/${req.file.filename}`;
    
    // Atualizar o avatar do usuário no banco de dados
    await User.findByIdAndUpdate(req.user.id, { avatar: fileUrl });
    
    res.json({ 
      message: 'Avatar enviado com sucesso!',
      filename: req.file.filename,
      url: fileUrl
    });
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    res.status(500).json({ message: 'Erro no servidor ao fazer upload.' });
  }
});

app.delete('/api/users/:id/avatar', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Verificar se o usuário está tentando excluir seu próprio avatar ou se é admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Não autorizado a excluir este avatar.' });
    }
    
    // Buscar o usuário para pegar o avatar atual
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    // Se há um avatar, tentar deletar o arquivo
    if (user.avatar) {
      try {
        const filePath = path.join(__dirname, user.avatar.replace('/uploads/', './uploads/'));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.warn('Não foi possível deletar o arquivo do avatar:', fileError);
        // Continua mesmo se não conseguir deletar o arquivo
      }
    }
    
    // Remover o avatar do banco de dados
    await User.findByIdAndUpdate(userId, { avatar: null });
    
    res.json({ message: 'Avatar excluído com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir avatar:', error);
    res.status(500).json({ message: 'Erro no servidor ao excluir avatar.' });
  }
});

app.post('/api/admin/instituicoes', protect, isAdmin, async (req, res) => {
  try {
    const { nome, sigla, logotipo, cargos, estado, cidade, tipo, categoria } = req.body;
    console.log('Dados recebidos:', { nome, sigla, logotipo, cargos, estado, cidade, tipo, categoria });
    const instituicao = await Instituicao.create({ 
      nome, 
      sigla, 
      logotipo, 
      cargos, 
      estado, 
      cidade, 
      tipo: tipo || 'Concurso Público',
      categoria
    });
    
    // Buscar a instituição criada com populate para retornar com dados completos
    const instituicaoCompleta = await Instituicao.findById(instituicao._id).populate('categoria', 'nome');
    console.log('Instituição criada:', instituicaoCompleta);
    res.status(201).json(instituicaoCompleta);
  } catch (error) {
    console.error('Erro ao criar instituição:', error);
    res.status(500).json({ message: 'Erro no servidor ao criar instituição.' });
  }
});

app.put('/api/admin/instituicoes/:id', protect, isAdmin, async (req, res) => {
  try {
    const { nome, sigla, logotipo, cargos, estado, cidade, tipo, categoria } = req.body;
    console.log('Dados para atualização:', { nome, sigla, logotipo, cargos, estado, cidade, tipo, categoria });
    const instituicao = await Instituicao.findByIdAndUpdate(
      req.params.id,
      { nome, sigla, logotipo, cargos, estado, cidade, tipo, categoria },
      { new: true }
    ).populate('categoria', 'nome');
    console.log('Instituição atualizada:', instituicao);
    res.json(instituicao);
  } catch (error) {
    console.error('Erro ao atualizar instituição:', error);
    res.status(500).json({ message: 'Erro no servidor ao atualizar instituição.' });
  }
});

app.delete('/api/admin/instituicoes/:id', protect, isAdmin, async (req, res) => {
  try {
    await Instituicao.findByIdAndDelete(req.params.id);
    res.json({ message: 'Instituição excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir instituição:', error);
    res.status(500).json({ message: 'Erro no servidor ao excluir instituição.' });
  }
});

// Rota para listar todos os editais (cargos) de todas as instituições
app.get('/api/admin/editais-list', protect, isAdmin, async (req, res) => {
  try {
    const instituicoes = await Instituicao.find()
      .populate('categoria', 'nome')
      .sort({ createdAt: -1 });
    
    // Transformar cargos de cada instituição em lista de editais
    const editais = [];
    
    instituicoes.forEach(instituicao => {
      if (instituicao.cargos && instituicao.cargos.length > 0) {
        instituicao.cargos.forEach(cargo => {
          editais.push({
            nome: cargo,
            instituicao: {
              _id: instituicao._id,
              nome: instituicao.nome,
              sigla: instituicao.sigla,
              logotipo: instituicao.logotipo,
              estado: instituicao.estado,
              cidade: instituicao.cidade,
              tipo: instituicao.tipo,
              categoria: instituicao.categoria
            }
          });
        });
      }
    });
    
    res.json(editais);
  } catch (error) {
    console.error('Erro ao buscar editais:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar editais.' });
  }
});

// Endpoints para Registro de Estudo

// TESTE MEGA SIMPLES - SÓ PARA VER SE SALVA ALGUMA COISA
app.post('/api/teste-salvar', protect, async (req, res) => {
  try {
    console.log('=== TESTE DE SALVAMENTO DIRETO ===');
    console.log('Usuário autenticado:', req.user.email);
    console.log('Body recebido:', req.body);

    // Criar um registro SUPER SIMPLES só para testar
    const novoRegistro = {
      usuario: req.user.id,
      plano: req.body.planoId || 'teste',
      disciplinaId: req.body.disciplinaId || 'teste',
      disciplinaNome: 'TESTE DIRETO',
      topico: req.body.topico || 'Teste de funcionalidade',
      tempoEstudo: req.body.tempoEstudo || 99,
      observacoes: req.body.observacoes || 'Este é um teste para ver se salva',
      tipoAtividade: 'estudo', // Valor válido do enum
      links: [],
      questoesPlanejadas: 0,
      questoesRealizadas: 0,
      material: '',
      estudoFinalizado: false
    };

    console.log('Dados que vão ser salvos:', novoRegistro);

    const registroSalvo = await RegistroEstudo.create(novoRegistro);
    
    console.log('SUCESSO! Registro salvo com ID:', registroSalvo._id);

    return res.status(201).json({
      success: true,
      message: 'TESTE FUNCIONOU! Registro salvo',
      id: registroSalvo._id,
      dados: registroSalvo
    });

  } catch (error) {
    console.error('ERRO no teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no teste',
      erro: error.message,
      stack: error.stack
    });
  }
});

// Criar novo registro de estudo - VERSÃO OTIMIZADA
app.post('/api/registro-estudo', protect, async (req, res) => {
  try {
    console.log('=== ENDPOINT REGISTRO ESTUDO INICIADO ===');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('👤 Usuário logado:', req.user.email);
    console.log('📦 Dados recebidos no body:', JSON.stringify(req.body, null, 2));

    const { 
      sessaoId,
      disciplinaId, 
      disciplinaNome,
      planoId, 
      topico, 
      tempoEstudo, 
      observacoes, 
      tipoAtividade,
      links,
      questoesPlanejadas,
      questoesRealizadas,
      material,
      estudoFinalizado,
      dataOpcao,
      dataAgendada,
      iniciadaEm,
      finalizadaEm
    } = req.body;

    // Validações básicas
    if (!disciplinaId) {
      console.error('❌ ERRO: disciplinaId é obrigatório');
      return res.status(400).json({ message: 'disciplinaId é obrigatório' });
    }

    if (!planoId) {
      console.error('❌ ERRO: planoId é obrigatório');
      return res.status(400).json({ message: 'planoId é obrigatório' });
    }

    // VERIFICAR SE SESSÃO JÁ EXISTE (evitar duplicatas)
    if (sessaoId) {
      console.log('� Verificando se sessão já existe:', sessaoId);
      const sessaoExistente = await RegistroEstudo.findOne({
        usuario: req.user.id,
        sessaoId: sessaoId
      });
      
      if (sessaoExistente) {
        console.log('⚠️ Sessão já existe, atualizando registro existente...');
        
        // Atualizar registro existente
        sessaoExistente.tempoEstudo = tempoEstudo || 0;
        sessaoExistente.observacoes = observacoes || '';
        sessaoExistente.material = material || '';
        sessaoExistente.links = links || [];
        sessaoExistente.questoesPlanejadas = questoesPlanejadas || 0;
        sessaoExistente.questoesRealizadas = questoesRealizadas || 0;
        sessaoExistente.estudoFinalizado = estudoFinalizado || false;
        sessaoExistente.dataOpcao = dataOpcao || 'hoje';
        sessaoExistente.dataAgendada = dataAgendada || '';
        sessaoExistente.finalizadaEm = finalizadaEm ? new Date(finalizadaEm) : null;
        
        await sessaoExistente.save();
        
        console.log('✅ Registro atualizado com sucesso!');
        return res.status(200).json({
          message: 'Registro atualizado com sucesso!',
          registroId: sessaoExistente._id,
          dados: sessaoExistente
        });
      }
    }

    console.log('✅ Validações básicas passaram, criando novo registro...');

    // Criar registro completo com todos os dados
    const dadosParaSalvar = {
      usuario: req.user.id,
      plano: planoId,
      disciplinaId: disciplinaId,
      disciplinaNome: disciplinaNome || 'Nome não informado',
      topico: topico || 'Sem tópico',
      tempoEstudo: tempoEstudo || 0,
      observacoes: observacoes || '',
      tipoAtividade: tipoAtividade || 'estudo',
      links: links || [],
      questoesPlanejadas: questoesPlanejadas || 0,
      questoesRealizadas: questoesRealizadas || 0,
      material: material || '',
      estudoFinalizado: estudoFinalizado || false,
      dataOpcao: dataOpcao || 'hoje',
      dataAgendada: dataAgendada || '',
      iniciadaEm: iniciadaEm ? new Date(iniciadaEm) : null,
      finalizadaEm: finalizadaEm ? new Date(finalizadaEm) : null
    };

    // Adicionar sessaoId se fornecido (para controle de duplicatas)
    if (sessaoId) {
      dadosParaSalvar.sessaoId = sessaoId;
    }

    console.log('� Salvando novo registro...');
    const registro = await RegistroEstudo.create(dadosParaSalvar);
    console.log('✅ Registro salvo com sucesso:', registro._id);

    const resposta = {
      message: 'Registro salvo com sucesso!',
      registroId: registro._id,
      dados: {
        _id: registro._id,
        disciplinaId: registro.disciplinaId,
        disciplinaNome: registro.disciplinaNome,
        topico: registro.topico,
        tempoEstudo: registro.tempoEstudo,
        observacoes: registro.observacoes,
        material: registro.material,
        links: registro.links,
        questoesPlanejadas: registro.questoesPlanejadas,
        questoesRealizadas: registro.questoesRealizadas,
        estudoFinalizado: registro.estudoFinalizado,
        dataOpcao: registro.dataOpcao,
        dataAgendada: registro.dataAgendada,
        tipoAtividade: registro.tipoAtividade,
        createdAt: registro.createdAt,
        iniciadaEm: registro.iniciadaEm,
        finalizadaEm: registro.finalizadaEm,
        sessaoId: registro.sessaoId
      }
    };

    res.status(201).json(resposta);

  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao salvar registro:');
    console.error('- Mensagem:', error.message);
    console.error('- Stack:', error.stack);
    console.error('- Nome do erro:', error.name);
    
    res.status(500).json({ 
      message: 'Erro interno do servidor', 
      erro: error.message,
      details: error.stack
    });
  }
});

// Buscar registros de estudo do usuário
app.get('/api/registros-estudo', protect, async (req, res) => {
  try {
    const { disciplinaId, planoId, page = 1, limit = 10 } = req.query;
    
    console.log('🔍 Buscando registros de estudo:');
    console.log('• Usuario ID:', req.user.id);
    console.log('• Disciplina ID:', disciplinaId);
    console.log('• Plano ID:', planoId);
    
    const filter = { usuario: req.user.id };
    if (disciplinaId) {
      filter.disciplinaId = disciplinaId;
    } else if (planoId) {
      filter.plano = planoId;
    }
    
    console.log('• Filtro aplicado:', filter);

    const registros = await RegistroEstudo.find(filter)
      .sort({ data: -1 })  // Mudou de createdAt para data
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RegistroEstudo.countDocuments(filter);
    
    console.log('• Registros encontrados:', registros.length);
    console.log('• Total de registros:', total);

    res.json({
      registros,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('❌ ERRO COMPLETO ao buscar registros de estudo:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ message: 'Erro no servidor ao buscar registros de estudo.' });
  }
});

// Rotas de Revisões
// Adicionar tópico às revisões
app.post('/api/revisoes', protect, async (req, res) => {
  try {
    const { topico, disciplinaId, disciplinaNome, planoId, dataInicio, cor } = req.body;
    
    // Verificar se o tópico já está nas revisões
    const revisaoExistente = await Revisao.findOne({
      usuario: req.user._id,
      planoId,
      disciplinaId,
      topico,
      ativo: true
    });
    
    if (revisaoExistente) {
      // Se já existe, apenas atualizar a data de início
      revisaoExistente.dataInicio = dataInicio || new Date();
      await revisaoExistente.save();
      console.log(`✅ Tópico "${topico}" já estava em revisão, data atualizada`);
      return res.status(200).json(revisaoExistente);
    }
    
    // Criar nova revisão
    const novaRevisao = await Revisao.create({
      topico,
      disciplinaId,
      disciplinaNome,
      planoId,
      usuario: req.user._id,
      dataInicio: dataInicio || new Date(),
      cor: cor || 'azul',
      ativo: true
    });
    
    console.log(`✅ Tópico "${topico}" adicionado às revisões`);
    res.status(201).json(novaRevisao);
    
  } catch (error) {
    console.error('Erro ao adicionar tópico às revisões:', error);
    res.status(500).json({ message: 'Erro ao adicionar tópico às revisões.' });
  }
});

// Buscar revisões do usuário (tópicos agendados e com timer iniciado)
app.get('/api/revisoes', protect, async (req, res) => {
  try {
    // Buscar tópicos que foram agendados (dataOpcao = 'agendar')
    const topicosAgendados = await RegistroEstudo.find({
      usuario: req.user._id,
      dataOpcao: 'agendar',
      dataAgendada: { $ne: '' } // Deve ter uma data agendada definida
    }).select('disciplinaId disciplinaNome topico dataAgendada plano createdAt cor')
      .populate('plano', '_id nome') // Popular plano para verificar se existe
      .sort({ dataAgendada: 1, createdAt: -1 });

    // Buscar revisões já existentes (sistema antigo)
    const revisoesExistentes = await Revisao.find({
      usuario: req.user._id,
      ativo: true
    }).populate('planoId', '_id nome') // Popular plano para verificar se existe
      .sort({ dataInicio: -1 });

    // Combinar e remover duplicatas, filtrando apenas tópicos com planos válidos
    const revisoesTotais = [];
    const topicosJaAdicionados = new Set();

    // Adicionar revisões do sistema antigo primeiro (apenas se o plano ainda existe)
    revisoesExistentes.forEach(revisao => {
      // Verificar se o plano ainda existe
      if (revisao.planoId) {
        const chave = `${revisao.disciplinaId}_${revisao.topico}`;
        if (!topicosJaAdicionados.has(chave)) {
          revisoesTotais.push({
            _id: revisao._id,
            topico: revisao.topico,
            disciplinaNome: revisao.disciplinaNome,
            disciplinaId: revisao.disciplinaId,
            planoId: revisao.planoId._id,
            planoNome: revisao.planoId.nome,
            dataInicio: revisao.dataInicio,
            cor: revisao.cor || 'azul',
            tipo: 'revisao' // Para identificar origem
          });
          topicosJaAdicionados.add(chave);
        }
      }
    });

    // Adicionar tópicos agendados (apenas se o plano ainda existe)
    topicosAgendados.forEach(topico => {
      // Verificar se o plano ainda existe e se tem data agendada válida
      if (topico.plano && topico.dataAgendada) {
        const chave = `${topico.disciplinaId}_${topico.topico}`;
        if (!topicosJaAdicionados.has(chave)) {
          console.log('Tópico agendado encontrado:', {
            _id: topico._id,
            topico: topico.topico,
            plano: topico.plano,
            planoId: topico.plano._id
          });
          revisoesTotais.push({
            _id: topico._id,
            topico: topico.topico,
            disciplinaNome: topico.disciplinaNome,
            disciplinaId: topico.disciplinaId,
            planoId: topico.plano._id, // Usar o _id do plano populado
            planoNome: topico.plano.nome,
            dataInicio: new Date(topico.dataAgendada), // Usar data agendada como data de início
            cor: 'azul', // Cor padrão para tópicos agendados
            tipo: 'agendamento' // Para identificar origem
          });
          topicosJaAdicionados.add(chave);
        }
      }
    });

    // Ordenar por data (agendamentos futuros primeiro, depois revisões por data de início)
    revisoesTotais.sort((a, b) => {
      const agora = new Date();
      const dataA = new Date(a.dataInicio);
      const dataB = new Date(b.dataInicio);
      
      // Se ambos são futuros ou ambos são passados, ordenar por data
      if ((dataA >= agora && dataB >= agora) || (dataA < agora && dataB < agora)) {
        return dataA.getTime() - dataB.getTime();
      }
      
      // Priorizar futuros sobre passados
      if (dataA >= agora && dataB < agora) return -1;
      if (dataA < agora && dataB >= agora) return 1;
      
      return dataA.getTime() - dataB.getTime();
    });
    
    console.log(`📚 Encontradas ${revisoesTotais.length} revisões/agendamentos`);
    res.json(revisoesTotais);
    
  } catch (error) {
    console.error('Erro ao buscar revisões:', error);
    res.status(500).json({ message: 'Erro ao buscar revisões.' });
  }
});

// Remover tópico das revisões
app.delete('/api/revisoes/:id', protect, async (req, res) => {
  try {
    const revisao = await Revisao.findOneAndUpdate(
      { _id: req.params.id, usuario: req.user._id },
      { ativo: false, dataFinalizacao: new Date() },
      { new: true }
    );
    
    if (!revisao) {
      return res.status(404).json({ message: 'Revisão não encontrada.' });
    }
    
    console.log(`✅ Tópico "${revisao.topico}" removido das revisões`);
    res.json({ message: 'Tópico removido das revisões com sucesso.' });
    
  } catch (error) {
    console.error('Erro ao remover tópico das revisões:', error);
    res.status(500).json({ message: 'Erro ao remover tópico das revisões.' });
  }
});

// Buscar estatísticas de uma disciplina
app.get('/api/disciplina/:id/estatisticas', protect, async (req, res) => {
  try {
    const disciplinaId = req.params.id;
    
    // Buscar a disciplina nos planos do usuário (snapshot)
    const planos = await Plano.find({ usuario: req.user.id });
    let disciplinaEncontrada = null;
    
    for (const plano of planos) {
      for (const edital of plano.editais) {
        for (const disciplina of edital.disciplinas) {
          if (disciplina._id.toString() === disciplinaId) {
            disciplinaEncontrada = disciplina;
            break;
          }
        }
        if (disciplinaEncontrada) break;
      }
      if (disciplinaEncontrada) break;
    }
    
    if (!disciplinaEncontrada) {
      return res.status(404).json({ message: 'Disciplina não encontrada nos seus planos.' });
    }

    // Buscar registros de estudo desta disciplina para o usuário
    const registros = await RegistroEstudo.find({
      usuario: req.user.id,
      disciplina: disciplinaId
    }).sort({ createdAt: -1 });

    // Calcular estatísticas dinamicamente baseadas nos registros
    const tempoTotal = registros.reduce((acc, reg) => acc + reg.tempoEstudo, 0);
    const questoesTotais = registros.reduce((acc, reg) => acc + (reg.questoesRealizadas || 0), 0);
    const topicosUnicos = new Set(registros.filter(r => r.topico).map(r => r.topico)).size;

    res.json({
      disciplina: {
        ...disciplinaEncontrada,
        _id: disciplinaId,
        tempoTotalEstudo: tempoTotal,
        questoesResolvidas: questoesTotais,
        topicosEstudados: topicosUnicos
      },
      registrosRecentes: registros.slice(0, 5)
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas da disciplina:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar estatísticas.' });
  }
});

app.get('/api/admin/planos', protect, isAdmin, async (req, res) => {
  try {
    const planos = await Plano.find()
      .populate('usuario', 'nome sobrenome email')
      .populate('disciplinas.disciplina', 'nome categoria')
      .sort({ createdAt: -1 });
    res.json(planos);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar planos.' });
  }
});

app.get('/api/admin/registros-estudo', protect, isAdmin, async (req, res) => {
  try {
    const registros = await RegistroEstudo.find()
      .populate('usuario', 'nome sobrenome email')
      .populate('disciplina', 'nome categoria')
      .sort({ createdAt: -1 });
    res.json(registros);
  } catch (error) {
    console.error('Erro ao buscar registros de estudo:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar registros de estudo.' });
  }
});

app.get('/api/admin/revisoes', protect, isAdmin, async (req, res) => {
  try {
    const revisoes = await Revisao.find()
      .populate('usuario', 'nome sobrenome email')
      .sort({ createdAt: -1 });
    res.json(revisoes);
  } catch (error) {
    console.error('Erro ao buscar revisões:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar revisões.' });
  }
});

// === ROTAS PARA TIMERS ATIVOS ===

// Buscar todos os timers ativos do usuário
app.get('/api/timers-ativos', protect, async (req, res) => {
  try {
    const timers = await TimerAtivo.find({ usuario: req.user.id });
    res.json({ success: true, timers });
  } catch (error) {
    console.error('Erro ao buscar timers ativos:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar timers ativos' });
  }
});

// Buscar timer específico
app.get('/api/timers-ativos/:planoId/:disciplinaId/:topico/:indice?', protect, async (req, res) => {
  try {
    const { planoId, disciplinaId, topico } = req.params;
    const indice = parseInt(req.params.indice) || 0;

    const timer = await TimerAtivo.findOne({
      usuario: req.user.id,
      plano: planoId,
      disciplinaId: disciplinaId,
      topico: topico,
      indice: indice
    });

    res.json({ success: true, timer });
  } catch (error) {
    console.error('Erro ao buscar timer:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar timer' });
  }
});

// Criar ou atualizar timer
app.post('/api/timers-ativos', protect, async (req, res) => {
  try {
    const {
      planoId,
      disciplinaId,
      topico,
      indice = 0,
      tempo = 0,
      ativo = false,
      disciplinaNome = '',
      sessaoId = null
    } = req.body;

    // Buscar timer existente
    let timer = await TimerAtivo.findOne({
      usuario: req.user.id,
      plano: planoId,
      disciplinaId: disciplinaId,
      topico: topico,
      indice: indice
    });

    if (timer) {
      // Atualizar timer existente
      timer.tempo = tempo;
      timer.ativo = ativo;
      timer.disciplinaNome = disciplinaNome || timer.disciplinaNome;
      timer.sessaoId = sessaoId || timer.sessaoId;
      timer.ultimoSalvamento = new Date();
      timer.dataUltimaAtualizacao = new Date();
      await timer.save();
    } else {
      // Criar novo timer
      timer = new TimerAtivo({
        usuario: req.user.id,
        plano: planoId,
        disciplinaId: disciplinaId,
        topico: topico,
        indice: indice,
        tempo: tempo,
        ativo: ativo,
        disciplinaNome: disciplinaNome,
        sessaoId: sessaoId,
        dataInicio: new Date(),
        ultimoSalvamento: new Date(),
        dataUltimaAtualizacao: new Date()
      });
      await timer.save();
    }

    res.json({ success: true, timer });
  } catch (error) {
    console.error('Erro ao salvar timer:', error);
    res.status(500).json({ success: false, message: 'Erro ao salvar timer' });
  }
});

// Atualizar tempo de timer específico
app.put('/api/timers-ativos/:planoId/:disciplinaId/:topico/:indice', protect, async (req, res) => {
  try {
    const { planoId, disciplinaId, topico, indice } = req.params;
    const { tempo, ativo } = req.body;

    const timer = await TimerAtivo.findOne({
      usuario: req.user.id,
      plano: planoId,
      disciplinaId: disciplinaId,
      topico: topico,
      indice: parseInt(indice)
    });

    if (!timer) {
      return res.status(404).json({ success: false, message: 'Timer não encontrado' });
    }

    if (tempo !== undefined) timer.tempo = tempo;
    if (ativo !== undefined) timer.ativo = ativo;
    timer.ultimoSalvamento = new Date();
    timer.dataUltimaAtualizacao = new Date();

    await timer.save();
    res.json({ success: true, timer });
  } catch (error) {
    console.error('Erro ao atualizar timer:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar timer' });
  }
});

// Pausar todos os timers ativos do usuário
app.put('/api/timers-ativos/pausar-todos', protect, async (req, res) => {
  try {
    const result = await TimerAtivo.updateMany(
      { usuario: req.user.id, ativo: true },
      {
        ativo: false,
        dataUltimaAtualizacao: new Date()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} timers pausados`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Erro ao pausar timers:', error);
    res.status(500).json({ success: false, message: 'Erro ao pausar timers' });
  }
});

// Excluir timer específico
app.delete('/api/timers-ativos/:planoId/:disciplinaId/:topico/:indice', protect, async (req, res) => {
  try {
    const { planoId, disciplinaId, topico, indice } = req.params;

    const result = await TimerAtivo.deleteOne({
      usuario: req.user.id,
      plano: planoId,
      disciplinaId: disciplinaId,
      topico: topico,
      indice: parseInt(indice)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Timer não encontrado' });
    }

    res.json({ success: true, message: 'Timer excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir timer:', error);
    res.status(500).json({ success: false, message: 'Erro ao excluir timer' });
  }
});

// Buscar tempo total por disciplina
app.get('/api/timers-ativos/total-tempo/:planoId/:disciplinaId', protect, async (req, res) => {
  try {
    const { planoId, disciplinaId } = req.params;

    const timers = await TimerAtivo.find({
      usuario: req.user.id,
      plano: planoId,
      disciplinaId: disciplinaId
    });

    const tempoTotal = timers.reduce((total, timer) => total + timer.tempo, 0);

    res.json({ success: true, tempoTotal });
  } catch (error) {
    console.error('Erro ao calcular tempo total:', error);
    res.status(500).json({ success: false, message: 'Erro ao calcular tempo total' });
  }
});

app.listen(port, () => {
  console.log(`Backend Radegondes rodando em http://localhost:${port}`);
});

