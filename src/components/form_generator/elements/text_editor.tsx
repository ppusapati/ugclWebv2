import { component$, useStore, useSignal, useVisibleTask$, type PropFunction } from '@builder.io/qwik';
import { P9EInputLabel } from './input_label';
import type { P9EBaseProps, P9EFormProps, P9EInputFunctions, P9EValidations } from '../types';
import { P9EInputError } from './input_error';
import { P9EInputHint } from './input_hint';

type RichTextEditorProps = P9EBaseProps & P9EFormProps & P9EInputFunctions & P9EValidations & {
  onContentChange$: PropFunction<(content: string) => void>;
}

export const P9ETextEditor = component$(
  ({ label, error, hint, onContentChange$, placeholder, ...props }: RichTextEditorProps) => {
    const { name, required } = props;
    const editorRef = useSignal<HTMLDivElement | undefined>();
    const store = useStore({ content: '' });

    useVisibleTask$(async () => {
      if (editorRef.value) {
        // Dynamic import of Quill to avoid SSR issues
        const QuillModule = await import('quill');
        const Quill = QuillModule.default;
        // Import CSS dynamically
        await import('quill/dist/quill.snow.css');

        const quill = new Quill(editorRef.value, {
          theme: 'snow',
          placeholder: placeholder,
          modules: {
            toolbar: [
              ['bold', 'italic'],
              ['link', 'blockquote', 'code-block', 'image'],
              [{ list: 'ordered' }, { list: 'bullet' }],
            ],
          }
        });

        quill.on('text-change', () => {
          store.content = quill.root.innerHTML;
          onContentChange$(store.content);
        });
      }
    });

  return (
    <div class=' mb-4' >
      <P9EInputLabel name={name} label={label} required={required} margin={'none'}/>
      <div ref={editorRef}></div>
      <P9EInputHint name={name} hint={hint} />
      <P9EInputError name={name} error={error} />
    </div>
  );
});
