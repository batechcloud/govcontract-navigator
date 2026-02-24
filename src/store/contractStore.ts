import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useContractStore = create(
  persist(
    (set, get) => ({
      savedContracts: [],
      contractNotes:  {},
      contractStatus: {},

      saveContract: (contract) =>
        set(state => ({
          savedContracts: state.savedContracts.some(c => c.id === contract.id)
            ? state.savedContracts
            : [...state.savedContracts, contract],
        })),

      unsaveContract: (id) =>
        set(state => ({
          savedContracts: state.savedContracts.filter(c => c.id !== id),
        })),

      updateNote: (id, note) =>
        set(state => ({
          contractNotes: { ...state.contractNotes, [id]: note },
        })),

      updateStatus: (id, status) =>
        set(state => ({
          contractStatus: { ...state.contractStatus, [id]: status },
        })),

      getNote:   (id) => get().contractNotes[id]  || "",
      getStatus: (id) => get().contractStatus[id] || "Researching",

      exportToCSV: () => {
        const contracts = get().savedContracts;
        const notes     = get().contractNotes;
        const statuses  = get().contractStatus;

        const headers = [
          "Title","Agency","Sector","Value","Deadline",
          "ROI Score","Set-Aside","Contract Type","Location",
          "Source","Status","Notes","URL"
        ];

        const rows = contracts.map(c => [
          `"${c.title}"`,
          `"${c.agency}"`,
          c.sector,
          c.value,
          c.deadline,
          c.roiScore,
          c.setAside,
          c.contractType || "",
          c.location     || "",
          c.source,
          statuses[c.id] || "Researching",
          `"${(notes[c.id] || "").replace(/"/g, "'")}"`,
          c.url,
        ]);

        const csv  = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `govcontracts_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
    }),
    { name: "govcontract-store" }
  )
);
