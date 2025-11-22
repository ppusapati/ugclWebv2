import { component$ } from "@builder.io/qwik";
import { useSound } from "../hooks/useSound";

type AudioFile ={
    filePath:string
}

export const Player = component$(({filePath }: AudioFile) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { play, stop, isPlaying, time, undo, redo, seek, duration } = useSound(filePath);

  return (
    <button onClick$={play}>Play</button>
  );
});
