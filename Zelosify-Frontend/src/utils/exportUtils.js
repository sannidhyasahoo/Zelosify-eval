/**
 * Utility functions for exporting data to CSV and printing pages/tables cleanly.
 */

/**
 * Export an array of objects to a CSV file and trigger a browser download.
 * @param {string} filename - The name of the file to download (e.g. "contracts_export.csv")
 * @param {Array<Object>} rows - The data array
 * @param {Array<{ label: string, key: string | Function }>} columns - Column definitions
 */
export function exportToCSV(filename, rows = [], columns = []) {
  if (!rows || rows.length === 0) {
    throw new Error("No data available to export");
  }

  // Derive columns if not provided
  const cols =
    columns.length > 0
      ? columns
      : Object.keys(rows[0]).map((key) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          key,
        }));

  // Create header line
  const headerLine = cols.map((col) => `"${(col.label || "").replace(/"/g, '""')}"`).join(",");

  // Create data lines
  const dataLines = rows.map((row) =>
    cols
      .map((col) => {
        let val = typeof col.key === "function" ? col.key(row) : row[col.key];
        if (val === null || val === undefined) val = "";
        if (typeof val === "object") val = JSON.stringify(val);
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(",")
  );

  const csvContent = [headerLine, ...dataLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers browser print dialog cleanly.
 */
export function triggerPrint() {
  if (typeof window !== "undefined") {
    window.print();
  }
}

/**
 * Export a single contract statement of work as a text document download.
 * @param {Object} contract
 */
export function exportContractStatement(contract) {
  if (!contract) return;
  const content = `=====================================================
ZELOSIFY CONTRACT STATEMENT OF WORK
=====================================================
Contract ID: ${contract.id || "N/A"}
Vendor Name: ${contract.customer?.name || "N/A"}
Contact Email: ${contract.people || "N/A"}
Service Type: ${contract.type || "N/A"}
Status: ${contract.status || "Active"}
Total Value: ${contract.total || "$0.00"}
Date: ${contract.date || "N/A"}
Generated: ${new Date().toLocaleString()}
=====================================================
Status: Approved & Authorized in Zelosify System
=====================================================`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `contract_${(contract.id || "statement").replace(/[^a-zA-Z0-9_-]/g, "")}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
