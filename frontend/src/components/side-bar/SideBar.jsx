import { Link, useLocation, useNavigate } from "react-router-dom";
import odieIcon from "../../assets/img/icon.png";
import { useAuth } from "../../context/AuthContext";
import AuthService from "../../services/AuthService";
import { useState } from "react";

function SideBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const getPageTitle = () => {
    if (location.pathname === "/" || location.pathname.startsWith("/domains"))
      return "Domains";
    if (location.pathname.startsWith("/users")) return "Users";
    if (location.pathname.startsWith("/departments")) return "Departments";
    if (location.pathname.startsWith("/logs")) return "Logs";
    return "";
  };

  return (
    <>
      {/* Header with page title and hamburger - visible only on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-20 flex items-center justify-between px-6">
        <h1 className="text-xl font-semibold text-odie">{getPageTitle()}</h1>
        <button
          onClick={toggleMenu}
          className="text-odie"
          aria-label="Toggle menu"
        >
          <i className={`bi ${isOpen ? "bi-x-lg" : "bi-list"} text-2xl`}></i>
        </button>
      </div>

      {/* Overlay when menu is open on mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0  z-10"
          onClick={toggleMenu}
        ></div>
      )}

      {/* Desktop sidebar - always visible on desktop */}
      <div className="hidden md:flex flex-col w-[72px] border-r h-screen border-gray-300 fixed left-0 top-0 bg-white z-10">
        {/* Logo - visible only on desktop */}
        <div className="logo w-full h-[72px] flex items-center justify-center border-b border-gray-300">
          <img src={odieIcon} alt="" className="w-[32px] h-auto" />
        </div>
        <div className="links flex flex-col">
          <Link
            to="/domains"
            className="text-odie w-full h-[72px] text-[32px] flex justify-center items-center border-b border-gray-300 hover:bg-gray-100"
          >
            <i
              className={`${
                isActive("/") || isActive("/domains")
                  ? "bi bi-hdd-network-fill"
                  : "bi bi-hdd-network"
              }`}
            ></i>
          </Link>

          <Link
            to="/users"
            className="text-odie w-full h-[72px] text-[32px] flex justify-center items-center border-b border-gray-300 hover:bg-gray-100"
          >
            <i
              className={`${
                isActive("/users") ? "bi bi-people-fill" : "bi bi-people"
              }`}
            ></i>
          </Link>

          <Link
            to="/departments"
            className="text-odie w-full h-[72px] text-[32px] flex justify-center items-center border-b border-gray-300 hover:bg-gray-100"
          >
            <i
              className={`${
                isActive("/departments")
                  ? "bi bi-building-fill"
                  : "bi bi-building"
              }`}
            ></i>
          </Link>

          <Link
            to="/logs"
            className="text-odie w-full h-[72px] text-[32px] flex justify-center items-center border-b border-gray-300 hover:bg-gray-100"
          >
            <i
              className={`${
                isActive("/logs")
                  ? "bi bi-clipboard-data-fill"
                  : "bi bi-clipboard-data"
              }`}
            ></i>
          </Link>
        </div>

        {isAuthenticated && (
          <div className="mt-auto border-t border-gray-300">
            <button
              onClick={handleLogout}
              className="text-odie w-full h-[72px] text-[32px] flex justify-center items-center hover:bg-gray-100 cursor-pointer"
              title="Logout"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        )}
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={`
        md:hidden fixed left-0 right-0 top-16 bg-white shadow-md z-10
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-y-0" : "-translate-y-full"}
        border-b border-gray-300 overflow-hidden
      `}
      >
        <div className="links flex flex-col">
          <Link
            to="/domains"
            className="text-odie w-full h-16 text-xl flex items-center px-6 border-b border-gray-100 hover:bg-gray-50"
            onClick={() => setIsOpen(false)}
          >
            <i
              className={`${
                isActive("/") || isActive("/domains")
                  ? "bi bi-hdd-network-fill"
                  : "bi bi-hdd-network"
              } mr-3`}
            ></i>
            <span>Domains</span>
          </Link>

          <Link
            to="/users"
            className="text-odie w-full h-16 text-xl flex items-center px-6 border-b border-gray-100 hover:bg-gray-50"
            onClick={() => setIsOpen(false)}
          >
            <i
              className={`${
                isActive("/users") ? "bi bi-people-fill" : "bi bi-people"
              } mr-3`}
            ></i>
            <span>Users</span>
          </Link>

          <Link
            to="/departments"
            className="text-odie w-full h-16 text-xl flex items-center px-6 border-b border-gray-100 hover:bg-gray-50"
            onClick={() => setIsOpen(false)}
          >
            <i
              className={`${
                isActive("/departments")
                  ? "bi bi-building-fill"
                  : "bi bi-building"
              } mr-3`}
            ></i>
            <span>Departments</span>
          </Link>

          <Link
            to="/logs"
            className="text-odie w-full h-16 text-xl flex items-center px-6 border-b border-gray-100 hover:bg-gray-50"
            onClick={() => setIsOpen(false)}
          >
            <i
              className={`${
                isActive("/logs")
                  ? "bi bi-clipboard-data-fill"
                  : "bi bi-clipboard-data"
              } mr-3`}
            ></i>
            <span>Logs</span>
          </Link>

          {isAuthenticated && (
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="text-odie w-full h-16 text-xl flex items-center px-6 hover:bg-gray-50 cursor-pointer"
            >
              <i className="bi bi-box-arrow-right mr-3"></i>
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default SideBar;
