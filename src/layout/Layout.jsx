import React from "react";
import SideBar from "../components/side-bar/SideBar";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="flex w-full min-h-screen flex-col md:flex-row md:mt-0 mt-[72px]">
      <SideBar />
      <div className="flex-1 ml-0 md:ml-[72px]">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
