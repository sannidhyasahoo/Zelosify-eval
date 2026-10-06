import useAuth from "@/hooks/Auth/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/UI/shadcn/dialog";
import { Button } from "@/components/UI/shadcn/button";
import { Loader2, LogOut } from "lucide-react";

export default function SignOutConfirmation({ isOpen, onCancel }) {
  const { handleLogout, handleCloseSignoutConfirmation, isSigningOut } =
    useAuth();

  const handleSignOut = async () => {
    try {
      await handleLogout({ skipConfirmationClose: true });
      if (onCancel) onCancel();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={isSigningOut ? undefined : handleCloseSignoutConfirmation}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-coral/30 bg-coral/10 text-coral">
              <LogOut className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {isSigningOut ? "Signing Out..." : "Confirm Sign Out"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-muted-foreground">
                {isSigningOut
                  ? "Please wait while we invalidate your session securely..."
                  : "Are you sure you want to end your current workspace session?"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-6 flex flex-row justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCloseSignoutConfirmation}
            disabled={isSigningOut}
            aria-label="Cancel sign out"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label="Confirm sign out"
            className="min-w-[88px]"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Signing Out
              </>
            ) : (
              "Sign Out"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
