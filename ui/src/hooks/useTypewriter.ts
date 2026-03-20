import { useEffect, useState } from "react";

export function useTypewriter(full: string, speed = 38) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setText("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [full, speed]);
  return { text, done };
}
