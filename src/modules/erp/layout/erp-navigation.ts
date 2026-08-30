import {
  LayoutDashboard,
  Users,
  UserRoundCog,
  Building2,
  Stethoscope,
  FileCheck,
  CheckCircle2,
  Plane,
  ShieldCheck,
  Files,
  Trash2,
  Settings,
  BarChart3,
  WalletCards,
  ListTodo,
  Phone,
  FingerprintPattern,
  Vault,
} from "lucide-react";

/* =========================================================
   ERP NAVIGATION
   ---------------------------------------------------------
   Single source of truth for:
   - Sidebar
   - Header
   - Current page detection
========================================================= */

export const erpNavigation = [
  {
    title: "Dashboard",
    url: "/app/dashboard",
    icon: LayoutDashboard,
  },

  {
    title: "Candidates",
    url: "/app/candidates",
    icon: Users,
  },

  {
    title: "Agents",
    url: "/app/agents",
    icon: UserRoundCog,
  },

  {
    title: "Agencies",
    url: "/app/agencies",
    icon: Building2,
  },

  {
    title: "Medical",
    url: "/app/medical",
    icon: Stethoscope,
  },

  {
    title: "MOFA",
    url: "/app/mofa",
    icon: FileCheck,
  },

  {
    title: "Finger",
    url: "/app/fingers",
    icon: FingerprintPattern,
  },

  {
    title: "Police Clearance",
    url: "/app/police-clearance",
    icon: Vault,
  },

  {
    title: "Takamul",
    url: "/app/takamul",
    icon: CheckCircle2,
  },

  {
    title: "Visa",
    url: "/app/visa",
    icon: ShieldCheck,
  },

  {
    title: "Flight",
    url: "/app/flight",
    icon: Plane,
  },

  {
    title: "Reports",
    url: "/app/reports",
    icon: BarChart3,
  },

  {
    title: "Finance",
    url: "/app/finance",
    icon: WalletCards,
  },

  {
    title: "Files",
    url: "/app/files",
    icon: Files,
  },

  {
    title: "Todo",
    url: "/app/todo",
    icon: ListTodo,
  },

  {
    title: "Settings",
    url: "/app/settings",
    icon: Settings,
  },

  {
    title: "Trash",
    url: "/app/trash",
    icon: Trash2,
  },
];

/* =========================================================
   SUPPORT
========================================================= */

export const supportNavigation = [
  {
    title: "Support",
    phone: "+8801839869859",
    icon: Phone,
  },
];