import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Score = sequelize.define(
  "Score",
  {
    scoreSheetId: { type: DataTypes.INTEGER, allowNull: false },
    criterionId: { type: DataTypes.INTEGER, allowNull: false },
    scoreValue: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
  },
  { tableName: "scores" }
);
