
import { useEffect, useState } from 'react'
import Admin from './Admin'
import './App.css'

const API_URL = 'https://clubconnect-1-pv64.onrender.com';


function App() {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedClub, setSelectedClub] = useState(null)
  const [joiningClub, setJoiningClub] = useState(null)
  const [studentName, setStudentName] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [registrationError, setRegistrationError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (window.location.pathname === '/admin') return

    async function fetchClubs() {
      try {
        const response = await fetch(`${API_URL}/api/clubs`)

        if (!response.ok) {
          throw new Error('Failed to load clubs.')
        }

        const result = await response.json()
        const clubList = Array.isArray(result) ? result : result.clubs

        if (!Array.isArray(clubList)) {
          throw new Error('Unexpected server response.')
        }

        const icons = {
          'Coding Club': '💻',
          'Dance Club': '💃',
          'Photography Club': '📸',
          'AI & ML Club': '🤖',
        }

        const categories = {
          'Coding Club': 'Technology',
          'Dance Club': 'Arts & Culture',
          'Photography Club': 'Creative Arts',
          'AI & ML Club': 'Technology',
        }

        setClubs(
          clubList.map((club) => ({
            ...club,
            icon: icons[club.name] || '🎓',
            category: categories[club.name] || 'College Community',
          })),
        )
      } catch (err) {
        console.error('Error loading clubs:', err)
        setError('Could not load clubs. Make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }

    fetchClubs()
  }, [])

  function viewClub(club) {
    setSelectedClub(club)
    setJoiningClub(null)
    setMessage('')
    setRegistrationError('')

    setTimeout(() => {
      document.getElementById('club-details')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 150)
  }

  function openRegistration(club) {
    setJoiningClub(club)
    setSelectedClub(null)
    setStudentName('')
    setRollNumber('')
    setEmail('')
    setMessage('')
    setRegistrationError('')
    setSubmitting(false)

    setTimeout(() => {
      document.getElementById('registration')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 150)
  }

  async function handleRegistration(event) {
    event.preventDefault()

    if (!joiningClub || submitting) return

    setSubmitting(true)
    setRegistrationError('')
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/api/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: studentName.trim(),
          roll_number: rollNumber.trim(),
          email: email.trim(),
          club_id: joiningClub.id,
        }),
      })

      const data = await response.json()

      if (response.status === 409) {
        throw new Error(
          data.message ||
            'You have already registered for this club.',
        )
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Registration failed.')
      }

      setMessage(
        `Your registration for ${joiningClub.name} has been saved successfully!`,
      )
    } catch (err) {
      console.error('Registration error:', err)
      setRegistrationError(
        err.message || 'Could not connect to the server.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (window.location.pathname === '/admin') {
    return <Admin />
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">C</span>
          ClubConnect
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#clubs">Explore Clubs</a>
          <a href="#events">Events</a>
          <a href="/admin">Admin</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">YOUR CAMPUS. YOUR COMMUNITY.</span>

            <h1>
              Find Your People.
              <br />
              <span>Discover Your Passion.</span>
            </h1>

            <p>
              Explore college clubs, meet like-minded students and turn your
              interests into unforgettable experiences.
            </p>

            <a className="primary-button" href="#clubs">
              Explore Clubs <span>→</span>
            </a>

            <div className="hero-stats">
              <div>
                <strong>{clubs.length}</strong>
                <span>Clubs Loaded</span>
              </div>
              <div>
                <strong>Active</strong>
                <span>Student Community</span>
              </div>
              <div>
                <strong>New</strong>
                <span>Experiences Await</span>
              </div>
            </div>
          </div>

          <div
            className="hero-art"
            aria-label="Students celebrating college activities"
          >
            <div className="art-circle">
              <span className="floating-icon icon-one">💻</span>
              <span className="floating-icon icon-two">🎨</span>
              <span className="floating-icon icon-three">🎵</span>
              <span className="floating-icon icon-four">🚀</span>
              <div className="student-emoji">🧑‍🎓</div>
            </div>
            <div className="art-caption">
              <span>✦</span> Discover. Connect. Create.
            </div>
          </div>
        </section>

        <section className="clubs-section" id="clubs">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FIND YOUR COMMUNITY</span>
              <h2>Explore College Clubs</h2>
              <p>There is a place for every passion.</p>
            </div>
            <span className="club-count">{clubs.length} clubs</span>
          </div>

          {loading && <p>Loading clubs from the database...</p>}

          {!loading && error && (
            <div role="alert">
              <p>{error}</p>
              <button
                className="join-button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && clubs.length === 0 && (
            <p>No clubs found in the database yet.</p>
          )}

          {!loading && !error && clubs.length > 0 && (
            <div className="club-grid">
              {clubs.map((club) => (
                <article className="club-card" key={club.id}>
                  <div className="club-icon">{club.icon}</div>
                  <span className="club-category">{club.category}</span>
                  <h3>{club.name}</h3>
                  <p>{club.description}</p>

                  <div className="club-footer">
                    <span>📍 {club.location || 'Campus'}</span>

                    <button
                      className="join-button"
                      onClick={() => viewClub(club)}
                    >
                      View Club →
                    </button>

                    <button
                      className="join-button"
                      onClick={() => openRegistration(club)}
                    >
                      Join Club +
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {selectedClub && (
          <section className="events-section" id="club-details">
            <span className="eyebrow">CLUB DETAILS</span>

            <h2>
              {selectedClub.icon} {selectedClub.name}
            </h2>

            <p>
              <strong>Category:</strong> {selectedClub.category}
            </p>
            <p>{selectedClub.description || 'No description available.'}</p>
            <p>
              <strong>Location:</strong> {selectedClub.location || 'Campus'}
            </p>

            <button
              className="join-button"
              onClick={() => setSelectedClub(null)}
            >
              Close Details
            </button>

            <button
              className="join-button"
              onClick={() => openRegistration(selectedClub)}
            >
              Join This Club
            </button>
          </section>
        )}

        {joiningClub && (
          <section className="events-section registration-card" id="registration">
            <span className="eyebrow">BECOME A MEMBER</span>

            <h2>
              Join {joiningClub.icon} {joiningClub.name}
            </h2>
            <p>Complete the form below to register for this club.</p>

            {message ? (
              <div role="status">
                <h3>Registration Submitted! 🎉</h3>
                <p>{message}</p>
                <button
                  className="join-button"
                  onClick={() => {
                    setJoiningClub(null)
                    setMessage('')
                  }}
                >
                  Close Form
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegistration} className="registration-form">
                <label htmlFor="studentName">Student Name</label>
                <input
                  id="studentName"
                  type="text"
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />

                <label htmlFor="rollNumber">Roll Number</label>
                <input
                  id="rollNumber"
                  type="text"
                  value={rollNumber}
                  onChange={(event) => setRollNumber(event.target.value)}
                  placeholder="Enter your roll number"
                  required
                />

                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />

                <p className="selected-club">
                  <strong>Selected Club:</strong> {joiningClub.name}
                </p>

                {registrationError && (
                  <p className="registration-error" role="alert">
                    {registrationError}
                  </p>
                )}

                <div className="registration-actions">
                  <button
                    className="join-button"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Registration'}
                  </button>

                  <button
                    className="join-button"
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setJoiningClub(null)
                      setMessage('')
                      setRegistrationError('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <section className="events-section" id="events">
          <span className="eyebrow">STAY IN THE LOOP</span>
          <h2>Something Exciting Is Coming</h2>
          <p>
            Club events, workshops, auditions and campus activities will appear
            here as we build the next features.
          </p>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">C</span>
          ClubConnect
        </a>
        <p>Bringing campus communities together.</p>
        <span>College Club Management System</span>
      </footer>
    </div>
  )
}

export default App
