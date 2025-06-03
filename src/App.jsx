import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Portfolio from "./pages/Portfolio";
import BlogPage from "./pages/BlogPage";
import AIChat from "./pages/AIChat";
import AddBlogDetails from "./pages/AddBlogDetails";
import BlogsDetails from "./pages/BlogsDetails";
import Footer from "./components/Footer";
import TechByte from "./pages/TechByte";
import ContactMeButton from "./components/ContactMeButton";
import Loader from "./components/Loader";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="h-screen overflow-y-scroll relative">
      <Header setLoading={setIsLoading} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <Loader />
        </div>
      )}

      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route
          path="/add-blog"
          element={
            <ProtectedAdminRoute>
              <AddBlogDetails />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/blogs/:id" element={<BlogsDetails />} />
        <Route path="/tech-byte" element={<TechByte />} />
        <Route path="/reset-password/:id" element={<ResetPasswordPage />} />
      </Routes>

      <ContactMeButton />
      <Footer />
    </div>
  );
};

export default App;
