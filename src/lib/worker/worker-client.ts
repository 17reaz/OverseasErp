// type WorkerRequest = {
//   id: string
//   type: string
//   payload?: unknown
// }

// type WorkerResponse = {
//   id: string
//   type: string
//   success: boolean
//   result?: unknown
//   error?: string
// }

// type PendingRequest = {
//   resolve: (value: unknown) => void
//   reject: (reason?: unknown) => void
// }

// class AppWorkerClient {
//   private worker: Worker | null = null

//   private pending = new Map<string, PendingRequest>()

//   private getWorker() {
//     if (this.worker) {
//       return this.worker
//     }

//     this.worker = new Worker(
//       new URL("./app-worker.ts", import.meta.url),
//       {
//         type: "module",
//       },
//     )

//     this.worker.onmessage = (
//       event: MessageEvent<WorkerResponse>,
//     ) => {
//       const response = event.data

//       const request = this.pending.get(response.id)

//       if (!request) {
//         return
//       }

//       this.pending.delete(response.id)

//       if (response.success) {
//         request.resolve(response.result)
//       } else {
//         request.reject(
//           new Error(
//             response.error ?? "Worker task failed",
//           ),
//         )
//       }
//     }

//     this.worker.onerror = (event) => {
//       const error =
//         event.error instanceof Error
//           ? event.error
//           : new Error("Worker crashed")

//       for (const request of this.pending.values()) {
//         request.reject(error)
//       }

//       this.pending.clear()
//     }

//     return this.worker
//   }

//   run<T>(
//     type: string,
//     payload?: unknown,
//   ): Promise<T> {
//     const worker = this.getWorker()

//     const id = crypto.randomUUID()

//     const request: WorkerRequest = {
//       id,
//       type,
//       payload,
//     }

//     return new Promise<T>((resolve, reject) => {
//       this.pending.set(id, {
//         resolve,
//         reject,
//       })

//       worker.postMessage(request)
//     })
//   }

//   terminate() {
//     this.worker?.terminate()

//     this.worker = null

//     for (const request of this.pending.values()) {
//       request.reject(
//         new Error("Worker terminated"),
//       )
//     }

//     this.pending.clear()
//   }
// }

// export const appWorker = new AppWorkerClient()