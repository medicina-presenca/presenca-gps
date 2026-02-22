# 🚀 INÍCIO RÁPIDO - 5 Minutos

## Pré-requisitos Mínimos

- ✅ Node.js 20+ instalado
- ✅ MySQL 8+ rodando
- ✅ 5 minutos de tempo

## Passo a Passo

### 1️⃣ Instalar Dependências (2min)

```bash
npm install
```

### 2️⃣ Configurar Ambiente (1min)

```bash
# Copiar template
cp .env.example .env

# Editar .env (configure estas 3 variáveis essenciais):
# - DATABASE_URL=mysql://user:password@localhost:3306/presenca_gps
# - JWT_SECRET=sua-chave-secreta-minimo-32-caracteres
# - ALLOWED_EMAIL_DOMAINS=unifacig.edu.br,aluno.unifacig.edu.br
nano .env
```

**Gerador de JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3️⃣ Setup Banco de Dados (1min)

```bash
# Criar banco (se não existe)
mysql -u root -p -e "CREATE DATABASE presenca_gps CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Criar tabelas
npm run db:push

# Popular domínios permitidos
npx tsx scripts/seed.ts
```

### 4️⃣ Iniciar Desenvolvimento (1min)

```bash
# Inicia frontend + backend simultaneamente
npm run dev
```

✅ **Pronto!** Abra:
- 🌐 Frontend: **http://localhost:5173**
- 🔌 Backend: **http://localhost:3000**

## 🎯 Teste Rápido

1. **Acesse** http://localhost:5173
2. **Clique** em "Não tem conta? Cadastre-se"
3. **Preencha:**
   - Nome: Seu Nome
   - Email: teste@unifacig.edu.br (domínio deve estar em ALLOWED_EMAIL_DOMAINS)
   - Senha: 123456
   - Tipo: Aluno
4. **Clique** "Criar conta"
5. ✅ Você está logado!

## ❓ Problemas?

### Erro de conexão com banco
```bash
# Verifique se MySQL está rodando
sudo systemctl status mysql

# Teste a conexão
mysql -u user -p -h localhost presenca_gps
```

### Porta 3000 ou 5173 em uso
```bash
# Matar processos
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Email não permitido no registro
```bash
# Adicione o domínio no .env
ALLOWED_EMAIL_DOMAINS=seu-dominio.com,outro-dominio.com

# Re-execute o seed
npx tsx scripts/seed.ts
```

## 📚 Próximos Passos

- 📖 Leia `README.md` para features completas
- 🚀 Leia `DEPLOYMENT.md` para colocar em produção
- 🏗️ Leia `ARCHITECTURE.md` para entender a arquitetura
- 📝 Leia `SUMMARY.md` para resumo executivo

## 🎉 Pronto para Usar!

Você agora tem um sistema completo de presença GPS rodando localmente!

**Testar funcionalidades:**
- Como **Professor**: Crie uma agenda (FAB +)
- Como **Aluno**: Veja suas agendas e faça check-in

**Nota:** GPS só funciona com HTTPS em produção. Em dev (localhost), funciona normalmente.
