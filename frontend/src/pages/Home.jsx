import { useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import InputSection from '../components/InputSection';
import ElementsCard from '../components/ElementsCard';
import ScenesCard from '../components/ScenesCard';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = 'http://localhost:3000';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
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

    try {
      const response = await fetch(`${API_URL}/vision`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process vision');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: { xs: 2, md: 4 },
        px: { xs: 2, md: 4 }
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: { xs: '100%', lg: '1600px' } }}>
        <Box sx={{ 
          textAlign: 'center', 
          color: 'white', 
          mb: { xs: 3, md: 5 },
          py: { xs: 2, md: 3 }
        }}>
          <Typography 
            variant="h2" 
            component="h1" 
            fontWeight="bold" 
            gutterBottom
            sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}
          >
            ✨ Livya
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
        </Box>

        <InputSection onSubmit={handleSubmit} loading={loading} />

        {loading && <LoadingSpinner />}

        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {results && (
          <Box>
            <ElementsCard elements={results.elements} />
            <ScenesCard scenes={results.scenes} />
          </Box>
        )}
      </Container>
    </Box>
  );
}
