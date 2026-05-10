## [0.31.1] - 2026-05-10

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