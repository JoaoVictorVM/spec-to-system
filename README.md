# Spec-To-System

Aplicação web que recebe a descrição de um sistema desejado e, com auxílio de IA, retorna recomendações técnicas completas: arquitetura, stack, banco de dados, segurança, deploy, escalabilidade e mais.

O usuário fornece sua própria chave de API do provedor de IA (OpenAI, Anthropic ou Google Gemini). A chave **nunca é enviada ao backend** e **nunca é persistida** — fica apenas em memória no frontend durante a sessão.

## Estrutura

```
spec-to-system/
├── frontend/   # React + Vite + TypeScript + TailwindCSS
└── backend/    # NestJS + Prisma + PostgreSQL
```

Os dois projetos são independentes, cada um com seu próprio `package.json`.

## Stack

| Camada         | Tecnologia                                |
| -------------- | ----------------------------------------- |
| Frontend       | React + Vite + TypeScript                 |
| Estilização    | TailwindCSS (apenas variáveis CSS)        |
| Backend        | NestJS + TypeScript                       |
| ORM            | Prisma                                    |
| Banco de Dados | PostgreSQL                                |
| Testes         | Vitest (frontend) + Jest/Supertest (back) |
| Deploy         | Vercel (frontend) + Railway (back + DB)   |

## Pré-requisitos

- Node.js 22.x (LTS)
- pnpm 9.x ou superior
- PostgreSQL 16.x rodando localmente

## Setup

Instruções completas de setup serão adicionadas conforme o projeto avança. Por enquanto:

```bash
# Backend
cd backend
pnpm install
cp .env.example .env  # ajustar variáveis
pnpm prisma migrate dev
pnpm start:dev

# Frontend
cd frontend
pnpm install
cp .env.example .env  # ajustar variáveis
pnpm dev
```

