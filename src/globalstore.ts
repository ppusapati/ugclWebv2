import { createContextId } from '@builder.io/qwik';

interface GlobalStore {
  isAuth: boolean;
  user?: {
    name: string;
    email: string;
  };
}

export const GlobalStoreContext = createContextId<GlobalStore>('global-store');