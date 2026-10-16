// Bandeiras do Mundo: aparece uma bandeira, você digita o país. Sem tempo.
// Usa PAISES (paises.js) e corrigir() (correcao.js).

const CONTINENTES = ["Todos", "África", "Américas", "Ásia", "Europa", "Oceania"];
const DE = { "África": "da África", "Américas": "das Américas", "Ásia": "da Ásia", "Europa": "da Europa", "Oceania": "da Oceania" };
const CHAVE = "bandeiras-progresso";

const $ = (id) => document.getElementById(id);
const elBandeira = $("bandeira"), elMoldura = $("moldura"), elForm = $("form");
const elResposta = $("resposta"), elRetorno = $("retorno"), elGrade = $("grade");
const elPlacar = $("placar"), elBarra = $("barra"), elFiltros = $("filtros");
const elJogo = $("jogo"), elFim = $("fim"), elFimTexto = $("fim-texto");
const elDica = $("dica"), elMostrar = $("mostrar"), elPular = $("pular"), elRecomecar = $("recomecar");

// ---------- Progresso salvo no aparelho ----------

let progresso = { acertos: {}, filtro: "Todos" };
try {
  const salvo = JSON.parse(localStorage.getItem(CHAVE));
  if (salvo && salvo.acertos) progresso = { ...progresso, ...salvo };
} catch {}

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(progresso));
  } catch {}
}

// ---------- Fila de bandeiras ----------

let fila = [];          // bandeiras que faltam, na ordem em que vão aparecer
let atual = null;       // país da bandeira na tela
let revelada = false;   // a resposta da bandeira atual já foi mostrada?
let esperando = null;   // timer entre um acerto e a próxima bandeira

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function doFiltro() {
  return progresso.filtro === "Todos" ? PAISES : PAISES.filter((p) => p.r === progresso.filtro);
}

function montarFila() {
  fila = embaralhar(doFiltro().filter((p) => !progresso.acertos[p.c]));
}

function urlBandeira(pais) {
  return `flags/${pais.c}.svg`;
}

// ---------- Tela ----------

function mostrarAtual() {
  clearTimeout(esperando);
  revelada = false;
  atual = fila[0] || null;
  elMoldura.classList.remove("certo", "errado");
  limparRetorno();
  elMostrar.textContent = "Ver resposta";

  const terminou = !atual;
  elJogo.hidden = terminou;
  elFim.hidden = !terminou;
  if (terminou) {
    const total = doFiltro().length;
    elFimTexto.textContent = progresso.filtro === "Todos"
      ? `Você acertou todas as ${total} bandeiras do mundo!`
      : `Você acertou todas as ${total} bandeiras ${DE[progresso.filtro]}.`;
  } else {
    elBandeira.src = urlBandeira(atual);
    elResposta.value = "";
  }
  marcarAtualNaGrade();
}

function retorno(texto, tipo) {
  elRetorno.textContent = texto;
  elRetorno.className = "retorno " + (tipo || "");
}

function limparRetorno() {
  elRetorno.innerHTML = "&nbsp;";
  elRetorno.className = "retorno";
}

function atualizarPlacar() {
  const lista = doFiltro();
  const feitas = lista.filter((p) => progresso.acertos[p.c]).length;
  elPlacar.textContent = `${feitas} / ${lista.length}`;
  elBarra.style.width = `${(feitas / lista.length) * 100}%`;
}

function montarFiltros() {
  elFiltros.innerHTML = "";
  for (const nome of CONTINENTES) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = nome;
    b.setAttribute("aria-pressed", String(nome === progresso.filtro));
    b.addEventListener("click", () => {
      progresso.filtro = nome;
      salvar();
      iniciar();
    });
    elFiltros.appendChild(b);
  }
}

function montarGrade() {
  elGrade.innerHTML = "";
  // Ordem embaralhada, para a posição não entregar o nome do país
  for (const pais of embaralhar(doFiltro())) {
    const acertou = !!progresso.acertos[pais.c];
    const b = document.createElement("button");
    b.type = "button";
    b.className = "item" + (acertou ? " acertou" : "");
    b.dataset.codigo = pais.c;

    const img = document.createElement("img");
    img.src = urlBandeira(pais);
    img.alt = acertou ? `Bandeira de ${pais.n}` : "Bandeira ainda não acertada";
    img.loading = "lazy";
    const nome = document.createElement("span");
    nome.textContent = acertou ? pais.n : "?";

    b.append(img, nome);
    b.addEventListener("click", () => escolher(pais));
    elGrade.appendChild(b);
  }
  marcarAtualNaGrade();
}

function marcarAtualNaGrade() {
  for (const item of elGrade.children) {
    item.classList.toggle("atual", !!atual && item.dataset.codigo === atual.c);
  }
}

// Tocar numa bandeira da grade traz ela para a frente da fila
function escolher(pais) {
  if (progresso.acertos[pais.c]) return;
  fila = [pais, ...fila.filter((p) => p !== pais)];
  mostrarAtual();
  window.scrollTo({ top: 0, behavior: "smooth" });
  elResposta.focus();
}

// ---------- Ações ----------

function responder() {
  if (!atual || esperando) return;
  const resultado = corrigir(elResposta.value, atual, PAISES);
  if (!resultado) return;

  elMoldura.classList.remove("certo", "errado", "tremer");
  void elMoldura.offsetWidth; // reinicia a animação

  if (resultado.certo) {
    progresso.acertos[atual.c] = true;
    salvar();
    elMoldura.classList.add("certo");
    retorno(`✅ Certo! ${atual.n}`, "certo");
    const item = elGrade.querySelector(`[data-codigo="${atual.c}"]`);
    if (item) {
      item.classList.add("acertou");
      item.querySelector("span").textContent = atual.n;
      item.querySelector("img").alt = `Bandeira de ${atual.n}`;
    }
    atualizarPlacar();
    fila.shift();
    esperando = setTimeout(() => {
      esperando = null;
      mostrarAtual();
    }, 900);
  } else {
    elMoldura.classList.add("errado", "tremer");
    retorno(
      resultado.parecido ? `❌ Errado. Essa não é a bandeira de ${resultado.parecido.n}.` : "❌ Errado. Tente de novo.",
      "errado"
    );
    elResposta.select();
  }
}

function dica() {
  if (!atual || esperando) return;
  const letras = atual.n.replace(/[^\p{L}]/gu, "").length;
  retorno(`💡 Começa com "${atual.n[0]}" e tem ${letras} letras.`, "dica");
  elResposta.focus();
}

// Primeiro toque mostra o nome; o segundo passa para a próxima.
// A bandeira volta no fim da fila para você treinar de novo.
function verResposta() {
  if (!atual || esperando) return;
  if (!revelada) {
    revelada = true;
    retorno(`👉 É ${atual.n}.`, "dica");
    elMostrar.textContent = "Próxima";
  } else {
    pular();
  }
}

function pular() {
  if (!atual || esperando) return;
  fila.push(fila.shift());
  mostrarAtual();
  elResposta.focus();
}

// "Recomeçar" pede um segundo toque para confirmar
let confirmarTimer = null;
function recomecar() {
  if (!elRecomecar.classList.contains("confirmar")) {
    elRecomecar.classList.add("confirmar");
    elRecomecar.textContent = "Toque de novo para zerar";
    confirmarTimer = setTimeout(() => {
      elRecomecar.classList.remove("confirmar");
      elRecomecar.textContent = "Recomeçar";
    }, 4000);
    return;
  }
  clearTimeout(confirmarTimer);
  elRecomecar.classList.remove("confirmar");
  elRecomecar.textContent = "Recomeçar";
  const doContinente = doFiltro();
  for (const p of doContinente) delete progresso.acertos[p.c];
  salvar();
  iniciar();
}

function iniciar() {
  clearTimeout(esperando);
  esperando = null;
  montarFiltros();
  montarFila();
  montarGrade();
  atualizarPlacar();
  mostrarAtual();
}

elForm.addEventListener("submit", (e) => {
  e.preventDefault();
  responder();
});
elDica.addEventListener("click", dica);
elMostrar.addEventListener("click", verResposta);
elPular.addEventListener("click", pular);
elRecomecar.addEventListener("click", recomecar);

iniciar();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}
