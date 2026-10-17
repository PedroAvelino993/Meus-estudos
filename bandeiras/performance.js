// Modo Performance
// Rodada 1 (teste): cada bandeira dos continentes escolhidos aparece uma vez,
// sem dica; errou, passa. As que você errou viram o "treino".
// Rodadas seguintes: sempre as mesmas bandeiras do treino, até você dominar.

const CHAVE_PERF = "bandeiras-performance";

const perfInicial = () => ({
  continentes: [],
  fase: "escolha",   // "escolha" | "rodada" | "resultado"
  rodada: 0,
  treino: null,      // códigos das bandeiras erradas na rodada 1
  ordem: [],         // códigos da rodada atual, na ordem em que aparecem
  i: 0,              // posição na rodada
  certos: [],
  errados: [],
  historico: []      // [{ rodada, certos, total }]
});

let perf = perfInicial();
try {
  const salvo = JSON.parse(localStorage.getItem(CHAVE_PERF));
  if (salvo && salvo.fase) perf = { ...perfInicial(), ...salvo };
} catch {}

function salvarPerf() {
  try {
    localStorage.setItem(CHAVE_PERF, JSON.stringify(perf));
  } catch {}
}

const pe = (id) => document.getElementById(id);
const perfEls = {
  secao: pe("performance"),
  escolha: pe("perf-escolha"), opcoes: pe("perf-opcoes"), comecar: pe("perf-comecar"),
  rodada: pe("perf-rodada"), etiqueta: pe("perf-etiqueta"), moldura: pe("perf-moldura"),
  bandeira: pe("perf-bandeira"), form: pe("perf-form"), resposta: pe("perf-resposta"),
  ok: pe("perf-ok"), retorno: pe("perf-retorno"), naoSei: pe("perf-nao-sei"),
  resultado: pe("perf-resultado"), titulo: pe("perf-titulo"), texto: pe("perf-texto"),
  historico: pe("perf-historico"), erradas: pe("perf-erradas"), erradasTitulo: pe("perf-erradas-titulo"),
  proxima: pe("perf-proxima"), novo: pe("perf-novo")
};

const porCodigo = (c) => PAISES.find((p) => p.c === c);
let perfAguardando = false;   // mostrando o resultado de uma resposta
let perfTimer = null;

// ---------- Desenho das telas ----------

function renderPerformance() {
  clearTimeout(perfTimer);
  perfAguardando = false;
  perfEls.escolha.hidden = perf.fase !== "escolha";
  perfEls.rodada.hidden = perf.fase !== "rodada";
  perfEls.resultado.hidden = perf.fase !== "resultado";

  if (perf.fase === "escolha") renderEscolha();
  if (perf.fase === "rodada") renderBandeira();
  if (perf.fase === "resultado") renderResultado();
}

function placarPerf(texto, fracao) {
  elPlacar.textContent = texto;
  elBarra.style.width = `${Math.round(fracao * 100)}%`;
}

function renderEscolha() {
  placarPerf("Performance", 0);
  perfEls.opcoes.innerHTML = "";
  for (const nome of CONTINENTES) {
    const ligado = perf.continentes.includes(nome);
    const total = PAISES.filter((p) => p.r === nome).length;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "opcao";
    b.textContent = `${ligado ? "✓ " : ""}${nome} (${total})`;
    b.setAttribute("aria-pressed", String(ligado));
    b.addEventListener("click", () => {
      perf.continentes = ligado
        ? perf.continentes.filter((c) => c !== nome)
        : [...perf.continentes, nome];
      salvarPerf();
      renderEscolha();
    });
    perfEls.opcoes.appendChild(b);
  }
  const total = PAISES.filter((p) => perf.continentes.includes(p.r)).length;
  perfEls.comecar.disabled = total === 0;
  perfEls.comecar.textContent = total ? `Começar teste (${total} bandeiras)` : "Escolha pelo menos um continente";
}

function renderBandeira() {
  const pais = porCodigo(perf.ordem[perf.i]);
  const total = perf.ordem.length;
  perfEls.etiqueta.textContent = perf.rodada === 1
    ? `Rodada 1 · Teste · bandeira ${perf.i + 1} de ${total}`
    : `Rodada ${perf.rodada} · Treino · bandeira ${perf.i + 1} de ${total}`;
  placarPerf(`${perf.i} / ${total}`, perf.i / total);
  perfEls.bandeira.src = urlBandeira(pais);
  perfEls.moldura.classList.remove("certo", "errado", "tremer");
  perfEls.resposta.value = "";
  perfEls.resposta.disabled = false;
  perfEls.ok.textContent = "OK";
  perfEls.naoSei.hidden = false;
  perfEls.retorno.innerHTML = "&nbsp;";
  perfEls.retorno.className = "retorno";
}

function renderResultado() {
  const ultima = perf.historico[perf.historico.length - 1];
  const total = ultima.total;
  placarPerf(`${ultima.certos} / ${total}`, ultima.certos / total);

  if (perf.rodada === 1) {
    const sabe = ultima.certos;
    const falta = perf.treino.length;
    perfEls.titulo.textContent = falta === 0 ? "🎉 Você acertou todas!" : `Você já sabe ${sabe} de ${total}`;
    perfEls.texto.textContent = falta === 0
      ? `Você sabe todas as ${total} bandeiras que escolheu. Não tem nada para treinar.`
      : `Agora o treino vai ter só as ${falta} bandeiras que você errou. Elas vão se repetir em todas as rodadas até você aprender.`;
  } else {
    const todas = ultima.certos === total;
    perfEls.titulo.textContent = todas ? `🎉 Rodada ${perf.rodada}: acertou todas!` : `Rodada ${perf.rodada}: ${ultima.certos} de ${total}`;
    perfEls.texto.textContent = todas
      ? "Você aprendeu todas as bandeiras do treino. Pode treinar de novo para fixar ou começar um novo teste."
      : "As mesmas bandeiras voltam na próxima rodada. Olhe as que você errou antes de continuar.";
  }

  perfEls.historico.innerHTML = "";
  for (const h of perf.historico) {
    const li = document.createElement("li");
    li.textContent = `Rodada ${h.rodada}${h.rodada === 1 ? " (teste)" : ""}: ${h.certos} de ${h.total}`;
    perfEls.historico.appendChild(li);
  }

  perfEls.erradas.innerHTML = "";
  perfEls.erradasTitulo.hidden = perf.errados.length === 0;
  for (const c of perf.errados) {
    const pais = porCodigo(c);
    const div = document.createElement("div");
    div.className = "item estudo";
    const img = document.createElement("img");
    img.src = urlBandeira(pais);
    img.alt = `Bandeira de ${pais.n}`;
    img.loading = "lazy";
    const nome = document.createElement("span");
    nome.textContent = pais.n;
    div.append(img, nome);
    perfEls.erradas.appendChild(div);
  }

  const temTreino = perf.treino && perf.treino.length > 0;
  perfEls.proxima.hidden = !temTreino;
  perfEls.proxima.textContent = `Começar rodada ${perf.rodada + 1} (${perf.treino ? perf.treino.length : 0} bandeiras)`;
  perfEls.novo.classList.remove("confirmar");
  perfEls.novo.textContent = "Novo teste";
}

// ---------- Ações ----------

function comecarRodada(codigos, numero) {
  perf.rodada = numero;
  perf.ordem = embaralhar(codigos);
  perf.i = 0;
  perf.certos = [];
  perf.errados = [];
  perf.fase = "rodada";
  salvarPerf();
  renderPerformance();
  perfEls.resposta.focus();
}

function comecarTeste() {
  const codigos = PAISES.filter((p) => perf.continentes.includes(p.r)).map((p) => p.c);
  if (!codigos.length) return;
  perf.historico = [];
  perf.treino = null;
  comecarRodada(codigos, 1);
}

// Registra a resposta da bandeira atual e já avança no estado salvo
function registrar(certo) {
  const codigo = perf.ordem[perf.i];
  (certo ? perf.certos : perf.errados).push(codigo);
  perf.i++;
  if (perf.i >= perf.ordem.length) {
    perf.historico.push({ rodada: perf.rodada, certos: perf.certos.length, total: perf.ordem.length });
    if (perf.rodada === 1) perf.treino = [...perf.errados];
    perf.fase = "resultado";
  }
  salvarPerf();
}

function seguir() {
  renderPerformance();
  if (perf.fase === "rodada") perfEls.resposta.focus();
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

function mostrarErro(pais, digitado) {
  perfEls.moldura.classList.add("errado", "tremer");
  perfEls.retorno.className = "retorno errado";
  perfEls.retorno.textContent = digitado
    ? `❌ Era ${pais.n}. Você digitou ${digitado}.`
    : `❌ Era ${pais.n}.`;
  perfEls.resposta.disabled = true;
  perfEls.naoSei.hidden = true;
  perfEls.ok.textContent = "Próxima →";
  perfEls.ok.focus();
}

function responderPerf() {
  if (perfAguardando) {
    // Depois de um erro, OK/Enter passa para a próxima
    if (perfEls.ok.textContent.startsWith("Próxima")) seguir();
    return;
  }
  const pais = porCodigo(perf.ordem[perf.i]);
  const resultado = corrigir(perfEls.resposta.value, pais, PAISES);
  if (!resultado) return;

  perfAguardando = true;
  perfEls.moldura.classList.remove("certo", "errado", "tremer");
  void perfEls.moldura.offsetWidth;
  registrar(resultado.certo);

  if (resultado.certo) {
    perfEls.moldura.classList.add("certo");
    perfEls.retorno.className = "retorno certo";
    perfEls.retorno.textContent = `✅ Certo! ${pais.n}`;
    perfTimer = setTimeout(seguir, 700);
  } else {
    mostrarErro(pais, resultado.parecido ? resultado.parecido.n : "");
  }
}

function naoSei() {
  if (perfAguardando) return;
  const pais = porCodigo(perf.ordem[perf.i]);
  perfAguardando = true;
  registrar(false);
  mostrarErro(pais, "");
}

// "Novo teste" pede um segundo toque, porque apaga o treino atual
let perfConfirmar = null;
function novoTeste() {
  if (!perfEls.novo.classList.contains("confirmar")) {
    perfEls.novo.classList.add("confirmar");
    perfEls.novo.textContent = "Toque de novo para apagar o treino";
    perfConfirmar = setTimeout(() => {
      perfEls.novo.classList.remove("confirmar");
      perfEls.novo.textContent = "Novo teste";
    }, 4000);
    return;
  }
  clearTimeout(perfConfirmar);
  perf = { ...perfInicial(), continentes: perf.continentes };
  salvarPerf();
  renderPerformance();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

perfEls.comecar.addEventListener("click", comecarTeste);
perfEls.form.addEventListener("submit", (e) => {
  e.preventDefault();
  responderPerf();
});
perfEls.naoSei.addEventListener("click", naoSei);
perfEls.proxima.addEventListener("click", () => comecarRodada(perf.treino, perf.rodada + 1));
perfEls.novo.addEventListener("click", novoTeste);
