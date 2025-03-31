import React from "react";
import OutletHeader from "../../components/outlet-header/OutletHeader";

function HomePage() {
  return (
    <div className="w-full">
      <OutletHeader header="Home Page" />
      <div className="home-page-container p-6">
        <p>HomePage</p>
      </div>
    </div>
  );
}

export default HomePage;
