"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Filter, Search, Printer, Upload, X } from "lucide-react";
import { Button } from "@/components/UI/shadcn/button";
import { exportToCSV, triggerPrint } from "@/utils/exportUtils";
import { toast } from "sonner";
import OrderDetailsPopup from "./OrderDetailsPopup";
import SelectionToolbar from "./SelectionToolbar";
import Statistics from "./Statistics";

const contracts = [
  {
    id: "#192541",
    customer: { initials: "EH", name: "Esther Howard" },
    type: "Shipping",
    status: "Active",
    total: "$3,127.00",
    date: "Jun 19",
    people: "xxx@gmail.com",
  },
  {
    id: "#192540",
    customer: { initials: "DM", name: "David Miller" },
    type: "Pickups",
    status: "Active",
    total: "$864.00",
    date: "Jun 19",
    people: "yyy@gmail.com",
  },
  {
    id: "#192539",
    customer: { initials: "JM", name: "James Moore" },
    type: "Shipping",
    status: "Active",
    total: "$1,527.00",
    date: "Jun 19",
    people: "zzz@gmail.com",
  },
  {
    id: "#192341",
    customer: { initials: "EH", name: "Esther Howard" },
    type: "Shipping",
    status: "Active",
    total: "$3,127.00",
    date: "Jun 19",
    people: "xxx@gmail.com",
  },
  {
    id: "#092540",
    customer: { initials: "DM", name: "David Miller" },
    type: "Pickups",
    status: "Active",
    total: "$864.00",
    date: "Jun 19",
    people: "yyy@gmail.com",
  },
  {
    id: "#192531",
    customer: { initials: "JM", name: "James Moore" },
    type: "Shipping",
    status: "Active",
    total: "$1,527.00",
    date: "Jun 19",
    people: "zzz@gmail.com",
  },
  {
    id: "#192571",
    customer: { initials: "EH", name: "Esther Howard" },
    type: "Shipping",
    status: "Active",
    total: "$3,127.00",
    date: "Jun 19",
    people: "xxx@gmail.com",
  },
  {
    id: "#192240",
    customer: { initials: "DM", name: "David Miller" },
    type: "Pickups",
    status: "Active",
    total: "$864.00",
    date: "Jun 19",
    people: "yyy@gmail.com",
  },
  {
    id: "#198539",
    customer: { initials: "JM", name: "James Moore" },
    type: "Shipping",
    status: "Active",
    total: "$1,527.00",
    date: "Jun 19",
    people: "zzz@gmail.com",
  },
  {
    id: "#192541",
    customer: { initials: "EH", name: "Esther Howard" },
    type: "Shipping",
    status: "Active",
    total: "$3,127.00",
    date: "Jun 19",
    people: "xxx@gmail.com",
  },
];

export default function PaymentsLayout() {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.people.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "All" || c.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [searchQuery, typeFilter]);

  const handleOrderClick = (order) => {
    setActiveOrder(order);
    setShowOrderDetails(true);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = (e) => {
    setSelectedOrders(
      e.target.checked ? filteredContracts.map((contract) => contract.id) : []
    );
  };

  const handleExportSelected = () => {
    const toExport =
      selectedOrders.length > 0
        ? filteredContracts.filter((c) => selectedOrders.includes(c.id))
        : filteredContracts;

    if (toExport.length === 0) {
      toast.error("No contracts selected to export");
      return;
    }

    try {
      exportToCSV("contracts_export.csv", toExport, [
        { label: "Contract No", key: "id" },
        { label: "Customer Name", key: (r) => r.customer?.name },
        { label: "Type", key: "type" },
        { label: "Status", key: "status" },
        { label: "Total", key: "total" },
        { label: "Date", key: "date" },
        { label: "Approver", key: "people" },
      ]);
      toast.success(`Exported ${toExport.length} contract records to CSV`);
    } catch {
      toast.error("Failed to export contract data");
    }
  };

  const handlePrint = () => {
    toast.info("Opening system print dialog...");
    triggerPrint();
  };

  return (
    <div className="flex h-screen bg-background px-2">
      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto transition-all duration-300`}>
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Payments & Ledger
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authorized vendor contract billing, requisitions and disbursements
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 text-xs gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSelected}
                className="h-8 text-xs gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Export All
              </Button>
              {!isSidebarVisible && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSidebarVisible(true)}
                  className="h-8 text-xs gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Telemetry
                </Button>
              )}
            </div>
          </div>

          {/* Filter and Search */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu((prev) => !prev)}
                className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3.5 text-xs font-medium transition-colors ${
                  typeFilter !== "All"
                    ? "border-coral/50 bg-coral/10 text-coral"
                    : "border-border/80 bg-accent text-foreground hover:border-border hover:bg-muted"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter{typeFilter !== "All" ? `: ${typeFilter}` : ""}</span>
              </button>

              {showFilterMenu && (
                <div className="absolute left-0 top-11 z-30 w-44 rounded-lg border border-border bg-card p-2 shadow-float text-xs space-y-1">
                  <p className="px-2 py-1 text-[10px] font-mono uppercase text-muted-foreground">
                    Filter by Type
                  </p>
                  {["All", "Shipping", "Pickups"].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTypeFilter(t);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded transition-colors ${
                        typeFilter === t
                          ? "bg-muted font-semibold text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contracts or vendors..."
                className="field pl-9 pr-4 py-1 text-xs w-64 h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-card border border-border/80 bg-card shadow-key overflow-hidden">
            <table className="min-w-full divide-y divide-border/60">
              <thead className="bg-muted/40">
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      className="rounded border-border/80 bg-white/[0.04]"
                      checked={
                        filteredContracts.length > 0 &&
                        selectedOrders.length === filteredContracts.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Contract No.
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Vendor name
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Approver
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                      No contracts matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract, index) => (
                    <tr
                      key={index}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => handleOrderClick(contract)}
                    >
                      <td
                        className="px-4 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-border/80 bg-white/[0.04]"
                          checked={selectedOrders.includes(contract.id)}
                          onChange={() => handleSelectOrder(contract.id)}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-foreground font-medium">
                        {contract.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-muted border border-border/60 flex items-center justify-center text-[10px] font-mono text-muted-foreground">
                            {contract.customer.initials}
                          </div>
                          <span className="text-xs text-foreground">
                            {contract.customer.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {contract.type}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 text-[11px] font-medium text-[#59d499] bg-[#59d499]/10 border border-[#59d499]/25 rounded-[6px]">
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-foreground font-mono">
                        {contract.total}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">
                        {contract.date}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">
                        {contract.people}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Statistics */}
      {isSidebarVisible && (
        <Statistics setIsSidebarVisible={setIsSidebarVisible} />
      )}

      {/* Popups and Toolbars */}
      {showOrderDetails && (
        <OrderDetailsPopup
          order={activeOrder}
          onClose={() => setShowOrderDetails(false)}
        />
      )}

      {selectedOrders.length > 0 && (
        <SelectionToolbar
          selectedCount={selectedOrders.length}
          onExport={handleExportSelected}
          onPrint={handlePrint}
          onClear={() => setSelectedOrders([])}
        />
      )}
    </div>
  );
}
