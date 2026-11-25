// Lê dados do armazenamento local e atualiza a tela quando eles mudam.

import { useEffect, useState } from "react";
import { subscribe } from "../database/store";

export function useStore<T>(getter: () => T): T {
  const [value, setValue] = useState(getter);
  useEffect(() => subscribe(() => setValue(getter())), []); // eslint-disable-line react-hooks/exhaustive-deps
  return value;
}
