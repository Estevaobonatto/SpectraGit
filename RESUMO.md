# Resumo do Projeto: SpectraGit

## 1. Visão Geral

SpectraGit é uma plataforma Git auto-hospedada e de código aberto, inspirada no GitHub. Ela permite que desenvolvedores e organizações implantem sua própria infraestrutura de Git, garantindo controle total sobre seus repositórios, equipes e fluxos de trabalho de revisão de código.

Os princípios fundamentais do projeto são:
- **100% Código Aberto:** Licenciado sob MIT, gratuito para usar e modificar.
- **Auto-hospedado:** O código reside na infraestrutura do usuário, evitando a dependência de serviços em nuvem.
- **Privacidade Focada:** Sem telemetria ou envio de dados para serviços externos.
- **Sem Assinatura:** Todos os recursos estão disponíveis para todos os usuários sem custo.

## 2. Principais Recursos

A plataforma oferece um conjunto abrangente de recursos para gerenciamento de código e colaboração:

- **Operações Git:** Suporte aos protocolos HTTP e SSH, visualizador de árvore de arquivos, histórico de commits e funcionalidade de "blame".
- **Branches e Tags:** Criação, proteção e exclusão de branches; gerenciamento de tags de versão.
- **Issues e Pull Requests:** Quadros de issues, fila de triagem, labels, marcos, atribuições, comentários embutidos e fluxos de trabalho de aprovação.
- **Revisão de Código:** Comentários linha a linha e sugestões de código.
- **Organizações e Permissões:** Suporte para organizações com múltiplos membros, equipes e permissões granulares de repositório.
- **Notificações:** Notificações em tempo real na aplicação via WebSockets e resumos por e-mail.
- **Autenticação:** Suporte para OAuth 2.0 (GitHub, Google), chaves SSH e tokens de API.
- **Painel de Administração:** Gerenciamento de usuários, configurações da instância e um painel de saúde do sistema.

## 3. Pilha de Tecnologia

SpectraGit é construído com uma moderna pilha de tecnologias para o backend, frontend e infraestrutura.

### Backend
- **Runtime:** Node.js 22 (LTS)
- **Framework:** NestJS 10
- **Banco de Dados:** PostgreSQL 16 com Prisma ORM
- **Cache e Filas:** Redis 7 com BullMQ
- **Autenticação:** Passport.js (JWT + OAuth 2.0)
- **Tempo Real:** Socket.io (WebSockets)

### Frontend
- **Framework:** React 19
- **Roteamento:** React Router 7
- **Gerenciamento de Estado:** Zustand + TanStack Query
- **Estilização:** Tailwind CSS v4
- **Componentes de UI:** Primitivas Radix UI com um sistema de design personalizado
- **Build Tool:** Vite 6

### Infraestrutura
- **Orquestração:** Docker Compose
- **Proxy Reverso:** nginx
- **Migrações de Banco de Dados:** Prisma Migrate
