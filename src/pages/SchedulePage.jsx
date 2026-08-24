import { useState, useEffect } from 'react'
import { listSchedulings, cancelScheduling } from '../api/schedulings'
import { listClients } from '../api/clients'
import { listServices } from '../api/services'

function formatDate(date) {
  return date.toISOString().split('T')[0]
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()))
  const [schedulings, setSchedulings] = useState([])
  const [clientsById, setClientsById] = useState({})
  const [servicesById, setServicesById] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadSchedulings()
  }, [selectedDate])

  async function loadInitialData() {
    try {
      const [clients, services] = await Promise.all([
        listClients(),
        listServices(),
      ])
      setClientsById(Object.fromEntries(clients.map((c) => [c.id, c])))
      setServicesById(Object.fromEntries(services.map((s) => [s.id, s])))
    } catch {
      setError('Failed to load clients or services')
    }
  }

  async function loadSchedulings() {
    setIsLoading(true)
    try {
      const data = await listSchedulings(selectedDate)
      setSchedulings(data)
    } catch {
      setError('Failed to load schedulings')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCancel(schedulingId) {
    if (!confirm('Cancel this scheduling?')) return

    try {
      await cancelScheduling(schedulingId)
      await loadSchedulings()
    } catch {
      setError('Failed to cancel (must be at least 24h before start time)')
    }
  }

  function clientName(clientId) {
    const client = clientsById[clientId]
    return client ? `${client.first_name} ${client.last_name}` : `#${clientId}`
  }

  function serviceName(serviceId) {
    return servicesById[serviceId]?.name ?? `#${serviceId}`
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Schedule</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </div>

      {error && (
        <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : schedulings.length === 0 ? (
        <p className="text-gray-500">No schedulings for this day.</p>
      ) : (
        <table className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow">
          <thead className="bg-gray-50 text-left text-sm text-gray-600">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Client</th>
              <th className="p-3">Service</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {schedulings.map((scheduling) => (
              <tr key={scheduling.id} className="border-t border-gray-100">
                <td className="p-3">
                  {formatTime(scheduling.start_time)} -{' '}
                  {formatTime(scheduling.end_time)}
                </td>
                <td className="p-3">{clientName(scheduling.client_id)}</td>
                <td className="p-3">{serviceName(scheduling.service_id)}</td>
                <td className="p-3 capitalize">{scheduling.type}</td>
                <td className="p-3 capitalize">{scheduling.status}</td>
                <td className="p-3">
                  {scheduling.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancel(scheduling.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default SchedulePage