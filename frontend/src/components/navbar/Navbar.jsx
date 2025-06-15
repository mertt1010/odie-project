import { useState } from "react";
import { Link } from "react-router-dom";
import logoColored from "../../assets/img/logo_colored.png";

function Navbar({ showAuthButton = true, showNavLinks = true }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/">
              <img src={logoColored} alt="Odie" className="h-8" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {showNavLinks && (
              <>
                <a
                  href="/#features"
                  className="text-gray-600 hover:text-odie transition-colors"
                >
                  Features
                </a>
                <a
                  href="/#about"
                  className="text-gray-600 hover:text-odie transition-colors"
                >
                  About
                </a>
              </>
            )}
            {showAuthButton && (
              <Link
                to="/login"
                className="bg-odie text-white px-4 py-2 rounded-lg hover:bg-odie/90 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-odie focus:outline-none"
            >
              <i
                className={`bi ${isMenuOpen ? "bi-x-lg" : "bi-list"} text-xl`}
              ></i>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              {showNavLinks && (
                <>
                  <a
                    href="/#features"
                    className="text-gray-600 hover:text-odie transition-colors"
                  >
                    Features
                  </a>
                  <a
                    href="/#about"
                    className="text-gray-600 hover:text-odie transition-colors"
                  >
                    About
                  </a>
                </>
              )}
              {showAuthButton && (
                <Link
                  to="/login"
                  className="bg-odie text-white px-4 py-2 rounded-lg hover:bg-odie/90 transition-colors text-center"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
