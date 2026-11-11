import { useState } from 'react'
import { changePassword } from '../api/auth'
import { setTokens } from '../api/client'

// Mirrors the backend rule as a convenience only; the backend still
// validates and its message is shown when it rejects the password.
function validateNewPassword(currentPassword, newPassword, confirmation) {
  if (newPassword.length < 8) {
    return 'New password must be at least 8 characters'
  }
  if (!/\p{L}/u.test(newPassword) || !/\d/.test(newPassword)) {
    return 'New password must contain at least one letter and one digit'
  }
  if (new TextEncoder().encode(newPassword).length > 72) {
    return 'New password is too long (maximum 72 bytes)'
  }
  if (newPassword === currentPassword) {
    return 'New password must be different from the current one'
  }
  if (newPassword !== confirmation) {
    return 'New password and confirmation do not match'
  }
  return ''
}

function errorMessage(err) {
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg).join('. ')
  }
  return 'Failed to change password'
}

function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validateNewPassword(
      currentPassword,
      newPassword,
      confirmation
    )
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      const data = await changePassword(currentPassword, newPassword)
      // The old tokens were revoked by the backend: replace them with
      // the new pair so the user stays logged in.
      setTokens(data.access_token, data.refresh_token)
      setSuccess('Password changed successfully')
    } catch (err) {
      // A wrong current password returns 403: just show the message,
      // the session is still valid.
      setError(errorMessage(err))
    } finally {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmation('')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        Change password
      </h1>

      {error && (
        <p className="mb-4 max-w-sm rounded bg-red-50 p-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p className="mb-4 max-w-sm rounded bg-green-50 p-2 text-sm text-green-700">
          {success}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-sm rounded-lg bg-white p-4 shadow"
      >
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Current password
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-gray-700">
          New password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
          className="mb-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        <p className="mb-4 text-xs text-gray-400">
          At least 8 characters, with at least one letter and one digit.
        </p>

        <label className="mb-1 block text-sm font-medium text-gray-700">
          Confirm new password
        </label>
        <input
          type="password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="new-password"
          required
          className="mb-6 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </div>
  )
}

export default ChangePasswordPage
