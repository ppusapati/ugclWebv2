import type { QRL, JSXOutput } from "@builder.io/qwik";
import { $ } from "@builder.io/qwik";

// Utility function to wrap image components imported with `?jsx`
export function ImageWrapper({
  ImageComponent,
  class: className,
  alt
}: {
  ImageComponent: (props: { class: string; alt: string }) => JSXOutput;
  class: string;
  alt: string;
}) {
  return <ImageComponent class={className} alt={alt} />;
}

// Function to create a QRL-wrapped image component
export function createQRLImageComponent(
    ImageComponent: (props: { class: string; alt: string }) => JSXOutput
  ): QRL<(props: { class: string; alt: string }) => JSXOutput> {
    return $(function ImageQRL(props: { class: string; alt: string }) {
      return <ImageComponent {...props} />;
    });
  }


  export function createFunc(ImageComponent: (props: { class: string; alt: string }) => JSXOutput): QRL<(props: { class: string; alt: string }) => JSXOutput> {
    return $(function ImageQRL(props: { class: string; alt: string }) {
        return <ImageComponent {...props} />;
      });
  }
