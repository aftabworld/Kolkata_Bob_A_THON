import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const EditClaim = () => {
  const navigate = useNavigate();
  const { claimId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    claim_type: 'HOSPITALIZATION',
    claim_amount: '',
    hospital_name: '',
    hospital_address: '',
    admission_date: '',
    discharge_date: '',
    diagnosis: '',
    treatment_details: '',
    doctor_name: '',
    doctor_registration_no: ''
  });

  const claimTypes = [
    { value: 'HOSPITALIZATION', label: 'Hospitalization' },
    { value: 'OUTPATIENT', label: 'Outpatient' },
    { value: 'PHARMACY', label: 'Pharmacy' },
    { value: 'DIAGNOSTIC', label: 'Diagnostic Tests' },
    { value: 'DENTAL', label: 'Dental' },
    { value: 'MATERNITY', label: 'Maternity' },
    { value: 'EMERGENCY', label: 'Emergency' }
  ];

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
      
      const claim = response.data.data;
      setFormData({
        claim_type: claim.claim_type || 'HOSPITALIZATION',
        claim_amount: claim.claim_amount || '',
        hospital_name: claim.hospital_name || '',
        hospital_address: claim.hospital_address || '',
        admission_date: claim.admission_date ? claim.admission_date.split('T')[0] : '',
        discharge_date: claim.discharge_date ? claim.discharge_date.split('T')[0] : '',
        diagnosis: claim.diagnosis || '',
        treatment_details: claim.treatment_details || '',
        doctor_name: claim.doctor_name || '',
        doctor_registration_no: claim.doctor_registration_no || ''
      });
    } catch (err) {
      console.error('Fetch claim error:', err);
      setError('Failed to load claim details');
      toast.error('Failed to load claim details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.claim_amount || parseFloat(formData.claim_amount) <= 0) {
      setError('Please enter a valid claim amount');
      return false;
    }
    if (!formData.hospital_name) {
      setError('Please enter hospital name');
      return false;
    }
    if (!formData.admission_date) {
      setError('Please enter admission date');
      return false;
    }
    if (!formData.diagnosis) {
      setError('Please enter diagnosis');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/claims/${claimId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Claim updated successfully!');
        navigate(`/claims/${claimId}`);
      }
    } catch (err) {
      console.error('Update claim error:', err);
      setError(err.response?.data?.message || 'Failed to update claim');
      toast.error('Failed to update claim');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/claims/${claimId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Changes saved successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/claims/${claimId}`)}
        sx={{ mb: 2 }}
      >
        Back to Claim Details
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Edit Claim
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Update the claim details below
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Claim Type */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                required
                label="Claim Type"
                name="claim_type"
                value={formData.claim_type}
                onChange={handleChange}
                disabled={saving}
              >
                {claimTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Claim Amount */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Claim Amount"
                name="claim_amount"
                value={formData.claim_amount}
                onChange={handleChange}
                disabled={saving}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>

            {/* Hospital Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Hospital/Clinic Name"
                name="hospital_name"
                value={formData.hospital_name}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>

            {/* Hospital Address */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hospital Address"
                name="hospital_address"
                value={formData.hospital_address}
                onChange={handleChange}
                disabled={saving}
                multiline
                rows={2}
              />
            </Grid>

            {/* Admission Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Admission Date"
                name="admission_date"
                value={formData.admission_date}
                onChange={handleChange}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Discharge Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Discharge Date"
                name="discharge_date"
                value={formData.discharge_date}
                onChange={handleChange}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Diagnosis */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                disabled={saving}
                multiline
                rows={2}
                helperText="Brief description of the medical condition"
              />
            </Grid>

            {/* Treatment Details */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Treatment Details"
                name="treatment_details"
                value={formData.treatment_details}
                onChange={handleChange}
                disabled={saving}
                multiline
                rows={3}
                helperText="Description of treatment received"
              />
            </Grid>

            {/* Doctor Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Doctor Name"
                name="doctor_name"
                value={formData.doctor_name}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>

            {/* Doctor Registration No */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Doctor Registration No."
                name="doctor_registration_no"
                value={formData.doctor_registration_no}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/claims/${claimId}`)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleSaveDraft}
                  disabled={saving}
                >
                  Save Changes
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Update & Submit'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditClaim;

// Made with Bob