import { useEffect, useRef } from "react";
import popSound from "../assets/sharp-pop.mp3";

export function usePopEffect(value, volume = 1.0, delay = 200) {
  const prevValue = useRef(value);
  const timeout = useRef(null);

  useEffect(() => {
    if (prevValue.current === value) return;
    prevValue.current = value;

    if (timeout.current) clearTimeout(timeout.current);

    timeout.current = setTimeout(() => {
      const audio = new Audio(popSound);
      audio.volume = volume;
      audio.play();
    }, delay);

    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [value, volume, delay]);
}
