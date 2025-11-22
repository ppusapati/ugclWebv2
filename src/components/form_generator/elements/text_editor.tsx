 
import { component$, useStore, useSignal, useVisibleTask$, type PropFunction } from '@builder.io/qwik';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { P9EInputLabel } from './input_label';
import type { P9EBaseProps, P9EFormProps, P9EInputFunctions, P9EValidations } from '../types';
import { P9EInputError } from './input_error';
import { P9EInputHint } from './input_hint';

type RichTextEditorProps = P9EBaseProps & P9EFormProps &P9EInputFunctions & P9EValidations & {
  onContentChange$: PropFunction<(content: string) => void>;
}

export const P9ETextEditor = component$(
  ({ label, error, hint, onContentChange$, placeholder, ...props }: RichTextEditorProps  ) => {
    const { name, required } = props;
  const editorRef = useSignal<Element | any>();
  const store = useStore({ content: '' });

  useVisibleTask$(() => {
    if (editorRef.value) {
      const quill = new Quill(editorRef.value, {
        theme: 'snow',
        placeholder: placeholder, 
       modules:{ toolbar: [
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
