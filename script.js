// --- CONFIGURAÇÕES INICIAIS ---
const somPulo = new Audio('assets/pop1.wav');

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
    idCausadorDRE: null, 
    modoFisico: false,
    faseTurno: 'inicio', // ✨ NOVA LINHA
    textoResultado: "",  // ✨ NOVA LINHA
    acertouUltima: null, // ✨ NOVA LINHA
    dificuldadeUltima: 'facil' // ✨ NOVA LINHA
};

let configuracoes = {
    somAtivo: false,
    totalCasas: 28,
    penalidadeTempo: false 
};

let temporizador;

// --- SISTEMA DE CONFIGURAÇÕES ---
function carregarConfiguracoes() {
    if(localStorage.getItem('jogoConfigs')) {
        let salvo = JSON.parse(localStorage.getItem('jogoConfigs'));
        configuracoes.somAtivo = salvo.somAtivo || false;
        configuracoes.totalCasas = salvo.totalCasas || 28; 
        configuracoes.penalidadeTempo = salvo.penalidadeTempo || false;
    }
    
    let chkSom = document.getElementById('config-som');
    let chkPenalidade = document.getElementById('config-penalidade-tempo');
    let inpCasas = document.getElementById('config-casas');
    
    if (chkSom) chkSom.checked = configuracoes.somAtivo;
    if (chkPenalidade) chkPenalidade.checked = configuracoes.penalidadeTempo;
    if (inpCasas) inpCasas.value = configuracoes.totalCasas;
}

function salvarConfiguracoes() {
    configuracoes.somAtivo = document.getElementById('config-som').checked;
    configuracoes.penalidadeTempo = document.getElementById('config-penalidade-tempo').checked;
    configuracoes.totalCasas = parseInt(document.getElementById('config-casas').value) || 28;
    
    if (configuracoes.totalCasas % 2 !== 0) configuracoes.totalCasas += 1;
    document.getElementById('config-casas').value = configuracoes.totalCasas;
    
    localStorage.setItem('jogoConfigs', JSON.stringify(configuracoes));
}

// --- INICIALIZAÇÃO E SELEÇÃO DE PRIMEIRO JOGADOR ---
window.onload = async () => {
    carregarConfiguracoes();
    carregarContribuidores();
    
    // Injeta a versão definida no config.js
    document.getElementById('app-versao').innerText = "v" + APP_VERSION;

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
    abrirModal('modal-novo-jogo');
}

function confirmarNovoJogo() {
    let qtdInput = document.getElementById('input-qtd-grupos');
    let usaCardsFisicos = document.getElementById('input-modo-fisico').checked;
    let erroMsg = document.getElementById('erro-qtd-grupos');
    
    let qtd = parseInt(qtdInput.value);
    
    if (isNaN(qtd) || qtd < 1 || qtd > 10) {
        erroMsg.style.display = 'block';
        qtdInput.style.borderColor = '#dc3545';
        return; 
    }
    
    erroMsg.style.display = 'none';
    qtdInput.style.borderColor = '#ccc';
    fecharModal('modal-novo-jogo');

    jogo.grupos = [];
    for (let i = 0; i < qtd; i++) {
        jogo.grupos.push({ id: i, nome: `G${i + 1}`, posicao: 0, cor: CORES_DISTINTAS[i] });
    }
    jogo.historico = [];
    jogo.historicoDesfeito = [];
    jogo.totalCasas = configuracoes.totalCasas || 28; 
    jogo.perguntasDisponiveis = [...bancoDePerguntasGeral];
    jogo.modoFisico = usaCardsFisicos;
    
    // ✨ NOVA SEÇÃO: Limpa qualquer estado de cartas ou eventos pendentes do jogo anterior
    jogo.faseTurno = 'inicio';
    jogo.textoResultado = "";
    jogo.acertouUltima = null;
    jogo.dificuldadeUltima = 'facil';
    jogo.emEventoDRE = false;
    jogo.pendenciaDRE = null;
    jogo.turnoRetornoDRE = null;
    jogo.idCausadorDRE = null;
    
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
        <div class="grupo-item ${i === jogo.turnoAtual ? 'ativo' : ''}" style="padding: 10px; margin: 5px 0; border-radius: 4px; display: flex; align-items: center; justify-content: flex-start; gap: 8px;">
            <span style="display:inline-block; width:15px; height:15px; background:${g.cor}; border-radius:50%; flex-shrink: 0;"></span>
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: bold;">
                ${g.nome} - ${g.posicao}
            </span>
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
    
    // Identifica quem Lê e quem Responde (com correção para DRE)
    let jogadorAtivo;
    let jogadorAlvo;

    if (jogo.emEventoDRE) {
        jogadorAlvo = jogo.grupos[jogo.turnoAtual]; // Quem responde é o alvo escolhido
        let idxCausador = jogo.idCausadorDRE !== undefined && jogo.idCausadorDRE !== null 
            ? jogo.idCausadorDRE 
            : (jogo.turnoRetornoDRE - 1 + jogo.grupos.length) % jogo.grupos.length;
        jogadorAtivo = jogo.grupos[idxCausador]; // Quem causou o DRE
    } else {
        jogadorAtivo = jogo.grupos[jogo.turnoAtual];
        let idxAlvo = (jogo.turnoAtual + 1) % jogo.grupos.length;
        jogadorAlvo = jogo.grupos[idxAlvo];
    }
    
    // Formata os nomes já com as cores dos grupos e um contorno escuro para leitura clara
    // Formata os nomes com a bolinha colorida do lado e texto normal
    let nomeGrupoAtual = jogadorAtivo ? `<span class="cor-indicador-texto" style="display:inline-block; width:15px; height:15px; background:${jogadorAtivo.cor}; border-radius:50%; margin-right:5px; vertical-align: middle; box-shadow: 1px 1px 2px rgba(0,0,0,0.5);"></span><strong style="color: #2c3e50;">${jogadorAtivo.nome}</strong>` : "";

    let nomeAlvo = jogadorAlvo ? `<span class="cor-indicador-texto" style="display:inline-block; width:15px; height:15px; background:${jogadorAlvo.cor}; border-radius:50%; margin-right:5px; vertical-align: middle; box-shadow: 1px 1px 2px rgba(0,0,0,0.5);"></span><strong style="color: #2c3e50;">${jogadorAlvo.nome}</strong>` : "";

    let tituloTurno = "";
    if (jogo.emEventoDRE) {
        if (jogadorAtivo.id === jogadorAlvo.id) {
            tituloTurno = `✨ DRE+: ${nomeAlvo} responde sozinho!`;
        } else {
            tituloTurno = `🎯 DRE-: ${nomeGrupoAtual} escolheu ${nomeAlvo}!`;
        }
    } else {
        tituloTurno = `Lê: ${nomeGrupoAtual} | Responde: ${nomeAlvo}`;
    }

    let conteudoFrente = "";
    let conteudoVerso = "";
    let classeExtraCarta = "";

    if (jogo.faseTurno === 'resultado') {
        classeExtraCarta = jogo.dificuldadeUltima === 'facil' ? 'virada-esquerda' : 'virada-direita';
        
        let textoResolucao = "";
        if (!jogo.modoFisico && perguntaAtual && perguntaAtual.resolucao) {
            textoResolucao = `<p style="text-align: center; max-width: 90%; font-size: 1.1rem; margin-top: 10px;"><strong>Resolução:</strong><br>${perguntaAtual.resolucao}</p>`;
        }

        conteudoVerso = `
            <div style="margin: auto 0; width: 100%; display: flex; flex-direction: column; align-items: center;">
                <h3 class="icone-resultado" style="color: ${jogo.acertouUltima ? '#28a745' : '#dc3545'}; margin-top: 0; font-size: 3.5rem; margin-bottom: 15px; line-height: 1; text-shadow: 2px 2px 0px rgba(0,0,0,0.1);">${jogo.acertouUltima ? '✔️' : '❌'}</h3>
                <p class="texto-resultado-carta" style="font-size: 1.2rem; text-align: center; margin-bottom: 10px; line-height: 1.4;">${jogo.textoResultado}</p>
                ${textoResolucao}
                <div style="display: flex; justify-content: center; width: 100%; margin-top: 15px;">
                    <button id="btn-avancar-fase" class="btn-dificuldade" style="background-color: #007bff; color: white; padding: 12px 25px; font-size: 1.1rem;" onclick="proximoTurno()">Avançar</button>
                </div>
            </div>
        `;
    } else {
        conteudoFrente = `
            <div style="font-size: 1.4rem; font-weight: bold; color: #2c3e50; margin-bottom: 10px;">${tituloTurno}</div>
            <img src="assets/logo.png" alt="Contabilicards" style="max-width: 60%; max-height: 40%; object-fit: contain; margin-bottom: 20px;">
            <div style="display: flex; gap: 20px;">
                <button class="btn-dificuldade btn-3" onclick="carregarPergunta('facil')">3 Casas</button>
                <button class="btn-dificuldade btn-5" onclick="carregarPergunta('dificil')">5 Casas</button>
            </div>
        `;
    }

    centro.innerHTML = `
        <div class="carta-mestra ${classeExtraCarta}" id="carta-central">
            <div class="carta-inner">
                <div class="carta-frente" ${jogo.faseTurno === 'resultado' ? 'inert' : ''}>
                    ${conteudoFrente}
                </div>
                <div class="carta-verso" id="carta-conteudo-verso" ${jogo.faseTurno === 'inicio' ? 'inert' : ''}>
                    ${conteudoVerso}
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
                if(tipoEspecial === 'IR-') desc = "Você -2<br>Outros +2";
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

    // ✨ NOVA SEÇÃO: Força o foco no botão de avanço imediatamente ao carregar a tela de resultados
    if (jogo.faseTurno === 'resultado') {
        setTimeout(() => {
            const btnAvancar = document.getElementById('btn-avancar-fase');
            if (btnAvancar) btnAvancar.focus();
        }, 50);
    }
}

function posicionarPecas() {
    // 1. Agrupar quais jogadores estão em cada casa
    let pecasPorCasa = {};
    
    jogo.grupos.forEach(g => {
        let idCasaVisual = g.posicao >= jogo.totalCasas - 1 ? jogo.totalCasas - 1 : g.posicao;
        if (!pecasPorCasa[idCasaVisual]) {
            pecasPorCasa[idCasaVisual] = [];
        }
        pecasPorCasa[idCasaVisual].push(g);
    });

    // 2. Renderizar as peças geometricamente distribuídas
    for (let idCasa in pecasPorCasa) {
        let casaDiv = document.getElementById(`casa-${idCasa}`);
        if (!casaDiv) continue;

        let gruposNaCasa = pecasPorCasa[idCasa];
        let total = gruposNaCasa.length;

        gruposNaCasa.forEach((g, index) => {
            let peca = document.createElement('div');
            peca.className = 'peca';
            peca.style.backgroundColor = g.cor;
            
            // Adiciona o nome do grupo no hover para facilitar a identificação
            peca.title = g.nome; 

            let tx = 0;
            let ty = 0;

            // Se houver mais de 1 peça, distribui em um círculo
            if (total > 1) {
                let raio = total > 5 ? 24 : 16; // Aumenta o raio se tiver muita gente
                let angulo = (Math.PI * 2 / total) * index;
                
                tx = Math.cos(angulo) * raio;
                ty = Math.sin(angulo) * raio;
            }

            // Aplica a tradução calculada
            peca.style.transform = `translate(${tx}px, ${ty}px)`;
            casaDiv.appendChild(peca);
        });
    }
}

function obterFotoDoJogo() {
    return JSON.stringify({
        grupos: jogo.grupos,
        turnoAtual: jogo.turnoAtual,
        totalCasas: jogo.totalCasas,
        pendenciaDRE: jogo.pendenciaDRE,
        emEventoDRE: jogo.emEventoDRE,
        turnoRetornoDRE: jogo.turnoRetornoDRE,
        idCausadorDRE: jogo.idCausadorDRE, 
        modoFisico: jogo.modoFisico,
        faseTurno: jogo.faseTurno,
        textoResultado: jogo.textoResultado,
        acertouUltima: jogo.acertouUltima,
        dificuldadeUltima: jogo.dificuldadeUltima
    });
}

function aplicarFotoDoJogo(fotoString) {
    let backup = JSON.parse(fotoString);
    jogo.grupos = backup.grupos;
    jogo.turnoAtual = backup.turnoAtual;
    jogo.totalCasas = backup.totalCasas || 28;
    jogo.pendenciaDRE = backup.pendenciaDRE || null;
    jogo.emEventoDRE = backup.emEventoDRE || false;
    jogo.turnoRetornoDRE = backup.turnoRetornoDRE !== undefined ? backup.turnoRetornoDRE : null;
    jogo.idCausadorDRE = backup.idCausadorDRE !== undefined ? backup.idCausadorDRE : null; 
    jogo.modoFisico = backup.modoFisico || false; 
    jogo.faseTurno = backup.faseTurno || 'inicio';
    jogo.textoResultado = backup.textoResultado || "";
    jogo.acertouUltima = backup.acertouUltima !== undefined ? backup.acertouUltima : null;
    jogo.dificuldadeUltima = backup.dificuldadeUltima || 'facil';
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
            <div style="margin: auto 0; width: 100%; display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: 1.8rem; font-weight: bold; color: ${dificuldade === 'facil' ? '#28a745' : '#dc3545'}; text-transform: uppercase; margin-bottom: 20px;">
                    Andar ${dificuldade === 'facil' ? '3' : '5'} Casas
                </div>
                <div style="display: flex; gap: 15px;">
                    <button class="alternativa" style="background-color: #28a745; color: white; padding: 15px 30px; font-size: 1.2rem; border-radius: 8px;" onclick="responder(true)">Acertou</button>
                    <button class="alternativa" style="background-color: #dc3545; color: white; padding: 15px 30px; font-size: 1.2rem; border-radius: 8px;" onclick="responder(false)">Errou</button>
                </div>
            </div>
        `;
    } else {
        let perguntasFiltradas = jogo.perguntasDisponiveis.filter(p => p.dificuldade === dificuldade);
        
        if (perguntasFiltradas.length === 0) {
            const recuperar = bancoDePerguntasGeral.filter(p => p.dificuldade === dificuldade);
            jogo.perguntasDisponiveis.push(...recuperar);
            perguntasFiltradas = recuperar; 
            mostrarNotificacao(`🔄 As cartas de nível <strong>${dificuldade}</strong> foram reembaralhadas!`);
        }

        const idx = Math.floor(Math.random() * perguntasFiltradas.length);
        perguntaAtual = perguntasFiltradas[idx];
        const removeIdx = jogo.perguntasDisponiveis.findIndex(p => p.pergunta === perguntaAtual.pergunta);
        if (removeIdx !== -1) jogo.perguntasDisponiveis.splice(removeIdx, 1);
        
        let textoQ = perguntaAtual.pergunta;
        
        htmlVerso += `
            <div style="margin: auto 0; width: 100%; display: flex; flex-direction: column; align-items: center;">
                <p id="texto-pergunta" style="font-size: 1.2rem; margin-bottom: 15px; text-align: center;">${textoQ}</p>
                <div id="alternativas" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                    ${perguntaAtual.alternativas.map((alt, index) => {
                        let letra = String.fromCharCode(65 + index); 
                        let textoBotao = `<strong>${letra})</strong> ${alt}`;
                        let altEscapada = alt.replace(/'/g, "\\'").replace(/"/g, "&quot;"); 
                        return `<button class="alternativa" onclick="responder('${altEscapada}')">${textoBotao}</button>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    verso.innerHTML = htmlVerso;
    
    // Gira a carta visualmente (Física Direcional)
    if (dificuldade === 'facil') {
        cartaCentral.classList.add('virada-esquerda');
    } else {
        cartaCentral.classList.add('virada-direita');
    }

    // ✨ A SOLUÇÃO DEFINITIVA: Congela a frente e descongela o verso!
    // O navegador expulsa o foco automaticamente sem precisarmos de "blur()"
    document.querySelector('.carta-frente').setAttribute('inert', '');
    document.querySelector('.carta-verso').removeAttribute('inert');

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
                mostrarNotificacao("⏳ <strong>Tempo Esgotado!</strong> Resposta incorreta.");
                
                if (jogo.modoFisico) {
                    perguntaAtual = { resolucao: "Tempo esgotado (validação do professor)." };
                }
                
                processarResposta(false); 
            } else {
                mostrarNotificacao("⏳ <strong>Tempo Esgotado!</strong> Aguardando ação do mediador.");
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
    let jogadorAtivo;
    let jogadorAlvo;

    if (jogo.emEventoDRE) {
        jogadorAlvo = jogo.grupos[jogo.turnoAtual];
        let idxCausador = jogo.idCausadorDRE !== undefined && jogo.idCausadorDRE !== null 
            ? jogo.idCausadorDRE 
            : (jogo.turnoRetornoDRE - 1 + jogo.grupos.length) % jogo.grupos.length;
        jogadorAtivo = jogo.grupos[idxCausador];
    } else {
        jogadorAtivo = jogo.grupos[jogo.turnoAtual];
        let idxAlvo = (jogo.turnoAtual + 1) % jogo.grupos.length;
        jogadorAlvo = jogo.grupos[idxAlvo];
    }

    let msgPopUp = "";
    let grupoQueMoveu = null;

    // Gera as bolinhas e o nome para o Pop-up
    let corAtivo = jogadorAtivo ? `<span class="cor-indicador-texto" style="display:inline-block; width:15px; height:15px; background:${jogadorAtivo.cor}; border-radius:50%; margin-right:5px; vertical-align: middle; box-shadow: 1px 1px 2px rgba(0,0,0,0.5);"></span><strong>${jogadorAtivo.nome}</strong>` : "";

    let corAlvo = jogadorAlvo ? `<span class="cor-indicador-texto" style="display:inline-block; width:15px; height:15px; background:${jogadorAlvo.cor}; border-radius:50%; margin-right:5px; vertical-align: middle; box-shadow: 1px 1px 2px rgba(0,0,0,0.5);"></span><strong>${jogadorAlvo.nome}</strong>` : "";

    if (dificuldadeAtual === 'facil') {
        if (acertou) {
            jogadorAlvo.posicao += 3;
            grupoQueMoveu = jogadorAlvo;
            msgPopUp = `<strong>Correto!</strong> ${corAlvo} acertou e avançou 3 casas.`;
        } else {
            if (jogo.emEventoDRE) {
                msgPopUp = `<strong>Incorreto, ${corAlvo}!</strong><br>Como era uma Pergunta Bônus (DRE), ninguém sofre penalidade.`;
            } else {
                jogadorAtivo.posicao += 1;
                grupoQueMoveu = jogadorAtivo;
                msgPopUp = `<strong>Incorreto, ${corAlvo}!</strong><br>${corAtivo} ganhou 1 casa de bônus por dificultar.`;
            }
        }
    } else { 
        if (acertou) {
            jogadorAlvo.posicao += 5;
            grupoQueMoveu = jogadorAlvo;
            msgPopUp = `<strong>Correto!</strong> ${corAlvo} acertou e avançou 5 casas.`;
        } else {
            if (jogo.emEventoDRE) {
                msgPopUp = `<strong>Incorreto, ${corAlvo}!</strong><br>Como era uma Pergunta Bônus (DRE), ninguém sofre penalidade.`;
            } else {
                jogadorAtivo.posicao += 3;
                grupoQueMoveu = jogadorAtivo;
                msgPopUp = `<strong>Incorreto, ${corAlvo}!</strong><br>${corAtivo} ganhou 3 casas de bônus por dificultar.`;
            }
        }
    }

    // Trava para não ultrapassar o final do tabuleiro
    jogo.grupos.forEach(g => { if(g.posicao >= jogo.totalCasas - 1) g.posicao = jogo.totalCasas - 1; });

    // Se o grupo que se moveu caiu em casa especial, ativa o combo
    let logCombo = "";
    if (grupoQueMoveu && grupoQueMoveu.posicao > 0 && grupoQueMoveu.posicao < jogo.totalCasas - 1) {
        logCombo = ativarMotorDeCombos(grupoQueMoveu);
    }

    jogo.grupos.forEach(g => { 
        if(g.posicao < 0) g.posicao = 0;
        if(g.posicao >= jogo.totalCasas - 1) g.posicao = jogo.totalCasas - 1; 
    });

    let textoNotificacao = msgPopUp;
    if (logCombo !== "") textoNotificacao += `<br><br><strong>Efeitos Extras:</strong> ` + logCombo;

    // TOCA O SOM APENAS SE ALGUÉM REALMENTE ANDOU! 🎵
    if (grupoQueMoveu !== null || logCombo !== "") {
        tocarSom();
    }

    // ✨ OPÇÃO 3: Salva o resultado e desenha a tela de pausa
    jogo.faseTurno = 'resultado';
    jogo.textoResultado = textoNotificacao;
    jogo.acertouUltima = acertou;
    jogo.dificuldadeUltima = dificuldadeAtual;

    salvarEstado();
    montarTelaJogo();
}

// O MOTOR DE COMBOS! (Sem loop, restrito a 1 execução por turno)
function ativarMotorDeCombos(grupo) {
    let log = "";
    
    // Substituímos o 'while' por um 'if'. O efeito só acontece UMA vez e o turno encerra!
    if (grupo.posicao > 0 && grupo.posicao < jogo.totalCasas - 1) {
        let especial = CASAS_ESPECIAIS[grupo.posicao];
        
        if (especial) { 
            let corGrupo = `<span class="cor-indicador-texto" style="display:inline-block; width:15px; height:15px; background:${grupo.cor}; border-radius:50%; margin-right:5px; vertical-align: middle; box-shadow: 1px 1px 2px rgba(0,0,0,0.5);"></span><strong>${grupo.nome}</strong>`;
            
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
                jogo.grupos.forEach(g => { if (g.id !== grupo.id) g.posicao += 2; });
                log += `Recuou -2 e os outros avançaram +2!`;
            } else if (especial === 'DRE+') {
                log += `Pergunta Bônus garantida!`;
                jogo.pendenciaDRE = { ativo: true, tipo: 'DRE+', grupoCausador: grupo };
            } else if (especial === 'DRE-') {
                log += `Deve escolher quem sofrerá/ganhará a pergunta!`;
                jogo.pendenciaDRE = { ativo: true, tipo: 'DRE-', grupoCausador: grupo };
            }
        }
    }
    
    // Garante que ninguém fique com posição negativa
    jogo.grupos.forEach(g => { if(g.posicao < 0) g.posicao = 0; }); 
    
    return log;
}

function proximoTurno() {
    jogo.faseTurno = 'inicio'; // ✨ RESETA O ESTADO PARA A PRÓXIMA PERGUNTA
    // Removemos a linha que tentava fechar o modal antigo
    
    if (jogo.pendenciaDRE && jogo.pendenciaDRE.ativo) {
        let p = jogo.pendenciaDRE;
        jogo.pendenciaDRE = null; 
        
        // ✨ CORREÇÃO: Só define o ponto de retorno se for o primeiro evento da cadeia.
        // Se for um DRE ativando outro DRE, mantém a memória original intacta.
        if (!jogo.emEventoDRE) {
            jogo.turnoRetornoDRE = (jogo.turnoAtual + 1) % jogo.grupos.length;
        }
        
        jogo.emEventoDRE = true;
        
        let idCausador = jogo.grupos.findIndex(g => g.id === p.grupoCausador.id);
        jogo.idCausadorDRE = idCausador; // SALVA O CAUSADOR REAL AQUI

        salvarEstado();

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
        jogo.idCausadorDRE = null; // LIMPA O CAUSADOR AQUI
    } else {
        jogo.turnoAtual = (jogo.turnoAtual + 1) % jogo.grupos.length;
    }
    
    salvarEstado();
    montarTelaJogo(); // Recria o tabuleiro e desvira a carta central para o próximo
}

// --- FUNÇÕES DE CONTROLE DO DRE ---
function abrirSelecaoAlvoDRE(nomeEscolhedor) {
    // Agora a seleção acontece no centro do tabuleiro, sem esconder o jogo
    const centro = document.getElementById('centro-tabuleiro');
    
    let botoesHtml = jogo.grupos.map((g, i) => {
        if (g.nome === nomeEscolhedor) return ''; // Ignora a própria equipe
        
        return `
        <button class="alternativa" style="display: flex; align-items: center; justify-content: flex-start; gap: 15px; font-weight: bold; padding: 12px 20px; border-radius: 12px;" onclick="aplicarAlvoDRE(${i})">
            <span style="display:inline-block; width:20px; height:20px; background:${g.cor}; border-radius:50%; box-shadow: 1px 1px 3px rgba(0,0,0,0.5);"></span>
            ${g.nome}
        </button>
        `;
    }).join('');

    // Injeta a seleção direto na face da carta central
    centro.innerHTML = `
        <div class="carta-mestra" id="carta-central">
            <div class="carta-inner">
                <div class="carta-frente" style="justify-content: flex-start; padding: 25px;">
                    <div style="font-size: 1.5rem; font-weight: 900; color: #dc3545; margin-bottom: 10px; text-shadow: 1px 1px 0px rgba(0,0,0,0.1);">🎯 Armadilha DRE-</div>
                    <p style="font-size: 1.1rem; text-align: center; margin-bottom: 15px; color: #2c3e50; line-height: 1.3;">
                        <strong>${nomeEscolhedor}</strong>, escolha o alvo olhando o mapa:
                    </p>
                    <div style="width: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                        ${botoesHtml}
                    </div>
                </div>
                <div class="carta-verso"></div>
            </div>
        </div>
    `;
}

function aplicarAlvoDRE(index) {
    jogo.turnoAtual = index;
    
    // ✨ CORREÇÃO: Salva o jogo IMEDIATAMENTE após o alvo ser escolhido
    // Garante que o F5 não faça o jogo esquecer quem vai responder
    salvarEstado(); 
    
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

    // Lógica inteligente de Medalhas para Empate (Dense Ranking)
    let rankVisual = 1;
    let rankingItemsHTML = ranking.map((g, i) => {
        if (i > 0 && ranking[i].posicao < ranking[i - 1].posicao) {
            rankVisual++;
        }
        let medalha = "";
        if (rankVisual === 1) medalha = "🥇";
        else if (rankVisual === 2) medalha = "🥈";
        else if (rankVisual === 3) medalha = "🥉";
        
        let casaTexto = g.posicao >= jogo.totalCasas - 1 ? "Publicação (Final)" : `Casa ${g.posicao}`;
        return `<li style="margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; display: flex; align-items: center; gap: 8px;">
            <span class="cor-indicador-texto" style="display:inline-block; width:15px; height:15px; background:${g.cor}; border-radius:50%; box-shadow: 1px 1px 2px rgba(0,0,0,0.3);"></span>
            <strong>${g.nome}</strong> ${medalha} - <span style="font-size: 1rem; color: #64748b;">${casaTexto}</span>
        </li>`;
    }).join('');

    let rankingHTML = `
        <div style="text-align: center; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 25px; box-sizing: border-box;">
            <h2 style="font-size: 2.4rem; color: #2c3e50; margin: 0 0 5px 0; font-weight: 900; text-transform: uppercase;">🏆 FIM DE JOGO 🏆</h2>
            <p style="font-size: 1.3rem; color: #4a5568; margin: 0 0 20px 0; line-height: 1.3;">${tituloFim}<br><strong style="font-size: 1.8rem; color: #2c3e50;">${subtitulo}</strong></p>
            
            <div style="background: #ffffff; padding: 20px 25px; border-radius: 12px; width: 90%; max-width: 440px; border: 3px solid #2c3e50; box-shadow: 4px 4px 0px #2c3e50; max-height: 240px; overflow-y: auto; box-sizing: border-box;">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 1.3rem; text-align: center; text-transform: uppercase; font-weight: 800; border-bottom: 2px solid #2c3e50; padding-bottom: 5px;">Ranking Final</h3>
                <ol style="margin: 0; padding-left: 10px; list-style: none; text-align: left;">
                    ${rankingItemsHTML}
                </ol>
            </div>
            
            <button onclick="location.reload()" style="margin-top: 25px; padding: 12px 35px; font-size: 1.2rem; font-weight: bold; background: #007bff; color: white; border: 3px solid #2c3e50; box-shadow: 4px 4px 0px #2c3e50; border-radius: 12px; cursor: pointer;">Sair para o Menu</button>
        </div>
    `;

    const centro = document.getElementById('centro-tabuleiro');
    // Alinha o fundo com a estética original e limpa dos cards do tabuleiro
    centro.style.background = "#f8fafc"; 
    centro.style.borderRadius = "16px";
    centro.style.border = "4px solid #2c3e50";
    centro.style.boxShadow = "8px 8px 0px rgba(44, 62, 80, 0.3)";
    centro.style.width = "95%";
    centro.style.height = "95%";
    centro.style.zIndex = "20";
    
    centro.innerHTML = rankingHTML;
}

// --- NAVEGAÇÃO, MODAIS E ZOOM ---
function voltarMenu() {
    // Para o temporizador para não dar pop-up fantasma
    clearInterval(temporizador);
    
    // Tira o modo projetor se estiver ativo
    const body = document.body;
    if (body.classList.contains('modo-projetor')) {
        body.classList.remove('modo-projetor');
        if (document.exitFullscreen) document.exitFullscreen();
        const btn = document.getElementById('btn-projetor');
        if(btn) {
            btn.innerText = "Modo Projetor";
            btn.style.backgroundColor = "#007bff";
        }
    }

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
    document.getElementById('tabuleiro').style.zoom = nivelZoom;
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
    
    // Atualiza o texto
    toast.innerHTML = mensagem + `<br><small style="font-size: 0.8rem; color: #ccc;">(Clique para fechar)</small>`;
    
    // Se não estiver aparecendo, mostra. Se já estiver, só reseta o tempo sem piscar.
    if (!toast.classList.contains('mostrar')) {
        toast.classList.add('mostrar');
    }
    
    clearTimeout(timerToast);
    timerToast = setTimeout(() => {
        fecharNotificacao();
    }, 6000); 
}

function fecharNotificacao() {
    const toast = document.getElementById('toast-notificacao');
    toast.classList.remove('mostrar');
}

async function carregarContribuidores() {
    try {
        const resposta = await fetch('contributors.json'); 
        if (!resposta.ok) throw new Error("Arquivo não encontrado");
        
        const contribuidores = await resposta.json();
        const container = document.getElementById('lista-contribuidores');
        
        container.innerHTML = contribuidores.map(c => {
            let textoUsuario = (c.usuario && c.usuario.trim() !== "") ? ` (${c.usuario})` : "";
            
            // Adiciona a tag com o papel/cargo do contribuidor
            let papel = c.papel ? `<br><small style="color: #666; font-size: 0.95rem;">🛠️ ${c.papel}</small>` : "";
            
            let nomeFormatado = c.link && c.link.trim() !== ""
                ? `<a href="${c.link}" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">${c.nome}${textoUsuario}</a>`
                : `<strong style="color: #2c3e50;">${c.nome}${textoUsuario}</strong>`;

            return `<div style="margin-bottom: 12px; line-height: 1.2;">${nomeFormatado}${papel}</div>`;
        }).join('');

    } catch (error) {
        document.getElementById('lista-contribuidores').innerText = "elrunix12"; 
        console.error("Erro ao carregar contribuidores:", error);
    }
}

// --- MENU MOBILE ---
function toggleMenuMobile() {
    const painel = document.querySelector('.painel-lateral');
    const overlay = document.getElementById('overlay-mobile');
    
    // Adiciona ou remove a classe 'aberto'
    painel.classList.toggle('aberto');
    
    // Mostra ou esconde o fundo escuro
    if (painel.classList.contains('aberto')) {
        overlay.classList.add('ativo');
    } else {
        overlay.classList.remove('ativo');
    }
}

// --- SISTEMA DE ÁUDIO ---
function tocarSom() {
    if (configuracoes.somAtivo) {
        somPulo.currentTime = 0; // Reinicia o áudio para tocar rápido
        let playPromise = somPulo.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Se o arquivo não existir ou o navegador bloquear, engole o erro e o jogo não trava
                console.warn("Áudio bloqueado ou não encontrado.");
            });
        }
    }
}

// --- CONTROLE REMOTO / TECLADO ---
let bloqueioControle = false;

document.addEventListener('keydown', function(event) {
    if (bloqueioControle) return;

    // ✨ TRAVA NOVA: Se tiver algum modal aberto (Novo Jogo, Configs, etc), o teclado ignora a carta!
    if (document.querySelector('.modal.ativo')) return;

    const cartaCentral = document.getElementById('carta-central');
    if (!cartaCentral) return;

    const isVirada = cartaCentral.classList.contains('virada-esquerda') || cartaCentral.classList.contains('virada-direita');
    const faceAtiva = isVirada ? cartaCentral.querySelector('.carta-verso') : cartaCentral.querySelector('.carta-frente');
    
    const botoes = Array.from(faceAtiva.querySelectorAll('button:not([disabled])'));
    if (botoes.length === 0) return;

    const indexAtual = botoes.indexOf(document.activeElement);
    let teclaProcessada = false;

    // AVANÇAR (PageDown / Setas Direita/Baixo)
    if (event.key === 'PageDown' || event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault(); 
        let proximo = indexAtual === -1 ? 0 : (indexAtual + 1) % botoes.length;
        botoes[proximo].focus();
        teclaProcessada = true;
    }
    // VOLTAR (PageUp / Setas Esquerda/Cima)
    else if (event.key === 'PageUp' || event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault(); 
        let anterior = indexAtual <= 0 ? botoes.length - 1 : indexAtual - 1;
        botoes[anterior].focus();
        teclaProcessada = true;
    }
    // FALSO ENTER (Exclusivo para o Passador de Slides - 'B' ou Ponto)
    else if (event.key === 'b' || event.key === 'B' || event.key === '.') {
        event.preventDefault(); 
        
        if (indexAtual !== -1) {
            botoes[indexAtual].click();
        } else {
            // Limpa o foco sujo da memória e clica na opção principal da tela atual
            if (document.activeElement) document.activeElement.blur();
            botoes[0].click();
        }
        teclaProcessada = true;
    }

    if (teclaProcessada) {
        bloqueioControle = true;
        setTimeout(() => {
            bloqueioControle = false;
        }, 400);
    }
});