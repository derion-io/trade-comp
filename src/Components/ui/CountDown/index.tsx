import React, { useEffect, useMemo, useState } from 'react'
import { Text } from '../Text'

export const Cowndown = ({ second, render }: {second: number, render?: any}) => {
  const [counter, setCounter] = useState(second)

  useEffect(() => {
    const timer = counter > 0 && setInterval(() => setCounter(counter - 1), 1000)
    return () => {
      timer && clearInterval(timer)
    }
  }, [counter])

  return useMemo(() => {
    return render ? render(counter) : counter
  }, [render, counter])
}
