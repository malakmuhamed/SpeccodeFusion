import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import Navbar from "./components/Navbar/Navbar";
import Home from "./pages/Home";
import UploadSrs from "./pages/upload_srs";
import UploadSourceCode from "./pages/upload_code";
import SignUp from "./pages/SignUp";
import Login from "./pages/login";
import ResetPassword from "./pages/ResetPassword";
import ReportDetail from "./pages/ReportDetail";
import Extractedreq from "./pages/extractedreq";
import UserProfile from "./pages/UserProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminPerformance from "./pages/AdminPerformance";
import AdminSettings from "./pages/AdminSettings";

 // Fixed casing

function App() {
  return (
    <Router>
      <main className="overflow-x-hidden bg-white">
        <Routes>
          {/* Public Routes with Navbar */}
          <Route 
            path="/" 
            element={
              <>
                <Navbar />
                <Home />
              </>
            } 
          />
          <Route 
            path="/upload-srs" 
            element={
              <>
                <Navbar />
                <UploadSrs />
              </>
            } 
          />
          <Route 
            path="/Extractedreq" 
            element={
              <>
                <Navbar />
                <Extractedreq />
              </>
            } 
          />
          <Route 
            path="/upload-code" 
            element={
              <>
                <Navbar />
                <UploadSourceCode />
              </>
            } 
          />

          {/* Auth Pages (No Navbar) */}
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/ResetPassword" element={<ResetPassword />} />
          <Route path="/ReportDetail" element={<ReportDetail />} />
          <Route path="/UserProfile" element={<UserProfile />} />
          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/AdminUsers" element={<AdminUsers />} />
          <Route path="/AdminPerformance" element={<AdminPerformance />} />
           <Route path="/AdminSettings" element={<AdminSettings />}/>

        </Routes>
      </main>
    </Router>
  );
}

export default App;
