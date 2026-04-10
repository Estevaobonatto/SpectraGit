---
description: "Use when implementing features, creating modules, writing code, designing APIs, defining data models, or making architectural decisions for SpectraGit. Always read SDD.md before starting implementation work."
---
# Leia o SDD antes de implementar

Antes de implementar qualquer feature, modulo, endpoint, componente, modelo de dados ou decisao arquitetural no projeto SpectraGit, leia o arquivo `SDD.md` na raiz do repositorio.

## Regra obrigatoria

1. Use a tool de leitura de arquivo para ler `SDD.md` completo antes de iniciar qualquer implementacao.
2. Alinhe sua implementacao com a stack, arquitetura e decisoes tecnicas definidas no SDD.
3. Se houver conflito entre o que foi pedido e o que o SDD define, sinalize antes de prosseguir.

## O que verificar no SDD antes de implementar

- **Stack recomendada** (secao 11.4): confirme tecnologias antes de propor alternativas.
- **Modulos funcionais** (secao 7.1 e 13.3): implemente dentro do modulo correto.
- **Requisitos funcionais** (secao 8): verifique se o requisito ja esta mapeado.
- **Modelo de dados** (secao 14): respeite as entidades e relacoes conceituais definidas.
- **Estrutura de pastas** (secoes 12.6 e 13.4): crie arquivos nos caminhos corretos.
- **Etapas de implementacao** (secao 21): nao implemente features de fases futuras antes das anteriores estarem completas.
- **Escopo fora da primeira versao** (secao 4.2): nao implemente o que esta explicitamente fora do escopo.

## Exemplo

Se o usuario pedir "crie o modulo de notificacoes", antes de escrever qualquer codigo:
- Leia `SDD.md`
- Verifique a secao 7.1 (modulo `notifications`), 8.8 (RF-053 a RF-058), 13.3 e 21 (Etapa 6)
- Implemente respeitando NestJS, PostgreSQL, Redis e WebSocket conforme definido
