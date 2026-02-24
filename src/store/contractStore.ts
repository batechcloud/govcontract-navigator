import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Contract {
  id: string;
  title: string;
  agency: string;
  sector: string;
  value: number;
  deadline: string | null;
  naicsCode: string;
  setAside: string;
  roiScore: number;
  source: string;
  url: string;
  contractType?: string;
  location?: string;
  description?: string;
  resourceLinks?: string[];
}

interface ContractStore {
  savedContracts: Contract[];
  contractNotes: Record<string, string>;
  contractStatus: Record<string, string>;
  saveContract: (contract: Contract) => void;
  unsaveContract: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  updateStatus: (id: string, status: string) => void;
  getNote: (id: string) => string;
  getStatus: (id: string) => string;
  exportToCSV: () => void;
}

export const useContractStore = create<ContractStore>()(
  persist(
    (set, get) => ({
      savedContracts: [],
      contractNotes: {},
      contractStatus: {},

      saveContract: (contract) =>
        set((state) => ({
          savedContracts: state.savedContracts.some((c) => c.id === contract.id)
            ? state.savedContracts
            : [...state.savedContracts, contract],
        })),

      unsaveContract: (id) =>
        set((state) => ({
          savedContracts: state.savedContracts.filter((c) => c.id !== id),
        })),

      updateNote: (id, note) =>
        set((state) => ({
          contractNotes: { ...state.contractNotes, [id]: note },
        })),

      updateStatus: (id, status) =>
        set((state) => ({
          contractStatus: { ...state.contractStatus, [id]: status },
        })),

      getNote: (id) => get().contractNotes[id] || "",
      getStatus: (id) => get().contractStatus[id] || "Researching",

      exportToCSV: () => {
        const contracts = get().savedContracts;
        const notes = get().contractNotes;
        const statuses = get().contractStatus;

        const headers = [
          "Title", "Agency", "Sector", "Value", "Deadline",
          "ROI Score", "Set-Aside", "Contract Type", "Location",
          "Source", "Status", "Notes", "URL",
        ];

        const rows = contracts.map((c) => [
          `"${c.title}"`,
          `"${c.agency}"`,
          c.sector,
          c.value,
          c.deadline,
          c.roiScore,
          c.setAside,
          c.contractType || "",
          c.location || "",
          c.source,
          statuses[c.id] || "Researching",
          `"${(notes[c.id] || "").replace(/"/g, "'")}"`,
          c.url,
        ]);

        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `govcontracts_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
    }),
    { name: "govcontract-store" },
  ),
);
