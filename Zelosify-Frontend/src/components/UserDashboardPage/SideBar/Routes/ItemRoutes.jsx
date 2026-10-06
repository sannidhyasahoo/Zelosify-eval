import {
  LogOut,
  Settings,
  CreditCard,
  Headset,
  Smile,
  Scale3DIcon,
  Briefcase,
} from "lucide-react";
import { MdDataUsage } from "react-icons/md";

// Role-based menu items
const getOverviewItemsByRole = (role) => {
  switch (role) {
    // For IT_VENDOR
    case "IT_VENDOR":
      return [
        { title: "Contract Openings", href: "/vendor/openings", icon: Briefcase },
        { title: "Payments & Invoices", href: "/vendor/payments", icon: CreditCard },
      ];

    // For HIRING_MANAGER
    case "HIRING_MANAGER":
      return [
        { title: "My Openings", href: "/hiring-manager/openings", icon: Briefcase },
      ];

    // For BUSINESS_USER
    case "BUSINESS_USER":
      return [
        {
          title: "Openings Overview",
          href: "/hiring-manager/openings",
          icon: Briefcase,
        },
      ];

    default:
      return [
        { title: "Openings", href: "/hiring-manager/openings", icon: Briefcase },
      ];
  }
};

// Role-based sidebar sections
export const getSidebarSectionsByRole = (role) => {
  const overviewItems = getOverviewItemsByRole(role);

  if (overviewItems.length === 0) {
    return [];
  }

  return [
    {
      title: "Overview",
      items: overviewItems,
    },
  ];
};

export const supportItem = {
  title: "Support",
  href: "/user/support",
  icon: Headset,
};

export const settingsItem = {
  title: "Settings",
  href: "/user/settings",
  icon: Settings,
};
export const signOutItem = { title: "Sign Out", href: "#", icon: LogOut };
