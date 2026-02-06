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

---
*Divirta-se e boa sorte, piloto!*
