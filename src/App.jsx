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
import { ToastContainer } from "react-toastify";
import Loader from "./components/Loader";
import ResetPasswordPage from "./pages/ResetPasswordPage";
const App = () => {
  const [isLoading, setIsLoading] = useState(false); // Loading state in parent

  return (
    <div className="h-screen overflow-y-scroll relative">
      <Header setLoading={setIsLoading} /> {/* Pass loading setter to Header */}

      {/* Show loader on top of all content when loading */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <Loader />
        </div>
      )}

    <ToastContainer
  position="top-right"
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop={false}
  closeOnClick
  pauseOnFocusLoss
  draggable
  pauseOnHover
  theme="colored"
  toastClassName="custom-toast" // you can customize toast styling here if needed
/>

      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/add-blog" element={<AddBlogDetails />} />
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
