import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NavigationHeader = () => {
  const { currentUser, logoutUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleUserLogout = async () => {
    try {
      await logoutUser()
      navigate('/')
    } catch (error) {
      console.error('Error during logout:', error)
      // Still redirect to home even if logout API fails
      navigate('/')
    }
  }


  return (
    <header className={`navigation-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <nav className="nav-container">
          <Link to="/" className="brand-logo">
            HotelBooker
          </Link>
          
          <ul className="nav-menu hidden-mobile">
            <li>
              <Link to="/" className="nav-link">
                Home
              </Link>
            </li>
            <li>
              <Link to="/search" className="nav-link">
                Rooms
              </Link>
            </li>
            {currentUser && (
              <li>
                <Link to="/dashboard" className="nav-link">
                  My Bookings
                </Link>
              </li>
            )}
            <li>
              <a href="/#about" className="nav-link">About</a>
            </li>
            <li>
              <a href="/#contact" className="nav-link">Contact</a>
            </li>
          </ul>

          <div className="user-actions">
            {currentUser ? (
              <>
                <span className="user-welcome hidden-mobile">
                  Welcome, {currentUser.displayName || currentUser.email.split('@')[0]}
                </span>
                <button onClick={handleUserLogout} className="btn btn-secondary btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/auth?mode=login" className="btn btn-secondary btn-sm">
                  Login
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default NavigationHeader