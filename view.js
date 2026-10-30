export function plain(record) {
  if (!record) return null;
  if (Array.isArray(record)) return record.map((item) => plain(item));
  if (typeof record.get === "function") {
    const data = record.get({ plain: true });
    if (data.password) delete data.password;
    return data;
  }
  return record;
}

export function fullName(contestant) {
  if (!contestant) return "—";
  return [contestant.firstName, contestant.middleName, contestant.lastName].filter(Boolean).join(" ");
}

export function idsOrNone(ids) {
  return ids?.length ? ids : [-1];
}

export function roleLabel(role) {
  return {
    admin: "Administrator",
    event_organizer: "Event Organizer",
    judge: "Judge",
    tabulator: "Tabulator",
  }[role] || role;
}
