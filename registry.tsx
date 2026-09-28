import type { ComponentType } from "react";
import { LayoutDashboard, ClipboardList, Users, UserCheck, Sparkles, CalendarDays, HeartHandshake, Share2, Home as HomeIcon, PartyPopper, AlertTriangle, BarChart3, Search, ListChecks, MessageCircle, Award, User, HandHeart, Clock, Phone, Inbox, FileText, Tags, MapPin, Building2, Settings2, History, Bell } from "lucide-react";
import type { Role } from "@/lib/types";
import * as C from "./pages/coordinator";
import * as V from "./pages/volunteer";
import * as R from "./pages/resident";
import * as PA from "./pages/partner-admin";
import { NotificationsPage } from "./notifications";

export interface NavItem { slug: string; label: string; icon: ComponentType<{ className?: string }>; component: ComponentType; hidden?: boolean }

const common: NavItem[] = [{ slug: "notifications", label: "Notifications", icon: Bell, component: NotificationsPage, hidden: true }];

export const NAV: Record<Role, NavItem[]> = {
  coordinator: [
    { slug: "dashboard", label: "Dashboard", icon: LayoutDashboard, component: C.CoordDashboard },
    { slug: "requests", label: "Help Requests", icon: ClipboardList, component: C.CoordRequests },
    { slug: "people", label: "People", icon: Users, component: C.CoordPeople },
    { slug: "volunteers", label: "Volunteers", icon: UserCheck, component: C.CoordVolunteers },
    { slug: "matching", label: "Matching", icon: Sparkles, component: C.CoordMatching },
    { slug: "calendar", label: "Calendar", icon: CalendarDays, component: C.CoordCalendar },
    { slug: "befriending", label: "Befriending", icon: HeartHandshake, component: C.CoordBefriending },
    { slug: "referrals", label: "Referrals", icon: Share2, component: C.CoordReferrals },
    { slug: "caregivers", label: "Caregiver Support", icon: HomeIcon, component: C.CoordCaregivers },
    { slug: "events", label: "Community Events", icon: PartyPopper, component: C.CoordEvents },
    { slug: "concerns", label: "Concerns", icon: AlertTriangle, component: C.CoordConcerns },
    { slug: "impact", label: "Impact", icon: BarChart3, component: C.CoordImpact },
    { slug: "tasks", label: "Tasks", icon: ListChecks, component: C.CoordTasks },
    { slug: "activity", label: "Activity Log", icon: History, component: C.ActivityLog },
    ...common,
  ],
  volunteer: [
    { slug: "home", label: "Home", icon: HomeIcon, component: V.VolHome },
    { slug: "opportunities", label: "Opportunities", icon: Search, component: V.VolOpportunities },
    { slug: "my-tasks", label: "My Tasks", icon: ListChecks, component: V.VolTasks },
    { slug: "my-calendar", label: "My Calendar", icon: CalendarDays, component: V.VolCalendar },
    { slug: "my-befriending", label: "My Befriending", icon: HeartHandshake, component: V.VolBefriending },
    { slug: "messages", label: "Messages", icon: MessageCircle, component: V.VolMessages },
    { slug: "my-impact", label: "My Impact", icon: Award, component: V.VolImpact },
    { slug: "profile", label: "Profile", icon: User, component: V.VolProfile },
    ...common,
  ],
  resident: [
    { slug: "home", label: "Home", icon: HomeIcon, component: R.ResHome },
    { slug: "request-help", label: "Request Help", icon: HandHeart, component: R.ResRequestHelp },
    { slug: "my-requests", label: "My Requests", icon: ClipboardList, component: R.ResMyRequests },
    { slug: "upcoming", label: "Upcoming Help", icon: Clock, component: R.ResUpcoming },
    { slug: "community-activities", label: "Community Activities", icon: PartyPopper, component: R.ResActivities },
    { slug: "contact", label: "Contact Coordinator", icon: Phone, component: R.ResContact },
    ...common,
  ],
  partner: [
    { slug: "referrals", label: "Referrals", icon: Inbox, component: PA.PartnerReferrals },
    { slug: "service-updates", label: "Service Updates", icon: FileText, component: PA.PartnerUpdates },
    ...common,
  ],
  admin: [
    { slug: "dashboard", label: "Dashboard", icon: LayoutDashboard, component: PA.AdminDashboard },
    { slug: "users", label: "Users", icon: Users, component: PA.AdminUsers },
    { slug: "categories", label: "Categories", icon: Tags, component: PA.AdminCategories },
    { slug: "neighbourhoods", label: "Neighbourhoods", icon: MapPin, component: PA.AdminZones },
    { slug: "partners", label: "Partners", icon: Building2, component: PA.AdminPartners },
    { slug: "analytics", label: "Analytics", icon: BarChart3, component: PA.AdminAnalytics },
    { slug: "demo", label: "Demo Controls", icon: Settings2, component: PA.AdminDemo },
    { slug: "activity", label: "Audit Log", icon: History, component: C.ActivityLog, hidden: true },
    ...common,
  ],
};
export const ROLE_LABEL: Record<Role, string> = { coordinator: "Community Coordinator", volunteer: "Volunteer", resident: "Resident", partner: "Community Partner", admin: "Administrator" };
