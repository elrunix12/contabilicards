Faça um jogo em javascript para hospedar no github pages.
Contexto: é um jogo de tabuleiro de contabilidade.
Considere que grupo ou grupo de jogadores é a quantidade de players. Esse é um projeto educacional, então muitas vezes ele é feito com muitos alunos em um grupo, mas na verdade ele será um único player

# Carregar a interface 

Nomes dos contribuidores na parte inferior esquerda
Abaixo dos contribuidores, a Licença (carrega do arquivo LICENSE na parte inferior esquerda
"Nome do Jogo" no meio da tela
Abaixo do nome do jogo, uma lista com:

- Novo jogo
- Regras (abre em menu suspenso e carregas as regras de manual/regras.md)
- Configurações

# Use local storage, caso o usuário tenha um jogo anterior não finalizado

# Para configurações: selecionar se quer ou não quer exibir perguntas e respostas - exibe apenas as alternativas, opção de som das peças se movimentando)

# Novo jogo

- Carregar tabuleiro (coloque no código que o número de casas padrão do tabuleiro é 24)
- Selecionar a quantidade de grupo jogadores (máximo 10)
- Verificar a quantidade de grupo de jogador e;
- Carregar peças e sortear a cor das peças para cada grupo
- Colocar do lado esquerdo do tabuleiro uma tabela com cor da peça do grupo e o nome do grupo (G1, G2, G3, etc...)
- Sempre que um grupo for jogar, há uma seleção na tabela com o grupo atual q tá jogando
- Não usar cores parecidas nas peças
- Carregar casas bônus do tabuleiro (elas são fixas e bote no código com casas serão bônus, bote tbm a quantidade de casas bônus). Por exemplo:

casa 1 = bônus
casa 7 = bônus
casa 10 = bônus

- Carregar casas ruins no tabuleiro (segue a mesma coisa da casa bônus)

## Cards

- carregar cards com as perguntas de dados/perguntas.json
- embaralhar cards
- carregar carta com a primeira pergunta para o primeiro grupo. 

### Regras

- O usuário escolhe se quer pergunta fácil ou difícil

#### Formato das pergunatas em .json

pergunta = 
alternativas = 
resposta correta =

#### Fácil

- Se acertar = andar uma casa
- Se errar = o grupo anterior a responder a pergunta anda 3 casas
- Adiciona uma função circular = Se o grupo atual que errou é o primeiro a responder e errou, o último grupo responde

#### Difícil

- Se acertar = andar 3 casas
- Se errar = não se mexe

### Lógica dos cards

- A lógica é a seguinte: cada carta carregada é para um cada grupo. Apos clicar em virar card, tem a resposta
- As perguntas são de múltipla escolha, tem q clicar em uma das alternativas
- função manual: clica na opção se acertou ou errou
- Antes de partir pro próximo, há uma resolução na carta
- Ao clicar em próximo abre a carta para o próximo grupo

### Contador de tempo

- Se a pergunta for fácil = tempo de 15 segundos, adiciona 2s de segurança pra dar tempo pra clicar
- Se a pergunta for difícil = tempo de 1 minuto, adiciona 2s de segurança
- Se bateu o tempo, vira a carta e marca erro

## Quando o primeiro grupo responde uma pergunta

- Surge um novo botão de segurança pra desfazer a última jogada e volta pro grupo anterior

## Final do jogo

- A peça que atingir ganha
- Imprime o ranking dos playes





 
