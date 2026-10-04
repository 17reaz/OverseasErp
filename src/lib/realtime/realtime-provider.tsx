import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import { useAuth } from "@/modules/auth/components/auth-provider"

import {
  realtimeClient,
  type RealtimeEvent,
  type RealtimeStatus,
} from "./realtime-client"

type RealtimeContextValue = {
  status: RealtimeStatus

  subscribe: (
    listener: (
      event: RealtimeEvent,
    ) => void,
  ) => () => void
}

const RealtimeContext =
  createContext<
    RealtimeContextValue | undefined
  >(undefined)

export function RealtimeProvider({
  children,
}: {
  children: ReactNode
}) {
  const { session } = useAuth()

  const [status, setStatus] =
    useState<RealtimeStatus>(
      realtimeClient.getStatus(),
    )

  useEffect(() => {
    const unsubscribe =
      realtimeClient.subscribeStatus(
        setStatus,
      )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (
      !session?.access_token
    ) {
      realtimeClient.stop()
      return
    }

    realtimeClient.start(
      session.access_token,
    )

    return () => {
      realtimeClient.stop()
    }
  }, [
    session?.access_token,
  ])

  const value: RealtimeContextValue =
    {
      status,

      subscribe:
        realtimeClient.subscribe.bind(
          realtimeClient,
        ),
    }

  return (
    <RealtimeContext.Provider
      value={value}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context =
    useContext(
      RealtimeContext,
    )

  if (!context) {
    throw new Error(
      "useRealtime must be used inside RealtimeProvider",
    )
  }

  return context
}