import { useEffect, useState } from "react";

/**
 * A custom React hook that animates text by revealing it character by character.
 *
 * @param full - The complete text string to be animated
 * @param speed - The delay in milliseconds between each character reveal (default: 38ms)
 *
 * @returns An object containing:
 *   - text: The currently animated text string
 *   - done: A boolean indicating whether the animation is complete
 *
 * @example
 * ```tsx
 * const { text, done } = useTypewriter("Hello World", 50);
 * return <div>{text}{!done && <span>|</span>}</div>;
 * ```
 */
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
