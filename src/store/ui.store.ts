import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Tema = 'light' | 'dark' | 'system';

interface UiState {
  tema: Tema;
  sidebarColapsado: boolean;
  sidebarMovilAbierto: boolean;
  setTema: (t: Tema) => void;
  toggleSidebar: () => void;
  setSidebarMovil: (abierto: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      tema: 'system',
      sidebarColapsado: false,
      sidebarMovilAbierto: false,
      setTema: (tema) => set({ tema }),
      toggleSidebar: () => set((s) => ({ sidebarColapsado: !s.sidebarColapsado })),
      setSidebarMovil: (sidebarMovilAbierto) => set({ sidebarMovilAbierto }),
    }),
    {
      name: 'gc-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ tema: s.tema, sidebarColapsado: s.sidebarColapsado }),
    },
  ),
);

/** Aplica la clase `dark` en <html> según la preferencia guardada. */
export function aplicarTema(tema: Tema) {
  const oscuro = tema === 'dark' || (tema === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', oscuro);
  document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light';
}
