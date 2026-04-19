## [0.30.0] - 2026-04-19

### Adicionado
- Efeitos sonoros de movimento das peças, com trava de segurança e opção para desativar nas configurações.
- Menu lateral deslizante (formato de gaveta) e botão flutuante para compatibilidade com dispositivos móveis.
- Tela "Sobre o Projeto" no menu inicial com créditos de autores, mantenedores e recursos de terceiros.
- Empacotamento automático do projeto via GitHub Actions.
- Geração de executáveis portáteis (`.exe` para Windows e `.AppImage` para Linux) para rodar offline.
- Fallback para a biblioteca Marked, utilizando o arquivo local caso não haja internet.

### Alterado
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