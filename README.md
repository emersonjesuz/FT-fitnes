# PT Pro — Sistema para Personal Trainer

Sistema web completo para personal trainers gerenciarem alunos e montarem treinos personalizados.

## ✨ Funcionalidades

- **Login automático** — Cria conta ao primeiro acesso, sem precisar de cadastro
- **Dashboard** — Gráficos com métricas de alunos e treinos (Recharts)
- **Alunos** — Cadastro completo com biotipo, métricas físicas, histórico de peso
- **Treinos** — Fichas detalhadas por dia da semana, com exercícios personalizados
- **Exportação** — Excel (XLSX), JSON, Texto e DOCX para cada treino
- **Responsivo** — Sidebar adaptável para mobile e desktop
- **100% frontend** — Dados salvos em `localStorage`, sem banco de dados

## 🛠 Tecnologias

| Tech | Uso |
|---|---|
| Next.js 14 (App Router) | Framework principal |
| React 18 + TypeScript | UI e tipagem |
| TailwindCSS | Estilos |
| Recharts | Gráficos do dashboard |
| xlsx | Exportação Excel |
| docx | Exportação Word (.docx) |
| Syne + Inter | Tipografia |

## 🚀 Como rodar localmente

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/personal-trainer-system
cd personal-trainer-system

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

### Build de produção

```bash
npm run build
npm start
```

## ☁️ Deploy na Vercel

### Opção 1: Via GitHub (recomendado)

1. Faça push do projeto para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) e clique em **"Add New Project"**
3. Importe seu repositório GitHub
4. Vercel detecta automaticamente Next.js — clique em **"Deploy"**
5. Aguarde o deploy (< 2 min)

### Opção 2: Via CLI

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Na pasta do projeto
vercel

# Para deploy de produção
vercel --prod
```

### Variáveis de ambiente

Não há variáveis de ambiente necessárias — o projeto usa apenas `localStorage`.

## 📁 Estrutura do projeto

```
/app
  /login          → Tela de login com criação automática de conta
  /dashboard      → Home com gráficos e métricas
  /students       → Lista, cadastro e edição de alunos
  /workouts       → Lista, criação e visualização de treinos

/components
  /layout
    Sidebar.tsx   → Sidebar responsiva com navegação

/hooks
  useAuth.ts      → Hook de autenticação e proteção de rotas

/lib
  storage.ts      → Camada de dados (localStorage)
  exports.ts      → Funções de exportação (XLSX, JSON, TXT, DOCX)

/types
  index.ts        → Tipos TypeScript (User, Student, Workout, Exercise...)
```

## 🔒 Segurança

- Cada usuário vê apenas seus próprios dados (filtrado por `userId`)
- Senhas armazenadas em `localStorage` (recomendável não usar dados sensíveis reais em produção sem backend)

## 📊 Dados

Todos os dados são persistidos no `localStorage` do navegador:
- `pt_users` — Usuários cadastrados
- `pt_students` — Alunos (filtrados por userId)
- `pt_workouts` — Treinos (filtrados por userId)
- `pt_current_user` — Sessão atual

> **Nota:** Os dados são por dispositivo/navegador. Para persistência real, substitua `lib/storage.ts` por chamadas a uma API com banco de dados.

## 🎨 Design System

- **Tema:** Dark mode
- **Paleta:** Laranja (brand) + tons de cinza escuro
- **Fontes:** Syne (display/títulos) + Inter (corpo)
- **Componentes:** Cards, modais, inputs com classes utilitárias via Tailwind
