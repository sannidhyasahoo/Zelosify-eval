"use client";
import { useState } from "react";
import { ArrowLeft, Filter, Search } from "lucide-react";
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
      e.target.checked ? contracts.map((contract) => contract.id) : []
    );
  };

  return (
    <div className="flex h-screen bg-background px-2">
      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto transition-all duration-300`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Payments</h1>
            {!isSidebarVisible && (
              <ArrowLeft
                className="cursor-pointer text-foreground"
                onClick={() => setIsSidebarVisible(true)}
              />
            )}
          </div>

          {/* Filter and Search */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border/80 bg-accent px-3.5 text-xs font-medium text-foreground shadow-key hover:border-border hover:bg-muted transition-colors">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Filter</span>
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search contracts..."
                className="field pl-9 pr-4 py-1 text-xs w-64 h-9"
              />
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
                      checked={selectedOrders.length === contracts.length}
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
                {contracts.map((contract, index) => (
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
                    <td className="px-4 py-3.5 text-xs font-semibold text-foreground">
                      {contract.total}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {contract.date}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">
                      {contract.people}
                    </td>
                  </tr>
                ))}
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
        <SelectionToolbar selectedCount={selectedOrders.length} />
      )}
    </div>
  );
}
