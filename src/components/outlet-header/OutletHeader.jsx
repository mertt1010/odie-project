import React from "react";

function OutletHeader(props) {
  return (
    <div className="h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
      {props.header}
    </div>
  );
}

export default OutletHeader;
