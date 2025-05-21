import React from "react";
import { RouterList, AuthRoutes } from "./route/Router";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import Layout from "./layout/Layout";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/protected-route/ProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth routes (public) */}
          {AuthRoutes.map((route, index) => (
            <Route
              key={`auth-${index}`}
              path={route.path}
              element={route.element}
            />
          ))}

          {/* Protected routes (require authentication) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {RouterList.map((item, index) => (
                <Route path={item.path} key={index} element={item.element} />
              ))}
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
