import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import AdminRoute from './components/AdminRoute';
import MainLayout from './components/MainLayout';
import FloatingTimer from './components/FloatingTimer/FloatingTimer';
import { useAuth } from './context/AuthContext';
import { TimerProvider } from './context/TimerContext';

import {
  Dashboard,
  Planos,
  NovoPlano,
  PlanoDetalhes,
  DisciplinaDetalhes,
  Disciplinas,
  Revisoes,
  Historico,
  Estatisticas,
  AdminDashboard,
  GerenciarUsuarios,
  Categorias,
  DisciplinasAdmin,
  Instituicoes,
  Editais
} from './pages';

import DisciplinaDetalhesWithBreadcrumb from './pages/user/DisciplinaDetalhesWithBreadcrumb';
import PlanoDetalhesWithBreadcrumb from './pages/user/PlanoDetalhesWithBreadcrumb';

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando autenticação...</div>;
  }

  return (
    <TimerProvider>
      <Routes>
      <Route path="/" element={<PublicRoute><LoginForm /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterForm /></PublicRoute>} />
      
      <Route path="/dashboard" element={
        <PrivateRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </PrivateRoute>
      } />
      <Route path="/planos" element={
        <PrivateRoute>
          <MainLayout>
            <Planos />
          </MainLayout>
        </PrivateRoute>
      } />
      <Route path="/planos/novo" element={
        <PrivateRoute>
          <MainLayout>
            <NovoPlano />
          </MainLayout>
        </PrivateRoute>
      } />
      <Route path="/planos/:id" element={
        <PrivateRoute>
          <PlanoDetalhesWithBreadcrumb />
        </PrivateRoute>
      } />
      <Route path="/planos/:planoId/disciplinas/:disciplinaId" element={
        <PrivateRoute>
          <DisciplinaDetalhesWithBreadcrumb />
        </PrivateRoute>
      } />
      <Route path="/disciplinas" element={
        <PrivateRoute>
          <MainLayout>
            <Disciplinas />
          </MainLayout>
        </PrivateRoute>
      } />
      <Route path="/revisoes" element={
        <PrivateRoute>
          <MainLayout>
            <Revisoes />
          </MainLayout>
        </PrivateRoute>
      } />
      <Route path="/historico" element={
        <PrivateRoute>
          <MainLayout>
            <Historico />
          </MainLayout>
        </PrivateRoute>
      } />
      <Route path="/estatisticas" element={
        <PrivateRoute>
          <MainLayout>
            <Estatisticas />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/admin" element={
        <AdminRoute>
          <MainLayout>
            <AdminDashboard />
          </MainLayout>
        </AdminRoute>
      } />
      <Route path="/admin/usuarios" element={
        <AdminRoute>
          <MainLayout>
            <GerenciarUsuarios />
          </MainLayout>
        </AdminRoute>
      } />
      <Route path="/admin/categorias" element={
        <AdminRoute>
          <MainLayout>
            <Categorias />
          </MainLayout>
        </AdminRoute>
      } />
      <Route path="/admin/disciplinas" element={
        <AdminRoute>
          <MainLayout>
            <DisciplinasAdmin />
          </MainLayout>
        </AdminRoute>
      } />
      <Route path="/admin/instituicoes" element={
        <AdminRoute>
          <MainLayout>
            <Instituicoes />
          </MainLayout>
        </AdminRoute>
      } />
      <Route path="/admin/editais" element={
        <AdminRoute>
          <MainLayout>
            <Editais />
          </MainLayout>
        </AdminRoute>
      } />

      </Routes>
      <FloatingTimer />
    </TimerProvider>
  );
}

export default App;
