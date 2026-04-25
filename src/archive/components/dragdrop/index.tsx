// DragAndDropContainer.tsx
import { $, component$, useSignal } from '@builder.io/qwik';
import type { Component } from '@builder.io/qwik';

interface DragAndDropContainerProps {
   
  components: Array<{ id: number; component: Component; props?: any }>;
}

export default component$(({ components }: DragAndDropContainerProps) => {
  const items = useSignal(components); // Signal for reactivity
  const draggedIndex = useSignal<number | null>(null); // Store the index of dragged item

  // When dragging starts, store the index of the item
  const handleDragStart$ = $((index: number) => {
    draggedIndex.value = index;
  });

  // Handle the drop event, update the order of components
  const handleDrop$ = $((index: number) => {
    if (draggedIndex.value !== null) {
      const newItems = [...items.value];
      const [draggedItem] = newItems.splice(draggedIndex.value, 1); // Remove dragged item
      newItems.splice(index, 0, draggedItem); // Insert at the drop position
      items.value = newItems; // Update items
      draggedIndex.value = null; // Reset dragged index
    }
  });

  const handleDragOver$ = $((event: DragEvent) => {
    event.preventDefault(); // Needed to allow dropping
  });

  return (
    <div class="w-full flex">
      {items.value.map((item, index) => (
        <div
          key={item.id}
          class="cursor-move w-full relative" 
          draggable={true}
          onDragStart$={() => handleDragStart$(index)}
          onDrop$={() => handleDrop$(index)}
          onDragOver$={handleDragOver$}
        >
          <item.component {...item.props} /> {/* Render the component */}
        </div>
      ))}
    </div>
  );
});
