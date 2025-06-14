import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DomainService from "../../services/DomainService";

function DepartmentsPage() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [filteredDomains, setFilteredDomains] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const { user } = useAuth();

  // Function to fetch all data
  const refreshData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Step 1: Fetch all domains for the user
      const domainsResponse = await DomainService.listDomains(user.id);
      const domainsData = domainsResponse.domains || [];

      // Step 2: Fetch departments for each domain
      const domainsWithDepartments = await Promise.all(
        domainsData.map(async (domain) => {
          try {
            const departmentsResponse =
              await DomainService.listDepartmentsByDomain(domain.id, user.id);
            return {
              ...domain,
              departments: departmentsResponse.departments || [],
            };
          } catch (err) {
            console.error(
              `Failed to fetch departments for domain ${domain.id}:`,
              err
            );
            return {
              ...domain,
              departments: [],
              error: `Failed to load departments for this domain: ${err.message}`,
            };
          }
        })
      );

      setDomains(domainsWithDepartments);
      setFilteredDomains(domainsWithDepartments);

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

  // Listen for focus events to refresh data when returning from add/edit department page
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

  // Filter domains and departments based on search term
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
        // Filter departments in each domain
        const filteredDepartments = domain.departments.filter((department) =>
          department.name.toLowerCase().includes(term)
        );

        // Return domain with filtered departments
        return {
          ...domain,
          departments: filteredDepartments,
        };
      })
      .filter((domain) => domain.departments.length > 0);

    setFilteredDomains(filteredDomainResults);

    // For flat search results table view (used when searching)
    const allMatchingDepartments = [];
    domains.forEach((domain) => {
      const matchingDepartments = domain.departments.filter((department) =>
        department.name.toLowerCase().includes(term)
      );

      // Add domain information to each matching department
      matchingDepartments.forEach((department) => {
        allMatchingDepartments.push({
          ...department,
          domainName: domain.domain_name,
          domainId: domain.id,
        });
      });
    });

    setSearchResults(allMatchingDepartments);
  }, [searchTerm, domains]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleDomain = (domainId) => {
    if (expandedDomain === domainId) {
      setExpandedDomain(null);
    } else {
      setExpandedDomain(domainId);
    }
  };

  const handleEditDepartment = (domain, department) => {
    navigate(`/departments/edit/${domain.id}/${department.id}`, {
      state: {
        domain: domain,
        department: department,
      },
    });
  };

  const handleAddDepartment = (domain) => {
    navigate(`/departments/add`, {
      state: { domain: domain },
    });
  };

  const renderSearchResultsTable = () => {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-odie">Search Results</h2>
          <p className="text-sm text-gray-600">
            Found {searchResults.length} departments matching your search
          </p>
        </div>

        {/* Desktop table view - Hidden on mobile */}
        <div className="hidden md:block p-4">
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
                  Department Name
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
              {searchResults.map((department) => (
                <tr key={`${department.domainId}-${department.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-odie">
                    {department.domainName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-odie">
                    {department.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() =>
                        handleEditDepartment(
                          {
                            id: department.domainId,
                            domain_name: department.domainName,
                          },
                          department
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
          {searchResults.map((department) => (
            <div
              key={`${department.domainId}-${department.id}`}
              className="border-b border-gray-200 p-4"
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-medium text-odie text-lg">
                    {department.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {department.domainName}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() =>
                    handleEditDepartment(
                      {
                        id: department.domainId,
                        domain_name: department.domainName,
                      },
                      department
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
                handleAddDepartment(domain);
              }}
              className="text-odie hover:text-gray-600 flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-md hover:bg-gray-200 transition-colors"
              title="Add Department to this Domain"
            >
              <i className="bi bi-building-add text-lg"></i>
              <span>Add Department</span>
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
            {domain.departments.length > 0 ? (
              <>
                {/* Desktop table view - Hidden on mobile */}
                <div className="hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Department Name
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
                      {domain.departments.map((department) => (
                        <tr key={department.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-odie">
                            {department.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() =>
                                handleEditDepartment(domain, department)
                              }
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
                  {domain.departments.map((department) => (
                    <div
                      key={department.id}
                      className="border-b border-gray-200 p-4 first:border-t"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-odie text-lg">
                          {department.name}
                        </h3>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() =>
                            handleEditDepartment(domain, department)
                          }
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
                No departments found for this domain.
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
        <div className="md:flex-row flex-col h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
          Departments
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
        <p className="hidden md:block">Departments</p>
        <div className="flex items-center w-full md:w-auto">
          <div className="flex items-center justify-between px-3 w-full md:w-[300px] py-2 bg-white rounded-md border border-gray-300">
            <input
              type="text"
              placeholder="Search departments..."
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
          <p className="text-gray-600">Loading departments...</p>
        </div>
      ) : !user ? (
        <div className="m-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-yellow-700">
          <p>Please log in to view departments.</p>
        </div>
      ) : searchTerm.trim() !== "" ? (
        // Show search results table when searching
        searchResults.length > 0 ? (
          <div className="m-6">{renderSearchResultsTable()}</div>
        ) : (
          <div className="m-6">
            <p className="text-center py-4 text-gray-500">
              No departments found matching your search.
            </p>
          </div>
        )
      ) : (
        // Show original domain-based view when not searching
        renderDomainView()
      )}
    </div>
  );
}

export default DepartmentsPage;
