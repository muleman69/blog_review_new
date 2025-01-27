import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from './App';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BlogPostEditor from './components/editor/BlogPostEditor';
import ErrorBoundary from './components/common/ErrorBoundary';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorBoundary><div>Route Error</div></ErrorBoundary>,
    children: [
      {
        index: true,
        element: <Navigate to="/editor" replace />,
      },
      {
        path: 'login',
        element: <LoginForm />,
      },
      {
        path: 'register',
        element: <RegisterForm />,
      },
      {
        path: 'editor',
        element: (
          <ProtectedRoute>
            <BlogPostEditor />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

const Router: React.FC = () => {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
};

export default Router; 