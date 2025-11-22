import {useVisibleTask$, $, type QRL, type NoSerialize, noSerialize, useSignal, type Signal, useComputed$} from "@builder.io/qwik";

declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;

  onstart: () => void;

  onresult: (event: SpeechRecognitionEvent) => void;

  onend: () => void;

  // Other properties and methods you want to use
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export type RecordingStatus = "ready" | "recording" | "paused" | "stopped" | "denied";

type HookReturn = {
  startRecording: QRL<() => Promise<void>>;
  pauseRecording: QRL<() => void>;
  resumeRecording: QRL<() => void>;
  getPreview: QRL<() => Blob>;
  stopRecording: QRL<() => void>;
  statusRecording: Signal<RecordingStatus>;
  clearRecording: QRL<() => void>;
  duration: Signal<number>;
  formattedDuration: Readonly<Signal<string>>;
  analyser: Signal<NoSerialize<AnalyserNode> | null>
  audioBlob: Signal<NoSerialize<Blob> | null>;
  audioUrl: Signal<string>;
  transcript: Signal<string>;
  resetTranscript: QRL<() => void>;
};

type TranscriptOptions = {
  enable?: boolean;
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

type Options = {
  timeLimit?: number;
  enableAnalyser?: boolean;
  transcipt?: TranscriptOptions
};

type UnchangeStore = {
  mediaRecorder: NoSerialize<MediaRecorder> | null;
  mediaStream: NoSerialize<MediaStream> | null;
  audioContext: NoSerialize<AudioContext> | null;
  sourceNode: NoSerialize<MediaStreamAudioSourceNode> | null;
  recognizer: NoSerialize<SpeechRecognition> | null;
}

export const useMediaRecorder = (options?: Options): HookReturn => {

  const statusRecording = useSignal<RecordingStatus>("ready");
  const store = useSignal<UnchangeStore>({
    mediaRecorder: null,
    mediaStream: null,
    audioContext: null,
    sourceNode: null,
    recognizer: null,
  });
  const audioUrl = useSignal<string>("");
  const duration = useSignal<number>(0);
  const audioBlob = useSignal<NoSerialize<Blob> | null>(null);
  const transcript = useSignal<string>("");
  const analyserNode = useSignal<NoSerialize<AnalyserNode> | null>(null);
  const chunks = useSignal<NoSerialize<BlobPart>[]>([]);

  const formattedDuration = useComputed$(() => {
    const time = new Date();
    time.setHours(0, 0, 0, 0);
    time.setSeconds(time.getSeconds() + duration.value);
    return `${("0" + time.getMinutes()).slice(-2)}:${("0" + time.getSeconds()).slice(-2)}`;
  });

  const pauseRecording = $(() => {
    if (!store.value.mediaRecorder) return;
    console.log(`pauseRecording`);
    // Changing the status
    statusRecording.value = "paused";
    // Pause Recording
    store.value.mediaRecorder.pause();
  });

  const resumeRecording = $(() => {
    if (!store.value.mediaRecorder) return;
    console.log(`resumeRecording`);
    // Changing the status
    statusRecording.value = "recording";
    // Resume Recording
    store.value.mediaRecorder.resume();
  });

  const onDataAvailable = $(({ data }: { data: Blob }) => {
    chunks.value.push(noSerialize(data));
  });

  /**
   * Statues recording from a microphone
   */
  const startRecording = $(async () => {
    console.log(`startRecording`);
    // Specify default status
    statusRecording.value = "ready";
    // Resetting the duration
    duration.value = 0;
    try {
      // Receiving audio from the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      store.value.mediaStream = noSerialize(stream);

      if (options?.enableAnalyser) {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const source = ac.createMediaStreamSource(stream);
        const analyser = ac.createAnalyser();
        analyser.smoothingTimeConstant = 0.5;
        analyser.fftSize = 32;
        source.connect(analyser);

        analyserNode.value =  noSerialize(analyser);
        store.value.sourceNode =  noSerialize(source);
        store.value.audioContext =  noSerialize(ac);
      }
      if (options?.transcipt?.enable) {
        store.value.recognizer = noSerialize(new (window.webkitSpeechRecognition ||
          window.SpeechRecognition)());
    
        if (!store.value.recognizer) {
          throw new Error('SpeechRecognition API is not supported in this browser.');
        }
    
        store.value.recognizer.lang = options.transcipt.lang || 'en-US';
        store.value.recognizer.continuous = options.transcipt.continuous ?? true
        store.value.recognizer.interimResults = options.transcipt.interimResults ?? false
    
        store.value.recognizer.onstart = (): void => {
          // setIsListening(true);
        };
    
        store.value.recognizer.onresult = (event: SpeechRecognitionEvent): void => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i]![0]!.transcript;
            transcript.value += text;
          }
        };
    
        store.value.recognizer.onend = (): void => {
        };
    
        store.value.recognizer.start();
      }

      const recorder = new MediaRecorder(stream);
      recorder.start(1000);
      recorder.ondataavailable = onDataAvailable;
      store.value.mediaRecorder =  noSerialize(recorder);
      statusRecording.value =  "recording";
    } catch (error) {
      statusRecording.value =  "denied";
      console.warn(error);
    }
  });

  const resetTranscript = $(() => {
    transcript.value = "";
  });

  /**
   * 
   */
  const getPreview = $(() => {
    return new Blob(chunks.value as BlobPart[], { type: "audio/ogg; codecs=opus" });    
  })

  /**
   * 
   */
  const stopRecording = $(async () => {
    if (!store.value.mediaRecorder) return;
    console.log(`stopRecording`);
    
    const data = await getPreview();
    
    const url = URL.createObjectURL(data);
    
    statusRecording.value = "ready";
    
    audioUrl.value = url;
    
    audioBlob.value = noSerialize(data);
    
    store.value.mediaRecorder.stop();
    
    store.value.mediaStream?.getTracks().forEach((track) => track.stop());
    
    store.value.mediaStream =  null;
    
    analyserNode.value =  null;
    
    store.value.recognizer?.stop();
  });

  const clearRecording = $(() => {
    console.log(`clearRecording`);
    statusRecording.value = "ready";
    duration.value = 0;
    audioUrl.value = "";
    transcript.value = "";
    chunks.value = [];
    store.value.mediaRecorder = null;
    store.value.mediaStream = null;
    analyserNode.value = null;
    store.value.sourceNode =  null;
    store.value.audioContext =  null;
  });

  useVisibleTask$(({track, cleanup}) => {
    track(() => statusRecording.value)

    let timerId: number | undefined;
    if (statusRecording.value === "recording" && !timerId) {
      timerId = setInterval(() => duration.value++, 1000) as unknown as number;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      timerId && clearInterval(timerId);
    }

    cleanup(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      timerId && clearInterval(timerId);
    })

  })

  useVisibleTask$(({track}) => {
    track(() => statusRecording.value)
    track(() => duration.value)
 
    if (options?.timeLimit) {
      if (statusRecording.value === "recording" && duration.value >= options.timeLimit) {
        stopRecording();
      }
    }
  })

  useVisibleTask$(({cleanup}) => {
    cleanup(() => clearRecording())
  })

  return {
    startRecording,
    pauseRecording,
    stopRecording,
    resumeRecording,
    getPreview,
    clearRecording,
    statusRecording,
    duration,
    formattedDuration,
    audioBlob,
    audioUrl,
    analyser: analyserNode,
    transcript,
    resetTranscript
  };

}