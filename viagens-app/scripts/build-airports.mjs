// Gera frontend/src/data/airports.json a partir da base pública OurAirports (domínio público).
// Uso: node scripts/build-airports.mjs caminho/airports.csv
// Fonte: https://github.com/davidmegginson/ourairports-data
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = process.argv[2];
if (!file) {
  console.error("Informe o caminho do airports.csv");
  process.exit(1);
}

/** Lê uma linha CSV com aspas. */
function parseLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

const lines = readFileSync(file, "utf8").split(/\r?\n/);
const head = parseLine(lines[0]);
const col = (n) => head.indexOf(n);
const I = { type: col("type"), name: col("name"), lat: col("latitude_deg"), lon: col("longitude_deg"), country: col("iso_country"), city: col("municipality"), sched: col("scheduled_service"), iata: col("iata_code"), kw: col("keywords") };
const out = [];
for (const line of lines.slice(1)) {
  if (!line) continue;
  const r = parseLine(line);
  const iata = r[I.iata];
  if (!/^[A-Z]{3}$/.test(iata)) continue;
  if (r[I.sched] !== "yes") continue;
  if (r[I.type] !== "large_airport" && r[I.type] !== "medium_airport") continue;
  // [código, nome, cidade, país, lat, lon, grande(1)/médio(0), palavras-chave]
  out.push([iata, r[I.name], r[I.city], r[I.country], Math.round(Number(r[I.lat]) * 1e4) / 1e4, Math.round(Number(r[I.lon]) * 1e4) / 1e4, r[I.type] === "large_airport" ? 1 : 0, r[I.kw] || ""]);
}
out.sort((a, b) => b[6] - a[6] || a[0].localeCompare(b[0]));
const target = join(dirname(fileURLToPath(import.meta.url)), "../frontend/src/data/airports.json");
writeFileSync(target, JSON.stringify(out));
console.log(`${out.length} aeroportos gravados em ${target}`);
