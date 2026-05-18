import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon
} from '@mui/icons-material';

const ViewClaim = () => {
  const navigate = useNavigate();
  const { claimId } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClaimDetails();
  }, [claimId]);

  const fetchClaimDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/claims/${claimId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setClaim(response.data.data);
    } catch (err) {
      console.error('Fetch claim error:', err);
      setError('Failed to load claim details');
      toast.error('Failed to load claim details');
    } finally {
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

  const handleEdit = () => {
    navigate(`/claims/${claimId}/edit`);
  };

  const handleDelete = async () => {
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
        navigate('/dashboard');
      } catch (err) {
        toast.error('Failed to delete claim');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/claims/${claimId}/submit`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Claim submitted successfully');
      fetchClaimDetails();
    } catch (err) {
      toast.error('Failed to submit claim');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !claim) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Claim not found'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Claim Details
            </Typography>
            <Typography variant="h6" color="textSecondary">
              {claim.claim_number}
            </Typography>
          </Box>
          <Chip
            label={claim.status.replace('_', ' ')}
            color={getStatusColor(claim.status)}
            size="large"
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Claim Information */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Claim Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">Claim Type</Typography>
                  <Typography variant="body1" gutterBottom>{claim.claim_type}</Typography>

                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Claim Amount</Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    ₹ {parseFloat(claim.claim_amount).toLocaleString('en-IN')}
                  </Typography>

                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Submitted Date</Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(claim.created_at).toLocaleDateString('en-IN')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hospital Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">Hospital Name</Typography>
                  <Typography variant="body1" gutterBottom>{claim.hospital_name}</Typography>

                  {claim.hospital_address && (
                    <>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Address</Typography>
                      <Typography variant="body1" gutterBottom>{claim.hospital_address}</Typography>
                    </>
                  )}

                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Admission Date</Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(claim.admission_date).toLocaleDateString('en-IN')}
                  </Typography>

                  {claim.discharge_date && (
                    <>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Discharge Date</Typography>
                      <Typography variant="body1" gutterBottom>
                        {new Date(claim.discharge_date).toLocaleDateString('en-IN')}
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Medical Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">Diagnosis</Typography>
                  <Typography variant="body1" paragraph>{claim.diagnosis}</Typography>

                  {claim.treatment_details && (
                    <>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Treatment Details</Typography>
                      <Typography variant="body1" paragraph>{claim.treatment_details}</Typography>
                    </>
                  )}

                  {claim.doctor_name && (
                    <>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Doctor Name</Typography>
                      <Typography variant="body1">{claim.doctor_name}</Typography>
                    </>
                  )}

                  {claim.doctor_registration_no && (
                    <>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Doctor Registration No.</Typography>
                      <Typography variant="body1">{claim.doctor_registration_no}</Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {claim.status === 'DRAFT' && (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleSubmit}
              >
                Submit Claim
              </Button>
            </>
          )}
          {claim.status === 'REJECTED' && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit & Resubmit
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default ViewClaim;

// Made with Bob