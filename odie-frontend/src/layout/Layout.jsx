import React from "react";
import SideBar from "../components/side-bar/SideBar";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="flex w-full h-auto">
      <SideBar />
      <Outlet />
    </div>
  );
}

export default Layout;
