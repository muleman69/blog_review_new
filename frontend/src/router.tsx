import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BlogPostEditor from './components/editor/BlogPostEditor';

const Router: React.FC = () => {
  return (
    <BrowserRouter basename="/blog_review_new">
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/editor" replace />} />
          <Route path="login" element={<LoginForm />} />
          <Route path="register" element={<RegisterForm />} />
          <Route
            path="editor"
            element={
              <ProtectedRoute>
                <BlogPostEditor />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router; 