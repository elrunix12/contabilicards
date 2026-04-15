// --- CONFIGURAÇÕES INICIAIS ---
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
    pendenciaDRE: null,
    emEventoDRE: false,
    turnoRetornoDRE: null,
    modoFisico: false 
};

let configuracoes = {
    somAtivo: false,
    exibirPergunta: true,
    totalCasas: 28,
    penalidadeTempo: false 
};

let temporizador;

// --- SISTEMA DE CONFIGURAÇÕES ---
function carregarConfiguracoes() {
    if(localStorage.getItem('jogoConfigs')) {
        let salvo = JSON.parse(localStorage.getItem('jogoConfigs'));
        configuracoes.somAtivo = salvo.somAtivo || false;
        configuracoes.exibirPergunta = salvo.exibirPergunta !== undefined ? salvo.exibirPergunta : true;
        configuracoes.totalCasas = salvo.totalCasas || 28; 
        configuracoes.penalidadeTempo = salvo.penalidadeTempo || false;
    }
    
    let chkSom = document.getElementById('config-som');
    let chkPergunta = document.getElementById('config-exibir-pergunta');
    let chkPenalidade = document.getElementById('config-penalidade-tempo');
    let inpCasas = document.getElementById('config-casas');
    
    if (chkSom) chkSom.checked = configuracoes.somAtivo;
    if (chkPergunta) chkPergunta.checked = configuracoes.exibirPergunta;
    if (chkPenalidade) chkPenalidade.checked = configuracoes.penalidadeTempo;
    if (inpCasas) inpCasas.value = configuracoes.totalCasas;
}

function salvarConfiguracoes() {
    configuracoes.somAtivo = document.getElementById('config-som').checked;
    configuracoes.exibirPergunta = document.getElementById('config-exibir-pergunta').checked;
    configuracoes.penalidadeTempo = document.getElementById('config-penalidade-tempo').checked;
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
    let usaCardsFisicos = confirm("Deseja usar CARDS FÍSICOS?\n\n[OK] para Cards Físicos (você lê a pergunta em sala).\n[Cancelar] para Cards Digitais (perguntas na tela).");
    
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
    jogo.modoFisico = usaCardsFisicos;
    
    abrirSelecaoPrimeiro();
}

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
    
    // Identifica quem está jogando
    let nomeGrupoAtual = jogo.grupos[jogo.turnoAtual] ? jogo.grupos[jogo.turnoAtual].nome : "";
    let tituloTurno = jogo.emEventoDRE ? `✨ Bônus DRE: ${nomeGrupoAtual}` : `Vez do ${nomeGrupoAtual}`;

    centro.innerHTML = `
        <div class="carta-mestra" id="carta-central">
            <div class="carta-inner">
                <div class="carta-frente">
                    <div style="font-size: 1.4rem; font-weight: bold; color: #2c3e50; margin-bottom: 10px;">${tituloTurno}</div>
                    <img src="logo.png" alt="Contabilicards" style="max-width: 60%; max-height: 40%; object-fit: contain; margin-bottom: 20px;">
                    <div style="display: flex; gap: 20px;">
                        <button class="btn-dificuldade btn-3" onclick="carregarPergunta('facil')">3 Casas</button>
                        <button class="btn-dificuldade btn-5" onclick="carregarPergunta('dificil')">5 Casas</button>
                    </div>
                </div>
                <div class="carta-verso" id="carta-conteudo-verso">
                    </div>
            </div>
        </div>
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
        turnoRetornoDRE: jogo.turnoRetornoDRE,
        modoFisico: jogo.modoFisico 
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
    jogo.modoFisico = backup.modoFisico || false; 
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
    // Salva o histórico logo no clique do 3 ou 5
    jogo.historico.push(obterFotoDoJogo());
    if (jogo.historico.length > LIMITE_HISTORICO) jogo.historico.shift(); 
    jogo.historicoDesfeito = []; 
    atualizarBotoesHistorico();

    dificuldadeAtual = dificuldade;
    const verso = document.getElementById('carta-conteudo-verso');
    const cartaCentral = document.getElementById('carta-central');

    let htmlVerso = `<p id="texto-tempo" style="font-size: 1.2rem; font-weight: bold; color: #333; margin-top: 0;">Tempo: <span id="contador">0</span>s</p>`;

    if (jogo.modoFisico) {
        htmlVerso += `
            <div style="font-size: 1.8rem; font-weight: bold; color: ${dificuldade === 'facil' ? '#28a745' : '#dc3545'}; text-transform: uppercase; margin-bottom: 20px;">
                Andar ${dificuldade === 'facil' ? '3' : '5'} Casas
            </div>
            <div style="display: flex; gap: 15px;">
                <button class="alternativa" style="background-color: #28a745; color: white; padding: 15px 30px; font-size: 1.2rem; border-radius: 8px;" onclick="responder(true)">Acertou</button>
                <button class="alternativa" style="background-color: #dc3545; color: white; padding: 15px 30px; font-size: 1.2rem; border-radius: 8px;" onclick="responder(false)">Errou</button>
            </div>
        `;
    } else {
        let perguntasFiltradas = jogo.perguntasDisponiveis.filter(p => p.dificuldade === dificuldade);
        
        if (perguntasFiltradas.length === 0) {
            let reembaralhar = confirm(`As cartas de nível ${dificuldade} acabaram!\nClique [OK] para reembaralhar ou [Cancelar] para encerrar.`);
            if (reembaralhar) {
                const recuperar = bancoDePerguntasGeral.filter(p => p.dificuldade === dificuldade);
                jogo.perguntasDisponiveis.push(...recuperar);
                perguntasFiltradas = recuperar; 
            } else {
                encerrarJogoMostrarRanking();
                return; 
            }
        }

        const idx = Math.floor(Math.random() * perguntasFiltradas.length);
        perguntaAtual = perguntasFiltradas[idx];
        const removeIdx = jogo.perguntasDisponiveis.findIndex(p => p.pergunta === perguntaAtual.pergunta);
        if (removeIdx !== -1) jogo.perguntasDisponiveis.splice(removeIdx, 1);
        
        let textoQ = configuracoes.exibirPergunta ? perguntaAtual.pergunta : "[A pergunta será lida pelo mediador. Escolha a alternativa correta abaixo:]";
        
        htmlVerso += `
            <p id="texto-pergunta" style="font-size: 1.2rem; margin-bottom: 15px; text-align: center;">${textoQ}</p>
            <div id="alternativas" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                ${perguntaAtual.alternativas.map(alt => `<button class="alternativa" onclick="responder('${alt}')">${alt}</button>`).join('')}
            </div>
        `;
    }

    verso.innerHTML = htmlVerso;
    
    // Gira a carta visualmente
    cartaCentral.classList.add('virada');

    iniciarTemporizador(dificuldade === 'facil' ? 30 : 60); 
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
            if (configuracoes.penalidadeTempo) {
                alert("Tempo Esgotado! Resposta considerada incorreta.");
                
                if (jogo.modoFisico) {
                    perguntaAtual = { resolucao: "Tempo esgotado (validação do professor)." };
                }
                
                processarResposta(false); 
            } else {
                alert("Tempo Esgotado! Aguardando ação do mediador.");
            }
        }
    }, 1000);
}

function responder(respostaOuAlternativa) {
    clearInterval(temporizador);
    let acertou;
    
    if (jogo.modoFisico) {
        acertou = respostaOuAlternativa === true;
        perguntaAtual = { resolucao: "Validação manual feita pelo professor." };
    } else {
        acertou = respostaOuAlternativa === perguntaAtual.correta;
    }
    
    processarResposta(acertou);
}

function processarResposta(acertou) {
    let grupoAtual = jogo.grupos[jogo.turnoAtual];
    let msgPopUp = acertou ? `<strong>Correto, ${grupoAtual.nome}!</strong> ` : `<strong>Incorreto, ${grupoAtual.nome}.</strong> `;

    let moverAlguem = true;
    let grupoQueMoveu = grupoAtual;

    if (dificuldadeAtual === 'facil') {
        if (acertou) {
            grupoAtual.posicao += 3;
            msgPopUp += `Avançou 3 casas.`;
        } else {
            let idxAnterior = jogo.turnoAtual === 0 ? jogo.grupos.length - 1 : jogo.turnoAtual - 1;
            jogo.grupos[idxAnterior].posicao += 3;
            grupoQueMoveu = jogo.grupos[idxAnterior];
            msgPopUp += `<br>O grupo anterior (${grupoQueMoveu.nome}) avançou 3 casas.`;
        }
    } else { 
        if (acertou) {
            grupoAtual.posicao += 5;
            msgPopUp += `Avançou 5 casas.`;
        } else {
            msgPopUp += `Não se move.`;
            moverAlguem = false;
        }
    }

    jogo.grupos.forEach(g => { if(g.posicao >= jogo.totalCasas - 1) g.posicao = jogo.totalCasas - 1; });

    let logCombo = "";
    if (moverAlguem && grupoQueMoveu.posicao > 0 && grupoQueMoveu.posicao < jogo.totalCasas - 1) {
        logCombo = ativarMotorDeCombos(grupoQueMoveu);
    }

    jogo.grupos.forEach(g => { 
        if(g.posicao < 0) g.posicao = 0;
        if(g.posicao >= jogo.totalCasas - 1) g.posicao = jogo.totalCasas - 1; 
    });

    let textoNotificacao = msgPopUp;
    if (logCombo !== "") textoNotificacao += `<br><br><strong>Efeitos Extras:</strong>` + logCombo;
    mostrarNotificacao(textoNotificacao);

    // MÁGICA: Se for Físico, a vez passa na hora e a carta vira. Se for Digital, mostra a resolução no verso!
    if (jogo.modoFisico) {
        proximoTurno();
    } else {
        // Atualiza a posição das peças para a turma ver a movimentação
        document.querySelectorAll('.peca').forEach(p => p.remove());
        posicionarPecas();
        
        const verso = document.getElementById('carta-conteudo-verso');
        verso.innerHTML = `
            <h3 style="color: ${acertou ? '#28a745' : '#dc3545'}; margin-top: 0;">${acertou ? 'Correto!' : 'Incorreto!'}</h3>
            <p style="text-align: center; max-width: 90%;"><strong>Resolução:</strong><br>${perguntaAtual.resolucao}</p>
            <button onclick="proximoTurno()" style="margin-top: 15px; padding: 10px 20px; font-size: 1.1rem; cursor: pointer; background-color: #007bff; color: white; border: none; border-radius: 8px;">Concluir e Passar a Vez</button>
        `;
    }
}

// O MOTOR DE COMBOS!
function ativarMotorDeCombos(grupo) {
    let log = "";
    let combinando = true;
    
    while (combinando && grupo.posicao > 0 && grupo.posicao < jogo.totalCasas - 1) {
        let especial = CASAS_ESPECIAIS[grupo.posicao];
        if (!especial) break; 
        
        // Inclui o nome do grupo diretamente no log do pop-up
        log += `<br>🎯 <strong>${grupo.nome}</strong> caiu na Casa ${grupo.posicao} (${especial}): `;
        
        if (especial === 'BP+') {
            grupo.posicao += 2; log += `Avança +2 casas!`;
        } else if (especial === 'BP-') {
            grupo.posicao -= 2; log += `Recua -2 casas!`;
        } else if (especial === 'IR+') {
            grupo.posicao += 1;
            jogo.grupos.forEach(g => { if (g.id !== grupo.id) g.posicao -= 1; });
            log += `Avançou +1 e os outros recuaram -1!`;
        } else if (especial === 'IR-') {
            grupo.posicao -= 2;
            jogo.grupos.forEach(g => { if (g.id !== grupo.id) g.posicao += 1; });
            log += `Recuou -2 e os outros avançaram +1!`;
        } else if (especial === 'DRE+') {
            log += `Pergunta Bônus garantida!`;
            jogo.pendenciaDRE = { ativo: true, tipo: 'DRE+', grupoCausador: grupo };
            break; 
        } else if (especial === 'DRE-') {
            log += `Deve escolher quem sofrerá/ganhará a pergunta!`;
            jogo.pendenciaDRE = { ativo: true, tipo: 'DRE-', grupoCausador: grupo };
            break; 
        }
        
        jogo.grupos.forEach(g => { if(g.posicao < 0) g.posicao = 0; }); 
    }
    return log;
}

function proximoTurno() {
    document.getElementById('modal-pergunta').classList.remove('ativo');
    
    if (jogo.pendenciaDRE && jogo.pendenciaDRE.ativo) {
        let p = jogo.pendenciaDRE;
        jogo.pendenciaDRE = null; 
        
        jogo.emEventoDRE = true;
        jogo.turnoRetornoDRE = (jogo.turnoAtual + 1) % jogo.grupos.length;
        
        let idCausador = jogo.grupos.findIndex(g => g.id === p.grupoCausador.id);

        if (p.tipo === 'DRE+') {
            jogo.turnoAtual = idCausador; 
            prepararPerguntaDRE(p.grupoCausador.nome);
        } else {
            abrirSelecaoAlvoDRE(p.grupoCausador.nome); 
        }
        return; 
    }

    let ganhador = jogo.grupos.find(g => g.posicao >= jogo.totalCasas - 1);
    if (ganhador) {
        montarTelaJogo(); 
        encerrarJogoMostrarRanking();
        return;
    }

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
    // Como a carta central agora é dinâmica, apenas reconstruir o tabuleiro
    // já atualiza o título dela para "✨ Bônus DRE: NomeDoAlvo"
    montarTelaJogo(); 
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

// --- NOTIFICAÇÃO TOAST (COMBO) ---
let timerToast;
function mostrarNotificacao(mensagem) {
    const toast = document.getElementById('toast-notificacao');
    toast.innerHTML = mensagem + `<br><small style="font-size: 0.8rem; color: #ccc;">(Clique para fechar)</small>`;
    toast.classList.add('mostrar');
    
    clearTimeout(timerToast);
    timerToast = setTimeout(() => {
        fecharNotificacao();
    }, 6000); // Fica 6 segundos na tela e some automático
}

function fecharNotificacao() {
    const toast = document.getElementById('toast-notificacao');
    toast.classList.remove('mostrar');
}