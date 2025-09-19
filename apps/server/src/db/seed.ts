import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const generateRandomDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 14) + 6);
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
};

const main = async () => {
  const client = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const existingUser = await client.query(
      'SELECT id FROM "user" WHERE email = $1',
      ['aluno@radegondes.com']
    );

    let userId: string;
    if (existingUser.rows.length > 0) {
      await client.query('DELETE FROM account WHERE "user_id" = $1', [existingUser.rows[0].id]);
      await client.query('DELETE FROM "user" WHERE id = $1', [existingUser.rows[0].id]);
    }

    userId = crypto.randomUUID();
    const hashedPassword = "f2a911b03ba5e6dd60ba5269fc1c2a26:098d7c6c05cc6af9a9ac11ca8e337ef25bbabdf4682e5dddbc889f04c7d77e9a75c90076a5898927b7b39e0bba97d649c733a71e06e6b4aa5c05b0bba6f1e659";

    await client.query(
      'INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, 'Aluno Radegondes', 'aluno@radegondes.com', true, null, new Date(), new Date()]
    );

    await client.query(
      'INSERT INTO account (id, "account_id", "provider_id", "user_id", password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [crypto.randomUUID(), userId, 'credential', userId, hashedPassword, new Date(), new Date()]
    );

    const studyId = crypto.randomUUID();
    await client.query(
      'INSERT INTO study (id, name, description, "user_id", created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [studyId, 'Concurso Público - Edital 2024', 'Preparação para concurso público com foco em disciplinas jurídicas e administrativas', userId, new Date(), new Date()]
    );

    const disciplines = [
      { name: 'Direito Constitucional' },
      { name: 'Direito Administrativo' },
      { name: 'Direito Processual Civil' },
      { name: 'Direito do Trabalho' },
      { name: 'Administração Pública' },
      { name: 'Legislação Específica' }
    ];

    const disciplineIds: string[] = [];
    for (const discipline of disciplines) {
      const disciplineId = crypto.randomUUID();
      disciplineIds.push(disciplineId);
      await client.query(
        'INSERT INTO discipline (id, name, "study_id", created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
        [disciplineId, discipline.name, studyId, new Date(), new Date()]
      );
    }

    const topics = [
      { disciplineIndex: 0, name: 'Princípios Fundamentais', status: 'completed', correct: 15, wrong: 3 },
      { disciplineIndex: 0, name: 'Direitos e Garantias Fundamentais', status: 'in_progress', correct: 8, wrong: 5 },
      { disciplineIndex: 0, name: 'Organização do Estado', status: 'not_started', correct: 0, wrong: 0 },
      { disciplineIndex: 0, name: 'Poder Executivo', status: 'not_started', correct: 0, wrong: 0 },
      { disciplineIndex: 1, name: 'Atos Administrativos', status: 'completed', correct: 12, wrong: 2 },
      { disciplineIndex: 1, name: 'Licitações e Contratos', status: 'in_progress', correct: 6, wrong: 7 },
      { disciplineIndex: 1, name: 'Controle da Administração', status: 'not_started', correct: 0, wrong: 0 },
      { disciplineIndex: 1, name: 'Responsabilidade Civil do Estado', status: 'not_started', correct: 0, wrong: 0 },
      { disciplineIndex: 2, name: 'Jurisdição e Competência', status: 'completed', correct: 18, wrong: 4 },
      { disciplineIndex: 2, name: 'Processo de Conhecimento', status: 'in_progress', correct: 10, wrong: 6 },
      { disciplineIndex: 2, name: 'Recursos', status: 'not_started', correct: 0, wrong: 0 },
      { disciplineIndex: 2, name: 'Execução', status: 'not_started', correct: 0, wrong: 0 },
      { disciplineIndex: 3, name: 'Contrato de Trabalho', status: 'completed', correct: 14, wrong: 3 },
      { disciplineIndex: 3, name: 'Jornada de Trabalho', status: 'in_progress', correct: 7, wrong: 4 },
      { disciplineIndex: 3, name: 'Consolidação das Leis do Trabalho', status: 'not_started', correct: 0, wrong: 0 },
      { disciplineIndex: 4, name: 'Princípios da Administração', status: 'completed', correct: 16, wrong: 2 },
      { disciplineIndex: 4, name: 'Estrutura Administrativa', status: 'in_progress', correct: 9, wrong: 5 },
      { disciplineIndex: 4, name: 'Servidores Públicos', status: 'not_started', correct: 0, wrong: 0 },
      { disciplineIndex: 5, name: 'Estatuto do Idoso', status: 'completed', correct: 13, wrong: 1 },
      { disciplineIndex: 5, name: 'Lei Orgânica Municipal', status: 'in_progress', correct: 5, wrong: 3 },
      { disciplineIndex: 5, name: 'Código de Trânsito Brasileiro', status: 'not_started', correct: 0, wrong: 0 }
    ];

    const topicIds: string[] = [];
    for (const topic of topics) {
      const topicId = crypto.randomUUID();
      topicIds.push(topicId);
      await client.query(
        'INSERT INTO topic (id, name, "discipline_id", status, notes, correct, wrong, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          topicId,
          topic.name,
          disciplineIds[topic.disciplineIndex],
          topic.status,
          `Estudo e prática de ${topic.name.toLowerCase()} para concurso público.`,
          topic.correct,
          topic.wrong,
          new Date(),
          new Date()
        ]
      );
    }

    const sessionTypes = ['study', 'practice', 'review'];
    for (let i = 0; i < 45; i++) {
      const topicIndex = Math.floor(Math.random() * topicIds.length);
      const topicId = topicIds[topicIndex];
      const daysAgo = Math.floor(Math.random() * 28);
      const startTime = generateRandomDate(daysAgo);
      const duration = (Math.floor(Math.random() * 178) + 2) * 60000;
      const endTime = new Date(startTime.getTime() + duration);
      const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];

      await client.query(
        'INSERT INTO time_session (id, "topic_id", "start_time", "end_time", duration, "session_type", created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          crypto.randomUUID(),
          topicId,
          startTime,
          endTime,
          duration,
          sessionType,
          new Date()
        ]
      );
    }

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.end();
  }
};

main();