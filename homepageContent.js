import {
  Category,
  Contestant,
  Event,
  EventAssignment,
  SystemSetting,
} from "../models/index.js";

export const HOMEPAGE_CONTENT_KEY = "homepage_content";

export const DEFAULT_HOMEPAGE_CONTENT = {
  brand: {
    name: "EventFair",
    subtitle: "EVENT & JUDGING MANAGEMENT",
    logo: "",
    signInLabel: "Sign in",
    signInHref: "/login",
    actionLabel: "Get started",
    actionHref: "/register",
  },
  hero: {
    eyebrow: "Event & Judging Management",
    titleLead: "Great events deserve",
    titleAccent: "fair results.",
    description:
      "Bring event setup, confidential judging, score verification, and final results together in one clear, accountable platform.",
    primaryLabel: "Create an account",
    primaryHref: "/register",
    secondaryLabel: "See how it works",
    secondaryHref: "#process",
    highlightOne: "Role-based access",
    highlightTwo: "Confidential score entry",
    highlightThree: "Auditable results",
    image: "",
  },
  sections: {
    roles: {
      visible: true,
      order: 1,
      eyebrow: "Designed for the whole team",
      title: "Every role has a clear place.",
      description: "Keep responsibilities organized from event preparation through final approval.",
      administratorTitle: "Administrator",
      administratorDescription: "Manage accounts, access roles, system settings, and activity records.",
      organizerTitle: "Event organizer",
      organizerDescription: "Coordinate events, contestants, judging criteria, and assignments.",
      judgeTitle: "Judge",
      judgeDescription: "Review assigned events and submit scores privately against clear criteria.",
      tabulatorTitle: "Tabulator",
      tabulatorDescription: "Verify submissions, compute rankings, resolve discrepancies, and report.",
    },
    process: {
      visible: true,
      order: 2,
      eyebrow: "A dependable process",
      title: "From event setup to final results.",
      description: "A clear workflow keeps every stage organized and accountable.",
      prepareLabel: "01 / PREPARE",
      prepareTitle: "Set up the event",
      prepareDescription: "Organizers define categories, contestants, criteria, and judge assignments.",
      evaluateLabel: "02 / EVALUATE",
      evaluateTitle: "Collect judge scores",
      evaluateDescription: "Judges submit their evaluations through their own dedicated workspace.",
      verifyLabel: "03 / VERIFY",
      verifyTitle: "Check and tabulate",
      verifyDescription: "Tabulators review submissions, resolve discrepancies, and compute results.",
      publishLabel: "04 / PUBLISH",
      publishTitle: "Approve final results",
      publishDescription: "Release approved rankings and reports with a clear record of the process.",
    },
    callToAction: {
      visible: true,
      order: 3,
      eyebrow: "Ready to get started?",
      title: "Run your next event with confidence.",
      description: "One organized platform for your event team and judging workflow.",
      buttonLabel: "Register as organizer",
      buttonHref: "/register",
    },
  },
};

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function getHomepageContent() {
  const setting = await SystemSetting.findOne({
    where: { settingKey: HOMEPAGE_CONTENT_KEY },
  });
  if (!setting?.settingValue) return structuredClone(DEFAULT_HOMEPAGE_CONTENT);

  const savedContent = JSON.parse(setting.settingValue);
  if (!isRecord(savedContent)) {
    throw new Error("The saved homepage content must be a JSON object.");
  }

  return {
    ...DEFAULT_HOMEPAGE_CONTENT,
    ...savedContent,
    brand: { ...DEFAULT_HOMEPAGE_CONTENT.brand, ...savedContent.brand },
    hero: { ...DEFAULT_HOMEPAGE_CONTENT.hero, ...savedContent.hero },
    sections: {
      ...DEFAULT_HOMEPAGE_CONTENT.sections,
      ...savedContent.sections,
      roles: {
        ...DEFAULT_HOMEPAGE_CONTENT.sections.roles,
        ...savedContent.sections?.roles,
      },
      process: {
        ...DEFAULT_HOMEPAGE_CONTENT.sections.process,
        ...savedContent.sections?.process,
      },
      callToAction: {
        ...DEFAULT_HOMEPAGE_CONTENT.sections.callToAction,
        ...savedContent.sections?.callToAction,
      },
    },
  };
}

export async function saveHomepageContent(content) {
  await SystemSetting.upsert({
    settingKey: HOMEPAGE_CONTENT_KEY,
    settingValue: JSON.stringify(content),
    description: "Editable public homepage content managed from the admin dashboard.",
  });
}

export async function getHomepageOverview() {
  const [event, totalEvents] = await Promise.all([
    Event.findOne({ order: [["createdAt", "DESC"], ["id", "DESC"]] }),
    Event.count(),
  ]);
  if (!event) return { totalEvents, overview: null };

  const [contestants, judges, categories] = await Promise.all([
    Contestant.count({ where: { eventId: event.id } }),
    EventAssignment.count({
      where: { eventId: event.id, assignmentRole: "judge" },
      distinct: true,
      col: "userId",
    }),
    Category.count({ where: { eventId: event.id } }),
  ]);

  return {
    totalEvents,
    overview: {
      event,
      contestants,
      judges,
      categories,
      statusLabel: event.status.replace(/_/g, " "),
    },
  };
}
