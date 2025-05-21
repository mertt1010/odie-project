import { useState, useEffect } from "react";
import OutletHeader from "../../components/outlet-header/OutletHeader";
import mockDomainUsers from "../../test/domainUsers.json";

function UsersPage() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [passwordVisibility, setPasswordVisibility] = useState({});

  useEffect(() => {
    // Load domains and users from mock data
    setDomains(mockDomainUsers);

    // Initialize password visibility state for all users
    let initialVisibility = {};
    mockDomainUsers.forEach((domain) => {
      domain.users.forEach((user) => {
        initialVisibility[user.id] = false;
      });
    });
    setPasswordVisibility(initialVisibility);

    setLoading(false);
  }, []);

  const togglePasswordVisibility = (userId) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const toggleDomain = (domainId) => {
    if (expandedDomain === domainId) {
      setExpandedDomain(null);
    } else {
      setExpandedDomain(domainId);
    }
  };

  const handleEditUser = (domain, user) => {
    console.log("Edit user:", user, "in domain:", domain);
    // Implement edit functionality here
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <OutletHeader header="Users" />

      {loading ? (
        <p className="m-6">Loading...</p>
      ) : (
        <div className="space-y-4 m-6">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div
                className="px-6 py-4 cursor-pointer flex justify-between items-center bg-gray-50 hover:bg-gray-100"
                onClick={() => toggleDomain(domain.id)}
              >
                <div>
                  <h2 className="text-lg font-semibold text-odie">
                    {domain.name}
                  </h2>
                  <p className="text-sm text-gray-600">{domain.ip}</p>
                </div>
                <div className="text-odie">
                  <i
                    className={`bi ${
                      expandedDomain === domain.id
                        ? "bi-chevron-up"
                        : "bi-chevron-down"
                    } text-xl`}
                  ></i>
                </div>
              </div>

              {expandedDomain === domain.id && (
                <div className="p-4">
                  {domain.users.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Username
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Password
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            First Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Last Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Department
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Role
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {domain.users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-odie">
                              {user.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <span className="mr-2">
                                  {passwordVisibility[user.id]
                                    ? user.password
                                    : "••••••••"}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePasswordVisibility(user.id);
                                  }}
                                  className="text-odie"
                                >
                                  <i
                                    className={`bi ${
                                      passwordVisibility[user.id]
                                        ? "bi-eye-slash"
                                        : "bi-eye"
                                    }`}
                                  ></i>
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.firstName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.lastName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.role}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.status === "active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => handleEditUser(domain, user)}
                                className="text-odie hover:text-gray-600 flex items-center gap-2 cursor-pointer"
                              >
                                <i className="bi bi-pencil-square text-lg"></i>{" "}
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center py-4 text-gray-500">
                      No users found for this domain.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UsersPage;
