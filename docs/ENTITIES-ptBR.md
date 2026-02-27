> 🇺🇸 *Read this in [English](ENTITIES.md)*

# Entidades do Jogo (Entities)

As "Entidades" são todas as peças dinâmicas que atuam diretamente na gameplay do Cosmic Parasite (tudo o que se move de forma autônoma, atira ou pode ser destruído). Elas residem na pasta `src/entities/`.

## Estrutura Padrão

Virtualmente todas as entidades compartilham as mesmas propriedades lógicas em seus construtores e o mesmo padrão de métodos (`update()` e `draw()`).

### Propriedades Base:
- `x` e `y`: Coordenadas de posição na tela. O ponto de origem (0,0) é sempre no canto superior esquerdo do sprite.
- `width` e `height`: Tamanho físico da bounding box, usado para colisões.
- `speed` ou variações de velocidade nos eixos: O fator multiplicador que age em cima do `dt` (delta time) repassado pelo `Game.js`
- `markedForDeletion`: Uma flag booleana. Quando setada acidental ou propositalmente para `true`, o `Game.js` vai limpar este objeto da memória no próximo quadro, efetivamente removendo a entidade do jogo.

### Animações (Spritesheets Frame a Frame)
Ao contrário de desenhar uma grade numa sprite sheet grande, o Cosmic Parasite lida com animações carregando cada frame individual (`Assets.js` carrega matrizes/arrays gigantes de frames em propriedades iteráveis).

As entidades possuem um controle de tempo interno (ex: `this.frameTimer` e `this.frameInterval`) para trocar qual elemento do array deve ser enviado para o canvas, resultando numa animação limpa.

---

## O Jogador (`Player.js`)
- Representa o helicóptero.
- Possui inércia e aceleração na movimentação pelo canvas. 
- Gerencia seu próprio array de disparos (`this.bullets`). Toda vez que ele atira, um novo projétil é guardado em sua matriz, a qual o `Game.js` verifica ativamente para checar colisões com inimigos.
- Responde a inclinação do sprite nativamente ao detectar movimentos do teclado (inclina pra frente e inclina pra trás).
- Armazena as flags de Upgrades passivos e armas compradas na Loja (ex: `weaponType`, `hasCoinMagnet`).

## Projéteis (`Projectile.js`)
- Instanciados pelo `Player` ou por Inimigos.
- Calculam seu próprio ângulo de voo usando vetores (`vx`, `vy`) e rotacionam visualmente seus sprites para corresponder à direção real do disparo.
- Alguns itens especiais como o "Míssil Perfurante" possuem escala maior e ignoram a lixeira por colisão no `Game.js`.

## Inimigos (`Enemy.js` e `Enemy02.js`)
- Os inimigos nascem fora da tela do lado direito (`CANVAS_WIDTH + offset`).
- Possuem ciclos de vida curtos e lógicas de movimentação que variam (retas ou ondas senoidais alterando o eixo Y).
- Se gerenciados com inteligência artificial, podem mirar no jogador e spawnar projéteis de danos massivos.
- Em caso de colisão com projéteis do jogador: sua flag `markedForDeletion` é ativada, eles emitem o comando para a criação pontual das entidades de `Coin.js` e `Explosion.js`, finalizando a sequência.

## Itens (`Coin.js` e `SpeedUp.js`)
- Itens largados, ou gerados aleatoriamente pelo `Game.js` através de cooldowns de tempo fixos (`speedUpTimer`).
- Se intersetados com o `Player`, desencadeiam a evolução do status de pontos (`Game.score += 100`) e/ou aumentam gradualmente os status multiplicadores de velocidade do Jogador, além de serem imediatamente deletados.
- As **Moedas (`Coin.js`)** possuem lógica de atração (magnetismo). Se entrarem em um certo raio e o jogador tiver o Ímã ativo, elas voam até ele em vez de quicar lentamente.

## Controle de Resíduos
A lixeira de todas as entidades atua fora-da-tela, qualquer projétil que passe da largura física do Canvas ou qualquer lixo abandonado do outro lado (`x < -width`) tem o `markedForDeletion` setado para `true` para salvar memória instantaneamente.
