import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const SystemSetting = sequelize.define(
  "SystemSetting",
  {
    settingKey: { type: DataTypes.STRING, allowNull: false, unique: true },
    settingValue: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "system_settings", paranoid: true }
);
