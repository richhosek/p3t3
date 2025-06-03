// src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
const ProtectedRoute = ({ component }) => {
    const token = localStorage.getItem("id_token");
    return token ? component : <Navigate to="/" replace/>;
};
export default ProtectedRoute;
