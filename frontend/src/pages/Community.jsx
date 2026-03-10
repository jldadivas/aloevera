import React, { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Film, Heart, Home, ImageIcon, MessageCircle, Search, ShieldAlert, Users, FileText } from 'lucide-react'
import api from '../services/api'

const REPORT_POST_REASONS = [
  'Spam or misleading content',
  'Harassment or abusive language',
  'False or unsafe plant advice',
  'Inappropriate or explicit content',
  'Intellectual property violation',
  'Other'
]

export default function Community() {
  const [scans, setScans] = useState([])
  const [posts, setPosts] = useState([])
  const [activeSection, setActiveSection] = useState('home')
  const [activeTab, setActiveTab] = useState('posts')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScan, setSelectedScan] = useState('')
  const [caption, setCaption] = useState('')
  const [postType, setPostType] = useState('post')
  const [commentText, setCommentText] = useState({})
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [reportingPost, setReportingPost] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showReportPostModal, setShowReportPostModal] = useState(false)
  const [reportPostId, setReportPostId] = useState('')
  const [selectedReportReason, setSelectedReportReason] = useState(REPORT_POST_REASONS[0])
  const [customReportReason, setCustomReportReason] = useState('')
  const [chatUsers, setChatUsers] = useState([])
  const [chatConversations, setChatConversations] = useState([])
  const [selectedChatUserId, setSelectedChatUserId] = useState('')
  const [directMessages, setDirectMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageDraft, setMessageDraft] = useState('')

  const isAdminIdentity = (userLike) => {
    const role = String(userLike?.role || '').toLowerCase()
    const identity = `${userLike?.full_name || ''} ${userLike?.email || ''}`.toLowerCase()
    return role === 'admin' || identity.includes('admin')
  }

  const currentUser = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [scansRes, postsRes] = await Promise.all([
        api.get('/scans', { params: { limit: 100 } }),
        api.get('/community/posts', { params: { limit: 50 } })
      ])
      setScans(scansRes.data?.data?.scans || [])
      setPosts(postsRes.data?.data || [])
      await loadChatData()
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load community data')
    } finally {
      setLoading(false)
    }
  }

  const loadChatData = async (search = '') => {
    const [usersRes, convRes] = await Promise.all([
      api.get('/community/chat/users', { params: { limit: 100, search } }),
      api.get('/community/chat/conversations')
    ])
    const users = usersRes.data?.data || []
    const conversations = convRes.data?.data || []
    const nonAdminUsers = users.filter((u) => !isAdminIdentity(u))
    const nonAdminConversations = conversations.filter((c) => !isAdminIdentity(c.peer_user))
    setChatUsers(nonAdminUsers)
    setChatConversations(nonAdminConversations)

    if (!selectedChatUserId) {
      const preferred = nonAdminConversations[0]?.peer_user?._id || nonAdminUsers[0]?._id || ''
      if (preferred) setSelectedChatUserId(preferred)
    }
  }

  const loadDirectMessages = async (peerUserId) => {
    if (!peerUserId) return
    try {
      setChatLoading(true)
      const res = await api.get(`/community/chat/messages/${peerUserId}`, { params: { limit: 200 } })
      setDirectMessages(res.data?.data || [])
      const convRes = await api.get('/community/chat/conversations')
      setChatConversations(
        (convRes.data?.data || []).filter((c) => !isAdminIdentity(c.peer_user))
      )
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load messages')
    } finally {
      setChatLoading(false)
    }
  }

  const sendMessage = async () => {
    const text = messageDraft.trim()
    if (!selectedChatUserId || !text) return
    try {
      setSendingMessage(true)
      const res = await api.post('/community/chat/messages', {
        recipient_id: selectedChatUserId,
        text
      })
      const created = res.data?.data
      if (created) {
        setDirectMessages((prev) => [...prev, created])
      }
      setMessageDraft('')
      const convRes = await api.get('/community/chat/conversations')
      setChatConversations(
        (convRes.data?.data || []).filter((c) => !isAdminIdentity(c.peer_user))
      )
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  useEffect(() => {
    document.body.classList.add('community-no-bg')
    return () => {
      document.body.classList.remove('community-no-bg')
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (activeSection === 'messages' && selectedChatUserId) {
      loadDirectMessages(selectedChatUserId)
    }
  }, [activeSection, selectedChatUserId])

  useEffect(() => {
    if (!selectedChatUserId) return
    const existsInUsers = chatUsers.some((u) => u._id === selectedChatUserId)
    const existsInConversations = chatConversations.some((c) => c.peer_user?._id === selectedChatUserId)
    if (!existsInUsers && !existsInConversations) {
      const fallback = chatConversations[0]?.peer_user?._id || chatUsers[0]?._id || ''
      setSelectedChatUserId(fallback)
    }
  }, [selectedChatUserId, chatUsers, chatConversations])

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!selectedScan) return

    try {
      setPosting(true)
      const trimmedCaption = caption.trim()
      const finalCaption =
        postType === 'recommendation'
          ? `${trimmedCaption ? `Recommendation: ${trimmedCaption}` : 'Recommendation'}`
          : caption
      const res = await api.post('/community/posts', {
        scan_id: selectedScan,
        caption: finalCaption
      })
      const created = res.data?.data
      if (created) setPosts((prev) => [created, ...prev])
      setSelectedScan('')
      setCaption('')
      setPostType('post')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create post')
    } finally {
      setPosting(false)
    }
  }

  const toggleLike = async (postId) => {
    try {
      const res = await api.post(`/community/posts/${postId}/like`)
      const data = res.data?.data
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, liked_by_me: data.liked_by_me, likes_count: data.likes_count }
            : p
        )
      )
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to like post')
    }
  }

  const addComment = async (postId) => {
    const text = (commentText[postId] || '').trim()
    if (!text) return

    try {
      const res = await api.post(`/community/posts/${postId}/comments`, { text })
      const comment = res.data?.data?.comment
      const commentsCount = res.data?.data?.comments_count
      if (!comment) return
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                comments: [...(p.comments || []), comment],
                comments_count: commentsCount
              }
            : p
        )
      )
      setCommentText((prev) => ({ ...prev, [postId]: '' }))
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to add comment')
    }
  }

  const openReportPostModal = (postId) => {
    setReportPostId(postId)
    setSelectedReportReason(REPORT_POST_REASONS[0])
    setCustomReportReason('')
    setShowReportPostModal(true)
    setError('')
  }

  const closeReportPostModal = () => {
    setShowReportPostModal(false)
    setReportPostId('')
    setSelectedReportReason(REPORT_POST_REASONS[0])
    setCustomReportReason('')
    setReportingPost(false)
  }

  const reportPost = async () => {
    const reason =
      selectedReportReason === 'Other' ? customReportReason.trim() : selectedReportReason.trim()
    if (!reason || !reportPostId) return

    try {
      setReportingPost(true)
      await api.post(`/community/posts/${reportPostId}/report`, { reason })
      setSuccessMessage('Post reported. Admin will review it.')
      setTimeout(() => setSuccessMessage(''), 2800)
      closeReportPostModal()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to report post')
    } finally {
      setReportingPost(false)
    }
  }

  const reportComment = async (postId, commentId) => {
    const reason = window.prompt('Reason for reporting this comment:')
    if (!reason || !reason.trim()) return
    try {
      await api.post(`/community/posts/${postId}/comments/${commentId}/report`, { reason: reason.trim() })
      alert('Comment reported. Admin will review it.')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to report comment')
    }
  }

  const favoriteGroups = useMemo(() => {
    const names = scans
      .map((scan) => scan.analysis_result?.disease_name || 'Healthy Growers')
      .filter(Boolean)
    return Array.from(new Set(names)).slice(0, 6)
  }, [scans])

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000

    return posts.filter((post) => {
      if (activeSection === 'messages') {
        const hasComments = (post.comments_count || 0) > 0 || (post.comments || []).length > 0
        if (!hasComments) return false
      }

      if (activeSection === 'events') {
        const createdAt = new Date(post.createdAt).getTime()
        if (Number.isNaN(createdAt) || createdAt < twoWeeksAgo) return false
      }

      if (activeTab === 'recommendations') {
        const recommendationText = `${post.caption || ''} ${post.disease_name || ''}`.toLowerCase()
        const looksLikeRecommendation =
          recommendationText.includes('tip') ||
          recommendationText.includes('recommend') ||
          recommendationText.includes('advice')
        if (!looksLikeRecommendation) return false
      }

      if (!q) return true
      const searchBlob = [
        post.caption,
        post.disease_name,
        post.user_id?.full_name,
        ...(post.comments || []).map((c) => c.text)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return searchBlob.includes(q)
    })
  }, [posts, activeSection, activeTab, searchQuery])

  const selectedChatUser = useMemo(() => {
    if (!selectedChatUserId) return null
    const fromUsers = chatUsers.find((u) => u._id === selectedChatUserId)
    if (fromUsers) return fromUsers
    const fromConversations = chatConversations.find((c) => c.peer_user?._id === selectedChatUserId)
    return fromConversations?.peer_user || null
  }, [selectedChatUserId, chatUsers, chatConversations])

  const handleSearch = (e) => {
    e.preventDefault()
    if (activeSection === 'messages') {
      loadChatData(searchInput.trim())
      return
    }
    setSearchQuery(searchInput.trim())
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-76px)] bg-[#f2f8f1] px-4 py-12">
        <div className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-[#f4faf3] px-6 py-8 text-center text-emerald-900 shadow-sm">
          Loading community feed...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gradient-to-b from-[#eff7ed] via-[#f6fbf5] to-[#edf6eb] text-[#244133]">
      <div className="mx-auto w-full max-w-[1380px] px-4 py-5 lg:px-6 lg:py-6">
        <header className="mb-5 rounded-2xl border border-[#3d7f5d] bg-gradient-to-r from-[#2a6648] to-[#3a805b] px-4 py-3 text-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[180px] text-lg font-semibold tracking-tight">Vera Community</div>
            <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d3e5d9]" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search posts, people, topics..."
                  className="!mb-0 h-10 w-full rounded-lg border border-[#5d9975] bg-[#2f7250] pl-10 pr-3 text-sm text-[#eaf6ee] placeholder:text-[#c8dfd0] focus:border-[#8bc4a4] focus:ring-0"
                />
              </div>
              <button
                type="submit"
                className="h-10 rounded-lg border border-[#2f8a56] bg-[#1f7a46] px-4 text-sm font-semibold text-white shadow-none hover:bg-[#19683b]"
              >
                Search
              </button>
            </form>
          </div>
        </header>

        <div className={activeSection === 'messages' ? 'grid items-start gap-5' : 'grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)_300px]'}>
          {activeSection !== 'messages' && (
          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-2xl border border-[#dfeadf] bg-[#f4faf3] p-4 shadow-sm transition-colors hover:bg-[#e9f5ea]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#7d9784]">Menu</h3>
              <nav className="space-y-1">
                <MenuItem icon={<Home size={16} />} label="Home" active={activeSection === 'home'} onClick={() => setActiveSection('home')} />
                <MenuItem icon={<Users size={16} />} label="Posts" active={activeSection === 'posts'} onClick={() => setActiveSection('posts')} />
                <MenuItem icon={<MessageCircle size={16} />} label="Messages" active={activeSection === 'messages'} onClick={() => setActiveSection('messages')} />
                <MenuItem icon={<CalendarDays size={16} />} label="Events" active={activeSection === 'events'} onClick={() => setActiveSection('events')} />
              </nav>
            </section>

            <section className="rounded-2xl border border-[#dfeadf] bg-[#f4faf3] p-4 shadow-sm transition-colors hover:bg-[#e7f3e8]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#7d9784]">Favorite Groups</h3>
              <div className="space-y-2">
                {favoriteGroups.length > 0 ? (
                  favoriteGroups.map((group, index) => (
                    <div key={`${group}-${index}`} className="rounded-lg bg-[#f2f8f2] px-3 py-2 text-sm text-[#355741] transition-colors hover:bg-[#e2f1e3]">
                      {group}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-[#f2f8f2] px-3 py-2 text-sm text-[#587361] transition-colors hover:bg-[#e5f2e6]">No groups yet</div>
                )}
              </div>
            </section>
          </aside>
          )}

          <main className="space-y-4">
            {activeSection === 'messages' ? (
              <section className="overflow-hidden rounded-2xl border border-[#d7dbe4] bg-[#eef1f6] shadow-sm">
                <div className="border-b border-[#d8dde6] bg-[#f8f9fb] px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection('home')}
                    className="h-9 rounded-lg border border-[#d8dde6] bg-white px-3 text-sm font-semibold text-[#2f3540] hover:bg-[#f2f4f8]"
                  >
                    Back
                  </button>
                </div>
                <div className="grid min-h-[670px] lg:grid-cols-[280px_minmax(0,1fr)_240px]">
                  <div className="flex flex-col border-r border-[#d8dde6] bg-[#f8f9fb]">
                    <div className="border-b border-[#d8dde6] px-4 py-4">
                      <h2 className="text-2xl font-bold tracking-tight text-[#2a2f38]">Chat</h2>
                    </div>
                    <div className="max-h-[600px] flex-1 overflow-y-auto px-2 py-3">
                      {chatUsers.length === 0 ? (
                        <div className="rounded-lg bg-white px-3 py-2 text-sm text-[#5f6571]">No users available</div>
                      ) : (
                        chatUsers.filter((u) => !isAdminIdentity(u)).map((u) => {
                          const conv = chatConversations.find((c) => c.peer_user?._id === u._id)
                          const active = selectedChatUserId === u._id
                          return (
                            <button
                              key={u._id}
                              type="button"
                              onClick={() => setSelectedChatUserId(u._id)}
                              className={['mb-1 w-full rounded-xl border px-3 py-2 text-left transition-colors', active ? 'border-[#d7dce5] bg-[#eceff5]' : 'border-transparent bg-white hover:border-[#dfe3ea] hover:bg-[#f6f7fa]'].join(' ')}
                            >
                              <div className="truncate text-base font-semibold text-[#2a2f38]">{u.full_name || u.email}</div>
                              <div className="mt-0.5 truncate text-xs text-[#78808d]">{conv?.last_message || 'Start a conversation'}</div>
                              {!!conv?.unread_count && (
                                <div className="mt-1 inline-flex rounded-full bg-[#4eb5a4] px-2 py-0.5 text-[11px] font-semibold text-white">
                                  {conv.unread_count} new
                                </div>
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex min-h-[620px] flex-col bg-[#f0f3f8]">
                    <div className="flex items-center justify-between border-b border-[#d8dde6] px-5 py-3">
                      <div>
                        <div className="text-lg font-semibold text-[#2a2f38]">Group Chat</div>
                        <div className="text-xs text-[#8a919d]">
                          {selectedChatUser ? `Chat with ${selectedChatUser.full_name || selectedChatUser.email}` : 'Select a user'}
                        </div>
                      </div>
                      <div className="rounded-full bg-[#c8ece6] px-3 py-1 text-xs font-semibold text-[#2f7f74]">Messages</div>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
                      {chatLoading ? (
                        <div className="text-sm text-[#6f7784]">Loading messages...</div>
                      ) : directMessages.length === 0 ? (
                        <div className="text-sm text-[#6f7784]">No messages yet. Start chatting.</div>
                      ) : (
                        directMessages.map((msg) => {
                          const mine = msg.sender_id?._id === currentUser?.id || msg.sender_id?._id === currentUser?._id
                          return (
                            <div key={msg._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={[
                                  'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                                  mine ? 'bg-[#d7ddf0] text-[#2a2f38]' : 'bg-white text-[#2a2f38]'
                                ].join(' ')}
                              >
                                <div>{msg.text}</div>
                                <div className="mt-1 text-[11px] text-[#88909a]">
                                  {new Date(msg.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    <div className="border-t border-[#d8dde6] bg-white p-3">
                      <div className="flex gap-2">
                        <input
                          value={messageDraft}
                          onChange={(e) => setMessageDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                          placeholder={selectedChatUserId ? 'Type a message...' : 'Select a user to chat'}
                          disabled={!selectedChatUserId || sendingMessage}
                          className="!mb-0 h-11 flex-1 rounded-full border border-[#d8dde6] bg-white px-4 text-sm text-[#2a2f38] placeholder:text-[#9da3ad] focus:border-[#b5bdca] focus:ring-0 disabled:bg-[#f4f5f8]"
                        />
                        <button
                          type="button"
                          onClick={sendMessage}
                          disabled={!selectedChatUserId || !messageDraft.trim() || sendingMessage}
                          className="h-11 rounded-full bg-[#24a18f] px-5 text-sm font-semibold text-white shadow-none hover:bg-[#1e8e7e] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {sendingMessage ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <aside className="hidden border-l border-[#d8dde6] bg-[#fbfcfe] px-4 py-4 lg:block">
                    <h3 className="mb-4 text-base font-semibold text-[#2f3540]">Shared files</h3>
                    <div className="mb-5 rounded-2xl border border-[#e5e8ef] bg-white p-4">
                      <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-[#e9ecf2] text-xl font-semibold text-[#657084]">
                        {(selectedChatUser?.full_name || selectedChatUser?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-center text-sm font-semibold text-[#2f3540]">{selectedChatUser?.full_name || selectedChatUser?.email || 'No user selected'}</div>
                      <div className="mt-1 text-center text-xs text-[#8b94a1]">Chat attachments</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-xl border border-[#e5e8ef] bg-white px-2 py-3">
                        <div className="text-xs text-[#8b94a1]">All files</div>
                        <div className="mt-1 text-xl font-semibold text-[#2f3540]">231</div>
                      </div>
                      <div className="rounded-xl border border-[#e5e8ef] bg-white px-2 py-3">
                        <div className="text-xs text-[#8b94a1]">Media</div>
                        <div className="mt-1 text-xl font-semibold text-[#2f3540]">45</div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between rounded-lg border border-[#e5e8ef] bg-white px-3 py-2">
                        <div className="flex items-center gap-2 text-sm text-[#3c4350]">
                          <FileText size={14} className="text-[#6f7784]" />
                          Documents
                        </div>
                        <span className="text-xs text-[#8b94a1]">126</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-[#e5e8ef] bg-white px-3 py-2">
                        <div className="flex items-center gap-2 text-sm text-[#3c4350]">
                          <ImageIcon size={14} className="text-[#6f7784]" />
                          Photos
                        </div>
                        <span className="text-xs text-[#8b94a1]">53</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-[#e5e8ef] bg-white px-3 py-2">
                        <div className="flex items-center gap-2 text-sm text-[#3c4350]">
                          <Film size={14} className="text-[#6f7784]" />
                          Movies
                        </div>
                        <span className="text-xs text-[#8b94a1]">3</span>
                      </div>
                    </div>
                  </aside>
                </div>
              </section>
            ) : (
              <>
            {/* FIX: Tab bar now has a solid dark green background so white text is visible,
                and active tab uses a light underline + bright white; inactive uses semi-transparent white */}
            <section className="rounded-2xl border border-[#dfeadf] bg-[#f4faf3] shadow-sm transition-colors hover:bg-[#e9f5ea]">
              <div
                className="flex items-center gap-5 border-b border-[#edf4eb] px-4 py-3 rounded-t-2xl"
                style={{ background: 'linear-gradient(to right, #2a6648, #3a805b)' }}
              >
                <TabButton label="Posts" active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
                <TabButton label="Recommendations" active={activeTab === 'recommendations'} onClick={() => setActiveTab('recommendations')} />
              </div>

              <form onSubmit={handleCreatePost} className="space-y-3 px-4 py-4">
                <h2 className="!mb-0 text-base font-semibold text-[#2e513d]">Create a Post</h2>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className="!mb-0 h-11 w-full rounded-lg border border-[#cfe1cf] bg-[#f8fcf7] px-3 text-sm text-[#274737] focus:border-[#9ec0a0] focus:ring-0"
                >
                  <option value="post">Post</option>
                  <option value="recommendation">Recommendation</option>
                </select>
                <select
                  value={selectedScan}
                  onChange={(e) => setSelectedScan(e.target.value)}
                  required
                  className="!mb-0 h-11 w-full rounded-lg border border-[#cfe1cf] bg-[#f8fcf7] px-3 text-sm text-[#274737] focus:border-[#9ec0a0] focus:ring-0"
                >
                  <option value="">Select a scan to post</option>
                  {scans.map((scan) => (
                    <option key={scan._id} value={scan._id}>
                      {new Date(scan.createdAt).toLocaleString()} - {scan.analysis_result?.disease_name || 'Healthy'}
                    </option>
                  ))}
                </select>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Share your insights with the community..."
                  rows={3}
                  className="!mb-0 w-full rounded-lg border border-[#cfe1cf] bg-[#f8fcf7] px-3 py-2 text-sm text-[#274737] focus:border-[#9ec0a0] focus:ring-0"
                />
                <button
                  type="submit"
                  disabled={posting}
                  className="h-10 rounded-lg bg-[#5f8f66] px-4 text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#547f5a] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {posting ? 'Posting...' : 'Post to Community'}
                </button>
              </form>
            </section>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            <div className="text-xs text-[#6f8a78]">
              Showing {filteredPosts.length} result{filteredPosts.length === 1 ? '' : 's'}
              {searchQuery ? ` for "${searchQuery}"` : ''}
            </div>

            {filteredPosts.length === 0 ? (
              <div className="rounded-2xl border border-[#dfeadf] bg-[#f4faf3] p-6 text-[#587361] shadow-sm transition-colors hover:bg-[#e8f4e9]">
                No posts match your filters.
              </div>
            ) : (
              filteredPosts.map((post) => (
                <article key={post._id} className="overflow-hidden rounded-2xl border border-[#dfeadf] bg-[#f4faf3] shadow-sm transition-colors hover:bg-[#e8f4e9]">
                  <div className="flex items-center justify-between border-b border-[#edf4eb] px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.user_id?.profile_picture?.url ? (
                        <img
                          src={post.user_id.profile_picture.url}
                          alt="author"
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#d6e8d0] text-xs font-bold text-[#355741]">
                          {(post.user_id?.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-[#284c39]">{post.user_id?.full_name || 'User'}</div>
                        <div className="text-xs text-[#7c9483]">{new Date(post.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="rounded-full bg-[#eef6ec] px-2 py-1 text-xs font-semibold text-[#4f6f58]">
                      {post.disease_name || 'Healthy'}
                    </div>
                  </div>

                  {post.image_url && (
                    <img src={post.image_url} alt="community post" className="max-h-[440px] w-full object-cover" />
                  )}

                  <div className="space-y-3 px-4 py-4">
                    <p className="text-[15px] leading-relaxed text-[#355643]">{post.caption || 'No caption'}</p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => toggleLike(post._id)}
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#d7e8d3] bg-[#f5faf3] px-3 text-sm text-[#3c5f49] shadow-none hover:bg-[#ecf5ea]"
                      >
                        <Heart size={15} />
                        {post.liked_by_me ? 'Unlike' : 'Like'} ({post.likes_count || 0})
                      </button>
                      <button
                        onClick={() => openReportPostModal(post._id)}
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm text-amber-700 shadow-none hover:bg-amber-100"
                      >
                        <ShieldAlert size={15} />
                        Report Post
                      </button>
                      <span className="text-xs font-semibold text-[#5f7c67]">{post.comments_count || 0} comments</span>
                    </div>

                    <div className="space-y-2 rounded-xl bg-[#f8fcf7] p-3 transition-colors hover:bg-[#edf7ee]">
                      {(post.comments || []).map((c) => (
                        <div key={c._id} className="rounded-lg border border-[#e3eee1] bg-[#edf7ed] p-2.5 transition-colors hover:bg-[#e2f1e3]">
                          <div className="text-xs font-bold text-[#496854]">{c.user_id?.full_name || 'User'}</div>
                          <div className="mt-1 text-sm text-[#365444]">{c.text}</div>
                          <button
                            type="button"
                            onClick={() => reportComment(post._id, c._id)}
                            className="mt-2 h-7 rounded-md border border-amber-200 bg-amber-50 px-2 text-xs text-amber-700 shadow-none hover:bg-amber-100"
                          >
                            Report Comment
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={commentText[post._id] || ''}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [post._id]: e.target.value }))}
                        placeholder="Write a comment..."
                        className="!mb-0 h-10 flex-1 rounded-lg border border-[#d6e6d3] bg-[#f7fbf6] px-3 text-sm text-[#274737] focus:border-[#9ec0a0] focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => addComment(post._id)}
                        className="h-10 rounded-lg bg-[#5f8f66] px-4 text-sm font-semibold text-white shadow-none hover:bg-[#547f5a]"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
              </>
            )}
          </main>

          {activeSection !== 'messages' && (
          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-2xl border border-[#dfeadf] bg-[#f4faf3] p-4 shadow-sm transition-colors hover:bg-[#e9f5ea]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#7d9784]">Events</h3>
              <div className="space-y-2">
                <div className="rounded-lg bg-[#f4faf2] px-3 py-2 text-sm text-[#355741] transition-colors hover:bg-[#e4f2e3]">
                  <div className="font-bold">Weekly Grower Roundtable</div>
                  <div className="text-xs text-[#6b8772]">Friday, 7:00 PM</div>
                </div>
                <div className="rounded-lg bg-[#f4faf2] px-3 py-2 text-sm text-[#355741] transition-colors hover:bg-[#e1f0e2]">
                  <div className="font-bold">Plant Health Q&A Live</div>
                  <div className="text-xs text-[#6b8772]">Sunday, 4:00 PM</div>
                </div>
              </div>

              <div className="mt-4 border-t border-[#e7f0e8] pt-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[#6f8a78]">Aloe Vera Video</h4>
                <div className="rounded-xl border border-[#dfeadf] bg-[#f7fbf6] p-2 transition-colors hover:bg-[#e7f3e8] [perspective:1000px]">
                  <div className="overflow-hidden rounded-lg shadow-[0_12px_30px_rgba(24,67,43,0.22)] [transform:rotateX(7deg)_rotateY(-6deg)] transition-transform duration-500 hover:[transform:rotateX(0deg)_rotateY(0deg)]">
                    <video
                      className="block h-[180px] w-full object-cover"
                      src="/videos/aloe-background-3.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  </div>
                </div>
              </div>
            </section>
          </aside>
          )}
        </div>
      </div>

      {showReportPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09150f]/65 p-4 backdrop-blur-[3px]">
          <div className="w-full max-w-lg rounded-2xl border border-[#d7e4dc] bg-gradient-to-br from-[#ffffff] via-[#fbfdfb] to-[#f2f7f3] p-6 shadow-[0_24px_72px_rgba(9,40,24,0.35)]">
            <h3 className="text-xl font-semibold tracking-tight text-[#153626]">Report Post</h3>
            <p className="mt-1.5 text-sm text-[#4b6558]">
              Help keep Vera Community safe by selecting the most accurate reason.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.09em] text-[#365647]">
                  Reason
                </label>
                <select
                  value={selectedReportReason}
                  onChange={(e) => setSelectedReportReason(e.target.value)}
                  className="!mb-0 h-11 w-full rounded-lg border border-[#b7cabc] bg-white px-3 text-sm text-[#1f3f30] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-[#3f8f62] focus:ring-2 focus:ring-[#d8ecdd]"
                >
                  {REPORT_POST_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {selectedReportReason === 'Other' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.09em] text-[#365647]">
                    Details
                  </label>
                  <textarea
                    value={customReportReason}
                    onChange={(e) => setCustomReportReason(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Describe the issue..."
                    className="!mb-0 w-full rounded-lg border border-[#b7cabc] bg-white px-3 py-2 text-sm text-[#1f3f30] focus:border-[#3f8f62] focus:ring-2 focus:ring-[#d8ecdd]"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeReportPostModal}
                className="h-10 rounded-lg border border-[#a8bbae] bg-white px-4 text-sm font-semibold text-[#274636] hover:bg-[#f3f7f4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={reportPost}
                disabled={reportingPost || (selectedReportReason === 'Other' && !customReportReason.trim())}
                className="h-10 rounded-lg bg-gradient-to-r from-[#1f6e45] to-[#2f8658] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,110,69,0.28)] hover:from-[#1b613d] hover:to-[#28744d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reportingPost ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'flex h-10 w-full items-center gap-2 rounded-lg px-3 text-sm shadow-none',
        active ? 'bg-[#edf6ea] font-semibold text-[#355741]' : 'bg-transparent text-[#5f7b68] hover:bg-[#f3f8f2]'
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}

// FIX: TabButton now uses dark green text for proper contrast on the light card background.
// Active tab gets a dark underline + dark green text; inactive gets muted green.
function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
        borderBottom: active ? '2px solid #ffffff' : '2px solid transparent',
        paddingBottom: '4px',
        fontSize: '15px',
        fontWeight: 600,
        background: 'none',
        border: 'none',
        borderBottom: active ? '2px solid #ffffff' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'color 0.15s',
      }}
    >
      {label}
    </button>
  )
}