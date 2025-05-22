import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import DomainService from "../../services/DomainService";

function UsersPage() {
  const [domains, setDomains] = useState([]);
  const [filteredDomains, setFilteredDomains] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [departments, setDepartments] = useState([]);
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

  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
  }, [user]);

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
    console.log("Edit user:", user, "in domain:", domain);
    // Implement edit functionality here
  };

  // Render search results table when searching
  const renderSearchResultsTable = () => {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-odie">Search Results</h2>
          <p className="text-sm text-gray-600">
            Found {searchResults.length} users matching your search
          </p>
        </div>
        <div className="p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Domain
                </th>
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
              {searchResults.map((user) => (
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
                          { id: user.domainId, name: user.domainName },
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
                          onClick={() => handleEditUser(domain, user)}
                          className="text-odie hover:text-gray-600 flex items-center gap-2 cursor-pointer"
                        >
                          <i className="bi bi-pencil-square text-lg"></i> Edit
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
      <div className="h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center justify-between">
        Users
        <div className="flex items-center">
          <button className="bg-transparent text-[16px] font-medium text-odie rounded-md mr-6 hover:text-gray-600 cursor-pointer">
            <i className="bi bi-plus-lg"></i> Add User
          </button>
          <div className="flex items-center justify-between mr-6 px-3 w-[300px] py-2 bg-white rounded-md border border-gray-300">
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
