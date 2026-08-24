import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate('/');
  }

  return (
    <nav className="nav">
      <div className="nav__inner">
        <Link className="nav__brand" to="/">
          Inkwell.
        </Link>

        <div className="nav__links">
          <NavLink className="nav__link" to="/" end>
            Feed
          </NavLink>
          {user && (
            <NavLink className="nav__link" to="/me">
              My posts
            </NavLink>
          )}
        </div>

        <span className="spacer" />

        {user ? (
          <div className="nav__links">
            <span className="nav__user nav__hide-sm">@{user.username}</span>
            <button type="button" className="btn btn--quiet" onClick={signOut}>
              Log out
            </button>
            <Link className="btn btn--primary btn--sm" to="/new">
              Write
            </Link>
          </div>
        ) : (
          <div className="nav__links">
            <Link className="nav__link" to="/login">
              Log in
            </Link>
            <Link className="btn btn--primary btn--sm" to="/register">
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
