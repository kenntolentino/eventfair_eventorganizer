import bcrypt from "bcrypt";
import { User, SystemSetting } from "../models/index.js";
import { logActivity } from "../utils/activity.js";
import { roleHome } from "../middleware/auth.js";
import { getHomepageContent } from "../utils/homepageContent.js";

export const loginPage = async (_req, res) => {
  const content = await getHomepageContent();
  res.render("login", { title: `Sign in · ${content.brand.name}`, content });
};
export const registerPage = async (_req, res) => {
  const content = await getHomepageContent();
  res.render("register", { title: `Register · ${content.brand.name}`, content });
};
export const forgotPasswordPage = (req, res) =>
  res.render("forgotpassword", { title: "Forgot Password · EventFair" });

export const dashboardPage = (req, res) => {
  if (!req.user) return res.redirect("/login");
  return res.redirect(roleHome(req.user.role));
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) {
    req.flash("error_msg", "No account was found for that email.");
    return res.redirect("/login");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    req.flash("error_msg", "Incorrect password.");
    return res.redirect("/login");
  }

  if (user.status !== "active") {
    req.flash("error_msg", "This account is inactive. Contact the administrator.");
    return res.redirect("/login");
  }

  req.session.userId = user.id;
  req.user = user.get({ plain: true });
  await logActivity(req, "Signed in", "Authentication", `${user.email} signed in.`);
  req.flash("success_msg", `Welcome back, ${user.name}.`);
  return res.redirect(roleHome(user.role));
};

export const registerUser = async (req, res) => {
  const setting = await SystemSetting.findOne({ where: { settingKey: "allow_public_registration" } });
  if (setting && setting.settingValue === "false") {
    req.flash("error_msg", "Public registration is currently disabled.");
    return res.redirect("/login");
  }

  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!name || name.length > 120 || !email || email.length > 255 || password.length < 8) {
    req.flash("error_msg", "Enter your name, a valid email address, and a password with at least 8 characters.");
    return res.redirect("/register");
  }
  const existing = await User.findOne({ where: { email }, paranoid: false });
  if (existing) {
    req.flash(
      "error_msg",
      existing.deletedAt
        ? "That email belongs to an archived account. Contact the administrator to restore it."
        : "That email is already registered."
    );
    return res.redirect("/register");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: "event_organizer",
    status: "active",
  });

  req.session.userId = user.id;
  req.user = user.get({ plain: true });
  await logActivity(req, "Registered", "Authentication", `${user.email} created an organizer account.`);
  req.flash("success_msg", "Account created. You are signed in as an Event Organizer.");
  return res.redirect(roleHome(user.role));
};

export const logoutUser = async (req, res) => {
  if (req.session.userId) {
    await logActivity(req, "Signed out", "Authentication", "User signed out.");
  }
  req.session.destroy(() => res.redirect("/login"));
};
