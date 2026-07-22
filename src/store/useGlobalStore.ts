import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserInfo {
  name: string;
  role: string;
  dept: string;
}

interface GlobalState {
  user: UserInfo | null;
  token: string | null;
  setLoginState: (user: UserInfo, token: string) => void;
  clearLoginState: () => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setLoginState: (user, token) => set({ user, token }),
      clearLoginState: () => set({ user: null, token: null }),
    }),
    {
      name: 'main-app-storage', // 持久化到 localStorage 的 key
    }
  )
);
