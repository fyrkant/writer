import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api'
import Editor from './components/Editor'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import type { Post, PostInput } from './types'
import './App.css'

type ToastInfo = { msg: string; type: 'success' | 'error' }
type BuildStatus = 'idle' | 'building' | 'triggered'

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('blog_token'))
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<ToastInfo>({ msg: '', type: 'success' })
  const [toastVisible, setToastVisible] = useState(false)
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle')

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }, [])

  const triggerBuild = useCallback(async () => {
    if (!token) return
    setBuildStatus('building')
    try {
      await apiFetch('/api/build', token, { method: 'POST' })
      setBuildStatus('triggered')
      showToast('Build triggered', 'success')
    } catch {
      setBuildStatus('idle')
      showToast('Build trigger failed', 'error')
    }
  }, [token, showToast])

  const loadPosts = useCallback(async (tok: string) => {
    setLoading(true)
    try {
      const data = await apiFetch<Post[]>('/api/posts', tok)
      setPosts(data)
    } catch (e) {
      if ((e as Error).message === '401') {
        setToken(null)
        localStorage.removeItem('blog_token')
      } else {
        showToast('Failed to load posts', 'error')
      }
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (token) loadPosts(token)
  }, [token, loadPosts])

  const handleLogin = useCallback((tok: string) => {
    localStorage.setItem('blog_token', tok)
    setToken(tok)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('blog_token')
    setToken(null)
    setPosts([])
    setCurrentId(null)
    setIsNew(false)
  }, [])

  const handleSelectPost = useCallback((id: string) => {
    if (dirty && !confirm('Discard unsaved changes?')) return
    setCurrentId(id)
    setIsNew(false)
    setDirty(false)
  }, [dirty])

  const handleNewPost = useCallback(() => {
    if (dirty && !confirm('Discard unsaved changes?')) return
    setCurrentId(null)
    setIsNew(true)
    setDirty(false)
  }, [dirty])

  const handleSave = useCallback(async (data: PostInput): Promise<void> => {
    if (!token) return
    try {
      let saved: Post
      if (currentId) {
        saved = await apiFetch<Post>(`/api/posts/${currentId}`, token, { method: 'PUT', body: JSON.stringify(data) })
        setPosts(prev => prev.map(p => p.id === currentId ? saved : p))
      } else {
        saved = await apiFetch<Post>('/api/posts', token, { method: 'POST', body: JSON.stringify(data) })
        setPosts(prev => [saved, ...prev])
        setCurrentId(saved.id)
        setIsNew(false)
      }
      setDirty(false)
      showToast('Saved', 'success')
    } catch (e) {
      showToast('Save failed', 'error')
      throw e
    }
  }, [token, currentId, showToast])

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!token || !currentId) return
    try {
      await apiFetch(`/api/posts/${currentId}`, token, { method: 'DELETE' })
      setPosts(prev => prev.filter(p => p.id !== currentId))
      setCurrentId(null)
      setIsNew(false)
      setDirty(false)
      showToast('Deleted', 'success')
    } catch (e) {
      showToast('Delete failed', 'error')
      throw e
    }
  }, [token, currentId, showToast])

  const buildDot = buildStatus === 'building' ? 'saving' : buildStatus === 'triggered' ? 'saved' : ''
  const buildLabel = buildStatus === 'building' ? 'building…' : buildStatus === 'triggered' ? 'build triggered' : 'idle'
  const currentPost = posts.find(p => p.id === currentId) ?? null
  const editorKey = currentId ?? (isNew ? 'new' : 'empty')
  const editorActive = currentId !== null || isNew

  const handleBack = useCallback(() => {
    setCurrentId(null)
    setIsNew(false)
    setDirty(false)
  }, [])

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <>
      <div id="app" className="visible">
        <div className="topbar">
          <div className="topbar-title">blog<span>.</span>editor</div>
          <div className="topbar-actions">
            <span className="status">
              <span className={`status-dot ${buildDot}`}></span>
              <span>{buildLabel}</span>
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={triggerBuild}
              disabled={buildStatus === 'building'}
            >
              build
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>logout</button>
          </div>
        </div>
        <div className={`main${editorActive ? ' has-post' : ''}`}>
          <Sidebar
            posts={posts}
            loading={loading}
            currentId={currentId}
            onSelect={handleSelectPost}
            onNew={handleNewPost}
          />
          <Editor
            key={editorKey}
            post={currentPost}
            isNew={isNew}
            onSave={handleSave}
            onDelete={handleDelete}
            onDirty={() => setDirty(true)}
            onBack={handleBack}
          />
        </div>
      </div>
      <Toast msg={toast.msg} type={toast.type} visible={toastVisible} />
    </>
  )
}
