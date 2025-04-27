import React from "react";
import OutletHeader from "../../components/outlet-header/OutletHeader";
import DataTable from "../../components/data-table/DataTable";
import serverList from "../../test/dataTableTest.json";

function HomePage() {
  return (
    <div className="w-full">
      <OutletHeader header="Home Page" />
      <div className="home-page-container p-6">
        <p>HomePage</p>
        <DataTable servers={serverList} />
      </div>
    </div>
  );
}

export default HomePage;
