import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import odieIcon from "../../assets/img/icon.png";
import { useAuth } from "../../context/AuthContext";
import AuthService from "../../services/AuthService";

function SideBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex flex-col w-[72px] border-r h-screen border-gray-300">
      <div className="logo w-full h-[72px] flex items-center justify-center border-b border-gray-300">
        <img src={odieIcon} alt="" className="w-[32px] h-auto" />
      </div>
      <div className="links flex flex-col flex-grow">
        <Link
          to="/"
          className="text-odie w-full h-[72px] text-[32px] flex justify-center items-center border-b border-gray-300"
        >
          <i
            className={`${isActive("/") ? "bi bi-house-fill" : "bi bi-house"}`}
          ></i>
        </Link>

        <Link
          to="/example-page-one"
          className="text-odie w-full h-[72px] text-[32px] flex justify-center items-center border-b border-gray-300"
        >
          <i
            className={`${
              isActive("/example-page-one") ? "bi bi-moon-fill" : "bi bi-moon"
            }`}
          ></i>
        </Link>

        <Link
          to="/example-page-two"
          className="text-odie w-full h-[72px] text-[32px] flex justify-center items-center border-b border-gray-300"
        >
          <i
            className={`${
              isActive("/example-page-two")
                ? "bi bi-lightning-fill"
                : "bi bi-lightning"
            }`}
          ></i>
        </Link>
      </div>

      {isAuthenticated && (
        <div className="mt-auto border-t border-gray-300">
          <button
            onClick={handleLogout}
            className="text-odie w-full h-[72px] text-[32px] flex justify-center items-center"
            title="Logout"
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}

export default SideBar;
