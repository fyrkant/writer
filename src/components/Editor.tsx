import { useCallback, useEffect, useState } from 'react'
import type { Post, PostInput } from '../types'

interface Props {
  post: Post | null
  isNew: boolean
  onSave: (data: PostInput) => Promise<void>
  onDelete: () => Promise<void>
  onDirty: () => void
  onBack: () => void
}

type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error'

const saveStatusLabel: Record<SaveStatus, string> = {
  unsaved: 'unsaved changes',
  saving: 'saving…',
  saved: 'saved',
  error: 'error saving',
}

export default function Editor({ post, isNew, onSave, onDelete, onDirty, onBack }: Props) {
  const [title, setTitle] = useState(post?.title ?? '')
  const [date, setDate] = useState(post?.date ?? (isNew ? new Date().toISOString().split('T')[0] : ''))
  const [layout, setLayout] = useState(post?.layout ?? 'post')
  const [tags, setTags] = useState((post?.tags ?? []).join(', '))
  const [body, setBody] = useState(post?.body ?? '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(isNew ? 'unsaved' : 'saved')
  const [saving, setSaving] = useState(false)

  const change = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value)
    onDirty()
    setSaveStatus('unsaved')
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveStatus('saving')
    try {
      await onSave({
        title,
        date,
        layout,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        body,
      })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }, [title, date, layout, tags, body, onSave])

  const handleDelete = async () => {
    const label = post?.title || 'this post'
    if (!confirm(`Delete "${label}"?`)) return
    try {
      await onDelete()
    } catch {
      // toast shown by App
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  if (!isNew && !post) {
    return (
      <div className="editor-pane">
        <div className="empty-state">select a post or create a new one</div>
      </div>
    )
  }

  const dotClass = `status-dot${saveStatus === 'saving' ? ' saving' : saveStatus === 'saved' ? ' saved' : saveStatus === 'error' ? ' error' : ''}`

  return (
    <div className="editor-pane">
      <div className="mobile-back">
        <button type="button" className="btn btn-ghost" onClick={onBack}>← Posts</button>
      </div>
      <div className="editor-content" style={{ display: 'flex' }}>
        <div className="meta-bar">
          <label>
            <span className="label-text">Title</span>
            <input
              type="text"
              className="title-input"
              placeholder="Post title…"
              // biome-ignore lint/a11y/noAutofocus: intentional UX
              autoFocus={isNew}
              value={title}
              onChange={e => change(setTitle)(e.target.value)}
            />
          </label>
          <label>
            <span className="label-text">Date</span>
            <input
              type="date"
              value={date}
              onChange={e => change(setDate)(e.target.value)}
            />
          </label>
          <label>
            <span className="label-text">Layout</span>
            <select value={layout} onChange={e => change(setLayout)(e.target.value)}>
              <option value="post">post</option>
              <option value="page">page</option>
              <option value="note">note</option>
            </select>
          </label>
        </div>
        <div className="meta-bar-row2">
          <span className="label-text" style={{ flexShrink: 0 }}>Tags</span>
          <input
            type="text"
            placeholder="comma separated: tech, writing, etc"
            style={{ flex: 1 }}
            value={tags}
            onChange={e => change(setTags)(e.target.value)}
          />
        </div>
        <textarea
          className="markdown-editor"
          placeholder="Write in markdown…"
          spellCheck={false}
          value={body}
          onChange={e => change(setBody)(e.target.value)}
        />
        <div className="editor-footer">
          <div className="editor-footer-left">
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              Save
            </button>
            <div className="status">
              <span className={dotClass}></span>
              <span>{saveStatusLabel[saveStatus]}</span>
            </div>
          </div>
          {post && (
            <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
          )}
        </div>
      </div>
    </div>
  )
}
