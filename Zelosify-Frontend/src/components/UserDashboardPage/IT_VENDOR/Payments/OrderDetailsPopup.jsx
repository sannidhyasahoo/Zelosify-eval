"use client";

import { Mail, Printer, Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/UI/shadcn/button";
import { exportContractStatement, triggerPrint } from "@/utils/exportUtils";
import { toast } from "sonner";

export default function OrderDetailsPopup({ order, onClose }) {
  const contractId = order?.id || "#192541";
  const customerName = order?.customer?.name || "Esther Howard";
  const customerInitials = order?.customer?.initials || "EH";
  const email = order?.people || "contractor@company.com";
  const total = order?.total || "$3,127.00";
  const status = order?.status || "Active";

  const handleExport = () => {
    try {
      exportContractStatement(order);
      toast.success(`Exported Statement of Work for contract ${contractId}`);
    } catch {
      toast.error("Failed to export contract statement");
    }
  };

  const handlePrint = () => {
    toast.info("Opening system print dialog...");
    triggerPrint();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in-0 duration-150">
      <div className="w-full max-w-md rounded-card-lg border border-border/80 bg-card shadow-float overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-border/70 flex items-center justify-center text-foreground">
              <FileText className="w-4 h-4 text-coral" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground font-mono">
                Contract {contractId}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Vendor Statement of Work
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-foreground space-y-4 text-xs">
          {/* Customer Info */}
          <div className="p-3.5 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted border border-border/60 flex items-center justify-center font-mono text-xs text-foreground font-medium">
                {customerInitials}
              </div>
              <div>
                <p className="font-semibold text-foreground">{customerName}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <Mail className="h-3 w-3" />
                  {email}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-medium text-[#59d499] bg-[#59d499]/10 border border-[#59d499]/25 rounded-[6px]">
              {status}
            </span>
          </div>

          {/* Contract Details */}
          <div className="space-y-2 border-t border-border/60 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Contract Number</span>
              <span className="font-mono text-foreground font-medium">{contractId}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Term Period</span>
              <span className="text-foreground">Current Billing Cycle</span>
            </div>
            <div className="flex justify-between py-1 border-t border-border/60 pt-2 text-sm font-semibold">
              <span className="text-foreground">Total Authorized:</span>
              <span className="text-foreground font-mono">{total}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3.5 border-t border-border/80 bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1.5 text-xs"
          >
            <Upload className="h-3.5 w-3.5" /> Export SOW
          </Button>
          <Button variant="default" size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
