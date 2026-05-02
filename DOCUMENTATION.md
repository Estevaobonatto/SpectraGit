
# Documentação Completa do SpectraGit

## 1. Visão Geral

O SpectraGit é uma plataforma de Git auto-hospedada, de código aberto, inspirada no GitHub. Ela permite que você tenha controle total sobre seus repositórios, equipes e fluxos de trabalho de revisão de código, sem dependência de serviços em nuvem, limites de uso ou assinaturas.

- **100% Código Aberto**: Licenciado sob a licença MIT, gratuito para usar e modificar.
- **Auto-hospedado**: Seu código reside em sua própria infraestrutura.
- **Sem Telemetria**: Nenhum dado é enviado para serviços externos.
- **Sem Assinatura**: Todos os recursos estão disponíveis para todos os usuários.

## 2. Arquitetura

O SpectraGit é construído com uma arquitetura moderna e modular, projetada para escalabilidade e manutenibilidade.

### Componentes Principais:

- **Frontend**: Uma aplicação de página única (SPA) construída com React, Vite e Tailwind CSS.
- **Backend**: Uma API robusta construída com NestJS (Node.js), utilizando Prisma como ORM para interagir com o banco de dados.
- **Banco de Dados**: PostgreSQL para armazenamento de dados relacionais.
- **Cache e Filas**: Redis é usado para cache e gerenciamento de filas com BullMQ.
- **Servidor Web**: Nginx atua como um proxy reverso e serve os arquivos estáticos do frontend.
- **Contêineres**: Toda a pilha é orquestrada usando Docker e Docker Compose, facilitando a implantação e o desenvolvimento.

### Fluxo de Dados:

1.  O cliente (navegador web) interage com a aplicação React.
2.  O Nginx recebe as requisições e as direciona:
    - Requisições para a API (`/api`) são encaminhadas para o backend NestJS.
    - Outras requisições servem o frontend React.
3.  O backend processa a lógica de negócios, interagindo com o PostgreSQL e o Redis conforme necessário.
4.  Operações Git pesadas são tratadas de forma assíncrona usando filas.
5.  Notificações em tempo real são enviadas para o cliente usando WebSockets.

## 3. Como Começar (Instalação Rápida)

### Pré-requisitos:

- Docker Engine 24+
- Docker Compose v2.20+
- Git 2.40+
- Portas `80` e `2222` disponíveis.

### Passos:

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/your-org/spectragit.git
    cd spectragit
    ```

2.  **Configure o ambiente:**
    ```bash
    cp .env.example .env
    ```
    Edite o arquivo `.env` e defina as variáveis necessárias, como `POSTGRES_PASSWORD`, `JWT_SECRET`, e `JWT_REFRESH_SECRET`.

3.  **Inicie a aplicação:**
    ```bash
    docker compose up --build -d
    ```

4.  **Finalize a configuração:**
    Abra `http://localhost` em seu navegador para acessar o assistente de configuração, onde você criará a conta de administrador e configurará a instância.

Para um guia de instalação mais detalhado, incluindo configuração de HTTPS, consulte o arquivo `INSTALL.md`.

## 4. Desenvolvimento

### Configuração do Ambiente de Desenvolvimento:

É recomendado usar o Docker para um ambiente de desenvolvimento consistente, mas você também pode executar os serviços localmente.

- **Com Docker (Recomendado):**
  ```bash
  docker compose up --build
  ```

- **Localmente:**
  1.  Inicie o banco de dados e o Redis com o Docker:
      ```bash
      docker compose up postgres redis -d
      ```
  2.  Inicie o backend:
      ```bash
      cd backend
      npm install
      npm run start:dev
      ```
  3.  Inicie o frontend:
      ```bash
      cd frontend
      npm install
      npm run dev
      ```

### Convenções:

- **Branches**: Siga as convenções de nomenclatura, como `feat/<nome>`, `fix/<nome>`, `docs/<nome>`, etc.
- **Commits**: Use o padrão de [Commits Convencionais](https://www.conventionalcommits.org/).
- **Estilo de Código**: Siga as diretrizes de estilo definidas nos arquivos de configuração do ESLint e Prettier.

## 5. Contribuindo

Contribuições são bem-vindas! Por favor, leia o `CONTRIBUTING.md` para obter diretrizes detalhadas sobre o processo de contribuição, incluindo como configurar o ambiente de desenvolvimento, convenções de código e o processo de Pull Request.

Antes de contribuir, certifique-se de seguir o `CODE_OF_CONDUCT.md`.

## 6. Segurança

A segurança é uma prioridade. Se você encontrar uma vulnerabilidade de segurança, por favor, relate-a de forma privada, seguindo as diretrizes em `SECURITY.md`. **Não abra uma issue pública para vulnerabilidades de segurança.**

## 7. Licença

O SpectraGit é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 8. Documentos Adicionais

Para informações mais detalhadas, consulte os seguintes documentos na raiz do projeto:

- `README.md`: Visão geral do projeto.
- `INSTALL.md`: Guia de instalação detalhado.
- `CONTRIBUTING.md`: Diretrizes para contribuição.
- `SECURITY.md`: Política de segurança.
- `CODE_OF_CONDUCT.md`: Código de conduta para contribuidores.
- `CHANGELOG.md`: Registro de alterações.
- `SDD.md`: Documento de Design de Software (em português).

Este documento fornece uma visão abrangente do projeto SpectraGit. Para se aprofundar em qualquer tópico específico, consulte os arquivos de documentação mencionados acima.
