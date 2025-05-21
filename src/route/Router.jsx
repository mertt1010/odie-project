import DomainsPage from "../pages/domains/DomainsPage";
import UsersPage from "../pages/users/UsersPage";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";

export const RouterList = [
  { path: "/", element: <DomainsPage /> },
  { path: "/domains", element: <DomainsPage /> },
  { path: "/users", element: <UsersPage /> },
];

export const AuthRoutes = [
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
];
