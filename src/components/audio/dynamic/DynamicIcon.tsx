import {
  type NoSerialize,
  component$,
  useSignal,
  useTask$,
  type Signal,
} from "@builder.io/qwik";

type DynamicIconProps = {
  analyser: Signal<NoSerialize<AnalyserNode> | null>;
};

export const DynamicIcon = component$<DynamicIconProps>(({ analyser }) => {
  // Create a signal for the SVG element reference
  const ref = useSignal<SVGSVGElement>();

  // Use a task to handle animation and updates
  useTask$(({ cleanup }) => {
    // If the ref or analyser is not set, exit early
    if (!ref.value || !analyser.value) return;

    // Map of data indices for visualization
    const dataMap: { [key: number]: number } = {
      0: 15,
      1: 10,
      2: 8,
      3: 9,
      4: 6,
      5: 5,
      6: 2,
      7: 1,
      8: 0,
      9: 4,
      10: 3,
      11: 7,
      12: 11,
      13: 12,
      14: 13,
      15: 14,
    };

    let raf: number; // RequestAnimationFrame ID
    const bufferLength = analyser.value.frequencyBinCount; // Get buffer length
    const dataArray = new Uint8Array(bufferLength); // Array to hold frequency data

    const draw = () => {
      // If the ref or analyser is not set, exit early
      if (!ref.value || !analyser.value) return;

      // Schedule the next draw call
      raf = requestAnimationFrame(draw);

      // Get the frequency data
      analyser.value.getByteFrequencyData(dataArray);

      // Convert data array to a regular array for easier manipulation
      const values = Array.from(dataArray);
      const bars = ref.value.querySelectorAll(".bar"); // Get all bar elements

      for (let i = 0; i < bufferLength; i++) {
        const mappedIndex = dataMap[i];

        // Ensure that mappedIndex is defined and within the bounds of values and bars
        if (
          mappedIndex !== undefined &&   // Check if mappedIndex is not undefined
          mappedIndex < values.length && // Check if mappedIndex is within bounds of values array
          mappedIndex < bars.length      // Check if mappedIndex is within bounds of bars NodeList
        ) {
          const value = values[mappedIndex]! / 255; // Normalize the value
          const bar = bars[mappedIndex]; // Get the corresponding bar element

          // Further safety checks before modifying the DOM element
          if (bar) {
            bar.setAttribute("transform", `scale(1, ${value})`); // Scale the bar
            bar.setAttribute("opacity", `${Math.max(0.25, value)}`); // Adjust opacity
          }
        } else {
          console.warn("Unexpected mappedIndex or data structure issue.");
        }
        }
    };

    draw(); // Start the animation loop

    // Cleanup function to cancel the animation frame when component is destroyed
    cleanup(() => {
      cancelAnimationFrame(raf);
    });
  });

  // Styles for the SVG element
  const svgStyles = {
    width: "100%",
    height: "100%",
  };

  // Render the SVG element with bars
  return (
    <svg ref={ref} style={svgStyles}>
      {[...Array(analyser.value?.frequencyBinCount || 0)].map((_, i) => (
        <rect
          class="bar"
          key={i}
          x={i * 10}
          width="8"
          height="100%"
          fill="#42a5f5"
        />
      ))}
    </svg>
  );
});
