import {
  $, 
  Slot,
  component$,
  createContextId,
  type QRL,
  useContext,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  type Signal,
} from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { guidedHelpTours, type GuidedHelpTour } from '~/content/help-content';
import { tourAnalyticsService } from '~/services/tour-analytics.service';
import { useAuthContext } from '~/contexts/auth-context';

interface TourState {
  isRunning: Signal<boolean>;
  activeTourId: Signal<string | null>;
  activeStepIndex: Signal<number>;
  completedTourIds: Signal<string[]>;
}

export interface TourContextType extends TourState {
  startTour: QRL<(tourId: string, stepIndex?: number) => Promise<void>>;
  stopTour: QRL<() => void>;
  nextStep: QRL<() => Promise<void>>;
  prevStep: QRL<() => Promise<void>>;
  goToStep: QRL<(stepIndex: number) => Promise<void>>;
}

const TourContext = createContextId<TourContextType>('tour-context');

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function getTourById(tourId: string | null): GuidedHelpTour | null {
  if (!tourId) {
    return null;
  }

  return guidedHelpTours.find((tour) => tour.id === tourId) || null;
}

export const TourProvider = component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const auth = useAuthContext();

  const isRunning = useSignal(false);
  const activeTourId = useSignal<string | null>(null);
  const activeStepIndex = useSignal(0);
  const completedTourIds = useSignal<string[]>([]);

  const currentUserId = $(() => auth.user?.id ?? 'anonymous');

  const stopTour = $(async () => {
    const tourId = activeTourId.value;
    const stepIndex = activeStepIndex.value;
    const userId = await currentUserId();

    if (tourId) {
      const tour = getTourById(tourId);
      const isCompleted = tour ? stepIndex >= tour.steps.length - 1 : false;

      tourAnalyticsService.recordEvent({
        eventType: isCompleted ? 'completed' : 'abandoned',
        tourId,
        stepIndex,
        userId,
      });

      if (isCompleted && !completedTourIds.value.includes(tourId)) {
        completedTourIds.value = [...completedTourIds.value, tourId];
      }

      tourAnalyticsService.clearTourState();
    }

    isRunning.value = false;
    activeTourId.value = null;
    activeStepIndex.value = 0;
  });

  const goToStep = $(async (stepIndex: number) => {
    const tour = getTourById(activeTourId.value);
    if (!tour || tour.steps.length === 0) {
      return;
    }

    const boundedStepIndex = Math.max(0, Math.min(stepIndex, tour.steps.length - 1));
    activeStepIndex.value = boundedStepIndex;

    const step = tour.steps[boundedStepIndex];
    const targetPath = normalizePath(step.path);
    const currentPath = normalizePath(location.url.pathname);

    if (targetPath !== currentPath) {
      await nav(step.path);
    }
  });

  const startTour = $(async (tourId: string, stepIndex = 0) => {
    const tour = getTourById(tourId);
    if (!tour || tour.steps.length === 0) {
      return;
    }

    const userId = await currentUserId();

    activeTourId.value = tourId;
    isRunning.value = true;

    tourAnalyticsService.recordEvent({ eventType: 'started', tourId, stepIndex, userId });

    await goToStep(stepIndex);
  });

  const nextStep = $(async () => {
    const tour = getTourById(activeTourId.value);
    if (!tour || tour.steps.length === 0) {
      return;
    }

    if (activeStepIndex.value >= tour.steps.length - 1) {
      await stopTour();
      return;
    }

    const userId = await currentUserId();
    const nextIndex = activeStepIndex.value + 1;

    tourAnalyticsService.recordEvent({
      eventType: 'step_advanced',
      tourId: activeTourId.value!,
      stepIndex: nextIndex,
      userId,
    });

    await goToStep(nextIndex);
  });

  const prevStep = $(async () => {
    const tour = getTourById(activeTourId.value);
    if (!tour || tour.steps.length === 0) {
      return;
    }

    if (activeStepIndex.value === 0) {
      return;
    }

    const userId = await currentUserId();
    const prevIndex = activeStepIndex.value - 1;

    tourAnalyticsService.recordEvent({
      eventType: 'step_retreated',
      tourId: activeTourId.value!,
      stepIndex: prevIndex,
      userId,
    });

    await goToStep(prevIndex);
  });

  // Persist tour state whenever it changes
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    track(() => activeTourId.value);
    track(() => activeStepIndex.value);
    track(() => isRunning.value);

    const userId = auth.user?.id ?? 'anonymous';

    if (isRunning.value && activeTourId.value) {
      tourAnalyticsService.saveTourState({
        tourId: activeTourId.value,
        stepIndex: activeStepIndex.value,
        isRunning: true,
        userId,
        savedAt: Date.now(),
      });
    }
  });

  // Restore persisted state and seed completedTourIds from event log on mount
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    const userId = auth.user?.id ?? 'anonymous';

    // Seed completed tours from event log
    const allEvents = tourAnalyticsService.getEvents();
    const completedIds = allEvents
      .filter((e) => e.eventType === 'completed' && e.userId === userId)
      .map((e) => e.tourId);
    const unique = [...new Set(completedIds)];
    if (unique.length > 0) {
      completedTourIds.value = unique;
    }

    // Restore in-progress tour (user navigated away mid-tour)
    const saved = tourAnalyticsService.loadTourState(userId);
    if (saved && saved.isRunning) {
      const tour = getTourById(saved.tourId);
      if (tour && tour.steps.length > 0) {
        activeTourId.value = saved.tourId;
        activeStepIndex.value = saved.stepIndex;
        isRunning.value = true;
      }
    }
  });

  // Keyboard navigation
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => isRunning.value);
    if (!isRunning.value) {
      return;
    }

    const onKeyDown = async (event: KeyboardEvent) => {
      if (!isRunning.value) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        await stopTour();
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault();
        await nextStep();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        await prevStep();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    cleanup(() => {
      document.removeEventListener('keydown', onKeyDown);
    });
  });

  const contextValue: TourContextType = {
    isRunning,
    activeTourId,
    activeStepIndex,
    completedTourIds,
    startTour,
    stopTour,
    nextStep,
    prevStep,
    goToStep,
  };

  useContextProvider(TourContext, contextValue);

  return <Slot />;
});

export const useTourContext = (): TourContextType => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTourContext must be used within a TourProvider');
  }

  return context;
};
