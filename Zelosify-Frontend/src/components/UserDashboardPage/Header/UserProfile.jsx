import ProfileImage from "@/components/UI/ProfileImage";
import { User, Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo } from "react";
import useAuth from "@/hooks/Auth/useAuth";

const UserProfile = memo(
  ({ toggleNotifications, isProfileOpen, toggleProfile, profileRef }) => {
    const router = useRouter();
    const {
      user,
      handleOpenSignoutConfirmation,
      getDisplayName,
      getUserHandle,
    } = useAuth();

    // Get formatted display name and user handle
    const displayName = getDisplayName();
    const userHandle = getUserHandle();

    return (
      <div className="relative" ref={profileRef}>
        {/* Profile Button */}
        <button
          onClick={toggleProfile}
          className="flex items-center gap-2 p-1.5 rounded-lg border border-border/60 bg-white/[0.03] hover:bg-white/[0.06] hover:border-border transition-colors"
          aria-label="Toggle profile menu"
          tabIndex="0"
        >
          <div className="relative">
            <ProfileImage className="w-7 h-7" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#59d499] rounded-full ring-2 ring-background"></span>
          </div>

          <span className="font-medium text-xs text-foreground hidden sm:inline">
            {displayName}
          </span>
        </button>

        {isProfileOpen && (
          <div
            className="absolute right-0 mt-2 w-56 rounded-card border border-border/80 bg-card p-1.5 shadow-float z-50 animate-in fade-in-0 zoom-in-95 duration-150"
            role="menu"
          >
            {/* Profile Info */}
            <div className="px-3 py-2 text-xs border-b border-border/60">
              <p className="font-semibold text-foreground truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate font-mono">
                {userHandle}
              </p>
              {user?.role && (
                <div className="mt-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border/70">
                  {user.role.replace(/_/g, " ")}
                </div>
              )}
              {user?.tenant?.companyName && (
                <p className="text-[11px] text-muted-foreground/80 mt-1 truncate">
                  Org: {user.tenant.companyName}
                </p>
              )}
            </div>

            {/* Logout */}
            <div className="pt-1">
              <button
                onClick={handleOpenSignoutConfirmation}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-coral hover:bg-coral/10 rounded-lg transition-colors"
                role="menuitem"
                tabIndex="0"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

UserProfile.displayName = "UserProfile";
export default UserProfile;
