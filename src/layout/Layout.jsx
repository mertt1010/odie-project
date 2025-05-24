import React from "react";
import SideBar from "../components/side-bar/SideBar";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="flex w-full min-h-screen">
      <SideBar />
      <div className="flex-1 ml-[72px]">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
