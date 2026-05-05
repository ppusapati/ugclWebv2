import { component$, useComputed$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { Btn } from '~/components/ds';
import { useTourContext } from '~/contexts/tour-context';
import { guidedHelpTours, type GuidedTourStep } from '~/content/help-content';

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const OVERLAY_Z_INDEX = 1100;
const POPOVER_Z_INDEX = 1110;

function getViewportWidth(): number {
  return typeof window === 'undefined' ? 1280 : window.innerWidth;
}

function getViewportHeight(): number {
  return typeof window === 'undefined' ? 720 : window.innerHeight;
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function computeSpotlightRect(target: Element, step: GuidedTourStep): SpotlightRect {
  const bounds = target.getBoundingClientRect();
  const padding = step.padding ?? 10;
  const viewportWidth = getViewportWidth();
  const viewportHeight = getViewportHeight();

  const top = clamp(bounds.top - padding, 8, viewportHeight - 8);
  const left = clamp(bounds.left - padding, 8, viewportWidth - 8);
  const right = clamp(bounds.right + padding, 8, viewportWidth - 8);
  const bottom = clamp(bounds.bottom + padding, 8, viewportHeight - 8);

  return {
    top,
    left,
    width: Math.max(48, right - left),
    height: Math.max(32, bottom - top),
  };
}

function computePopoverPosition(
  rect: SpotlightRect,
  position: GuidedTourStep['position'],
): { top: number; left: number } {
  const viewportWidth = getViewportWidth();
  const viewportHeight = getViewportHeight();
  const popoverWidth = Math.min(420, viewportWidth - 32);
  const popoverHeight = 280;
  const gap = 16;
  const effectivePosition = position || 'auto';

  const candidates = effectivePosition === 'auto'
    ? (['bottom', 'right', 'left', 'top'] as const)
    : ([effectivePosition] as const);

  const positions = {
    top: {
      top: rect.top - popoverHeight - gap,
      left: rect.left + rect.width / 2 - popoverWidth / 2,
    },
    bottom: {
      top: rect.top + rect.height + gap,
      left: rect.left + rect.width / 2 - popoverWidth / 2,
    },
    left: {
      top: rect.top + rect.height / 2 - popoverHeight / 2,
      left: rect.left - popoverWidth - gap,
    },
    right: {
      top: rect.top + rect.height / 2 - popoverHeight / 2,
      left: rect.left + rect.width + gap,
    },
  };

  for (const candidate of candidates) {
    const candidatePosition = positions[candidate];
    const isHorizontallyValid =
      candidatePosition.left >= 12 &&
      candidatePosition.left + popoverWidth <= viewportWidth - 12;
    const isVerticallyValid =
      candidatePosition.top >= 12 &&
      candidatePosition.top + popoverHeight <= viewportHeight - 12;

    if (isHorizontallyValid && isVerticallyValid) {
      return candidatePosition;
    }
  }

  return {
    top: clamp(rect.top + rect.height + gap, 12, viewportHeight - popoverHeight - 12),
    left: clamp(rect.left, 12, viewportWidth - popoverWidth - 12),
  };
}

export const TourOverlay = component$(() => {
  const location = useLocation();
  const tour = useTourContext();

  const spotlightRect = useSignal<SpotlightRect | null>(null);
  const missingSelector = useSignal(false);

  const activeTour = useComputed$(() => {
    if (!tour.isRunning.value) {
      return null;
    }

    if (!tour.activeTourId.value) {
      return null;
    }

    return guidedHelpTours.find((item) => item.id === tour.activeTourId.value) || null;
  });

  const activeStep = useComputed$(() => {
    if (!tour.isRunning.value || !activeTour.value) {
      return null;
    }

    return activeTour.value.steps[tour.activeStepIndex.value] || null;
  });

  const popoverPosition = useComputed$(() => {
    if (!spotlightRect.value || !activeStep.value) {
      const viewportWidth = getViewportWidth();
      const viewportHeight = getViewportHeight();
      return {
        top: Math.max(16, viewportHeight / 2 - 140),
        left: Math.max(16, viewportWidth / 2 - 200),
      };
    }

    return computePopoverPosition(spotlightRect.value, activeStep.value.position);
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => tour.isRunning.value);
    track(() => tour.activeTourId.value);
    track(() => tour.activeStepIndex.value);
    track(() => location.url.pathname);

    if (!tour.isRunning.value) {
      spotlightRect.value = null;
      missingSelector.value = false;
      return;
    }

    const step = activeStep.value;
    if (!step) {
      spotlightRect.value = null;
      missingSelector.value = false;
      return;
    }

    if (normalizePath(location.url.pathname) !== normalizePath(step.path)) {
      spotlightRect.value = null;
      missingSelector.value = false;
      return;
    }

    let hasScrolledIntoView = false;
    let isDisposed = false;
    const maxWaitMs = step.waitForMs ?? 10000;
    const startTime = Date.now();

    const recalculate = async () => {
      if (isDisposed) {
        return;
      }

      const target = document.querySelector(step.selector);
      if (target instanceof HTMLElement) {
        if (!hasScrolledIntoView) {
          hasScrolledIntoView = true;
          target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
        }

        spotlightRect.value = computeSpotlightRect(target, step);
        missingSelector.value = false;
        return;
      }

      if (Date.now() - startTime > maxWaitMs) {
        spotlightRect.value = null;
        missingSelector.value = true;
      }
    };

    const intervalId = window.setInterval(() => {
      void recalculate();
    }, 160);

    const onResizeOrScroll = () => {
      void recalculate();
    };

    window.addEventListener('resize', onResizeOrScroll);
    window.addEventListener('scroll', onResizeOrScroll, true);

    void recalculate();

    cleanup(() => {
      isDisposed = true;
      window.clearInterval(intervalId);
      window.removeEventListener('resize', onResizeOrScroll);
      window.removeEventListener('scroll', onResizeOrScroll, true);
    });
  });

  if (!tour.isRunning.value || !activeTour.value || !activeStep.value) {
    return null;
  }

  const isFirstStep = tour.activeStepIndex.value === 0;
  const isLastStep = tour.activeStepIndex.value >= activeTour.value.steps.length - 1;

  return (
    <div class="fixed inset-0" style={`z-index: ${OVERLAY_Z_INDEX};`} aria-live="polite" aria-atomic="true">
      {spotlightRect.value ? (
        <>
          <div
            class="fixed left-0 right-0 top-0"
            style={`height:${spotlightRect.value.top}px; background: rgba(2, 6, 23, 0.45); backdrop-filter: blur(6px);`}
          />
          <div
            class="fixed left-0"
            style={`top:${spotlightRect.value.top}px; width:${spotlightRect.value.left}px; height:${spotlightRect.value.height}px; background: rgba(2, 6, 23, 0.45); backdrop-filter: blur(6px);`}
          />
          <div
            class="fixed right-0"
            style={`top:${spotlightRect.value.top}px; width:${Math.max(0, getViewportWidth() - spotlightRect.value.left - spotlightRect.value.width)}px; height:${spotlightRect.value.height}px; background: rgba(2, 6, 23, 0.45); backdrop-filter: blur(6px);`}
          />
          <div
            class="fixed bottom-0 left-0 right-0"
            style={`top:${spotlightRect.value.top + spotlightRect.value.height}px; background: rgba(2, 6, 23, 0.45); backdrop-filter: blur(6px);`}
          />

          <div
            class="fixed rounded-xl border-2 border-blue-400 bg-transparent shadow-[0_0_0_2px_rgba(96,165,250,0.35)] pointer-events-none"
            style={`top:${spotlightRect.value.top}px; left:${spotlightRect.value.left}px; width:${spotlightRect.value.width}px; height:${spotlightRect.value.height}px;`}
          />
        </>
      ) : (
        <div class="fixed inset-0" style="background: rgba(2, 6, 23, 0.45); backdrop-filter: blur(6px);" />
      )}

      <section
        class="fixed w-[min(420px,calc(100vw-24px))] rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl"
        style={`z-index:${POPOVER_Z_INDEX}; top:${popoverPosition.value.top}px; left:${popoverPosition.value.left}px;`}
        role="dialog"
        aria-label={`Tour step ${tour.activeStepIndex.value + 1}`}
      >
        <p class="text-xs font-semibold uppercase tracking-wide text-blue-700">{activeTour.value.title}</p>
        <h3 class="mt-1 text-base font-semibold text-gray-900">{activeStep.value.title}</h3>
        <p class="mt-2 text-sm leading-6 text-gray-700">{activeStep.value.purpose}</p>

        {missingSelector.value ? (
          <div class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            This page is open, but the guided element is not currently available. You can continue to the next step.
          </div>
        ) : null}

        <div class="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
          Step {tour.activeStepIndex.value + 1} of {activeTour.value.steps.length}
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div class="flex gap-2">
            <Btn size="sm" variant="secondary" onClick$={() => tour.prevStep()} disabled={isFirstStep}>
              Previous
            </Btn>
            <Btn size="sm" onClick$={() => tour.nextStep()}>
              {isLastStep ? 'Finish' : 'Next'}
            </Btn>
          </div>
          <Btn size="sm" variant="ghost" onClick$={() => tour.stopTour()}>
            End Tour
          </Btn>
        </div>
      </section>
    </div>
  );
});
