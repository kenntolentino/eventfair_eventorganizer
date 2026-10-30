import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const EventAssignment = sequelize.define(
  "EventAssignment",
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    assignmentRole: {
      type: DataTypes.ENUM("judge", "tabulator"),
      allowNull: false,
    },
    notes: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "event_assignments" }
);
