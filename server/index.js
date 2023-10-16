import { createClient } from '@libsql/client'
import express from 'express'
import logger from 'morgan'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  connectionStateRecovery: {}
})

io.on('connection', async (socket) => {
  console.log('a user connected')

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })

  socket.on('chat message', async (msg) => {
    let result
    try {
      result = await db.execute({
        sql: 'INSERT INTO messages (content) VALUES (:content)',
        args: { content: msg }
      })
    } catch (error) {
      console.log('🚀 ~ file: index.js:25 ~ socket.on ~ error:', error)
      return
    }
    console.log('message: ' + msg)
    io.emit('chat message', msg, result.lastInsertRowid.toString())
  })

  console.log(socket.handshake.auth)

  if (!socket.recovered) {
    try {
      const result = await db.execute({
        sql: 'SELECT id, content FROM messages WHERE id > ?',
        args: [socket.handshake.auth.serverOffset ?? 0]
      })
      result.rows.forEach((row) => {
        socket.emit('chat message', row.content, row.id.toString())
      })
    } catch (error) {
      console.log('🚀 ~ file: index.js:39 ~ io.on ~ error:', error)
    }
  }
})

const db = createClient({
  url: 'libsql://large-american-eagle-devdariill.turso.io',
  authToken: process.env.DB_TOKEN
})

await db.execute(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL
  )`)

app.use(logger('dev'))

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/client/index.html')
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`)
})
