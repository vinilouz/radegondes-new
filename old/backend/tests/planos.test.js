const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Plano = require('../models/Plano');
const Edital = require('../models/Edital');
const Disciplina = require('../models/Disciplina');
const jwt = require('jsonwebtoken');

describe('Planos Routes', () => {
  let authToken;
  let userId;
  let editalPersonalizadoId;
  let normalEditalId;
  let disciplinaId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/radegondes_test');
    
    const user = await User.create({
      nome: 'Test',
      sobrenome: 'User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    userId = user._id;
    authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'test_secret');
    
    const editalPersonalizado = await Edital.create({
      nome: 'EditalPersonalizado'
    });
    editalPersonalizadoId = editalPersonalizado._id;
    
    const normalEdital = await Edital.create({
      nome: 'Edital Normal'
    });
    normalEditalId = normalEdital._id;
    
    const disciplina = await Disciplina.create({
      nome: 'Matemática',
      cor: '#FF5733',
      edital: normalEditalId,
      topicos: ['Álgebra', 'Geometria']
    });
    disciplinaId = disciplina._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Plano.deleteMany({});
    await Edital.deleteMany({});
    await Disciplina.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Plano.deleteMany({});
  });

  describe('POST /api/planos - Personalized Study Creation', () => {
    it('should create personalized study when EditalPersonalizado exists', async () => {
      const response = await request(app)
        .post('/api/planos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Plano Personalizado',
          descricao: 'Meu plano personalizado'
        });

      expect(response.status).toBe(201);
      expect(response.body.nome).toBe('Plano Personalizado');
      expect(response.body.usuario).toBe(userId.toString());
      expect(response.body.editais).toHaveLength(1);
      expect(response.body.editais[0].nome).toBe('EditalPersonalizado');
    });

    it('should create personalized study with alternative name "Estudo Personalizado"', async () => {
      const response = await request(app)
        .post('/api/planos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Estudo Personalizado'
        });

      expect(response.status).toBe(201);
      expect(response.body.nome).toBe('Estudo Personalizado');
      expect(response.body.editais[0].nome).toBe('EditalPersonalizado');
    });

    it('should fail with 500 when EditalPersonalizado does not exist', async () => {
      await Edital.deleteOne({ nome: 'EditalPersonalizado' });
      
      const response = await request(app)
        .post('/api/planos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Plano Personalizado'
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Erro interno: EditalPersonalizado não configurado.');
    });

    it('should fail with 400 when nome is missing', async () => {
      const response = await request(app)
        .post('/api/planos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          descricao: 'Plano sem nome'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Nome e cargos são obrigatórios.');
    });

    it('should fail with 401 when no auth token provided', async () => {
      const response = await request(app)
        .post('/api/planos')
        .send({
          nome: 'Plano Personalizado'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/planos - Normal Study Creation', () => {
    it('should create normal study plan with cargos', async () => {
      const response = await request(app)
        .post('/api/planos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Plano Normal',
          descricao: 'Plano com cargos',
          cargos: [{
            cargo: 'Edital Normal',
            instituicao: {
              nome: 'Instituição Teste',
              sigla: 'IT',
              _id: new mongoose.Types.ObjectId()
            }
          }]
        });

      expect(response.status).toBe(201);
      expect(response.body.nome).toBe('Plano Normal');
      expect(response.body.editais).toHaveLength(1);
      expect(response.body.totalDisciplinas).toBeGreaterThanOrEqual(0);
    });

    it('should fail with 400 when cargos is empty for normal plan', async () => {
      const response = await request(app)
        .post('/api/planos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Plano Sem Cargos',
          cargos: []
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Nome e cargos são obrigatórios.');
    });
  });

  describe('GET /api/planos', () => {
    beforeEach(async () => {
      await Plano.create({
        nome: 'Plano Teste',
        descricao: 'Descrição teste',
        usuario: userId,
        editais: [],
        totalDisciplinas: 0,
        totalTopicos: 0
      });
    });

    it('should list user plans', async () => {
      const response = await request(app)
        .get('/api/planos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].nome).toBe('Plano Teste');
    });

    it('should fail with 401 when no auth token provided', async () => {
      const response = await request(app)
        .get('/api/planos');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/planos/:id', () => {
    let planoId;

    beforeEach(async () => {
      const plano = await Plano.create({
        nome: 'Plano Específico',
        descricao: 'Descrição específica',
        usuario: userId,
        editais: [],
        totalDisciplinas: 0,
        totalTopicos: 0
      });
      planoId = plano._id;
    });

    it('should get specific plan by id', async () => {
      const response = await request(app)
        .get(`/api/planos/${planoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Plano Específico');
      expect(response.body._id).toBe(planoId.toString());
    });

    it('should fail with 404 when plan not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/planos/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Plano não encontrado.');
    });

    it('should fail with 401 when no auth token provided', async () => {
      const response = await request(app)
        .get(`/api/planos/${planoId}`);

      expect(response.status).toBe(401);
    });
  });
});