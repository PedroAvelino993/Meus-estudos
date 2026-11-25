// Escolher em qual viagem salvar um voo, hotel ou lugar (ou criar uma nova).

import { useState } from "react";
import type { Trip } from "../types";
import { listTrips, newTrip, saveTrip } from "../database/trips";
import { Modal, toast } from "./ui";

export function SaveToTrip({ title, suggestedName, onPick, onClose }: { title: string; suggestedName?: string; onPick: (t: Trip) => Trip | void; onClose: () => void }) {
  const trips = listTrips();
  const [name, setName] = useState(suggestedName ?? "");
  const done = (t: Trip) => {
    onPick(t);
    toast(`Salvo em «${t.name}».`);
    onClose();
  };
  return (
    <Modal title={title} onClose={onClose}>
      <div className="stack">
        {trips.length > 0 && (
          <div className="stack tight">
            <div className="small muted">Escolha a viagem:</div>
            {trips.map((t) => (
              <button key={t.id} className="btn" style={{ justifyContent: "space-between" }} onClick={() => done(t)}>
                <span className="ellipsis">{t.name}</span>
                <span className="tiny muted">{t.startDate ? new Date(t.startDate + "T12:00").toLocaleDateString("pt-BR") : ""}</span>
              </button>
            ))}
          </div>
        )}
        <form
          className="stack tight"
          onSubmit={(e) => {
            e.preventDefault();
            done(saveTrip(newTrip({ name: name.trim() || "Nova viagem" })));
          }}
        >
          <div className="small muted">{trips.length ? "Ou crie uma nova:" : "Crie sua primeira viagem:"}</div>
          <div className="row">
            <input className="input grow" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da viagem (ex.: Férias em Paris)" aria-label="Nome da nova viagem" />
            <button className="btn primary">Criar e salvar</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
