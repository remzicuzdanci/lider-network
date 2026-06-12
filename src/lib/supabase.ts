import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side only client — service role bypasses RLS
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Types ─────────────────────────────────────────────────────────────────────
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory =
  | "technical"
  | "billing"
  | "general"
  | "feature_request";

export interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  description: string;
  customer_name: string;
  customer_email: string;
  company: string | null;
  phone: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assigned_to: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // Internal ticket fields
  ticket_source: "internal" | "external";
  created_by_staff: string | null;
  company_id: string | null;
  company_contact_email: string | null;
}

export interface Company {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  phone: string | null;
  sector: string | null;
  notes: string | null;
  active: boolean;
  customer_type?: string | null;
  address?: string | null;
  tax_office?: string | null;
  tax_no?: string | null;
  logo_url?: string | null;
  created_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: "customer" | "admin";
  sender_name: string;
  sender_email: string;
  content: string;
  is_internal_note: boolean;
  created_at: string;
}
