"use client";
import { memo, useEffect, useState, useRef } from "react";
import { Moon, Search, Sun } from "lucide-react";
import UserProfile from "./UserProfile";
import Notification from "./Notification";
import { useTheme } from "next-themes";

const Header = memo(({ isSidebarOpen }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Unified function to close both when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get current theme (Use resolvedTheme to correctly detect system theme)
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  // Toggle Notifications
  const toggleNotifications = (e) => {
    e.stopPropagation();
    setShowNotifications((prev) => !prev);
    setIsProfileOpen(false); // Close profile if notification opens
  };

  // Toggle Profile
  const toggleProfile = (e) => {
    e.stopPropagation();
    setIsProfileOpen((prev) => !prev);
    setShowNotifications(false); // Close notifications if profile opens
  };

  return (
    <header
      className={`${
        isSidebarOpen ? "pl-[12rem]" : "pl-[5rem]"
      } h-16 flex items-center justify-between sticky top-0 z-40 bg-background border-b border-border`}
    >
      <div className="flex items-center justify-end px-6 w-full">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 border border-border/70 text-[11px] font-mono text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-[#59d499]"></span>
            <span>Live Session</span>
          </div>

          <UserProfile
            toggleNotifications={toggleNotifications}
            isProfileOpen={isProfileOpen}
            toggleProfile={toggleProfile}
            profileRef={profileRef}
          />
        </div>
      </div>

      {/* Notification Popup */}
      {showNotifications && (
        <Notification
          notificationRef={notificationRef}
          setShowNotifications={setShowNotifications}
        />
      )}
    </header>
  );
});

Header.displayName = "Header";
export default Header;
