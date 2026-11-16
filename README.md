<div align="center">
  <h1 align="center">🎬 MATRIX FILMES</h1>
  <p align="center">
    <b>Plataforma de Filmes & Séries</b>
    <img src = "https://i.imgur.com/Re9W9Xt.jpeg" />
  </p>

  <p align="center">
    <img src="[https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)" />
    <img src="[https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)" />
    <img src="[https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)" />
    <img src="[https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)" />
    <img src="[https://img.shields.io/badge/Tailwind_CSS-38Bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white](https://img.shields.io/badge/Tailwind_CSS-38Bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)" />
    <img src="[https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=prisma&logoColor=white](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=prisma&logoColor=white)" />
  </p>
</div>

<br>

##  Sobre o Projeto

O **Matrix Filmes** é uma aplicação web e mobile full-stack desenvolvida para proporcionar uma experiência de streaming de nível corporativo (estilo Netflix). O sistema consome a API do **TMDB (The Movie Database)** para oferecer catálogos atualizados, géneros, sinopses detalhadas, opções de plataformas de streaming por região (Brasil) e sincronização de listas de favoritos e "Assistir Depois" protegidas por autenticação JWT.

---

##  Tecnologias & Arquitetura

O projeto está dividido em três módulos principais:

* **Backend (`/backend`)**: Node.js, Express, TypeScript, Prisma ORM (SQLite/PostgreSQL), Zod para validação e Axios.
* **Frontend Web (`/web`)**: React (Vite), Tailwind CSS e Lucide Icons com carrosséis horizontais fluidos.
* **Mobile (`/celular`)**: React Native, Expo e Lucide React Native para multiplataforma (Android/iOS).

---

##  Funcionalidades Principais

* **UI/UX Cinematográfica**: Tema escuro sofisticado inspirado em plataformas modernas de streaming com grelhas, destaques e carrosséis horizontais.
* **Navegação por Categorias**: Menu dropdown interativo para filtrar filmes e séries por géneros reais do TMDB.
* **Onde Assistir (Brasil)**: Integração com provedores de streaming (Netflix, Prime Video, Disney+, Max, etc.) com links diretos de pesquisa nas plataformas.
* **Autenticação & Gestão de Listas**: Sistema de registo e login com JWT para guardar e sincronizar **Favoritos** e itens **Guardados para Assistir**.
* **Pesquisa Avançada**: Pesquisa global em tempo real de filmes e séries.

---

##  Estrutura do Repositório

```text
Matrix-Filmes/
├── backend/       # API Node.js/TypeScript (Prisma + Express)
├── web/           # Aplicação Web em React + Tailwind
├── celular/       # Aplicação Mobile em React Native + Expo
└── .gitignore
