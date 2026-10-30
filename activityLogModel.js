import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const ActivityLog = sequelize.define(
  "ActivityLog",
  {
    userId: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false },
    module: { type: DataTypes.STRING, allowNull: false },
    details: { type: DataTypes.TEXT, allowNull: true },
    ipAddress: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "activity_logs" }
);
