import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'CUSTOMER'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        {
          email: formData.email,
          password: formData.password
        }
      );

      if (response.data.success) {
        // Store token and user info
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        toast.success('Login successful!');
        
        // Redirect based on role
        const userRole = response.data.data.user.role;
        switch (userRole) {
          case 'CUSTOMER':
            navigate('/dashboard');
            break;
          case 'AUDITOR':
            navigate('/auditor/dashboard');
            break;
          case 'CASHIER':
            navigate('/cashier/dashboard');
            break;
          case 'ADMIN':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo login function
  const handleDemoLogin = (role) => {
    const demoUser = {
      user_id: 1,
      email: `${role.toLowerCase()}@demo.com`,
      role: role,
      full_name: `Demo ${role}`
    };
    
    localStorage.setItem('token', 'demo-token-' + role);
    localStorage.setItem('user', JSON.stringify(demoUser));
    
    toast.success(`Logged in as Demo ${role}`);
    
    switch (role) {
      case 'CUSTOMER':
        navigate('/dashboard');
        break;
      case 'AUDITOR':
        navigate('/auditor/dashboard');
        break;
      case 'CASHIER':
        navigate('/cashier/dashboard');
        break;
      case 'ADMIN':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Medical Claim System
          </Typography>
          <Typography component="h2" variant="h6" align="center" color="textSecondary" gutterBottom>
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Role"
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="CUSTOMER">Customer</MenuItem>
                <MenuItem value="AUDITOR">Auditor</MenuItem>
                <MenuItem value="CASHIER">Cashier</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/register')}
                type="button"
              >
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>

          {/* Demo Login Section */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" align="center" color="textSecondary" gutterBottom>
              Quick Demo Access
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleDemoLogin('CUSTOMER')}
                fullWidth
              >
                Demo Customer Login
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleDemoLogin('AUDITOR')}
                fullWidth
              >
                Demo Auditor Login
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleDemoLogin('CASHIER')}
                fullWidth
              >
                Demo Cashier Login
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleDemoLogin('ADMIN')}
                fullWidth
              >
                Demo Admin Login
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;

// Made with Bob