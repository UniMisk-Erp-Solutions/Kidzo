import { Award, FileText, GraduationCap, School, Syringe, type LucideIcon } from "lucide-react";
import type { AllowedDocCategory } from "@/hooks/useDocuments";

export const MAX_FILE_MB = 10;
export const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

export type DocCategoryInfo = { id: AllowedDocCategory; label: string; hint: string; icon: LucideIcon; tone: string };

export const CATEGORIES: DocCategoryInfo[] = [
  { id: "birth_certificate", label: "Birth certificate", hint: "Included on every plan", icon: FileText, tone: "bg-primary/25 text-primary-deep" },
  { id: "vaccination", label: "Vaccination record", hint: "Immunisation card or log", icon: Syringe, tone: "bg-success/25 text-success" },
  { id: "marksheet", label: "Marksheet / report card", hint: "Term results and progress reports", icon: GraduationCap, tone: "bg-accent/40 text-accent-foreground" },
  { id: "school", label: "School certificate", hint: "Enrolment letter, bonafide, transfer", icon: School, tone: "bg-secondary/30 text-secondary" },
  { id: "achievement", label: "Achievement certificate", hint: "Awards, competitions, courses", icon: Award, tone: "bg-warning/25 text-warning-foreground" },
];

export const LEGACY_LABEL: Record<string, string> = {
  ssn_id: "ID document",
  passport: "Passport",
  medical: "Medical",
  other: "Other",
};

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
