// Estudos III Etapa: matérias → tópicos para estudar (resumos aprofundados), quiz e flashcards.
// O conteúdo fica em conteudo/*.js, cada arquivo acrescenta uma matéria em MATERIAS.

const app = document.getElementById("app");
const titulo = document.getElementById("titulo");
const subtitulo = document.getElementById("subtitulo");
const voltar = document.getElementById("voltar");

// ---------- Progresso salvo no aparelho ----------

const CHAVE = "estudos-iii-etapa";
let progresso = { lidos: {}, quiz: {} };
try {
  const salvo = JSON.parse(localStorage.getItem(CHAVE));
  if (salvo) progresso = { lidos: salvo.lidos || {}, quiz: salvo.quiz || {} };
} catch {}

function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(progresso)); } catch {}
}

const chaveTopico = (m, i) => `${m.id}:${i}`;

// ---------- Utilidades ----------

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function escapar(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Texto com **negrito** e *itálico*
function rico(t) {
  return escapar(t)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
}

function embaralhar(lista) {
  const c = [...lista];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function cabecalho(t, s, comVoltar, aoVoltar) {
  titulo.textContent = t;
  subtitulo.textContent = s;
  voltar.hidden = !comVoltar;
  voltar.onclick = aoVoltar || null;
  window.scrollTo(0, 0);
}

function selos(av) {
  return av.split(/[^A-Z0-9]+/).filter(Boolean).map((a) => `<span class="selo ${a}">${a}</span>`).join("");
}

// ---------- Tela inicial ----------

function telaInicial() {
  cabecalho("📘 III Etapa", "8º ano · Roteiro de estudos", false);
  app.innerHTML = "";
  app.appendChild(el("p", "intro", "Escolha a matéria. Cada tópico é um resumo completo para estudar com calma, com exemplos, exercícios resolvidos e revisão no final."));

  for (const m of MATERIAS) {
    const total = m.topicos.length;
    const lidos = m.topicos.filter((_, i) => progresso.lidos[chaveTopico(m, i)]).length;
    const melhor = progresso.quiz[m.id];
    const b = el("button", "cartao materia");
    b.innerHTML = `<span class="icone">${m.icone}</span>
      <span class="info"><strong></strong><small></small><span class="barra"><span style="width:${total ? (lidos / total) * 100 : 0}%"></span></span></span>`;
    b.querySelector("strong").textContent = m.nome;
    b.querySelector("small").textContent = `${lidos} de ${total} tópicos estudados${melhor ? ` · quiz: ${melhor.acertos}/${melhor.total}` : ""}`;
    b.addEventListener("click", () => telaMateria(m, "estudar"));
    app.appendChild(b);
  }
}

// ---------- Matéria ----------

let filtroAv = "Tudo";

function telaMateria(m, aba) {
  cabecalho(`${m.icone} ${m.nome}`, m.prova, true, telaInicial);
  app.innerHTML = "";
  const abas = el("div", "abas");
  for (const [id, nome] of [["estudar", "📖 Estudar"], ["quiz", "❓ Quiz"], ["flash", "🃏 Flashcards"]]) {
    const b = el("button", id === aba ? "ativa" : "", nome);
    b.addEventListener("click", () => telaMateria(m, id));
    abas.appendChild(b);
  }
  app.appendChild(abas);
  const area = el("div");
  app.appendChild(area);
  if (aba === "estudar") listaTopicos(m, area);
  if (aba === "quiz") quiz(m, area);
  if (aba === "flash") flashcards(m, area);
}

function listaTopicos(m, area) {
  // Filtro por prova
  const temAv = m.topicos.some((t) => t.av);
  if (temAv) {
    const f = el("div", "filtros");
    for (const nome of ["Tudo", "AV2", "AV3"]) {
      const b = el("button", "", nome);
      b.setAttribute("aria-pressed", String(filtroAv === nome));
      b.addEventListener("click", () => { filtroAv = nome; telaMateria(m, "estudar"); });
      f.appendChild(b);
    }
    area.appendChild(f);
  }
  if (m.aviso) {
    const a = el("div", "caixa atencao");
    a.innerHTML = `<b class="rotulo">Atenção</b>${rico(m.aviso)}`;
    area.appendChild(a);
  }
  m.topicos.forEach((t, i) => {
    if (filtroAv !== "Tudo" && !(t.av || "").includes(filtroAv)) return;
    const lido = progresso.lidos[chaveTopico(m, i)];
    const b = el("button", "cartao topico" + (lido ? " lido" : ""));
    b.innerHTML = `<span class="check">${lido ? "✓" : ""}</span><span class="t-info">${t.av ? selos(t.av) : ""}<strong></strong><small></small></span>`;
    b.querySelector("strong").textContent = t.titulo;
    b.querySelector("small").textContent = `${t.secoes.length} partes · cerca de ${tempoLeitura(t)} min de estudo`;
    b.addEventListener("click", () => telaTopico(m, i));
    area.appendChild(b);
  });
}

function tempoLeitura(t) {
  const texto = JSON.stringify(t);
  return Math.max(3, Math.round(texto.split(/\s+/).length / 160));
}

// ---------- Leitura de um tópico ----------

function telaTopico(m, i) {
  const t = m.topicos[i];
  cabecalho(`${m.icone} ${m.nome}`, t.titulo, true, () => telaMateria(m, "estudar"));
  app.innerHTML = "";
  const c = el("article", "cartao leitura");
  let html = `${t.av ? selos(t.av) : ""}<h2>${rico(t.titulo)}</h2><p class="tempo">⏱️ Cerca de ${tempoLeitura(t)} minutos de estudo</p>`;
  if (t.intro) html += `<p>${rico(t.intro)}</p>`;
  for (const s of t.secoes) html += secaoHtml(s);
  if (t.revisao && t.revisao.length) {
    html += `<div class="revisao"><h3>📝 Revisão rápida</h3><ul>${t.revisao.map((r) => `<li>${rico(r)}</li>`).join("")}</ul></div>`;
  }
  c.innerHTML = html;
  app.appendChild(c);

  const chave = chaveTopico(m, i);
  const marcar = el("button", "botao" + (progresso.lidos[chave] ? " feito" : ""), progresso.lidos[chave] ? "✓ Estudado" : "Marcar como estudado");
  marcar.addEventListener("click", () => {
    progresso.lidos[chave] = !progresso.lidos[chave];
    salvar();
    telaTopico(m, i);
  });
  app.appendChild(marcar);

  const nav = el("div", "navegacao");
  if (i > 0) {
    const ant = el("button", "botao secundario", "← Anterior");
    ant.addEventListener("click", () => telaTopico(m, i - 1));
    nav.appendChild(ant);
  }
  if (i < m.topicos.length - 1) {
    const prox = el("button", "botao secundario", "Próximo →");
    prox.addEventListener("click", () => telaTopico(m, i + 1));
    nav.appendChild(prox);
  }
  app.appendChild(nav);
}

function secaoHtml(s) {
  let h = "";
  if (s.h) h += `<h3>${rico(s.h)}</h3>`;
  for (const p of s.p || []) h += `<p>${rico(p)}</p>`;
  if (s.lista) h += `<ul>${s.lista.map((x) => `<li>${rico(x)}</li>`).join("")}</ul>`;
  if (s.tabela) {
    h += `<div class="tabela-rolagem"><table><thead><tr>${s.tabela.cab.map((c) => `<th>${rico(c)}</th>`).join("")}</tr></thead><tbody>`;
    h += s.tabela.linhas.map((l) => `<tr>${l.map((c) => `<td>${rico(c)}</td>`).join("")}</tr>`).join("");
    h += "</tbody></table></div>";
  }
  for (const ex of [].concat(s.exemplo || [])) {
    h += `<div class="caixa exemplo"><b class="rotulo">${escapar(ex.titulo || "Exemplo")}</b>${rico(ex.texto)}</div>`;
  }
  for (const ex of [].concat(s.exercicio || [])) {
    h += `<div class="caixa exercicio"><b class="rotulo">Exercício resolvido</b>${rico(ex.enunciado)}
      <ol>${ex.passos.map((p) => `<li>${rico(p)}</li>`).join("")}</ol>
      <p class="resposta">${rico(ex.resposta)}</p></div>`;
  }
  if (s.atencao) h += `<div class="caixa atencao"><b class="rotulo">⚠️ Atenção</b>${rico(s.atencao)}</div>`;
  return h;
}

// ---------- Quiz ----------

function quiz(m, area) {
  if (!m.quiz.length) { area.appendChild(el("p", "cartao vazio", "Sem perguntas ainda.")); return; }
  const perguntas = embaralhar(m.quiz);
  let atual = 0, acertos = 0;

  function mostrar() {
    area.innerHTML = "";
    const q = perguntas[atual];
    const c = el("div", "cartao");
    c.appendChild(el("p", "contador", `Pergunta ${atual + 1} de ${perguntas.length} · acertos: ${acertos}`));
    const pg = el("p", "pergunta");
    pg.innerHTML = rico(q.pergunta);
    c.appendChild(pg);
    const opcoes = embaralhar(q.alternativas.map((texto, i) => ({ texto, certa: i === q.correta })));
    const botoes = [];
    for (const o of opcoes) {
      const b = el("button", "alternativa");
      b.innerHTML = rico(o.texto);
      b.addEventListener("click", () => {
        if (o.certa) acertos++;
        botoes.forEach((x, k) => { x.disabled = true; if (opcoes[k].certa) x.classList.add("certa"); });
        if (!o.certa) b.classList.add("errada");
        const ex = el("div", "explicacao");
        ex.innerHTML = (o.certa ? "✅ Certo! " : "❌ Errado. ") + rico(q.explicacao || "");
        c.appendChild(ex);
        const ultima = atual === perguntas.length - 1;
        const prox = el("button", "botao", ultima ? "Ver resultado" : "Próxima →");
        prox.addEventListener("click", () => { atual++; ultima ? fim() : mostrar(); });
        c.appendChild(prox);
      });
      botoes.push(b);
      c.appendChild(b);
    }
    area.appendChild(c);
  }

  function fim() {
    const ant = progresso.quiz[m.id];
    if (!ant || acertos / perguntas.length >= ant.acertos / ant.total) {
      progresso.quiz[m.id] = { acertos, total: perguntas.length };
      salvar();
    }
    area.innerHTML = "";
    const c = el("div", "cartao resultado");
    const pct = acertos / perguntas.length;
    c.appendChild(el("p", "nota", `${acertos}/${perguntas.length}`));
    c.appendChild(el("p", "", pct >= 0.8 ? "Excelente! 🎉" : pct >= 0.6 ? "Bom! Revise os tópicos em que errou. 💪" : "Volte aos resumos e tente de novo. 📖"));
    const de = el("button", "botao", "Refazer quiz");
    de.addEventListener("click", () => telaMateria(m, "quiz"));
    const es = el("button", "botao secundario", "Voltar a estudar");
    es.addEventListener("click", () => telaMateria(m, "estudar"));
    c.append(de, es);
    area.appendChild(c);
  }

  mostrar();
}

// ---------- Flashcards ----------

function flashcards(m, area) {
  if (!m.flashcards.length) { area.appendChild(el("p", "cartao vazio", "Sem flashcards ainda.")); return; }
  const cartas = embaralhar(m.flashcards);
  let atual = 0, virado = false;
  function mostrar() {
    area.innerHTML = "";
    area.appendChild(el("p", "contador", `Cartão ${atual + 1} de ${cartas.length}`));
    const k = cartas[atual];
    const c = el("div", "cartao flashcard" + (virado ? " virado" : ""));
    const t = el("div");
    t.innerHTML = rico(virado ? k.verso : k.frente);
    c.append(t, el("small", "", virado ? "toque para ver a pergunta" : "toque para ver a resposta"));
    c.addEventListener("click", () => { virado = !virado; mostrar(); });
    area.appendChild(c);
    const nav = el("div", "navegacao");
    const ant = el("button", "botao secundario", "← Anterior");
    ant.disabled = atual === 0;
    ant.addEventListener("click", () => { atual--; virado = false; mostrar(); });
    const prox = el("button", "botao", "Próximo →");
    prox.addEventListener("click", () => { atual = (atual + 1) % cartas.length; virado = false; mostrar(); });
    nav.append(ant, prox);
    area.appendChild(nav);
  }
  mostrar();
}

telaInicial();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js");
}
