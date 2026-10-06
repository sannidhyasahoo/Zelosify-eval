import { ChevronDown, ChevronRight } from "lucide-react";
import { memo } from "react";

// SidebarMenu component - memoized
export const SidebarMenu = memo(({ children, className, ...props }) => {
  return (
    <ul
      data-sidebar="menu"
      className={`flex w-full min-w-0 flex-col gap-2 ${className || ""}`}
      {...props}
    >
      {children}
    </ul>
  );
});
SidebarMenu.displayName = "SidebarMenu";

// SidebarMenuItem component - memoized
export const SidebarMenuItem = memo(({ children, className, ...props }) => {
  return (
    <li
      data-sidebar="menu-item"
      className={`group/menu-item relative ${className || ""}`}
      {...props}
    >
      {children}
    </li>
  );
});
SidebarMenuItem.displayName = "SidebarMenuItem";

// SidebarMenuButton component - memoized
export const SidebarMenuButton = memo(
  ({
    icon: Icon,
    title,
    isActive,
    onClick,
    isOpen,
    hasSubmenu,
    isExpanded,
    className,
    ...props
  }) => {
    return (
      <button
        data-sidebar="menu-button"
        data-active={isActive}
        onClick={onClick}
        className={`
        flex w-full items-center ${
          isOpen ? "justify-between" : "justify-center"
        } px-2.5 py-2 text-xs rounded-lg transition-all duration-150
        ${
          isActive
            ? "bg-white/[0.08] text-white font-medium border border-border/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
            : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent"
        }
        ${className || ""}
      `}
        {...props}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive ? "text-coral" : "text-muted-foreground"
              }`}
            />
          )}
          {isOpen && <span className="truncate">{title}</span>}
        </div>
        {isOpen &&
          hasSubmenu &&
          (isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
          ))}
      </button>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";
