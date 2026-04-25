import { component$ } from "@builder.io/qwik";
import { P9ELikertView } from "../form_builder";

// Usage of the LikertView component
export default component$(() => {
    // const outputData = {
    //   // Simulated JSON data for demonstration
    //   passes: [
    //     {
    //       helpfulnessPreferredResponse: {
    //         response0: true,
    //         response1: false,
    //         tie: false,
    //       },
    //       helpfulnessPreferredResponseHowMuchBetter: {
    //         almostTheSame: false,
    //         better: true,
    //         significantlyBetter: false,
    //         slightlyBetter: false,
    //       },
    //       harmlessnessPreferredResponse: {
    //         response0: false,
    //         response1: true,
    //         tie: false,
    //       },
    //       harmlessnessPreferredResponseHowMuchBetter: {
    //         almostTheSame: false,
    //         better: false,
    //         significantlyBetter: true,
    //         slightlyBetter: false,
    //       },
    //       honestyPreferredResponse: {
    //         response0: true,
    //         response1: false,
    //         tie: false,
    //       },
    //       honestyPreferredResponseHowMuchBetter: {
    //         almostTheSame: false,
    //         better: true,
    //         significantlyBetter: false,
    //         slightlyBetter: false,
    //       }
    //     }
    //   ]
    // };
  
    const columnHeaders = ['Response 0', 'Response 1', 'Tie'];
    const rowHeaders = [
      'Helpfulness - Preferred Response',
      'Harmlessness - Preferred Response',
      'Honesty - Preferred Response',
    ];
  
    // const likertData = {
    //   helpfulnessPreferredResponse: outputData.passes[0].helpfulnessPreferredResponse,
    //   harmlessnessPreferredResponse: outputData.passes[0].harmlessnessPreferredResponse,
    //   honestyPreferredResponse: outputData.passes[0].honestyPreferredResponse,
    // };
  
    return (
      <P9ELikertView
        columnHeaders={columnHeaders}
        rowHeaders={rowHeaders}
        radioGroupPrefix="likert"
        onCapture$={() => {
          // handle captured data here
        }}
      />
    );
  });