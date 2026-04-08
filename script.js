// --- CONFIGURAÇÕES INICIAIS ---
const CASAS_BONUS = [3, 8, 14, 20, 26, 31, 37, 43, 49, 55, 61, 67, 73, 79]; 
const CASAS_RUINS = [5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71, 77]; 
const CORES_DISTINTAS = ['#FF0000', '#0000FF', '#008000', '#FFA500', '#800080', '#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#800000'];

let bancoDePerguntasGeral = [];

let jogo = {
    grupos: [],
    turnoAtual: 0,
    perguntasDisponiveis: [],
    historico: [],
    historicoDesfeito: [],
    totalCasas: 32 
};

let temporizador;

// --- SISTEMA DE CONFIGURAÇÕES ---
let configuracoes = {
    somAtivo: false,
    exibirPergunta: true,
    totalCasas: 32
};

function carregarConfiguracoes() {
    if(localStorage.getItem('jogoConfigs')) {
        let salvo = JSON.parse(localStorage.getItem('jogoConfigs'));
        configuracoes.somAtivo = salvo.somAtivo || false;
        configuracoes.exibirPergunta = salvo.exibirPergunta !== undefined ? salvo.exibirPergunta : true;
        configuracoes.totalCasas = salvo.totalCasas || 32; 
    }
    
    let chkSom = document.getElementById('config-som');
    let chkPergunta = document.getElementById('config-exibir-pergunta');
    let inpCasas = document.getElementById('config-casas');
    
    if (chkSom) chkSom.checked = configuracoes.somAtivo;
    if (chkPergunta) chkPergunta.checked = configuracoes.exibirPergunta;
    if (inpCasas) inpCasas.value = configuracoes.totalCasas;
}

function salvarConfiguracoes() {
    configuracoes.somAtivo = document.getElementById('config-som').checked;
    configuracoes.exibirPergunta = document.getElementById('config-exibir-pergunta').checked;
    configuracoes.totalCasas = parseInt(document.getElementById('config-casas').value) || 32;
    
    // Força o número a ser par para o tabuleiro fechar o anel
    if (configuracoes.totalCasas % 2 !== 0) configuracoes.totalCasas += 1;
    document.getElementById('config-casas').value = configuracoes.totalCasas;
    
    localStorage.setItem('jogoConfigs', JSON.stringify(configuracoes));
}

// --- INICIALIZAÇÃO ---
window.onload = async () => {
    carregarConfiguracoes();
    if (localStorage.getItem('jogoSalvo')) {
        document.getElementById('btn-continuar').style.display = 'block';
    }
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
    jogo.historicoDesfeito = [];
    jogo.totalCasas = configuracoes.totalCasas || 32; 
    jogo.perguntasDisponiveis = [...bancoDePerguntasGeral];
    
    salvarEstado();
    montarTelaJogo();
}

function carregarJogoSalvo() {
    jogo = JSON.parse(localStorage.getItem('jogoSalvo'));
    if (!jogo.totalCasas) jogo.totalCasas = 32; 
    montarTelaJogo();
}

function salvarEstado() {
    localStorage.setItem('jogoSalvo', JSON.stringify(jogo));
}

// --- INTERFACE DO TABULEIRO DINÂMICO ---
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

    const tab = document.getElementById('tabuleiro');
    tab.innerHTML = '';

    const C = jogo.totalCasas;
    const W = Math.ceil((C + 4) / 4);
    const H = Math.floor((C + 4) / 2) - W;

    tab.style.gridTemplateColumns = `repeat(${W}, 1fr)`;
    tab.style.gridTemplateRows = `repeat(${H}, 1fr)`;

    let centro = document.createElement('div');
    centro.id = 'centro-tabuleiro';
    centro.style.gridColumn = `2 / ${W}`;
    centro.style.gridRow = `2 / ${H}`;
    centro.innerHTML = `
        <h1>Contabilidade<br>em Ação</h1>
        <button onclick="abrirPainelPergunta()" id="btn-jogar">Sortear Pergunta</button>
    `;
    tab.appendChild(centro);

    // Desenha o anel de casas
    for (let i = 0; i < C; i++) {
        let div = document.createElement('div');
        
        let ehBonus = CASAS_BONUS.includes(i) && i !== 0;
        let ehRuim = CASAS_RUINS.includes(i) && i !== 0;
        
        div.className = `casa ${ehBonus ? 'bonus' : ''} ${ehRuim ? 'ruim' : ''}`;
        div.id = `casa-${i}`;
        
        let conteudoHTML = "";
        
        if (i === 0) {
            // A casa 0 agora é o início e o fim simultaneamente
            conteudoHTML = `<span class="efeito-casa" style="color: #333; font-size: 1rem; text-align: center; line-height: 1.2;">INÍCIO /<br>FIM</span>`;
            div.style.background = "#ffd700"; 
            div.style.borderColor = "#c6a700";
        } else {
            conteudoHTML = `<span class="numero">${i}</span>`;
            if (ehBonus) {
                conteudoHTML += `<span class="efeito-casa">+2 Casas</span>`;
            } else if (ehRuim) {
                conteudoHTML += `<span class="efeito-casa">-2 Casas</span>`;
            }
        }
        
        div.innerHTML = conteudoHTML;

        let row, col;
        if (i < W) { 
            row = H; col = W - i;
        } else if (i < W + H - 1) { 
            let j = i - W; row = H - 1 - j; col = 1;
        } else if (i < 2 * W + H - 2) { 
            let j = i - (W + H - 1); row = 1; col = 2 + j;
        } else { 
            let j = i - (2 * W + H - 2); row = 2 + j; col = W;
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
        // Se a posição for igual ou maior que o total (completou a volta), a peça renderiza na casa 0
        let idCasaVisual = g.posicao >= jogo.totalCasas ? 0 : g.posicao;
        let casaDiv = document.getElementById(`casa-${idCasaVisual}`);
        
        if(casaDiv) {
            let peca = document.createElement('div');
            peca.className = 'peca';
            peca.style.backgroundColor = g.cor;
            peca.style.transform = `translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px)`;
            casaDiv.appendChild(peca);
        }
    });
}

// --- FUNÇÕES DE MEMÓRIA SEGURA ---
function obterFotoDoJogo() {
    return JSON.stringify({
        grupos: jogo.grupos,
        turnoAtual: jogo.turnoAtual,
        perguntasDisponiveis: jogo.perguntasDisponiveis,
        totalCasas: jogo.totalCasas
    });
}

function aplicarFotoDoJogo(fotoString) {
    let backup = JSON.parse(fotoString);
    jogo.grupos = backup.grupos;
    jogo.turnoAtual = backup.turnoAtual;
    jogo.perguntasDisponiveis = backup.perguntasDisponiveis;
    jogo.totalCasas = backup.totalCasas || 32;
}

// --- LÓGICA DE PERGUNTAS E TURNOS ---
function abrirPainelPergunta() {
    jogo.historico.push(obterFotoDoJogo());
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
    
    let perguntasFiltradas = jogo.perguntasDisponiveis.filter(p => p.dificuldade === dificuldade);
    
    if (perguntasFiltradas.length === 0) {
        let desejaReembaralhar = confirm(`As cartas de nível ${dificuldade} acabaram!\n\nClique em [OK] para reembaralhar.\nClique em [Cancelar] para encerrar o jogo e ver o ranking.`);
        if (desejaReembaralhar) {
            const recuperarPerguntas = bancoDePerguntasGeral.filter(p => p.dificuldade === dificuldade);
            jogo.perguntasDisponiveis.push(...recuperarPerguntas);
            perguntasFiltradas = recuperarPerguntas; 
        } else {
            encerrarJogoMostrarRanking();
            return; 
        }
    }

    document.getElementById('area-pergunta').style.display = 'block';

    const indiceSorteado = Math.floor(Math.random() * perguntasFiltradas.length);
    perguntaAtual = perguntasFiltradas[indiceSorteado];
    
    const indexNoBaralho = jogo.perguntasDisponiveis.findIndex(p => p.pergunta === perguntaAtual.pergunta);
    if (indexNoBaralho !== -1) jogo.perguntasDisponiveis.splice(indexNoBaralho, 1);
    
    if (configuracoes.exibirPergunta) {
        document.getElementById('texto-pergunta').innerText = perguntaAtual.pergunta;
    } else {
        document.getElementById('texto-pergunta').innerText = "[A pergunta será lida pelo mediador. Escolha a alternativa correta abaixo:]";
    }
    
    const altDiv = document.getElementById('alternativas');
    altDiv.innerHTML = perguntaAtual.alternativas.map(alt => 
        `<button class="alternativa" onclick="responder('${alt}')">${alt}</button>`
    ).join('');

    iniciarTemporizador(dificuldade === 'facil' ? 17 : 62); 
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
    document.getElementById('alternativas').innerHTML = ''; 
    const resolucaoDiv = document.getElementById('resolucao');
    resolucaoDiv.style.display = 'block';

    let grupoAtual = jogo.grupos[jogo.turnoAtual];
    let msg = acertou ? `Correto, ${grupoAtual.nome}! ` : `Incorreto, ${grupoAtual.nome}. `;

    if (dificuldadeAtual === 'facil') {
        if (acertou) {
            grupoAtual.posicao += 1;
            msg += "Você andou 1 casa.";
        } else {
            let idxAnterior = jogo.turnoAtual === 0 ? jogo.grupos.length - 1 : jogo.turnoAtual - 1;
            jogo.grupos[idxAnterior].posicao += 3;
            msg += `O grupo anterior (${jogo.grupos[idxAnterior].nome}) andou 3 casas!`;
        }
    } else { 
        if (acertou) {
            grupoAtual.posicao += 3;
            msg += "Você andou 3 casas!";
        } else {
            msg += "Você não se move.";
        }
    }

    let grupoQueMoveu = acertou ? grupoAtual : (dificuldadeAtual === 'facil' ? jogo.grupos[jogo.turnoAtual === 0 ? jogo.grupos.length - 1 : jogo.turnoAtual - 1] : null);

    if (grupoQueMoveu && grupoQueMoveu.posicao < jogo.totalCasas) {
        if (CASAS_BONUS.includes(grupoQueMoveu.posicao)) {
            grupoQueMoveu.posicao += 2;
            msg += `\n🎉 BÔNUS: O ${grupoQueMoveu.nome} caiu em uma casa bônus e avançou +2 casas!`;
        } else if (CASAS_RUINS.includes(grupoQueMoveu.posicao)) {
            grupoQueMoveu.posicao -= 2;
            if (grupoQueMoveu.posicao < 0) grupoQueMoveu.posicao = 0; 
            msg += `\n⚠️ AZAR: O ${grupoQueMoveu.nome} caiu em uma casa ruim e recuou 2 casas!`;
        }
    }

    // Trava quando o jogador completa a volta
    jogo.grupos.forEach(g => { if(g.posicao > jogo.totalCasas) g.posicao = jogo.totalCasas; });

    document.getElementById('texto-resolucao').innerText = msg + `\nResolução: ${perguntaAtual.resolucao}`;
}

function proximoTurno() {
    document.getElementById('modal-pergunta').classList.remove('ativo');
    
    // Verifica se alguém completou a volta inteira
    let ganhador = jogo.grupos.find(g => g.posicao >= jogo.totalCasas);
    if (ganhador) {
        encerrarJogoMostrarRanking();
        return;
    }

    jogo.turnoAtual = (jogo.turnoAtual + 1) % jogo.grupos.length;
    salvarEstado();
    montarTelaJogo();
}

function desfazerJogada() {
    if (jogo.historico.length > 0) {
        let historicoAtual = jogo.historico;
        let desfeitoAtual = jogo.historicoDesfeito || [];
        
        desfeitoAtual.push(obterFotoDoJogo());
        let estadoAnterior = historicoAtual.pop();
        aplicarFotoDoJogo(estadoAnterior);
        
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
        
        historicoAtual.push(obterFotoDoJogo());
        let estadoRefeito = desfeitoAtual.pop();
        aplicarFotoDoJogo(estadoRefeito);
        
        jogo.historico = historicoAtual;
        jogo.historicoDesfeito = desfeitoAtual;
        
        salvarEstado();
        montarTelaJogo();
    }
}

function encerrarJogoMostrarRanking() {
    document.getElementById('modal-pergunta').classList.remove('ativo');
    
    let ranking = [...jogo.grupos].sort((a, b) => b.posicao - a.posicao);
    let maiorPosicao = ranking[0].posicao;
    let vencedores = ranking.filter(g => g.posicao === maiorPosicao).map(g => g.nome);
    
    let mensagem = "🏆 FIM DE JOGO! 🏆\n\n";
    if (vencedores.length > 1) {
        mensagem += `Houve um empate! Os vencedores são: ${vencedores.join(', ')} (Volta Completa)\n\n`;
    } else {
        mensagem += `O grande vencedor é: ${vencedores[0]} (Volta Completa)\n\n`;
    }
    
    mensagem += "--- RANKING FINAL ---\n";
    ranking.forEach((g, index) => {
        let casaAtual = g.posicao === jogo.totalCasas ? "Chegada" : g.posicao;
        mensagem += `${index + 1}º Lugar: ${g.nome} - Casa ${casaAtual}\n`;
    });
    
    alert(mensagem);
    localStorage.removeItem('jogoSalvo');
    location.reload();
}

// --- NAVEGAÇÃO, MODAIS E ZOOM ---
function voltarMenu() {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    document.getElementById('tela-inicial').classList.add('ativa');
    if (localStorage.getItem('jogoSalvo')) document.getElementById('btn-continuar').style.display = 'block';
}

function abrirModal(id) {
    document.getElementById(id).classList.add('ativo');
    if (id === 'modal-regras') carregarRegras();
}

function fecharModal(id) {
    document.getElementById(id).classList.remove('ativo');
}

async function carregarRegras() {
    try {
        const response = await fetch('manual/regras.md');
        if (!response.ok) throw new Error("Arquivo não encontrado");
        const texto = await response.text();
        if(typeof marked !== 'undefined') {
            document.getElementById('conteudo-regras').innerHTML = marked.parse(texto);
        } else {
            document.getElementById('conteudo-regras').innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${texto}</pre>`;
        }
    } catch (error) {
        document.getElementById('conteudo-regras').innerHTML = "Arquivo manual/regras.md não encontrado.";
    }
}

function atualizarBotoesHistorico() {
    const btnDesfazer = document.getElementById('btn-desfazer');
    const btnRefazer = document.getElementById('btn-refazer');
    if(btnDesfazer) btnDesfazer.disabled = jogo.historico.length === 0;
    let qtdDesfeito = jogo.historicoDesfeito ? jogo.historicoDesfeito.length : 0;
    if(btnRefazer) btnRefazer.disabled = qtdDesfeito === 0;
}

let nivelZoom = 1; 
function mudarZoom(alteracao) {
    nivelZoom += alteracao;
    if (nivelZoom < 0.5) nivelZoom = 0.5;
    if (nivelZoom > 2.0) nivelZoom = 2.0;
    document.getElementById('tabuleiro').style.transform = `scale(${nivelZoom})`;
}

function alternarModoProjetor() {
    const body = document.body;
    body.classList.toggle('modo-projetor');
    const btn = document.getElementById('btn-projetor');
    if (body.classList.contains('modo-projetor')) {
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
        btn.innerText = "Sair do Projetor";
        btn.style.backgroundColor = "#dc3545"; 
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        btn.innerText = "Modo Projetor";
        btn.style.backgroundColor = "#007bff"; 
    }
}