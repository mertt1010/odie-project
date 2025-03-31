import React from "react";
import { Link, useLocation } from "react-router-dom";
import odieIcon from "../../assets/img/icon.png";

function SideBar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex flex-col w-[72px] border-r h-screen border-gray-300">
      <div className="logo w-full h-[72px] flex items-center justify-center border-b border-gray-300">
        <img src={odieIcon} alt="" className="w-[32px] h-auto" />
      </div>
      <div className="links flex flex-col">
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
    </div>
  );
}

export default SideBar;
