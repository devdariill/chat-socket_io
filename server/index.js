import express from 'express'
import logger from 'morgan'

const PORT = process.env.PORT || 3000

const app = express()

app.use(logger('dev'))

app.get('/', (req, res) => {
  res.send(process.cwd() + '/client/index.html')
})

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`)
})
