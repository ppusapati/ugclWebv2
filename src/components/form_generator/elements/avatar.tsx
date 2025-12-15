import { component$ } from '@builder.io/qwik';

// TODO: Need to implement avatar upload
export const P9EAvatar = component$(() => {
  return (
    <div class="">
      <label class="labelbase">Upload Avatar</label>
      <div class="relative inline-block">
        <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
          <span class="text-gray-500 text-xl">?</span>
        </div>
        <input
          class="absolute inset-0 cursor-pointer opacity-0"
          type="file"
          accept="image/*"
        />
      </div>
    </div>
  );
});