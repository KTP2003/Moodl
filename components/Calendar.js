'use client'
import { gradients,baseRating } from '@/utils'
import React, { useState } from 'react'


const months = { 'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr', 'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug', 'September': 'Sept', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec' }
const now = new Date()
const dayList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']


export default function Calendar(props) {
  const now=new Date()
  const currMonth=now.getMonth()
  const [selectedMonth,setSelectedMonth]=useState(Object.keys(months)[currMonth])
  const [selectedYear,setSelectedYear]=useState(now.getFullYear())
  
  function handleIncrementMonth(val){
    const monthKeys = Object.keys(months)
    const currentIndex = monthKeys.indexOf(selectedMonth)
    const nextIndex = currentIndex + val

    if (nextIndex < 0) {
      setSelectedMonth(monthKeys[monthKeys.length - 1])
      setSelectedYear((prev) => prev - 1)
      return
    }

    if (nextIndex > monthKeys.length - 1) {
      setSelectedMonth(monthKeys[0])
      setSelectedYear((prev) => prev + 1)
      return
    }

    setSelectedMonth(monthKeys[nextIndex])
  }

  console.log("Selected month:-",selectedMonth)
  const {demo,data,handleSetMood}=props

  const monthIndex = Object.keys(months).indexOf(selectedMonth)
  const monthSlice = demo ? null : (data?.[selectedYear]?.[monthIndex] ?? {})

  const monthNow=new Date(selectedYear,monthIndex,1)
  const firstDayofMonth=monthNow.getDay() 
  const daysInMonth=new Date(selectedYear,monthIndex+1,0).getDate()

  const daysToDisplay=firstDayofMonth+daysInMonth
  const numRows=(Math.floor(daysToDisplay/7))+(daysToDisplay % 7 ? 1:0)

  return (
    <div className='flex flex-col overflow-hidden gap-1 py-4 sm:py-6 md:py-10'>
      <div className='flex items-center justify-between gap-3 pb-4'>
        <button
          type='button'
          className='text-sm sm:text-base text-indigo-600 hover:underline'
          onClick={() => handleIncrementMonth(-1)}
          aria-label='Previous month'
        >
          Prev
        </button>
        <p className='text-sm sm:text-base font-medium text-indigo-600'>
          {months[selectedMonth]} {selectedYear}
        </p>
        <button
          type='button'
          className='text-sm sm:text-base text-indigo-600 hover:underline'
          onClick={() => handleIncrementMonth(1)}
          aria-label='Next month'
        >
          Next
        </button>
      </div>
      <div className='grid grid-cols-7 gap-1 pb-2'>
        {dayList.map((dayName) => (
          <div key={dayName} className='text-[10px] sm:text-xs text-center text-slate-500 uppercase'>
            {dayName.slice(0, 3)}
          </div>
        ))}
      </div>

      {[...Array(numRows).keys()].map((row,rowIndex)=>{
        return(
          <div key={rowIndex} className='grid grid-cols-7 gap-1'>
            {dayList.map((dayOfWeek,dayOfWeekIndex)=>{
              let dayIndex=(rowIndex*7)+dayOfWeekIndex-(firstDayofMonth-1)
              let dayDisplay=dayIndex>daysInMonth?false:(rowIndex===0 && dayOfWeekIndex<firstDayofMonth)?false:true
              let isToday =
                dayIndex===now.getDate() &&
                monthIndex===now.getMonth() &&
                selectedYear===now.getFullYear()
              if(!dayDisplay){
                return(
                  <div className='bg-white' key={dayOfWeekIndex}/>
                )
              }

              const currentMood = monthSlice?.[dayIndex]
              let color=demo?
                gradients.indigo[baseRating[dayIndex]]:
                dayIndex in monthSlice && currentMood > 0?
                  gradients.indigo[currentMood]:
                  'white'

              return(
                <button
                  type='button'
                  style={{background:color}}
                  className={'text-xs sm:text-sm border border-solid p-2 flex items-center gap-2 justify-between rounded-lg '+(isToday?' border-indigo-400':' border-indigo-100')+(color==='white'?' text-indigo-400':' text-white')}
                  key={dayOfWeekIndex}
                  onClick={(event) => {
                    if (demo || !handleSetMood) {
                      return
                    }
                    if (event.shiftKey && !currentMood) {
                      return
                    }
                    const nextMood = event.shiftKey ? null : (Number(currentMood) % 5) + 1
                    const targetDate = new Date(selectedYear, monthIndex, dayIndex)
                    handleSetMood(nextMood, targetDate)
                  }}
                  title='Click to cycle mood. Shift + click to clear.'
                >
                  <p>{dayIndex}</p>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
