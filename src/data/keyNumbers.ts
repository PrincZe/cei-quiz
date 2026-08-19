export interface KeyNumber {
  topic: string;
  label: string;
  value: string;
  context: string;
}

export const KEY_NUMBERS: KeyNumber[] = [
  // EA Licensing & Registration
  { topic: "earf", label: "EA Personnel registration fee", value: "$160", context: "Non-refundable, processing takes 7 working days" },
  { topic: "earf", label: "Select Licence salary threshold", value: "$4,500/month", context: "Can only place jobs above this salary" },
  { topic: "earf", label: "Recruitment records retention", value: "1 year", context: "From referral date (Condition 4f)" },
  { topic: "earf", label: "Work pass docs retention", value: "3 years", context: "Minimum retention under Condition 5(c)" },
  { topic: "earf", label: "Referral data collection threshold", value: "$3,300+ salary, 6+ months", context: "Must collect UEN, NRIC/FIN, SSOC code, referral date" },
  { topic: "earf", label: "IPA letter before departure", value: "3 days", context: "Worker must receive and keep the IPA letter" },
  { topic: "earf", label: "Unlicensed EA penalty", value: "$80,000 fine / 2 years jail", context: "Under Employment Agencies Act" },
  { topic: "earf", label: "Overcharging fees penalty", value: "$5,000 fine / 6 months jail", context: "Charging above prescribed cap" },

  // Fee Caps
  { topic: "fees", label: "Fee cap (fixed-term contract)", value: "1 month salary per year of contract", context: "Based on shorter of work pass or contract duration" },
  { topic: "fees", label: "Fee cap (no fixed term)", value: "Up to 2 months' salary", context: "Default maximum when there is no fixed contract term" },
  { topic: "fees", label: "Fee to employer", value: "No statutory cap", context: "Commercially negotiated — only worker fees are capped" },
  { topic: "fees", label: "When fees can be collected (foreign)", value: "After IPA is issued", context: "Cannot collect before placement is completed" },
  { topic: "fees", label: "When fees can be collected (local)", value: "After employment contract is signed", context: "Not before placement — no deposits before placement" },

  // Employment Act
  { topic: "ea", label: "Salary payment deadline", value: "7 days", context: "After end of salary period" },
  { topic: "ea", label: "Overtime payment deadline", value: "14 days", context: "After end of salary period for OT" },
  { topic: "ea", label: "Payment on termination", value: "Last day or within 3 working days", context: "All outstanding salary" },
  { topic: "ea", label: "Max monthly overtime", value: "72 hours", context: "For Part IV covered employees" },
  { topic: "ea", label: "Max daily working hours", value: "12 hours", context: "Including overtime, except emergencies" },
  { topic: "ea", label: "Normal weekly hours", value: "44 hours", context: "Up to 9 hrs/day (5-day week) or 8 hrs/day (6-day week)" },
  { topic: "ea", label: "Overtime rate", value: "1.5x hourly basic", context: "Minimum statutory rate" },
  { topic: "ea", label: "Part IV threshold (non-workmen)", value: "$2,600/month", context: "Basic salary cap for hours/OT/rest day protections" },
  { topic: "ea", label: "Part IV threshold (workmen)", value: "$4,500/month", context: "Basic salary cap for manual labour workers" },
  { topic: "ea", label: "Annual leave (Year 1)", value: "7 days", context: "Increases by 1 day/year, max 14 days at Year 8+" },
  { topic: "ea", label: "Sick leave (outpatient)", value: "14 days/year", context: "After 6 months of service" },
  { topic: "ea", label: "Sick leave (hospitalisation)", value: "60 days/year", context: "Inclusive of the 14 outpatient days" },
  { topic: "ea", label: "Notify employer of sick leave", value: "48 hours", context: "Employee must inform within this time" },
  { topic: "ea", label: "KETs issuance deadline", value: "14 days", context: "From start of employment (for 14+ day engagements)" },
  { topic: "ea", label: "Payslip delivery", value: "With salary or within 3 working days", context: "Must include 9 prescribed items" },
  { topic: "ea", label: "Payslip records retention", value: "2 years (current) / 1 year (former)", context: "After employee leaves" },
  { topic: "ea", label: "Max salary deduction", value: "50% of total salary", context: "In any one salary period" },
  { topic: "ea", label: "Max deduction for damage/loss", value: "25% of monthly salary", context: "Per incident" },
  { topic: "ea", label: "Public holidays per year", value: "11 days", context: "Gazetted holidays" },
  { topic: "ea", label: "Maternity leave", value: "16 weeks", context: "Government-Paid if child is SG citizen + 3 months service" },
  { topic: "ea", label: "Paternity leave (from Apr 2025)", value: "4 weeks", context: "Government-Paid, child must be SG citizen" },
  { topic: "ea", label: "Retirement age (from Jul 2026)", value: "64 years", context: "Re-employment age: 69 years" },
  { topic: "ea", label: "Notice period (5+ years service)", value: "4 weeks", context: "Default scale: <26wk=1day, 26wk-2yr=1wk, 2-5yr=2wk" },

  // WICA
  { topic: "wica", label: "WICA medical expenses cap (Nov 2025)", value: "$53,000", context: "Previously $45,000" },
  { topic: "wica", label: "WICA death compensation", value: "$91,000–$269,000", context: "Based on age and earnings" },
  { topic: "wica", label: "WICA permanent incapacity", value: "$116,000–$346,000", context: "Based on % incapacity x age multiplier" },
  { topic: "wica", label: "Insurance non-compliance penalty", value: "$10,000 fine / 12 months jail", context: "Or both" },
  { topic: "wica", label: "WICA mandatory insurance (non-manual)", value: "$2,600/month or less", context: "All manual workers covered regardless of salary" },
  { topic: "wica", label: "WICA claim deadline", value: "1 year", context: "From date of accident" },
  { topic: "wica", label: "Medical leave wages (first 14 days)", value: "Full AME", context: "Days 15–365: two-thirds AME" },

  // EFMA / Work Passes
  { topic: "efma", label: "EP minimum salary", value: "$5,600/month", context: "Financial services: $6,200 (from Sep 2023)" },
  { topic: "efma", label: "COMPASS pass mark", value: "40 points", context: "Across criteria C1–C6" },
  { topic: "efma", label: "COMPASS exemption salary", value: "$22,500/month", context: "Also exempt: intra-corporate transferees, roles ≤1 month" },
  { topic: "efma", label: "S Pass minimum salary (Sep 2025)", value: "$3,300/month", context: "Increasing to $3,600 from Jan 2027" },
  { topic: "efma", label: "S Pass levy (unified, Sep 2025)", value: "$650/month", context: "All sectors" },
  { topic: "efma", label: "S Pass dependant eligibility", value: "$6,000/month", context: "Minimum salary for Dependant's Pass" },
  { topic: "efma", label: "Illegal employment penalty", value: "$5,000–$30,000 per worker", context: "Or jail up to 12 months, or both; repeat = mandatory jail" },
  { topic: "efma", label: "False declaration penalty", value: "$20,000 fine / 2 years jail", context: "Or both, under EFMA" },
  { topic: "efma", label: "Work permit age range", value: "18–62 (can work to 64)", context: "Varies by sector and source country" },

  // PDPA
  { topic: "pdpa", label: "Data breach notification deadline", value: "3 calendar days", context: "If ≥500 individuals affected or significant harm" },
  { topic: "pdpa", label: "Breach notification threshold", value: "500 individuals", context: "Or likely to cause significant harm" },
  { topic: "pdpa", label: "Maximum PDPA penalty", value: "10% of turnover or $1 million", context: "Whichever is higher" },
  { topic: "pdpa", label: "Number of PDPA obligations", value: "11", context: "Consent, Purpose, Notification, Access, Correction, Accuracy, Protection, Retention, Transfer, Openness, Breach Notification" },

  // CPF
  { topic: "cpf", label: "CPF total rate (age ≤55)", value: "37%", context: "Employer 17% + Employee 20% (from Jan 2026)" },
  { topic: "cpf", label: "CPF OW ceiling", value: "$6,000/month", context: "Contributions computed up to this amount" },
  { topic: "cpf", label: "CPF payment due date", value: "14th of following month", context: "Enforcement action after this date" },
  { topic: "cpf", label: "CPF minimum wage for contributions", value: "$50/month", context: "$50–$500: employer only contributes" },
  { topic: "cpf", label: "Salary in lieu of notice", value: "No CPF required", context: "But salary during notice period served = CPF applies" },

  // TAFEP / FCF
  { topic: "tafep", label: "FCF advertising period", value: "14 consecutive days", context: "On MyCareersFuture before EP/S Pass application" },
  { topic: "tafep", label: "FCF debarment (minimum)", value: "12 months", context: "Maximum 24 months; covers new apps + renewals" },
  { topic: "tafep", label: "FCF false declaration penalty", value: "$20,000 fine / 2 years jail", context: "Criminal prosecution" },
];
