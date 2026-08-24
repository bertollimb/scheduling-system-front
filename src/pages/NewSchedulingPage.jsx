import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { listClients } from '../api/clients'
import { listServices } from '../api/services'
import { createScheduling, listSchedulings } from '../api/schedulings'
import DatePicker from '../components/ui/DatePicker'

const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

function NewSchedulingPage() {
  const navigate = useNavigate()

  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [availableEvaluations, setAvailableEvaluations] = useState([])
  const [highlightedDates, setHighlightedDates] = useState([])

  const [clientId, setClientId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [type, setType] = useState('procedure')
  const [evaluationId, setEvaluationId] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [hour, setHour] = useState('10')
  const [minute, setMinute] = useState('00')

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedService = services.find((s) => s.id === Number(serviceId))
  const needsEvaluationLink =
    type === 'procedure' && selectedService?.requires_evaluation

  useEffect(() => {
    loadClientsAndServices()
    loadHighlightedDates()
  }, [])

  useEffect(() => {
    if (selectedService?.requires_evaluation && clientId && serviceId) {
      loadAvailableEvaluations()
    } else {
      setAvailableEvaluations([])
      setEvaluationId('')
    }
  }, [clientId, serviceId, selectedService])

  async function loadClientsAndServices() {
    try {
      const [clientsData, servicesData] = await Promise.all([
        listClients(),
        listServices(),
      ])
      setClients(clientsData)
      setServices(servicesData)
    } catch {
      setError('Failed to load clients or services')
    }
  }

  async function loadHighlightedDates() {
    // Same approach as SchedulePage: no month-range filter on the API,
    // so we fetch all schedulings once and derive which days already
    // have at least one confirmed scheduling, so the user can spot busy
    // days before picking a time.
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

  async function loadAvailableEvaluations() {
    try {
      // No date filter: fetch all schedulings and filter client-side for
      // completed, confirmed evaluations matching this client and service.
      // The backend still rejects an already-used or mismatched evaluation
      // on submit, so this is a convenience list, not the source of truth.
      const all = await listSchedulings()
      const matches = all.filter(
        (s) =>
          s.type === 'evaluation' &&
          s.status === 'confirmed' &&
          s.client_id === Number(clientId) &&
          s.service_id === Number(serviceId) &&
          s.estimated_duration_minutes !== null
      )
      setAvailableEvaluations(matches)
    } catch {
      setError('Failed to load available evaluations')
    }
  }

  function handleTypeChange(event) {
    setType(event.target.value)
    setEvaluationId('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!selectedDate) {
      setError('Please select a date')
      return
    }

    setIsSubmitting(true)

    try {
      const startTime = `${format(selectedDate, 'yyyy-MM-dd')}T${hour}:${minute}:00`

      const payload = {
        client_id: Number(clientId),
        service_id: Number(serviceId),
        start_time: startTime,
        type,
      }

      if (needsEvaluationLink) {
        payload.evaluation_id = Number(evaluationId)
      }

      await createScheduling(payload)
      navigate('/schedule')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to create scheduling')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        New Scheduling
      </h1>

      {error && (
        <p className="mb-4 max-w-2xl rounded bg-red-50 p-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid max-w-2xl grid-cols-2 gap-4 rounded-lg bg-white p-4 shadow"
      >
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className="col-span-2 rounded border border-gray-300 px-3 py-2"
        >
          <option value="">Select a client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name}
            </option>
          ))}
        </select>

        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          required
          className="col-span-2 rounded border border-gray-300 px-3 py-2"
        >
          <option value="">Select a service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {selectedService?.requires_evaluation && (
          <select
            value={type}
            onChange={handleTypeChange}
            className="col-span-2 rounded border border-gray-300 px-3 py-2"
          >
            <option value="evaluation">Evaluation</option>
            <option value="procedure">Procedure</option>
          </select>
        )}

        {needsEvaluationLink && (
          <select
            value={evaluationId}
            onChange={(e) => setEvaluationId(e.target.value)}
            required
            className="col-span-2 rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Select a completed evaluation</option>
            {availableEvaluations.map((evaluation) => (
              <option key={evaluation.id} value={evaluation.id}>
                {new Date(evaluation.start_time).toLocaleDateString('en-GB')} -{' '}
                {evaluation.estimated_duration_minutes} min
              </option>
            ))}
          </select>
        )}

        {needsEvaluationLink && availableEvaluations.length === 0 && (
          <p className="col-span-2 text-sm text-amber-600">
            No completed evaluation found for this client and service. Create
            an evaluation first, then complete it before booking the
            procedure.
          </p>
        )}

        <label className="col-span-2 text-sm text-gray-600">
          Start date and time
        </label>
        <div className="col-span-2 flex items-center gap-2">
          <DatePicker
            selected={selectedDate}
            onSelect={setSelectedDate}
            highlightedDates={highlightedDates}
          />
          <select
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          >
            {hourOptions.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <span className="text-gray-500">:</span>
          <select
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          >
            {minuteOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {selectedService?.category &&
          ['hair_treatment', 'straightening'].includes(
            selectedService.category
          ) &&
          type === 'procedure' && (
            <p className="col-span-2 text-sm text-gray-500">
              Hair treatment / straightening procedures must start at opening
              time (10:00).
            </p>
          )}

        <button
          type="submit"
          disabled={isSubmitting || (needsEvaluationLink && !evaluationId)}
          className="col-span-2 rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create scheduling'}
        </button>
      </form>
    </div>
  )
}

export default NewSchedulingPage