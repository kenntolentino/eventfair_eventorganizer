import { Op } from "sequelize";
import {
  User,
  Event,
  Category,
  Criterion,
  Contestant,
  EventAssignment,
  ScoreSheet,
  Score,
  TabulationResult,
  TabulationReport,
} from "../models/index.js";
import { logActivity } from "../utils/activity.js";
import { plain, fullName, idsOrNone } from "../utils/view.js";
import { deleteContestantImage, saveContestantImage } from "../utils/contestantImage.js";

const EVENT_STATUSES = ["draft", "scheduled", "ongoing", "judging", "tabulated", "published", "archived"];
const CONTESTANT_STATUSES = ["registered", "withdrawn", "disqualified"];

async function ownedEvent(req, id) {
  return Event.findOne({ where: { id, createdBy: req.user.id } });
}

function queryString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function eventInputError(body, { allowArchive = false } = {}) {
  if (!queryString(body.name)) return "An event name is required.";
  if (body.status && !EVENT_STATUSES.includes(body.status)) return "Select a valid event status.";
  if (["tabulated", "published"].includes(body.status)) {
    return "Event status is managed by the approved tabulation and publishing workflow.";
  }
  if (!allowArchive && body.status === "archived") return "Only an existing event can be archived.";
  if (body.scoringFormula && !["average_weighted", "sum_weighted"].includes(body.scoringFormula)) {
    return "Select a valid scoring formula.";
  }
  if (body.startDate && body.endDate && body.startDate > body.endDate) {
    return "The event end date cannot be earlier than its start date.";
  }
  return null;
}

function categoryWeightTotal(criteria) {
  return criteria.reduce((total, criterion) => total + Number(criterion.weightPercentage || 0), 0);
}

function criteriaForCategoryWhere(eventId, categoryId, excludeId) {
  return {
    eventId,
    ...(categoryId
      ? { [Op.or]: [{ categoryId: null }, { categoryId }] }
      : { categoryId: null }),
    ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
  };
}

async function exceedsEffectiveWeight(eventId, categoryId, weight, excludeId) {
  const [categories, existingCriteria] = await Promise.all([
    Category.findAll({ where: { eventId }, attributes: ["id"] }),
    Criterion.findAll({
      where: { eventId, ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}) },
      attributes: ["categoryId", "weightPercentage"],
    }),
  ]);
  const scopes = categoryId ? [Number(categoryId)] : [null, ...categories.map((item) => Number(item.id))];
  return scopes.some((scope) => {
    const applicable = existingCriteria.filter((criterion) =>
      criterion.categoryId == null || (scope != null && Number(criterion.categoryId) === scope)
    );
    return categoryWeightTotal(applicable) + weight > 100.01;
  });
}

function workflowLocked(event) {
  return ["tabulated", "published", "archived"].includes(event.status);
}

async function organizerEvents(userId) {
  return Event.findAll({ where: { createdBy: userId }, order: [["createdAt", "DESC"]] });
}

export const organizerController = {
  dashboard: async (req, res) => {
    const events = await organizerEvents(req.user.id);
    const eventIds = events.map((item) => item.id);
    const [contestants, assignments, activeEvents, publishedEvents, results, submittedSheets] = await Promise.all([
      eventIds.length ? Contestant.count({ where: { eventId: eventIds, status: "registered" } }) : 0,
      eventIds.length ? EventAssignment.count({ where: { eventId: eventIds } }) : 0,
      eventIds.length
        ? Event.count({ where: { id: eventIds, status: { [Op.in]: ["scheduled", "ongoing", "judging"] } } })
        : 0,
      eventIds.length ? Event.count({ where: { id: eventIds, status: "published" } }) : 0,
      eventIds.length ? TabulationResult.count({ where: { eventId: eventIds } }) : 0,
      eventIds.length ? ScoreSheet.count({ where: { eventId: eventIds, status: "submitted" } }) : 0,
    ]);

    res.render("organizer/dashboard", {
      title: "Organizer Dashboard",
      nav: "dashboard",
      stats: {
        events: events.length,
        contestants,
        assignments,
        activeEvents,
        publishedEvents,
        results,
        submittedSheets,
      },
      events: plain(events),
    });
  },

  events: async (req, res) => {
    const q = queryString(req.query.q);
    const status = EVENT_STATUSES.includes(req.query.status) ? req.query.status : "";
    const where = { createdBy: req.user.id };
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { venue: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }
    if (status) where.status = status;
    const [events, totalEvents] = await Promise.all([
      Event.findAll({ where, order: [["createdAt", "DESC"]] }),
      Event.count({ where: { createdBy: req.user.id } }),
    ]);
    res.render("organizer/events", {
      title: "Events",
      nav: "events",
      events: plain(events),
      eventStatuses: EVENT_STATUSES,
      filters: { q, status },
      stats: { total: totalEvents, shown: events.length },
    });
  },

  createEvent: async (req, res) => {
    const error = eventInputError(req.body);
    if (error) {
      req.flash("error_msg", error);
      return res.redirect("/organizer/events");
    }
    await Event.create({
      name: req.body.name.trim(),
      description: req.body.description,
      venue: req.body.venue,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      status: req.body.status || "draft",
      createdBy: req.user.id,
      evaluationInstructions: req.body.evaluationInstructions,
      scoringNotes: req.body.scoringNotes,
      scoringFormula: req.body.scoringFormula || "average_weighted",
      allowScoreRevision: req.body.allowScoreRevision === "true",
    });
    await logActivity(req, "Created event", "Events", req.body.name);
    req.flash("success_msg", "Event created.");
    res.redirect("/organizer/events");
  },

  updateEvent: async (req, res) => {
    const event = await ownedEvent(req, req.params.id);
    if (!event) {
      req.flash("error_msg", "Event not found.");
      return res.redirect("/organizer/events");
    }
    if (workflowLocked(event)) {
      req.flash("error_msg", "Tabulated, published, or archived event records are read-only.");
      return res.redirect("/organizer/events");
    }
    const error = eventInputError(req.body, { allowArchive: true });
    if (error) {
      req.flash("error_msg", error);
      return res.redirect("/organizer/events");
    }
    const scoreSheetCount = await ScoreSheet.count({ where: { eventId: event.id } });
    if (
      scoreSheetCount &&
      (req.body.scoringFormula !== event.scoringFormula ||
        (req.body.allowScoreRevision === "true") !== event.allowScoreRevision)
    ) {
      req.flash("error_msg", "Scoring formula and revision policy cannot change after score sheets have been created.");
      return res.redirect("/organizer/events");
    }
    Object.assign(event, {
      name: req.body.name.trim(),
      description: req.body.description,
      venue: req.body.venue,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      status: req.body.status,
      evaluationInstructions: req.body.evaluationInstructions,
      scoringNotes: req.body.scoringNotes,
      scoringFormula: req.body.scoringFormula,
      allowScoreRevision: req.body.allowScoreRevision === "true",
    });
    await event.save();
    await logActivity(req, "Updated event", "Events", event.name);
    req.flash("success_msg", "Event updated.");
    res.redirect("/organizer/events");
  },

  deleteEvent: async (req, res) => {
    const event = await ownedEvent(req, req.params.id);
    if (!event) {
      req.flash("error_msg", "Event not found.");
      return res.redirect("/organizer/events");
    }
    if (workflowLocked(event)) {
      req.flash("error_msg", "Tabulated, published, or archived events cannot be deleted.");
      return res.redirect("/organizer/events");
    }
    const [scoreSheets, results] = await Promise.all([
      ScoreSheet.count({ where: { eventId: event.id } }),
      TabulationResult.count({ where: { eventId: event.id } }),
    ]);
    if (scoreSheets || results) {
      req.flash("error_msg", "An event with scoring or result history cannot be deleted. Archive it to preserve the audit trail.");
      return res.redirect("/organizer/events");
    }
    await event.destroy();
    await logActivity(req, "Deleted event", "Events", req.params.id);
    req.flash("success_msg", "Event deleted.");
    res.redirect("/organizer/events");
  },

  contestants: async (req, res) => {
    const events = await organizerEvents(req.user.id);
    const eventIds = events.map((item) => item.id);
    const selectedEventId = eventIds.includes(Number(req.query.eventId)) ? Number(req.query.eventId) : "";
    const q = queryString(req.query.q);
    const status = CONTESTANT_STATUSES.includes(req.query.status) ? req.query.status : "";
    const where = { eventId: selectedEventId || idsOrNone(eventIds) };
    if (q) {
      where[Op.or] = [
        { contestantNumber: { [Op.like]: `%${q}%` } },
        { firstName: { [Op.like]: `%${q}%` } },
        { middleName: { [Op.like]: `%${q}%` } },
        { lastName: { [Op.like]: `%${q}%` } },
        { organization: { [Op.like]: `%${q}%` } },
      ];
    }
    if (status) where.status = status;
    const [contestants, categories, total, registered] = await Promise.all([
      Contestant.findAll({
        where,
        include: [Event, Category],
        order: [["contestantNumber", "ASC"]],
      }),
      Category.findAll({
        where: { eventId: idsOrNone(eventIds) },
        include: [Event],
        order: [["displayOrder", "ASC"]],
      }),
      Contestant.count({ where: { eventId: selectedEventId || idsOrNone(eventIds) } }),
      Contestant.count({
        where: { eventId: selectedEventId || idsOrNone(eventIds), status: "registered" },
      }),
    ]);
    res.render("organizer/contestants", {
      title: "Contestants",
      nav: "contestants",
      contestants: plain(contestants).map((item) => ({ ...item, fullName: fullName(item) })),
      events: plain(events),
      categories: plain(categories),
      filters: { q, status, eventId: selectedEventId },
      stats: { total, registered, shown: contestants.length },
    });
  },

  createContestant: async (req, res) => {
    const event = await ownedEvent(req, req.body.eventId);
    const contestantNumber = queryString(req.body.contestantNumber);
    const firstName = queryString(req.body.firstName);
    const lastName = queryString(req.body.lastName);
    const age = req.body.age === "" || req.body.age === undefined ? null : Number(req.body.age);
    if (!contestantNumber || !firstName || !lastName || (age !== null && (!Number.isInteger(age) || age < 1 || age > 120))) {
      req.flash("error_msg", "Enter a contestant number and full name, and provide a valid age if applicable.");
      return res.redirect("/organizer/contestants");
    }
    if (req.body.status && !CONTESTANT_STATUSES.includes(req.body.status)) {
      req.flash("error_msg", "Select a valid contestant status.");
      return res.redirect("/organizer/contestants");
    }
    const category = req.body.categoryId
      ? await Category.findOne({ where: { id: req.body.categoryId, eventId: req.body.eventId } })
      : null;
    if (!event || (req.body.categoryId && !category)) {
      req.flash("error_msg", "Select a valid event.");
      return res.redirect("/organizer/contestants");
    }
    if (workflowLocked(event)) {
      req.flash("error_msg", "Contestant registration is locked after tabulation or archiving.");
      return res.redirect("/organizer/contestants");
    }
    const existing = await Contestant.findOne({
      where: { eventId: event.id, contestantNumber },
    });
    if (existing) {
      req.flash("error_msg", "That contestant number is already in use for this event.");
      return res.redirect("/organizer/contestants");
    }
    let imageUrl;
    try {
      imageUrl = await saveContestantImage(req.file);
    } catch (error) {
      if (error.code !== "INVALID_CONTESTANT_IMAGE") throw error;
      req.flash("error_msg", error.message);
      return res.redirect("/organizer/contestants");
    }
    try {
      await Contestant.create({
        eventId: event.id,
        categoryId: req.body.categoryId || null,
        contestantNumber,
        firstName,
        lastName,
        middleName: queryString(req.body.middleName) || null,
        gender: queryString(req.body.gender) || null,
        age,
        organization: req.body.organization,
        biography: req.body.biography,
        imageUrl,
        status: req.body.status || "registered",
      });
    } catch (error) {
      await deleteContestantImage(imageUrl);
      throw error;
    }
    await logActivity(req, "Registered contestant", "Contestants", req.body.contestantNumber);
    req.flash("success_msg", "Contestant registered.");
    res.redirect("/organizer/contestants");
  },

  updateContestant: async (req, res) => {
    const contestant = await Contestant.findByPk(req.params.id);
    const event = contestant ? await ownedEvent(req, contestant.eventId) : null;
    const targetEvent = await ownedEvent(req, req.body.eventId);
    const contestantNumber = queryString(req.body.contestantNumber);
    const firstName = queryString(req.body.firstName);
    const lastName = queryString(req.body.lastName);
    const age = req.body.age === "" || req.body.age === undefined ? null : Number(req.body.age);
    if (!contestantNumber || !firstName || !lastName || (age !== null && (!Number.isInteger(age) || age < 1 || age > 120))) {
      req.flash("error_msg", "Enter a contestant number and full name, and provide a valid age if applicable.");
      return res.redirect("/organizer/contestants");
    }
    if (req.body.status && !CONTESTANT_STATUSES.includes(req.body.status)) {
      req.flash("error_msg", "Select a valid contestant status.");
      return res.redirect("/organizer/contestants");
    }
    const category = req.body.categoryId
      ? await Category.findOne({ where: { id: req.body.categoryId, eventId: req.body.eventId } })
      : null;
    if (!contestant || !event || !targetEvent || (req.body.categoryId && !category)) {
      req.flash("error_msg", "Contestant not found.");
      return res.redirect("/organizer/contestants");
    }
    if (workflowLocked(event) || workflowLocked(targetEvent)) {
      req.flash("error_msg", "Contestant records are locked after tabulation or archiving.");
      return res.redirect("/organizer/contestants");
    }
    if (
      targetEvent.id !== event.id ||
      Number(req.body.categoryId || 0) !== Number(contestant.categoryId || 0)
    ) {
      const [scoreSheets, results] = await Promise.all([
        ScoreSheet.count({ where: { contestantId: contestant.id } }),
        TabulationResult.count({ where: { contestantId: contestant.id } }),
      ]);
      if (scoreSheets || results) {
        req.flash("error_msg", "A contestant with scoring or result records cannot change event or category.");
        return res.redirect("/organizer/contestants");
      }
    }
    const duplicate = await Contestant.findOne({
      where: {
        eventId: targetEvent.id,
        contestantNumber,
        id: { [Op.ne]: contestant.id },
      },
    });
    if (duplicate) {
      req.flash("error_msg", "That contestant number is already in use for this event.");
      return res.redirect("/organizer/contestants");
    }
    let imageUrl = contestant.imageUrl;
    if (req.file) {
      try {
        imageUrl = await saveContestantImage(req.file);
      } catch (error) {
        if (error.code !== "INVALID_CONTESTANT_IMAGE") throw error;
        req.flash("error_msg", error.message);
        return res.redirect("/organizer/contestants");
      }
    }
    const previousImageUrl = contestant.imageUrl;
    Object.assign(contestant, {
      eventId: targetEvent.id,
      categoryId: req.body.categoryId || null,
      contestantNumber,
      firstName,
      lastName,
      middleName: queryString(req.body.middleName) || null,
      gender: queryString(req.body.gender) || null,
      age,
      organization: req.body.organization,
      biography: req.body.biography,
      imageUrl,
      status: req.body.status,
    });
    try {
      await contestant.save();
    } catch (error) {
      if (req.file && imageUrl !== previousImageUrl) {
        await deleteContestantImage(imageUrl);
      }
      throw error;
    }
    if (req.file && previousImageUrl !== imageUrl) {
      await deleteContestantImage(previousImageUrl);
    }
    await logActivity(req, "Updated contestant", "Contestants", contestant.contestantNumber);
    req.flash("success_msg", "Contestant updated.");
    res.redirect("/organizer/contestants");
  },

  deleteContestant: async (req, res) => {
    const contestant = await Contestant.findByPk(req.params.id);
    const event = contestant ? await ownedEvent(req, contestant.eventId) : null;
    if (!contestant || !event) {
      req.flash("error_msg", "Contestant not found.");
      return res.redirect("/organizer/contestants");
    }
    if (workflowLocked(event)) {
      req.flash("error_msg", "Contestant records are locked after tabulation or archiving.");
      return res.redirect("/organizer/contestants");
    }
    const [scoreSheets, results] = await Promise.all([
      ScoreSheet.count({ where: { contestantId: contestant.id } }),
      TabulationResult.count({ where: { contestantId: contestant.id } }),
    ]);
    if (scoreSheets || results) {
      req.flash("error_msg", "This contestant has score or result history. Change the contestant status instead of deleting the record.");
      return res.redirect("/organizer/contestants");
    }
    await contestant.destroy();
    await deleteContestantImage(contestant.imageUrl);
    await logActivity(
      req,
      "Removed contestant",
      "Contestants",
      `${contestant.contestantNumber} · ${fullName(contestant)} · ${event.name}`
    );
    req.flash("success_msg", "Contestant removed.");
    res.redirect("/organizer/contestants");
  },

  categories: async (req, res) => {
    const events = await organizerEvents(req.user.id);
    const eventIds = events.map((item) => item.id);
    const selectedEventId = eventIds.includes(Number(req.query.eventId)) ? Number(req.query.eventId) : "";
    const q = queryString(req.query.q);
    const where = { eventId: selectedEventId || idsOrNone(eventIds) };
    if (q) where.name = { [Op.like]: `%${q}%` };
    const categories = await Category.findAll({
      where,
      include: [Event],
      order: [["displayOrder", "ASC"]],
    });
    const total = await Category.count({ where: { eventId: selectedEventId || idsOrNone(eventIds) } });
    res.render("organizer/categories", {
      title: "Competition Categories",
      nav: "categories",
      categories: plain(categories),
      events: plain(events),
      filters: { eventId: selectedEventId, q },
      stats: { total, shown: categories.length },
    });
  },

  createCategory: async (req, res) => {
    const event = await ownedEvent(req, req.body.eventId);
    const name = queryString(req.body.name);
    const displayOrder = Number(req.body.displayOrder || 1);
    if (!event || !name || !Number.isInteger(displayOrder) || displayOrder < 1) {
      req.flash("error_msg", "Select a valid event.");
      return res.redirect("/organizer/categories");
    }
    if (workflowLocked(event)) {
      req.flash("error_msg", "Competition categories are locked after tabulation or archiving.");
      return res.redirect("/organizer/categories");
    }
    const duplicate = await Category.findOne({ where: { eventId: event.id, name } });
    if (duplicate) {
      req.flash("error_msg", "A category with that name already exists for this event.");
      return res.redirect("/organizer/categories");
    }
    await Category.create({
      eventId: event.id,
      name,
      description: req.body.description,
      displayOrder,
    });
    await logActivity(req, "Created category", "Competition Categories", `${name} · ${event.name}`);
    req.flash("success_msg", "Category created.");
    res.redirect("/organizer/categories");
  },

  updateCategory: async (req, res) => {
    const category = await Category.findByPk(req.params.id);
    const event = category ? await ownedEvent(req, category.eventId) : null;
    const targetEvent = await ownedEvent(req, req.body.eventId);
    const name = queryString(req.body.name);
    const displayOrder = Number(req.body.displayOrder || 1);
    if (!category || !event || !targetEvent || !name || !Number.isInteger(displayOrder) || displayOrder < 1) {
      req.flash("error_msg", "Category not found.");
      return res.redirect("/organizer/categories");
    }
    if (workflowLocked(event) || workflowLocked(targetEvent)) {
      req.flash("error_msg", "Competition categories are locked after tabulation or archiving.");
      return res.redirect("/organizer/categories");
    }
    if (targetEvent.id !== event.id) {
      const [contestants, criteria] = await Promise.all([
        Contestant.count({ where: { categoryId: category.id } }),
        Criterion.count({ where: { categoryId: category.id } }),
      ]);
      if (contestants || criteria) {
        req.flash("error_msg", "A category used by contestants or judging criteria cannot be moved to another event.");
        return res.redirect("/organizer/categories");
      }
    }
    const duplicate = await Category.findOne({
      where: { eventId: targetEvent.id, name, id: { [Op.ne]: category.id } },
    });
    if (duplicate) {
      req.flash("error_msg", "A category with that name already exists for this event.");
      return res.redirect("/organizer/categories");
    }
    Object.assign(category, {
      eventId: targetEvent.id,
      name,
      description: req.body.description,
      displayOrder,
    });
    await category.save();
    await logActivity(req, "Updated category", "Competition Categories", `${name} · ${targetEvent.name}`);
    req.flash("success_msg", "Category updated.");
    res.redirect("/organizer/categories");
  },

  deleteCategory: async (req, res) => {
    const category = await Category.findByPk(req.params.id);
    const event = category ? await ownedEvent(req, category.eventId) : null;
    if (!category || !event) {
      req.flash("error_msg", "Category not found.");
      return res.redirect("/organizer/categories");
    }
    if (workflowLocked(event)) {
      req.flash("error_msg", "Competition categories are locked after tabulation or archiving.");
      return res.redirect("/organizer/categories");
    }
    const linkedRecords = await Promise.all([
      Contestant.count({ where: { categoryId: category.id } }),
      Criterion.count({ where: { categoryId: category.id } }),
    ]);
    if (linkedRecords.some(Boolean)) {
      req.flash("error_msg", "Remove or reassign linked contestants and criteria before deleting this category.");
      return res.redirect("/organizer/categories");
    }
    await category.destroy();
    await logActivity(req, "Deleted category", "Competition Categories", category.name);
    req.flash("success_msg", "Category deleted.");
    res.redirect("/organizer/categories");
  },

  criteria: async (req, res) => {
    const events = await organizerEvents(req.user.id);
    const eventIds = idsOrNone(events.map((item) => item.id));
    const validEventIds = events.map((item) => item.id);
    const selectedEventId = validEventIds.includes(Number(req.query.eventId)) ? Number(req.query.eventId) : "";
    const q = queryString(req.query.q);
    const where = { eventId: selectedEventId || eventIds };
    if (q) where.name = { [Op.like]: `%${q}%` };
    const criteria = await Criterion.findAll({
      where,
      include: [Event, Category],
      order: [["displayOrder", "ASC"]],
    });
    const categories = await Category.findAll({ where: { eventId: eventIds }, include: [Event] });
    const [total, weightTotals] = await Promise.all([
      Criterion.count({ where: { eventId: selectedEventId || eventIds } }),
      Promise.all((selectedEventId ? events.filter((item) => item.id === selectedEventId) : events)
        .flatMap((event) => {
          const eventCategories = categories.filter((category) => Number(category.eventId) === Number(event.id));
          return [
            { event, category: null },
            ...eventCategories.map((category) => ({ event, category })),
          ];
        })
        .map(async ({ event, category }) => {
          const scopedCriteria = await Criterion.findAll({
            where: criteriaForCategoryWhere(event.id, category?.id),
          });
          const totalWeight = Number(categoryWeightTotal(scopedCriteria).toFixed(2));
          return {
            eventId: event.id,
            eventName: event.name,
            categoryName: category?.name || "General",
            total: totalWeight,
            balanced: Math.abs(totalWeight - 100) < 0.01,
            valid: totalWeight <= 100.01,
          };
        })),
    ]);
    res.render("organizer/criteria", {
      title: "Judging Criteria",
      nav: "criteria",
      criteria: plain(criteria),
      events: plain(events),
      categories: plain(categories),
      filters: { eventId: selectedEventId, q },
      stats: { total, shown: criteria.length },
      weightTotals,
    });
  },

  createCriterion: async (req, res) => {
    const event = await ownedEvent(req, req.body.eventId);
    const name = queryString(req.body.name);
    const weight = Number(req.body.weightPercentage);
    const minScore = Number(req.body.minScore ?? 0);
    const maxScore = Number(req.body.maxScore ?? 100);
    const displayOrder = Number(req.body.displayOrder || 1);
    if (
      !name ||
      !Number.isFinite(weight) ||
      weight <= 0 ||
      weight > 100 ||
      !Number.isFinite(minScore) ||
      !Number.isFinite(maxScore) ||
      minScore >= maxScore ||
      !Number.isInteger(displayOrder) ||
      displayOrder < 1
    ) {
      req.flash("error_msg", "Enter a criterion name, a weight from 0 to 100, a valid score range, and a positive display order.");
      return res.redirect("/organizer/criteria");
    }
    const category = req.body.categoryId
      ? await Category.findOne({ where: { id: req.body.categoryId, eventId: req.body.eventId } })
      : null;
    if (!event || (req.body.categoryId && !category)) {
      req.flash("error_msg", "Select a valid event.");
      return res.redirect("/organizer/criteria");
    }
    if (workflowLocked(event)) {
      req.flash("error_msg", "Judging criteria are locked after tabulation or archiving.");
      return res.redirect("/organizer/criteria");
    }
    const duplicate = await Criterion.findOne({
      where: { eventId: event.id, categoryId: category?.id || null, name },
    });
    if (duplicate) {
      req.flash("error_msg", "A criterion with that name already exists in this event and category.");
      return res.redirect("/organizer/criteria");
    }
    if (await exceedsEffectiveWeight(event.id, category?.id, weight)) {
      req.flash("error_msg", "The criteria weights for this event/category cannot total more than 100%.");
      return res.redirect("/organizer/criteria");
    }
    await Criterion.create({
      eventId: event.id,
      categoryId: req.body.categoryId || null,
      name,
      description: req.body.description,
      weightPercentage: weight,
      minScore,
      maxScore,
      displayOrder,
    });
    await logActivity(req, "Created judging criterion", "Judging Criteria", `${name} · ${event.name}`);
    req.flash("success_msg", "Criterion created.");
    res.redirect("/organizer/criteria");
  },

  updateCriterion: async (req, res) => {
    const criterion = await Criterion.findByPk(req.params.id);
    const event = criterion ? await ownedEvent(req, criterion.eventId) : null;
    const targetEvent = await ownedEvent(req, req.body.eventId);
    const name = queryString(req.body.name);
    const weight = Number(req.body.weightPercentage);
    const minScore = Number(req.body.minScore ?? 0);
    const maxScore = Number(req.body.maxScore ?? 100);
    const displayOrder = Number(req.body.displayOrder || 1);
    if (
      !name ||
      !Number.isFinite(weight) ||
      weight <= 0 ||
      weight > 100 ||
      !Number.isFinite(minScore) ||
      !Number.isFinite(maxScore) ||
      minScore >= maxScore ||
      !Number.isInteger(displayOrder) ||
      displayOrder < 1
    ) {
      req.flash("error_msg", "Enter a criterion name, a weight from 0 to 100, a valid score range, and a positive display order.");
      return res.redirect("/organizer/criteria");
    }
    const category = req.body.categoryId
      ? await Category.findOne({ where: { id: req.body.categoryId, eventId: req.body.eventId } })
      : null;
    if (!criterion || !event || !targetEvent || (req.body.categoryId && !category)) {
      req.flash("error_msg", "Criterion not found.");
      return res.redirect("/organizer/criteria");
    }
    if (workflowLocked(event) || workflowLocked(targetEvent)) {
      req.flash("error_msg", "Judging criteria are locked after tabulation or archiving.");
      return res.redirect("/organizer/criteria");
    }
    const targetCategoryId = category?.id || null;
    const scoreCount = await Score.count({ where: { criterionId: criterion.id } });
    if (
      scoreCount &&
      (Number(targetEvent.id) !== Number(event.id) ||
        Number(targetCategoryId || 0) !== Number(criterion.categoryId || 0) ||
        Number(weight) !== Number(criterion.weightPercentage) ||
        Number(minScore) !== Number(criterion.minScore) ||
        Number(maxScore) !== Number(criterion.maxScore))
    ) {
      req.flash("error_msg", "A criterion with recorded scores cannot change its event, category, weight, or score range.");
      return res.redirect("/organizer/criteria");
    }
    const duplicate = await Criterion.findOne({
      where: {
        eventId: targetEvent.id,
        categoryId: targetCategoryId,
        name,
        id: { [Op.ne]: criterion.id },
      },
    });
    if (duplicate) {
      req.flash("error_msg", "A criterion with that name already exists in this event and category.");
      return res.redirect("/organizer/criteria");
    }
    if (await exceedsEffectiveWeight(targetEvent.id, targetCategoryId, weight, criterion.id)) {
      req.flash("error_msg", "The criteria weights for this event/category cannot total more than 100%.");
      return res.redirect("/organizer/criteria");
    }
    Object.assign(criterion, {
      eventId: targetEvent.id,
      categoryId: targetCategoryId,
      name,
      description: req.body.description,
      weightPercentage: weight,
      minScore,
      maxScore,
      displayOrder,
    });
    await criterion.save();
    await logActivity(req, "Updated judging criterion", "Judging Criteria", `${name} · ${targetEvent.name}`);
    req.flash("success_msg", "Criterion updated.");
    res.redirect("/organizer/criteria");
  },

  deleteCriterion: async (req, res) => {
    const criterion = await Criterion.findByPk(req.params.id);
    const event = criterion ? await ownedEvent(req, criterion.eventId) : null;
    if (!criterion || !event) {
      req.flash("error_msg", "Criterion not found.");
      return res.redirect("/organizer/criteria");
    }
    if (workflowLocked(event)) {
      req.flash("error_msg", "Judging criteria are locked after tabulation or archiving.");
      return res.redirect("/organizer/criteria");
    }
    if (await Score.count({ where: { criterionId: criterion.id } })) {
      req.flash("error_msg", "A criterion with recorded scores cannot be deleted. Update its name or retain it for audit history.");
      return res.redirect("/organizer/criteria");
    }
    await criterion.destroy();
    await logActivity(req, "Deleted judging criterion", "Judging Criteria", criterion.name);
    req.flash("success_msg", "Criterion deleted.");
    res.redirect("/organizer/criteria");
  },

  assignments: async (req, res) => {
    const events = await organizerEvents(req.user.id);
    const eventIds = idsOrNone(events.map((item) => item.id));
    const selectedEventId = events.some((item) => Number(item.id) === Number(req.query.eventId))
      ? Number(req.query.eventId)
      : "";
    const role = ["judge", "tabulator"].includes(req.query.role) ? req.query.role : "";
    const where = { eventId: selectedEventId || eventIds };
    if (role) where.assignmentRole = role;
    const [assignments, officials, total, judges, tabulators] = await Promise.all([
      EventAssignment.findAll({
        where,
        include: [Event, { model: User, as: "official" }],
        order: [["createdAt", "DESC"]],
      }),
      User.findAll({
        where: { role: { [Op.in]: ["judge", "tabulator"] }, status: "active" },
        order: [["name", "ASC"]],
      }),
      EventAssignment.count({ where: { eventId: selectedEventId || eventIds } }),
      EventAssignment.count({ where: { eventId: selectedEventId || eventIds, assignmentRole: "judge" } }),
      EventAssignment.count({ where: { eventId: selectedEventId || eventIds, assignmentRole: "tabulator" } }),
    ]);
    res.render("organizer/assignments", {
      title: "Assign Officials",
      nav: "assignments",
      assignments: plain(assignments),
      events: plain(events),
      officials: plain(officials),
      filters: { eventId: selectedEventId, role },
      stats: { total, shown: assignments.length, judges, tabulators },
    });
  },

  createAssignment: async (req, res) => {
    const event = await ownedEvent(req, req.body.eventId);
    const official = await User.findByPk(req.body.userId);
    if (!event || !official || official.status !== "active" || !["judge", "tabulator"].includes(official.role)) {
      req.flash("error_msg", "Select a valid event and official.");
      return res.redirect("/organizer/assignments");
    }
    if (workflowLocked(event)) {
      req.flash("error_msg", "Assignments are locked after tabulation or archiving.");
      return res.redirect("/organizer/assignments");
    }
    const existing = await EventAssignment.findOne({
      where: { eventId: event.id, userId: official.id },
    });
    if (existing) {
      req.flash("error_msg", "This official is already assigned to the selected event.");
      return res.redirect("/organizer/assignments");
    }
    await EventAssignment.create({
      eventId: event.id,
      userId: official.id,
      assignmentRole: official.role === "tabulator" ? "tabulator" : "judge",
      notes: req.body.notes,
    });
    await logActivity(req, "Assigned official", "Assignments", `${official.email} to ${event.name}`);
    req.flash("success_msg", "Official assigned.");
    res.redirect("/organizer/assignments");
  },

  updateAssignment: async (req, res) => {
    const assignment = await EventAssignment.findByPk(req.params.id);
    const event = assignment ? await ownedEvent(req, assignment.eventId) : null;
    const targetEvent = await ownedEvent(req, req.body.eventId);
    const official = await User.findByPk(req.body.userId);
    if (
      !assignment ||
      !event ||
      !targetEvent ||
      !official ||
      official.status !== "active" ||
      !["judge", "tabulator"].includes(official.role)
    ) {
      req.flash("error_msg", "Assignment not found.");
      return res.redirect("/organizer/assignments");
    }
    if (workflowLocked(event) || workflowLocked(targetEvent)) {
      req.flash("error_msg", "Assignments are locked after tabulation or archiving.");
      return res.redirect("/organizer/assignments");
    }
    if (assignment.assignmentRole === "judge") {
      const recordedSheets = await ScoreSheet.count({
        where: { eventId: event.id, judgeId: assignment.userId },
      });
      if (
        recordedSheets &&
        (Number(assignment.eventId) !== Number(targetEvent.id) || Number(assignment.userId) !== Number(official.id))
      ) {
        req.flash("error_msg", "A judge assignment with scoring history cannot be transferred. Preserve it for audit history.");
        return res.redirect("/organizer/assignments");
      }
    }
    const existing = await EventAssignment.findOne({
      where: {
        eventId: targetEvent.id,
        userId: official.id,
        id: { [Op.ne]: assignment.id },
      },
    });
    if (existing) {
      req.flash("error_msg", "This official is already assigned to the selected event.");
      return res.redirect("/organizer/assignments");
    }
    assignment.eventId = targetEvent.id;
    assignment.userId = official.id;
    assignment.notes = req.body.notes;
    assignment.assignmentRole = official.role === "tabulator" ? "tabulator" : "judge";
    await assignment.save();
    await logActivity(req, "Updated official assignment", "Assignments", `${official.email} to ${targetEvent.name}`);
    req.flash("success_msg", "Assignment updated.");
    res.redirect("/organizer/assignments");
  },

  deleteAssignment: async (req, res) => {
    const assignment = await EventAssignment.findByPk(req.params.id);
    const event = assignment ? await ownedEvent(req, assignment.eventId) : null;
    if (!assignment || !event) {
      req.flash("error_msg", "Assignment not found.");
      return res.redirect("/organizer/assignments");
    }
    if (workflowLocked(event)) {
      req.flash("error_msg", "Assignments are locked after tabulation or archiving.");
      return res.redirect("/organizer/assignments");
    }
    const official = await User.findByPk(assignment.userId);
    if (assignment.assignmentRole === "judge") {
      const recordedSheets = await ScoreSheet.count({
        where: { eventId: event.id, judgeId: assignment.userId },
      });
      if (recordedSheets) {
        req.flash("error_msg", "A judge with score sheet history cannot be unassigned. Keep the assignment for audit history.");
        return res.redirect("/organizer/assignments");
      }
    }
    await assignment.destroy();
    await logActivity(
      req,
      "Removed official assignment",
      "Assignments",
      `${official?.email || assignment.userId} from ${event.name}`
    );
    req.flash("success_msg", "Assignment removed.");
    res.redirect("/organizer/assignments");
  },

  progress: async (req, res) => {
    const events = await organizerEvents(req.user.id);
    const rows = await Promise.all(events.map(async (event) => {
      const [judges, contestants, submitted, tabulators] = await Promise.all([
        EventAssignment.count({ where: { eventId: event.id, assignmentRole: "judge" } }),
        Contestant.count({ where: { eventId: event.id, status: "registered" } }),
        ScoreSheet.count({ where: { eventId: event.id, status: "submitted" } }),
        EventAssignment.count({ where: { eventId: event.id, assignmentRole: "tabulator" } }),
      ]);
      const expected = judges * contestants;
      return {
        ...plain(event),
        judges,
        contestants,
        submitted,
        expected,
        tabulators,
        remaining: Math.max(expected - submitted, 0),
        completion: expected ? Math.round((submitted / expected) * 100) : 0,
      };
    }));
    const summary = rows.reduce(
      (total, row) => ({
        events: total.events + 1,
        expected: total.expected + row.expected,
        submitted: total.submitted + row.submitted,
        remaining: total.remaining + row.remaining,
      }),
      { events: 0, expected: 0, submitted: 0, remaining: 0 }
    );
    summary.completion = summary.expected ? Math.round((summary.submitted / summary.expected) * 100) : 0;
    res.render("organizer/progress", {
      title: "Judging Progress",
      nav: "progress",
      rows,
      summary,
    });
  },

  reports: async (req, res) => {
    const events = await organizerEvents(req.user.id);
    const eventIds = events.map((item) => item.id);
    const selectedEventId = eventIds.includes(Number(req.query.eventId)) ? Number(req.query.eventId) : "";
    const requestedEventId = selectedEventId || idsOrNone(eventIds);
    const [reports, results, totalReports] = await Promise.all([
      TabulationReport.findAll({
        where: { eventId: requestedEventId },
        include: [Event, { model: User, as: "author" }],
        order: [["createdAt", "DESC"]],
      }),
      TabulationResult.findAll({
        where: { eventId: requestedEventId },
        include: [Event, Contestant],
        order: [["eventId", "ASC"], ["rank", "ASC"]],
      }),
      TabulationReport.count({ where: { eventId: requestedEventId } }),
    ]);
    res.render("organizer/reports", {
      title: "Reports & Summaries",
      nav: "reports",
      reports: plain(reports),
      results: plain(results).map((item) => ({ ...item, contestantName: fullName(item.Contestant) })),
      events: plain(events),
      filters: { eventId: selectedEventId },
      stats: { reports: totalReports, results: results.length },
    });
  },

  publish: async (req, res) => {
    const events = await organizerEvents(req.user.id);
    const eventIds = events.map((item) => item.id);
    const results = eventIds.length
      ? await TabulationResult.findAll({
          where: { eventId: eventIds },
          include: [Event, Contestant],
          order: [["eventId", "ASC"], ["rank", "ASC"]],
        })
      : [];
    const publicationEvents = await Promise.all(events.map(async (event) => {
      const [judgeCount, contestantCount, criterionCount, tabulatorCount, verifiedResults, publishedResults] =
        await Promise.all([
          EventAssignment.count({ where: { eventId: event.id, assignmentRole: "judge" } }),
          Contestant.count({ where: { eventId: event.id, status: "registered" } }),
          Criterion.count({ where: { eventId: event.id } }),
          EventAssignment.count({ where: { eventId: event.id, assignmentRole: "tabulator" } }),
          TabulationResult.count({ where: { eventId: event.id, status: "verified" } }),
          TabulationResult.count({ where: { eventId: event.id, status: "published" } }),
        ]);
      const requiredSheets = judgeCount * contestantCount;
      const submittedSheets = await ScoreSheet.count({
        where: { eventId: event.id, status: "submitted" },
      });
      return {
        ...plain(event),
        judgeCount,
        contestantCount,
        criterionCount,
        tabulatorCount,
        verifiedResults,
        publishedResults,
        submittedSheets,
        requiredSheets,
        ready: event.status === "tabulated" && verifiedResults > 0,
      };
    }));
    res.render("organizer/publish", {
      title: "Publish Results",
      nav: "publish",
      events: publicationEvents,
      results: plain(results).map((item) => ({ ...item, contestantName: fullName(item.Contestant) })),
    });
  },

  approveResults: async (req, res) => {
    const event = await ownedEvent(req, req.params.id);
    const verifiedResults = event
      ? await TabulationResult.count({ where: { eventId: event.id, status: "verified" } })
      : 0;
    if (!event || event.status !== "tabulated" || !verifiedResults) {
      req.flash("error_msg", "Only events with verified tabulation results can be published.");
      return res.redirect("/organizer/publish");
    }
    await Event.sequelize.transaction(async (transaction) => {
      event.status = "published";
      event.resultsPublishedAt = new Date();
      event.resultsApprovedBy = req.user.id;
      await event.save({ transaction });
      await TabulationResult.update(
        { status: "published" },
        { where: { eventId: event.id, status: "verified" }, transaction }
      );
    });
    await logActivity(req, "Published results", "Publish Results", event.name);
    req.flash("success_msg", "Final results have been approved and published.");
    res.redirect("/organizer/publish");
  },
};
