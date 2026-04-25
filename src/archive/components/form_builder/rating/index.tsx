import { $, component$, useSignal, PropFunction } from '@builder.io/qwik';

interface RatingProps {
  onRatingSelect$: PropFunction<(rating: number) => void>;
}

export default component$((props: RatingProps) => {
  const selectedRating = useSignal(0); // This will hold the selected rating value
  
  const handleRatingClick$ = $((rating: number) => {
    selectedRating.value = rating;
    props.onRatingSelect$(rating); // Call the parent handler with the selected rating
  });

  return (
    <div class="flex space-x-2 justify-center">
      {/* Render 5 stars */}
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick$={() => handleRatingClick$(star)}
          class={`text-gray-400 hover:text-yellow-500 transition-colors duration-300 ${
            selectedRating.value >= star ? 'text-yellow-500' : ''
          }`}
        >
          <svg
            class="w-8 h-8 md:w-10 md:h-10"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 17.27l6.18 3.73-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l5.46 4.73-1.64 7.03L12 17.27z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
});
