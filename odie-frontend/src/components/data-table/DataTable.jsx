import React from "react";

function DataTable(props) {
  return (
    <>
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
            <th className="py-3 px-6 text-left w-[70%] text-odie">SERVER</th>
            <th className="py-3 px-6 text-left w-[30%] text-odie">
              EDIT SERVERS
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-600 text-sm font-light">
          {props.servers.map((server, index) => (
            <tr
              key={index}
              className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="py-3 px-6 text-left font-medium w-[70%]">
                <b>{server.serverName}</b> | {server.serverIp}
              </td>
              <td className="py-3 px-6 text-left font-medium w-[70%] flex gap-3">
                <button className="py-3 px-4 bg-odie text-white rounded-[8px]">
                  View Details
                </button>{" "}
                <button className="py-3 px-4 bg-odie text-white rounded-[8px]">
                  Edit
                </button>{" "}
                <button className="py-3 px-4 bg-odie text-white rounded-[8px]">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default DataTable;
