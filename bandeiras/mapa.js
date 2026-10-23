// Países do mundo: digite o nome de um país e ele fica verde no mapa. Sem tempo.
// Não precisa apertar Enter: o país entra assim que o nome bate.
// Usa PAISES (paises.js), normalizar/distancia/tolerancia/nomesDe (correcao.js) e MAPA (mapa-dados.js).

const REGIOES_MAPA = ["África", "América do Norte", "América do Sul", "Ásia", "Europa", "Oceania"];
const FILTROS_MAPA = ["Todos", ...REGIOES_MAPA];
const DO_MAPA = {
  "África": "da África", "América do Norte": "da América do Norte", "América do Sul": "da América do Sul",
  "Ásia": "da Ásia", "Europa": "da Europa", "Oceania": "da Oceania"
};
const AMERICA_DO_SUL = ["ar", "bo", "br", "cl", "co", "ec", "gy", "py", "pe", "sr", "uy", "ve"];
const CHAVE_MAPA = "bandeiras-mapa";
const ESPERA_PARECIDO = 800;   // ms parado antes de aceitar um nome com erro de digitação
const ESPERA_AMBIGUO = 1100;   // ms parado antes de aceitar "Sudão" (pode virar "Sudão do Sul")

function regiaoNoMapa(pais) {
  if (pais.r !== "Américas") return pais.r;
  return AMERICA_DO_SUL.includes(pais.c) ? "América do Sul" : "América do Norte";
}

// ---------- Progresso salvo no aparelho ----------

// achados[filtro] = códigos já achados naquele jogo; desistiu[filtro] = true depois de desistir
let mapa = { aba: "bandeiras", filtro: "Todos", achados: {}, desistiu: {} };
try {
  const salvo = JSON.parse(localStorage.getItem(CHAVE_MAPA));
  if (salvo && salvo.achados) mapa = { ...mapa, ...salvo };
  if (!FILTROS_MAPA.includes(mapa.filtro)) mapa.filtro = "Todos";
  if (!mapa.desistiu) mapa.desistiu = {};
} catch {}

function salvarMapa() {
  try {
    localStorage.setItem(CHAVE_MAPA, JSON.stringify(mapa));
  } catch {}
}

const me = (id) => document.getElementById(id);
const mapaEls = {
  titulo: document.querySelector("header h1"),
  abaBandeiras: me("aba-bandeiras"), abaMapa: me("aba-mapa"),
  modoBandeiras: me("modo-bandeiras"), modoMapa: me("modo-mapa"),
  filtros: me("mapa-filtros"), topo: me("mapa-topo"), resposta: me("mapa-resposta"), aviso: me("mapa-aviso"),
  desistir: me("mapa-desistir"), fim: me("mapa-fim"), fimTitulo: me("mapa-fim-titulo"),
  fimTexto: me("mapa-fim-texto"), deNovo: me("mapa-de-novo"),
  caixa: me("mapa-caixa"), svg: me("mapa"), lista: me("mapa-lista"), recomecar: me("mapa-recomecar")
};

const doJogoMapa = () =>
  mapa.filtro === "Todos" ? PAISES : PAISES.filter((p) => regiaoNoMapa(p) === mapa.filtro);
const achadosAgora = () => (mapa.achados[mapa.filtro] = mapa.achados[mapa.filtro] || []);
const desistiuAgora = () => !!mapa.desistiu[mapa.filtro];

// ---------- Reconhecer o que foi digitado ----------

const NOMES = new Map(PAISES.map((p) => [p, nomesDe(p)]));

// { pais, espera } = país reconhecido e quanto esperar antes de aceitar (0 = na hora)
// { jaAchado } = nome de um país que já está verde
function reconhecer(digitado) {
  const texto = normalizar(digitado);
  if (!texto) return null;
  const feitos = new Set(achadosAgora());
  const faltam = doJogoMapa().filter((p) => !feitos.has(p.c));

  // Algum país que falta começa com o texto? Então ainda pode estar digitando.
  const comecaOutro = (exceto) =>
    faltam.some((p) => p !== exceto && NOMES.get(p).some((n) => n.length > texto.length && n.startsWith(texto)));

  const exato = faltam.find((p) => NOMES.get(p).includes(texto));
  if (exato) return { pais: exato, espera: comecaOutro(exato) ? ESPERA_AMBIGUO : 0 };

  if (comecaOutro(null)) return null;

  const jaAchado = doJogoMapa().find((p) => feitos.has(p.c) && NOMES.get(p).includes(texto));
  if (jaAchado) return { jaAchado };

  // Erro de digitação: precisa estar mais perto desse país do que de qualquer outro do mundo
  let melhor = null, segundo = Infinity;
  for (const pais of PAISES) {
    const p = maisPerto(texto, pais);
    if (!melhor || p.dist < melhor.dist) {
      if (melhor) segundo = melhor.dist;
      melhor = { pais, ...p };
    } else if (p.dist < segundo) {
      segundo = p.dist;
    }
  }
  if (melhor.dist === 0 || melhor.dist > tolerancia(melhor.nome.length) || melhor.dist >= segundo) return null;
  if (feitos.has(melhor.pais.c)) return { jaAchado: melhor.pais, espera: ESPERA_PARECIDO };
  if (!faltam.includes(melhor.pais)) return null;
  return { pais: melhor.pais, espera: ESPERA_PARECIDO };
}

let esperaMapa = null;
// País que acabou de entrar e o que já foi digitado dele. Quem digita
// "Antigua e Barbuda" vê o país entrar em "Antigua"; o resto " e Barbuda" é engolido.
let continuacao = null;

function aoDigitar() {
  clearTimeout(esperaMapa);
  avisoMapa("");
  if (desistiuAgora()) return;
  if (continuacao) {
    const junto = continuacao.digitado + normalizar(mapaEls.resposta.value);
    if (NOMES.get(continuacao.pais).some((n) => n.length > continuacao.digitado.length && n.startsWith(junto))) {
      continuacao.digitado = junto;
      mapaEls.resposta.value = "";
      return;
    }
    continuacao = null;
  }
  const r = reconhecer(mapaEls.resposta.value);
  if (!r) return;
  const agir = () => {
    if (r.pais) aceitar(r.pais);
    else {
      // Selecionado: a próxima letra já começa outro nome
      avisoMapa(`${r.jaAchado.n} já está no mapa.`);
      mapaEls.resposta.select();
    }
  };
  if (r.espera) esperaMapa = setTimeout(agir, r.espera);
  else agir();
}

function aceitar(pais) {
  continuacao = { pais, digitado: normalizar(mapaEls.resposta.value) };
  achadosAgora().push(pais.c);
  salvarMapa();
  mapaEls.resposta.value = "";
  pintar();
  atualizarListaMapa();
  placarMapa();
  if (achadosAgora().length === doJogoMapa().length) mostrarFimMapa();
}

function avisoMapa(texto) {
  mapaEls.aviso.textContent = texto || " ";
}

// ---------- Mapa (SVG) ----------

const SVG = "http://www.w3.org/2000/svg";
const formas = {};   // código → <path>
const marcas = {};   // código → <circle> dos países pequenos
let vista = null;    // { x, y, w, h } do viewBox (mapa parado, sem zoom)

function desenharMapa() {
  const svg = mapaEls.svg;
  svg.innerHTML = "";
  const mar = document.createElementNS(SVG, "rect");
  mar.setAttribute("class", "mar");
  mar.setAttribute("x", -2000);
  mar.setAttribute("y", -2000);
  mar.setAttribute("width", 5000);
  mar.setAttribute("height", 5000);
  const fundo = document.createElementNS(SVG, "path");
  fundo.setAttribute("class", "terra-fora");
  fundo.setAttribute("d", MAPA.fundo);
  svg.append(mar, fundo);
  for (const [c, d] of Object.entries(MAPA.paises)) {
    const p = document.createElementNS(SVG, "path");
    p.setAttribute("d", d);
    formas[c] = p;
    svg.appendChild(p);
  }
  for (const c of MAPA.pequenos) {
    const [x, y] = MAPA.pontos[c];
    const m = document.createElementNS(SVG, "circle");
    m.setAttribute("cx", x);
    m.setAttribute("cy", y);
    marcas[c] = m;
    svg.appendChild(m);
  }
  for (const el of svg.querySelectorAll("path, circle")) el.setAttribute("vector-effect", "non-scaling-stroke");
}

// Cor de cada país: verde = achado, vermelho = faltou (depois de desistir)
function pintar() {
  const noJogo = new Set(doJogoMapa().map((p) => p.c));
  const feitos = new Set(achadosAgora());
  const desistiu = desistiuAgora();
  for (const c of new Set([...Object.keys(formas), ...Object.keys(marcas)])) {
    const estado = !noJogo.has(c) ? "fora" : feitos.has(c) ? "achado" : desistiu ? "faltou" : "falta";
    if (formas[c]) formas[c].setAttribute("class", "pais " + estado);
    if (marcas[c]) {
      marcas[c].setAttribute("class", "marca " + estado);
      // Só aparece depois de achado (verde) ou de desistir (vermelho)
      marcas[c].style.display = estado === "achado" || estado === "faltou" ? "" : "none";
    }
  }
}

function enquadrar() {
  const q = mapa.filtro === "Todos" ? [0, 0, MAPA.w, MAPA.h] : MAPA.quadros[mapa.filtro];
  vista = { x: q[0], y: q[1], w: q[2], h: q[3] };
  // Caixa com o formato do pedaço de mapa, sem faixas vazias
  const caixa = mapaEls.caixa;
  const altura = caixa.clientWidth * (vista.h / vista.w);
  caixa.style.height = Math.round(Math.min(window.innerHeight * 0.62, Math.max(140, altura))) + "px";
  aplicarVista();
}

function aplicarVista() {
  const svg = mapaEls.svg;
  svg.setAttribute("viewBox", `${vista.x} ${vista.y} ${vista.w} ${vista.h}`);
  // Bolinhas dos países pequenos sempre com o mesmo tamanho na tela
  const escala = escalaTela();
  const r = 4 / escala;
  for (const m of Object.values(marcas)) m.setAttribute("r", r.toFixed(2));
}

// Pixels de tela por unidade do mapa
function escalaTela() {
  const caixa = mapaEls.svg.getBoundingClientRect();
  if (!caixa.width) return 1;
  return Math.min(caixa.width / vista.w, caixa.height / vista.h);
}

window.addEventListener("resize", () => vista && aplicarVista());

// ---------- Lista dos achados: uma gaveta por continente ----------

const gavetasAbertas = new Set();

function atualizarListaMapa() {
  const feitos = new Set(achadosAgora());
  const desistiu = desistiuAgora();
  const regioes = mapa.filtro === "Todos" ? REGIOES_MAPA : [mapa.filtro];
  mapaEls.lista.innerHTML = "";
  for (const regiao of regioes) {
    const paises = PAISES.filter((p) => regiaoNoMapa(p) === regiao)
      .sort((a, b) => a.n.localeCompare(b.n, "pt"));
    const mostrar = paises.filter((p) => feitos.has(p.c) || desistiu);
    const certos = paises.filter((p) => feitos.has(p.c)).length;

    const gaveta = document.createElement("details");
    gaveta.className = "mapa-gaveta";
    gaveta.open = gavetasAbertas.has(regiao);
    gaveta.addEventListener("toggle", () => {
      if (gaveta.open) gavetasAbertas.add(regiao);
      else gavetasAbertas.delete(regiao);
    });
    const titulo = document.createElement("summary");
    titulo.textContent = regiao;
    const conta = document.createElement("span");
    conta.textContent = `${certos} / ${paises.length}`;
    titulo.appendChild(conta);

    const nomes = document.createElement("ul");
    for (const p of mostrar) {
      const li = document.createElement("li");
      li.className = feitos.has(p.c) ? "achado" : "faltou";
      li.textContent = p.n;
      nomes.appendChild(li);
    }
    if (!mostrar.length) {
      const vazio = document.createElement("li");
      vazio.className = "vazio";
      vazio.textContent = "Nenhum ainda.";
      nomes.appendChild(vazio);
    }
    gaveta.append(titulo, nomes);
    mapaEls.lista.appendChild(gaveta);
  }
}

function placarMapa() {
  const total = doJogoMapa().length;
  const feitos = achadosAgora().length;
  elPlacar.textContent = `${feitos} / ${total}`;
  elBarra.style.width = total ? `${(feitos / total) * 100}%` : "0";
}

// ---------- Fim de jogo ----------

function mostrarFimMapa() {
  const total = doJogoMapa().length;
  const feitos = achadosAgora().length;
  const completo = feitos === total;
  const terminou = completo || desistiuAgora();
  mapaEls.fim.hidden = !terminou;
  mapaEls.topo.hidden = terminou;
  mapaEls.aviso.hidden = terminou;
  if (!terminou) return;
  mapaEls.fim.classList.toggle("desistiu", !completo);
  const deOnde = mapa.filtro === "Todos" ? "do mundo" : DO_MAPA[mapa.filtro];
  if (completo) {
    mapaEls.fimTitulo.textContent = "🎉 Parabéns!";
    mapaEls.fimTexto.textContent = `Você achou todos os ${total} países ${deOnde}.`;
  } else {
    mapaEls.fimTitulo.textContent = `${feitos} de ${total}`;
    mapaEls.fimTexto.textContent = `Os países em vermelho foram os que faltaram.`;
  }
  clearTimeout(esperaMapa);
  mapaEls.resposta.blur();
}

// Botões que pedem um segundo toque para confirmar
function confirmarDuasVezes(botao, textoNormal, textoConfirmar, acao) {
  let timer = null;
  botao.addEventListener("click", () => {
    if (!botao.classList.contains("confirmar")) {
      botao.classList.add("confirmar");
      botao.textContent = textoConfirmar;
      timer = setTimeout(() => {
        botao.classList.remove("confirmar");
        botao.textContent = textoNormal;
      }, 4000);
      return;
    }
    clearTimeout(timer);
    botao.classList.remove("confirmar");
    botao.textContent = textoNormal;
    acao();
  });
}

function zerarMapa() {
  mapa.achados[mapa.filtro] = [];
  delete mapa.desistiu[mapa.filtro];
  salvarMapa();
  iniciarMapa();
  mapaEls.resposta.focus();
}

confirmarDuasVezes(mapaEls.desistir, "Desistir", "Tem certeza?", () => {
  mapa.desistiu[mapa.filtro] = true;
  salvarMapa();
  pintar();
  atualizarListaMapa();
  mostrarFimMapa();
});
confirmarDuasVezes(mapaEls.recomecar, "Recomeçar", "Toque de novo para zerar", zerarMapa);
mapaEls.deNovo.addEventListener("click", zerarMapa);

// ---------- Filtros e abas ----------

function montarFiltrosMapa() {
  mapaEls.filtros.innerHTML = "";
  for (const nome of FILTROS_MAPA) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = nome;
    b.setAttribute("aria-pressed", String(nome === mapa.filtro));
    b.addEventListener("click", () => {
      if (nome === mapa.filtro) return;
      mapa.filtro = nome;
      salvarMapa();
      iniciarMapa();
    });
    mapaEls.filtros.appendChild(b);
  }
  const ativo = mapaEls.filtros.querySelector('[aria-pressed="true"]');
  if (ativo) mapaEls.filtros.scrollLeft = Math.max(0, ativo.offsetLeft - mapaEls.filtros.offsetLeft - 16);
}

function iniciarMapa() {
  clearTimeout(esperaMapa);
  mapaEls.resposta.value = "";
  avisoMapa("");
  montarFiltrosMapa();
  pintar();
  enquadrar();
  atualizarListaMapa();
  placarMapa();
  mostrarFimMapa();
}

function trocarAba(aba) {
  mapa.aba = aba;
  salvarMapa();
  const noMapa = aba === "mapa";
  mapaEls.abaBandeiras.setAttribute("aria-selected", String(!noMapa));
  mapaEls.abaMapa.setAttribute("aria-selected", String(noMapa));
  mapaEls.modoBandeiras.hidden = noMapa;
  mapaEls.modoMapa.hidden = !noMapa;
  document.body.classList.toggle("no-mapa", noMapa);
  mapaEls.titulo.textContent = noMapa ? "Países do Mundo" : "Bandeiras do Mundo";
  document.title = mapaEls.titulo.textContent;
  if (noMapa) iniciarMapa();
  else iniciar();
}

mapaEls.abaBandeiras.addEventListener("click", () => mapa.aba !== "bandeiras" && trocarAba("bandeiras"));
mapaEls.abaMapa.addEventListener("click", () => mapa.aba !== "mapa" && trocarAba("mapa"));
mapaEls.resposta.addEventListener("input", aoDigitar);
mapaEls.resposta.addEventListener("keydown", (e) => {
  if (e.key === "Enter") e.preventDefault();
});

desenharMapa();
if (mapa.aba === "mapa") trocarAba("mapa");
