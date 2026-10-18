import { create } from 'zustand';

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface ReportState {
  category: string | null;
  photoUri: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  accuracy: number | null;
  description: string | null;
  clientId: string;
  isSubmiting: boolean;
  reset: () => void;
  setCategory: (category: string) => void;
  setPhoto: (uri: string) => void;
  setLocation: (latitude: number, longitude: number, address: string | null, accuracy: number | null) => void;
  setDescription: (description: string) => void;
  setClientId: () => void;
  setIsSubmiting: (isSubmiting: boolean) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  category: null,
  photoUri: null,
  latitude: null,
  longitude: null,
  address: null,
  accuracy: null,
  description: null,
  clientId: '',
  isSubmiting: false,
  reset: () =>
    set({
      category: null,
      photoUri: null,
      latitude: null,
      longitude: null,
      address: null,
      accuracy: null,
      description: null,
      clientId: '',
      isSubmiting: false,
    }),
  setCategory: (category) => set({ category }),
  setPhoto: (uri) => set({ photoUri: uri }),
  setLocation: (latitude, longitude, address, accuracy) =>
    set({ latitude, longitude, address, accuracy }),
  setDescription: (description) => set({ description }),
  setClientId: () => set({ clientId: generateUuid() }),
  setIsSubmiting: (isSubmiting) => set({ isSubmiting }),
}));

export default useReportStore;