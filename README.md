# Presença GPS - PWA

Sistema robusto de controle de presença por GPS com validação servidor-side.

## 🎯 Características

- ✅ **Web-first PWA**: Funciona primariamente como website/PWA
- ✅ **Autenticação Email/Senha**: Sem dependência de OAuth externo
- ✅ **Domínios Institucionais**: Registro restrito por domínio
- ✅ **Lista de Agendas**: Exibição robusta com tratamento de erros
- ✅ **Check-in GPS**: Validação server-side de localização
- ✅ **Idempotência**: Uma presença por usuário por atividade
- ✅ **Defensive Programming**: Tratamento completo de erros

## 🚀 Tecnologias

**Frontend:**
- React 18 + TypeScript
- React Router v6
- TanStack Query (React Query)
- Tailwind CSS
- Vite + PWA Plugin

**Backend:**
- Node.js + Express
- tRPC (type-safe API)
- MySQL + Drizzle ORM
- JWT (jose)
- bcrypt

## 📋 Requisitos

- Node.js 20+
- MySQL 8.0+ ou MariaDB 10.6+
- npm ou pnpm

## ⚙️ Configuração

### 1. Clone e instale

```bash
npm install
```

### 2. Configure variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/presenca_gps

# JWT
JWT_SECRET=sua-chave-secreta-minimo-32-caracteres-aqui

# Server
PORT=3000
NODE_ENV=development

# Frontend (usado pelo Vite)
VITE_API_BASE_URL=http://localhost:3000

# Domínios permitidos para registro (separados por vírgula)
ALLOWED_EMAIL_DOMAINS=unifacig.edu.br,aluno.unifacig.edu.br

# GPS Validation
GPS_ACCURACY_THRESHOLD=50
GPS_DISTANCE_THRESHOLD=100
```

### 3. Configure o banco de dados

```bash
# Criar tabelas
npm run db:push

# (Opcional) Abrir interface visual
npm run db:studio
```

### 4. Execute

```bash
# Desenvolvimento (frontend + backend)
npm run dev

# Produção
npm run build
npm start
```

## 🌐 Acessar

- **Frontend**: http://localhost:5173 (dev) ou http://localhost:3000 (prod)
- **API**: http://localhost:3000/api

## 📱 PWA

O app funciona como Progressive Web App:
- Instalável no dispositivo
- Funciona offline (com cache)
- Ícones e splash screens configurados
- Service Worker ativo

## 🔒 Segurança

- Senhas com bcrypt (salt rounds: 10)
- JWT com expiração configurável
- CORS configurado
- Cookies httpOnly + secure em produção
- Validação de domínio no registro
- Rate limiting recomendado (adicionar em produção)

## 🧪 Testes

```bash
npm test
```

## 📁 Estrutura

```
presenca-gps-pwa/
├── src/
│   ├── client/              # Frontend React
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas/rotas
│   │   ├── lib/             # Utilitários e configuração
│   │   ├── hooks/           # React hooks customizados
│   │   └── main.tsx         # Entry point
│   │
│   ├── server/              # Backend Node.js
│   │   ├── db/              # Database schema e queries
│   │   ├── routers/         # tRPC routers
│   │   ├── middleware/      # Express middleware
│   │   ├── lib/             # Utilitários server-side
│   │   └── index.ts         # Server entry point
│   │
│   └── shared/              # Código compartilhado
│       └── types/           # TypeScript types
│
├── public/                  # Assets estáticos
├── dist/                    # Build output
└── drizzle/                 # Migrations
```

## 🚀 Deploy

### Requisitos de Produção

1. **HTTPS obrigatório** - PWA e geolocalização requerem conexão segura
2. **Variáveis de ambiente** - Configure todas as variáveis no servidor
3. **Database** - MySQL/MariaDB configurado e acessível
4. **Node.js** - v20+ instalado

### Plataformas Recomendadas

**Opção 1: Vercel/Netlify (Frontend) + Railway/Render (Backend)**
- Frontend: Deploy do build estático
- Backend: Deploy do servidor Node.js
- Database: PlanetScale, Railway, ou AWS RDS

**Opção 2: VPS (DigitalOcean, AWS, etc)**
```bash
# Build
npm run build

# PM2 para gerenciamento
pm2 start dist/server/index.js --name presenca-gps

# Nginx como reverse proxy
# Configure SSL com Let's Encrypt
```

**Opção 3: Docker**
```bash
docker build -t presenca-gps .
docker run -p 3000:3000 --env-file .env presenca-gps
```

## 📝 Checklist de Teste

### Autenticação
- [ ] Registro com email institucional válido funciona
- [ ] Registro com email não-institucional é rejeitado
- [ ] Login com credenciais corretas funciona
- [ ] Login com credenciais erradas retorna erro apropriado
- [ ] Logout limpa sessão corretamente
- [ ] Token JWT expira e redireciona para login

### Agendas
- [ ] Lista vazia exibe mensagem apropriada
- [ ] Lista com dados exibe cards corretamente
- [ ] Erro de rede exibe botão de retry
- [ ] Carregamento exibe skeleton/spinner
- [ ] Dados inválidos não causam crash

### Check-in GPS
- [ ] Botão desabilitado quando GPS não disponível
- [ ] Localização é coletada corretamente
- [ ] Check-in dentro do raio é aceito
- [ ] Check-in fora do raio é rejeitado
- [ ] Precisão GPS baixa retorna status "pending"
- [ ] Check-in duplicado é bloqueado (idempotência)
- [ ] Erro de rede tem tratamento apropriado

### PWA
- [ ] App pode ser instalado
- [ ] Service worker funciona
- [ ] Funciona offline (páginas cacheadas)
- [ ] Ícones aparecem corretamente

## 🐛 Troubleshooting

**Erro de conexão com banco:**
- Verifique DATABASE_URL no .env
- Teste conexão: `mysql -u user -p -h host database`

**Erro de CORS:**
- Configure CORS no backend para permitir origem do frontend
- Em produção, use domínio real, não localhost

**GPS não funciona:**
- Requer HTTPS em produção
- Usuário precisa permitir acesso à localização
- Verificar permissões no navegador

**Build falha:**
- Limpe node_modules: `rm -rf node_modules && npm install`
- Verifique versão do Node: `node --version` (deve ser 20+)

## 📄 Licença

MIT

## 👥 Suporte

Para questões e suporte, abra uma issue no repositório.
