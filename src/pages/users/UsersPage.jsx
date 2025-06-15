import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DomainService from "../../services/DomainService";

function UsersPage() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [filteredDomains, setFilteredDomains] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [departments, setDepartments] = useState([]);
  // Sorting states
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [domainSortConfigs, setDomainSortConfigs] = useState({});
  const { user } = useAuth();

  // Helper function to get department name by ID
  const getDepartmentName = (departmentId) => {
    if (!departmentId) return "Not Assigned";

    // Convert to number for comparison if it's a string
    const deptId =
      typeof departmentId === "string"
        ? parseInt(departmentId, 10)
        : departmentId;

    const department = departments.find((dept) => dept.id === deptId);
    return department ? department.name : "Unknown Department";
  };

  // Function to fetch all data
  const refreshData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Step 1: Fetch departments first
      const departmentsResponse = await DomainService.listDepartments();
      setDepartments(departmentsResponse.departments || []);

      // Step 2: Fetch all domains for the user
      const domainsResponse = await DomainService.listDomains(user.id);
      const domainsData = domainsResponse.domains || [];

      // Step 3: Fetch users for each domain
      const domainsWithUsers = await Promise.all(
        domainsData.map(async (domain) => {
          try {
            const usersResponse = await DomainService.listUsersByDomain(
              domain.id
            );
            return {
              ...domain,
              users: usersResponse.users || [],
            };
          } catch (err) {
            console.error(
              `Failed to fetch users for domain ${domain.id}:`,
              err
            );
            return {
              ...domain,
              users: [],
              error: `Failed to load users for this domain: ${err.message}`,
            };
          }
        })
      );

      setDomains(domainsWithUsers);
      setFilteredDomains(domainsWithUsers);

      // Initialize password visibility state for all users
      let initialVisibility = {};
      domainsWithUsers.forEach((domain) => {
        domain.users?.forEach((user) => {
          initialVisibility[user.id] = false;
        });
      });
      setPasswordVisibility(initialVisibility);

      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  // Listen for focus events to refresh data when returning from add user page
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if we're not currently loading and user exists
      if (!loading && user) {
        refreshData();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loading, user]);

  // Filter domains and users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDomains(domains);
      setSearchResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();

    // For domain-based view (not used when searching)
    const filteredDomainResults = domains
      .map((domain) => {
        // Filter users in each domain
        const filteredUsers = domain.users.filter(
          (user) =>
            user.username.toLowerCase().includes(term) ||
            (user.first_name && user.first_name.toLowerCase().includes(term)) ||
            (user.last_name && user.last_name.toLowerCase().includes(term)) ||
            (typeof user.department_id === "string" &&
              user.department_id.toLowerCase().includes(term)) ||
            getDepartmentName(user.department_id)
              .toLowerCase()
              .includes(term) ||
            (typeof user.role_id === "string" &&
              user.role_id.toLowerCase().includes(term))
        );

        // Return domain with filtered users
        return {
          ...domain,
          users: filteredUsers,
        };
      })
      .filter((domain) => domain.users.length > 0);

    setFilteredDomains(filteredDomainResults);

    // For flat search results table view (used when searching)
    const allMatchingUsers = [];
    domains.forEach((domain) => {
      const matchingUsers = domain.users.filter(
        (user) =>
          user.username.toLowerCase().includes(term) ||
          (user.first_name && user.first_name.toLowerCase().includes(term)) ||
          (user.last_name && user.last_name.toLowerCase().includes(term)) ||
          (typeof user.department_id === "string" &&
            user.department_id.toLowerCase().includes(term)) ||
          getDepartmentName(user.department_id).toLowerCase().includes(term) ||
          (typeof user.role_id === "string" &&
            user.role_id.toLowerCase().includes(term))
      );

      // Add domain information to each matching user
      matchingUsers.forEach((user) => {
        allMatchingUsers.push({
          ...user,
          domainName: domain.domain_name,
          domainId: domain.id,
        });
      });
    });

    setSearchResults(allMatchingUsers);
  }, [searchTerm, domains]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

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
    navigate(
      `/users/edit?domain_id=${domain.id}&domain_name=${encodeURIComponent(
        domain.domain_name
      )}&username=${encodeURIComponent(user.username)}`
    );
  };

  const handleAddUser = (domain) => {
    navigate(
      `/users/add?domain_id=${domain.id}&domain_name=${encodeURIComponent(
        domain.domain_name
      )}`
    );
  };

  // Sorting functions
  const handleSort = (column) => {
    let direction = "asc";
    if (sortConfig.key === column && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: column, direction });
  };

  const handleDomainSort = (domainId, column) => {
    const currentConfig = domainSortConfigs[domainId] || {
      key: null,
      direction: null,
    };
    let direction = "asc";
    if (currentConfig.key === column && currentConfig.direction === "asc") {
      direction = "desc";
    }
    setDomainSortConfigs((prev) => ({
      ...prev,
      [domainId]: { key: column, direction },
    }));
  };

  const sortData = (data, config) => {
    if (!config.key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[config.key];
      let bValue = b[config.key];

      // Handle special cases
      if (config.key === "department_id") {
        aValue = getDepartmentName(a.department_id);
        bValue = getDepartmentName(b.department_id);
      } else if (config.key === "status") {
        aValue = a.status === "devrede" ? "Active" : "Inactive";
        bValue = b.status === "devrede" ? "Active" : "Inactive";
      } else if (config.key === "domainName") {
        aValue = a.domainName || "";
        bValue = b.domainName || "";
      }

      // Convert to string and make case insensitive
      aValue = String(aValue || "").toLowerCase();
      bValue = String(bValue || "").toLowerCase();

      if (config.direction === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const renderSortableHeader = (column, label, sortConfig, onSort) => {
    const getSortIcon = () => {
      if (sortConfig.key !== column) {
        return <i className="bi bi-arrow-down-up text-xs ml-1 opacity-50"></i>;
      }
      return sortConfig.direction === "asc" ? (
        <i className="bi bi-arrow-up text-xs ml-1"></i>
      ) : (
        <i className="bi bi-arrow-down text-xs ml-1"></i>
      );
    };

    return (
      <th
        scope="col"
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
        onClick={() => onSort(column)}
      >
        <div className="flex items-center">
          {label}
          {getSortIcon()}
        </div>
      </th>
    );
  };

  // Render search results table when searching
  const renderSearchResultsTable = () => {
    const sortedSearchResults = sortData(searchResults, sortConfig);

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-odie">Search Results</h2>
          <p className="text-sm text-gray-600">
            Found {searchResults.length} users matching your search
          </p>
        </div>

        {/* Desktop table view - Hidden on mobile */}
        <div className="hidden md:block p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {renderSortableHeader(
                  "domainName",
                  "Domain",
                  sortConfig,
                  handleSort
                )}
                {renderSortableHeader(
                  "username",
                  "Username",
                  sortConfig,
                  handleSort
                )}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Password
                </th>
                {renderSortableHeader(
                  "first_name",
                  "First Name",
                  sortConfig,
                  handleSort
                )}
                {renderSortableHeader(
                  "last_name",
                  "Last Name",
                  sortConfig,
                  handleSort
                )}
                {renderSortableHeader(
                  "department_id",
                  "Department",
                  sortConfig,
                  handleSort
                )}
                {renderSortableHeader(
                  "role_id",
                  "Role",
                  sortConfig,
                  handleSort
                )}
                {renderSortableHeader(
                  "status",
                  "Status",
                  sortConfig,
                  handleSort
                )}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSearchResults.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-odie">
                    {user.domainName}
                  </td>
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
                    {user.first_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getDepartmentName(user.department_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === "devrede"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status === "devrede" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() =>
                        handleEditUser(
                          { id: user.domainId, domain_name: user.domainName },
                          user
                        )
                      }
                      className="text-odie hover:text-gray-600 flex items-center gap-2 cursor-pointer"
                    >
                      <i className="bi bi-pencil-square text-lg"></i> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card view - Only shown on mobile */}
        <div className="md:hidden">
          {searchResults.map((user) => (
            <div key={user.id} className="border-b border-gray-200 p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-medium text-odie text-lg">
                    {user.username}
                  </h3>
                  <p className="text-sm text-gray-600">{user.domainName}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.status === "devrede"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.status === "devrede" ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1 font-medium">Name:</p>
                  <p className="font-medium break-words">
                    {user.first_name || "-"} {user.last_name || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 mb-1 font-medium">Department:</p>
                  <p className="font-medium break-words">
                    {getDepartmentName(user.department_id)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 mb-1 font-medium">Role:</p>
                  <p className="font-medium break-words">{user.role_id}</p>
                </div>

                <div>
                  <p className="text-gray-500 mb-1 font-medium">Password:</p>
                  <div className="flex items-center">
                    <p className="font-medium break-words mr-2">
                      {passwordVisibility[user.id] ? user.password : "••••••••"}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePasswordVisibility(user.id);
                      }}
                      className="text-odie flex-shrink-0"
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
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() =>
                    handleEditUser(
                      { id: user.domainId, domain_name: user.domainName },
                      user
                    )
                  }
                  className="w-full text-odie hover:text-gray-600 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="bi bi-pencil-square text-lg"></i> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render domain-based view (original view)
  const renderDomainView = () => {
    return filteredDomains.map((domain) => (
      <div
        key={domain.id}
        className="bg-white rounded-lg shadow overflow-hidden m-6"
      >
        <div
          className="px-6 py-4 cursor-pointer flex justify-between items-center bg-gray-50 hover:bg-gray-100"
          onClick={() => toggleDomain(domain.id)}
        >
          <div>
            <h2 className="text-lg font-semibold text-odie">
              {domain.domain_name}
            </h2>
            <p className="text-sm text-gray-600">{domain.domain_ip}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddUser(domain);
              }}
              className="text-odie hover:text-gray-600 flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-md hover:bg-gray-200 transition-colors"
              title="Add User to this Domain"
            >
              <i className="bi bi-person-plus text-lg"></i>
              <span>Add User</span>
            </button>
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
        </div>

        {expandedDomain === domain.id && (
          <div className="p-4">
            {domain.users.length > 0 ? (
              <>
                {/* Desktop table view - Hidden on mobile */}
                <div className="hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {renderSortableHeader(
                          "username",
                          "Username",
                          domainSortConfigs[domain.id] || {
                            key: null,
                            direction: null,
                          },
                          (column) => handleDomainSort(domain.id, column)
                        )}
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Password
                        </th>
                        {renderSortableHeader(
                          "first_name",
                          "First Name",
                          domainSortConfigs[domain.id] || {
                            key: null,
                            direction: null,
                          },
                          (column) => handleDomainSort(domain.id, column)
                        )}
                        {renderSortableHeader(
                          "last_name",
                          "Last Name",
                          domainSortConfigs[domain.id] || {
                            key: null,
                            direction: null,
                          },
                          (column) => handleDomainSort(domain.id, column)
                        )}
                        {renderSortableHeader(
                          "department_id",
                          "Department",
                          domainSortConfigs[domain.id] || {
                            key: null,
                            direction: null,
                          },
                          (column) => handleDomainSort(domain.id, column)
                        )}
                        {renderSortableHeader(
                          "role_id",
                          "Role",
                          domainSortConfigs[domain.id] || {
                            key: null,
                            direction: null,
                          },
                          (column) => handleDomainSort(domain.id, column)
                        )}
                        {renderSortableHeader(
                          "status",
                          "Status",
                          domainSortConfigs[domain.id] || {
                            key: null,
                            direction: null,
                          },
                          (column) => handleDomainSort(domain.id, column)
                        )}
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortData(
                        domain.users,
                        domainSortConfigs[domain.id] || {
                          key: null,
                          direction: null,
                        }
                      ).map((user) => (
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
                            {user.first_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getDepartmentName(user.department_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.role_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.status === "devrede"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.status === "devrede"
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
                </div>

                {/* Mobile card view - Only shown on mobile */}
                <div className="md:hidden">
                  {domain.users.map((user) => (
                    <div
                      key={user.id}
                      className="border-b border-gray-200 p-4 first:border-t"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-odie text-lg">
                          {user.username}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === "devrede"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.status === "devrede" ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1 font-medium">
                            Name:
                          </p>
                          <p className="font-medium break-words">
                            {user.first_name || "-"} {user.last_name || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500 mb-1 font-medium">
                            Department:
                          </p>
                          <p className="font-medium break-words">
                            {getDepartmentName(user.department_id)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500 mb-1 font-medium">
                            Role:
                          </p>
                          <p className="font-medium break-words">
                            {user.role_id}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500 mb-1 font-medium">
                            Password:
                          </p>
                          <div className="flex items-center">
                            <p className="font-medium break-words mr-2">
                              {passwordVisibility[user.id]
                                ? user.password
                                : "••••••••"}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePasswordVisibility(user.id);
                              }}
                              className="text-odie flex-shrink-0"
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
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleEditUser(domain, user)}
                          className="w-full text-odie hover:text-gray-600 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <i className="bi bi-pencil-square text-lg"></i> Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center py-4 text-gray-500">
                No users found for this domain.
              </p>
            )}
          </div>
        )}
      </div>
    ));
  };

  // Show error message if present
  if (error) {
    return (
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
          Users
        </div>
        <div className="m-6 bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="h-[72px] border-b border-gray-300 w-full p-6 md:pl-6 font-bold text-[24px] text-odie flex items-center justify-center md:justify-between">
        <p className="hidden md:block">Users</p>
        <div className="flex items-center w-full md:w-auto">
          <div className="flex items-center justify-between px-3 w-full md:w-[300px] py-2 bg-white rounded-md border border-gray-300">
            <input
              type="text"
              placeholder="Search by username"
              className="bg-transparent text-[16px] font-normal w-[90%] text-gray-800 outline-none"
              value={searchTerm}
              onChange={handleSearch}
            />
            <i className="bi bi-search text-[16px]"></i>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="m-6 flex justify-center">
          <p className="text-gray-600">Loading users...</p>
        </div>
      ) : !user ? (
        <div className="m-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-yellow-700">
          <p>Please log in to view users.</p>
        </div>
      ) : searchTerm.trim() !== "" ? (
        // Show search results table when searching
        searchResults.length > 0 ? (
          renderSearchResultsTable()
        ) : (
          <p className="text-center py-4 text-gray-500">
            No users found matching your search.
          </p>
        )
      ) : (
        // Show original domain-based view when not searching
        renderDomainView()
      )}
    </div>
  );
}

export default UsersPage;
