> 🇺🇸 *Read this in [English](ENVIRONMENT.md)*

# Ambiente e Cenário (Environment)

O Cosmic Parasite utiliza um sistema pesado de ilusão de ótica 2D chamado **Efeito Parallax** para simular profundidade e movimento sem nunca precisar de um mapa gigantesco estático.

O arquivo principal responsável por essa mágica é o `src/environment/Environment.js`.

## ParallaxLayer

A classe base `ParallaxLayer` pega uma imagem (Textura) e a repete indefinidamente na tela.
Ela possui a propriedade `speed` que determina "o quão lento" essa camada específica deve se mover em relação a velocidade global do jogo.
- **Camadas distantes** (como as estrelas e a caverna ao fundo): Roteiam de forma bem lenta e suave.
- **Camadas intermediárias** (nívoa/mist): Movem-se com uma certa translucidez.
- **Chão (GroundLayer)**: A camada mais próxima do jogador, movendo-se na mesma velocidade sentida pelas Entidades instanciadas do inimigo e do jogador.

## O Controle do Chão e Introduções

O jogo não é apenas um loop contínuo infinito. A classe `Environment` injeta momentos cinematográficos e elementos únicos no cenário de acordo com a distância (metros) percorrida pelo jogador no `Game.js`.

### Pedaços Únicos e o Loop
Quando o jogo de fato começa (O estado bate em `PLAYING`), há um limite de tempo no aguardo e então spawna-se o terreno introdutório (A imagem da entrada da base, que não tem textura infinita em si mesma!).

Assim que esta imagem passa, entra o que é conhecido como a **LoopLayer**. Que é basicamente uma imagem do chão projetada de forma a dar "tile", de forma a emendar o fim do seu sprite no início do mesmo sem causar estranhamento, tornando o jogo infinitamente progressivo lateralmente do ponto de vista do jogador.

## Eventos Únicos

À medida que o game avança na classe `Game.js`, gatilhos baseados em `this.distance >= X_METROS` acionam chamadas de criação (spawn) injetadas no meio do loop contínuo do fundo.

- `spawnEasterEgg()`: Sobressalta do chão regular da caverna de forma imponente após certa pontuação e sobrepõe seus pixels.
- `spawnShop()`: É acionada logo após o EasterEgg baseada em gatilho no motor de colisão e desenhada com um deslocamento `(offsetY)` em relação ao `ParallaxLayer` loopado.

## Sistema de Colisão do Cenário (Pixel-Perfect)

O jogador consegue literalmente "bater o helicóptero e morrer" contra o chão se voar muito baixo, ou trombar de frente com a estátua (Easter Egg).

O clássico de BoundingBox retangular funciona muito mal para isso (iria fechar as "curvas" do relevo e causar colisões injustas no jogador). Assim sendo:
- O `Environment` cria na sua inicialização um Canvas Invisível e processa individualmente todas as imagens passíveis de contato.
- Um "mapa", um Array Unidimensional Binário (`1` para parede e `0` para vazio) é criado checando a opacidade (Canal Alpha / Transparência).
- Quando as caixas do jogador se aproximam dessas hitboxes globais (Broad phase estática vs Bounding Box do player), a Narrow phase baseada no `getImageData()` entra checando se o offset de X,Y do ponto do jogador cruza contra algum pixel sólido. Se cair em um 1 lógico = Colisão Imediata (Game Over).
