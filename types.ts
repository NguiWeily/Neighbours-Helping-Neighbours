export type Role = "resident" | "volunteer" | "coordinator" | "partner" | "admin";
export type Slot = "morning" | "afternoon" | "evening";
export type Urgency = "low" | "normal" | "high" | "urgent";
export type ReqStatus = "open" | "matched" | "accepted" | "in_progress" | "completed" | "cancelled";
export type RefStatus = "New" | "Submitted" | "Accepted" | "Service Started" | "Closed";
export type ConcernLevel = "Routine" | "Priority" | "Urgent";

export interface User { id: string; email: string; password: string; role: Role; name: string; personId?: string; active: boolean; }
export interface Note { at: string; by: string; text: string; }

export interface Resident {
  id: string; name: string; neighbourhood: string; age: number; languages: string[]; phone: string;
  address: string; interests: string[]; accessibility: string; lonely: boolean;
}
export interface Volunteer {
  id: string; name: string; email: string; phone: string; neighbourhood: string; languages: string[]; skills: string[];
  transport: boolean; availability: Record<string, Slot[]>; interests: string[]; categories: string[];
  maxKm: number; verified: boolean; trained: boolean; active: boolean; joined: string;
}
export interface HelpRequest {
  id: string; residentId: string; category: string; description: string; urgency: Urgency; date: string; durationMin: number;
  neighbourhood: string; accessibility: string; language: string; recurrence: "none" | "weekly" | "fortnightly";
  prefs: string; requiresVerified: boolean; transportNeeded: boolean; status: ReqStatus; volunteerId?: string;
  declined: { volunteerId: string; reason: string }[]; checkIn?: string; checkOut?: string;
  completion?: { notes: string; wellbeing: string; followUp: string }; feedback?: { rating: number; comment: string };
  createdAt: string; matchedAt?: string; override?: string; cancelReason?: string;
}
export interface Concern {
  id: string; level: ConcernLevel; title: string; details: string; residentId?: string; raisedBy: string;
  status: "open" | "in_progress" | "resolved"; assignee?: string; actions: Note[]; createdAt: string;
}
export interface Partner { id: string; name: string; services: string; categories: string[]; phone: string; email: string; neighbourhoods: string[]; }
export interface Referral {
  id: string; residentId: string; category: string; partnerId: string; status: RefStatus; reason: string;
  notes: Note[]; expectedStart?: string; createdAt: string;
}
export interface Befriending {
  id: string; residentId: string; volunteerId: string; frequency: string; contactType: string; interests: string;
  lastContact?: string; nextContact: string; wellbeing: number; contacts: { at: string; notes: string; wellbeing: number }[];
  active: boolean;
}
export interface Caregiver {
  id: string; residentId: string; name: string; relationship: string; phone: string; email: string; supportNeeds: string;
  stress: number; preferredComm: string; notifyOnVisit: boolean; actions: Note[];
}
export interface CommunityEvent {
  id: string; title: string; category: string; date: string; durationMin: number; location: string; neighbourhood: string;
  capacity: number; volunteerSlots: number; description: string; residentIds: string[]; volunteerIds: string[]; attended: string[];
}
export interface Task {
  id: string; title: string; due: string; priority: "low" | "normal" | "high"; assignee: string; status: "Open" | "In Progress" | "Done"; related?: string;
}
export interface Notification { id: string; to: string; text: string; at: string; read: boolean; kind: string; }
export interface Audit { id: string; at: string; by: string; action: string; }
export interface Message { id: string; from: string; to: string; text: string; at: string; }
export interface Category { id: string; name: string; active: boolean; skills: string[]; }
export interface Zone { name: string; x: number; y: number; }

export interface State {
  version: number;
  users: User[]; residents: Resident[]; volunteers: Volunteer[]; requests: HelpRequest[]; concerns: Concern[];
  partners: Partner[]; referrals: Referral[]; befriending: Befriending[]; caregivers: Caregiver[]; events: CommunityEvent[];
  tasks: Task[]; notifications: Notification[]; audit: Audit[]; messages: Message[];
  categories: Category[]; zones: Zone[]; eventCategories: string[]; referralCategories: string[];
}
