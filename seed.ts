import type { HelpRequest, Slot, State } from "./types";

const ALL: Slot[] = ["morning", "afternoon", "evening"];

export function makeSeed(): State {
  const base = new Date(); base.setHours(0, 0, 0, 0);
  const at = (day: number, h: number, m = 0) => { const d = new Date(base); d.setDate(d.getDate() + day); d.setHours(h, m, 0, 0); return d.toISOString(); };

  const categories = [
    ["grocery", "Grocery shopping", ["shopping", "driving"]],
    ["meal", "Meal collection", ["shopping", "cooking"]],
    ["escort", "Medical appointment escort (escort only)", ["escort", "driving", "patience"]],
    ["transport", "Transport assistance", ["driving"]],
    ["errands", "Household errands", ["shopping", "organising"]],
    ["home", "Light home assistance", ["handyman", "organising"]],
    ["tech", "Technology help", ["tech"]],
    ["paperwork", "Paperwork help", ["paperwork", "translation"]],
    ["companionship", "Companionship", ["listening", "conversation"]],
    ["walking", "Walking companion", ["walking", "patience"]],
    ["befriending", "Befriending call/visit", ["listening", "conversation"]],
    ["pet", "Pet assistance", ["pets"]],
    ["activity", "Community activity escort", ["escort", "walking"]],
  ].map(([id, name, skills]) => ({ id: id as string, name: name as string, skills: skills as string[], active: true }));

  const zones = [
    { name: "Jurong", x: 0, y: 4 }, { name: "Clementi", x: 5, y: 3 }, { name: "Woodlands", x: 9, y: 16 },
    { name: "Toa Payoh", x: 13, y: 7 }, { name: "Ang Mo Kio", x: 13, y: 11 }, { name: "Bedok", x: 21, y: 5 }, { name: "Tampines", x: 23, y: 8 },
  ];

  const volunteers = [
    { id: "v1", name: "Sarah Lim", email: "sarah@ntc.demo", phone: "8123 4501", neighbourhood: "Tampines", languages: ["English", "Mandarin"], skills: ["tech", "shopping", "listening", "conversation"], transport: true, availability: { "1": ["morning", "evening"], "2": ["morning"], "3": ALL, "4": ["morning"], "6": ["morning", "afternoon"] } as Record<string, Slot[]>, interests: ["gardening", "baking"], categories: ["grocery", "tech", "companionship", "befriending"], maxKm: 8, verified: true, trained: true, active: true, joined: at(-400, 9) },
    { id: "v2", name: "Rajesh Kumar", email: "rajesh@ntc.demo", phone: "8123 4502", neighbourhood: "Jurong", languages: ["English", "Tamil", "Malay"], skills: ["driving", "paperwork", "escort", "patience"], transport: true, availability: { "1": ["afternoon"], "2": ALL, "4": ["afternoon", "evening"], "5": ["morning", "afternoon"], "0": ["morning"] } as Record<string, Slot[]>, interests: ["cricket", "history"], categories: ["transport", "escort", "paperwork", "grocery"], maxKm: 15, verified: true, trained: true, active: true, joined: at(-250, 9) },
    { id: "v3", name: "Nurul Huda", email: "nurul@ntc.demo", phone: "8123 4503", neighbourhood: "Bedok", languages: ["Malay", "English"], skills: ["listening", "conversation", "cooking", "walking"], transport: false, availability: { "1": ["morning", "afternoon"], "3": ["afternoon"], "5": ["morning"], "6": ALL } as Record<string, Slot[]>, interests: ["cooking", "crafts"], categories: ["companionship", "befriending", "meal", "walking"], maxKm: 6, verified: true, trained: true, active: true, joined: at(-180, 9) },
    { id: "v4", name: "Kenneth Goh", email: "kenneth@ntc.demo", phone: "8123 4504", neighbourhood: "Toa Payoh", languages: ["English", "Hokkien", "Mandarin"], skills: ["walking", "handyman", "organising"], transport: false, availability: { "2": ["evening"], "4": ["evening"], "6": ["morning"], "0": ["morning", "afternoon"] } as Record<string, Slot[]>, interests: ["football", "kopi"], categories: ["walking", "home", "errands"], maxKm: 5, verified: false, trained: false, active: true, joined: at(-20, 9) },
    { id: "v5", name: "Priya Nair", email: "priya@ntc.demo", phone: "8123 4505", neighbourhood: "Woodlands", languages: ["English", "Tamil"], skills: ["pets", "walking", "tech"], transport: false, availability: { "1": ALL, "3": ["morning"], "5": ["afternoon", "evening"] } as Record<string, Slot[]>, interests: ["dogs", "yoga"], categories: ["pet", "walking", "tech"], maxKm: 7, verified: true, trained: false, active: true, joined: at(-90, 9) },
    { id: "v6", name: "Chua Hui Min", email: "huimin@ntc.demo", phone: "8123 4506", neighbourhood: "Tampines", languages: ["Mandarin", "English"], skills: ["cooking", "shopping"], transport: false, availability: { "2": ["morning"] } as Record<string, Slot[]>, interests: ["mahjong"], categories: ["meal", "grocery"], maxKm: 4, verified: true, trained: true, active: false, joined: at(-600, 9) },
    { id: "v7", name: "Marcus Teo", email: "marcus@ntc.demo", phone: "8123 4507", neighbourhood: "Ang Mo Kio", languages: ["English", "Mandarin"], skills: ["driving", "escort", "organising", "tech"], transport: true, availability: { "1": ["evening"], "3": ["morning", "afternoon"], "5": ALL, "6": ["afternoon"] } as Record<string, Slot[]>, interests: ["photography"], categories: ["transport", "escort", "activity", "errands"], maxKm: 12, verified: true, trained: true, active: true, joined: at(-300, 9) },
  ];

  const residents = [
    { id: "r1", name: "Aisha Rahman", neighbourhood: "Tampines", age: 74, languages: ["Malay", "English"], phone: "9234 1101", address: "Blk 201 Tampines St 21, #05-12", interests: ["cooking", "gardening", "radio dramas"], accessibility: "Uses a walking stick; lift landing block.", lonely: true },
    { id: "r2", name: "Tan Ah Kow", neighbourhood: "Toa Payoh", age: 81, languages: ["Hokkien", "Mandarin"], phone: "9234 1102", address: "Blk 88 Lor 4 Toa Payoh, #09-33", interests: ["chess", "kopi"], accessibility: "Hard of hearing — please speak clearly.", lonely: true },
    { id: "r3", name: "Lakshmi Pillai", neighbourhood: "Jurong", age: 69, languages: ["Tamil", "English"], phone: "9234 1103", address: "Blk 350 Jurong East Ave 1, #03-02", interests: ["music", "temple visits"], accessibility: "", lonely: false },
    { id: "r4", name: "Wong Siew Lan", neighbourhood: "Bedok", age: 77, languages: ["Cantonese", "English", "Malay"], phone: "9234 1104", address: "Blk 12 Bedok North Rd, #07-45", interests: ["knitting", "dramas"], accessibility: "Wheelchair user.", lonely: true },
    { id: "r5", name: "Ismail Bakar", neighbourhood: "Woodlands", age: 72, languages: ["Malay", "English"], phone: "9234 1105", address: "Blk 780 Woodlands Cres, #11-08", interests: ["birds", "football"], accessibility: "", lonely: false },
    { id: "r6", name: "Florence Lee", neighbourhood: "Tampines", age: 85, languages: ["English", "Mandarin"], phone: "9234 1106", address: "Blk 470 Tampines St 44, #02-19", interests: ["church choir", "reading"], accessibility: "Low vision; large-print materials please.", lonely: true },
    { id: "r7", name: "Chen Wei", neighbourhood: "Ang Mo Kio", age: 66, languages: ["Mandarin", "English"], phone: "9234 1107", address: "Blk 560 Ang Mo Kio Ave 3, #06-27", interests: ["tai chi", "photography"], accessibility: "", lonely: false },
  ];

  const R = (o: Partial<HelpRequest> & Pick<HelpRequest, "id" | "residentId" | "category" | "description" | "date" | "status">): HelpRequest => {
    const res = residents.find((r) => r.id === o.residentId)!;
    return { urgency: "normal", durationMin: 60, neighbourhood: res.neighbourhood, accessibility: res.accessibility, language: res.languages[0], recurrence: "none", prefs: "", requiresVerified: true, transportNeeded: false, declined: [], createdAt: at(-3, 10), ...o };
  };
  const requests: HelpRequest[] = [
    R({ id: "q1", residentId: "r1", category: "grocery", description: "Weekly groceries from the NTUC at Tampines Hub — list will be ready.", date: at(1, 10), status: "accepted", volunteerId: "v1", recurrence: "weekly", matchedAt: at(-2, 12), language: "English" }),
    R({ id: "q2", residentId: "r1", category: "tech", description: "Help setting up video calls with my grandson on my new phone.", date: at(3, 15), status: "open", urgency: "low", language: "English", prefs: "Patient, female volunteer preferred" }),
    R({ id: "q3", residentId: "r2", category: "escort", description: "Accompany to polyclinic appointment and back (escort only).", date: at(2, 9), status: "open", urgency: "high", transportNeeded: true, language: "Hokkien" }),
    R({ id: "q4", residentId: "r3", category: "paperwork", description: "Help filling in a CPF and utilities rebate form.", date: at(0, 16), status: "accepted", volunteerId: "v2", language: "Tamil", matchedAt: at(-1, 11) }),
    R({ id: "q5", residentId: "r4", category: "companionship", description: "Afternoon tea and chat, maybe a short wheelchair stroll.", date: at(0, 14), status: "in_progress", volunteerId: "v3", language: "Malay", checkIn: at(0, 14, 5), matchedAt: at(-4, 9) }),
    R({ id: "q6", residentId: "r5", category: "pet", description: "Walk my dog Kopi while I recover from a sprained ankle.", date: at(1, 17), status: "matched", volunteerId: "v5", language: "English", matchedAt: at(0, 8) }),
    R({ id: "q7", residentId: "r6", category: "meal", description: "Collect lunch from the community kitchen.", date: at(0, 11, 30), status: "open", urgency: "urgent", language: "English", durationMin: 45 }),
    R({ id: "q8", residentId: "r7", category: "transport", description: "Ride to the community centre tai chi session.", date: at(4, 8), status: "open", transportNeeded: true, language: "Mandarin" }),
    R({ id: "q9", residentId: "r2", category: "walking", description: "Evening walk around the Toa Payoh town park.", date: at(2, 19), status: "matched", volunteerId: "v4", requiresVerified: false, language: "Hokkien", matchedAt: at(-1, 15) }),
    R({ id: "q10", residentId: "r1", category: "grocery", description: "Weekly groceries.", date: at(-6, 10), status: "completed", volunteerId: "v1", language: "English", checkIn: at(-6, 10, 2), checkOut: at(-6, 11, 10), completion: { notes: "Groceries delivered and put away.", wellbeing: "Cheerful, mentioned missing her sister.", followUp: "Suggest befriending visits." }, feedback: { rating: 5, comment: "Sarah is wonderful!" }, matchedAt: at(-9, 9), createdAt: at(-10, 9) }),
    R({ id: "q11", residentId: "r3", category: "transport", description: "Ride to temple festival.", date: at(-4, 8), status: "completed", volunteerId: "v2", language: "Tamil", transportNeeded: true, checkIn: at(-4, 7, 55), checkOut: at(-4, 10), completion: { notes: "Safe round trip.", wellbeing: "In good spirits.", followUp: "" }, matchedAt: at(-6, 9), createdAt: at(-7, 9) }),
    R({ id: "q12", residentId: "r4", category: "errands", description: "Pay bills at the post office.", date: at(-2, 10), status: "completed", volunteerId: "v3", language: "Malay", completion: { notes: "Bills paid, receipts given.", wellbeing: "Tired but fine.", followUp: "" }, checkIn: at(-2, 10), checkOut: at(-2, 11), matchedAt: at(-3, 18), createdAt: at(-4, 9) }),
    R({ id: "q13", residentId: "r6", category: "home", description: "Change a light bulb and tidy the storeroom.", date: at(-1, 15), status: "accepted", volunteerId: "v7", language: "English", matchedAt: at(-3, 12) }),
    R({ id: "q14", residentId: "r5", category: "tech", description: "Show me how to use the HealthHub app for bookings.", date: at(5, 10), status: "open", language: "English", urgency: "low" }),
    R({ id: "q15", residentId: "r7", category: "activity", description: "Escort to the photography club outing.", date: at(-8, 9), status: "cancelled", language: "Mandarin", cancelReason: "Outing postponed" }),
  ];

  const users = [
    { id: "u_coord", email: "coordinator@ntc.demo", password: "demo123", role: "coordinator" as const, name: "Mei Ling Tan", active: true },
    { id: "u_sarah", email: "sarah@ntc.demo", password: "demo123", role: "volunteer" as const, name: "Sarah Lim", personId: "v1", active: true },
    { id: "u_rajesh", email: "rajesh@ntc.demo", password: "demo123", role: "volunteer" as const, name: "Rajesh Kumar", personId: "v2", active: true },
    { id: "u_aisha", email: "aisha@ntc.demo", password: "demo123", role: "resident" as const, name: "Aisha Rahman", personId: "r1", active: true },
    { id: "u_partner", email: "partner@ntc.demo", password: "demo123", role: "partner" as const, name: "Grace Wong", personId: "p1", active: true },
    { id: "u_admin", email: "admin@ntc.demo", password: "demo123", role: "admin" as const, name: "Daniel Ong", active: true },
    { id: "u_nurul", email: "nurul@ntc.demo", password: "demo123", role: "volunteer" as const, name: "Nurul Huda", personId: "v3", active: true },
  ];

  const partners = [
    { id: "p1", name: "Tampines Community Hub", services: "Senior activity centre, meals-on-wheels, caregiver support circles", categories: ["meals", "senior activity/community centre", "caregiver support"], phone: "6781 2200", email: "hello@tampineshub.demo", neighbourhoods: ["Tampines", "Bedok"] },
    { id: "p2", name: "Westside Family Service Centre", services: "Social assistance, financial counselling, home support", categories: ["social assistance", "financial assistance", "home support"], phone: "6565 1100", email: "intake@westsidefsc.demo", neighbourhoods: ["Jurong", "Clementi"] },
    { id: "p3", name: "Heartland Rides", services: "Subsidised community transport", categories: ["transport"], phone: "6222 3300", email: "book@heartlandrides.demo", neighbourhoods: ["Jurong", "Clementi", "Toa Payoh", "Ang Mo Kio", "Woodlands", "Bedok", "Tampines"] },
    { id: "p4", name: "ActiveAgeing Northside", services: "Community exercise and strength classes", categories: ["rehabilitation/community exercise", "senior activity/community centre"], phone: "6368 4400", email: "move@activenorth.demo", neighbourhoods: ["Woodlands", "Ang Mo Kio"] },
  ];

  const referrals = [
    { id: "f1", residentId: "r1", category: "senior activity/community centre", partnerId: "p1", status: "Submitted" as const, reason: "Wants to join cooking and gardening activities to meet people.", notes: [{ at: at(-2, 10), by: "Mei Ling Tan", text: "Referral sent to hub." }], createdAt: at(-3, 10) },
    { id: "f2", residentId: "r4", category: "meals", partnerId: "p1", status: "Accepted" as const, reason: "Difficulty preparing lunch on weekdays.", notes: [{ at: at(-5, 10), by: "Grace Wong", text: "Accepted, assessing delivery slot." }], expectedStart: at(3, 12), createdAt: at(-7, 10) },
    { id: "f3", residentId: "r3", category: "financial assistance", partnerId: "p2", status: "New" as const, reason: "Asking about utilities support.", notes: [], createdAt: at(-1, 10) },
    { id: "f4", residentId: "r6", category: "caregiver support", partnerId: "p1", status: "Service Started" as const, reason: "Daughter needs caregiver support circle info.", notes: [{ at: at(-10, 10), by: "Grace Wong", text: "Daughter joined Tuesday circle." }], expectedStart: at(-9, 19), createdAt: at(-14, 10) },
    { id: "f5", residentId: "r5", category: "rehabilitation/community exercise", partnerId: "p4", status: "Closed" as const, reason: "Strength class after ankle sprain.", notes: [{ at: at(-20, 10), by: "Mei Ling Tan", text: "Completed 6-week class." }], createdAt: at(-60, 10) },
  ];

  const befriending = [
    { id: "b1", residentId: "r1", volunteerId: "v1", frequency: "Weekly", contactType: "Home visit", interests: "Cooking, gardening", lastContact: at(-6, 11), nextContact: at(1, 11, 30), wellbeing: 4, contacts: [{ at: at(-6, 11), notes: "Chatted about her garden plot.", wellbeing: 4 }, { at: at(-13, 11), notes: "Looked at old photos.", wellbeing: 3 }], active: true },
    { id: "b2", residentId: "r2", volunteerId: "v4", frequency: "Twice weekly", contactType: "Phone call", interests: "Chess", lastContact: at(-3, 18), nextContact: at(-1, 18), wellbeing: 3, contacts: [{ at: at(-3, 18), notes: "Short call, seemed tired.", wellbeing: 3 }], active: true },
    { id: "b3", residentId: "r4", volunteerId: "v3", frequency: "Weekly", contactType: "Home visit", interests: "Knitting, dramas", lastContact: at(-7, 15), nextContact: at(0, 14), wellbeing: 4, contacts: [{ at: at(-7, 15), notes: "Knitted together.", wellbeing: 4 }], active: true },
    { id: "b4", residentId: "r6", volunteerId: "v1", frequency: "Fortnightly", contactType: "Phone call", interests: "Reading", nextContact: at(2, 19), wellbeing: 2, contacts: [], active: true },
  ];

  const caregivers = [
    { id: "c1", residentId: "r1", name: "Farid Rahman", relationship: "Son", phone: "9345 2201", email: "farid@example.demo", supportNeeds: "Works shifts; wants updates when groceries are delivered.", stress: 3, preferredComm: "WhatsApp", notifyOnVisit: true, actions: [{ at: at(-5, 10), by: "Mei Ling Tan", text: "Introductory call — shared volunteer schedule." }] },
    { id: "c2", residentId: "r6", name: "Joanne Lee", relationship: "Daughter", phone: "9345 2202", email: "joanne@example.demo", supportNeeds: "Feeling stretched balancing care and work.", stress: 4, preferredComm: "Phone", notifyOnVisit: false, actions: [{ at: at(-14, 10), by: "Mei Ling Tan", text: "Referred to caregiver support circle." }] },
    { id: "c3", residentId: "r4", name: "Daniel Wong", relationship: "Nephew", phone: "9345 2203", email: "danwong@example.demo", supportNeeds: "Lives overseas; prefers monthly email summary.", stress: 2, preferredComm: "Email", notifyOnVisit: true, actions: [] },
  ];

  const events = [
    { id: "e1", title: "Tampines Park Neighbourhood Walk", category: "Neighbourhood walk", date: at(2, 8), durationMin: 90, location: "Tampines Eco Green entrance", neighbourhood: "Tampines", capacity: 20, volunteerSlots: 4, description: "Gentle 2 km walk at an easy pace with rest stops.", residentIds: ["r6"], volunteerIds: ["v1"], attended: [] },
    { id: "e2", title: "Kopi & Chat Morning", category: "Coffee session", date: at(3, 10), durationMin: 120, location: "Toa Payoh CC Level 2", neighbourhood: "Toa Payoh", capacity: 25, volunteerSlots: 3, description: "Kopi, kaya toast and friendly conversation.", residentIds: ["r2"], volunteerIds: [], attended: [] },
    { id: "e3", title: "Smartphone Basics Workshop", category: "Digital literacy", date: at(5, 14), durationMin: 120, location: "Jurong Regional Library", neighbourhood: "Jurong", capacity: 12, volunteerSlots: 4, description: "WhatsApp, video calls and scam awareness.", residentIds: ["r3", "r1"], volunteerIds: ["v2"], attended: [] },
    { id: "e4", title: "Group Trip to Giant Hypermarket", category: "Shopping trip", date: at(8, 9), durationMin: 180, location: "Bedok Mall pick-up point", neighbourhood: "Bedok", capacity: 10, volunteerSlots: 3, description: "Accessible bus trip with shopping helpers.", residentIds: [], volunteerIds: [], attended: [] },
    { id: "e5", title: "Karaoke Afternoon", category: "Social activity", date: at(-5, 15), durationMin: 120, location: "Woodlands CC Hall", neighbourhood: "Woodlands", capacity: 30, volunteerSlots: 2, description: "Classic hits and snacks.", residentIds: ["r5", "r2"], volunteerIds: ["v5"], attended: ["r5"] },
  ];

  const concerns = [
    { id: "k1", level: "Priority" as const, title: "Mr Tan seemed confused about the day", details: "During the call he thought it was Sunday twice. No immediate danger.", residentId: "r2", raisedBy: "Kenneth Goh", status: "open" as const, actions: [], createdAt: at(-1, 19) },
    { id: "k2", level: "Routine" as const, title: "Lift out of service at Blk 12 Bedok", details: "Wheelchair user unable to go out; town council informed.", residentId: "r4", raisedBy: "Nurul Huda", status: "in_progress" as const, assignee: "Mei Ling Tan", actions: [{ at: at(-2, 12), by: "Mei Ling Tan", text: "Called town council, repair ETA 2 days." }], createdAt: at(-3, 10) },
    { id: "k3", level: "Urgent" as const, title: "Food supply running low", details: "Mrs Lee mentioned her fridge is nearly empty and pension delayed.", residentId: "r6", raisedBy: "Marcus Teo", status: "open" as const, actions: [], createdAt: at(0, 8) },
    { id: "k4", level: "Routine" as const, title: "Request for large-print event flyers", details: "", residentId: "r6", raisedBy: "Florence Lee", status: "resolved" as const, assignee: "Mei Ling Tan", actions: [{ at: at(-9, 10), by: "Mei Ling Tan", text: "Printed and posted." }], createdAt: at(-12, 10) },
  ];

  const tasks = [
    { id: "t1", title: "Follow up with Mr Tan's family on confusion concern", due: at(1, 17), priority: "high" as const, assignee: "u_coord", status: "Open" as const, related: "k1" },
    { id: "t2", title: "Verify Kenneth Goh's training certificate", due: at(-1, 17), priority: "normal" as const, assignee: "u_coord", status: "In Progress" as const },
    { id: "t3", title: "Call Joanne Lee — caregiver check-in", due: at(-2, 12), priority: "normal" as const, assignee: "u_coord", status: "Open" as const, related: "c2" },
    { id: "t4", title: "Prepare flyers for Kopi & Chat", due: at(2, 12), priority: "low" as const, assignee: "u_coord", status: "Open" as const },
    { id: "t5", title: "Send monthly impact summary to partners", due: at(-6, 12), priority: "low" as const, assignee: "u_coord", status: "Done" as const },
  ];

  const notifications = [
    { id: "n1", to: "u_sarah", text: "New assignment: Grocery shopping for Aisha Rahman", at: at(-2, 12), read: false, kind: "assignment" },
    { id: "n2", to: "coordinator", text: "Urgent concern raised: Food supply running low", at: at(0, 8), read: false, kind: "concern" },
    { id: "n3", to: "u_aisha", text: "Sarah Lim accepted your grocery request", at: at(-2, 13), read: false, kind: "accepted" },
    { id: "n4", to: "u_partner", text: "New referral: Lakshmi Pillai — financial assistance", at: at(-1, 10), read: false, kind: "referral" },
    { id: "n5", to: "u_rajesh", text: "New assignment: Paperwork help for Lakshmi Pillai", at: at(-1, 11), read: true, kind: "assignment" },
  ];

  const messages = [
    { id: "m1", from: "u_coord", to: "u_sarah", text: "Hi Sarah, thanks for picking up Aisha's groceries again this week!", at: at(-2, 12) },
    { id: "m2", from: "u_sarah", to: "u_coord", text: "My pleasure. She'd love a befriending visit too.", at: at(-2, 13) },
    { id: "m3", from: "u_coord", to: "u_aisha", text: "Hello Aisha, I'm Mei Ling, your community coordinator. Message me anytime.", at: at(-10, 9) },
  ];

  const audit = [
    { id: "a1", at: at(-2, 12), by: "Mei Ling Tan", action: "Matched Sarah Lim to Grocery shopping for Aisha Rahman" },
    { id: "a2", at: at(-1, 19), by: "Kenneth Goh", action: "Raised Priority concern for Tan Ah Kow" },
    { id: "a3", at: at(0, 8), by: "Marcus Teo", action: "Raised Urgent concern for Florence Lee" },
    { id: "a4", at: at(0, 14, 5), by: "Nurul Huda", action: "Checked in for Companionship with Wong Siew Lan" },
  ];

  return {
    version: 1, users, residents, volunteers, requests, concerns, partners, referrals, befriending, caregivers, events, tasks, notifications, audit, messages,
    categories, zones,
    eventCategories: ["Neighbourhood walk", "Coffee session", "Digital literacy", "Shopping trip", "Social activity"],
    referralCategories: ["meals", "transport", "senior activity/community centre", "social assistance", "financial assistance", "home support", "rehabilitation/community exercise", "caregiver support"],
  };
}
