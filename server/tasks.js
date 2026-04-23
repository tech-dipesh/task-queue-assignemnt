import { Router } from 'express'
import { Schema, model } from 'mongoose'
import jwt from 'jsonwebtoken'
import Redis from 'ioredis'
import "dotenv/config"

const router = Router()

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
})

redis.on('connect', () => {
  console.log('connected to redis')
})

redis.on('error', err => {
  console.log('redis error', err)
})

const taskSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  inputText: {
    type: String,
    required: true
  },
  operation: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'pending'
  },
  result: {
    type: String,
    default: ''
  },
  logs: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Task = model('Task', taskSchema)

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({ message: 'no token provided' })
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'token missing' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'invalid token' })
  }
}

router.post('/tasks', authMiddleware, async (req, res) => {
  try {
    const { title, inputText, operation } = req.body

    if (!title || !inputText || !operation) {
      return res.status(400).json({ message: 'title, inputText and operation are required' })
    }

    const allowedOps = ['uppercase', 'lowercase', 'reverse', 'wordcount']
    if (!allowedOps.includes(operation)) {
      return res.status(400).json({ message: 'invalid operation' })
    }

    const task = new Task({
      userId: req.user.userId,
      title,
      inputText,
      operation,
      status: 'pending'
    })

    await task.save()
    console.log('task created with id', task._id)

    await redis.lpush('task_queue', task._id.toString())
    console.log('task pushed to redis queue')

    return res.status(201).json({ task })
  } catch (err) {
    console.log('create task error', err)
    return res.status(500).json({ message: 'server error' })
  }
})

router.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId }).sort({ createdAt: -1 })
    return res.json({ tasks })
  } catch (err) {
    console.log('get tasks error', err)
    return res.status(500).json({ message: 'server error' })
  }
})

router.get('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.userId })

    if (!task) {
      return res.status(404).json({ message: 'task not found' })
    }

    return res.json({ task })
  } catch (err) {
    console.log('get task by id error', err)
    return res.status(500).json({ message: 'server error' })
  }
})

export default router