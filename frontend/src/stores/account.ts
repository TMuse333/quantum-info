// stores/useUserAccountStore.ts
import { create } from "zustand"
import { WebsiteMaster } from "@/types/website"

interface UserAccountStore {
  
    user: {
      id?: string
      name?: string
      email?: string
      plan?: string
      stripeCustomerId?: string
      stripeSubscriptionId?: string
      subscriptionStatus?: "active" | "inactive" | "canceled" | null
      isHostingSubscriber?: boolean
    } | null

  websites: WebsiteMaster[]

  // Actions
  setUser: (user: UserAccountStore["user"]) => void
  addWebsite: (website: WebsiteMaster) => void
  updateUserStripeInfo: (data: Partial<UserAccountStore["user"]>) => void
  updateWebsite: (id: string, updated: Partial<WebsiteMaster>) => void
  removeWebsite: (id: string) => void
  setWebsites: (websites: WebsiteMaster[]) => void
  resetUserAccount: () => void

}

export const useUserAccountStore = create<UserAccountStore>((set) => ({
  user: null,
  websites: [],

  setUser: (user) => set({ user }),
  setWebsites: (websites) => set({ websites }),
  addWebsite: (website) =>
    set((state) => ({ websites: [...state.websites, website] })),
  updateWebsite: (id, updated) =>
    set((state) => ({
      websites: state.websites.map((w) =>
        w._id === id ? { ...w, ...updated } : w
      ),
    })),
  removeWebsite: (id) =>
    set((state) => ({
      websites: state.websites.filter((w) => w._id !== id),
    })),
    updateUserStripeInfo: (data) =>
  set((state) => ({
    user: state.user ? { ...state.user, ...data } : null,
  })),
  resetUserAccount: () => set({ user: null, websites: [] }),
}))
