import React from "react";
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
const App = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/add-blog" element={<AddBlogDetails />} />
        <Route path="/blogs/:id" element={<BlogsDetails />} />
          <Route path="/tech-byte" element={<TechByte />} />
      </Routes>
      <ContactMeButton/>
      <Footer/>
    </div>
  );
};

export default App;
