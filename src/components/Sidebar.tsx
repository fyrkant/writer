import type { Post } from '../types'

interface Props {
  posts: Post[]
  loading: boolean
  currentId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

export default function Sidebar({ posts, loading, currentId, onSelect, onNew }: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span>{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
        <button type="button" className="btn btn-primary" onClick={onNew}>+ New</button>
      </div>
      <div className="posts-list">
        {loading ? (
          <div className="empty-state" style={{ padding: '40px 0' }}>
            <span className="spinner"></span>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0', fontSize: '12px' }}>
            no posts yet
          </div>
        ) : (
          posts.map(post => (
            <button
              type="button"
              key={post.id}
              className={`post-item${post.id === currentId ? ' active' : ''}`}
              onClick={() => onSelect(post.id)}
            >
              <div className="post-item-title">{post.title || 'Untitled'}</div>
              <div className="post-item-meta">
                <span>{post.date || ''}</span>
                {(post.tags ?? []).slice(0, 2).map(t => (
                  <span key={t} className="tag-pill">{t}</span>
                ))}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
