import { create } from "zustand"
import { persist } from "zustand/middleware"

type ActiveSheet =
  | "candidate"
  | "agent"
  | "agency"
  | "medical"
  | "mofa"
  | "finger"
  | "pcc"
  | "takamul"
  | "visa"
  | "bmet"
  | "flight"
  | "transaction"
  | null

type UIStore = {
  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Global search
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  toggleSearch: () => void

  // Global add/action center
  actionCenterOpen: boolean
  setActionCenterOpen: (open: boolean) => void
  toggleActionCenter: () => void

  // Active sheet
  activeSheet: ActiveSheet
  setActiveSheet: (sheet: ActiveSheet) => void
  closeSheet: () => void

  // Selected record
  selectedCandidateId: string | null
  setSelectedCandidateId: (id: string | null) => void

  selectedAgentId: string | null
  setSelectedAgentId: (id: string | null) => void

  selectedAgencyId: string | null
  setSelectedAgencyId: (id: string | null) => void

  // Mobile navigation
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void

  // Reset transient UI state
  resetUI: () => void
}

const initialState = {
  sidebarOpen: true,
  searchOpen: false,
  actionCenterOpen: false,
  activeSheet: null as ActiveSheet,
  selectedCandidateId: null,
  selectedAgentId: null,
  selectedAgencyId: null,
  mobileMenuOpen: false,
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Sidebar
      setSidebarOpen: (open) =>
        set({
          sidebarOpen: open,
        }),

      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),

      // Global search
      setSearchOpen: (open) =>
        set({
          searchOpen: open,
        }),

      toggleSearch: () =>
        set((state) => ({
          searchOpen: !state.searchOpen,
        })),

      // Action center
      setActionCenterOpen: (open) =>
        set({
          actionCenterOpen: open,
        }),

      toggleActionCenter: () =>
        set((state) => ({
          actionCenterOpen: !state.actionCenterOpen,
        })),

      // Sheets
      setActiveSheet: (sheet) =>
        set({
          activeSheet: sheet,
        }),

      closeSheet: () =>
        set({
          activeSheet: null,
        }),

      // Selected candidate
      setSelectedCandidateId: (id) =>
        set({
          selectedCandidateId: id,
        }),

      // Selected agent
      setSelectedAgentId: (id) =>
        set({
          selectedAgentId: id,
        }),

      // Selected agency
      setSelectedAgencyId: (id) =>
        set({
          selectedAgencyId: id,
        }),

      // Mobile menu
      setMobileMenuOpen: (open) =>
        set({
          mobileMenuOpen: open,
        }),

      toggleMobileMenu: () =>
        set((state) => ({
          mobileMenuOpen: !state.mobileMenuOpen,
        })),

      // Reset
      resetUI: () =>
        set({
          ...initialState,
        }),
    }),
    {
      name: "overseaserp-ui",
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
      }),
    },
  ),
)