const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Plano = require('../models/Plano');
const Edital = require('../models/Edital');
const jwt = require('jsonwebtoken');

describe('Disciplinas Routes', () => {
  let authToken;
  let userId;
  let planoPersonalizadoId;
  let planoNormalId;
  let editalPersonalizadoId;

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
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Plano.deleteMany({});
    await Edital.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Plano.deleteMany({});
    
    const planoPersonalizado = await Plano.create({
      nome: 'Plano Personalizado',
      descricao: 'Plano personalizado para testes',
      usuario: userId,
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
    planoPersonalizadoId = planoPersonalizado._id;
    
    const planoNormal = await Plano.create({
      nome: 'Plano Normal',
      descricao: 'Plano normal para testes',
      usuario: userId,
      editais: [{
        nome: 'Edital Normal',
        instituicao: {
          nome: 'Instituição Teste',
          sigla: 'IT',
          _id: new mongoose.Types.ObjectId()
        },
        disciplinas: []
      }],
      totalDisciplinas: 0,
      totalTopicos: 0
    });
    planoNormalId = planoNormal._id;
  });

  describe('POST /api/planos/:planoId/disciplinas', () => {
    it('should add discipline to personalized plan', async () => {
      const disciplinaData = {
        nome: 'Matemática',
        cor: '#FF5733',
        topicos: ['Álgebra', 'Geometria', 'Trigonometria']
      };

      const response = await request(app)
        .post(`/api/planos/${planoPersonalizadoId}/disciplinas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(disciplinaData);

      expect(response.status).toBe(201);
      expect(response.body.disciplinasDetalhadas).toHaveLength(1);
      expect(response.body.disciplinasDetalhadas[0].nome).toBe('Matemática');
      expect(response.body.disciplinasDetalhadas[0].cor).toBe('#FF5733');
      expect(response.body.disciplinasDetalhadas[0].topicos).toHaveLength(3);
      expect(response.body.totalDisciplinas).toBe(1);
      expect(response.body.totalTopicos).toBe(3);
    });

    it('should add discipline to normal plan', async () => {
      const disciplinaData = {
        nome: 'Português',
        cor: '#33FF57',
        topicos: ['Gramática', 'Literatura']
      };

      const response = await request(app)
        .post(`/api/planos/${planoNormalId}/disciplinas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(disciplinaData);

      expect(response.status).toBe(201);
      expect(response.body.disciplinasDetalhadas).toHaveLength(1);
      expect(response.body.disciplinasDetalhadas[0].nome).toBe('Português');
      expect(response.body.disciplinasDetalhadas[0].topicos).toHaveLength(2);
    });

    it('should add discipline with default color when not provided', async () => {
      const disciplinaData = {
        nome: 'História',
        topicos: ['Brasil Colônia', 'Brasil Império']
      };

      const response = await request(app)
        .post(`/api/planos/${planoPersonalizadoId}/disciplinas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(disciplinaData);

      expect(response.status).toBe(201);
      expect(response.body.disciplinasDetalhadas[0].cor).toBe('azul');
    });

    it('should add discipline with empty topics when not provided', async () => {
      const disciplinaData = {
        nome: 'Geografia',
        cor: '#5733FF'
      };

      const response = await request(app)
        .post(`/api/planos/${planoPersonalizadoId}/disciplinas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(disciplinaData);

      expect(response.status).toBe(201);
      expect(response.body.disciplinasDetalhadas[0].topicos).toHaveLength(0);
      expect(response.body.totalTopicos).toBe(0);
    });

    it('should add multiple disciplines to same plan', async () => {
      const disciplina1 = {
        nome: 'Física',
        cor: '#FF3357',
        topicos: ['Mecânica', 'Termodinâmica']
      };

      const disciplina2 = {
        nome: 'Química',
        cor: '#57FF33',
        topicos: ['Orgânica', 'Inorgânica', 'Físico-Química']
      };

      await request(app)
        .post(`/api/planos/${planoPersonalizadoId}/disciplinas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(disciplina1);

      const response = await request(app)
        .post(`/api/planos/${planoPersonalizadoId}/disciplinas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(disciplina2);

      expect(response.status).toBe(201);
      expect(response.body.disciplinasDetalhadas).toHaveLength(2);
      expect(response.body.totalDisciplinas).toBe(2);
      expect(response.body.totalTopicos).toBe(5);
    });

    it('should create EditalPersonalizado structure for plan without editais', async () => {
      const planoSemEditais = await Plano.create({
        nome: 'Plano Sem Editais',
        descricao: 'Plano sem estrutura de editais',
        usuario: userId,
        editais: [],
        totalDisciplinas: 0,
        totalTopicos: 0
      });

      const disciplinaData = {
        nome: 'Biologia',
        cor: '#FF5733',
        topicos: ['Citologia', 'Genética']
      };

      const response = await request(app)
        .post(`/api/planos/${planoSemEditais._id}/disciplinas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(disciplinaData);

      expect(response.status).toBe(201);
      expect(response.body.editais).toHaveLength(1);
      expect(response.body.editais[0].nome).toBe('EditalPersonalizado');
      expect(response.body.disciplinasDetalhadas).toHaveLength(1);
    });

    it('should fail with 404 when plan not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const disciplinaData = {
        nome: 'Disciplina Teste',
        cor: '#FF5733'
      };

      const response = await request(app)
        .post(`/api/planos/${fakeId}/disciplinas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(disciplinaData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Plano não encontrado.');
    });

    it('should fail with 404 when trying to access another user plan', async () => {
      const otherUser = await User.create({
        nome: 'Other',
        sobrenome: 'User',
        email: 'other@example.com',
        password: 'password123'
      });

      const otherUserPlan = await Plano.create({
        nome: 'Plano de Outro Usuário',
        usuario: otherUser._id,
        editais: [],
        totalDisciplinas: 0,
        totalTopicos: 0
      });

      const disciplinaData = {
        nome: 'Disciplina Não Autorizada',
        cor: '#FF5733'
      };

      const response = await request(app)
        .post(`/api/planos/${otherUserPlan._id}/disciplinas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(disciplinaData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Plano não encontrado.');

      await User.findByIdAndDelete(otherUser._id);
      await Plano.findByIdAndDelete(otherUserPlan._id);
    });

    it('should fail with 401 when no auth token provided', async () => {
      const disciplinaData = {
        nome: 'Disciplina Sem Auth',
        cor: '#FF5733'
      };

      const response = await request(app)
        .post(`/api/planos/${planoPersonalizadoId}/disciplinas`)
        .send(disciplinaData);

      expect(response.status).toBe(401);
    });

    it('should handle mongoose validation errors gracefully', async () => {
      const disciplinaData = {
        nome: '',
        cor: '#FF5733'
      };

      const response = await request(app)
        .post(`/api/planos/${planoPersonalizadoId}/disciplinas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(disciplinaData);

      expect(response.status).toBe(201);
    });

    it('should update plan statistics correctly', async () => {
      const disciplina1 = {
        nome: 'Disciplina 1',
        topicos: ['Tópico 1', 'Tópico 2']
      };

      const disciplina2 = {
        nome: 'Disciplina 2',
        topicos: ['Tópico 3', 'Tópico 4', 'Tópico 5']
      };

      await request(app)
        .post(`/api/planos/${planoPersonalizadoId}/disciplinas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(disciplina1);

      const response = await request(app)
        .post(`/api/planos/${planoPersonalizadoId}/disciplinas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(disciplina2);

      expect(response.body.totalDisciplinas).toBe(2);
      expect(response.body.totalTopicos).toBe(5);
      expect(response.body.disciplinas).toBe(2);
      expect(response.body.topicos).toBe(5);
    });
  });
});