# Contabilicards 📊

Um jogo de tabuleiro educacional digital focado no aprendizado e revisão de conceitos de contabilidade. Criado para ser utilizado em sala de aula, o jogo combina a dinâmica clássica de jogos de tabuleiro com perguntas de múltipla escolha.

## 🎯 Objetivo do Projeto
Transformar a revisão de conteúdos contábeis em uma experiência interativa e gamificada. O projeto foi estruturado para que professores possam utilizá-lo facilmente via projetor, engajando grupos de alunos na resolução de questões em tempo real.

## ✨ Principais Funcionalidades

* **PWA e Funcionamento Offline:** O jogo é um Progressive Web App. Pode ser instalado diretamente pelo navegador no Windows, Linux, Mac, Android ou iOS, funcionando 100% sem internet após o primeiro acesso.
* **Tabuleiro Dinâmico:** O tamanho do tabuleiro se ajusta automaticamente (de 16 a 100 casas) em um formato de anel contínuo, permitindo partidas rápidas ou prolongadas.
* **Distribuição Visual Inteligente:** Sistema geométrico circular que organiza as peças automaticamente, impedindo que equipes fiquem sobrepostas quando caem na mesma casa.
* **Modo Projetor:** Um botão dedicado que ativa a tela cheia e amplia automaticamente todas as fontes e elementos visuais para leitura em grandes espaços, adaptando inclusive o scroll para perguntas longas.
* **Modo Físico:** Opção para jogar com cartas impressas. A tela atua apenas como tabuleiro e controle de turnos, com botões centrais de "Acertou" ou "Errou" para o mediador.
* **Sistema de Turnos e Dificuldade:** * *Nível Fácil (30s):* Acerto avança 3 casas. Erro faz o jogador ativo (quem leu a pergunta) avançar 1 casa.
  * *Nível Difícil (60s):* Acerto avança 5 casas. Erro faz o jogador ativo avançar 3 casas.
* **Casas Especiais e Combos:** O tabuleiro possui casas bônus (BP), casas de interação que afetam os oponentes (IR) e casas de pergunta bônus (DRE). O jogo conta com um sistema de proteção contra *loops* infinitos, limitando as reações em cadeia a apenas um combo por rodada.
* **Configurações Flexíveis:** Opções nativas para ativar/desativar penalidade por tempo esgotado.
* **Linha do Tempo Segura:** Sistema de "Desfazer" e "Refazer" jogadas com limite de memória estrita para corrigir cliques acidentais sem risco de travar o navegador por limite de armazenamento (*QuotaExceeded*).

## 🛠️ Tecnologias Utilizadas

O projeto foi construído de forma nativa e leve, sem a necessidade de frameworks complexos:
* **HTML5 & CSS3:** Estruturação visual, animações 3D de cartas e responsividade utilizando CSS Grid e Flexbox.
* **Vanilla JavaScript:** Lógica do jogo, controle de turnos, motor de combos, física de tabuleiro e manipulação de memória.
* **PWA (Service Workers):** Gerenciamento de cache avançado para instalação nativa e execução offline segura.
* **Marked.js:** Biblioteca simples para renderizar as regras do jogo escritas em Markdown (com fallback embutido para acesso sem internet).

## 🚀 Como Jogar e Instalar

O jogo não requer instalação de servidores ou banco de dados.

**Opção 1: Instalar como Aplicativo (Recomendado / Offline)**
1. Acesse o link do projeto hospedado (ex: GitHub Pages) pelo seu navegador (Chrome, Edge, Safari).
2. Na barra de endereços (ou no menu do navegador), clique no ícone **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
3. O jogo ganhará um ícone no seu computador/celular e abrirá em janela própria, rodando offline para sempre.

**Opção 2: Jogar Direto no Navegador**
Basta acessar o link do projeto e jogar normalmente, sem instalar nada.

**Opção 3: Executar Arquivos Locais**
1. Faça o download ou clone este repositório.
2. Extraia os arquivos numa pasta no seu computador.
3. Clique duas vezes no arquivo `index.html` para abri-lo em qualquer navegador de internet.

## 📝 Como Adicionar Novas Perguntas

O banco de perguntas é personalizável para uso local. Para adicionar, editar ou remover questões, basta abrir o arquivo `dados/perguntas.json` e seguir a estrutura abaixo:

```json
{
  "id": "05009",
  "dificuldade": "facil",
  "pergunta": "O que é um Ativo?",
  "alternativas": ["Bens e direitos", "Obrigações", "Capital Social"],
  "correta": "Bens e direitos",
  "resolucao": "Os ativos representam todos os bens e direitos que a empresa possui.",
  "cálculo": "false"
}

```

*Lembre-se de manter o formato exato, incluindo as aspas e vírgulas.* (Nota: O sistema possui proteção contra a quebra de botões caso você utilize aspas duplas dentro das alternativas).

## 📜 Regras do Jogo

As instruções completas de como o jogo funciona, detalhamento das casas especiais e penalidades estão disponíveis no menu inicial do jogo, clicando no botão **Regras** (o arquivo é lido a partir de `manual/regras.md`).

## 📄 Licença e Direitos Autorais

O código fonte deste software é de código aberto (AGPL3). Consulte o arquivo `LICENSE` para mais detalhes.

**⚠️ ATENÇÃO: Restrições do Banco de Perguntas**
O arquivo `dados/perguntas.json` (e todo o seu conteúdo textual e educacional) **não** faz parte da licença de código aberto deste software. As perguntas, alternativas e resoluções são de propriedade intelectual de seus respectivos autores. É expressamente **proibida** qualquer forma de distribuição, cópia, derivação, reprodução ou uso comercial do conteúdo contido neste arquivo sem a devida autorização legal dos criadores.

## 🎖️ Agradecimentos e Créditos

Este projeto utiliza recursos visuais e sonoros de terceiros. Os devidos agradecimentos vão para:

* **Efeitos Sonoros:** [Pop Sounds](https://opengameart.org/content/pop-sounds-0) (disponibilizado via OpenGameArt).
* **Logo Contabilidade:** [Contabilidade Brasil](https://images.seeklogo.com/logo-png/17/1/contabilidade-brasil-logo-png_seeklogo-171216.png) (via Seeklogo).
* **Inspiração Visual (UI):** O design limpo, as bordas arredondadas e a paleta de cores grafite/azul foram fortemente inspirados no [Graphite GTK Theme](https://github.com/vinceliuice/Graphite-gtk-theme), criado por *vinceliuice*.