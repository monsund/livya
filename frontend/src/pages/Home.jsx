import { useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { mockData } from '../mockData/mockData';
import InputSection from '../components/InputSection';
import ElementsCard from '../components/ElementsCard';
import ScenesCard from '../components/ScenesCard';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL;


export default function Home() {
  const [loading, setLoading] = useState(false);
  // Initialize with mockData if not empty, else null
  const [results, setResults] = useState(
    mockData && Object.keys(mockData).length > 0 ? mockData : null
  );
  const [error, setError] = useState(null);

  const handleSubmit = async (formData, activeTab) => {
    // Validation
    const vision = formData.get('vision');
    const image = formData.get('image');

    if (activeTab === 0 && !vision) {
      setError('Please enter your vision text');
      return;
    }
    if (activeTab === 1 && !image) {
      setError('Please select an image');
      return;
    }
    if (activeTab === 2 && !vision && !image) {
      setError('Please provide either text or an image');
      return;
    }


    setError(null);
    setResults(null);
    setLoading(true);


    // --- main API logic below ---



    try {
      let url = '';
      let options = {};

      url = `${API_URL}/vision`;
      if (activeTab === 0) {
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vision }),
        };
      } else {
        options = {
          method: 'POST',
          body: formData,
        };
      }

      let data = null;
      let apiFailed = false;
      try {
        const response = await fetch(url, options);
        const text = await response.text();
        if (!response.ok || !text) {
          apiFailed = true;
        } else {
          data = JSON.parse(text);
        }
      } catch (err) {
        apiFailed = true;
        console.log("API call failed:", err);
      }

      if (apiFailed || !data || Object.keys(data).length === 0) {
        setResults(mockData);
      } else {
        setResults(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" align="center" gutterBottom>
          Livya Vision
        </Typography>
        <Typography 
          variant="h5" 
          sx={{ 
            opacity: 0.9,
            fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }
          }}
        >
          Transform your vision into visual scenes
        </Typography>
        <Box sx={{ mt: 4 }}>
          <InputSection onSubmit={handleSubmit} loading={loading} />
        </Box>
        {loading && <LoadingSpinner />}
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
        {results && (
          <Box sx={{ mt: 4 }}>
            <ElementsCard elements={results.elements} />
            <ScenesCard scenes={results.scenes} images={results.images} />
          </Box>
        )}
      </Container>
    </Box>
  );
}
