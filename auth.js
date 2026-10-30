import { User } from "../models/index.js";
import { getHomepageContent } from "../utils/homepageContent.js";

const ROLE_HOME = {
  admin: "/admin/dashboard",
  event_organizer: "/organizer/dashboard",
  judge: "/judge/dashboard",
  tabulator: "/tabulator/dashboard",
};

export function roleHome(role) {
  return ROLE_HOME[role] || "/login";
}

export const requireAuth = async (req, res, next) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user || user.status !== "active") {
      req.session.userId = null;
      req.flash("error_msg", "Your account is inactive or no longer available.");
      return res.redirect("/login");
    }

    const plain = user.get({ plain: true });
    delete plain.password;
    req.user = plain;
    res.locals.currentUser = plain;
    res.locals.roleHome = roleHome(plain.role);
    res.locals.content = await getHomepageContent();
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (role) => [
  requireAuth,
  (req, res, next) => {
    const allowed = Array.isArray(role) ? role : [role];
    if (!req.user || !allowed.includes(req.user.role)) {
      req.flash("error_msg", "You do not have permission to access that module.");
      return res.redirect(roleHome(req.user?.role) || "/login");
    }
    next();
  },
];

export const guestOnly = (req, res, next) => {
  if (req.session.userId) {
    return res.redirect("/dashboard");
  }
  next();
};
