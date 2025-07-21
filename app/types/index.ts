// types.ts or types/index.ts (at the right relative location)

import { Server as SocketIOServer } from 'socket.io'
import { NextApiResponse } from 'next'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: {
      io?: SocketIOServer
    }
  }
}
