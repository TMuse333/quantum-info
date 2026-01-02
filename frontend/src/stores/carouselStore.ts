"use client";
import { CarouselItem } from '@/types/editorial';
import { create } from "zustand";


interface CarouselState {
  carousels: Record<string, CarouselItem[]>;

  addCarousel: (id: string, items?: CarouselItem[]) => void;
  setCarousel: (id: string, items: CarouselItem[]) => void;
  addItem: (id: string, item: CarouselItem) => void;
  removeItem: (id: string, index: number) => void;
  updateItem: (id: string, index: number, updates: Partial<CarouselItem>) => void;
  reorderItems: (id: string, oldIndex: number, newIndex: number) => void;
}

export const useCarouselStore = create<CarouselState>((set) => ({
  carousels: {},

  addCarousel: (id, items = []) =>
    set((state) => ({
      carousels: { ...state.carousels, [id]: items },
    })),

  setCarousel: (id, items) =>
    set((state) => ({
      carousels: { ...state.carousels, [id]: items },
    })),

  addItem: (id, item) =>
    set((state) => {
      const current = state.carousels[id] ?? [];
      return {
        carousels: { ...state.carousels, [id]: [...current, item] },
      };
    }),

  removeItem: (id, index) =>
    set((state) => {
      const current = state.carousels[id] ?? [];
      return {
        carousels: {
          ...state.carousels,
          [id]: current.filter((_, i) => i !== index),
        },
      };
    }),

  updateItem: (id, index, updates) =>
    set((state) => {
      const current = state.carousels[id] ?? [];
      return {
        carousels: {
          ...state.carousels,
          [id]: current.map((item, i) =>
            i === index ? { ...item, ...updates } : item
          ),
        },
      };
    }),

  reorderItems: (id, oldIndex, newIndex) =>
    set((state) => {
      const current = state.carousels[id] ?? [];
      const moved = [...current];
      const [removed] = moved.splice(oldIndex, 1);
      moved.splice(newIndex, 0, removed);
      return {
        carousels: { ...state.carousels, [id]: moved },
      };
    }),
}));
