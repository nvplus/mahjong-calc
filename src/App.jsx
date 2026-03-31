import { useState, useMemo } from 'react'
import './App.css'

function roundToNearest15(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const totalMin = h * 60 + m
  const rounded = Math.round(totalMin / 15) * 15
  const rh = Math.floor(rounded / 60) % 24
  const rm = rounded % 60
  return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`
}


function floorToNearest15() {
  const now = new Date()
  const totalMin = now.getHours() * 60 + now.getMinutes()
  const floored = Math.floor(totalMin / 15) * 15
  const h = Math.floor(floored / 60) % 24
  const m = floored % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function ceilToNearest15() {
  const now = new Date()
  const totalMin = now.getHours() * 60 + now.getMinutes()
  const ceiled = Math.ceil(totalMin / 15) * 15
  const h = Math.floor(ceiled / 60) % 24
  const m = ceiled % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export default function App() {
  const [ratePerHour, setRatePerHour] = useState(16)
  const [startTime, setStartTime] = useState(floorToNearest15)
  const [endTime, setEndTime] = useState(ceilToNearest15)
  const [players, setPlayers] = useState(4)

  const result = useMemo(() => {
    const roundedEnd = roundToNearest15(endTime)
    let startMin = timeToMinutes(startTime)
    let endMin = timeToMinutes(roundedEnd)

    if (endMin <= startMin) endMin += 24 * 60

    const totalMin = endMin - startMin
    const totalQuarters = Math.round(totalMin / 15)
    const fullHours = Math.floor(totalQuarters / 4)
    const remainingQuarters = totalQuarters % 4

    const costPerPlayer = fullHours * ratePerHour + remainingQuarters * (ratePerHour / 4)
    const totalCost = costPerPlayer * players

    return {
      roundedEnd,
      totalMin,
      fullHours,
      remainingQuarters,
      costPerPlayer,
      totalCost,
    }
  }, [startTime, endTime, players, ratePerHour])

  const handleEndTimeChange = (e) => {
    setEndTime(e.target.value)
  }

  return (
    <div className="app">
      <header>
        <h1>Mahjong Table Checkout</h1>
      </header>

      <main>
        <section className="card settings">
          <label className="field">
            <span className="label">Rate per hour</span>
            <div className="input-prefix">
              <span className="prefix">$</span>
              <input
                type="number"
                min="1"
                step="1"
                value={ratePerHour}
                onChange={(e) => setRatePerHour(Number(e.target.value))}
              />
            </div>
          </label>
        </section>

        <section className="card inputs">
          <div className="field">
            <span className="label">Start time</span>
            <div className="time-row">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <button className="now-btn" onClick={() => setStartTime(floorToNearest15())}>Now</button>
            </div>
          </div>

          <div className="field">
            <span className="label">End time</span>
            <div className="time-row">
              <input
                type="time"
                value={endTime}
                onChange={handleEndTimeChange}
              />
              <button className="now-btn" onClick={() => setEndTime(ceilToNearest15())}>Now</button>
            </div>
            {endTime !== result.roundedEnd && (
              <span className="rounded-hint">
                Rounded to {formatTime(result.roundedEnd)}
              </span>
            )}
          </div>

          <div className="field">
            <span className="label">Number of players</span>
            <div className="player-buttons">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  className={players === n ? 'active' : ''}
                  onClick={() => setPlayers(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card results">
          <div className="duration-row">
            <span className="duration-label">Duration</span>
            <span className="duration-value">
              {formatTime(startTime)} &rarr; {formatTime(result.roundedEnd)}
              <span className="duration-total">
                {result.fullHours > 0 && `${result.fullHours}h `}
                {result.remainingQuarters > 0 && `${result.remainingQuarters * 15}min`}
                {result.fullHours === 0 && result.remainingQuarters === 0 && '0 min'}
              </span>
            </span>
          </div>

          <div className="breakdown">
            <div className="breakdown-header">Per player charge</div>
            <div className="units">
              <div className="unit">
                <span className="unit-count">{result.fullHours}</span>
                <span className="unit-label">full hour{result.fullHours !== 1 ? 's' : ''}</span>
                <span className="unit-cost">${(result.fullHours * ratePerHour).toFixed(2)}</span>
              </div>
              <div className="unit-sep">+</div>
              <div className="unit">
                <span className="unit-count">{result.remainingQuarters}</span>
                <span className="unit-label">quarter hour{result.remainingQuarters !== 1 ? 's' : ''}</span>
                <span className="unit-cost">${(result.remainingQuarters * ratePerHour / 4).toFixed(2)}</span>
              </div>
            </div>
            <div className="per-player-total">
              <span>Per player</span>
              <span className="amount">${result.costPerPlayer.toFixed(2)}</span>
            </div>
          </div>

          <div className="total-row">
            <span>{players} player{players !== 1 ? 's' : ''}</span>
            <span className="total-amount">${result.totalCost.toFixed(2)}</span>
          </div>
        </section>
      </main>
    </div>
  )
}
