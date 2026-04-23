import express, { json } from 'express'
import { connect, Schema, model } from 'mongoose'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import "dotenv/config"
import taskRoutes from './tasks.js'


const app = express()
app.use(cors())
app.use(json())

connect(process.env.MONGO_URI)
  .then(() => {
    console.log('connected to mongodb')
  })
  .catch(err => {
    console.log('mongodb connection error', err)
  })

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const User = model('User', userSchema)

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: 'username and password required' })
    }

    const existing = await User.findOne({ username })
    if (existing) {
      return res.status(400).json({ message: 'username already taken' })
    }

    const user = new User({ username, password })
    await user.save()

    return res.status(201).json({ message: 'registered' })
  } catch (err) {
    console.log('register error', err)
    return res.status(500).json({ message: 'server error' })
  }
})

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: 'username and password required' })
    }

    const user = await User.findOne({ username })
    if (!user) {
      return res.status(401).json({ message: 'invalid credentials' })
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'invalid credentials' })
    }

    const token = sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    return res.json({ token })
  } catch (err) {
    console.log('login error', err)
    return res.status(500).json({ message: 'server error' })
  }
})

app.use('/', taskRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log('server running on port', PORT)
})