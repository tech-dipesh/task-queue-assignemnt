import { useState, useEffect } from 'react'

const API = 'http://localhost:5000'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [tasks, setTasks] = useState([])
  const [showRegister, setShowRegister] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [title, setTitle] = useState('')
  const [inputText, setInputText] = useState('')
  const [operation, setOperation] = useState('uppercase')
  const [taskError, setTaskError] = useState('')

  useEffect(() => {
    if (token) {
      fetchTasks()
      const interval = setInterval(() => {
        fetchTasks()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [token])

  function fetchTasks() {
    fetch(API + '/tasks', {
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.tasks) {
          setTasks(data.tasks)
        }
      })
      .catch(err => {
        console.log('error fetching tasks', err)
      })
  }

  function handleLogin() {
    setAuthError('')
    fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
          setUsername('')
          setPassword('')
        } else {
          setAuthError(data.message || 'Login failed')
        }
      })
      .catch(err => {
        console.log('login error', err)
        setAuthError('Something went wrong')
      })
  }

  function handleRegister() {
    setAuthError('')
    fetch(API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message === 'registered') {
          setShowRegister(false)
          setAuthError('Registered successfully, please login')
        } else {
          setAuthError(data.message || 'Register failed')
        }
      })
      .catch(err => {
        console.log('register error', err)
        setAuthError('Something went wrong')
      })
  }

  function handleCreateTask() {
    setTaskError('')
    if (!title || !inputText) {
      setTaskError('Title and input text are required')
      return
    }

    fetch(API + '/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ title, inputText, operation })
    })
      .then(res => res.json())
      .then(data => {
        if (data.task) {
          setTitle('')
          setInputText('')
          setOperation('uppercase')
          fetchTasks()
        } else {
          setTaskError(data.message || 'Failed to create task')
        }
      })
      .catch(err => {
        console.log('create task error', err)
        setTaskError('Something went wrong')
      })
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken('')
    setTasks([])
  }

  if (!token) {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto', fontFamily: 'sans-serif' }}>
        <h2>{showRegister ? 'Register' : 'Login'}</h2>

        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
          />

          {authError && <p style={{ color: 'red' }}>{authError}</p>}

          {showRegister ? (
            <button onClick={handleRegister} style={{ marginRight: '10px' }}>Register</button>
          ) : (
            <button onClick={handleLogin} style={{ marginRight: '10px' }}>Login</button>
          )}

          <button onClick={() => setShowRegister(!showRegister)}>
            {showRegister ? 'Go to Login' : 'Go to Register'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Task Platform</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '16px', marginBottom: '24px' }}>
        <h3>Create Task</h3>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '8px' }}
        />
        <textarea
          placeholder="Input text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          rows={3}
          style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '8px' }}
        />
        <select
          value={operation}
          onChange={e => setOperation(e.target.value)}
          style={{ display: 'block', marginBottom: '8px', padding: '8px' }}
        >
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
          <option value="reverse">Reverse</option>
          <option value="wordcount">Word Count</option>
        </select>

        {taskError && <p style={{ color: 'red' }}>{taskError}</p>}

        <button onClick={handleCreateTask}>Run Task</button>
      </div>

      <h3>Tasks</h3>
      {tasks.length === 0 && <p>No tasks yet.</p>}
      {tasks.map(task => (
        <div
          key={task._id}
          style={{
            border: '1px solid #ddd',
            padding: '12px',
            marginBottom: '12px',
            borderRadius: '4px'
          }}
        >
          <strong>{task.title}</strong>
          <span
            style={{
              marginLeft: '10px',
              padding: '2px 8px',
              background:
                task.status === 'success'
                  ? '#d4edda'
                  : task.status === 'failed'
                  ? '#f8d7da'
                  : task.status === 'running'
                  ? '#fff3cd'
                  : '#e2e3e5',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            {task.status}
          </span>
          <p style={{ margin: '6px 0', fontSize: '13px', color: '#555' }}>
            Operation: {task.operation} | Input: {task.inputText}
          </p>
          {task.result && (
            <p style={{ margin: '4px 0', fontSize: '13px' }}>
              Result: <strong>{task.result}</strong>
            </p>
          )}
          {task.logs && (
            <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
              Log: {task.logs}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export default App