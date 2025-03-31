import ExamplePageOne from "../pages/example-page-one/ExamplePageOne";
import ExamplePageTwo from "../pages/example-page-two/ExamplePageTwo";
import HomePage from "../pages/home-page/HomePage";

export const RouterList = [
  { path: "/", element: <HomePage /> },
  { path: "/example-page-one", element: <ExamplePageOne /> },
  { path: "/example-page-two", element: <ExamplePageTwo /> },
];
