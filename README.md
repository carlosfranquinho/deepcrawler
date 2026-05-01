# DeepCrawler ⚔️

**DeepCrawler** é um roguelike moderno, jogado diretamente no browser, com geração processual de masmorras infinitas e um foco forte na responsividade e estética *premium*.

Explora os confins das masmorras, derrota monstros lendários, descobre tesouros escondidos e compete na tabela global de pontuações!

---

## 📸 Funcionalidades e Características

- **Geração Processual:** Masmorras geradas do zero a cada andar, com um design coeso de salas e corredores.
- **Gráficos Modernos:** Mistura de padrões SVG de alta fidelidade (alvenaria e lajes de pedra) e ícones Emoji tipográficos em resoluções perfeitas, acompanhados por luzes pulsantes (*glow effects*).
- **Inimigos Únicos:** 44 tipos diferentes de monstros (de 🐀 Ratazanas a 🐉 Dragões), organizados por *tiers* de dificuldade progressiva, todos reconhecíveis à distância.
- **Sistemas Clássicos:** Portas trancadas, chaves escondidas, campo de visão (*Field of View / Fog of War*) tradicional de roguelikes.
- **Inventário:** Recolhe itens utilitários (Poções de Cura, Armaduras, Pergaminhos, Espadas) e guarda-os para quando mais precisares.
- **Multidispositivo:** Totalmente responsivo! Joga no PC pelo teclado ou no telemóvel através de um D-pad otimizado de 8 direções e do inventário por toque.
- **High Scores:** Integração com base de dados para gravar e consultar as tuas pontuações de forma global.

---

## 🧙‍♂️ Arquétipos de Personagem

O jogo permite escolher a tua classe ao início, influenciando os teus atributos base e ícone visual:

- 🤺 **Guerreiro**: Equilibrado, forte em ataque.
- 🥷 **Ladrão**: Especialista em evasão com alto carisma (esquiva).
- 🧙‍♂️ **Mago**: Frágil mas devastador.
- 🛡️ **Paladino**: Altamente resistente.
- 🪓 **Bárbaro**: Enorme quantidade de vida e dano.
- 📸 **Turista**: O modo desafio! Fraco e sem muitas posses.

---

## 🕹️ Como Jogar

O jogo reage a inputs táticos baseados em grelha.

### Controlos (PC)
* **Mover / Atacar:**
  * Cardinais: Setas, `W A S D` ou Numpad `8 2 4 6`
  * Diagonais: Numpad `7 9 1 3` ou Teclas VI `Y U B N`
* **Esperar (passar turno):** `Espaço` ou Numpad `5`
* **Inventário:** Usa as teclas de `1` a `9` para ativar os itens na mochila.

### Controlos (Mobile / Touch)
* **D-pad no Ecrã:** Podes mover-te em 8 direções tocando nos botões do ecrã.
* **Inventário Tátil:** Toca diretamente num item listado na tua "Mochila" para o usares.

> Podes subir ou descer escadas avançando para o mosaico (tile) das mesmas quando o caminho estiver livre.

---

## 🚀 Como Correr o Jogo Localmente

Como não requer pacotes pesados ou bibliotecas JavaScript complexas (Vanilla JS, HTML e CSS), é muito fácil de correr.

**Opção recomendada:** Iniciar um servidor HTTP (necessário devido à restrição de módulos ES6 ou requisições CORS).

```bash
# Na pasta do projeto, usa Python:
python3 -m http.server 5173
```
Em seguida, abre no teu browser: `http://localhost:5173`.
