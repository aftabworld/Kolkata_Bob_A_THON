import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch claims
      const claimsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/claims`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Fetch statistics
      const statsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/claims/stats/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setClaims(claimsResponse.data.data.claims);
      setStats(statsResponse.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      SUBMITTED: 'info',
      UNDER_REVIEW: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      RESUBMITTED: 'info',
      PAYMENT_PROCESSING: 'warning',
      PAYMENT_DONE: 'success',
      CLOSED: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'PAYMENT_DONE':
      case 'CLOSED':
        return <CheckCircleIcon />;
      case 'REJECTED':
        return <CancelIcon />;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'RESUBMITTED':
        return <PendingIcon />;
      default:
        return <AssessmentIcon />;
    }
  };

  const handleCreateClaim = () => {
    navigate('/claims/new');
  };

  const handleViewClaim = (claimId) => {
    navigate(`/claims/${claimId}`);
  };

  const handleEditClaim = (claimId) => {
    navigate(`/claims/${claimId}/edit`);
  };

  const handleDeleteClaim = async (claimId) => {
    if (window.confirm('Are you sure you want to delete this claim?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/claims/${claimId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        toast.success('Claim deleted successfully');
        fetchDashboardData();
      } catch (error) {
        toast.error('Failed to delete claim');
      }
    }
  };

  const calculateStatsFromData = () => {
    const statusCounts = claims.reduce((acc, claim) => {
      acc[claim.status] = (acc[claim.status] || 0) + 1;
      return acc;
    }, {});

    const totalAmount = claims.reduce((sum, claim) => sum + parseFloat(claim.claim_amount || 0), 0);
    const approvedAmount = claims
      .filter(c => ['APPROVED', 'PAYMENT_DONE', 'CLOSED'].includes(c.status))
      .reduce((sum, claim) => sum + parseFloat(claim.claim_amount || 0), 0);

    return {
      total: claims.length,
      draft: statusCounts.DRAFT || 0,
      submitted: statusCounts.SUBMITTED || 0,
      underReview: statusCounts.UNDER_REVIEW || 0,
      approved: statusCounts.APPROVED || 0,
      rejected: statusCounts.REJECTED || 0,
      totalAmount,
      approvedAmount
    };
  };

  const dashboardStats = calculateStatsFromData();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Claims Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateClaim}
        >
          New Claim
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Claims
              </Typography>
              <Typography variant="h4">{dashboardStats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Review
              </Typography>
              <Typography variant="h4" color="warning.main">
                {dashboardStats.submitted + dashboardStats.underReview}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4" color="success.main">
                {dashboardStats.approved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rejected
              </Typography>
              <Typography variant="h4" color="error.main">
                {dashboardStats.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Amount Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Claimed Amount
              </Typography>
              <Typography variant="h5">
                ₹ {dashboardStats.totalAmount.toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved Amount
              </Typography>
              <Typography variant="h5" color="success.main">
                ₹ {dashboardStats.approvedAmount.toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Claims Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Claims
        </Typography>
        
        {claims.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No claims found. Click "New Claim" to create your first claim.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Claim Number</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.claim_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {claim.claim_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(claim.created_at).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>{claim.claim_type}</TableCell>
                    <TableCell align="right">
                      ₹ {parseFloat(claim.claim_amount).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(claim.status)}
                        label={claim.status.replace('_', ' ')}
                        color={getStatusColor(claim.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewClaim(claim.claim_id)}
                        title="View Details"
                      >
                        <ViewIcon />
                      </IconButton>
                      {['DRAFT', 'REJECTED'].includes(claim.status) && (
                        <>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleEditClaim(claim.claim_id)}
                            title="Edit Claim"
                          >
                            <EditIcon />
                          </IconButton>
                          {claim.status === 'DRAFT' && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClaim(claim.claim_id)}
                              title="Delete Claim"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Need Help?
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Check our FAQ or contact support for assistance with your claims.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary">
                View FAQ
              </Button>
              <Button size="small" color="primary">
                Contact Support
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Policy Information
              </Typography>
              <Typography variant="body2" color="textSecondary">
                View your insurance policy details and coverage information.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary" onClick={() => navigate('/policies')}>
                View Policies
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Documents
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Manage and upload required documents for your claims.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary" onClick={() => navigate('/documents')}>
                Manage Documents
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CustomerDashboard;

// Made with Bob
