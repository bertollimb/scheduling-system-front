import { useState, useEffect } from 'react'
import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
} from '../api/clients'

const emptyForm = { first_name: '', last_name: '', phone: '', email: '' }

function ClientsPage() {
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setIsLoading(true)
    try {
      const data = await listClients()
      setClients(data)
    } catch {
      setError('Failed to load clients')
    } finally {
      setIsLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function buildPayload() {
    return {
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      email: form.email.trim() === '' ? null : form.email.trim(),
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const payload = buildPayload()
      if (editingId) {
        await updateClient(editingId, payload)
      } else {
        await createClient(payload)
      }
      setForm(emptyForm)
      setEditingId(null)
      await loadClients()
    } catch {
      setError('Failed to save client')
    }
  }

  function handleEdit(client) {
    setEditingId(client.id)
    setForm({
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone,
      email: client.email ?? '',
    })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleDelete(clientId) {
    if (!confirm('Delete this client?')) return

    try {
      await deleteClient(clientId)
      await loadClients()
    } catch {
      setError('Failed to delete client (they may have existing schedulings)')
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Clients</h1>

      {error && (
        <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid max-w-2xl grid-cols-2 gap-4 rounded-lg bg-white p-4 shadow"
      >
        <input
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          placeholder="First name"
          required
          className="rounded border border-gray-300 px-3 py-2"
        />
        <input
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          placeholder="Last name"
          required
          className="rounded border border-gray-300 px-3 py-2"
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone"
          required
          className="rounded border border-gray-300 px-3 py-2"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email (optional)"
          type="email"
          className="rounded border border-gray-300 px-3 py-2"
        />

        <div className="col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {editingId ? 'Save changes' : 'Add client'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <table className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow">
          <thead className="bg-gray-50 text-left text-sm text-gray-600">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Email</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-t border-gray-100">
                <td className="p-3">
                  {client.first_name} {client.last_name}
                </td>
                <td className="p-3">{client.phone}</td>
                <td className="p-3">{client.email || '-'}</td>
                <td className="flex gap-2 p-3">
                  <button
                    onClick={() => handleEdit(client)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ClientsPage