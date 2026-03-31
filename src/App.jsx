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

function costToUnits(cost, ratePerHour) {
  const totalQuarters = Math.round(cost / (ratePerHour / 4))
  return {
    fullHours: Math.floor(totalQuarters / 4),
    remainingQuarters: totalQuarters % 4,
  }
}

function addMinutes(timeStr, minutes) {
  const total = (timeToMinutes(timeStr) + minutes) % (24 * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
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
  const [endTime, setEndTime] = useState(() => addMinutes(floorToNearest15(), 60))
  const [players, setPlayers] = useState(4)
  const [showSplit, setShowSplit] = useState(false)
  const [shares, setShares] = useState([1, 1, 1, 1])

  const PLAYER_OPTIONS = [3, 4]

  function handleSetPlayers(n) {
    setPlayers(n)
    setShares(Array(n).fill(1))
  }

  function handleShareChange(i, val) {
    setShares(prev => prev.map((s, idx) => idx === i ? val : s))
  }

  const result = useMemo(() => {
    const roundedEnd = roundToNearest15(endTime)
    let startMin = timeToMinutes(startTime)
    let endMin = timeToMinutes(roundedEnd)

    if (endMin <= startMin) endMin += 24 * 60

    const totalMin = endMin - startMin
    const totalQuarters = Math.round(totalMin / 15)
    const fullHours = Math.floor(totalQuarters / 4)
    const remainingQuarters = totalQuarters % 4

    const roomCost = fullHours * ratePerHour + remainingQuarters * (ratePerHour / 4)
    const costPerPlayer = roomCost / players

    return {
      roundedEnd,
      totalMin,
      fullHours,
      remainingQuarters,
      roomCost,
      costPerPlayer,
    }
  }, [startTime, endTime, players, ratePerHour])

  const activeShares = shares.slice(0, players)
  const splitTotals = activeShares.map(s => s * result.costPerPlayer)
  const splitGrandTotal = splitTotals.reduce((a, b) => a + b, 0)


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
                onChange={(e) => {
                  const newStart = e.target.value
                  setStartTime(newStart)
                  let endMin = timeToMinutes(endTime)
                  let startMin = timeToMinutes(newStart)
                  if (endMin <= startMin) endMin += 24 * 60
                  if (endMin - startMin < 60) setEndTime(addMinutes(newStart, 60))
                }}
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
                onChange={(e) => setEndTime(e.target.value)}
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
              {PLAYER_OPTIONS.map((n) => (
                <button
                  key={n}
                  className={players === n ? 'active' : ''}
                  onClick={() => handleSetPlayers(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            className="split-toggle"
            onClick={() => setShowSplit(v => !v)}
          >
            Custom split
            <span className="split-chevron">{showSplit ? '▲' : '▼'}</span>
          </button>

          {showSplit && (
            <div className="split-sliders">
              {activeShares.map((s, i) => (
                <div key={i} className="split-row">
                  <span className="split-player-label">Player {i + 1}</span>
                  <input
                    type="range"
                    min={0}
                    max={players}
                    step={1}
                    value={s}
                    onChange={(e) => handleShareChange(i, Number(e.target.value))}
                  />
                  <span className="split-value">
                    {s === 0 ? 'free' : `×${s}`}
                  </span>
                </div>
              ))}
              {activeShares.reduce((a, b) => a + b, 0) !== players && (
                <p className="split-warning">
                  Split totals {activeShares.reduce((a, b) => a + b, 0)} share{activeShares.reduce((a, b) => a + b, 0) !== 1 ? 's' : ''}, expected {players}.
                </p>
              )}
            </div>
          )}
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
                <span className="unit-cost">${(result.fullHours * ratePerHour / players).toFixed(2)}</span>
              </div>
              <div className="unit-sep">+</div>
              <div className="unit">
                <span className="unit-count">{result.remainingQuarters}</span>
                <span className="unit-label">quarter hour{result.remainingQuarters !== 1 ? 's' : ''}</span>
                <span className="unit-cost">${(result.remainingQuarters * ratePerHour / 4 / players).toFixed(2)}</span>
              </div>
            </div>
            <div className="per-player-total">
              <span>Per player</span>
              <span className="amount">${result.costPerPlayer.toFixed(2)}</span>
            </div>
          </div>

          {showSplit ? (
            <>
              <div className="split-breakdown">
                {activeShares.map((s, i) => {
                  const { fullHours, remainingQuarters } = costToUnits(splitTotals[i], ratePerHour)
                  return (
                  <div key={i} className="split-breakdown-row">
                    <span className="split-breakdown-label">
                      Player {i + 1}
                      <span className="split-breakdown-note">
                        {s === 0
                          ? ' (free)'
                          : ` — ${fullHours > 0 ? `${fullHours}h ` : ''}${remainingQuarters > 0 ? `${remainingQuarters * 15}min` : ''}`
                        }
                      </span>
                    </span>
                    <span className="split-breakdown-amount">${splitTotals[i].toFixed(2)}</span>
                  </div>
                  )
                })}
              </div>
              <div className="total-row">
                <span>Total</span>
                <span className="total-amount">${splitGrandTotal.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="total-row">
              <span>{players} player{players !== 1 ? 's' : ''}</span>
              <span className="total-amount">${result.roomCost.toFixed(2)}</span>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
