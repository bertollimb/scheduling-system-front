import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { listSchedulings, cancelScheduling } from '../api/schedulings'
import { listClients } from '../api/clients'
import { listServices } from '../api/services'
import DatePicker from '../components/ui/DatePicker'

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SchedulePage() {
  const navigate = useNavigate()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [schedulings, setSchedulings] = useState([])
  const [clientsById, setClientsById] = useState({})
  const [servicesById, setServicesById] = useState({})
  const [highlightedDates, setHighlightedDates] = useState([])
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
      await loadHighlightedDates()
    } catch {
      setError('Failed to load clients or services')
    }
  }

  async function loadHighlightedDates() {
    // No month-range filter on the API, so we fetch all schedulings once
    // and derive which calendar days have at least one confirmed
    // scheduling. Fine at this project's scale; would need a proper
    // date-range endpoint if the dataset grew significantly.
    try {
      const all = await listSchedulings()
      const dates = all
        .filter((s) => s.status === 'confirmed')
        .map((s) => s.start_time.split('T')[0])
      setHighlightedDates([...new Set(dates)])
    } catch {
      // non-critical: highlighting just won't show if this fails
    }
  }

  async function loadSchedulings() {
    setIsLoading(true)
    try {
      const dateParam = format(selectedDate, 'yyyy-MM-dd')
      const data = await listSchedulings(dateParam)
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
      await loadHighlightedDates()
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
        <div className="flex items-center gap-3">
          <DatePicker
            selected={selectedDate}
            onSelect={setSelectedDate}
            highlightedDates={highlightedDates}
          />
          <button
            onClick={() => navigate('/schedulings/new')}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Scheduling
          </button>
        </div>
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