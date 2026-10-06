import { X, Menu } from "lucide-react";
import { memo } from "react";
import Link from "next/link";

// eslint-disable-next-line react/display-name
const SidebarHeader = memo(({ isOpen, toggleSidebar }) => (
  <div className="h-16 border-b border-border flex items-center justify-between px-4">
    {isOpen && (
      <Link
        href={"/"}
        className="flex items-center overflow-hidden whitespace-nowrap"
      >
        <img
          src={"/assets/logos/main-logo.png"}
          alt="Zelosify"
          className="h-7 w-auto object-contain"
        />
      </Link>
    )}
    <button
      onClick={toggleSidebar}
      className={`rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors ${
        isOpen ? "" : "w-full flex justify-center"
      }`}
      aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <Menu className="h-5 w-5" />
      )}
    </button>
  </div>
));

export default SidebarHeader;
