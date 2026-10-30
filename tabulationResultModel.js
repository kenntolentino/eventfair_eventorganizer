import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const TabulationResult = sequelize.define(
  "TabulationResult",
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    contestantId: { type: DataTypes.INTEGER, allowNull: false },
    totalRawScore: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    totalWeightedScore: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    averageScore: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    rank: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM("draft", "verified", "published"),
      allowNull: false,
      defaultValue: "draft",
    },
    tabulatedBy: { type: DataTypes.INTEGER, allowNull: true },
    tabulatedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "tabulation_results" }
);
