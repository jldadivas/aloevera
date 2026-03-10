import React, { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

export default function Profile() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [profileUrl, setProfileUrl] = useState('')
  const [newPicture, setNewPicture] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')

  const previewUrl = useMemo(() => {
    if (!newPicture) return ''
    return URL.createObjectURL(newPicture)
  }, [newPicture])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/me')
        const user = res.data?.data?.user
        if (!user) return
        setFullName(user.full_name || '')
        setPhone(user.phone || '')
        setEmail(user.email || '')
        setProfileUrl(user.profile_picture?.url || '')
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const form = new FormData()
      form.append('full_name', fullName)
      form.append('phone', phone)
      if (newPicture) {
        form.append('profile_picture', newPicture)
      }

      const res = await api.put('/auth/updatedetails', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const user = res.data?.data?.user
      if (user) {
        const existing = JSON.parse(localStorage.getItem('user') || '{}')
        const merged = {
          ...existing,
          id: user._id || existing.id,
          email: user.email || existing.email,
          role: user.role || existing.role,
          full_name: user.full_name,
          phone: user.phone,
          profile_picture: user.profile_picture
        }
        localStorage.setItem('user', JSON.stringify(merged))
        setProfileUrl(user.profile_picture?.url || profileUrl)
      }
      setSuccess('Profile updated successfully')
      setNewPicture(null)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="animate-pulse rounded-2xl border border-emerald-200/70 bg-[#f5fbf6] p-8 shadow-sm">
          <div className="mb-6 h-7 w-48 rounded bg-emerald-200/70" />
          <div className="mb-8 h-24 w-24 rounded-full bg-emerald-100" />
          <div className="space-y-4">
            <div className="h-10 rounded bg-emerald-100/80" />
            <div className="h-10 rounded bg-emerald-100/80" />
            <div className="h-10 rounded bg-emerald-100/80" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-[#f6fbf7] shadow-xl shadow-emerald-900/10">
        <div className="border-b border-emerald-200/80 bg-gradient-to-r from-[#1f7a46] to-[#2a8a56] px-8 py-7">
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
          <p className="mt-1 text-sm font-medium text-emerald-100">Update your account details and profile photo.</p>
        </div>

        <div className="grid gap-8 px-8 py-8 md:grid-cols-[220px_1fr]">
          <aside>
            <div className="rounded-xl border border-emerald-200/80 bg-[#edf7ef] p-5 text-center shadow-sm">
              <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-md">
                {previewUrl || profileUrl ? (
                  <img
                    src={previewUrl || profileUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-3xl font-bold text-emerald-800">
                    {(fullName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-[#1e4630]">{fullName || 'User'}</p>
              <p className="text-xs font-medium text-[#4f725d]">{email || 'No email'}</p>
            </div>
          </aside>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#2a513a]">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-[#1f3f2d] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#2a513a]">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63..."
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-[#1f3f2d] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#2a513a]">Change Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewPicture(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-[#1f3f2d] file:mr-3 file:rounded-md file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-800 hover:file:bg-emerald-200"
              />
              {newPicture && (
                <p className="mt-2 text-xs font-medium text-[#5e7d6a]">Selected file: {newPicture.name}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
