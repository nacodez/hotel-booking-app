import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NavigationHeader = () => {
  const { currentUser, logoutUser } = useAuth()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 10)
      
      // Only track sections on homepage
      if (location.pathname === '/') {
        const aboutSection = document.getElementById('about')
        const contactSection = document.getElementById('contact')
        
        if (aboutSection && contactSection) {
          const aboutTop = aboutSection.offsetTop - 100
          const contactTop = contactSection.offsetTop - 100
          
          if (scrollTop >= contactTop) {
            setActiveSection('contact')
          } else if (scrollTop >= aboutTop) {
            setActiveSection('about')
          } else {
            setActiveSection('')
          }
        }
      } else {
        setActiveSection('')
      }
    }

    window.addEventListener('scroll', handleScroll)
    // Also call on mount to set initial state
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  const handleUserLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const isActivePath = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  const isActiveAnchor = (anchor) => {
    if (location.pathname === '/' && activeSection === anchor) return true
    if (location.hash === `#${anchor}`) return true
    return false
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
              <Link 
                to="/" 
                className={`nav-link ${isActivePath('/') ? 'active' : ''}`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/search" 
                className={`nav-link ${isActivePath('/search') ? 'active' : ''}`}
              >
                Rooms
              </Link>
            </li>
            {currentUser && (
              <li>
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${isActivePath('/dashboard') ? 'active' : ''}`}
                >
                  My Bookings
                </Link>
              </li>
            )}
            <li>
              <a href="/#about" className={`nav-link ${isActiveAnchor('about') ? 'active' : ''}`}>About</a>
            </li>
            <li>
              <a href="/#contact" className={`nav-link ${isActiveAnchor('contact') ? 'active' : ''}`}>Contact</a>
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