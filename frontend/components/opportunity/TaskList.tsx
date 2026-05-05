'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

type Task = { id: string; text: string; done: boolean; dueDate?: string }

// [AI HOOK] Future: persist tasks to backend via POST /jobs/:id/tasks
// [API INTEGRATION] Phase 2: sync task state on save

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [input, setInput] = useState('')
  const [dueDate, setDueDate] = useState('')

  const addTask = () => {
    const text = input.trim()
    if (!text) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setTasks((prev) => [...prev, { id, text, done: false, dueDate: dueDate || undefined }])
    setInput('')
    setDueDate('')
  }

  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const deleteTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id))

  const done = tasks.filter((t) => t.done).length

  return (
    <div className="space-y-3">
      {tasks.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {done} of {tasks.length} complete
          </span>
          {done === tasks.length && tasks.length > 0 && (
            <span className="font-semibold text-green-600">All done!</span>
          )}
        </div>
      )}

      {/* Input row */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a task and press Enter…"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
          <button
            onClick={addTask}
            className="flex items-center rounded-xl bg-electric px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          title="Optional due date"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground outline-none transition focus:border-primary"
        />
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground">No tasks — add one above to track action items.</p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((t) => (
            <li
              key={t.id}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition ${
                t.done ? 'border-green-500/20 bg-green-50/50' : 'border-border bg-muted/10'
              }`}
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t.id)}
                className="h-4 w-4 cursor-pointer accent-blue-600"
              />
              <div className="min-w-0 flex-1">
                <span
                  className={`block text-sm ${
                    t.done ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {t.text}
                </span>
                {t.dueDate && (
                  <span className="text-xs text-muted-foreground">Due: {t.dueDate}</span>
                )}
              </div>
              <button
                onClick={() => deleteTask(t.id)}
                className="text-muted-foreground opacity-40 transition hover:opacity-100"
                aria-label="Delete task"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
