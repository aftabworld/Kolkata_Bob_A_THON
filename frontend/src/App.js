import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import CustomerDashboard from './components/Dashboard/CustomerDashboard';
import NewClaim from './components/Claims/NewClaim';
import ViewClaim from './components/Claims/ViewClaim';
import EditClaim from './components/Claims/EditClaim';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/claims/new" element={<NewClaim />} />
          <Route path="/claims/:claimId" element={<ViewClaim />} />
          <Route path="/claims/:claimId/edit" element={<EditClaim />} />
          <Route path="/auditor/dashboard" element={<CustomerDashboard />} />
          <Route path="/cashier/dashboard" element={<CustomerDashboard />} />
          <Route path="/admin/dashboard" element={<CustomerDashboard />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ThemeProvider>
  );
}

export default App;

// Made with Bob
