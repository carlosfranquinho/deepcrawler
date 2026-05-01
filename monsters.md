# DeepCrawler Monster Database & Difficulty Scaling

Este ficheiro serve como base de dados para a geração procedural de inimigos. 
Cada monstro possui um Valor de Ameaça (VA) que dita o seu escalonamento e pontuação.

## 1. Lógica de Sistema (Engine Rules)

### Escalonamento de Dificuldade (Scaling)
- **Nível de Profundidade (L):** O nível atual do jogador na masmorra.
- **Valor de Ameaça (VA):** Define a "maturidade" do monstro. 
- **Probabilidade de Spawn:** É calculada por uma curva onde o pico de frequência ocorre quando `L ≈ VA`. Monstros com `VA << L` tornam-se raros ou aparecem em hordas.
- **Pontuação (Score):** Ao derrotar um monstro, o jogador recebe `(VA * 10) + (L * 2)` pontos.

### Atributos de Texto
- **Artigo:** Usado para construir frases dinâmicas: `"{Artigo} {Nome} ataca-te!"`.
- **Símbolo:** O caractere ASCII representativo no mapa.

---

## 2. Tabela de Monstros por Escalão

### Escalão 1: Pragas e Criaturas de Superfície (VA 1 - 5)
| Símbolo | Artigo | Nome | VA | Descrição |
| :--- | :--- | :--- | :---: | :--- |
| r | a | Ratazana de esgoto | 1 | Inimigo básico de tutorial. |
| f | o | Morcego das cavernas | 1 | Movimento rápido e errático. |
| d | o | Chacal | 2 | Fraco, mas surge sempre em grupos. |
| k | o | Gnomo das Trevas | 2 | (Ex-Kobold) Lança pedras ou dardos. |
| i | o | Homúnculo | 2 | Criatura artificial; ataque causa sono. |
| d | a | Raposa | 2 | Muito veloz; difícil de cercar. |
| a | a | Formiga gigante | 3 | Ataque rápido; perigo de cerco. |
| b | a | Bolha ácida | 3 | Corrói equipamento metálico. |
| : | o | Lagarto das rochas | 3 | Lento, mas com defesa física alta. |
| y | a | Luz Amarela | 3 | Explode e cega o jogador. |
| d | o | Lobo selvagem | 4 | Agressivo; persegue o cheiro do jogador. |
| o | o | Goblin | 4 | Sorrateiro; usa armas básicas. |
| S | a | Serpente | 4 | Ataque rápido; chance de veneno. |
| o | o | Orc | 5 | Guerreiro básico com armadura. |

### Escalão 2: Ameaças Médias e Feras (VA 6 - 20)
| Símbolo | Artigo | Nome | VA | Descrição |
| :--- | :--- | :--- | :---: | :--- |
| p | o | Perfurador de Rocha | 6 | Emboscada vinda do teto da masmorra. |
| j | a | Geleia Ocre | 7 | Divide-se ao ser atingida por cortes. |
| q | a | Besta chifruda | 8 | Carga em linha reta; alto dano de impacto. |
| h | o | Urso-Coruja | 10 | (Ex-Bugbear) Híbrido com força massiva. |
| f | o | Tigre dentes-de-sabre | 10 | Salta sobre o jogador à distância. |
| j | a | Geleia Azul | 11 | Ataque de gelo; abranda o movimento. |
| h | o | Soldado Anão | 11 | Bloqueia ataques com escudo. |
| l | o | Duende Ladrão | 13 | Rouba ouro e teletransporta-se. |
| M | a | Múmia Humana | 14 | Resistente a armas; vulnerável a fogo. |
| m | o | Mímico | 15 | Disfarça-se de baú ou mobília. |
| G | o | Gnomo Feiticeiro | 16 | Lança projéteis de energia mágica. |
| O | o | Ogre | 18 | Força bruta; destrói portas e paredes finas. |
| x | o | Inseto Elétrico | 20 | (Ex-Grid Bug) Move-se apenas em cruz/diagonais. |

### Escalão 3: Horrores das Profundezas (VA 21 - 40)
| Símbolo | Artigo | Nome | VA | Descrição |
| :--- | :--- | :--- | :---: | :--- |
| P | o | Limo Verde | 22 | Infecioso; transforma o alvo em limo. |
| H | o | Gigante das Colinas | 24 | Arremessa rochas de longe. |
| U | o | Brutamontes | 26 | O olhar causa confusão mental profunda. |
| T | o | Troll | 28 | (Ex-Troll de Pedra) Regenera vida a cada turno. |
| E | o | Elemental do Fogo | 30 | Aura de calor; queima quem se aproxima. |
| c | o | Basilisco | 32 | Toque ou olhar que transforma em pedra. |
| i | a | Sombra veloz | 35 | (Ex-Vulto Ágil) Alta esquiva e teletransporte. |
| K | o | Capitão de Patrulha | 38 | Persegue criminosos e ladrões. |
| Z | o | Carniçal | 40 | O seu toque pode paralisar o jogador. |

### Escalão 4: Pesadelos e Guardiões (VA 41 - 55)
| Símbolo | Artigo | Nome | VA | Descrição |
| :--- | :--- | :--- | :---: | :--- |
| V | o | Vampiro | 42 | Drena experiência (níveis) do jogador. |
| L | o | Necromante | 45 | Invoca esqueletos e mortos-vivos. |
| W | o | Espectro | 46 | Atravessa paredes; drena vitalidade. |
| D | o | Dragão | 50 | Sopro elemental de alto alcance e dano. |
| & | o | Balrog | 55 | Demónio de fogo com chicote e espada. |

### Escalão Lendário e Bosses (VA 60+)
| Símbolo | Artigo | Nome | VA | Notas |
| :--- | :--- | :--- | :---: | :--- |
| @ | a | Medusa | 60 | Petrifica sem escudo espelhado. |
| @ | o | Feiticeiro das Trevas | 75 | Mestre da manipulação e teletransporte. |
| V | o | Vlad, o Empalador | 80 | O rei dos vampiros; críticos letais. |
| & | o | Devorador de Almas | 95 | A entidade final do abismo infinito. |

---

## 3. Lógica de Expansão para o Infinito
Para garantir que o jogo nunca pare de escalar, o sistema de geração deve aplicar **Modificadores de Sufixo** quando o Nível da Masmorra exceder o VA do monstro em mais de 50 níveis:

1. **[Nome] Alfa:** VA +10, Vida x2.
2. **[Nome] Corrompido:** Adiciona dano de veneno a qualquer monstro.
3. **[Nome] das Profundezas:** VA +50, torna-se um mini-boss com loot raro.