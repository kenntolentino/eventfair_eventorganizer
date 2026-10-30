import bcrypt from "bcrypt";
import { Op } from "sequelize";
import {
  User,
  SystemSetting,
  ActivityLog,
  Event,
  Category,
  Criterion,
  EventAssignment,
  Contestant,
  ScoreSheet,
  TabulationResult,
  HomepageVideo,
  sequelize,
} from "../models/index.js";
import { logActivity } from "../utils/activity.js";
import { plain, roleLabel } from "../utils/view.js";
import {
  getHomepageContent,
  getHomepageOverview,
  HOMEPAGE_CONTENT_KEY,
  saveHomepageContent,
} from "../utils/homepageContent.js";
import {
  deleteHomepageImage,
  homepageImageDataUrl,
  saveHomepageImage,
} from "../utils/homepageImage.js";
import {
  deleteHomepageVideoFile,
  getHomepageVideos,
  parseHomepageVideoUrl,
  validateHomepageVideoFile,
} from "../utils/homepageVideo.js";

const ROLES = [
  {
    value: "admin",
    label: "Administrator",
    description: "System access, accounts, configuration, event oversight, and audit records.",
  },
  {
    value: "event_organizer",
    label: "Event Organizer",
    description: "Event setup, contestants, judging criteria, official assignments, and publishing.",
  },
  {
    value: "judge",
    label: "Judge",
    description: "Assigned events, judging criteria, and contestant score submission.",
  },
  {
    value: "tabulator",
    label: "Tabulator",
    description: "Score submission checks, computation, discrepancies, and tabulation reports.",
  },
];
const EVENT_STATUSES = ["draft", "scheduled", "ongoing", "judging", "tabulated", "published", "archived"];
const SCORING_FORMULAS = ["average_weighted", "sum_weighted"];
const EVENT_STATUS_CHART = [
  { value: "draft", label: "Draft", color: "bg-slate-400" },
  { value: "scheduled", label: "Scheduled", color: "bg-blue-500" },
  { value: "ongoing", label: "Ongoing", color: "bg-emerald-500" },
  { value: "judging", label: "Judging", color: "bg-violet-500" },
  { value: "tabulated", label: "Tabulated", color: "bg-amber-500" },
  { value: "published", label: "Published", color: "bg-teal-600" },
  { value: "archived", label: "Archived", color: "bg-slate-600" },
];
const ROLE_CHART_COLORS = ["bg-blue-600", "bg-violet-600", "bg-emerald-600", "bg-amber-500"];
const ARCHIVABLE_MODELS = {
  users: { model: User, label: "User account", nameField: "name" },
  events: { model: Event, label: "Event", nameField: "name" },
  settings: { model: SystemSetting, label: "System setting", nameField: "settingKey" },
  videos: { model: HomepageVideo, label: "Homepage video", nameField: "title" },
};
const HOMEPAGE_TEXT_FIELDS = [
  ["brandName", ["brand", "name"], 60, true],
  ["brandSubtitle", ["brand", "subtitle"], 80, true],
  ["brandSignInLabel", ["brand", "signInLabel"], 50, true],
  ["brandSignInHref", ["brand", "signInHref"], 255, true],
  ["brandActionLabel", ["brand", "actionLabel"], 50, true],
  ["brandActionHref", ["brand", "actionHref"], 255, true],
  ["heroEyebrow", ["hero", "eyebrow"], 100, true],
  ["heroTitleLead", ["hero", "titleLead"], 100, true],
  ["heroTitleAccent", ["hero", "titleAccent"], 100, true],
  ["heroDescription", ["hero", "description"], 600, true],
  ["heroPrimaryLabel", ["hero", "primaryLabel"], 50, true],
  ["heroPrimaryHref", ["hero", "primaryHref"], 255, true],
  ["heroSecondaryLabel", ["hero", "secondaryLabel"], 50, true],
  ["heroSecondaryHref", ["hero", "secondaryHref"], 255, true],
  ["heroHighlightOne", ["hero", "highlightOne"], 60, true],
  ["heroHighlightTwo", ["hero", "highlightTwo"], 60, true],
  ["heroHighlightThree", ["hero", "highlightThree"], 60, true],
  ["rolesEyebrow", ["sections", "roles", "eyebrow"], 100, true],
  ["rolesTitle", ["sections", "roles", "title"], 120, true],
  ["rolesDescription", ["sections", "roles", "description"], 400, false],
  ["rolesAdministratorTitle", ["sections", "roles", "administratorTitle"], 60, true],
  ["rolesAdministratorDescription", ["sections", "roles", "administratorDescription"], 250, true],
  ["rolesOrganizerTitle", ["sections", "roles", "organizerTitle"], 60, true],
  ["rolesOrganizerDescription", ["sections", "roles", "organizerDescription"], 250, true],
  ["rolesJudgeTitle", ["sections", "roles", "judgeTitle"], 60, true],
  ["rolesJudgeDescription", ["sections", "roles", "judgeDescription"], 250, true],
  ["rolesTabulatorTitle", ["sections", "roles", "tabulatorTitle"], 60, true],
  ["rolesTabulatorDescription", ["sections", "roles", "tabulatorDescription"], 250, true],
  ["processEyebrow", ["sections", "process", "eyebrow"], 100, true],
  ["processTitle", ["sections", "process", "title"], 120, true],
  ["processDescription", ["sections", "process", "description"], 400, false],
  ["processPrepareLabel", ["sections", "process", "prepareLabel"], 40, true],
  ["processPrepareTitle", ["sections", "process", "prepareTitle"], 80, true],
  ["processPrepareDescription", ["sections", "process", "prepareDescription"], 250, true],
  ["processEvaluateLabel", ["sections", "process", "evaluateLabel"], 40, true],
  ["processEvaluateTitle", ["sections", "process", "evaluateTitle"], 80, true],
  ["processEvaluateDescription", ["sections", "process", "evaluateDescription"], 250, true],
  ["processVerifyLabel", ["sections", "process", "verifyLabel"], 40, true],
  ["processVerifyTitle", ["sections", "process", "verifyTitle"], 80, true],
  ["processVerifyDescription", ["sections", "process", "verifyDescription"], 250, true],
  ["processPublishLabel", ["sections", "process", "publishLabel"], 40, true],
  ["processPublishTitle", ["sections", "process", "publishTitle"], 80, true],
  ["processPublishDescription", ["sections", "process", "publishDescription"], 250, true],
  ["ctaEyebrow", ["sections", "callToAction", "eyebrow"], 100, true],
  ["ctaTitle", ["sections", "callToAction", "title"], 120, true],
  ["ctaDescription", ["sections", "callToAction", "description"], 400, false],
  ["ctaButtonLabel", ["sections", "callToAction", "buttonLabel"], 50, true],
  ["ctaButtonHref", ["sections", "callToAction", "buttonHref"], 255, true],
];

function setNestedValue(target, path, value) {
  let node = target;
  for (const key of path.slice(0, -1)) node = node[key];
  node[path[path.length - 1]] = value;
}

function validHomepageHref(value) {
  if (value.startsWith("#")) return value.length > 1 && !/[\s\\]/.test(value);
  if (value.startsWith("/") && !value.startsWith("//")) return !/[\u0000-\u001f\\]/.test(value);
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function homepageFormContent(body, current) {
  const content = structuredClone(current);
  for (const [fieldName, path, maxLength, required] of HOMEPAGE_TEXT_FIELDS) {
    const value = typeof body[fieldName] === "string" ? body[fieldName].trim() : "";
    if (required && !value) return { error: `${fieldName} is required.` };
    if (value.length > maxLength) return { error: `${fieldName} must be ${maxLength} characters or fewer.` };
    if (path[path.length - 1].endsWith("Href") && !validHomepageHref(value)) {
      return { error: `${fieldName} must be a site path, section link, or secure HTTPS URL.` };
    }
    setNestedValue(content, path, value);
  }

  const sectionOrders = [];
  for (const section of ["roles", "process", "callToAction"]) {
    const order = Number(body[`${section}Order`]);
    if (!Number.isInteger(order) || order < 1 || order > 3) {
      return { error: "Section display order must be a unique number from 1 to 3." };
    }
    sectionOrders.push(order);
    content.sections[section].visible = body[`${section}Visible`] === "true";
    content.sections[section].order = order;
  }
  if (new Set(sectionOrders).size !== sectionOrders.length) {
    return { error: "Each homepage section must have a different display order." };
  }
  return { content };
}

function eventFormError(body) {
  if (typeof body.name !== "string" || !body.name.trim()) return "An event name is required.";
  if (body.status && !EVENT_STATUSES.includes(body.status)) return "Select a valid event status.";
  if (body.scoringFormula && !SCORING_FORMULAS.includes(body.scoringFormula)) {
    return "Select a valid scoring formula.";
  }
  if (
    body.startDate &&
    body.endDate &&
    body.startDate > body.endDate
  ) {
    return "The event end date cannot be earlier than its start date.";
  }
  return null;
}

function csvCell(value) {
  const text = String(value ?? "");
  const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

export const adminController = {
  dashboard: async (req, res) => {
    const roleCountsPromise = Promise.all(
      ROLES.map((role) => User.count({ where: { role: role.value } }))
    );
    const [
      users,
      activeUsers,
      inactiveUsers,
      events,
      activeEvents,
      publishedEvents,
      settingsCount,
      logs,
      recentEvents,
      roleCounts,
      eventStatusCounts,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { status: "active" } }),
      User.count({ where: { status: "inactive" } }),
      Event.count(),
      Event.count({ where: { status: { [Op.in]: ["scheduled", "ongoing", "judging"] } } }),
      Event.count({ where: { status: "published" } }),
      SystemSetting.count({ where: { settingKey: { [Op.ne]: HOMEPAGE_CONTENT_KEY } } }),
      ActivityLog.findAll({
        include: [{ model: User, as: "actor" }],
        order: [["createdAt", "DESC"]],
        limit: 6,
      }),
      Event.findAll({
        include: [{ model: User, as: "organizer" }],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
      roleCountsPromise,
      Promise.all(
        EVENT_STATUS_CHART.map((status) =>
          Event.count({ where: { status: status.value } })
        )
      ),
    ]);
    const roles = ROLES.map((role, index) => ({
      ...role,
      count: roleCounts[index],
      share: users ? Math.round((roleCounts[index] / users) * 100) : 0,
      color: ROLE_CHART_COLORS[index],
    }));
    const eventStatusChart = EVENT_STATUS_CHART.map((status, index) => ({
      ...status,
      count: eventStatusCounts[index],
      share: events ? Math.round((eventStatusCounts[index] / events) * 100) : 0,
    }));

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      nav: "dashboard",
      stats: {
        users,
        events,
        activeUsers,
        inactiveUsers,
        activeEvents,
        publishedEvents,
        settingsCount,
      },
      roles,
      eventStatusChart,
      logs: plain(logs),
      recentEvents: plain(recentEvents),
      roleLabel,
    });
  },

  scoringConfiguration: async (req, res) => {
    const events = plain(await Event.findAll({
      include: [
        { model: Category },
        { model: Criterion, include: [{ model: Category }] },
      ],
      order: [["name", "ASC"]],
    }));
    const configurations = events.flatMap((event) => {
      const categories = event.Categories.length
        ? event.Categories
        : [{ id: null, name: "Event-wide" }];
      return categories.map((category) => {
        const criteria = event.Criteria.filter(
          (criterion) => !criterion.categoryId || criterion.categoryId === category.id
        );
        const totalWeight = criteria.reduce(
          (total, criterion) => total + Number(criterion.weightPercentage || 0),
          0
        );
        return {
          eventName: event.name,
          categoryName: category.name,
          criteria,
          totalWeight: totalWeight.toFixed(2),
          isValid: Math.abs(totalWeight - 100) < 0.01,
          scoringFormula: event.scoringFormula,
          status: event.status,
        };
      });
    });

    res.render("admin/scoring-configuration", {
      title: "Scoring Configuration",
      nav: "scoring",
      configurations,
    });
  },

  reports: async (req, res) => {
    const status = EVENT_STATUS_CHART.some((item) => item.value === req.query.status)
      ? req.query.status
      : "";
    const events = await Event.findAll({
      where: status ? { status } : {},
      order: [["startDate", "DESC"], ["name", "ASC"]],
    });
    const eventIds = events.map((event) => event.id);
    const [judgeCounts, contestantCounts, sheetCounts, resultCounts] = eventIds.length
      ? await Promise.all([
        EventAssignment.count({
          where: { eventId: { [Op.in]: eventIds }, assignmentRole: "judge" },
          group: ["eventId"],
        }),
        Contestant.count({
          where: { eventId: { [Op.in]: eventIds } },
          group: ["eventId"],
        }),
        ScoreSheet.count({
          where: { eventId: { [Op.in]: eventIds } },
          group: ["eventId", "status"],
        }),
        TabulationResult.count({
          where: { eventId: { [Op.in]: eventIds }, status: "verified" },
          group: ["eventId"],
        }),
      ])
      : [[], [], [], []];
    const countMap = (counts) =>
      new Map(counts.map((item) => [Number(item.eventId), Number(item.count)]));
    const judgesByEvent = countMap(judgeCounts);
    const contestantsByEvent = countMap(contestantCounts);
    const resultsByEvent = countMap(resultCounts);
    const submittedByEvent = new Map(
      sheetCounts
        .filter((item) => item.status === "submitted")
        .map((item) => [Number(item.eventId), Number(item.count)])
    );
    const draftsByEvent = new Map(
      sheetCounts
        .filter((item) => item.status === "draft")
        .map((item) => [Number(item.eventId), Number(item.count)])
    );
    const rows = events.map((event) => {
      const judges = judgesByEvent.get(event.id) || 0;
      const contestants = contestantsByEvent.get(event.id) || 0;
      return {
        id: event.id,
        name: event.name,
        status: event.status,
        startDate: event.startDate,
        judges,
        contestants,
        expectedSheets: judges * contestants,
        submittedSheets: submittedByEvent.get(event.id) || 0,
        draftSheets: draftsByEvent.get(event.id) || 0,
        verifiedResults: resultsByEvent.get(event.id) || 0,
      };
    });

    if (req.query.format === "csv") {
      const headers = [
        "Event",
        "Status",
        "Start date",
        "Assigned judges",
        "Contestants",
        "Expected score sheets",
        "Submitted score sheets",
        "Draft score sheets",
        "Verified results",
      ];
      const lines = [
        headers.map(csvCell).join(","),
        ...rows.map((row) =>
          [
            row.name,
            row.status,
            row.startDate || "",
            row.judges,
            row.contestants,
            row.expectedSheets,
            row.submittedSheets,
            row.draftSheets,
            row.verifiedResults,
          ].map(csvCell).join(",")
        ),
      ];
      const date = new Date().toISOString().slice(0, 10);
      res.set("Content-Type", "text/csv; charset=utf-8");
      res.set("Content-Disposition", `attachment; filename="eventfair-admin-report-${date}.csv"`);
      return res.send(`\uFEFF${lines.join("\r\n")}`);
    }

    const roleCounts = await Promise.all(
      ROLES.map(async (role) => ({
        label: role.label,
        count: await User.count({ where: { role: role.value } }),
      }))
    );
    res.render("admin/reports", {
      title: "Reports & Analytics",
      nav: "reports",
      events: rows,
      statuses: EVENT_STATUS_CHART,
      filters: { status },
      roleCounts,
      stats: {
        users: roleCounts.reduce((total, role) => total + role.count, 0),
        events: rows.length,
        submittedSheets: rows.reduce((total, row) => total + row.submittedSheets, 0),
        verifiedResults: rows.reduce((total, row) => total + row.verifiedResults, 0),
      },
    });
  },

  maintenance: async (req, res) => {
    const checkedAt = new Date();
    let databaseStatus = "Connected";
    let databaseError = "";
    try {
      await sequelize.authenticate();
    } catch (error) {
      databaseStatus = "Connection failed";
      databaseError = error.message;
    }
    res.render("admin/maintenance", {
      title: "System Health & Maintenance",
      nav: "maintenance",
      databaseStatus,
      databaseError,
      checkedAt,
      nodeVersion: process.version,
      uptimeHours: (process.uptime() / 3600).toFixed(1),
    });
  },

  users: async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const role = ROLES.some((item) => item.value === req.query.role) ? req.query.role : "";
    const status = ["active", "inactive"].includes(req.query.status) ? req.query.status : "";
    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { organization: { [Op.like]: `%${q}%` } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, totalUsers, activeUsers, roleCounts] = await Promise.all([
      User.findAll({ where, order: [["createdAt", "DESC"]] }),
      User.count(),
      User.count({ where: { status: "active" } }),
      Promise.all(ROLES.map((item) => User.count({ where: { role: item.value } }))),
    ]);
    res.render("admin/users", {
      title: "User Accounts",
      nav: "users",
      users: plain(users).map((user) => ({ ...user, roleName: roleLabel(user.role) })),
      roles: ROLES.map((item, index) => ({ ...item, count: roleCounts[index] })),
      filters: { q, role, status },
      stats: { total: totalUsers, shown: users.length, active: activeUsers },
    });
  },

  createUser: async (req, res) => {
    const { name, password, phone, organization } = req.body;
    const email = String(req.body.email || "").trim().toLowerCase();
    const role = req.body.role;
    const status = req.body.status || "active";
    if (!name?.trim() || !email || !ROLES.some((item) => item.value === role)) {
      req.flash("error_msg", "Name, email, and a valid role are required.");
      return res.redirect("/admin/users");
    }
    if (typeof password !== "string" || password.length < 8) {
      req.flash("error_msg", "A password with at least 8 characters is required.");
      return res.redirect("/admin/users");
    }
    if (!["active", "inactive"].includes(status)) {
      req.flash("error_msg", "Select a valid account status.");
      return res.redirect("/admin/users");
    }
    const existing = await User.findOne({ where: { email }, paranoid: false });
    if (existing) {
      req.flash(
        "error_msg",
        existing.deletedAt
          ? "That email belongs to an archived account. Restore it from the archive first."
          : "A user with that email already exists."
      );
      return res.redirect("/admin/users");
    }

    await User.create({
      name: name.trim(),
      email,
      password: await bcrypt.hash(password, 10),
      role,
      phone,
      organization,
      status: status || "active",
    });

    await logActivity(req, "Created user", "User Accounts", `Created ${email} as ${role}.`);
    req.flash("success_msg", "User account created.");
    res.redirect("/admin/users");
  },

  updateUser: async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/admin/users");
    }

    const { name, password, phone, organization } = req.body;
    const email = String(req.body.email || "").trim().toLowerCase();
    const role = req.body.role;
    const status = req.body.status;
    if (!name?.trim() || !email || !ROLES.some((item) => item.value === role)) {
      req.flash("error_msg", "Name, email, and a valid role are required.");
      return res.redirect("/admin/users");
    }
    if (password && password.length < 8) {
      req.flash("error_msg", "Passwords must contain at least 8 characters.");
      return res.redirect("/admin/users");
    }
    const duplicate = await User.findOne({
      where: { email, id: { [Op.ne]: user.id } },
      paranoid: false,
    });
    if (duplicate) {
      req.flash(
        "error_msg",
        duplicate.deletedAt
          ? "That email belongs to an archived account. Restore it from the archive first."
          : "A user with that email already exists."
      );
      return res.redirect("/admin/users");
    }
    if (status && !["active", "inactive"].includes(status)) {
      req.flash("error_msg", "Select a valid account status.");
      return res.redirect("/admin/users");
    }
    if (user.id === req.user.id && status === "inactive") {
      req.flash("error_msg", "You cannot deactivate your own account.");
      return res.redirect("/admin/users");
    }
    if (user.id === req.user.id && role !== "admin") {
      req.flash("error_msg", "You cannot remove the administrator role from your own account.");
      return res.redirect("/admin/users");
    }
    user.name = name.trim();
    user.email = email;
    user.role = role;
    user.phone = phone;
    user.organization = organization;
    user.status = status || user.status;
    if (password) user.password = await bcrypt.hash(password, 10);
    await user.save();

    await logActivity(req, "Updated user", "User Accounts", `Updated ${user.email}.`);
    req.flash("success_msg", "User account updated.");
    res.redirect("/admin/users");
  },

  toggleUser: async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/admin/users");
    }
    if (user.id === req.user.id) {
      req.flash("error_msg", "You cannot deactivate your own account.");
      return res.redirect("/admin/users");
    }

    user.status = user.status === "active" ? "inactive" : "active";
    await user.save();
    await logActivity(req, "Toggled user status", "User Accounts", `${user.email} is now ${user.status}.`);
    req.flash("success_msg", `User is now ${user.status}.`);
    res.redirect("/admin/users");
  },

  deleteUser: async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/admin/users");
    }
    if (user.id === req.user.id) {
      req.flash("error_msg", "You cannot delete your own account.");
      return res.redirect("/admin/users");
    }

    await user.destroy();
    await logActivity(req, "Archived user", "User Accounts", `Archived ${user.email}.`);
    req.flash("success_msg", "User account moved to the archive.");
    res.redirect("/admin/users");
  },

  restoreArchivedRecord: async (req, res) => {
    const definition = ARCHIVABLE_MODELS[req.params.type];
    const id = Number(req.params.id);
    if (!definition || !Number.isInteger(id) || id < 1) {
      req.flash("error_msg", "Select a valid archived record to restore.");
      return res.redirect("/admin/archive");
    }

    const record = await definition.model.findByPk(id, { paranoid: false });
    if (!record?.deletedAt) {
      req.flash("error_msg", "That archived record could not be found.");
      return res.redirect("/admin/archive");
    }

    await record.restore();
    const name = record[definition.nameField];
    await logActivity(
      req,
      `Restored ${definition.label.toLowerCase()}`,
      "Archive",
      String(name)
    );
    req.flash("success_msg", `${definition.label} restored successfully.`);
    res.redirect("/admin/archive");
  },

  homepage: async (_req, res) => {
    const [content, homepageVideos] = await Promise.all([
      getHomepageContent(),
      getHomepageVideos(),
    ]);
    res.render("admin/homepage", {
      title: "Homepage Content",
      nav: "homepage",
      content,
      homepageVideos,
    });
  },

  previewHomepage: async (req, res) => {
    const current = await getHomepageContent();
    const result = homepageFormContent(req.body, current);
    if (result.error) {
      req.flash("error_msg", result.error);
      return res.redirect("/admin/homepage");
    }

    const heroImage = req.files?.heroImage?.[0];
    const brandLogo = req.files?.brandLogo?.[0];
    try {
      if (heroImage) result.content.hero.image = homepageImageDataUrl(heroImage);
      else if (req.body.removeHeroImage === "true") result.content.hero.image = "";
      if (brandLogo) result.content.brand.logo = homepageImageDataUrl(brandLogo);
      else if (req.body.removeBrandLogo === "true") result.content.brand.logo = "";
    } catch (error) {
      if (error.code !== "INVALID_HOMEPAGE_IMAGE") throw error;
      req.flash("error_msg", error.message);
      return res.redirect("/admin/homepage");
    }

    const [overview, homepageVideos] = await Promise.all([
      getHomepageOverview(),
      getHomepageVideos(),
    ]);
    res.render("home", {
      title: `${result.content.brand.name} | ${result.content.brand.subtitle}`,
      content: result.content,
      homepageVideos,
      ...overview,
      previewMode: true,
    });
  },

  createHomepageVideo: async (req, res) => {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const description = typeof req.body.description === "string"
      ? req.body.description.trim()
      : "";
    const uploadedFile = req.file;
    const submittedVideoUrl = typeof req.body.videoUrl === "string"
      ? req.body.videoUrl.trim()
      : "";

    if (uploadedFile && submittedVideoUrl) {
      await deleteHomepageVideoFile(`/uploads/homepage-videos/${uploadedFile.filename}`);
      req.flash("error_msg", "Choose either a video file or a video link, not both.");
      return res.redirect("/admin/homepage");
    }

    const parsedUrl = uploadedFile ? null : parseHomepageVideoUrl(submittedVideoUrl);

    if (!title || title.length > 120) {
      if (uploadedFile) {
        await deleteHomepageVideoFile(`/uploads/homepage-videos/${uploadedFile.filename}`);
      }
      req.flash("error_msg", "Enter a video title of 1 to 120 characters.");
      return res.redirect("/admin/homepage");
    }
    if (description.length > 1000) {
      if (uploadedFile) {
        await deleteHomepageVideoFile(`/uploads/homepage-videos/${uploadedFile.filename}`);
      }
      req.flash("error_msg", "The video description must be 1,000 characters or fewer.");
      return res.redirect("/admin/homepage");
    }
    if (!uploadedFile && !parsedUrl) {
      req.flash("error_msg", "Choose an MP4/WebM video file or enter a valid HTTPS YouTube/Vimeo link.");
      return res.redirect("/admin/homepage");
    }

    if (uploadedFile) {
      let isValidVideo;
      try {
        isValidVideo = await validateHomepageVideoFile(uploadedFile);
      } catch (error) {
        await deleteHomepageVideoFile(`/uploads/homepage-videos/${uploadedFile.filename}`);
        throw error;
      }
      if (!isValidVideo) {
        await deleteHomepageVideoFile(`/uploads/homepage-videos/${uploadedFile.filename}`);
        req.flash("error_msg", "The uploaded file is not a valid MP4 or WebM video.");
        return res.redirect("/admin/homepage");
      }
    }

    const videoUrl = uploadedFile
      ? `/uploads/homepage-videos/${uploadedFile.filename}`
      : parsedUrl.videoUrl;
    try {
      await HomepageVideo.create({
        title,
        description: description || null,
        videoUrl,
      });
    } catch (error) {
      if (uploadedFile) await deleteHomepageVideoFile(videoUrl);
      throw error;
    }
    await logActivity(req, "Added homepage video", "Website Content", title);
    req.flash("success_msg", "Video trailer added to the homepage.");
    res.redirect("/admin/homepage");
  },

  deleteHomepageVideo: async (req, res) => {
    const video = await HomepageVideo.findByPk(req.params.id);
    if (!video) {
      req.flash("error_msg", "Homepage video not found.");
      return res.redirect("/admin/homepage");
    }

    const title = video.title;
    await video.destroy();
    await logActivity(req, "Archived homepage video", "Website Content", title);
    req.flash("success_msg", "Video trailer moved to the archive.");
    res.redirect("/admin/homepage");
  },

  updateHomepage: async (req, res) => {
    const current = await getHomepageContent();
    const result = homepageFormContent(req.body, current);
    if (result.error) {
      req.flash("error_msg", result.error);
      return res.redirect("/admin/homepage");
    }

    const heroImage = req.files?.heroImage?.[0];
    const brandLogo = req.files?.brandLogo?.[0];
    const newImages = [];
    try {
      if (heroImage) {
        result.content.hero.image = await saveHomepageImage(heroImage);
        newImages.push(result.content.hero.image);
      } else if (req.body.removeHeroImage === "true") {
        result.content.hero.image = "";
      }

      if (brandLogo) {
        result.content.brand.logo = await saveHomepageImage(brandLogo);
        newImages.push(result.content.brand.logo);
      } else if (req.body.removeBrandLogo === "true") {
        result.content.brand.logo = "";
      }

      await saveHomepageContent(result.content);
    } catch (error) {
      await Promise.all(newImages.map((imageUrl) => deleteHomepageImage(imageUrl)));
      if (error.code === "INVALID_HOMEPAGE_IMAGE") {
        req.flash("error_msg", error.message);
        return res.redirect("/admin/homepage");
      }
      throw error;
    }

    const replacedImages = [
      current.hero.image !== result.content.hero.image ? current.hero.image : "",
      current.brand.logo !== result.content.brand.logo ? current.brand.logo : "",
    ].filter(Boolean);
    await Promise.all(replacedImages.map((imageUrl) => deleteHomepageImage(imageUrl)));
    await logActivity(req, "Updated homepage content", "Website Content", "Published homepage content changes.");
    req.flash("success_msg", "Homepage content saved and published.");
    res.redirect("/admin/homepage");
  },

  settings: async (req, res) => {
    const [settings, archivedGroups] = await Promise.all([
      SystemSetting.findAll({
        where: { settingKey: { [Op.ne]: HOMEPAGE_CONTENT_KEY } },
        order: [["settingKey", "ASC"]],
      }),
      Promise.all(
        Object.entries(ARCHIVABLE_MODELS).map(async ([type, definition]) => {
          const records = await definition.model.findAll({
            paranoid: false,
            where: { deletedAt: { [Op.ne]: null } },
            attributes: ["id", definition.nameField, "deletedAt"],
            order: [["deletedAt", "DESC"]],
          });
          return plain(records).map((record) => ({
            id: record.id,
            type,
            typeLabel: definition.label,
            name: record[definition.nameField],
            deletedAt: record.deletedAt,
          }));
        })
      ),
    ]);
    res.render("admin/settings", {
      title: "System Settings",
      nav: "settings",
      systemSettings: plain(settings),
      archivedRecords: archivedGroups.flat().sort(
        (left, right) => new Date(right.deletedAt) - new Date(left.deletedAt)
      ),
    });
  },

  createSetting: async (req, res) => {
    const settingKey = typeof req.body.settingKey === "string" ? req.body.settingKey.trim() : "";
    const { settingValue, description } = req.body;
    if (!settingKey) {
      req.flash("error_msg", "A setting key is required.");
      return res.redirect("/admin/settings");
    }
    if (settingKey === HOMEPAGE_CONTENT_KEY) {
      req.flash("error_msg", "Homepage content is managed from the Homepage Content page.");
      return res.redirect("/admin/settings");
    }
    const existing = await SystemSetting.findOne({
      where: { settingKey },
      paranoid: false,
    });
    if (existing) {
      req.flash(
        "error_msg",
        existing.deletedAt
          ? "That setting key is archived. Restore it from the archive first."
          : "That setting key already exists."
      );
      return res.redirect("/admin/settings");
    }
    await SystemSetting.create({ settingKey, settingValue, description });
    await logActivity(req, "Created setting", "System Settings", settingKey);
    req.flash("success_msg", "Setting added.");
    res.redirect("/admin/settings");
  },

  updateSetting: async (req, res) => {
    const setting = await SystemSetting.findByPk(req.params.id);
    if (!setting) {
      req.flash("error_msg", "Setting not found.");
      return res.redirect("/admin/settings");
    }
    const settingKey = typeof req.body.settingKey === "string" ? req.body.settingKey.trim() : "";
    if (!settingKey) {
      req.flash("error_msg", "A setting key is required.");
      return res.redirect("/admin/settings");
    }
    if (settingKey === HOMEPAGE_CONTENT_KEY || setting.settingKey === HOMEPAGE_CONTENT_KEY) {
      req.flash("error_msg", "Homepage content is managed from the Homepage Content page.");
      return res.redirect("/admin/settings");
    }
    const duplicate = await SystemSetting.findOne({
      where: { settingKey, id: { [Op.ne]: setting.id } },
      paranoid: false,
    });
    if (duplicate) {
      req.flash(
        "error_msg",
        duplicate.deletedAt
          ? "That setting key is archived. Restore it from the archive first."
          : "That setting key already exists."
      );
      return res.redirect("/admin/settings");
    }
    setting.settingKey = settingKey;
    setting.settingValue = req.body.settingValue;
    setting.description = req.body.description;
    await setting.save();
    await logActivity(req, "Updated setting", "System Settings", setting.settingKey);
    req.flash("success_msg", "Setting updated.");
    res.redirect("/admin/settings");
  },

  deleteSetting: async (req, res) => {
    const setting = await SystemSetting.findByPk(req.params.id);
    if (setting?.settingKey === HOMEPAGE_CONTENT_KEY) {
      req.flash("error_msg", "Manage homepage content from the Homepage Content page.");
      return res.redirect("/admin/settings");
    }
    if (setting) await setting.destroy();
    await logActivity(req, "Archived setting", "System Settings", req.params.id);
    req.flash("success_msg", "Setting moved to the archive.");
    res.redirect("/admin/settings");
  },

  logs: async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const where = q
      ? {
          [Op.or]: [
            { action: { [Op.like]: `%${q}%` } },
            { module: { [Op.like]: `%${q}%` } },
            { details: { [Op.like]: `%${q}%` } },
          ],
        }
      : undefined;

    const logs = await ActivityLog.findAll({
      where,
      include: [{ model: User, as: "actor" }],
      order: [["createdAt", "DESC"]],
      limit: 200,
    });

    res.render("admin/logs", {
      title: "Activity Records",
      nav: "logs",
      logs: plain(logs),
      q: q || "",
    });
  },

  events: async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = EVENT_STATUSES.includes(req.query.status) ? req.query.status : "";
    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { venue: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }
    if (status) where.status = status;
    const [events, organizers, totalEvents] = await Promise.all([
      Event.findAll({
        where,
        include: [{ model: User, as: "organizer" }],
        order: [["createdAt", "DESC"]],
      }),
      User.findAll({
        where: { role: "event_organizer", status: "active" },
        order: [["name", "ASC"]],
      }),
      Event.count(),
    ]);

    res.render("admin/events", {
      title: "System Event Records",
      nav: "events",
      events: plain(events),
      organizers: plain(organizers),
      eventStatuses: EVENT_STATUSES,
      filters: { q, status },
      stats: { total: totalEvents, shown: events.length },
    });
  },

  createEvent: async (req, res) => {
    const error = eventFormError(req.body);
    if (error) {
      req.flash("error_msg", error);
      return res.redirect("/admin/events");
    }
    const organizer = await User.findOne({
      where: { id: req.body.createdBy, role: "event_organizer", status: "active" },
    });
    if (!organizer) {
      req.flash("error_msg", "Select an active event organizer.");
      return res.redirect("/admin/events");
    }
    await Event.create({
      name: req.body.name.trim(),
      description: req.body.description,
      venue: req.body.venue,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      status: req.body.status || "draft",
      createdBy: organizer.id,
      evaluationInstructions: req.body.evaluationInstructions,
      scoringNotes: req.body.scoringNotes,
      scoringFormula: req.body.scoringFormula || "average_weighted",
      allowScoreRevision: req.body.allowScoreRevision === "true",
    });
    await logActivity(req, "Created event", "Event Records", req.body.name);
    req.flash("success_msg", "Event record created.");
    res.redirect("/admin/events");
  },

  updateEvent: async (req, res) => {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      req.flash("error_msg", "Event not found.");
      return res.redirect("/admin/events");
    }
    const error = eventFormError(req.body);
    if (error) {
      req.flash("error_msg", error);
      return res.redirect("/admin/events");
    }
    const organizer = await User.findOne({
      where: { id: req.body.createdBy, role: "event_organizer", status: "active" },
    });
    if (!organizer) {
      req.flash("error_msg", "Select an active event organizer.");
      return res.redirect("/admin/events");
    }
    Object.assign(event, {
      name: req.body.name.trim(),
      description: req.body.description,
      venue: req.body.venue,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      status: req.body.status,
      createdBy: organizer.id,
      evaluationInstructions: req.body.evaluationInstructions,
      scoringNotes: req.body.scoringNotes,
      scoringFormula: req.body.scoringFormula,
      allowScoreRevision: req.body.allowScoreRevision === "true",
    });
    await event.save();
    await logActivity(req, "Updated event", "Event Records", event.name);
    req.flash("success_msg", "Event record updated.");
    res.redirect("/admin/events");
  },

  deleteEvent: async (req, res) => {
    const event = await Event.findByPk(req.params.id);
    if (event) await event.destroy();
    await logActivity(req, "Archived event", "Event Records", req.params.id);
    req.flash("success_msg", "Event record moved to the archive.");
    res.redirect("/admin/events");
  },
};
