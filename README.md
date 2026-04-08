# Contabilicards 📊

Um jogo de tabuleiro educacional digital focado no aprendizado e revisão de conceitos de contabilidade. Criado para ser utilizado em sala de aula, o jogo combina a dinâmica clássica de jogos de tabuleiro com perguntas de múltipla escolha.

## 🎯 Objetivo do Projeto
Transformar a revisão de conteúdos contábeis em uma experiência interativa e gamificada. O projeto foi estruturado para que professores possam utilizá-lo facilmente via projetor, engajando grupos de alunos na resolução de questões em tempo real.

## ✨ Principais Funcionalidades

* **Tabuleiro Dinâmico:** O tamanho do tabuleiro se ajusta automaticamente (de 16 a 100 casas) em um formato de anel contínuo, permitindo partidas rápidas ou prolongadas.
* **Modo Projetor:** Um botão dedicado que ativa a tela cheia e amplia automaticamente todas as fontes e elementos visuais para leitura em grandes espaços.
* **Sistema de Dificuldade:** * *Fácil (15s):* Acerto avança 1 casa. Erro faz o grupo anterior avançar 3 casas.
  * *Difícil (1 min):* Acerto avança 3 casas. Erro mantém o grupo no lugar.
* **Casas Especiais:** Casas bônus (+2 posições) e casas de azar (-2 posições) para aumentar a imprevisibilidade.
* **Recuperação de Estado:** O jogo salva o progresso automaticamente no navegador (Local Storage). Se a página for fechada sem querer, a partida pode ser continuada de onde parou.
* **Linha do Tempo Segura:** Sistema de "Desfazer" e "Refazer" jogadas com limite de memória (20 turnos) para corrigir cliques acidentais sem travar o navegador.
* **Pódio Interativo:** Ao finalizar a partida, o tabuleiro exibe um ranking final elegante na tela.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído de forma nativa e leve, sem a necessidade de frameworks complexos:
* **HTML5:** Estruturação das telas e modais.
* **CSS3:** Estilização visual, animações de movimento das peças e responsividade para o modo projetor utilizando CSS Grid.
* **Vanilla JavaScript:** Lógica do jogo, controle de turnos, cálculo de perímetro do tabuleiro e manipulação de memória.
* **Marked.js:** Biblioteca simples importada via CDN para renderizar as regras do jogo escritas em Markdown.

## 🚀 Como Executar o Jogo

O jogo roda inteiramente no navegador e não requer instalação de servidores ou banco de dados.

**Opção 1: Jogar Online (Recomendado)**
Basta acessar o link do projeto hospedado no GitHub Pages.


**Opção 2: Executar Localmente**
1. Faça o download ou clone este repositório.
2. Extraia os arquivos em uma pasta no seu computador.
3. Clique duas vezes no arquivo `index.html` para abri-lo em qualquer navegador de internet (Chrome, Edge, Firefox, etc.).

## 📝 Como Adicionar Novas Perguntas

O banco de perguntas é totalmente personalizável. Para adicionar, editar ou remover questões, basta abrir o arquivo `dados/perguntas.json` e seguir a estrutura abaixo:

```json
{
  "dificuldade": "facil",
  "pergunta": "O que é um Ativo?",
  "alternativas": ["Bens e direitos", "Obrigações", "Capital Social"],
  "correta": "Bens e direitos",
  "resolucao": "Os ativos representam todos os bens e direitos que a empresa possui."
}
````

*Lembre-se de manter o formato exato, incluindo as aspas e vírgulas.*

## 📜 Regras do Jogo

As instruções completas de como o jogo funciona, penalidades e pontuações estão disponíveis no menu inicial do jogo, clicando no botão **Regras** (arquivo lido a partir de `manual/regras.md`).

## 📄 Licença

Este projeto é de código aberto. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.