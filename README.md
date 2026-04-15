# Contabilicards 📊

Um jogo de tabuleiro educacional digital focado no aprendizado e revisão de conceitos de contabilidade. Criado para ser utilizado em sala de aula, o jogo combina a dinâmica clássica de jogos de tabuleiro com perguntas de múltipla escolha.

## 🎯 Objetivo do Projeto
Transformar a revisão de conteúdos contábeis em uma experiência interativa e gamificada. O projeto foi estruturado para que professores possam utilizá-lo facilmente via projetor, engajando grupos de alunos na resolução de questões em tempo real.

## ✨ Principais Funcionalidades

* **Tabuleiro Dinâmico:** O tamanho do tabuleiro se ajusta automaticamente (de 16 a 100 casas) em um formato de anel contínuo, permitindo partidas rápidas ou prolongadas.
* **Modo Projetor:** Um botão dedicado que ativa a tela cheia e amplia automaticamente todas as fontes e elementos visuais para leitura em grandes espaços.
* **Sistema de Turnos e Dificuldade:** * *Nível Fácil (30s):* Acerto avança 3 casas. Erro faz o jogador ativo (quem leu a pergunta) avançar 1 casa.
  * *Nível Difícil (60s):* Acerto avança 5 casas. Erro faz o jogador ativo avançar 3 casas.
* **Casas Especiais e Combos:** O tabuleiro possui casas bônus (BP), casas de interação que afetam os oponentes (IR) e casas de pergunta bônus (DRE). O jogo conta com um sistema de proteção contra *loops* infinitos, limitando as reações em cadeia a apenas um combo por rodada.
* **Configurações Flexíveis:** Opções nativas para ativar/desativar penalidade por tempo esgotado e para ocultar o texto das perguntas na tela. Quando a exibição do texto é desativada, as opções mostram apenas as letras (A, B, C, D...), focando a atenção na leitura do mediador.
* **Recuperação de Estado:** O jogo salva o progresso automaticamente no navegador (Local Storage). Se a página for fechada sem querer, a partida pode ser continuada de onde parou.
* **Linha do Tempo Segura:** Sistema de "Desfazer" e "Refazer" jogadas com limite de memória (20 turnos) para corrigir cliques acidentais sem travar o navegador.
* **Pódio Interativo:** Ao finalizar a partida, o tabuleiro exibe um ranking final elegante na tela.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído de forma nativa e leve, sem a necessidade de frameworks complexos:
* **HTML5:** Estruturação das telas e modais.
* **CSS3:** Estilização visual, animações de movimento das peças e responsividade para o modo projetor utilizando CSS Grid.
* **Vanilla JavaScript:** Lógica do jogo, controle de turnos, motor de combos antiloop, cálculo de perímetro do tabuleiro e manipulação de memória.
* **Marked.js:** Biblioteca simples importada via CDN para renderizar as regras do jogo escritas em Markdown.

## 🚀 Como Executar o Jogo

O jogo roda inteiramente no navegador e não requer instalação de servidores ou banco de dados.

**Opção 1: Jogar Online (Recomendado)**
Basta acessar o link do projeto hospedado no GitHub Pages.

**Opção 2: Executar Localmente**
1. Faça o download ou clone este repositório.
2. Extraia os arquivos numa pasta no seu computador.
3. Clique duas vezes no arquivo `index.html` para abri-lo em qualquer navegador de internet (Chrome, Edge, Firefox, etc.).

## 📝 Como Adicionar Novas Perguntas

O banco de perguntas é personalizável para uso local. Para adicionar, editar ou remover questões, basta abrir o arquivo `dados/perguntas.json` e seguir a estrutura abaixo:

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

As instruções completas de como o jogo funciona, detalhamento das casas especiais e penalidades estão disponíveis no menu inicial do jogo, clicando no botão **Regras** (o arquivo é lido a partir de `manual/regras.md`).

## 📄 Licença e Direitos Autorais

O código fonte deste software é de código aberto (AGPL3). Consulte o arquivo [LICENSE](https://www.google.com/search?q=LICENSE) para mais detalhes.

**⚠️ ATENÇÃO: Restrições do Banco de Perguntas**
O arquivo `dados/perguntas.json` (e todo o seu conteúdo textual e educacional) **não** faz parte da licença de código aberto deste software. As perguntas, alternativas e resoluções são de propriedade intelectual de seus respectivos autores. É expressamente **proibida** qualquer forma de distribuição, cópia, derivação, reprodução ou uso comercial do conteúdo contido neste arquivo sem a devida autorização legal dos criadores.