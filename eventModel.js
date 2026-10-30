import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Event = sequelize.define(
  "Event",
  {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    venue: { type: DataTypes.STRING, allowNull: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "scheduled",
        "ongoing",
        "judging",
        "tabulated",
        "published",
        "archived"
      ),
      allowNull: false,
      defaultValue: "draft",
    },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    evaluationInstructions: { type: DataTypes.TEXT, allowNull: true },
    scoringNotes: { type: DataTypes.TEXT, allowNull: true },
    scoringFormula: {
      type: DataTypes.ENUM("average_weighted", "sum_weighted"),
      allowNull: false,
      defaultValue: "average_weighted",
    },
    allowScoreRevision: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    resultsPublishedAt: { type: DataTypes.DATE, allowNull: true },
    resultsApprovedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "events", paranoid: true }
);
