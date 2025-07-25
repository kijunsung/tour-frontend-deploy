import { create } from 'zustand';
import { Route, RouteSearchState } from '../types/routes';

interface RoutesStore extends RouteSearchState {
  setRoutes: (routes: Route[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearRoutes: () => void;
}

export const useRoutesStore = create<RoutesStore>((set) => ({
  routes: [],
  loading: false,
  error: null,
  setRoutes: (routes) => set({ routes }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearRoutes: () => set({ routes: [], error: null }),
}));