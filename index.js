import express from "express";
import { homePage } from "../controllers/homeController.js";
import {
  loginPage,
  registerPage,
  forgotPasswordPage,
  dashboardPage,
  loginUser,
  registerUser,
  logoutUser,
} from "../controllers/authController.js";
import { adminController } from "../controllers/adminController.js";
import { organizerController } from "../controllers/organizerController.js";
import { judgeController } from "../controllers/judgeController.js";
import { tabulatorController } from "../controllers/tabulatorController.js";
import { guestOnly, requireAuth, requireRole } from "../middleware/auth.js";
import { contestantImageUpload } from "../middleware/contestantImageUpload.js";
import { homepageImageUpload } from "../middleware/homepageImageUpload.js";
import { homepageVideoUpload } from "../middleware/homepageVideoUpload.js";

const router = express.Router();

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
const asyncController = (controller) =>
  Object.fromEntries(
    Object.entries(controller).map(([name, handler]) => [name, asyncHandler(handler)])
  );
const adminActions = asyncController(adminController);
const organizerActions = asyncController(organizerController);
const judgeActions = asyncController(judgeController);
const tabulatorActions = asyncController(tabulatorController);

router.get("/", asyncHandler(homePage));
router.get("/login", guestOnly, asyncHandler(loginPage));
router.post("/login", guestOnly, asyncHandler(loginUser));
router.get("/register", guestOnly, asyncHandler(registerPage));
router.post("/register", guestOnly, asyncHandler(registerUser));
router.get("/forgot-password", guestOnly, forgotPasswordPage);
router.get("/dashboard", requireAuth, dashboardPage);
router.get("/logout", asyncHandler(logoutUser));

const admin = requireRole("admin");
router.get("/admin/dashboard", admin, adminActions.dashboard);
router.get("/admin/scoring-configuration", admin, adminActions.scoringConfiguration);
router.get("/admin/reports", admin, adminActions.reports);
router.get("/admin/maintenance", admin, adminActions.maintenance);
router.get("/admin/archive", admin, (_req, res) => res.redirect("/admin/settings#archive"));
router.post("/admin/archive/:type/:id/restore", admin, adminActions.restoreArchivedRecord);
router.get("/admin/homepage", admin, adminActions.homepage);
router.post("/admin/homepage", admin, homepageImageUpload, adminActions.updateHomepage);
router.post("/admin/homepage/preview", admin, homepageImageUpload, adminActions.previewHomepage);
router.post("/admin/homepage/videos", admin, homepageVideoUpload, adminActions.createHomepageVideo);
router.post("/admin/homepage/videos/:id/delete", admin, adminActions.deleteHomepageVideo);
router.get("/admin/users", admin, adminActions.users);
router.post("/admin/users", admin, adminActions.createUser);
router.post("/admin/users/:id", admin, adminActions.updateUser);
router.post("/admin/users/:id/toggle", admin, adminActions.toggleUser);
router.post("/admin/users/:id/delete", admin, adminActions.deleteUser);
router.get("/admin/settings", admin, adminActions.settings);
router.post("/admin/settings", admin, adminActions.createSetting);
router.post("/admin/settings/:id", admin, adminActions.updateSetting);
router.post("/admin/settings/:id/delete", admin, adminActions.deleteSetting);
router.get("/admin/logs", admin, adminActions.logs);
router.get("/admin/events", admin, adminActions.events);
router.post("/admin/events", admin, adminActions.createEvent);
router.post("/admin/events/:id", admin, adminActions.updateEvent);
router.post("/admin/events/:id/delete", admin, adminActions.deleteEvent);

const organizer = requireRole("event_organizer");
router.get("/organizer/dashboard", organizer, organizerActions.dashboard);
router.get("/organizer/events", organizer, organizerActions.events);
router.post("/organizer/events", organizer, organizerActions.createEvent);
router.post("/organizer/events/:id", organizer, organizerActions.updateEvent);
router.post("/organizer/events/:id/delete", organizer, organizerActions.deleteEvent);
router.get("/organizer/contestants", organizer, organizerActions.contestants);
router.post("/organizer/contestants", organizer, contestantImageUpload, organizerActions.createContestant);
router.post("/organizer/contestants/:id", organizer, contestantImageUpload, organizerActions.updateContestant);
router.post("/organizer/contestants/:id/delete", organizer, organizerActions.deleteContestant);
router.get("/organizer/categories", organizer, organizerActions.categories);
router.post("/organizer/categories", organizer, organizerActions.createCategory);
router.post("/organizer/categories/:id", organizer, organizerActions.updateCategory);
router.post("/organizer/categories/:id/delete", organizer, organizerActions.deleteCategory);
router.get("/organizer/criteria", organizer, organizerActions.criteria);
router.post("/organizer/criteria", organizer, organizerActions.createCriterion);
router.post("/organizer/criteria/:id", organizer, organizerActions.updateCriterion);
router.post("/organizer/criteria/:id/delete", organizer, organizerActions.deleteCriterion);
router.get("/organizer/assignments", organizer, organizerActions.assignments);
router.post("/organizer/assignments", organizer, organizerActions.createAssignment);
router.post("/organizer/assignments/:id", organizer, organizerActions.updateAssignment);
router.post("/organizer/assignments/:id/delete", organizer, organizerActions.deleteAssignment);
router.get("/organizer/progress", organizer, organizerActions.progress);
router.get("/organizer/reports", organizer, organizerActions.reports);
router.get("/organizer/publish", organizer, organizerActions.publish);
router.post("/organizer/publish/:id", organizer, organizerActions.approveResults);

const judge = requireRole("judge");
router.get("/judge/dashboard", judge, judgeActions.dashboard);
router.get("/judge/events", judge, judgeActions.events);
router.get("/judge/contestants", judge, judgeActions.contestants);
router.get("/judge/criteria", judge, judgeActions.criteria);
router.get("/judge/scoring", judge, judgeActions.scoring);
router.post("/judge/scoring", judge, judgeActions.saveScores);

const tabulator = requireRole("tabulator");
router.get("/tabulator/dashboard", tabulator, tabulatorActions.dashboard);
router.get("/tabulator/events", tabulator, tabulatorActions.events);
router.get("/tabulator/submissions", tabulator, tabulatorActions.submissions);
router.get("/tabulator/computation", tabulator, tabulatorActions.computation);
router.post("/tabulator/computation/:id", tabulator, tabulatorActions.compute);
router.get("/tabulator/discrepancies", tabulator, tabulatorActions.discrepancies);
router.post("/tabulator/discrepancies", tabulator, tabulatorActions.createDiscrepancy);
router.post("/tabulator/discrepancies/:id", tabulator, tabulatorActions.updateDiscrepancy);
router.post("/tabulator/discrepancies/:id/delete", tabulator, tabulatorActions.deleteDiscrepancy);
router.get("/tabulator/reports", tabulator, tabulatorActions.reports);
router.post("/tabulator/reports", tabulator, tabulatorActions.createReport);
router.get("/tabulator/reports/:id/pdf", tabulator, tabulatorActions.downloadReportPdf);
router.post("/tabulator/reports/:id", tabulator, tabulatorActions.updateReport);
router.post("/tabulator/reports/:id/delete", tabulator, tabulatorActions.deleteReport);

export default router;
