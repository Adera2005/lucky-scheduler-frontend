// ============================================================
// groupDays.js
// Pure utility — groups a flat array of study tasks into a
// hierarchical structure based on the total number of days:
//
//   < 7 days    → flat list of Day groups
//   7–27 days   → grouped into Weeks (Week 1, Week 2, …)
//                 each Week is expandable into individual Days
//   28+ days    → grouped into Months (Month 1 = Weeks 1-4, …)
//                 each Month → expandable Weeks → expandable Days
//
// Each level can be expanded / collapsed independently in the UI.
// Plain JS only — no external dependencies.
// ============================================================

/**
 * Given a flat tasks array (each task has a `.day` number),
 * returns a grouped structure.
 *
 * @param {Array}  tasks       - flat StudyTask array from the API
 * @param {number} totalDays   - schedule.totalDays
 * @returns {GroupedSchedule}
 *
 * GroupedSchedule shape:
 * {
 *   mode: 'days' | 'weeks' | 'months',
 *   groups: DayGroup[] | WeekGroup[] | MonthGroup[]
 * }
 *
 * DayGroup:   { type:'day',   day, tasks }
 * WeekGroup:  { type:'week',  weekNum, label, days: DayGroup[] }
 * MonthGroup: { type:'month', monthNum, label, weeks: WeekGroup[] }
 */
export function groupTasksByPeriod(tasks, totalDays) {
  // Build a map of day → tasks[], sorted
  const dayMap = new Map();
  tasks.forEach((t) => {
    if (!dayMap.has(t.day)) dayMap.set(t.day, []);
    dayMap.get(t.day).push(t);
  });

  const sortedDays = Array.from(dayMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, dayTasks]) => ({
      type: 'day',
      day,
      tasks: dayTasks,
    }));

  // ── Flat (< 7 days) ──
  if (totalDays < 7) {
    return { mode: 'days', groups: sortedDays };
  }

  // ── Week grouping (7–27 days) ──
  // 7 days per week. Week 1 = days 1-7, Week 2 = days 8-14, …
  const weekGroups = buildWeeks(sortedDays);

  if (totalDays < 28) {
    return { mode: 'weeks', groups: weekGroups };
  }

  // ── Month grouping (28+ days) ──
  // 4 weeks = 1 month. Month 1 = weeks 1-4, Month 2 = weeks 5-8, …
  const monthGroups = buildMonths(weekGroups);
  return { mode: 'months', groups: monthGroups };
}

// ── Private helpers ───────────────────────────────────────────

function buildWeeks(sortedDays) {
  const weeks = [];
  let weekNum = 1;
  let weekStart = 1; // first day of the current week

  let currentWeek = null;

  sortedDays.forEach((dayGroup) => {
    const { day } = dayGroup;

    // Advance week boundary if needed
    while (day > weekStart + 6) {
      if (currentWeek) weeks.push(currentWeek);
      weekNum++;
      weekStart += 7;
      currentWeek = null;
    }

    if (!currentWeek) {
      const weekEnd = weekStart + 6;
      currentWeek = {
        type:     'week',
        weekNum,
        label:    `Week ${weekNum}`,
        startDay: weekStart,
        endDay:   weekEnd,
        days:     [],
      };
    }

    currentWeek.days.push(dayGroup);
  });

  if (currentWeek && currentWeek.days.length) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function buildMonths(weekGroups) {
  const months = [];
  let monthNum = 1;
  let monthStart = 1; // first week number of the current month

  let currentMonth = null;

  weekGroups.forEach((weekGroup) => {
    const { weekNum } = weekGroup;

    // Each month = 4 weeks
    while (weekNum > monthStart + 3) {
      if (currentMonth) months.push(currentMonth);
      monthNum++;
      monthStart += 4;
      currentMonth = null;
    }

    if (!currentMonth) {
      const monthEnd = monthStart + 3;
      currentMonth = {
        type:       'month',
        monthNum,
        label:      `Month ${monthNum}`,
        startWeek:  monthStart,
        endWeek:    monthEnd,
        weeks:      [],
      };
    }

    currentMonth.weeks.push(weekGroup);
  });

  if (currentMonth && currentMonth.weeks.length) {
    months.push(currentMonth);
  }

  return months;
}

/**
 * Calculates progress (done / total tasks) for an array of DayGroups.
 * @param {DayGroup[]} days
 * @returns {{ done: number, total: number, pct: number }}
 */
export function calcProgress(days) {
  let done = 0;
  let total = 0;
  days.forEach((d) => {
    d.tasks.forEach((t) => {
      total++;
      if (t.completed) done++;
    });
  });
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}
