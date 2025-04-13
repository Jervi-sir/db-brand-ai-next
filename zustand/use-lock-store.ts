import { create } from 'zustand';

// Separate obfuscated keys for sessionStorage
const UNLOCKED_KEY = '_a1b2'; // Non-obvious key for isUnlocked
const CODE_KEY = '_c3d4'; // Non-obvious key for usedCode

// Interface for the store
interface LockState {
  isUnlocked: boolean;
  usedCode: string | null;
  error: string | null;
  unlock: (code: string) => Promise<void>;
  reset: () => void;
  checkUnlockStatus: () => Promise<void>;
  loadFromSession: () => void;
}

// Save state to sessionStorage separately
const saveToSession = (state: { isUnlocked: boolean; usedCode: string | null }) => {
  try {
    sessionStorage.setItem(UNLOCKED_KEY, JSON.stringify(state.isUnlocked));
    if (state.usedCode) {
      sessionStorage.setItem(CODE_KEY, JSON.stringify(state.usedCode));
    } else {
      sessionStorage.removeItem(CODE_KEY);
    }
  } catch (err) {
    console.error('Failed to save to sessionStorage:', err);
  }
};

export const useLockStore = create<LockState>((set) => ({
  isUnlocked: false,
  usedCode: null,
  error: null,
  unlock: async (code: string) => {
    try {
      const response = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();

      if (response.ok && data.isValid) {
        const newState = { isUnlocked: true, usedCode: code, error: null };
        set(newState);
        saveToSession(newState);
      } else {
        const newState = { isUnlocked: false, usedCode: null, error: data.error || 'Invalid code' };
        set(newState);
        saveToSession(newState);
      }
    } catch (err) {
      const newState = { isUnlocked: false, usedCode: null, error: 'Failed to validate code' };
      set(newState);
      saveToSession(newState);
    }
  },
  reset: () => {
    const newState = { isUnlocked: false, usedCode: null, error: null };
    set(newState);
    saveToSession(newState);
  },
  checkUnlockStatus: async () => {
    try {
      const response = await fetch('/api/check-unlock');
      const data = await response.json();
      if (response.ok) {
        const newState = { isUnlocked: data.isUnlocked, usedCode: data.usedCode || null, error: null };
        set(newState);
        saveToSession(newState);
      } else {
        const newState = { isUnlocked: false, usedCode: null, error: data.error || 'Failed to check status' };
        set(newState);
        saveToSession(newState);
      }
    } catch (err) {
      const newState = { isUnlocked: false, usedCode: null, error: 'Failed to check status' };
      set(newState);
      saveToSession(newState);
    }
  },
  loadFromSession: () => {
    try {
      const unlockedState = sessionStorage.getItem(UNLOCKED_KEY);
      const codeState = sessionStorage.getItem(CODE_KEY);
      
      const newState: Partial<LockState> = {};
      
      if (unlockedState !== null) {
        newState.isUnlocked = JSON.parse(unlockedState);
      }
      if (codeState !== null) {
        newState.usedCode = JSON.parse(codeState);
      }
      
      set((state) => ({
        ...state,
        isUnlocked: newState.isUnlocked ?? state.isUnlocked,
        usedCode: newState.usedCode ?? state.usedCode,
        error: null, // Error is not stored
      }));
    } catch (err) {
      console.error('Failed to load from sessionStorage:', err);
      set({ isUnlocked: false, usedCode: null, error: 'Failed to load session state' });
    }
  },
}));