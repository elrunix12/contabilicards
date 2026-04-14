// --- CONFIGURAÇÕES INICIAIS ---
// Mapeamento exato das casas especiais
const CASAS_ESPECIAIS = {
    5: 'BP+', 9: 'IR-', 12: 'BP-', 15: 'IR+', 18: 'DRE-', 21: 'DRE+', 25: 'BP-', 26: 'IR-'
};
const CORES_DISTINTAS = ['#FF0000', '#0000FF', '#008000', '#FFA500', '#800080', '#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#800000'];
const LIMITE_HISTORICO = 20;

let bancoDePerguntasGeral = [];

let jogo = {
    grupos: [],
    turnoAtual: 0,
    perguntasDisponiveis: [],
    historico: [],
    historicoDesfeito: [],
    totalCasas: 28,
    // Variáveis para gerenciar a memória dos Eventos DRE
    pendenciaDRE: null,
    emEventoDRE: false,
    turnoRetornoDRE: null
};

let temporizador;

// --- SISTEMA DE CONFIGURAÇÕES ---
let configuracoes = {
    somAtivo: false,
    exibirPergunta: true,
    totalCasas: 28
};

function carregarConfiguracoes() {
    if(localStorage.getItem('jogoConfigs')) {
        let salvo = JSON.parse(localStorage.getItem('jogoConfigs'));
        configuracoes.somAtivo = salvo.somAtivo || false;
        configuracoes.exibirPergunta = salvo.exibirPergunta !== undefined ? salvo.exibirPergunta : true;
        configuracoes.totalCasas = salvo.totalCasas || 28; 
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
    configuracoes.totalCasas = parseInt(document.getElementById('config-casas').value) || 28;
    
    if (configuracoes.totalCasas % 2 !== 0) configuracoes.totalCasas += 1;
    document.getElementById('config-casas').value = configuracoes.totalCasas;
    
    localStorage.setItem('jogoConfigs', JSON.stringify(configuracoes));
}

// --- INICIALIZAÇÃO E SELEÇÃO DE PRIMEIRO JOGADOR ---
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
    jogo.historico = [];
    jogo.historicoDesfeito = [];
    jogo.totalCasas = configuracoes.totalCasas || 28; 
    jogo.perguntasDisponiveis = [...bancoDePerguntasGeral];
    
    abrirSelecaoPrimeiro();
}

function abrirSelecaoPrimeiro() {
    const lista = document.getElementById('lista-selecao-grupos');
    lista.innerHTML = jogo.grupos.map((g, i) => `
        <button class="btn-selecao" onclick="definirPrimeiro(${i})">
            <span style="display:inline-block; width:20px; height:20px; background:${g.cor}; border-radius:50%; margin-right:15px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></span>
            ${g.nome}
        </button>
    `).join('');

    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    document.getElementById('modal-selecao-primeiro').classList.add('ativo');
}

function definirPrimeiro(index) {
    jogo.turnoAtual = index;
    document.getElementById('modal-selecao-primeiro').classList.remove('ativo');
    salvarEstado();
    montarTelaJogo();
}

function carregarJogoSalvo() {
    jogo = JSON.parse(localStorage.getItem('jogoSalvo'));
    if (!jogo.totalCasas) jogo.totalCasas = 28; 
    montarTelaJogo();
}

function salvarEstado() {
    localStorage.setItem('jogoSalvo', JSON.stringify(jogo));
}

// --- INTERFACE DO TABULEIRO DINÂMICO RETANGULAR ---
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
    const W = Math.ceil((C + 4) / 4) + 1;
    const H = Math.floor((C + 4) / 2) - W;

    tab.style.gridTemplateColumns = `repeat(${W}, 1fr)`;
    tab.style.gridTemplateRows = `repeat(${H}, 1fr)`;

    let centro = document.createElement('div');
    centro.id = 'centro-tabuleiro';
    centro.style.gridColumn = `2 / ${W}`;
    centro.style.gridRow = `2 / ${H}`;
    centro.innerHTML = `
        <h1>Contabilicards!</h1>
        <button onclick="abrirPainelPergunta()" id="btn-jogar">Sortear Pergunta</button>
    `;
    tab.appendChild(centro);

    // Desenha o anel de casas (Sentido Anti-Horário)
    for (let i = 0; i < C; i++) {
        let div = document.createElement('div');
        
        let tipoEspecial = CASAS_ESPECIAIS[i];
        let ehEspecial = tipoEspecial !== undefined && i !== 0 && i !== C - 1;
        
        div.className = `casa ${ehEspecial ? 'bonus' : ''}`;
        div.id = `casa-${i}`;
        
        let conteudoHTML = "";
        
        if (i === 0) {
            conteudoHTML = `<span class="efeito-casa" style="color: #333; font-size: 1.2rem; font-weight: bold; text-align: center;">INÍCIO</span>`;
            div.style.background = "#e0f7fa"; 
            div.style.borderColor = "#00bcd4";
        } else if (i === C - 1) { 
            conteudoHTML = `<span class="numero">${i}</span><span class="efeito-casa" style="color: #333; font-size: 0.9rem;">Publicação</span>`;
            div.style.background = "#ffd700"; 
            div.style.borderColor = "#c6a700";
        } else {
            conteudoHTML = `<span class="numero">${i}</span>`;
            if (ehEspecial) {
                // Cores baseadas se o efeito é positivo (+) ou negativo (-)
                if(tipoEspecial.includes('+')) div.style.background = "#d4edda";
                if(tipoEspecial.includes('-')) div.style.background = "#f8d7da";
                
                let desc = "";
                if(tipoEspecial === 'BP+') desc = "+2 Casas";
                if(tipoEspecial === 'BP-') desc = "-2 Casas";
                if(tipoEspecial === 'IR+') desc = "Você +1<br>Outros -1";
                if(tipoEspecial === 'IR-') desc = "Você -2<br>Outros +1";
                if(tipoEspecial === 'DRE+') desc = "Pergunta Bônus";
                if(tipoEspecial === 'DRE-') desc = "Escolha o Alvo";
                
                conteudoHTML += `<span class="efeito-casa"><strong>${tipoEspecial}</strong><br><small style="font-size:0.6rem; line-height: 1.1; display: block; margin-top: 2px;">${desc}</small></span>`;
            }
        }
        
        div.innerHTML = conteudoHTML;

        let row, col;
        if (i < W) { 
            row = H; 
            col = 1 + i;
        } else if (i < W + H - 2) { 
            row = H - 1 - (i - W); 
            col = W;
        } else if (i < 2 * W + H - 2) { 
            row = 1; 
            col = W - (i - (W + H - 2));
        } else { 
            row = 2 + (i - (2 * W + H - 2)); 
            col = 1;
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
        // A peça estaciona visualmente na última casa (C - 1) caso a pontuação a ultrapasse
        let idCasaVisual = g.posicao >= jogo.totalCasas - 1 ? jogo.totalCasas - 1 : g.posicao;
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
        totalCasas: jogo.totalCasas,
        pendenciaDRE: jogo.pendenciaDRE,
        emEventoDRE: jogo.emEventoDRE,
        turnoRetornoDRE: jogo.turnoRetornoDRE
    });
}

function aplicarFotoDoJogo(fotoString) {
    let backup = JSON.parse(fotoString);
    jogo.grupos = backup.grupos;
    jogo.turnoAtual = backup.turnoAtual;
    jogo.perguntasDisponiveis = backup.perguntasDisponiveis;
    jogo.totalCasas = backup.totalCasas || 28;
    jogo.pendenciaDRE = backup.pendenciaDRE || null;
    jogo.emEventoDRE = backup.emEventoDRE || false;
    jogo.turnoRetornoDRE = backup.turnoRetornoDRE !== undefined ? backup.turnoRetornoDRE : null;
}

// --- LÓGICA DE PERGUNTAS E TURNOS ---
function abrirPainelPergunta() {
    jogo.historico.push(obterFotoDoJogo());
    
    if (jogo.historico.length > LIMITE_HISTORICO) {
        jogo.historico.shift(); 
    }
    
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

    let moverAlguem = true;
    let grupoQueMoveu = grupoAtual;

    if (dificuldadeAtual === 'facil') {
        if (acertou) {
            grupoAtual.posicao += 3;
            msg += "Você andou 3 casas.";
        } else {
            let idxAnterior = jogo.turnoAtual === 0 ? jogo.grupos.length - 1 : jogo.turnoAtual - 1;
            jogo.grupos[idxAnterior].posicao += 3;
            grupoQueMoveu = jogo.grupos[idxAnterior];
            msg += `O grupo anterior (${grupoQueMoveu.nome}) andou 3 casas!`;
        }
    } else { 
        if (acertou) {
            grupoAtual.posicao += 5;
            msg += "Você andou 5 casas!";
        } else {
            msg += "Você não se move.";
            moverAlguem = false;
        }
    }

    jogo.grupos.forEach(g => { if(g.posicao >= jogo.totalCasas - 1) g.posicao = jogo.totalCasas - 1; });

    // Se alguém se moveu, ativa o motor de combos!
    if (moverAlguem && grupoQueMoveu.posicao > 0 && grupoQueMoveu.posicao < jogo.totalCasas - 1) {
        msg += ativarMotorDeCombos(grupoQueMoveu);
    }

    // Trava para não passarem dos limites do tabuleiro após os efeitos
    jogo.grupos.forEach(g => { 
        if(g.posicao < 0) g.posicao = 0;
        if(g.posicao >= jogo.totalCasas - 1) g.posicao = jogo.totalCasas - 1; 
    });

    document.getElementById('texto-resolucao').innerText = msg + `\n\nResolução: ${perguntaAtual.resolucao}`;
}

// O MOTOR DE COMBOS!
function ativarMotorDeCombos(grupo) {
    let log = "";
    let combinando = true;
    
    // O loop garante que enquanto cair em casa especial, os efeitos continuam
    while (combinando && grupo.posicao > 0 && grupo.posicao < jogo.totalCasas - 1) {
        let especial = CASAS_ESPECIAIS[grupo.posicao];
        if (!especial) break; 
        
        log += `\n🎯 Casa ${grupo.posicao} (${especial}): `;
        
        if (especial === 'BP+') {
            grupo.posicao += 2; log += `Avança +2 casas!`;
        } else if (especial === 'BP-') {
            grupo.posicao -= 2; log += `Recua -2 casas!`;
        } else if (especial === 'IR+') {
            grupo.posicao += 1;
            jogo.grupos.forEach(g => { if (g.id !== grupo.id) g.posicao -= 1; });
            log += `Avançou +1 e todos os outros recuaram -1!`;
        } else if (especial === 'IR-') {
            grupo.posicao -= 2;
            jogo.grupos.forEach(g => { if (g.id !== grupo.id) g.posicao += 1; });
            log += `Recuou -2 e todos os outros avançaram +1!`;
        } else if (especial === 'DRE+') {
            log += `Pergunta Bônus garantida!`;
            jogo.pendenciaDRE = { ativo: true, tipo: 'DRE+', grupoCausador: grupo };
            break; // Interrompe o combo físico para fazer a pergunta bônus
        } else if (especial === 'DRE-') {
            log += `Escolha quem sofrerá/ganhará a pergunta!`;
            jogo.pendenciaDRE = { ativo: true, tipo: 'DRE-', grupoCausador: grupo };
            break; // Interrompe
        }
        
        jogo.grupos.forEach(g => { if(g.posicao < 0) g.posicao = 0; }); // Trava negativa
    }
    return log;
}

function proximoTurno() {
    document.getElementById('modal-pergunta').classList.remove('ativo');
    
    // 1. Verifica se houve engatilho do DRE na jogada anterior
    if (jogo.pendenciaDRE && jogo.pendenciaDRE.ativo) {
        let p = jogo.pendenciaDRE;
        jogo.pendenciaDRE = null; 
        
        jogo.emEventoDRE = true;
        // O turno salva de quem seria a vez originalmente (o cara DEPOIS de quem estava jogando de verdade)
        jogo.turnoRetornoDRE = (jogo.turnoAtual + 1) % jogo.grupos.length;
        
        let idCausador = jogo.grupos.findIndex(g => g.id === p.grupoCausador.id);

        if (p.tipo === 'DRE+') {
            jogo.turnoAtual = idCausador; // O causador é o alvo
            prepararPerguntaDRE(p.grupoCausador.nome);
        } else {
            abrirSelecaoAlvoDRE(p.grupoCausador.nome); // O causador escolhe
        }
        return; 
    }

    // 2. Lógica padrão de vitória
    let ganhador = jogo.grupos.find(g => g.posicao >= jogo.totalCasas - 1);
    if (ganhador) {
        montarTelaJogo(); 
        encerrarJogoMostrarRanking();
        return;
    }

    // 3. Se acabou um evento DRE, devolve pro fluxo normal. Se não, passa a vez.
    if (jogo.emEventoDRE) {
        jogo.turnoAtual = jogo.turnoRetornoDRE;
        jogo.emEventoDRE = false;
        jogo.turnoRetornoDRE = null;
    } else {
        jogo.turnoAtual = (jogo.turnoAtual + 1) % jogo.grupos.length;
    }
    
    salvarEstado();
    montarTelaJogo();
}

// --- FUNÇÕES DE CONTROLE DO DRE ---
function abrirSelecaoAlvoDRE(nomeEscolhedor) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    document.getElementById('modal-selecao-primeiro').classList.add('ativo');
    
    let titulo = document.querySelector('#modal-selecao-primeiro h2');
    titulo.innerHTML = `DRE- <br><small style="font-size: 1rem; color: #555;">${nomeEscolhedor}, escolha o alvo:</small>`;
    
    const lista = document.getElementById('lista-selecao-grupos');
    lista.innerHTML = jogo.grupos.map((g, i) => `
        <button class="btn-selecao" onclick="aplicarAlvoDRE(${i})">
            <span style="display:inline-block; width:20px; height:20px; background:${g.cor}; border-radius:50%; margin-right:15px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></span>
            ${g.nome}
        </button>
    `).join('');
}

function aplicarAlvoDRE(index) {
    jogo.turnoAtual = index;
    document.getElementById('modal-selecao-primeiro').classList.remove('ativo');
    prepararPerguntaDRE(jogo.grupos[index].nome);
}

function prepararPerguntaDRE(nomeAlvo) {
    montarTelaJogo(); // Atualiza o fundo para mostrar as peças nas novas casas
    
    // Configura a tela de pergunta para o DRE
    document.getElementById('modal-pergunta').classList.add('ativo');
    document.getElementById('bloco-dificuldade').style.display = 'block';
    document.getElementById('area-pergunta').style.display = 'none';
    document.getElementById('resolucao').style.display = 'none';
    document.getElementById('grupo-atual-texto').innerText = `✨ Turno Bônus (DRE): ${nomeAlvo}`;
}

// Correção rápida para o Título do modal no início do jogo não ficar travado com o texto do DRE:
function abrirSelecaoPrimeiro() {
    let titulo = document.querySelector('#modal-selecao-primeiro h2');
    if(titulo) titulo.innerHTML = "Quem começa?";
    
    const lista = document.getElementById('lista-selecao-grupos');
    lista.innerHTML = jogo.grupos.map((g, i) => `
        <button class="btn-selecao" onclick="definirPrimeiro(${i})">
            <span style="display:inline-block; width:20px; height:20px; background:${g.cor}; border-radius:50%; margin-right:15px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></span>
            ${g.nome}
        </button>
    `).join('');

    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    document.getElementById('modal-selecao-primeiro').classList.add('ativo');
}

function desfazerJogada() {
    if (jogo.historico.length > 0) {
        let historicoAtual = jogo.historico;
        let desfeitoAtual = jogo.historicoDesfeito || [];
        
        desfeitoAtual.push(obterFotoDoJogo());
        
        if (desfeitoAtual.length > LIMITE_HISTORICO) {
            desfeitoAtual.shift();
        }
        
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
        
        if (historicoAtual.length > LIMITE_HISTORICO) {
            historicoAtual.shift();
        }
        
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
    
    localStorage.removeItem('jogoSalvo');

    const btnDesfazer = document.getElementById('btn-desfazer');
    const btnRefazer = document.getElementById('btn-refazer');
    if (btnDesfazer) btnDesfazer.disabled = true;
    if (btnRefazer) btnRefazer.disabled = true;

    let tituloFim = vencedores.length > 1 ? "EMPATE TÉCNICO!" : "TEMOS UM VENCEDOR!";
    let subtitulo = vencedores.join(', ');

    let rankingHTML = `
        <div style="text-align: center; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
            <h2 style="font-size: 2.8rem; color: #ffd700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); margin: 0 0 10px 0;">🏆 FIM DE JOGO 🏆</h2>
            <p style="font-size: 1.5rem; color: white; margin: 0 0 20px 0;">${tituloFim}<br><strong style="font-size: 2rem;">${subtitulo}</strong></p>
            
            <div style="background: rgba(255, 255, 255, 0.95); padding: 15px 30px; border-radius: 10px; width: 85%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); max-height: 50%; overflow-y: auto;">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 1.6rem; text-align: center; text-transform: uppercase;">Ranking Final</h3>
                <ol style="margin: 0; padding-left: 20px; font-size: 1.3rem; color: #444; text-align: left;">
                    ${ranking.map((g, i) => {
                        let casaTexto = g.posicao >= jogo.totalCasas - 1 ? "Publicação (Final)" : `Casa ${g.posicao}`;
                        let medalha = i === 0 ? "🥇" : (i === 1 ? "🥈" : (i === 2 ? "🥉" : ""));
                        return `<li style="margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 5px;"><strong>${g.nome}</strong> ${medalha} - <span style="font-size: 1rem;">${casaTexto}</span></li>`;
                    }).join('')}
                </ol>
            </div>
            
            <button onclick="location.reload()" style="margin-top: 25px; padding: 15px 30px; font-size: 1.4rem; font-weight: bold; background: #007bff; color: white; border: none; border-radius: 10px; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.4); transition: transform 0.2s;">Sair para o Menu</button>
        </div>
    `;

    const centro = document.getElementById('centro-tabuleiro');
    centro.style.background = "rgba(44, 62, 80, 0.95)"; 
    centro.style.transform = "scale(1.03)"; 
    centro.style.transition = "all 0.5s ease";
    centro.style.zIndex = "20";
    
    centro.innerHTML = rankingHTML;
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