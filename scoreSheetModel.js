import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const ScoreSheet = sequelize.define(
  "ScoreSheet",
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    contestantId: { type: DataTypes.INTEGER, allowNull: false },
    judgeId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("draft", "submitted"),
      allowNull: false,
      defaultValue: "draft",
    },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "score_sheets" }
);
