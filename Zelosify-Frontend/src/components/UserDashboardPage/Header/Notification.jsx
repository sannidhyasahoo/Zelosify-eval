import { X, Bell } from "lucide-react";

export default function Notification({
  notificationRef,
  setShowNotifications,
}) {
  return (
    <div
      ref={notificationRef}
      className="absolute right-6 top-14 z-50 w-80 rounded-card border border-border/80 bg-card shadow-float animate-in fade-in-0 zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between p-3.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-foreground">
            Notifications
          </h3>
        </div>
        <button
          onClick={() => setShowNotifications(false)}
          className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="max-h-[280px] overflow-y-auto divide-y divide-border/50 text-xs">
        <div className="p-3.5 hover:bg-muted/40 transition-colors">
          <div className="flex gap-2.5">
            <div className="w-1.5 h-1.5 mt-1.5 bg-[#59d499] rounded-full shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                Session Authenticated
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Connected to Bruce Wayne Corp workspace
              </p>
            </div>
          </div>
        </div>
        <div className="p-3.5 hover:bg-muted/40 transition-colors">
          <div className="flex gap-2.5">
            <div className="w-1.5 h-1.5 mt-1.5 bg-muted-foreground/60 rounded-full shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                Operational Telemetry Active
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                All deterministic matching services online
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
