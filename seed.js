import bcrypt from "bcrypt";
import { User, SystemSetting } from "./index.js";

export async function seedDefaults() {
  const defaults = [
    {
      name: "System Administrator",
      email: "admin@eventfair.local",
      password: "Admin@123",
      role: "admin",
      organization: "EventFair",
    },
    {
      name: "Event Organizer",
      email: "organizer@eventfair.local",
      password: "EventFair@123",
      role: "event_organizer",
      organization: "EventFair",
    },
    {
      name: "Competition Judge",
      email: "judge@eventfair.local",
      password: "EventFair@123",
      role: "judge",
      organization: "EventFair",
    },
    {
      name: "Official Tabulator",
      email: "tabulator@eventfair.local",
      password: "EventFair@123",
      role: "tabulator",
      organization: "EventFair",
    },
  ];

  for (const account of defaults) {
    const existing = await User.findOne({ where: { email: account.email } });
    if (!existing) {
      await User.create({
        ...account,
        password: await bcrypt.hash(account.password, 10),
        status: "active",
      });
    }
  }

  const settings = [
    {
      settingKey: "system_name",
      settingValue: "EventFair",
      description: "Public system name displayed across the platform.",
    },
    {
      settingKey: "allow_public_registration",
      settingValue: "true",
      description: "Allow new event organizers to register from the login page.",
    },
    {
      settingKey: "results_require_approval",
      settingValue: "true",
      description: "Require event organizer approval before publishing rankings.",
    },
    {
      settingKey: "maintenance_mode",
      settingValue: "false",
      description: "Temporarily restrict access for system maintenance.",
    },
  ];

  for (const setting of settings) {
    const existing = await SystemSetting.findOne({
      where: { settingKey: setting.settingKey },
      paranoid: false,
    });
    if (!existing) await SystemSetting.create(setting);
  }
}
