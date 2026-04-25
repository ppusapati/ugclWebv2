import { type QRL, component$, type NoSerialize, type Signal } from "@builder.io/qwik";
import { type RecordingStatus } from "../hooks/useMediaRecorder";
import { DynamicIcon } from "../dynamic/DynamicIcon";
import { Btn } from '~/components/ds';

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
          <Btn key="ready" size="sm" variant="primary" onClick$={onStart}>
            Record
          </Btn>
        );
      case "recording":
        return (
          <Btn key="recording" size="sm" variant="danger" onClick$={onStop}>
            Recording {formattedDuration.value}
            {analyser && <DynamicIcon analyser={analyser} />}
            Stop
          </Btn>
        );
      case "stopped":
        return (
          <Btn key="stopped" size="sm" variant="secondary" onClick$={onStart}>
            Record again
          </Btn>
        );
      default:
        return <Btn key="denied" size="sm" variant="ghost">Access denied for microphone</Btn>;
    }
  }
);
