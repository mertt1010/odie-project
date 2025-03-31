import React from "react";
import OutletHeader from "../../components/outlet-header/OutletHeader";

function ExamplePageOne() {
  return (
    <div className="w-full">
      <OutletHeader header="Example Page One" />
      <div className="example-page-one-container p-6">
        <p>ExamplePageOne</p>
      </div>
    </div>
  );
}

export default ExamplePageOne;
