import { STORAGE_KEYS } from '~/config/storage-keys';

export type TourEventType = 'started' | 'step_advanced' | 'step_retreated' | 'completed' | 'abandoned';

export interface TourEvent {
  eventType: TourEventType;
  tourId: string;
  stepIndex: number;
  userId: string;
  timestamp: number;
}

export interface TourPersistedState {
  tourId: string;
  stepIndex: number;
  isRunning: boolean;
  userId: string;
  savedAt: number;
}

const MAX_EVENTS = 200;

function readEvents(): TourEvent[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOUR_EVENTS);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as TourEvent[];
  } catch {
    return [];
  }
}

function writeEvents(events: TourEvent[]): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    const trimmed = events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEYS.TOUR_EVENTS, JSON.stringify(trimmed));
  } catch {
    // quota exceeded — discard oldest half and retry once
    try {
      const trimmed = events.slice(-Math.floor(MAX_EVENTS / 2));
      localStorage.setItem(STORAGE_KEYS.TOUR_EVENTS, JSON.stringify(trimmed));
    } catch {
      // give up silently
    }
  }
}

export const tourAnalyticsService = {
  recordEvent(event: Omit<TourEvent, 'timestamp'>): void {
    const full: TourEvent = { ...event, timestamp: Date.now() };
    const current = readEvents();
    writeEvents([...current, full]);
  },

  getEvents(tourId?: string): TourEvent[] {
    const events = readEvents();
    if (!tourId) {
      return events;
    }

    return events.filter((e) => e.tourId === tourId);
  },

  getTourCompletedCount(tourId: string, userId?: string): number {
    return readEvents().filter(
      (e) => e.eventType === 'completed' && e.tourId === tourId && (!userId || e.userId === userId),
    ).length;
  },

  hasTourBeenCompleted(tourId: string, userId: string): boolean {
    return readEvents().some(
      (e) => e.eventType === 'completed' && e.tourId === tourId && e.userId === userId,
    );
  },

  clearEvents(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.TOUR_EVENTS);
    }
  },

  saveTourState(state: TourPersistedState): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.TOUR_STATE, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  },

  loadTourState(userId: string): TourPersistedState | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TOUR_STATE);
      if (!raw) {
        return null;
      }

      const state = JSON.parse(raw) as TourPersistedState;
      // Only restore state that belongs to this user and was saved within 24 hours
      if (state.userId !== userId) {
        return null;
      }

      const ageMs = Date.now() - state.savedAt;
      const maxAgeMs = 24 * 60 * 60 * 1000;
      if (ageMs > maxAgeMs) {
        localStorage.removeItem(STORAGE_KEYS.TOUR_STATE);
        return null;
      }

      return state;
    } catch {
      return null;
    }
  },

  clearTourState(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.TOUR_STATE);
    }
  },
};
