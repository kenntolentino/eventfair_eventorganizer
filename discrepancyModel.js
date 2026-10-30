import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Discrepancy = sequelize.define(
  "Discrepancy",
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    contestantId: { type: DataTypes.INTEGER, allowNull: true },
    reportedBy: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("open", "under_review", "resolved"),
      allowNull: false,
      defaultValue: "open",
    },
    resolutionNotes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "discrepancies" }
);
