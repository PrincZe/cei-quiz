export interface Topic {
  key: string;
  label: string;
}

export const TOPICS: Topic[] = [
  { key: "all", label: "All" },
  { key: "earf", label: "EARF & CEI" },
  { key: "fees", label: "EA Act & Fees" },
  { key: "ea", label: "Employment Act" },
  { key: "wica", label: "WICA" },
  { key: "efma", label: "Foreign Manpower (EFMA)" },
  { key: "fdw", label: "FDW / MDW Rules" },
  { key: "pdpa", label: "PDPA" },
  { key: "cpf", label: "CPF Act & SDL" },
  { key: "imm", label: "Immigration Act" },
  { key: "contract", label: "Contract Law" },
  { key: "comp", label: "Competition Act" },
  { key: "tafep", label: "TAFEP / FCF" },
  { key: "phta", label: "PHTA" },
  { key: "admin", label: "EA Admin Duties" },
];

export const TOPIC_LABEL: Record<string, string> = Object.fromEntries(
  TOPICS.map((t) => [t.key, t.label])
);
