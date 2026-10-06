"use client";
import SignOutConfirmation from "@/components/UI/SignOutConfirmation";
import Header from "@/components/UserDashboardPage/Header/Header";
import SideBarLayout from "@/components/UserDashboardPage/SideBar/SideBarLayout";
import { useState, useEffect, useCallback } from "react";
import useAuth from "@/hooks/Auth/useAuth";

export default function UserDashboardlayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { showSignoutConfirmation, handleCloseSignoutConfirmation } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Overlay blurred warning */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl lg:hidden">
        <div className="relative w-full max-w-md rounded-card border border-border/80 bg-card p-7 text-center shadow-float">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-coral/30 bg-coral/10 text-coral">
            <span className="h-2 w-2 rounded-full bg-coral animate-pulse" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Desktop Optimized Workspace
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Zelosify contract intelligence is designed for high-resolution desktop and laptop displays. Please expand your browser window or switch to a desktop screen.
          </p>
        </div>
      </div>

      {/* main content */}
      <div className="flex flex-col min-h-screen bg-background">
        <SignOutConfirmation
          isOpen={showSignoutConfirmation}
          onCancel={handleCloseSignoutConfirmation}
        />
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <div className="flex flex-1 overflow-hidden">
          <SideBarLayout
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            className="transition-all duration-300"
          />
          <main
            className={`relative flex-1 justify-between items-center w-full transition-all duration-300 ${
              isSidebarOpen ? "ml-48" : "ml-20"
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
