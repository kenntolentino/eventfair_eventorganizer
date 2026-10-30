import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const TabulationReport = sequelize.define(
  "TabulationReport",
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    generatedBy: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "tabulation_reports" }
);
