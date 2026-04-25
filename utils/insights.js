const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getMoodLabel(moodValue) {
  const value = Number(moodValue)
  if (value === 1) return 'Terrible'
  if (value === 2) return 'Sad'
  if (value === 3) return 'Neutral'
  if (value === 4) return 'Good'
  if (value === 5) return 'Elated'
  return 'Unknown'
}

export function flattenMoodEntries(dataObj) {
  const entries = []

  Object.keys(dataObj || {}).forEach((yearKey) => {
    const months = dataObj?.[yearKey] || {}
    Object.keys(months).forEach((monthKey) => {
      const days = months?.[monthKey] || {}
      Object.keys(days).forEach((dayKey) => {
        const mood = Number(days[dayKey])
        if (!Number.isFinite(mood) || mood < 1 || mood > 5) {
          return
        }
        entries.push({
          date: new Date(Number(yearKey), Number(monthKey), Number(dayKey)),
          mood,
          year: Number(yearKey),
          month: Number(monthKey),
          day: Number(dayKey),
          key: `${yearKey}-${monthKey}-${dayKey}`,
        })
      })
    })
  })

  entries.sort((a, b) => a.date.getTime() - b.date.getTime())
  return entries
}

function averageMood(entries) {
  if (!entries.length) {
    return 0
  }
  return entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length
}

export function getRangeAverage(entries, days, endDate = new Date()) {
  if (!entries?.length) {
    return { count: 0, average: 0 }
  }

  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))

  const inRange = entries.filter((entry) => (
    entry.date.getTime() >= start.getTime() && entry.date.getTime() <= end.getTime()
  ))

  return {
    count: inRange.length,
    average: averageMood(inRange),
  }
}

export function getTrendDelta(entries, days, endDate = new Date()) {
  const current = getRangeAverage(entries, days, endDate)
  const currentEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  const previousEnd = new Date(currentEnd)
  previousEnd.setDate(previousEnd.getDate() - days)
  const previous = getRangeAverage(entries, days, previousEnd)

  return {
    currentAvg: current.average,
    previousAvg: previous.average,
    currentCount: current.count,
    previousCount: previous.count,
    delta: current.average - previous.average,
  }
}

export function getWeekdayStats(entries) {
  const weekdayBuckets = WEEKDAY_NAMES.map((name, index) => ({
    index,
    name,
    count: 0,
    sum: 0,
    average: 0,
  }))

  entries.forEach((entry) => {
    const dayIndex = entry.date.getDay()
    const bucket = weekdayBuckets[dayIndex]
    bucket.count += 1
    bucket.sum += entry.mood
  })

  weekdayBuckets.forEach((bucket) => {
    bucket.average = bucket.count ? bucket.sum / bucket.count : 0
  })

  const activeBuckets = weekdayBuckets.filter((bucket) => bucket.count > 0)
  if (!activeBuckets.length) {
    return { best: null, toughest: null, weekdays: weekdayBuckets }
  }

  const best = activeBuckets.reduce((max, bucket) => (
    bucket.average > max.average ? bucket : max
  ))
  const toughest = activeBuckets.reduce((min, bucket) => (
    bucket.average < min.average ? bucket : min
  ))

  return {
    best,
    toughest,
    weekdays: weekdayBuckets,
  }
}

export function getMonthlySummary(entries, now = new Date()) {
  const year = now.getFullYear()
  const month = now.getMonth()
  const elapsedDays = now.getDate()
  const monthlyEntries = entries.filter((entry) => (
    entry.date.getFullYear() === year && entry.date.getMonth() === month
  ))

  const moodFrequency = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  monthlyEntries.forEach((entry) => {
    moodFrequency[entry.mood] += 1
  })

  const mostCommonMoodValue = Object.keys(moodFrequency).reduce((bestKey, key) => (
    moodFrequency[key] > moodFrequency[bestKey] ? key : bestKey
  ), '1')

  return {
    entriesCount: monthlyEntries.length,
    elapsedDays,
    averageMood: averageMood(monthlyEntries),
    mostCommonMood: monthlyEntries.length ? getMoodLabel(Number(mostCommonMoodValue)) : 'N/A',
    coveragePct: elapsedDays ? Math.round((monthlyEntries.length / elapsedDays) * 100) : 0,
  }
}

export function getRecentMoodSeries(entries, days = 14, endDate = new Date()) {
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  const byKey = new Map(entries.map((entry) => [entry.key, entry.mood]))
  const series = []

  for (let i = days - 1; i >= 0; i -= 1) {
    const pointer = new Date(end)
    pointer.setDate(pointer.getDate() - i)
    const key = `${pointer.getFullYear()}-${pointer.getMonth()}-${pointer.getDate()}`
    const mood = byKey.get(key) || null
    series.push({
      key,
      date: pointer,
      mood,
      hasData: mood !== null,
    })
  }

  return series
}

export function getRuleBasedInsight({ entries, sevenDayTrend, monthSummary }) {
  if (!entries.length) {
    return 'Start logging daily to unlock your personal trend insights.'
  }

  if (monthSummary.coveragePct < 40) {
    return 'You are building consistency. Logging more days will sharpen trend quality.'
  }

  if (sevenDayTrend.delta <= -0.5) {
    return 'Your week looks a bit lower than the previous one. A short reflection today might help.'
  }

  if (sevenDayTrend.delta >= 0.5) {
    return 'Your mood trend is improving this week. Keep the routines that are helping.'
  }

  return 'Your trend is fairly steady. Small daily check-ins can reveal what moves the needle.'
}

export function getInsightSummary(entries, now = new Date()) {
  const sevenDayTrend = getTrendDelta(entries, 7, now)
  const thirtyDayAverage = getRangeAverage(entries, 30, now)
  const weekdayStats = getWeekdayStats(entries)
  const monthSummary = getMonthlySummary(entries, now)
  const recentSeries = getRecentMoodSeries(entries, 14, now)
  const summaryLine = getRuleBasedInsight({ entries, sevenDayTrend, monthSummary })

  return {
    sevenDayTrend,
    thirtyDayAverage,
    weekdayStats,
    monthSummary,
    recentSeries,
    summaryLine,
  }
}
