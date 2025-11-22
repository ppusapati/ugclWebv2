// src/routes/report-builder/index.tsx
import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { useSignal, useStore } from '@builder.io/qwik';
import 'grapesjs/dist/css/grapes.min.css';
export default component$(() => {
  const containerRef = useSignal<HTMLElement>();
  const store = useStore({ initialized: false });

  useVisibleTask$(() => {
    if (store.initialized) return;
    store.initialized = true;

    import('grapesjs').then((grapesjsModule) => {
      grapesjsModule.default.init({
        container: containerRef.value!,
        height: '600px',
        width: 'auto',
        fromElement: false,
        storageManager: false,
        panels: { defaults: [] },
        blockManager: {
          appendTo: '#blocks',
          blocks: [
            {
              id: 'table',
              label: 'Table',
              content: '<table border="1"><tr><th>Header</th></tr><tr><td>Row</td></tr></table>',
            },
            {
              id: 'chart',
              label: 'Chart Placeholder',
              content: '<div style="width:300px;height:200px;background:#eef;text-align:center;padding:10px">Chart Component</div>',
            },
      {
        id: 'image',
        label: 'Image',
        media: `<svg style="width:24px;height:24px" viewBox="0 0 24 24">
            <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
        </svg>`,
        // Use `image` component
        content: { type: 'image' },
        // The component `image` is activatable (shows the Asset Manager).
        // We want to activate it once dropped in the canvas.
        activate: true,
        // select: true, // Default with `activate: true`
      },
       {
        id: 'section', // id is mandatory
        label: '<b>Section</b>', // You can use HTML/SVG inside labels
        attributes: { class: 'gjs-block-section' },
        content: `<section>
          <h1>This is a simple title</h1>
          <div>This is just a Lorem text: Lorem ipsum dolor sit amet</div>
        </section>`,
      },
      {
        id: 'text',
        label: 'Text',
        content: '<div data-gjs-type="text">Insert your text here</div>',
      },
          ],
        },
      });
    });
  });

  return (
    <div class="p-4">
      <h1 class="text-xl font-bold mb-4">Report Builder</h1>
      <div ref={containerRef} class="border rounded bg-white"></div>
      <div class="panel__right">
    <div class="layers-container"></div>
  </div>
      <div id="blocks" class="mb-4 flex gap-4"></div>

<div class="panel__top">
    <div class="panel__basic-actions"></div>
</div>
<div class="editor-row">
  <div class="editor-canvas">
    <div id="gjs">...</div>
  </div>
  <div class="panel__right">
    <div class="layers-container"></div>
  </div>
</div>
<div id="blocks"></div>
    </div>

    
  );
});
