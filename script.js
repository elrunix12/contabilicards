// --- CONFIGURAÇÕES INICIAIS ---
const NUM_CASAS = 24;
const CASAS_BONUS = [1, 7, 10]; 
const CASAS_RUINS = [4, 13, 19]; 
const CORES_DISTINTAS = ['#FF0000', '#0000FF', '#008000', '#FFA500', '#800080', '#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#800000'];

// Variável para guardar TODAS as perguntas do arquivo
let bancoDePerguntasGeral = [];

let jogo = {
    grupos: [],
    turnoAtual: 0,
    perguntasDisponiveis: [],
    historico: [],
    historicoDesfeito: []
};

let temporizador;

// --- INICIALIZAÇÃO ---
window.onload = async () => {
    carregarConfiguracoes();
    if (localStorage.getItem('jogoSalvo')) {
        document.getElementById('btn-continuar').style.display = 'block';
    }
    // Carrega o banco de perguntas geral
    try {
        const resposta = await fetch('dados/perguntas.json');
        bancoDePerguntasGeral = await resposta.json();
    } catch (e) {
        console.error("Crie o arquivo dados/perguntas.json primeiro.");
    }
};

function iniciarNovoJogo() {
    let qtd = parseInt(prompt("Quantos grupos/jogadores? (Máx 10)"));
    if (isNaN(qtd) || qtd < 1 || qtd > 10) return alert("Número inválido.");

    jogo.grupos = [];
    for (let i = 0; i < qtd; i++) {
        jogo.grupos.push({ id: i, nome: `G${i + 1}`, posicao: 0, cor: CORES_DISTINTAS[i] });
    }
    jogo.turnoAtual = 0;
    jogo.historico = [];
    jogo.historicoDesfeito = []; // Zera o refazer no novo jogo
    
    // Copia todas as perguntas do banco para o baralho do jogo atual
    jogo.perguntasDisponiveis = [...bancoDePerguntasGeral];
    
    salvarEstado();
    montarTelaJogo();
}

function carregarJogoSalvo() {
    jogo = JSON.parse(localStorage.getItem('jogoSalvo'));
    montarTelaJogo();
}

function salvarEstado() {
    localStorage.setItem('jogoSalvo', JSON.stringify(jogo));
}

// --- INTERFACE DO TABULEIRO ---
function montarTelaJogo() {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    document.getElementById('tela-jogo').classList.add('ativa');
    
    const tabela = document.getElementById('tabela-grupos');
    tabela.innerHTML = jogo.grupos.map((g, i) => `
        <div class="grupo-item ${i === jogo.turnoAtual ? 'ativo' : ''}" style="padding: 10px; margin: 5px 0; border-radius: 4px;">
            <span style="display:inline-block; width:15px; height:15px; background:${g.cor}; border-radius:50%;"></span>
            ${g.nome} - Casa ${g.posicao}
        </div>
    `).join('');

    // --- Monta Tabuleiro (Formato Clássico / Banco Imobiliário) ---
    const tab = document.getElementById('tabuleiro');
    tab.innerHTML = '';

    // Cria a área central com o nome do jogo E O BOTÃO DE JOGAR
    let centro = document.createElement('div');
    centro.id = 'centro-tabuleiro';
    centro.innerHTML = `
        <h1>Contabilidade<br>em Ação</h1>
        <button onclick="abrirPainelPergunta()" id="btn-jogar">Sortear Pergunta</button>
    `;
    tab.appendChild(centro);

    // Desenha as casas nas bordas
    for (let i = 0; i <= NUM_CASAS; i++) {
        let div = document.createElement('div');
        
        let ehBonus = CASAS_BONUS.includes(i);
        let ehRuim = CASAS_RUINS.includes(i);
        
        div.className = `casa ${ehBonus ? 'bonus' : ''} ${ehRuim ? 'ruim' : ''}`;
        div.id = `casa-${i}`;
        
        // Adiciona o número da casa e o texto de efeito
        let conteudoHTML = `<span class="numero">${i === 0 ? 'Início' : i}</span>`;
        if (ehBonus) {
            conteudoHTML += `<span class="efeito-casa">+2 Casas</span>`;
        } else if (ehRuim) {
            conteudoHTML += `<span class="efeito-casa">-2 Casas</span>`;
        }
        div.innerHTML = conteudoHTML;

        // Define a posição exata de cada casa no formato de anel
        let row, col;
        if (i >= 0 && i <= 6) { // Borda inferior (direita pra esquerda)
            row = 8;
            col = 7 - i;
        } else if (i >= 7 && i <= 12) { // Borda esquerda (baixo pra cima)
            col = 1;
            row = 8 - (i - 6);
        } else if (i >= 13 && i <= 19) { // Borda superior (esquerda pra direita)
            row = 1;
            col = i - 12; 
        } else if (i >= 20 && i <= 24) { // Borda direita (cima pra baixo)
            col = 7;
            row = 1 + (i - 19); 
        }
        
        div.style.gridRow = row;
        div.style.gridColumn = col;

        tab.appendChild(div);
    }

    posicionarPecas();
    atualizarBotoesHistorico();
}

function posicionarPecas() {
    jogo.grupos.forEach(g => {
        let casaDiv = document.getElementById(`casa-${g.posicao}`);
        if(casaDiv) {
            let peca = document.createElement('div');
            peca.className = 'peca';
            peca.style.backgroundColor = g.cor;
            // Deslocamento leve para peças na mesma casa não sumirem
            peca.style.transform = `translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px)`;
            casaDiv.appendChild(peca);
        }
    });
}

// --- LÓGICA DE PERGUNTAS E TURNOS ---
function abrirPainelPergunta() {
    // Salva o histórico usando a foto SEGURA
    jogo.historico.push(obterFotoDoJogo());
    
    // Se ele começou uma NOVA jogada, apagamos a linha do tempo "desfeita"
    jogo.historicoDesfeito = []; 
    atualizarBotoesHistorico();

    document.getElementById('modal-pergunta').classList.add('ativo');
    document.getElementById('bloco-dificuldade').style.display = 'block';
    document.getElementById('area-pergunta').style.display = 'none';
    document.getElementById('resolucao').style.display = 'none';
    document.getElementById('grupo-atual-texto').innerText = `Turno do ${jogo.grupos[jogo.turnoAtual].nome}`;
}

let perguntaAtual;
let dificuldadeAtual;

function carregarPergunta(dificuldade) {
    dificuldadeAtual = dificuldade;
    document.getElementById('bloco-dificuldade').style.display = 'none';
    
    // Filtra apenas as perguntas da dificuldade escolhida que ainda ESTÃO no baralho
    let perguntasFiltradas = jogo.perguntasDisponiveis.filter(p => p.dificuldade === dificuldade);
    
    // Se acabaram as perguntas dessa dificuldade
    if (perguntasFiltradas.length === 0) {
        let desejaReembaralhar = confirm(`As cartas de nível ${dificuldade} acabaram!\n\nClique em [OK] para reembaralhar.\nClique em [Cancelar] para encerrar o jogo e ver o ranking.`);
        
        if (desejaReembaralhar) {
            const recuperarPerguntas = bancoDePerguntasGeral.filter(p => p.dificuldade === dificuldade);
            jogo.perguntasDisponiveis.push(...recuperarPerguntas);
            perguntasFiltradas = recuperarPerguntas; // Atualiza a lista filtrada
        } else {
            encerrarJogoMostrarRanking();
            return; // Interrompe a função para não tentar sortear pergunta
        }
    }

    document.getElementById('area-pergunta').style.display = 'block';

    // Sorteia a pergunta
    const indiceSorteado = Math.floor(Math.random() * perguntasFiltradas.length);
    perguntaAtual = perguntasFiltradas[indiceSorteado];
    
    // REMOVE a pergunta sorteada do baralho de disponíveis
    const indexNoBaralho = jogo.perguntasDisponiveis.findIndex(p => p.pergunta === perguntaAtual.pergunta);
    if (indexNoBaralho !== -1) {
        jogo.perguntasDisponiveis.splice(indexNoBaralho, 1);
    }
    
    // Exibe a pergunta e as opções
    // Verifica a configuração antes de exibir a pergunta
    if (configuracoes.exibirPergunta) {
        document.getElementById('texto-pergunta').innerText = perguntaAtual.pergunta;
    } else {
        document.getElementById('texto-pergunta').innerText = "[A pergunta será lida pelo mediador. Escolha a alternativa correta abaixo:]";
    }
    const altDiv = document.getElementById('alternativas');
    altDiv.innerHTML = perguntaAtual.alternativas.map(alt => 
        `<button class="alternativa" onclick="responder('${alt}')">${alt}</button>`
    ).join('');

    iniciarTemporizador(dificuldade === 'facil' ? 17 : 62); // +2s de segurança
}

function iniciarTemporizador(segundos) {
    let tempo = segundos;
    document.getElementById('contador').innerText = tempo;
    clearInterval(temporizador);
    temporizador = setInterval(() => {
        tempo--;
        document.getElementById('contador').innerText = tempo;
        if (tempo <= 0) {
            clearInterval(temporizador);
            alert("Tempo Esgotado!");
            processarResposta(false);
        }
    }, 1000);
}

function responder(alternativa) {
    clearInterval(temporizador);
    const acertou = alternativa === perguntaAtual.correta;
    processarResposta(acertou);
}

function processarResposta(acertou) {
    document.getElementById('alternativas').innerHTML = ''; // Oculta opções
    const resolucaoDiv = document.getElementById('resolucao');
    resolucaoDiv.style.display = 'block';

    let grupoAtual = jogo.grupos[jogo.turnoAtual];
    let msg = acertou ? `Correto, ${grupoAtual.nome}! ` : `Incorreto, ${grupoAtual.nome}. `;

    if (dificuldadeAtual === 'facil') {
        if (acertou) {
            grupoAtual.posicao += 1;
            msg += "Você andou 1 casa.";
        } else {
            // Lógica circular para grupo anterior
            let idxAnterior = jogo.turnoAtual === 0 ? jogo.grupos.length - 1 : jogo.turnoAtual - 1;
            jogo.grupos[idxAnterior].posicao += 3;
            msg += `O grupo anterior (${jogo.grupos[idxAnterior].nome}) andou 3 casas!`;
        }
    } else { // Difícil
        if (acertou) {
            grupoAtual.posicao += 3;
            msg += "Você andou 3 casas!";
        } else {
            msg += "Você não se move.";
        }
    }

    // --- INÍCIO DA LÓGICA DE CASAS ESPECIAIS ---
    // Identifica quem acabou de se mover nesta rodada
    let grupoQueMoveu = acertou ? grupoAtual : (dificuldadeAtual === 'facil' ? jogo.grupos[jogo.turnoAtual === 0 ? jogo.grupos.length - 1 : jogo.turnoAtual - 1] : null);

    if (grupoQueMoveu) {
        if (CASAS_BONUS.includes(grupoQueMoveu.posicao)) {
            grupoQueMoveu.posicao += 2;
            msg += `\n🎉 BÔNUS: O ${grupoQueMoveu.nome} caiu em uma casa bônus e avançou +2 casas!`;
        } else if (CASAS_RUINS.includes(grupoQueMoveu.posicao)) {
            grupoQueMoveu.posicao -= 2;
            if (grupoQueMoveu.posicao < 0) grupoQueMoveu.posicao = 0; // Evita posição negativa
            msg += `\n⚠️ AZAR: O ${grupoQueMoveu.nome} caiu em uma casa ruim e recuou 2 casas!`;
        }
    }
    // --- FIM DA LÓGICA DE CASAS ESPECIAIS ---


    // Trava no número máximo de casas
    jogo.grupos.forEach(g => { if(g.posicao > NUM_CASAS) g.posicao = NUM_CASAS; });

    document.getElementById('texto-resolucao').innerText = msg + `\nResolução: ${perguntaAtual.resolucao}`;
}

function proximoTurno() {
    document.getElementById('modal-pergunta').classList.remove('ativo');
    
    // Verifica se alguém ganhou (chegou na última casa)
    let ganhador = jogo.grupos.find(g => g.posicao >= NUM_CASAS);
    if (ganhador) {
        encerrarJogoMostrarRanking();
        return;
    }

    // Passa o turno
    jogo.turnoAtual = (jogo.turnoAtual + 1) % jogo.grupos.length;
    salvarEstado();
    montarTelaJogo();
}

function desfazerJogada() {
    if (jogo.historico.length > 0) {
        let historicoAtual = jogo.historico;
        let desfeitoAtual = jogo.historicoDesfeito || [];
        
        // Salva o estado atual (antes de desfazer) no histórico de "desfeitos"
        desfeitoAtual.push(obterFotoDoJogo());
        
        // Puxa a foto do passado
        let estadoAnterior = historicoAtual.pop();
        aplicarFotoDoJogo(estadoAnterior);
        
        // Devolve os históricos intactos pro jogo
        jogo.historico = historicoAtual;
        jogo.historicoDesfeito = desfeitoAtual;
        
        salvarEstado();
        montarTelaJogo();
    }
}

function refazerJogada() {
    if (jogo.historicoDesfeito && jogo.historicoDesfeito.length > 0) {
        let historicoAtual = jogo.historico;
        let desfeitoAtual = jogo.historicoDesfeito;
        
        // Salva o estado atual no histórico normal 
        historicoAtual.push(obterFotoDoJogo());
        
        // Puxa a foto do futuro que havia sido desfeita
        let estadoRefeito = desfeitoAtual.pop();
        aplicarFotoDoJogo(estadoRefeito);
        
        // Devolve os históricos intactos pro jogo
        jogo.historico = historicoAtual;
        jogo.historicoDesfeito = desfeitoAtual;
        
        salvarEstado();
        montarTelaJogo();
    }
}

function encerrarJogoMostrarRanking() {
    // Esconde o modal de pergunta caso esteja aberto
    document.getElementById('modal-pergunta').classList.remove('ativo');
    
    // Ordena os grupos da maior posição para a menor
    let ranking = [...jogo.grupos].sort((a, b) => b.posicao - a.posicao);
    
    // Identifica a maior pontuação (do primeiro do ranking ordenado)
    let maiorPosicao = ranking[0].posicao;
    
    // Encontra todos os grupos que estão na maior posição (caso haja empate)
    let vencedores = ranking.filter(g => g.posicao === maiorPosicao).map(g => g.nome);
    
    let mensagem = "🏆 FIM DE JOGO! 🏆\n\n";
    
    if (vencedores.length > 1) {
        mensagem += `Houve um empate! Os vencedores são: ${vencedores.join(', ')} (Casa ${maiorPosicao})\n\n`;
    } else {
        mensagem += `O grande vencedor é: ${vencedores[0]} (Casa ${maiorPosicao})\n\n`;
    }
    
    mensagem += "--- RANKING FINAL ---\n";
    ranking.forEach((g, index) => {
        mensagem += `${index + 1}º Lugar: ${g.nome} - Casa ${g.posicao}\n`;
    });
    
    alert(mensagem);
    
    // Limpa o save do jogo e recarrega a página para o menu inicial
    localStorage.removeItem('jogoSalvo');
    location.reload();
}

// --- SISTEMA DE CONFIGURAÇÕES ---
let configuracoes = {
    somAtivo: false,
    exibirPergunta: true
};

// Carrega as configurações ao abrir o jogo
function carregarConfiguracoes() {
    if(localStorage.getItem('jogoConfigs')) {
        configuracoes = JSON.parse(localStorage.getItem('jogoConfigs'));
    }
    
    // Atualiza os botões visuais das configurações se os elementos existirem na tela
    let chkSom = document.getElementById('config-som');
    let chkPergunta = document.getElementById('config-exibir-pergunta');
    
    if (chkSom) chkSom.checked = configuracoes.somAtivo;
    if (chkPergunta) chkPergunta.checked = configuracoes.exibirPergunta;
}

function salvarConfiguracoes() {
    configuracoes.somAtivo = document.getElementById('config-som').checked;
    configuracoes.exibirPergunta = document.getElementById('config-exibir-pergunta').checked;
    localStorage.setItem('jogoConfigs', JSON.stringify(configuracoes));
}


// --- NAVEGAÇÃO E MODAIS ---
function voltarMenu() {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    document.getElementById('tela-inicial').classList.add('ativa');
    
    if (localStorage.getItem('jogoSalvo')) {
        document.getElementById('btn-continuar').style.display = 'block';
    }
}

function abrirModal(id) {
    document.getElementById(id).classList.add('ativo');
    
    // Se for o modal de regras, busca o texto do arquivo .md
    if (id === 'modal-regras') {
        carregarRegras();
    }
}

function fecharModal(id) {
    document.getElementById(id).classList.remove('ativo');
}

async function carregarRegras() {
    try {
        const response = await fetch('manual/regras.md');
        if (!response.ok) throw new Error("Arquivo não encontrado");
        
        const texto = await response.text();
        // Exibe o markdown usando <pre> para respeitar quebras de linha e formatação básica
        document.getElementById('conteudo-regras').innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${texto}</pre>`;
    } catch (error) {
        document.getElementById('conteudo-regras').innerHTML = "Arquivo manual/regras.md não encontrado.";
    }
}

function atualizarBotoesHistorico() {
    const btnDesfazer = document.getElementById('btn-desfazer');
    const btnRefazer = document.getElementById('btn-refazer');
    
    if(btnDesfazer) btnDesfazer.disabled = jogo.historico.length === 0;
    
    // Se a propriedade ainda não existir (jogos antigos salvos), considera como 0
    let qtdDesfeito = jogo.historicoDesfeito ? jogo.historicoDesfeito.length : 0;
    if(btnRefazer) btnRefazer.disabled = qtdDesfeito === 0;
}

// --- FUNÇÕES DE MEMÓRIA SEGURA ---
function obterFotoDoJogo() {
    // Tira a foto APENAS do que importa, ignorando o histórico para não gerar bola de neve
    return JSON.stringify({
        grupos: jogo.grupos,
        turnoAtual: jogo.turnoAtual,
        perguntasDisponiveis: jogo.perguntasDisponiveis
    });
}

function aplicarFotoDoJogo(fotoString) {
    // Restaura as peças e cartas a partir da foto
    let backup = JSON.parse(fotoString);
    jogo.grupos = backup.grupos;
    jogo.turnoAtual = backup.turnoAtual;
    jogo.perguntasDisponiveis = backup.perguntasDisponiveis;
}

// --- MODO PROJETOR ---
function alternarModoProjetor() {
    const body = document.body;
    body.classList.toggle('modo-projetor');
    
    const btn = document.getElementById('btn-projetor');
    
    if (body.classList.contains('modo-projetor')) {
        // Tenta colocar o navegador em tela cheia
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        }
        btn.innerText = "Sair do Projetor";
        btn.style.backgroundColor = "#dc3545"; // Fica vermelho pra indicar saída
    } else {
        // Sai da tela cheia
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        btn.innerText = "Modo Projetor";
        btn.style.backgroundColor = "#007bff"; // Volta ao azul
    }
}

// --- SISTEMA DE ZOOM ---
let nivelZoom = 1; // 1 significa 100% (tamanho original)

function mudarZoom(alteracao) {
    nivelZoom += alteracao;
    
    // Limita o zoom para não ficar nem minúsculo nem gigantesco (de 50% a 200%)
    if (nivelZoom < 0.5) nivelZoom = 0.5;
    if (nivelZoom > 2.0) nivelZoom = 2.0;
    
    // Aplica a transformação visual no tabuleiro
    document.getElementById('tabuleiro').style.transform = `scale(${nivelZoom})`;
}