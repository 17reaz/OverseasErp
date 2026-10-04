export type RealtimeStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

export type RealtimeEvent = {
  type: string
  tenantId: string
  entity?: string
  entityId?: string
  operation?:
    | "create"
    | "update"
    | "delete"
  payload?: unknown
  timestamp: string
}

type Listener =
  (event: RealtimeEvent) => void

type StatusListener =
  (status: RealtimeStatus) => void

class RealtimeClient {
  private socket:
    WebSocket | null = null

  private token:
    string | null = null

  private reconnectTimer:
    number | null = null

  private pingTimer:
    number | null = null

  private reconnectAttempt = 0

  private shouldReconnect = false

  private status:
    RealtimeStatus = "idle"

  private readonly listeners =
    new Set<Listener>()

  private readonly statusListeners =
    new Set<StatusListener>()

  start(token: string) {
    if (!token) return

    this.token = token
    this.shouldReconnect = true
    this.reconnectAttempt = 0

    this.clearReconnectTimer()

    this.connect()
  }

  stop() {
    this.shouldReconnect = false
    this.token = null

    this.clearReconnectTimer()
    this.clearPingTimer()

    const socket =
      this.socket

    this.socket = null

    if (socket) {
      socket.onopen = null
      socket.onmessage = null
      socket.onerror = null
      socket.onclose = null

      socket.close(
        1000,
        "Client stopped",
      )
    }

    this.setStatus("idle")
  }

  subscribe(
    listener: Listener,
  ) {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(
        listener,
      )
    }
  }

  subscribeStatus(
    listener: StatusListener,
  ) {
    this.statusListeners.add(
      listener,
    )

    return () => {
      this.statusListeners.delete(
        listener,
      )
    }
  }

  getStatus() {
    return this.status
  }

  private connect() {
    if (
      !this.shouldReconnect ||
      !this.token
    ) {
      return
    }

    if (
      this.socket?.readyState ===
        WebSocket.OPEN ||
      this.socket?.readyState ===
        WebSocket.CONNECTING
    ) {
      return
    }

    this.setStatus(
      "connecting",
    )

    const socket =
      new WebSocket(
        this.buildUrl(
          this.token,
        ),
      )

    this.socket = socket

    socket.onopen = () => {
      if (
        this.socket !== socket
      ) {
        return
      }

      this.reconnectAttempt = 0

      this.setStatus(
        "connected",
      )

      this.startPing()
    }

    socket.onmessage = (
      message,
    ) => {
      if (
        this.socket !== socket
      ) {
        return
      }

      try {
        const event =
          JSON.parse(
            String(
              message.data,
            ),
          ) as
            | RealtimeEvent
            | {
                type:
                  | "connected"
                  | "pong"
              }

        if (
          event.type ===
            "connected" ||
          event.type === "pong"
        ) {
          return
        }

        if (
          "tenantId" in event &&
          event.tenantId
        ) {
          for (const listener of
            this.listeners) {
            listener(event)
          }
        }
      } catch {
        // Ignore malformed events.
      }
    }

    socket.onerror = () => {
      if (
        this.socket !== socket
      ) {
        return
      }

      this.setStatus("error")
    }

    socket.onclose = () => {
      if (
        this.socket !== socket
      ) {
        return
      }

      this.socket = null

      this.clearPingTimer()

      if (
        !this.shouldReconnect
      ) {
        this.setStatus("idle")
        return
      }

      this.setStatus(
        "disconnected",
      )

      this.scheduleReconnect()
    }
  }

  private buildUrl(
    token: string,
  ) {
    const configuredApiUrl =
      import.meta.env
        .VITE_API_URL as
        | string
        | undefined

    const base =
      configuredApiUrl ||
      window.location.origin

    const url =
      new URL(
        "/api/ws",
        base,
      )

    url.protocol =
      url.protocol ===
      "https:"
        ? "wss:"
        : "ws:"

    url.searchParams.set(
      "access_token",
      token,
    )

    return url.toString()
  }

  private scheduleReconnect() {
    this.clearReconnectTimer()

    const delay =
      Math.min(
        10_000,
        500 *
          2 **
            Math.min(
              this.reconnectAttempt,
              5,
            ),
      )

    this.reconnectAttempt += 1

    this.reconnectTimer =
      window.setTimeout(
        () => {
          this.reconnectTimer =
            null

          this.connect()
        },
        delay,
      )
  }

  private startPing() {
    this.clearPingTimer()

    this.pingTimer =
      window.setInterval(
        () => {
          if (
            this.socket
              ?.readyState !==
            WebSocket.OPEN
          ) {
            return
          }

          this.socket.send(
            JSON.stringify({
              type: "ping",
            }),
          )
        },
        25_000,
      )
  }

  private clearReconnectTimer() {
    if (
      this.reconnectTimer !==
      null
    ) {
      window.clearTimeout(
        this.reconnectTimer,
      )

      this.reconnectTimer = null
    }
  }

  private clearPingTimer() {
    if (
      this.pingTimer !== null
    ) {
      window.clearInterval(
        this.pingTimer,
      )

      this.pingTimer = null
    }
  }

  private setStatus(
    status: RealtimeStatus,
  ) {
    this.status = status

    for (const listener of
      this.statusListeners) {
      listener(status)
    }
  }
}

export const realtimeClient =
  new RealtimeClient()