import { useState, useEffect } from 'react'
import {
  listServices,
  createService,
  updateService,
  deleteService,
} from '../api/services'

const categories = [
  { value: 'color_cut', label: 'Color / Cut' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'hair_treatment', label: 'Hair Treatment (Madeixas)' },
  { value: 'straightening', label: 'Straightening' },
]

const emptyForm = {
  name: '',
  category: 'color_cut',
  price_from: '',
  duration_hours: '',
  duration_minutes: '',
  requires_evaluation: false,
}

function ServicesPage() {
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    setIsLoading(true)
    try {
      const data = await listServices()
      setServices(data)
    } catch {
      setError('Failed to load services')
    } finally {
      setIsLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function buildPayload() {
    const hours = Number(form.duration_hours) || 0
    const minutes = Number(form.duration_minutes) || 0
    const totalMinutes = hours * 60 + minutes

    return {
      name: form.name,
      category: form.category,
      price_from: form.price_from,
      requires_evaluation: form.requires_evaluation,
      duration_minutes: form.requires_evaluation
        ? null
        : totalMinutes > 0
          ? totalMinutes
          : null,
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const payload = buildPayload()
      if (editingId) {
        await updateService(editingId, payload)
      } else {
        await createService(payload)
      }
      setForm(emptyForm)
      setEditingId(null)
      await loadServices()
    } catch {
      setError('Failed to save service')
    }
  }

  function handleEdit(service) {
    const totalMinutes = service.duration_minutes ?? 0
    setEditingId(service.id)
    setForm({
      name: service.name,
      category: service.category,
      price_from: service.price_from,
      duration_hours: totalMinutes ? Math.floor(totalMinutes / 60) : '',
      duration_minutes: totalMinutes ? totalMinutes % 60 : '',
      requires_evaluation: service.requires_evaluation,
    })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleDelete(serviceId) {
    if (!confirm('Delete this service?')) return

    try {
      await deleteService(serviceId)
      await loadServices()
    } catch {
      setError('Failed to delete service (it may have existing schedulings)')
    }
  }

  function categoryLabel(value) {
    return categories.find((c) => c.value === value)?.label ?? value
  }

  function formatDuration(totalMinutes) {
    if (!totalMinutes) return 'Set at evaluation'
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours === 0) return `${minutes}min`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}min`
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Services</h1>

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
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Service name"
          required
          className="col-span-2 rounded border border-gray-300 px-3 py-2"
        />

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="rounded border border-gray-300 px-3 py-2"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <input
          name="price_from"
          value={form.price_from}
          onChange={handleChange}
          placeholder="Price from (e.g. 28.00)"
          required
          className="rounded border border-gray-300 px-3 py-2"
        />

        <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="requires_evaluation"
            checked={form.requires_evaluation}
            onChange={handleChange}
          />
          Requires prior evaluation
        </label>

        {!form.requires_evaluation && (
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-sm text-gray-600">Duration:</label>
            <input
              name="duration_hours"
              value={form.duration_hours}
              onChange={handleChange}
              type="number"
              min="0"
              placeholder="0"
              className="w-20 rounded border border-gray-300 px-3 py-2"
            />
            <span className="text-sm text-gray-600">hours</span>
            <input
              name="duration_minutes"
              value={form.duration_minutes}
              onChange={handleChange}
              type="number"
              min="0"
              max="59"
              placeholder="0"
              className="w-20 rounded border border-gray-300 px-3 py-2"
            />
            <span className="text-sm text-gray-600">minutes</span>
          </div>
        )}

        <div className="col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {editingId ? 'Save changes' : 'Add service'}
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
              <th className="p-3">Category</th>
              <th className="p-3">Price from</th>
              <th className="p-3">Duration</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-t border-gray-100">
                <td className="p-3">{service.name}</td>
                <td className="p-3">{categoryLabel(service.category)}</td>
                <td className="p-3">€{service.price_from}</td>
                <td className="p-3">
                  {formatDuration(service.duration_minutes)}
                </td>
                <td className="flex gap-2 p-3">
                  <button
                    onClick={() => handleEdit(service)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
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

export default ServicesPage