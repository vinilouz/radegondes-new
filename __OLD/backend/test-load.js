// Script de teste para verificar se há erros no index.js
console.log('Iniciando teste de carregamento...');

try {
  console.log('Tentando carregar o index.js...');
  require('./index.js');
  console.log('Arquivo carregado com sucesso!');
} catch (error) {
  console.error('ERRO ao carregar index.js:');
  console.error('Mensagem:', error.message);
  console.error('Stack:', error.stack);
  console.error('Linha aproximada:', error.stack.split('\n')[1]);
}
