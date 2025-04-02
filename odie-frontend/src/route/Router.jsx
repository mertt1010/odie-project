import ExamplePageOne from "../pages/example-page-one/ExamplePageOne";
import ExamplePageTwo from "../pages/example-page-two/ExamplePageTwo";
import HomePage from "../pages/home-page/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";

export const RouterList = [
  { path: "/", element: <HomePage /> },
  { path: "/example-page-one", element: <ExamplePageOne /> },
  { path: "/example-page-two", element: <ExamplePageTwo /> },
];

export const AuthRoutes = [
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
];
