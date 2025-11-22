import { type QRL, component$, type NoSerialize, type Signal } from "@builder.io/qwik";
import { type RecordingStatus } from "../hooks/useMediaRecorder";
import { DynamicIcon } from "../dynamic/DynamicIcon";

export type MediaButtonProps = {
  status: Signal<RecordingStatus>;
  onStart: QRL<() => void>;
  onStop: QRL<() => void>;
  analyser: Signal<NoSerialize<AnalyserNode> | null>;
  formattedDuration: Readonly<Signal<string>>;
};

export const MediaButton = component$<MediaButtonProps>(
  ({ status, onStart, onStop, analyser, formattedDuration }) => {
    switch (status.value) {
      case "ready":
        return (
          <button key="ready" onClick$={onStart}>
            Record
          </button>
        );
      case "recording":
        return (
          <button key="recording" onClick$={onStop}>
            Recording {formattedDuration.value}
            {analyser && <DynamicIcon analyser={analyser} />}
            Stop
          </button>
        );
      case "stopped":
        return (
          <button key="stopped" onClick$={onStart}>
            Record again
          </button>
        );
      default:
        return <button key="denied">Access denied for microphone</button>;
    }
  }
);
