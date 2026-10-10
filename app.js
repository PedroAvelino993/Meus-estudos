// Meus Estudos: lista de matérias → cada uma com Resumo, Quiz e Flashcards.
// O conteúdo vem de conteudo.js (variável MATERIAS).

const app = document.getElementById("app");
const titulo = document.getElementById("titulo");
const subtitulo = document.getElementById("subtitulo");
const voltar = document.getElementById("voltar");

// ---------- Progresso salvo no navegador ----------

const CHAVE = "meus-estudos-progresso";

function lerProgresso() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || {};
  } catch {
    return {};
  }
}

function salvarProgresso(idMateria, acertos, total) {
  const progresso = lerProgresso();
  const anterior = progresso[idMateria];
  // Guarda a melhor nota de cada matéria
  if (!anterior || acertos / total >= anterior.acertos / anterior.total) {
    progresso[idMateria] = { acertos, total };
  }
  try {
    localStorage.setItem(CHAVE, JSON.stringify(progresso));
  } catch {
    // Sem armazenamento (ex: aba anônima): o app funciona sem salvar
  }
}

// ---------- Utilidades ----------

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// ---------- Tela inicial: lista de matérias ----------

function telaInicial() {
  titulo.textContent = "📚 Meus Estudos";
  subtitulo.textContent = "8º ano · AP3 – 3º trimestre";
  voltar.hidden = true;
  app.innerHTML = "";

  const progresso = lerProgresso();

  MATERIAS.forEach((materia) => {
    const botao = el("button", "cartao materia");
    botao.appendChild(el("span", "icone", materia.icone || "📘"));

    const info = el("div", "info");
    info.appendChild(el("strong", "", materia.nome));
    const p = progresso[materia.id];
    const detalhe = p
      ? `${materia.prova || ""} · melhor nota: ${p.acertos}/${p.total}`
      : `${materia.prova || ""} · quiz ainda não feito`;
    info.appendChild(el("small", "", detalhe));

    const barra = el("div", "barra");
    const preenchido = el("span");
    preenchido.style.width = p ? `${Math.round((p.acertos / p.total) * 100)}%` : "0%";
    barra.appendChild(preenchido);
    info.appendChild(barra);

    botao.appendChild(info);
    botao.addEventListener("click", () => telaMateria(materia, "resumo"));
    app.appendChild(botao);
  });
}

// ---------- Tela da matéria com abas ----------

function telaMateria(materia, aba) {
  titulo.textContent = `${materia.icone || "📘"} ${materia.nome}`;
  subtitulo.textContent = materia.prova || "";
  voltar.hidden = false;
  app.innerHTML = "";

  const abas = el("div", "abas");
  [
    ["resumo", "📝 Resumo"],
    ["quiz", "❓ Quiz"],
    ["flashcards", "🃏 Flashcards"],
  ].forEach(([id, nome]) => {
    const b = el("button", id === aba ? "ativa" : "", nome);
    b.addEventListener("click", () => telaMateria(materia, id));
    abas.appendChild(b);
  });
  app.appendChild(abas);

  const area = el("div");
  app.appendChild(area);

  if (aba === "resumo") mostrarResumo(materia, area);
  if (aba === "quiz") iniciarQuiz(materia, area);
  if (aba === "flashcards") iniciarFlashcards(materia, area);
}

// ---------- Resumo ----------

function mostrarResumo(materia, area) {
  if (!materia.resumos?.length) {
    area.appendChild(el("p", "cartao vazio", "Sem resumos ainda."));
    return;
  }
  materia.resumos.forEach((r) => {
    const c = el("div", "cartao");
    c.appendChild(el("h3", "", r.titulo));
    c.appendChild(el("p", "", r.texto));
    if (r.pontos?.length) {
      const ul = el("ul");
      r.pontos.forEach((ponto) => ul.appendChild(el("li", "", ponto)));
      c.appendChild(ul);
    }
    area.appendChild(c);
  });
}

// ---------- Quiz ----------

function iniciarQuiz(materia, area) {
  if (!materia.quiz?.length) {
    area.appendChild(el("p", "cartao vazio", "Sem perguntas ainda."));
    return;
  }

  const perguntas = embaralhar(materia.quiz);
  let atual = 0;
  let acertos = 0;

  function mostrarPergunta() {
    area.innerHTML = "";
    const q = perguntas[atual];
    const c = el("div", "cartao");
    c.appendChild(el("p", "contador", `Pergunta ${atual + 1} de ${perguntas.length} · acertos: ${acertos}`));
    c.appendChild(el("p", "pergunta", q.pergunta));

    // Embaralha as alternativas, lembrando qual é a certa
    const opcoes = embaralhar(q.alternativas.map((texto, i) => ({ texto, certa: i === q.correta })));
    const botoes = [];

    opcoes.forEach((opcao) => {
      const b = el("button", "alternativa", opcao.texto);
      b.addEventListener("click", () => {
        if (opcao.certa) acertos++;
        botoes.forEach((outro, i) => {
          outro.disabled = true;
          if (opcoes[i].certa) outro.classList.add("certa");
        });
        if (!opcao.certa) b.classList.add("errada");

        const exp = el("div", "explicacao");
        exp.textContent = (opcao.certa ? "✅ Certo! " : "❌ Errado. ") + (q.explicacao || "");
        c.appendChild(exp);

        const ultima = atual === perguntas.length - 1;
        const prox = el("button", "botao", ultima ? "Ver resultado" : "Próxima →");
        prox.addEventListener("click", () => {
          atual++;
          ultima ? mostrarResultado() : mostrarPergunta();
        });
        c.appendChild(prox);
      });
      botoes.push(b);
      c.appendChild(b);
    });

    area.appendChild(c);
  }

  function mostrarResultado() {
    salvarProgresso(materia.id, acertos, perguntas.length);
    area.innerHTML = "";
    const c = el("div", "cartao resultado");
    const pct = Math.round((acertos / perguntas.length) * 100);
    c.appendChild(el("p", "nota", `${acertos}/${perguntas.length}`));
    const msg =
      pct >= 80 ? "Mandou bem! 🎉" : pct >= 50 ? "Quase lá! Revise o resumo e tente de novo. 💪" : "Volte ao resumo e tente outra vez. 📖";
    c.appendChild(el("p", "", msg));

    const refazer = el("button", "botao", "Refazer quiz");
    refazer.addEventListener("click", () => telaMateria(materia, "quiz"));
    const resumo = el("button", "botao secundario", "Ver resumo");
    resumo.addEventListener("click", () => telaMateria(materia, "resumo"));
    c.append(refazer, resumo);
    area.appendChild(c);
  }

  mostrarPergunta();
}

// ---------- Flashcards ----------

function iniciarFlashcards(materia, area) {
  if (!materia.flashcards?.length) {
    area.appendChild(el("p", "cartao vazio", "Sem flashcards ainda."));
    return;
  }

  const cartas = embaralhar(materia.flashcards);
  let atual = 0;
  let virado = false;

  function mostrar() {
    area.innerHTML = "";
    const carta = cartas[atual];
    area.appendChild(el("p", "contador", `Cartão ${atual + 1} de ${cartas.length}`));

    const c = el("div", "cartao flashcard" + (virado ? " virado" : ""));
    c.appendChild(el("div", "", virado ? carta.verso : carta.frente));
    c.appendChild(el("small", "", virado ? "toque para ver a pergunta" : "toque para ver a resposta"));
    c.addEventListener("click", () => {
      virado = !virado;
      mostrar();
    });
    area.appendChild(c);

    const nav = el("div", "navegacao");
    const ant = el("button", "botao secundario", "← Anterior");
    const prox = el("button", "botao", "Próximo →");
    ant.disabled = atual === 0;
    ant.addEventListener("click", () => {
      atual--;
      virado = false;
      mostrar();
    });
    prox.addEventListener("click", () => {
      atual = (atual + 1) % cartas.length;
      virado = false;
      mostrar();
    });
    nav.append(ant, prox);
    area.appendChild(nav);
  }

  mostrar();
}

voltar.addEventListener("click", telaInicial);
telaInicial();
