import DomainsPage from "../pages/domains/DomainsPage";
import AddDomainPage from "../pages/domains/AddDomainPage";
import EditDomainPage from "../pages/domains/EditDomainPage";
import UsersPage from "../pages/users/UsersPage";
import AddUserPage from "../pages/users/AddUserPage";
import EditUserPage from "../pages/users/EditUserPage";
import DepartmentsPage from "../pages/departments/DepartmentsPage";
import AddDepartmentPage from "../pages/departments/AddDepartmentPage";
import EditDepartmentPage from "../pages/departments/EditDepartmentPage";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import LandingPage from "../pages/LandingPage";

export const RouterList = [
  { path: "/domains", element: <DomainsPage /> },
  { path: "/domains/add", element: <AddDomainPage /> },
  { path: "/domains/edit/:domainId", element: <EditDomainPage /> },
  { path: "/users", element: <UsersPage /> },
  { path: "/users/add", element: <AddUserPage /> },
  { path: "/users/edit", element: <EditUserPage /> },
  { path: "/departments", element: <DepartmentsPage /> },
  { path: "/departments/add", element: <AddDepartmentPage /> },
  {
    path: "/departments/edit/:domainId/:departmentId",
    element: <EditDepartmentPage />,
  },
];

export const AuthRoutes = [
  { path: "/", element: <LandingPage /> },
  { path: "/landing", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
];
