## [0.33.0] - 2026-05-17

### Adicionado

* Trava de segurança (Debounce) de 400ms para controles remotos e passadores de slides, evitando que falhas mecânicas ou cliques duplos acidentais pulem o turno de um grupo.
* O botão "Avançar" na tela de resultados agora recebe foco automático, permitindo o progresso fluido da partida utilizando apenas a tecla de confirmação do passador.

### Modificado

* A exibição do resultado da jogada (acertos, erros e efeitos de casas especiais) foi transferida de um pop-up temporário (Toast) para uma nova fase estática diretamente na carta central, exigindo confirmação manual para o próximo turno.
* Substituição do texto "Correto/Incorreto" na tela de resultado por ícones universais (✔️ e ❌), com escalonamento otimizado para o Modo Projetor.
* O design da tela de "Fim de Jogo" foi redesenhado para herdar a paleta visual clara e as bordas da carta central, abandonando o fundo escurecido genérico.
* A cor de destaque para navegação via teclado foi alterada para um tom de azul com sombra interna, impedindo o corte visual nos botões da carta mestre.
* Adicionado escalonamento automático das "bolinhas" coloridas de identificação dos grupos nos textos dinâmicos do Modo Projetor.

### Corrigido

* Correção na lógica de atribuição de medalhas no fim de jogo (Dense Ranking): grupos empatados na mesma casa agora recebem a mesma medalha com justiça (ex: dois 1º lugares recebem Ouro, e o próximo colocado recebe Prata).
* Resolução do "Bug do Enter Fantasma": implementação da propriedade HTML `inert` na mecânica 3D da carta, impedindo definitivamente que o navegador acione botões invisíveis nas costas da carta e reinicie o cronômetro acidentalmente.
* Correção do bug de "Inception do DRE": encadeamentos de eventos bônus não sobrescrevem mais a memória do turno. O jogo agora retorna corretamente a vez ao jogador original após sequências múltiplas de casas especiais.
* Prevenção contra a "Amnésia do DRE-": o estado do jogo agora é salvo imediatamente após a seleção de um alvo, impedindo que a atualização acidental da página (F5) resete a equipe escolhida pelo mediador.
* Correção de vazamento de estados: sair para o menu e iniciar um "Novo Jogo" enquanto uma carta aguardava o botão "Avançar" agora limpa integralmente a máquina de estados, respeitando a seleção de quem começa a nova partida.
* Prevenção de conflito de teclas: o controle da carta central via teclado é agora totalmente ignorado caso algum modal (Novo Jogo, Configurações, Regras) esteja aberto na tela.
* Correção ortográfica de espaçamento faltante no prefixo "Efeitos Extras:".

## [0.32.0] - 2026-05-10

### Adicionado
- Distribuição geométrica circular das peças no tabuleiro, eliminando a sobreposição de equipes na mesma casa.
- Suporte a PWA (Progressive Web App), permitindo instalação nativa e uso 100% offline direto pelo navegador.

### Modificado
- Melhoria no comportamento da carta central: textos muito longos agora rolam naturalmente sem distorcer o grid ou esconder o cronômetro, mantendo a centralização para cartas físicas.
- O histórico de jogadas parou de clonar o banco de perguntas completo a cada turno, focando apenas no estado do tabuleiro.

### Removido
- Suporte a empacotamento via Electron (incluindo dependências e arquivos `main.js` e `package.json`) em favor do formato PWA.
- Opção legada de "Exibir texto da pergunta" das configurações, funcionalidade agora nativamente substituída pelo "Modo Físico".

### Corrigido
- Correção na identificação do causador do evento especial (DRE-), garantindo que a equipe correta escolha o alvo caso caia na casa após responder a uma pergunta.
- Prevenção de quebra da interface (Injeção de HTML) quando alternativas possuíam aspas duplas no banco de dados.
- Correção de falha onde recarregar a página (F5) durante a escolha de alvo da casa DRE travava a mecânica do jogo.
- Eliminação do risco de estouro de limite de armazenamento do navegador (QuotaExceededError) em partidas longas.

## [0.30.0] - 2026-04-19

### Adicionado
- Efeitos sonoros de movimento das peças, com trava de segurança e opção para desativar nas configurações.
- Menu lateral deslizante (formato de gaveta) e botão flutuante para compatibilidade com dispositivos móveis.
- Tela "Sobre o Projeto" no menu inicial com créditos de autores, mantenedores e recursos de terceiros.
- Empacotamento automático do projeto via GitHub Actions.
- Geração de executáveis portáteis (`.exe` para Windows e `.AppImage` para Linux) para rodar offline.
- Fallback para a biblioteca Marked, utilizando o arquivo local caso não haja internet.

### Modificado
- A carta central agora gira na direção correspondente ao botão clicado (esquerda ou direita).
- A tela de escolha da DRE- foi movida para o centro do tabuleiro.
- Notificações de turno e pop-ups agora exibem as cores das peças das equipes.
- O Pop-up (Toast) foi movido do topo para o centro da tela para não cobrir a movimentação das peças.
- A configuração de tamanho do tabuleiro recebeu a etiqueta "(⚠️ Experimental)".
- O comportamento visual da peça na última casa (Publicação) foi mantido como decisão de design para destacar o término do jogo.

### Corrigido
- O temporizador continuava rodando em segundo plano ao voltar para o menu inicial.
- O botão "Sair do Projetor" não fechava o modo tela cheia adequadamente.
- A barra lateral cobria os botões de zoom em tabuleiros muito expandidos.
- Problema de escala e quebra de texto na lista de grupos, resolvido com Grid Fluido.