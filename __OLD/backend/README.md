# Backend - Radegondes

## Deploy no Coolify

### Variáveis de Ambiente

```env
MONGO_URI=mongodb://admin:senha@mongo.host.coolify.com:27017/radegondes?authSource=admin
JWT_SECRET=sua_chave_jwt_muito_segura_aqui_com_pelo_menos_32_caracteres
NODE_ENV=production
```

### Configuração

1. Crie novo serviço no Coolify
2. Conecte ao repositório GitHub
3. Configure build directory: `backend`
4. Configure as variáveis de ambiente
5. Deploy

### Porta

Aplicação roda na porta 5000 (default do Express).