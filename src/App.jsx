import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [time, setTime] = useState(new Date())
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const seconds = time.getSeconds().toString().padStart(2, '0')

  const gradientX = (mousePos.x / window.innerWidth) * 100
  const gradientY = (mousePos.y / window.innerHeight) * 100

  return (
    <div
      className="app"
      style={{
        background: `radial-gradient(circle at ${gradientX}% ${gradientY}%, #1a1a2e, #16213e, #0f3460)`,
      }}
    >
      <div className="glow" style={{ left: mousePos.x, top: mousePos.y }} />

      <nav className="navbar">
        <div className="logo">ATHENA</div>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <main className="hero">
        <div className="hero-content">
          <p className="hero-tag">Welcome to the future</p>
          <h1 className="hero-title">
            Build Something
            <span className="gradient-text"> Extraordinary</span>
          </h1>
          <p className="hero-description">
            A beautifully crafted sample page, ready to be replaced with your
            real content. Move your mouse around to see the magic.
          </p>

          <div className="clock">
            <div className="clock-segment">
              <span className="clock-value">{hours}</span>
              <span className="clock-label">Hours</span>
            </div>
            <span className="clock-separator">:</span>
            <div className="clock-segment">
              <span className="clock-value">{minutes}</span>
              <span className="clock-label">Minutes</span>
            </div>
            <span className="clock-separator">:</span>
            <div className="clock-segment">
              <span className="clock-value">{seconds}</span>
              <span className="clock-label">Seconds</span>
            </div>
          </div>

          <div className="cta-group">
            <button className="btn btn-primary">Get Started</button>
            <button className="btn btn-secondary">Learn More</button>
          </div>
        </div>

        <div className="cards">
          {['Fast', 'Modern', 'Beautiful'].map((title, i) => (
            <div className="card" key={i} style={{ animationDelay: `${i * 0.2}s` }}>
              <div className="card-icon">{['⚡', '🚀', '✨'][i]}</div>
              <h3>{title}</h3>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>Sample Site &mdash; Replace with your content</p>
      </footer>
    </div>
  )
}

export default App
