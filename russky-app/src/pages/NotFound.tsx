import { Compass } from "lucide-react";
import { Empty } from "../components/ui";

export function NotFound() {
  return (
    <div className="page narrow">
      <Empty icon={<Compass size={40} />} title="Página não encontrada">
        <a className="btn primary" href="#/" style={{ marginTop: 12 }}>
          Ir para o início
        </a>
      </Empty>
    </div>
  );
}
