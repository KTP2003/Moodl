'use client'
import { Fugaz_One } from 'next/font/google'
import React,{ useEffect, useMemo, useState } from 'react'
import Calendar from './Calendar'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/firebase'
import { deleteField, doc, setDoc, updateDoc } from 'firebase/firestore'
import Loading from './Loading'
import Login from './Login'
import { flattenMoodEntries, getInsightSummary } from '@/utils/insights'

const fugaz=Fugaz_One({subsets:["latin"],weight:['400']})

export default function Dashboard() {
  const { currentUser,userDataObj,setUserDataObj,loading  }=useAuth()
  const [data,setData]= useState({})
  const [saveState, setSaveState] = useState({ loading: false, error: '', success: '' })

  function countValues(dataObj) {
    const entries = []
    const now = new Date()
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`

    Object.keys(dataObj || {}).forEach((yearKey) => {
      const months = dataObj?.[yearKey] || {}
      Object.keys(months).forEach((monthKey) => {
        const days = months?.[monthKey] || {}
        Object.keys(days).forEach((dayKey) => {
          const mood = Number(days[dayKey])
          if (!Number.isFinite(mood)) {
            return
          }
          const date = new Date(Number(yearKey), Number(monthKey), Number(dayKey))
          entries.push({
            mood,
            date,
            key: `${yearKey}-${monthKey}-${dayKey}`,
          })
        })
      })
    })

    entries.sort((a, b) => a.date.getTime() - b.date.getTime())

    const averageMood = entries.length
      ? (entries.reduce((acc, item) => acc + item.mood, 0) / entries.length).toFixed(1)
      : '0.0'

    const entrySet = new Set(entries.map((entry) => entry.key))
    let streak = 0
    const pointer = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    while (entrySet.has(`${pointer.getFullYear()}-${pointer.getMonth()}-${pointer.getDate()}`)) {
      streak += 1
      pointer.setDate(pointer.getDate() - 1)
    }

    const thisMonthCount = entries.filter((entry) => (
      entry.date.getFullYear() === now.getFullYear() &&
      entry.date.getMonth() === now.getMonth()
    )).length

    const hasTodayEntry = entrySet.has(todayKey)

    return {
      total_entries: entries.length,
      this_month: thisMonthCount,
      avg_mood: averageMood,
      streak_days: streak,
      today: hasTodayEntry ? 'Logged' : 'Pending',
    }
  }

  function formatDelta(delta) {
    if (!Number.isFinite(delta)) {
      return '0.0'
    }
    const rounded = Math.abs(delta).toFixed(1)
    if (delta > 0) return `+${rounded}`
    if (delta < 0) return `-${rounded}`
    return '0.0'
  }

  function formatValue(num) {
    return Number.isFinite(num) ? num.toFixed(1) : '0.0'
  }

  function moodBarHeight(mood) {
    if (!mood) {
      return '12%'
    }
    return `${Math.max(18, Math.min(100, (mood / 5) * 100))}%`
  }

  async function handleSetMood(mood, selectedDate = new Date()){
    const dateObj = selectedDate instanceof Date ? selectedDate : new Date()
    const day = dateObj.getDate()
    const month = dateObj.getMonth()
    const year = dateObj.getFullYear()

    setSaveState({ loading: true, error: '', success: '' })

    try {
      const newData={ ...(userDataObj || {}) }
      if(!newData?.[year]){
        newData[year]={}
      }
      if(!newData?.[year]?.[month]){
        newData[year][month]={}
      }

      if (mood === null) {
        delete newData[year][month][day]
        if (!Object.keys(newData[year][month]).length) {
          delete newData[year][month]
        }
        if (!Object.keys(newData[year]).length) {
          delete newData[year]
        }
      } else {
        newData[year][month][day]=mood
      }
      //update the current state
      setData(newData)
      // update the global state
      setUserDataObj(newData)
      // update firebase
      const docRef=doc(db,'users',currentUser.uid)
      if (mood === null) {
        await updateDoc(docRef, {
          [`${year}.${month}.${day}`]: deleteField(),
        })
      } else {
        await setDoc(docRef,{
          [year]:{
            [month]:{
              [day]:mood
            }
          }
        },{ merge:true })
      }
      setSaveState({ loading: false, error: '', success: 'Mood updated.' })
    } catch (err) {
      console.log("Failed to set data!:",err.message)
      setSaveState({ loading: false, error: err?.message || 'Could not save mood.', success: '' })
    }
  }

  const statuses = countValues(data)
  const entries = useMemo(() => flattenMoodEntries(data), [data])
  const insights = useMemo(() => getInsightSummary(entries), [entries])
  const statusOrder = ['total_entries', 'this_month', 'avg_mood', 'streak_days', 'today']
  const statusLabels = {
    total_entries: 'Total Entries',
    this_month: 'This Month',
    avg_mood: 'Avg Mood',
    streak_days: 'Streak Days',
    today: 'Today',
  }

  const moods={
    '&*@#$':'😭',
    'Sad':'🥲',
    'Existing':'😶',
    'Good':'😊',
    'Elated':'😍'
  }

  useEffect(()=>{
    if(!currentUser || !userDataObj){
      return
    }
    setData(userDataObj)

  },[currentUser,userDataObj])


  if(loading){
    return <Loading/>
  }

  if(!currentUser){
    return <Login/>
  }


  return (
    <div className='flex flex-col flex-1 gap-8 sm:gap-12 md:gap-16'>
      <div className='grid grid-cols-2 md:grid-cols-5 bg-indigo-50 text-indigo-500 p-4 gap-4 rounded-lg'>
        {statusOrder.map((status,statusIndex)=>{
          return(
            <div key={statusIndex} className='flex flex-col gap-1 sm:gap-2'>
              <p className='font-medium uppercase text-xs sm:text-sm truncate'>{statusLabels[status]}</p>
              <p className={'text-base sm:text-lg truncate '+fugaz.className}>{statuses[status]}</p>
            </div>
          )
        })}
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <div className='bg-white border border-indigo-100 rounded-lg p-4 flex flex-col gap-2'>
          <p className='text-xs uppercase tracking-wide text-indigo-500 font-semibold'>Trend</p>
          <p className='text-sm text-slate-600'>
            7-day average: <span className='text-slate-900 font-medium'>{formatValue(insights.sevenDayTrend.currentAvg)}</span>
          </p>
          <p className='text-sm text-slate-600'>
            30-day average: <span className='text-slate-900 font-medium'>{formatValue(insights.thirtyDayAverage.average)}</span>
          </p>
          <p className='text-sm text-slate-600'>
            Delta vs previous week: <span className={'font-medium ' + (insights.sevenDayTrend.delta >= 0 ? 'text-emerald-600' : 'text-amber-700')}>{formatDelta(insights.sevenDayTrend.delta)}</span>
          </p>
          <div className='pt-2'>
            <p className='text-xs text-slate-500 mb-2'>Last 14 days</p>
            <div className='h-14 flex items-end gap-1'>
              {insights.recentSeries.map((item) => (
                <div
                  key={item.key}
                  className={'flex-1 rounded-sm ' + (item.hasData ? 'bg-indigo-400' : 'bg-indigo-100')}
                  style={{ height: moodBarHeight(item.mood) }}
                  title={item.hasData ? `${item.date.toDateString()}: mood ${item.mood}` : `${item.date.toDateString()}: no entry`}
                />
              ))}
            </div>
          </div>
          <p className='text-sm text-indigo-700 bg-indigo-50 rounded-md px-2 py-1 mt-1'>
            {insights.summaryLine}
          </p>
        </div>
        <div className='bg-white border border-indigo-100 rounded-lg p-4 flex flex-col gap-2'>
          <p className='text-xs uppercase tracking-wide text-indigo-500 font-semibold'>Patterns</p>
          {entries.length ? (
            <>
              <p className='text-sm text-slate-600'>
                Best weekday: <span className='text-slate-900 font-medium'>{insights.weekdayStats.best?.name || 'N/A'}</span>
              </p>
              <p className='text-sm text-slate-600'>
                Toughest weekday: <span className='text-slate-900 font-medium'>{insights.weekdayStats.toughest?.name || 'N/A'}</span>
              </p>
              <p className='text-sm text-slate-600'>
                Common mood this month: <span className='text-slate-900 font-medium'>{insights.monthSummary.mostCommonMood}</span>
              </p>
            </>
          ) : (
            <p className='text-sm text-slate-500'>Log a few days to unlock patterns.</p>
          )}
        </div>
        <div className='bg-white border border-indigo-100 rounded-lg p-4 flex flex-col gap-2'>
          <p className='text-xs uppercase tracking-wide text-indigo-500 font-semibold'>Monthly Digest</p>
          <p className='text-sm text-slate-600'>
            Entries this month: <span className='text-slate-900 font-medium'>{insights.monthSummary.entriesCount}</span>
          </p>
          <p className='text-sm text-slate-600'>
            Coverage: <span className='text-slate-900 font-medium'>{insights.monthSummary.entriesCount}/{insights.monthSummary.elapsedDays} days ({insights.monthSummary.coveragePct}%)</span>
          </p>
          <p className='text-sm text-slate-600'>
            Avg this month: <span className='text-slate-900 font-medium'>{formatValue(insights.monthSummary.averageMood)}</span>
          </p>
        </div>
      </div>
      {saveState.error ? (
        <p className='text-sm text-red-600 -mt-4' role='alert'>{saveState.error}</p>
      ) : null}
      {saveState.success ? (
        <p className='text-sm text-indigo-600 -mt-4' role='status'>{saveState.success}</p>
      ) : null}
      <h4 className={'text-5xl sm:text-6xl md:text-7xl text-center '+fugaz.className}>
        How do you <span className='textGradient'>feel</span> today?
      </h4>
      <div className='flex items-stretch flex-wrap gap-4'>
        {Object.keys(moods).map((mood,moodIndex)=>{
          return(
            <button onClick={()=>{
              const currMoodValue=moodIndex+1
              handleSetMood(currMoodValue)
            }} className={'p-4 px-5 rounded-2xl purpleShadow duration-200 bg-indigo-50 hover:bg-indigo-100 text-center flex flex-col gap-2 items-center flex-1'} key={moodIndex}>
              <p className='text-4xl sm:text-5xl md:text-6xl'>{moods[mood]}</p>
              <p className={'text-indigo-500 text-xs sm:text:sm md:text-base '+fugaz.className}>{mood}</p>
            </button>
          )
        })}
      </div>
      <p className='text-sm text-center text-slate-500 -mt-2'>
        Tip: Click any day in the calendar to cycle mood (1-5). Shift + click clears that day.
      </p>
      {saveState.loading ? (
        <p className='text-sm text-center text-indigo-600 -mt-2' role='status'>Saving mood...</p>
      ) : null}
      <Calendar data={data} handleSetMood={handleSetMood}/>
    </div>
  )
}
