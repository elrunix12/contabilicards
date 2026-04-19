## [0.30.0] - 2026-04-19

### Adicionado
- Efeitos sonoros de movimento das peças, incluindo uma trava de segurança e opção para desativar nas configurações.
- Menu lateral deslizante (formato de gaveta) e botão flutuante para compatibilidade com telemóveis e ecrãs pequenos.
- Novo ecrã "Sobre o Projeto" no menu inicial para destacar autores, mantenedores e créditos de recursos de terceiros.
- Empacotamento automático do projeto via GitHub Actions.
- Geração de executáveis portáteis (`.exe` para Windows e `.AppImage` para Linux) para uso *offline* sem necessidade de instalação ou permissões de administrador.
- Mecanismo de *fallback* para a biblioteca Marked, carregando a versão local caso o sistema não tenha ligação à internet.

### Alterado
- Dinâmica visual da carta central: a carta passa a girar na direção do botão clicado (esquerda ou direita).
- A seleção de alvo da Armadilha DRE- foi movida do modal de ecrã inteiro para o centro do tabuleiro, permitindo a visualização da posição das peças antes da escolha.
- Identidade visual das notificações: a cor da equipa passa a ser exibida nos textos de turno e nos *pop-ups* (*Toast*).
- A configuração de tamanho do tabuleiro recebeu a etiqueta "(⚠️ Experimental)" para melhor orientação do mediador.

### Corrigido
- O relógio (temporizador) continua a contar indevidamente após voltar ao menu principal.
- O botão de "Sair do Projetor" não encerrava a funcionalidade de ecrã inteiro (*fullscreen*) no navegador.
- A barra lateral de grupos sobrepunha-se aos botões de *zoom* ao aumentar demasiado o tabuleiro (corrigido com *Flexbox* e *z-index*).
- Quebra de escala de texto na área dos grupos resolvida com a implementação de um *Grid* fluido inteligente.