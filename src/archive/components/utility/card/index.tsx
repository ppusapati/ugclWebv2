import { component$, Slot } from '@builder.io/qwik';

type CardProps = {
    title?: string;
    footer?: string;
  }

export const P9ECard = component$((props: CardProps) => {
  return (
    <>
    <div class="p9ecard">
      <h6>{props.title}</h6>
<Slot/>
</div>
    </>
  )
});