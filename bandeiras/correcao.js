// Decide se o nome digitado é o país da bandeira.
// Aceita pequenos erros de digitação, mas só se o texto estiver mais perto
// do país certo do que de qualquer outro país.

// "Costa do Marfim!" → "costadomarfim" (sem acentos, espaços ou símbolos)
function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Quantas letras é preciso trocar, tirar ou pôr para ir de a até b
function distancia(a, b) {
  const linha = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const guardado = linha[j];
      linha[j] = Math.min(
        linha[j] + 1,
        linha[j - 1] + 1,
        anterior + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      anterior = guardado;
    }
  }
  return linha[b.length];
}

// Erros permitidos conforme o tamanho do nome
function tolerancia(tamanho) {
  if (tamanho <= 4) return 0;
  if (tamanho <= 7) return 1;
  if (tamanho <= 12) return 2;
  return 3;
}

function nomesDe(pais) {
  return [pais.n, ...pais.a].map(normalizar);
}

// Menor distância entre o texto e qualquer nome do país
function maisPerto(texto, pais) {
  let melhor = { dist: Infinity, nome: "" };
  for (const nome of nomesDe(pais)) {
    const dist = distancia(texto, nome);
    if (dist < melhor.dist) melhor = { dist, nome };
  }
  return melhor;
}

// Resultado: { certo: true } ou { certo: false, parecido: país ou null }
function corrigir(digitado, alvo, paises) {
  const texto = normalizar(digitado);
  if (!texto) return null;

  const doAlvo = maisPerto(texto, alvo);
  let outro = null;
  let distOutro = Infinity;
  for (const pais of paises) {
    if (pais === alvo) continue;
    const p = maisPerto(texto, pais);
    if (p.dist < distOutro) {
      distOutro = p.dist;
      outro = { pais, ...p };
    }
  }

  const dentroDoLimite = doAlvo.dist <= tolerancia(doAlvo.nome.length);
  if (dentroDoLimite && doAlvo.dist < distOutro) return { certo: true };

  // Errado: diz qual país foi digitado, se for reconhecível
  const reconheceuOutro = outro && outro.dist <= tolerancia(outro.nome.length) && outro.dist < doAlvo.dist;
  return { certo: false, parecido: reconheceuOutro ? outro.pais : null };
}

if (typeof module !== "undefined") module.exports = { corrigir, normalizar, distancia, tolerancia };
