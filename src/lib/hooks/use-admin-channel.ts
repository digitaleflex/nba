"use client"

import { useEffect, useState, useRef } from "react"
import { useSocket, type ConnectionStatus } from "./use-socket"

interface AdminChannelOptions<T> {
  event: string
  fetch: () => Promise<T | null>
  interval?: number
}

export function useAdminChannel<T>({ event, fetch: fetchFn, interval = 15000 }: AdminChannelOptions<T>) {
  const { status, subscribe } = useSocket()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    const off = subscribe(event, (payload: T) => {
      setData(payload)
      setStale(false)
      setLoading(false)
    })
    return off
  }, [subscribe, event])

  useEffect(() => {
    if (status === "connected" && dataRef.current) return
    if (status === "connected" && !dataRef.current) {
      fetchFn().then((d) => {
        if (d !== null) {
          setData(d)
          setLoading(false)
        }
      })
      return
    }
    const poll = () => {
      fetchFn()
        .then((d) => {
          if (d !== null) {
            setData(d)
            setStale(false)
          } else {
            setStale(true)
          }
          setLoading(false)
        })
        .catch(() => setStale(true))
    }
    poll()
    const id = setInterval(poll, interval)
    return () => clearInterval(id)
  }, [status, fetchFn, interval])

  return { data, loading, stale, status }
}
