import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";

// SidebarMenuSub component - memoized
export const SidebarMenuSub = memo(
  ({ children, isOpen, isExpanded, className, ...props }) => {
    const isVisible = isOpen && isExpanded;

    return (
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isVisible ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul
          data-sidebar="menu-sub"
          className={`ml-3 pl-1 border-l border-border mt-1 space-y-1 ${
            isVisible ? "pointer-events-auto" : "pointer-events-none"
          } ${className || ""}`}
          {...props}
        >
          {children}
        </ul>
      </div>
    );
  }
);
SidebarMenuSub.displayName = "SidebarMenuSub";

// SidebarMenuSubItem component - memoized
export const SidebarMenuSubItem = memo(
  ({ item, isActive, isOpen, ...props }) => {
    const router = useRouter();

    const handleClick = useCallback(() => {
      router.push(item.href);
    }, [router, item.href]);

    return (
      <li {...props}>
        <button
          onClick={handleClick}
          className={`
          w-full rounded-lg flex items-center gap-2 px-2.5 py-1.5 text-xs transition-colors
          ${
            isActive
              ? "bg-white/[0.08] text-white font-medium border border-border/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
              : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent"
          }
        `}
        >
          {item.icon && (
            <item.icon
              className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                isActive ? "text-coral" : "text-muted-foreground"
              }`}
            />
          )}
          {isOpen && <span className="truncate">{item.title}</span>}
        </button>
      </li>
    );
  }
);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
