import React, { useState, useEffect } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue, push, update, remove } from 'firebase/database'
import { ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react'

interface Task {
  id: string
  title: string
  assignee: string
  type: string
  priority: number
  completed: boolean
  created_at: number
}

interface GroupedTasks {
  [assignee: string]: Task[]
}

const TEAM_MEMBERS = ['Greg', 'Luisa', 'Yvonne', 'Candice', 'Joshua']

const COLORS: { [key: string]: string } = {
  'Greg': '#ff7a1a',
  'Luisa': '#0a1f44',
  'Yvonne': '#4CAF50',
  'Candice': '#2196F3',
  'Joshua': '#FF9800'
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: 'open', assignee: 'all', type: 'all' })
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({})
  const [newTask, setNewTask] = useState({ title: '', assignee: 'Greg', type: 'Team', priority: 3 })

  useEffect(() => {
    const tasksRef = ref(database, 'tasks')
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const taskList: Task[] = Object.keys(data).map(key => ({ id: key, ...data[key] }))
        setTasks(taskList)
      } else {
        setTasks([])
      }
      setLoading(false)
    }, (error) => {
      console.error('Error:', error)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const addTask = async () => {
    if (!newTask.title.trim()) return
    try {
      await push(ref(database, 'tasks'), { ...newTask, completed: false, created_at: Date.now() })
      setNewTask({ title: '', assignee: 'Greg', type: 'Team', priority: 3 })
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await update(ref(database, `tasks/${id}`), updates)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteTask = async (id: string) => {
    try {
      await remove(ref(database, `tasks/${id}`))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getFilteredTasks = () => {
    return tasks.filter(t => {
      if (filters.status === 'open' && t.completed) return false
      if (filters.status === 'done' && !t.completed) return false
      if (filters.assignee !== 'all' && t.assignee !== filters.assignee) return false
      if (filters.type !== 'all' && t.type !== filters.type) return false
      return true
    })
  }

  const getGroupedTasks = (): GroupedTasks => {
    const filtered = getFilteredTasks()
    const grouped: GroupedTasks = {}
    filtered.forEach(task => {
      if (!grouped[task.assignee]) grouped[task.assignee] = []
      grouped[task.assignee].push(task)
    })
    Object.keys(grouped).forEach(assignee => {
      grouped[assignee].sort((a, b) => b.priority - a.priority)
    })
    return grouped
  }

  const filteredTasks = getFilteredTasks()
  const groupedTasks = getGroupedTasks()
  const openCount = tasks.filter(t => !t.completed).length
  const doneCount = tasks.filter(t => t.completed).length

  if (loading) return <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#666' }}>Loading...</div></div>

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#0a1f44', color: 'white', padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Fathom Task Board</h1>
          <p style={{ opacity: 0.8, fontSize: '14px' }}>Organize and execute tasks from your Fathom meeting notes</p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0a1f44' }}>{openCount}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Open</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#4CAF50' }}>{doneCount}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Done</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '24px', border: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#0a1f44', marginBottom: '16px' }}>Add Task</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 120px 120px 100px', gap: '12px' }}>
            <input type="text" placeholder="Task description" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && addTask()} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
            <select value={newTask.assignee} onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}>
              {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={newTask.type} onChange={(e) => setNewTask({ ...newTask, type: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}>
              <option value="Team">Team Task</option>
              <option value="Client">Client Task</option>
            </select>
            <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) })} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}>
              {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>Priority {p}</option>)}
            </select>
            <button onClick={addTask} style={{ backgroundColor: '#ff7a1a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', marginBottom: '24px', border: '1px solid #e0e0e0', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}>
              <option value="open">Open</option>
              <option value="done">Done</option>
              <option value="all">All</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>Assignee</label>
            <select value={filters.assignee} onChange={(e) => setFilters({ ...filters, assignee: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}>
              <option value="all">All</option>
              {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>Type</label>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}>
              <option value="all">All</option>
              <option value="Team">Team</option>
              <option value="Client">Client</option>
            </select>
          </div>
        </div>

        {Object.keys(groupedTasks).length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '60px 20px', textAlign: 'center', color: '#999', border: '1px solid #e0e0e0' }}>No tasks</div>
        ) : (
          Object.keys(groupedTasks).sort().map(assignee => {
            const tasksForAssignee = groupedTasks[assignee]
            const isExpanded = expandedGroups[assignee] !== false
            const pending = tasksForAssignee.filter(t => !t.completed).length

            return (
              <div key={assignee} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                <button onClick={() => setExpandedGroups(prev => ({ ...prev, [assignee]: !prev[assignee] }))} style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', border: 'none', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS[assignee] }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0a1f44' }}>{assignee}</h3>
                    <span style={{ fontSize: '12px', color: '#999' }}>({pending} pending)</span>
                  </div>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {isExpanded && (
                  <div style={{ backgroundColor: 'white', borderTop: '1px solid #e0e0e0' }}>
                    {tasksForAssignee.map((task, idx) => (
                      <div key={task.id} style={{ padding: '16px', borderBottom: idx < tasksForAssignee.length - 1 ? '1px solid #f0f0f0' : 'none', display: 'flex', gap: '12px', opacity: task.completed ? 0.6 : 1 }}>
                        <input type="checkbox" checked={task.completed} onChange={() => updateTask(task.id, { completed: !task.completed })} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#ff7a1a' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '15px', marginBottom: '12px', textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#999' : '#333' }}>{task.title}</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => updateTask(task.id, { priority: star })} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: star <= task.priority ? '#ff7a1a' : '#ccc' }}>
                                  ★
                                </button>
                              ))}
                            </div>
                            <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '12px', backgroundColor: task.type === 'Team' ? '#e3f2fd' : '#f3e5f5', color: task.type === 'Team' ? '#1976d2' : '#7b1fa2' }}>{task.type}</span>
                            <select value={task.assignee} onChange={(e) => updateTask(task.id, { assignee: e.target.value })} style={{ padding: '6px 8px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '6px' }}>
                              {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                        </div>
                        <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '18px' }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e0e0e0', textAlign: 'center',