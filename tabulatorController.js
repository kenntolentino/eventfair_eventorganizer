import { Op } from "sequelize";
import {
  User,
  Event,
  Contestant,
  Criterion,
  EventAssignment,
  ScoreSheet,
  Score,
  TabulationResult,
  Discrepancy,
  TabulationReport,
} from "../models/index.js";
import { logActivity } from "../utils/activity.js";
import { plain, fullName, idsOrNone } from "../utils/view.js";
import { sheetWeightedTotal, rankContestants } from "../utils/scoring.js";
import { createTabulationReportPdf } from "../utils/tabulationReportPdf.js";

const SCOREABLE_EVENT_STATUSES = ["ongoing", "judging"];
const DISCREPANCY_STATUSES = ["open", "under_review", "resolved"];
const SHEET_STATUSES = ["draft", "submitted"];

function scoringOpen(event) {
  return SCOREABLE_EVENT_STATUSES.includes(event?.status);
}

async function assignedEvents(userId) {
  const assignments = await EventAssignment.findAll({
    where: { userId, assignmentRole: "tabulator" },
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
    where: { userId, eventId, assignmentRole: "tabulator" },
  });
}

function validateSheet(sheet, criteria) {
  const scores = sheet.Scores || [];
  const criteriaById = new Map(criteria.map((criterion) => [Number(criterion.id), criterion]));
  const scoredIds = new Set();
  const errors = [];

  for (const score of scores) {
    const criterionId = Number(score.criterionId);
    const criterion = criteriaById.get(criterionId);
    if (!criterion) {
      errors.push("Contains a score for a criterion not applicable to this contestant.");
      continue;
    }
    if (scoredIds.has(criterionId)) {
      errors.push(`${criterion.name} has duplicate score records.`);
      continue;
    }
    const value = Number(score.scoreValue);
    if (!Number.isFinite(value) || value < Number(criterion.minScore) || value > Number(criterion.maxScore)) {
      errors.push(`${criterion.name} has a score outside its allowed range.`);
    }
    scoredIds.add(criterionId);
  }
  for (const criterion of criteria) {
    if (!scoredIds.has(Number(criterion.id))) errors.push(`Missing score for ${criterion.name}.`);
  }
  if (!criteria.length) errors.push("No applicable judging criteria are configured.");
  return { complete: errors.length === 0, errors };
}

function criteriaForContestant(criteria, contestant) {
  return criteria.filter(
    (criterion) =>
      !criterion.categoryId ||
      Number(criterion.categoryId) === Number(contestant.categoryId)
  );
}

function scoreBreakdown(scores = []) {
  const rows = scores.map((score) => {
    const criterion = score.Criterion;
    const value = Number(score.scoreValue);
    const maxScore = Number(criterion?.maxScore) || 0;
    const weight = Number(criterion?.weightPercentage) || 0;
    const weightedScore = maxScore > 0 ? (value / maxScore) * weight : 0;
    return {
      criterionName: criterion?.name || "Criterion unavailable",
      scoreValue: Number.isFinite(value) ? value : 0,
      maxScore,
      weight,
      weightedScore: Number(weightedScore.toFixed(2)),
    };
  });
  return {
    scores: rows,
    rawTotal: Number(rows.reduce((total, row) => total + row.scoreValue, 0).toFixed(2)),
    weightedTotal: Number(
      scores.reduce((total, score) => {
        const criterion = score.Criterion;
        const maxScore = Number(criterion?.maxScore) || 0;
        const weight = Number(criterion?.weightPercentage) || 0;
        return maxScore > 0
          ? total + (Number(score.scoreValue) / maxScore) * weight
          : total;
      }, 0).toFixed(2)
    ),
  };
}

async function judgeScoreBreakdown(eventId) {
  const sheets = await ScoreSheet.findAll({
    where: { eventId, status: { [Op.in]: SHEET_STATUSES } },
    include: [
      Contestant,
      { model: User, as: "judge" },
      { model: Score, include: [Criterion] },
    ],
    order: [["contestantId", "ASC"], ["judgeId", "ASC"]],
  });
  return plain(sheets).map((sheet) => ({
    contestantName: fullName(sheet.Contestant),
    contestantNumber: sheet.Contestant?.contestantNumber,
    judgeName: sheet.judge?.name || "Judge unavailable",
    status: sheet.status,
    ...scoreBreakdown(sheet.Scores || []),
  }));
}

async function eventQuality(event) {
  const [contestants, criteria, judgeAssignments, sheets, draftSheets, openIssues, resultCount, verifiedResultCount] =
    await Promise.all([
      Contestant.findAll({
        where: { eventId: event.id, status: "registered" },
        order: [["contestantNumber", "ASC"]],
      }),
      Criterion.findAll({
        where: { eventId: event.id },
        order: [["displayOrder", "ASC"]],
      }),
      EventAssignment.findAll({
        where: { eventId: event.id, assignmentRole: "judge" },
      }),
      ScoreSheet.findAll({
        where: { eventId: event.id, status: "submitted" },
        include: [Score],
      }),
      ScoreSheet.count({
        where: { eventId: event.id, status: "draft" },
      }),
      Discrepancy.count({
        where: { eventId: event.id, status: { [Op.in]: ["open", "under_review"] } },
      }),
      TabulationResult.count({ where: { eventId: event.id } }),
      TabulationResult.count({
        where: { eventId: event.id, status: { [Op.in]: ["verified", "published"] } },
      }),
    ]);
  const judgeIds = judgeAssignments.map((assignment) => Number(assignment.userId));
  const sheetsByContestant = new Map();
  for (const sheet of sheets) {
    const key = Number(sheet.contestantId);
    const list = sheetsByContestant.get(key) || [];
    list.push(sheet);
    sheetsByContestant.set(key, list);
  }

  const incomplete = [];
  let completeSheets = 0;
  const unassignedSheets = sheets.filter(
    (sheet) => !judgeIds.includes(Number(sheet.judgeId))
  ).length;
  for (const contestant of contestants) {
    const applicable = criteriaForContestant(criteria, contestant);
    const contestantSheets = sheetsByContestant.get(Number(contestant.id)) || [];
    const validJudgeSheets = new Set();
    const reviewNotes = [];
    for (const judgeId of judgeIds) {
      const judgeSheets = contestantSheets.filter(
        (sheet) => Number(sheet.judgeId) === judgeId
      );
      if (judgeSheets.length !== 1) {
        reviewNotes.push(
          judgeSheets.length
            ? "Duplicate submitted sheets from an assigned judge."
            : "Missing submitted sheet from an assigned judge."
        );
        continue;
      }
      const validation = validateSheet(judgeSheets[0], applicable);
      if (validation.complete) {
        validJudgeSheets.add(judgeId);
      } else {
        reviewNotes.push(...validation.errors);
      }
    }
    completeSheets += validJudgeSheets.size;
    if (validJudgeSheets.size < judgeIds.length) {
      incomplete.push({
        ...plain(contestant),
        fullName: fullName(contestant),
        submitted: validJudgeSheets.size,
        expected: judgeIds.length,
        missing: Math.max(judgeIds.length - validJudgeSheets.size, 0),
        reviewNotes: [...new Set(reviewNotes)],
      });
    }
  }
  const expectedSheets = contestants.length * judgeIds.length;
  const ready = contestants.length > 0 && judgeIds.length > 0 &&
    incomplete.length === 0 &&
    unassignedSheets === 0 &&
    contestants.every((contestant) => {
      const applicable = criteriaForContestant(criteria, contestant);
      const totalWeight = applicable.reduce(
        (sum, criterion) => sum + Number(criterion.weightPercentage || 0),
        0
      );
      return applicable.length > 0 && Math.abs(totalWeight - 100) < 0.01;
    }) &&
    openIssues === 0;
  return {
    contestants,
    criteria,
    judges: judgeIds.length,
    contestantCount: contestants.length,
    submittedSheets: sheets.length,
    draftSheets,
    completeSheets,
    expectedSheets,
    incomplete,
    incompleteContestants: incomplete.length,
    unassignedSheets,
    openIssues,
    resultCount,
    verifiedResultCount,
    ready,
  };
}

function selectedEvent(events, requestedId) {
  const id = Number(requestedId);
  return events.find((event) => Number(event.id) === id) || events[0] || null;
}

function eventOverview(quality) {
  return {
    judges: quality.judges,
    contestantCount: quality.contestantCount,
    submittedSheets: quality.submittedSheets,
    draftSheets: quality.draftSheets,
    completeSheets: quality.completeSheets,
    expectedSheets: quality.expectedSheets,
    incompleteContestants: quality.incompleteContestants,
    unassignedSheets: quality.unassignedSheets,
    openIssues: quality.openIssues,
    resultCount: quality.resultCount,
    verifiedResultCount: quality.verifiedResultCount,
    ready: quality.ready,
  };
}

function validTitle(value) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 255;
}

function reportNotes(summary = "") {
  const marker = "\n\nTabulator notes:\n";
  const index = summary.indexOf(marker);
  return index < 0 ? "" : summary.slice(index + marker.length).trim();
}

function placementLabel(rank) {
  const value = Number(rank);
  if (!Number.isSafeInteger(value) || value < 1) return "Unranked";
  if (value === 1) return "Champion";
  if (value === 2) return "1st Runner-up";
  if (value === 3) return "2nd Runner-up";
  const suffix = value % 100 >= 11 && value % 100 <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[value % 10] || "th");
  return `${value}${suffix} Place`;
}

async function verifiedStandings(event) {
  const results = await TabulationResult.findAll({
    where: { eventId: event.id, status: { [Op.in]: ["verified", "published"] } },
    include: [Contestant],
    order: [["rank", "ASC"], ["contestantId", "ASC"]],
  });
  const useWeightedTotal = event.scoringFormula === "sum_weighted";
  return plain(results).map((result) => ({
    rank: Number(result.rank),
    placementLabel: placementLabel(result.rank),
    contestantName: fullName(result.Contestant),
    contestantNumber: result.Contestant?.contestantNumber || "N/A",
    score: Number(useWeightedTotal ? result.totalWeightedScore : result.averageScore).toFixed(2),
    scoreLabel: useWeightedTotal ? "weighted total" : "weighted average",
    rawScore: Number(result.totalRawScore).toFixed(2),
    status: result.status,
  }));
}

async function generatedReportSummary(event, quality) {
  const standings = await verifiedStandings(event);
  const useWeightedTotal = event.scoringFormula === "sum_weighted";
  const formula = useWeightedTotal
    ? "sum of weighted judge scores"
    : "average of weighted judge scores";
  const leadingRank = standings.find((result) => Number.isSafeInteger(result.rank) && result.rank > 0)?.rank;
  const leaders = standings
    .filter((result) => leadingRank && result.rank === leadingRank)
    .map((result) => `${result.contestantName} (#${result.contestantNumber}, ${result.score})`);
  const rankings = standings.map((result) =>
    `${result.placementLabel} | ${result.contestantName} | Contestant #${result.contestantNumber} | ${result.score} ${result.scoreLabel} | raw total ${result.rawScore}`
  );
  return [
    `Tabulation summary for ${event.name}.`,
    `Event status at generation: ${event.status}.`,
    `Scoring formula: ${formula}.`,
    `Complete judge sheets: ${quality.completeSheets} of ${quality.expectedSheets}.`,
    `Submitted judge sheets: ${quality.submittedSheets}; draft judge sheets: ${quality.draftSheets}.`,
    `Registered contestants: ${quality.contestantCount}; assigned judges: ${quality.judges}.`,
    `Open discrepancies at generation: ${quality.openIssues}.`,
    leaders.length
      ? `Champion${leaders.length > 1 ? "s" : ""} at snapshot by verified score: ${leaders.join("; ")}.`
      : "No champion or verified rankings are available yet. Complete and verify tabulation before publishing official placements.",
    rankings.length ? `Official placements and score standings:\n${rankings.join("\n")}` : "",
  ].join("\n");
}

export const tabulatorController = {
  dashboard: async (req, res) => {
    const events = await assignedEvents(req.user.id);
    const workloads = await Promise.all(events.map(async (event) => {
      const quality = await eventQuality(event);
      return { ...plain(event), ...eventOverview(quality), scoringOpen: scoringOpen(event) };
    }));
    const stats = workloads.reduce(
      (total, event) => ({
        events: total.events + 1,
        submitted: total.submitted + event.completeSheets,
        expected: total.expected + event.expectedSheets,
        incomplete: total.incomplete + event.incompleteContestants,
        openIssues: total.openIssues + event.openIssues,
        results: total.results + event.resultCount,
        ready: total.ready + Number(event.ready),
      }),
      { events: 0, submitted: 0, expected: 0, incomplete: 0, openIssues: 0, results: 0, ready: 0 }
    );

    res.render("tabulator/dashboard", {
      title: "Tabulator Dashboard",
      nav: "dashboard",
      stats,
      events: workloads,
    });
  },

  events: async (req, res) => {
    const events = await assignedEvents(req.user.id);
    res.render("tabulator/events", {
      title: "Assigned Events",
      nav: "events",
      events: await Promise.all(events.map(async (event) => {
        const quality = await eventQuality(event);
        return { ...plain(event), ...eventOverview(quality), scoringOpen: scoringOpen(event) };
      })),
    });
  },

  submissions: async (req, res) => {
    const events = await assignedEvents(req.user.id);
    const eventIds = events.map((item) => Number(item.id));
    const requestedEventId = Number(req.query.eventId);
    const eventId = eventIds.includes(requestedEventId) ? requestedEventId : "";
    const status = SHEET_STATUSES.includes(req.query.status) ? req.query.status : "";
    const where = { eventId: eventId || idsOrNone(eventIds) };
    if (status) where.status = status;
    const sheets = await ScoreSheet.findAll({
      where,
      include: [
        Event,
        Contestant,
        { model: User, as: "judge" },
        { model: Score, include: [Criterion] },
      ],
      order: [["updatedAt", "DESC"]],
    });
    const eventCriteria = new Map();
    const eventJudgeIds = new Map();
    await Promise.all(events.map(async (event) => {
      const [criteria, assignments] = await Promise.all([
        Criterion.findAll({ where: { eventId: event.id } }),
        EventAssignment.findAll({
          where: { eventId: event.id, assignmentRole: "judge" },
          attributes: ["userId"],
        }),
      ]);
      eventCriteria.set(Number(event.id), criteria);
      eventJudgeIds.set(Number(event.id), assignments.map((assignment) => Number(assignment.userId)));
    }));
    const submittedCount = sheets.filter((sheet) => sheet.status === "submitted").length;
    const auditedSheets = plain(sheets).map((item) => {
      const applicable = item.Contestant
        ? criteriaForContestant(eventCriteria.get(Number(item.eventId)) || [], item.Contestant)
        : [];
      const validation = validateSheet(item, applicable);
      if (!(eventJudgeIds.get(Number(item.eventId)) || []).includes(Number(item.judgeId))) {
        validation.complete = false;
        validation.errors.push("This sheet belongs to a judge who is not currently assigned to the event.");
      }
      return {
        ...item,
        contestantName: fullName(item.Contestant),
        judgeName: item.judge?.name,
        scoreCount: item.Scores?.length || 0,
        expectedScoreCount: applicable.length,
        scoreBreakdown: scoreBreakdown(item.Scores || []),
        quality: validation.complete ? "complete" : "needs review",
        qualityErrors: validation.errors,
      };
    });
    res.render("tabulator/submissions", {
      title: "Score Submissions",
      nav: "submissions",
      events: plain(events),
      sheets: auditedSheets,
      filters: { eventId, status },
      stats: {
        shown: sheets.length,
        submitted: submittedCount,
        needsReview: auditedSheets.filter((sheet) => sheet.quality !== "complete").length,
      },
    });
  },

  computation: async (req, res) => {
    const events = await assignedEvents(req.user.id);
    const selected = selectedEvent(events, req.query.eventId);
    let results = [];
    let incomplete = [];
    let submittedScores = [];
    let quality = null;

    if (selected) {
      [results, quality, submittedScores] = await Promise.all([
        TabulationResult.findAll({
          where: { eventId: selected.id },
          include: [Contestant],
          order: [["rank", "ASC"], ["contestantId", "ASC"]],
        }),
        eventQuality(selected),
        judgeScoreBreakdown(selected.id),
      ]);
      incomplete = quality.incomplete.map((item) => ({
        ...item,
        fullName: fullName(item),
      }));
    }

    const rankedResults = plain(results).map((item) => ({
      ...item,
      contestantName: fullName(item.Contestant),
      placementLabel: placementLabel(item.rank),
    }));
    res.render("tabulator/computation", {
      title: "Computation & Rankings",
      nav: "computation",
      events: plain(events),
      selected: plain(selected),
      results: rankedResults,
      leaders: rankedResults.filter(
        (item) =>
          Number(item.rank) >= 1 &&
          Number(item.rank) <= 3 &&
          ["verified", "published"].includes(item.status),
      ),
      submittedScores,
      incomplete,
      quality,
      scoringOpen: scoringOpen(selected),
    });
  },

  compute: async (req, res) => {
    const eventId = Number(req.params.id);
    if (!Number.isSafeInteger(eventId) || eventId < 1) {
      req.flash("error_msg", "Select a valid assigned event.");
      return res.redirect("/tabulator/computation");
    }
    const assigned = await ensureAssigned(req.user.id, eventId);
    if (!assigned) {
      req.flash("error_msg", "You are not assigned to this event.");
      return res.redirect("/tabulator/computation");
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      req.flash("error_msg", "Event not found.");
      return res.redirect("/tabulator/computation");
    }
    if (!scoringOpen(event)) {
      req.flash("error_msg", "Rankings can be computed only while the event is ongoing or in judging. Existing tabulated or published results are protected.");
      return res.redirect(`/tabulator/computation?eventId=${eventId}`);
    }

    const [criteria, contestants, judgeAssignments, quality] = await Promise.all([
      Criterion.findAll({ where: { eventId } }),
      Contestant.findAll({ where: { eventId, status: "registered" } }),
      EventAssignment.findAll({ where: { eventId, assignmentRole: "judge" } }),
      eventQuality(event),
    ]);
    const judgeIds = judgeAssignments.map((assignment) => Number(assignment.userId));
    if (!criteria.length || !contestants.length || !judgeIds.length) {
      req.flash("error_msg", "Computation requires judging criteria, registered contestants, and assigned judges.");
      return res.redirect(`/tabulator/computation?eventId=${eventId}`);
    }
    if (!quality.ready) {
      const reasons = [];
      if (quality.incompleteContestants.length) reasons.push(`${quality.incompleteContestants} contestant(s) have incomplete or inconsistent judge sheets`);
      if (quality.openIssues) reasons.push(`${quality.openIssues} discrepancy/discrepancies remain unresolved`);
      if (quality.unassignedSheets) reasons.push(`${quality.unassignedSheets} submitted sheet(s) belong to unassigned judges`);
      if (quality.criteria.length === 0) reasons.push("no judging criteria are configured");
      if (reasons.length) {
        req.flash("error_msg", `Cannot compute rankings: ${reasons.join("; ")}.`);
        return res.redirect(`/tabulator/computation?eventId=${eventId}`);
      }
      const unbalanced = contestants.find((contestant) => {
        const applicable = criteriaForContestant(criteria, contestant);
        const weightTotal = applicable.reduce(
          (total, criterion) => total + Number(criterion.weightPercentage || 0),
          0
        );
        return !applicable.length || Math.abs(weightTotal - 100) >= 0.01;
      });
      if (unbalanced) {
        req.flash("error_msg", `Cannot compute rankings: ${fullName(unbalanced)} has applicable criteria that do not total 100%.`);
        return res.redirect(`/tabulator/computation?eventId=${eventId}`);
      }
    }

    const computed = [];

    for (const contestant of contestants) {
      const contestantCriteria = criteriaForContestant(criteria, contestant);

      const sheets = await ScoreSheet.findAll({
        where: {
          eventId,
          contestantId: contestant.id,
          judgeId: judgeIds,
          status: "submitted",
        },
        include: [Score],
      });

      const sheetsByJudge = new Map(sheets.map((sheet) => [Number(sheet.judgeId), sheet]));
      const invalidJudge = judgeIds.find((judgeId) => {
        const sheet = sheetsByJudge.get(Number(judgeId));
        return !sheet || !validateSheet(sheet, contestantCriteria).complete;
      });
      if (invalidJudge) {
        req.flash(
          "error_msg",
          `Cannot compute rankings: ${fullName(contestant)} has a missing or invalid submitted sheet from an assigned judge.`
        );
        return res.redirect(`/tabulator/computation?eventId=${eventId}`);
      }

      let totalRaw = 0;
      let totalWeighted = 0;
      for (const sheet of sheets) {
        const totals = sheetWeightedTotal(sheet.Scores || [], contestantCriteria);
        totalRaw += totals.raw;
        totalWeighted += totals.weighted;
      }

      const judgeCount = sheets.length || 1;
      computed.push({
        contestantId: contestant.id,
        totalRawScore: Number(totalRaw.toFixed(2)),
        totalWeightedScore: Number(totalWeighted.toFixed(2)),
        averageScore: Number((totalWeighted / judgeCount).toFixed(2)),
      });
    }

    const ranked = rankContestants(computed, event.scoringFormula);
    await TabulationResult.sequelize.transaction(async (transaction) => {
      await TabulationResult.destroy({ where: { eventId }, transaction });
      for (const row of ranked) {
        await TabulationResult.create(
          {
            eventId,
            contestantId: row.contestantId,
            totalRawScore: row.totalRawScore,
            totalWeightedScore: row.totalWeightedScore,
            averageScore: row.averageScore,
            rank: row.rank,
            status: "verified",
            tabulatedBy: req.user.id,
            tabulatedAt: new Date(),
          },
          { transaction }
        );
      }

      event.status = "tabulated";
      await event.save({ transaction });
    });
    await logActivity(req, "Computed and verified rankings", "Tabulation", `${event.name} · ${ranked.length} contestants`);
    req.flash("success_msg", "Scores computed and rankings generated.");
    res.redirect(`/tabulator/computation?eventId=${eventId}`);
  },

  discrepancies: async (req, res) => {
    const events = await assignedEvents(req.user.id);
    const eventIds = events.map((item) => item.id);
    const status = DISCREPANCY_STATUSES.includes(req.query.status) ? req.query.status : "";
    const where = { eventId: idsOrNone(eventIds) };
    if (status) where.status = status;
    const discrepancies = await Discrepancy.findAll({
      where,
      include: [Event, Contestant, { model: User, as: "reporter" }],
      order: [["createdAt", "DESC"]],
    });
    const contestants = await Contestant.findAll({
      where: { eventId: idsOrNone(eventIds) },
    });
    res.render("tabulator/discrepancies", {
      title: "Discrepancies",
      nav: "discrepancies",
      discrepancies: plain(discrepancies).map((item) => ({
        ...item,
        contestantName: fullName(item.Contestant),
      })),
      events: plain(events),
      contestants: plain(contestants).map((item) => ({ ...item, fullName: fullName(item) })),
      filters: { status },
      stats: {
        total: discrepancies.length,
        open: discrepancies.filter((item) => item.status === "open").length,
        underReview: discrepancies.filter((item) => item.status === "under_review").length,
        resolved: discrepancies.filter((item) => item.status === "resolved").length,
      },
    });
  },

  createDiscrepancy: async (req, res) => {
    const eventId = Number(req.body.eventId);
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const assigned = Number.isSafeInteger(eventId) ? await ensureAssigned(req.user.id, eventId) : null;
    if (!assigned) {
      req.flash("error_msg", "You are not assigned to this event.");
      return res.redirect("/tabulator/discrepancies");
    }
    if (!validTitle(title)) {
      req.flash("error_msg", "Enter a discrepancy title of no more than 255 characters.");
      return res.redirect("/tabulator/discrepancies");
    }
    const contestantId = req.body.contestantId ? Number(req.body.contestantId) : null;
    const contestant = contestantId
      ? await Contestant.findOne({ where: { id: contestantId, eventId } })
      : null;
    if (contestantId && !contestant) {
      req.flash("error_msg", "Select a contestant from the assigned event.");
      return res.redirect("/tabulator/discrepancies");
    }
    await Discrepancy.create({
      eventId,
      contestantId,
      reportedBy: req.user.id,
      title,
      description: req.body.description,
      status: "open",
    });
    await logActivity(req, "Reported discrepancy", "Discrepancies", title);
    req.flash("success_msg", "Discrepancy recorded.");
    res.redirect("/tabulator/discrepancies");
  },

  updateDiscrepancy: async (req, res) => {
    const item = await Discrepancy.findByPk(req.params.id);
    const assigned = item ? await ensureAssigned(req.user.id, item.eventId) : null;
    const targetAssignment = item ? await ensureAssigned(req.user.id, req.body.eventId) : null;
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const status = DISCREPANCY_STATUSES.includes(req.body.status) ? req.body.status : null;
    const resolutionNotes = typeof req.body.resolutionNotes === "string" ? req.body.resolutionNotes.trim() : "";
    const contestant = req.body.contestantId
      ? await Contestant.findOne({ where: { id: req.body.contestantId, eventId: req.body.eventId } })
      : null;
    if (!item || !assigned || !targetAssignment || !validTitle(title) || !status || (req.body.contestantId && !contestant)) {
      req.flash("error_msg", "Select a valid assigned event, title, status, and contestant.");
      return res.redirect("/tabulator/discrepancies");
    }
    if (item.status === "resolved") {
      req.flash("error_msg", "Resolved discrepancy records are read-only to preserve the audit trail.");
      return res.redirect("/tabulator/discrepancies");
    }
    if (status === "resolved" && !resolutionNotes) {
      req.flash("error_msg", "Add resolution notes before marking a discrepancy resolved.");
      return res.redirect("/tabulator/discrepancies");
    }
    Object.assign(item, {
      eventId: req.body.eventId,
      contestantId: req.body.contestantId || null,
      title,
      description: req.body.description,
      status,
      resolutionNotes,
    });
    await item.save();
    await logActivity(req, "Updated discrepancy", "Discrepancies", title);
    req.flash("success_msg", "Discrepancy updated.");
    res.redirect("/tabulator/discrepancies");
  },

  deleteDiscrepancy: async (req, res) => {
    const item = await Discrepancy.findByPk(req.params.id);
    const assigned = item ? await ensureAssigned(req.user.id, item.eventId) : null;
    if (!item || !assigned) {
      req.flash("error_msg", "Discrepancy not found.");
      return res.redirect("/tabulator/discrepancies");
    }
    if (item.status === "resolved") {
      req.flash("error_msg", "Resolved discrepancy records cannot be deleted.");
      return res.redirect("/tabulator/discrepancies");
    }
    await item.destroy();
    await logActivity(req, "Deleted discrepancy", "Discrepancies", item.title);
    req.flash("success_msg", "Discrepancy deleted.");
    res.redirect("/tabulator/discrepancies");
  },

  reports: async (req, res) => {
    const events = await assignedEvents(req.user.id);
    const eventIds = events.map((item) => item.id);
    const requestedEventId = Number(req.query.eventId);
    const selectedEvent = events.find((event) => Number(event.id) === requestedEventId) || events[0] || null;
    const reports = await TabulationReport.findAll({
      where: { eventId: selectedEvent ? selectedEvent.id : idsOrNone(eventIds) },
      include: [Event, { model: User, as: "author" }],
      order: [["createdAt", "DESC"]],
    });
    const reportEvents = new Map(events.map((event) => [Number(event.id), event]));
    const currentQuality = selectedEvent ? await eventQuality(selectedEvent) : null;
    const currentStandings = selectedEvent ? await verifiedStandings(selectedEvent) : [];
    res.render("tabulator/reports", {
      title: "Tabulation Reports",
      nav: "reports",
      selectedEventId: selectedEvent?.id || "",
      defaultReportTitle: selectedEvent ? `Final Results Report — ${selectedEvent.name}` : "",
      selectedEvent: plain(selectedEvent),
      currentQuality: currentQuality ? eventOverview(currentQuality) : null,
      currentStandings,
      reports: plain(reports).map((report) => ({
        ...report,
        editData: {
          id: report.id,
          title: report.title,
          summary: reportNotes(report.summary || ""),
        },
        canManage:
          Number(report.generatedBy) === Number(req.user.id) &&
          !["tabulated", "published", "archived"].includes(reportEvents.get(Number(report.eventId))?.status),
      })),
      events: plain(events).map((event) => ({
        ...event,
        selected: Number(event.id) === Number(selectedEvent?.id),
      })),
      stats: {
        total: reports.length,
        events: events.length,
        verifiedResults: currentStandings.length,
      },
    });
  },

  downloadReportPdf: async (req, res, next) => {
    const report = await TabulationReport.findByPk(req.params.id, {
      include: [Event, { model: User, as: "author" }],
    });
    const assigned = report ? await ensureAssigned(req.user.id, report.eventId) : null;
    if (!report || !assigned) {
      req.flash("error_msg", "Report not found or you are not assigned to its event.");
      return res.redirect("/tabulator/reports");
    }

    const filename = `eventfair-tabulation-report-${report.id}.pdf`;
    const pdf = createTabulationReportPdf(report, report.Event, report.author);
    pdf.on("error", (error) => {
      if (res.headersSent) res.destroy(error);
      else next(error);
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    pdf.pipe(res);
    pdf.end();
  },

  createReport: async (req, res) => {
    const eventId = Number(req.body.eventId);
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const assigned = Number.isSafeInteger(eventId) ? await ensureAssigned(req.user.id, eventId) : null;
    if (!assigned) {
      req.flash("error_msg", "You are not assigned to this event.");
      return res.redirect("/tabulator/reports");
    }
    if (!validTitle(title)) {
      req.flash("error_msg", "Enter a report title of no more than 255 characters.");
      return res.redirect("/tabulator/reports");
    }
    const event = await Event.findByPk(eventId);
    if (!event) {
      req.flash("error_msg", "Event not found.");
      return res.redirect("/tabulator/reports");
    }
    const quality = await eventQuality(event);
    const notes = typeof req.body.summary === "string" ? req.body.summary.trim() : "";
    const snapshot = await generatedReportSummary(event, quality);
    const summary = notes ? `${snapshot}\n\nTabulator notes:\n${notes}` : snapshot;
    await TabulationReport.create({
      eventId,
      generatedBy: req.user.id,
      title,
      summary,
    });
    await logActivity(req, "Generated tabulation report", "Tabulation Reports", `${title} · ${event.name}`);
    req.flash("success_msg", "Tabulation report generated with the current submission and ranking summary.");
    res.redirect(`/tabulator/reports?eventId=${eventId}`);
  },

  updateReport: async (req, res) => {
    const report = await TabulationReport.findByPk(req.params.id);
    const assigned = report ? await ensureAssigned(req.user.id, report.eventId) : null;
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const event = report ? await Event.findByPk(report.eventId) : null;
    if (!report || !assigned || !event || !validTitle(title)) {
      req.flash("error_msg", "Enter a valid report title and verify that the report is assigned to your event.");
      return res.redirect("/tabulator/reports");
    }
    if (Number(report.generatedBy) !== Number(req.user.id) || ["tabulated", "published", "archived"].includes(event?.status)) {
      req.flash("error_msg", "This report is read-only because it was generated by another tabulator or its event is finalized.");
      return res.redirect("/tabulator/reports");
    }
    const quality = await eventQuality(event);
    const notes = typeof req.body.summary === "string" ? req.body.summary.trim() : "";
    report.title = title;
    const snapshot = await generatedReportSummary(event, quality);
    report.summary = notes ? `${snapshot}\n\nTabulator notes:\n${notes}` : snapshot;
    await report.save();
    await logActivity(req, "Refreshed tabulation report", "Tabulation Reports", title);
    req.flash("success_msg", "Report refreshed using the latest event data.");
    res.redirect(`/tabulator/reports?eventId=${event.id}`);
  },

  deleteReport: async (req, res) => {
    const report = await TabulationReport.findByPk(req.params.id);
    const assigned = report ? await ensureAssigned(req.user.id, report.eventId) : null;
    const event = report ? await Event.findByPk(report.eventId) : null;
    if (!report || !assigned) {
      req.flash("error_msg", "Report not found.");
      return res.redirect("/tabulator/reports");
    }
    if (Number(report.generatedBy) !== Number(req.user.id) || ["tabulated", "published", "archived"].includes(event?.status)) {
      req.flash("error_msg", "This report cannot be deleted because it was generated by another tabulator or its event is finalized.");
      return res.redirect("/tabulator/reports");
    }
    await report.destroy();
    await logActivity(req, "Deleted tabulation report", "Tabulation Reports", report.title);
    req.flash("success_msg", "Report deleted.");
    res.redirect("/tabulator/reports");
  },
};
