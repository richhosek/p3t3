// src/routes/RedirectIfAuthenticated.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
const RedirectIfAuthenticated = () => {
    const token = localStorage.getItem("id_token");
    return token ? <Navigate to="/dashboard" replace/> : <LandingPage />;
};
export default RedirectIfAuthenticated;
