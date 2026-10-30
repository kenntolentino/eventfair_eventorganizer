import { Op } from "sequelize";
import {
  Event,
  Category,
  Criterion,
  Contestant,
  EventAssignment,
  ScoreSheet,
  Score,
} from "../models/index.js";
import { logActivity } from "../utils/activity.js";
import { plain, fullName, idsOrNone } from "../utils/view.js";

const CONTESTANT_STATUSES = ["registered", "withdrawn", "disqualified"];
const SCOREABLE_EVENT_STATUSES = ["ongoing", "judging"];

function scoringOpen(event) {
  return SCOREABLE_EVENT_STATUSES.includes(event?.status);
}

async function assignedEvents(userId) {
  const assignments = await EventAssignment.findAll({
    where: { userId, assignmentRole: "judge" },
    include: [Event],
    order: [["createdAt", "DESC"]],
  });
  const seen = new Set();
  return assignments
    .map((item) => item.Event)
    .filter((event) => {
      if (!event || seen.has(Number(event.id))) return false;
      seen.add(Number(event.id));
      return true;
    });
}

async function ensureAssigned(userId, eventId) {
  return EventAssignment.findOne({
    where: { userId, eventId, assignmentRole: "judge" },
  });
}

async function eventWorkload(userId, event) {
  const contestants = await Contestant.findAll({
    where: { eventId: event.id, status: "registered" },
    attributes: ["id"],
  });
  const contestantIds = contestants.map((contestant) => contestant.id);
  const [submitted, drafts] = await Promise.all([
    contestantIds.length
      ? ScoreSheet.count({
          where: {
            eventId: event.id,
            judgeId: userId,
            contestantId: contestantIds,
            status: "submitted",
          },
        })
      : 0,
    contestantIds.length
      ? ScoreSheet.count({
          where: {
            eventId: event.id,
            judgeId: userId,
            contestantId: contestantIds,
            status: "draft",
          },
        })
      : 0,
  ]);
  const total = contestants.length;
  return {
    ...plain(event),
    contestantCount: total,
    submitted,
    drafts,
    remaining: Math.max(total - submitted, 0),
    completion: total ? Math.min(Math.round((submitted / total) * 100), 100) : 0,
    scoringOpen: scoringOpen(event),
  };
}

export const judgeController = {
  dashboard: async (req, res) => {
    const events = await assignedEvents(req.user.id);
    const workloads = await Promise.all(events.map((event) => eventWorkload(req.user.id, event)));
    const stats = workloads.reduce(
      (total, event) => ({
        events: total.events + 1,
        openEvents: total.openEvents + Number(event.scoringOpen),
        submitted: total.submitted + event.submitted,
        drafts: total.drafts + event.drafts,
        remaining: total.remaining + (event.scoringOpen ? event.remaining : 0),
      }),
      { events: 0, openEvents: 0, submitted: 0, drafts: 0, remaining: 0 }
    );

    res.render("judge/dashboard", {
      title: "Judge Dashboard",
      nav: "dashboard",
      stats,
      events: workloads,
    });
  },

  events: async (req, res) => {
    const events = await assignedEvents(req.user.id);
    res.render("judge/events", {
      title: "Assigned Events",
      nav: "events",
      events: await Promise.all(events.map((event) => eventWorkload(req.user.id, event))),
    });
  },

  contestants: async (req, res) => {
    const events = await assignedEvents(req.user.id);
    const eventIds = events.map((item) => item.id);
    const requestedEventId = Number(req.query.eventId);
    const selectedEventId = eventIds.some((id) => Number(id) === requestedEventId)
      ? requestedEventId
      : "";
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
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

    const contestants = await Contestant.findAll({
      where,
      include: [Event, Category],
      order: [["eventId", "ASC"], ["contestantNumber", "ASC"]],
    });
    res.render("judge/contestants", {
      title: "Contestants",
      nav: "contestants",
      contestants: plain(contestants).map((item) => ({ ...item, fullName: fullName(item) })),
      events: plain(events),
      filters: { eventId: selectedEventId, q, status },
      stats: { total: contestants.length },
    });
  },

  criteria: async (req, res) => {
    const events = await assignedEvents(req.user.id);
    const eventIds = events.map((item) => item.id);
    const requestedEventId = Number(req.query.eventId);
    const selectedEventId = eventIds.some((id) => Number(id) === requestedEventId)
      ? requestedEventId
      : "";
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const where = { eventId: selectedEventId || idsOrNone(eventIds) };
    if (q) where.name = { [Op.like]: `%${q}%` };
    const [criteria, selected] = await Promise.all([
      Criterion.findAll({
        where,
        include: [Event, Category],
        order: [["eventId", "ASC"], ["displayOrder", "ASC"]],
      }),
      selectedEventId ? Event.findByPk(selectedEventId) : null,
    ]);
    res.render("judge/criteria", {
      title: "Criteria & Guidelines",
      nav: "criteria",
      criteria: plain(criteria),
      events: plain(events),
      selected: plain(selected),
      filters: { eventId: selectedEventId, q },
      stats: { total: criteria.length },
    });
  },

  scoring: async (req, res) => {
    const events = await assignedEvents(req.user.id);
    const requestedId = Number(req.query.eventId);
    const selected = events.find((item) => Number(item.id) === requestedId) || events[0] || null;
    let contestants = [];
    let categoryOptions = [];
    let selectedCategoryId = "";

    if (selected) {
      const [categories, uncategorizedCount] = await Promise.all([
        Category.findAll({
          where: { eventId: selected.id },
          order: [["displayOrder", "ASC"], ["name", "ASC"]],
        }),
        Contestant.count({
          where: { eventId: selected.id, status: "registered", categoryId: null },
        }),
      ]);
      const requestedCategoryId = typeof req.query.categoryId === "string"
        ? req.query.categoryId
        : "";
      const validCategoryId = categories.some(
        (category) => String(category.id) === requestedCategoryId
      );
      selectedCategoryId = validCategoryId
        ? requestedCategoryId
        : requestedCategoryId === "none" && uncategorizedCount
          ? "none"
          : "";
      categoryOptions = [
        { value: "", label: "All categories", selected: !selectedCategoryId },
        ...plain(categories).map((category) => ({
          value: String(category.id),
          label: category.name,
          selected: String(category.id) === selectedCategoryId,
        })),
        ...(uncategorizedCount
          ? [{
            value: "none",
            label: "No category",
            selected: selectedCategoryId === "none",
          }]
          : []),
      ];

      const contestantWhere = {
        eventId: selected.id,
        status: "registered",
      };
      if (selectedCategoryId === "none") {
        contestantWhere.categoryId = null;
      } else if (selectedCategoryId) {
        contestantWhere.categoryId = Number(selectedCategoryId);
      }

      const [registeredContestants, criteria, sheets] = await Promise.all([
        Contestant.findAll({
          where: contestantWhere,
          include: [Category],
          order: [["contestantNumber", "ASC"]],
        }),
        Criterion.findAll({
          where: { eventId: selected.id },
          order: [["displayOrder", "ASC"]],
        }),
        ScoreSheet.findAll({
          where: { eventId: selected.id, judgeId: req.user.id },
          include: [Score],
        }),
      ]);
      const sheetMap = new Map();
      for (const sheet of sheets) {
        const data = plain(sheet);
        data.scoreMap = {};
        for (const score of data.Scores || []) {
          data.scoreMap[score.criterionId] = score.scoreValue;
        }
        sheetMap.set(Number(data.contestantId), data);
      }

      contestants = plain(registeredContestants).map((item) => {
        const applicableCriteria = plain(criteria).filter(
          (criterion) =>
            !criterion.categoryId ||
            Number(criterion.categoryId) === Number(item.categoryId)
        );
        const sheet = sheetMap.get(Number(item.id)) || null;
        const totalWeight = applicableCriteria.reduce(
          (total, criterion) => total + Number(criterion.weightPercentage || 0),
          0
        );
        return {
          ...item,
          fullName: fullName(item),
          sheet,
          criteria: applicableCriteria,
          rubricBalanced: Math.abs(totalWeight - 100) < 0.01,
          canEdit:
            scoringOpen(selected) &&
            (sheet?.status !== "submitted" || selected.allowScoreRevision),
        };
      });
    }

    res.render("judge/scoring", {
      title: "Score Entry",
      nav: "scoring",
      events: plain(events),
      selected: plain(selected),
      contestants,
      categories: categoryOptions,
      filters: { categoryId: selectedCategoryId },
      scoringOpen: scoringOpen(selected),
    });
  },

  saveScores: async (req, res) => {
    const eventId = Number(req.body.eventId);
    const contestantId = Number(req.body.contestantId);
    const action = req.body.action;
    if (
      !Number.isSafeInteger(eventId) ||
      eventId < 1 ||
      !Number.isSafeInteger(contestantId) ||
      contestantId < 1 ||
      !["draft", "submit"].includes(action)
    ) {
      req.flash("error_msg", "The score submission is invalid. Review the event and contestant, then try again.");
      return res.redirect("/judge/scoring");
    }

    const assigned = await ensureAssigned(req.user.id, eventId);
    if (!assigned) {
      req.flash("error_msg", "You are not assigned to this event.");
      return res.redirect("/judge/scoring");
    }
    const event = await Event.findByPk(eventId);
    const contestant = await Contestant.findOne({
      where: { id: contestantId, eventId, status: "registered" },
    });
    if (!event || !contestant) {
      req.flash("error_msg", "Select a registered contestant from this event.");
      return res.redirect(`/judge/scoring?eventId=${eventId}`);
    }
    if (!scoringOpen(event)) {
      req.flash("error_msg", "Score entry is available only while the event is ongoing or in judging.");
      return res.redirect(`/judge/scoring?eventId=${eventId}`);
    }

    let sheet = await ScoreSheet.findOne({
      where: { eventId, contestantId, judgeId: req.user.id },
    });
    if (sheet?.status === "submitted" && !event.allowScoreRevision) {
      req.flash("error_msg", "Submitted scores can no longer be revised for this event.");
      return res.redirect(`/judge/scoring?eventId=${eventId}`);
    }

    const criteria = await Criterion.findAll({
      where: {
        eventId,
        ...(contestant.categoryId
          ? { [Op.or]: [{ categoryId: null }, { categoryId: contestant.categoryId }] }
          : { categoryId: null }),
      },
      order: [["displayOrder", "ASC"]],
    });
    if (!criteria.length) {
      req.flash("error_msg", "This event has no judging criteria configured for the contestant.");
      return res.redirect(`/judge/scoring?eventId=${eventId}`);
    }

    const submittedScores = [];
    for (const criterion of criteria) {
      const key = `score_${criterion.id}`;
      if (req.body[key] === undefined || req.body[key] === "") {
        if (action === "submit") {
          req.flash("error_msg", `Enter a score for ${criterion.name} before submitting.`);
          return res.redirect(`/judge/scoring?eventId=${eventId}`);
        }
        continue;
      }
      const value = Number(req.body[key]);
      if (
        !Number.isFinite(value) ||
        value < Number(criterion.minScore) ||
        value > Number(criterion.maxScore)
      ) {
        req.flash(
          "error_msg",
          `${criterion.name} must be between ${criterion.minScore} and ${criterion.maxScore}.`
        );
        return res.redirect(`/judge/scoring?eventId=${eventId}`);
      }
      submittedScores.push({ criterionId: criterion.id, scoreValue: value });
    }

    if (action === "draft" && submittedScores.length === 0 && !sheet) {
      req.flash("error_msg", "Enter at least one score before saving a draft.");
      return res.redirect(`/judge/scoring?eventId=${eventId}`);
    }
    const totalWeight = criteria.reduce(
      (total, criterion) => total + Number(criterion.weightPercentage || 0),
      0
    );
    if (action === "submit" && Math.abs(totalWeight - 100) >= 0.01) {
      req.flash(
        "error_msg",
        "This contestant's applicable criteria do not total 100%. Contact the event organizer before submitting."
      );
      return res.redirect(`/judge/scoring?eventId=${eventId}`);
    }

    const scoreIds = submittedScores.map((score) => score.criterionId);
    await ScoreSheet.sequelize.transaction(async (transaction) => {
      if (!sheet) {
        sheet = await ScoreSheet.create(
          {
            eventId,
            contestantId,
            judgeId: req.user.id,
            remarks: typeof req.body.remarks === "string" ? req.body.remarks.trim() : "",
            status: "draft",
          },
          { transaction }
        );
      } else {
        sheet.remarks = typeof req.body.remarks === "string" ? req.body.remarks.trim() : "";
      }

      for (const score of submittedScores) {
        const [existing] = await Score.findOrCreate({
          where: { scoreSheetId: sheet.id, criterionId: score.criterionId },
          defaults: { scoreValue: score.scoreValue },
          transaction,
        });
        if (Number(existing.scoreValue) !== score.scoreValue) {
          existing.scoreValue = score.scoreValue;
          await existing.save({ transaction });
        }
      }

      await Score.destroy({
        where: {
          scoreSheetId: sheet.id,
          criterionId: {
            [Op.in]: criteria.map((criterion) => criterion.id),
            ...(scoreIds.length ? { [Op.notIn]: scoreIds } : {}),
          },
        },
        transaction,
      });

      sheet.status = action === "submit" ? "submitted" : "draft";
      sheet.submittedAt = action === "submit" ? new Date() : null;
      await sheet.save({ transaction });
    });

    await logActivity(
      req,
      action === "submit" ? "Submitted scores" : "Saved draft scores",
      "Score Entry",
      `Event ${eventId}, contestant ${contestantId}`
    );
    req.flash(
      "success_msg",
      action === "submit"
        ? "Scores submitted successfully. You can review your submission from the score entry page."
        : "Draft scores saved. Review the entries before submitting."
    );
    res.redirect(`/judge/scoring?eventId=${eventId}`);
  },
};
