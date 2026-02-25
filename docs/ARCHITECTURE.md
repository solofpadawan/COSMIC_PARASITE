# Arquitetura do Cosmic Parasite

Este documento descreve a arquitetura geral do jogo, o loop principal, o gerenciamento de estados e como as instâncias se comunicam.

## Visão Geral

O Cosmic Parasite é construído utilizando **HTML5 Canvas** e **Vanilla JavaScript** (módulos ES6). Todo o desenho na tela e a lógica de atualização ocorrem num loop contínuo sincronizado com a taxa de atualização do monitor do jogador através do `requestAnimationFrame`.

A arquitetura segue os princípios de separação de responsabilidades, dividindo o código em submódulos dentro da pasta `src/`:
- `core/`: Gerentes principais (Game, Input, Audio, Assets, Score).
- `entities/`: Objetos dinâmicos do jogo (Jogador, Inimigos, Itens).
- `environment/`: Elementos visuais não dinâmicos ou cenários.

## O Ponto de Entrada: `main.js`

O arquivo `main.js` é o entry point da aplicação. Suas principais responsabilidades são:
1. Configurar o Canvas e pegar seu contexto (`ctx`).
2. Tentar restaurar o Canvas responsivamente pro tamanho da tela.
3. Chamar o gerenciador de Assets (`Assets.js`) para carregar todas as imagens e sons em background.
4. Inicializar instâncias essenciais (`ScoreManager`, e a classe principal `Game`).
5. Iniciar e manter o loop do jogo (`animate(currentTime)`).

## A Classe Principal: `core/Game.js`

A classe `Game` é a grande orquestradora do jogo. Ela inicializa os subsistemas e armazena o estado global.

### Gerenciamento de Estado
A propriedade `this.state` controla em que tela o jogador está:
- `START`: A tela de título e placar de líderes. O jogo aguarda um input para começar. O fundo se move lentamente.
- `PLAYING`: O jogo em si. O jogador tem controle total do helicóptero. Geração de inimigos, ondas e itens estão ativadas.
- `GAME_OVER`: O helicóptero foi destruído. O jogo para as atualizações das entidades, toca os efeitos de explosão e exibe a tela de form para inserir o nome pro High Score.

### O Loop: `update()` e `draw()`
Dentro do loop iniciado pelo `main.js`, o método `Game.update(dt)` é chamado passando o **delta time** (`dt`), seguido de `Game.draw()`.
- O delta time é crucial porque garante que as velocidades de movimentação das entidades não variem bruscamente com a variação normal do framerate (FPS) do navegador. A movimentação é calculada baseada no tempo e não em *frames brutos*.
- Em `update()`, todos os inputs são checados, e as chamadas de atualização são repassadas em cascata para as entidades (`player.update(dt)`, `inimigos.forEach(i => i.update(dt))`, etc).
- As colisões e detecções de eliminação de objetos (`markedForDeletion`) também são centralizadas no `update()` do `Game.js`.
- Em `draw()`, a tela é completamente limpa (`ctx.clearRect()`) e tudo é redesenhado do fundo para frente na ordem: Background -> Jogador -> Inimigos -> Projéteis -> Moedas -> Explosões -> UI.

## Sistema de Colisões

A checagem de colisões é feita pelo método `checkCollisions()` no `Game.js`.
Geralmente, utiliza-se a detecção clássica de **Bounding Box** (AABB - Axis-Aligned Bounding Box), medindo a sobreposição dos retângulos (x, y, largura e altura) dos sprites.

Porém, para elementos complexos como o chão e os Easter Eggs (que demandam mais fidelidade devido as áreas vazias de sua sprite), a classe `Environment.js` gera um "Mapa de Colisão" em pixel-perfect de apenas 1 bit baseado no canal Alfa das imagens.
