import React from "react";

export default function Table({
  handleContractClick,
  handleSelectContract,
  selectedContracts,
  handleSelectAll,
  contracts,
}) {
  return (
    <div className="mt-6 bg-[#111214] border border-[#2f3031] rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#07080a] border-b border-[#1b1c1e]">
              <th className="px-6 py-3.5 w-12">
                <input
                  type="checkbox"
                  className="rounded border-[#2f3031] bg-[#111214] accent-[#ff6363] cursor-pointer"
                  checked={contracts.length > 0 && selectedContracts.length === contracts.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-3.5 text-[11px] font-mono uppercase tracking-wider text-[#9c9c9d]">
                Contract No.
              </th>
              <th className="px-6 py-3.5 text-[11px] font-mono uppercase tracking-wider text-[#9c9c9d]">
                Vendor Name
              </th>
              <th className="px-6 py-3.5 text-[11px] font-mono uppercase tracking-wider text-[#9c9c9d]">
                Type
              </th>
              <th className="px-6 py-3.5 text-[11px] font-mono uppercase tracking-wider text-[#9c9c9d]">
                Status
              </th>
              <th className="px-6 py-3.5 text-[11px] font-mono uppercase tracking-wider text-[#9c9c9d]">
                Total
              </th>
              <th className="px-6 py-3.5 text-[11px] font-mono uppercase tracking-wider text-[#9c9c9d]">
                Date
              </th>
              <th className="px-6 py-3.5 text-[11px] font-mono uppercase tracking-wider text-[#9c9c9d]">
                Approver
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b1c1e]">
            {contracts.map((contract) => (
              <tr
                key={contract.id}
                className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                onClick={() => handleContractClick(contract)}
              >
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="rounded border-[#2f3031] bg-[#111214] accent-[#ff6363] cursor-pointer"
                    checked={selectedContracts.includes(contract.id)}
                    onChange={() => handleSelectContract(contract.id)}
                  />
                </td>
                <td className="px-6 py-4 text-xs font-mono text-[#e6e6e6] group-hover:text-white">
                  {contract.id}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#1b1c1e] border border-[#2f3031] flex items-center justify-center text-[11px] font-mono font-medium text-[#e6e6e6]">
                      {contract.customer.initials}
                    </div>
                    <span className="text-sm font-medium text-white">
                      {contract.customer.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-[#9c9c9d]">
                  {contract.type}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium font-mono text-[#59d499] bg-[#59d499]/10 border border-[#59d499]/20 rounded-full">
                    {contract.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-white">
                  {contract.total}
                </td>
                <td className="px-6 py-4 text-xs font-mono text-[#9c9c9d]">
                  {contract.date}
                </td>
                <td className="px-6 py-4 text-xs text-[#9c9c9d]">
                  {contract.people}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

