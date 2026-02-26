# 🚀 COSMIC PARASITE

**Cosmic Parasite** é um jogo de tiro espacial retro desenvolvido com HTML5 Canvas e JavaScript puro (Vanilla JS), focado em ação rápida e estilo arcade.

## 🎮 Como Jogar

Pilote seu helicóptero espacial, destrua inimigos alienígenas e sobreviva o máximo que puder para alcançar o topo do ranking!

### Controles

| Ação | Teclado / Mouse |
| :--- | :--- |
| **Mover** | `Setas` ou `WASD` |
| **Atirar** | `Barra de Espaço` (Semi-automático) |
| **Iniciar/Reiniciar** | `Clique`, `Enter` ou `Toque` na tela |

*O jogo também possui suporte básico para Gamepad (detectado no menu inicial).*

### 🛒 Loja de Armamentos (Web Shop)

Ao longo de sua jornada, você encontrará uma Loja para aprimorar seu helicóptero. Após a passagem do monolito misterioso, fique atento ao cenário!
Aproxime-se da entrada da loja para ativá-ela. A loja pausará o jogo e permitirá que você compre upgrades usando sua **GRANA** (score) acumulada.

**Upgrades Disponíveis:**
*   **Tiro Triplo:** R$ 500,00 - Dispara três mísseis simultâneos abrindo a área de acerto.
*   **Cadência +:** R$ 300,00 - Aumenta a velocidade de disparo máximo (acumulativo até 3 níveis).
*   **Escudo Extra:** R$ 800,00 - Uma proteção energética que absorve **1 hit fatal** de inimigos ou de colisões com o cenário.
*   **Míssil Perfurante:** R$ 1000,00 - Substitui seu tiro por um míssil gigante (1.8x maior) que atravessa e destrói múltiplos inimigos de uma vez.
*   **Ímã de Moedas:** R$ 700,00 - Atualização passiva. Ativa uma gravidade artificial no helicóptero puxando todas as moedas próximas automaticamente para a nave.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando tecnologias web modernas sem dependência de frameworks pesados no frontend:

- **Frontend:**
  - HTML5 Canvas (Renderização gráfica)
  - JavaScript (ES6 Modules - Lógica do jogo)
  - CSS3 (Estilização da interface)
- **Backend (Pontuação):**
  - PHP (API simples para salvar scores)
  - SQLite (Banco de dados local `scores_cosmic.db`)
- **Assets:**
  - Python (Scripts auxiliares para otimização e compressão de imagens)

## ⚙️ Instalação e Configuração

Para rodar o jogo localmente com o sistema de **High Scores** funcionando, você precisará de um servidor web com suporte a PHP.

### Pré-requisitos
- Servidor Web (Apache, Nginx, ou PHP Built-in Server).
- PHP instalado e configurado.
- Extensão `pdo_sqlite` habilitada no `php.ini`.

### Passo a Passo

1. **Clone ou baixe o repositório** para a pasta pública do seu servidor web (ex: `htdocs` no XAMPP ou `/var/www/html` no Linux).
   ```bash
   git clone https://github.com/seu-usuario/COSMIC_PARASITE.git
   ```

2. **Permissões de Escrita:**
   Para que o jogo possa salvar as pontuações, o PHP precisa de permissão de escrita no arquivo do banco de dados e no diretório onde ele está.
   - Certifique-se de que o arquivo `scores_cosmic.db` (se existir) e a pasta raiz do projeto tenham permissões de escrita.

3. **Acesse o Jogo:**
   Abra seu navegador e acesse:
   ```
   http://localhost/COSMIC_PARASITE
   ```

### Rodando apenas o Frontend
Se você quiser apenas testar a jogabilidade sem salvar pontuações, você pode abrir o arquivo `index.html` diretamente ou usar uma extensão como "Live Server" no VS Code, mas o placar de líderes não funcionará corretamente.

## 📂 Estrutura do Projeto

*   **`index.html`**: Arquivo principal, contém a estrutura da página e o Canvas.
*   **`style.css`**: Estilos da interface de usuário (menus, overlays).
*   **`src/`**: Código fonte do jogo.
    *   `core/`: Gerenciamento do jogo, loop principal, carregamento de assets.
    *   `entities/`: Lógica do Jogador, Inimigos e Projéteis.
    *   `environment/`: Efeitos visuais como o campo estelar (Starfield).
    *   `utils/`: Constantes e funções utilitárias.
*   **`scores_cosmic.php`**: Script backend para gerenciar o banco de dados de scores.
*   **`scores_cosmic.db`**: Banco de dados SQLite contendo os recordes.
*   **`*.py`**: Scripts Python na raiz utilizados para processar e otimizar assets gráficos.

## 📚 Documentação Técnica

Para entender mais a fundo como o jogo funciona por baixo dos panos (ideal para desenvolvedores e IAs estudando a *Codebase*), consulte a documentação detalhada:

- [Arquitetura Geral (`ARCHITECTURE.md`)](docs/ARCHITECTURE.md): Detalha o Main Loop, separação de Estados, Gerenciadores e como as mecânicas convergem.
- [A Lógica das Entidades (`ENTITIES.md`)](docs/ENTITIES.md): Abrange as instâncias de inimigos, tiros, jogadores e como os estados atuam em seus ciclos de vida (Desenho, Interação, Lixeira).
- [O Sistema Ambiental (`ENVIRONMENT.md`)](docs/ENVIRONMENT.md): Como funciona a rolagem contínua das fases, Parallax, spawnings independentes (Estátuas e Lojas) e Checagem Pixeladas de colisões de terrenos.

---
*Divirta-se e boa sorte, piloto!*
