import { useState } from 'react'
import './App.css'

type View = 'home' | 'create' | 'join'

function App() {
  const [view, setView] = useState<View>('home')

  if (view === 'create') {
    return (
      <main className="screen">
        <h1>New game</h1>
        <p>Game creation is coming soon.</p>
        <BackButton onClick={() => setView('home')} />
      </main>
    )
  }

  if (view === 'join') {
    return (
      <main className="screen">
        <h1>Join a game</h1>
        <p>Joining with a code is coming soon.</p>
        <BackButton onClick={() => setView('home')} />
      </main>
    )
  }

  return (
    <main className="screen">
      <h1>Vote Together</h1>
      <p className="tagline">How much does everyone love cheese? Find out together.</p>
      <div className="actions">
        <button type="button" className="primary" onClick={() => setView('create')}>
          Create game
        </button>
        <button type="button" className="secondary" onClick={() => setView('join')}>
          Join game
        </button>
      </div>
    </main>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="link" onClick={onClick}>
      ← Back
    </button>
  )
}

export default App
