import DomainsPage from "../pages/domains/DomainsPage";
import AddDomainPage from "../pages/domains/AddDomainPage";
import EditDomainPage from "../pages/domains/EditDomainPage";
import UsersPage from "../pages/users/UsersPage";
import AddUserPage from "../pages/users/AddUserPage";
import EditUserPage from "../pages/users/EditUserPage";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";

export const RouterList = [
  { path: "/", element: <DomainsPage /> },
  { path: "/domains", element: <DomainsPage /> },
  { path: "/domains/add", element: <AddDomainPage /> },
  { path: "/domains/edit/:domainId", element: <EditDomainPage /> },
  { path: "/users", element: <UsersPage /> },
  { path: "/users/add", element: <AddUserPage /> },
  { path: "/users/edit", element: <EditUserPage /> },
];

export const AuthRoutes = [
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
];
