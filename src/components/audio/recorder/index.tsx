import { component$,  useTask$ } from "@builder.io/qwik";
import { useMediaRecorder } from "../hooks/useMediaRecorder";
import { DynamicIcon } from "../dynamic/DynamicIcon";
import { Btn } from "~/components/ds";
// import { useSound } from "../hooks/useSound";
// import { MediaButton } from "../button";

export const Recorder = component$(() => {
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    // getPreview,
    statusRecording,
    clearRecording,
    audioBlob,
    // formattedDuration,
    audioUrl,
    transcript,
    analyser,
  } = useMediaRecorder({ transcipt: { enable: true }, enableAnalyser: true });

  // const { play, isPlaying, stop, load } = useSound(audioUrl.value);

  useTask$(({ track }) => {
    const blob = track(() => audioBlob.value);

    console.log("audioBlob :>> ", blob);
  });

  useTask$(({ track }) => {
    const text = track(() => transcript.value);

    console.log("text :>> ", text);
  });

  // const preview = $(async () => {
  //   if (isPlaying.value) {
  //     stop();
  //     return;
  //   }
  //   const blob = await getPreview();
  //   const url = URL.createObjectURL(blob);
  //   load(url);
  //   play();
  // });

  return (
    <>
       <div class="flex flex-wrap justify-center gap-4">
       {analyser && <DynamicIcon analyser={analyser} />}


      {statusRecording.value === "ready" ? (
        <Btn size="sm" variant="ghost" class="border-none rounded-2xl bg-transparent" onClick$={startRecording}><div class="text-xl text-info-700  i-tabler-microphone-filled"/></Btn>
      ) : statusRecording.value === "paused" ? (
        <Btn size="sm" variant="ghost" class="border-none rounded-2xl bg-transparent" onClick$={resumeRecording}><div class="text-xl text-info-600 i-tabler-player-stop-filled"/></Btn>
      ) : (
        <Btn size="sm" variant="ghost" class="border-none rounded-2xl bg-transparent" onClick$={pauseRecording}><div class="text-xl text-info-600 i-tabler-player-pause-filled"/></Btn>
      )}

      {/* <div>
        {formattedDuration.value}{" "}
        <button disabled={statusRecording.value !== "paused"} onClick$={preview}>
          {isPlaying.value ? "Pause" : <div class="i-tabler-player-pause-filled"/>}
        </button>
      </div> */}

      {statusRecording.value === "ready" && audioUrl.value ? (
        <Btn size="sm" variant="secondary" onClick$={clearRecording}>Reset</Btn>
      ) : (
        <Btn size="sm" variant="ghost" class="border-none rounded-2xl bg-transparent" onClick$={stopRecording} disabled={statusRecording.value === "ready"}>
          <div class="text-xl text-info-700 i-tabler-player-stop-filled"/>
        </Btn>
      )}
    </div>
    
    <div>
      {transcript.value}
      {/* <MediaButton
        status={statusRecording}
        analyser={analyser}
        onStart={startRecording}
        onStop={stopRecording}
        formattedDuration={formattedDuration}
      /> */}
    </div>
    </>

  );
});
