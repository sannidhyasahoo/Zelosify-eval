"use client";
import { ThemeProvider } from "next-themes";
import { Provider } from "react-redux";
import { Toaster } from "@/components/UI/shadcn/sonner";
import store from "./store";
import { TooltipProvider } from "@/components/UI/shadcn/tooltip";

export default function AllProvider({ children }) {
  return (
    <Provider store={store}>
      {/* Zelosify is dark-only: lock the theme so no screen ever mixes light/dark */}
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        <Toaster />
      </ThemeProvider>
    </Provider>
  );
}
