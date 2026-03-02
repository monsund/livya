import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, CircularProgress } from '@mui/material';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import { mockData } from '../mockData/mockData';
import InputSection from '../components/InputSection';
import ElementsCard from '../components/ElementsCard';
import ScenesCard from '../components/ScenesCard';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'https://livya.onrender.com';


export default function Home() {
  const [loading, setLoading] = useState(false);
  // Initialize with mockData if not empty, else null
  const [results, setResults] = useState(
    mockData && Object.keys(mockData).length > 0 ? mockData : null
  );
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(results?.elements?.theme || '');
  // Seed videoState from mockData.videos if present
  const initVideoState = () => {
    if (!mockData?.videos) return {};
    return Object.fromEntries(
      mockData.videos.map(v => [v.scene_id, { status: 'SUCCEEDED', videoUrl: v.videoUrl, error: null }])
    );
  };  const [elements, setElements] = useState(results?.elements || {});
  const [originalElements, setOriginalElements] = useState(results?.elements || {});
  const [originalTheme, setOriginalTheme] = useState(results?.elements?.theme || '');
  const [scenes, setScenes] = useState(results?.scenes || []);
  const [originalScenes, setOriginalScenes] = useState(results?.scenes || []);
  const [regeneratingIds, setRegeneratingIds] = useState([]);
  const [regeneratingScenes, setRegeneratingScenes] = useState(false);
  // video state: { [scene_id]: { taskId, status, videoUrl, error } }
  const [videoState, setVideoState] = useState(initVideoState);
  const [stitchState, setStitchState] = useState({ loading: false, videoUrl: null, error: null });

  const handleStitchVideos = async () => {
    // Collect all scenes that have a completed video, sorted by scene_id
    const videos = Object.entries(videoState)
      .filter(([, v]) => v.status === 'SUCCEEDED' && v.videoUrl)
      .map(([sceneId, v]) => ({ scene_id: Number(sceneId), videoUrl: v.videoUrl }))
      .sort((a, b) => a.scene_id - b.scene_id);
    if (videos.length < 2) {
      setStitchState({ loading: false, videoUrl: null, error: 'Need at least 2 generated videos to stitch' });
      return;
    }
    setStitchState({ loading: true, videoUrl: null, error: null });
    try {
      const res = await fetch(`${API_URL}/stitch-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStitchState({ loading: false, videoUrl: data.stitchedUrl, error: null });
    } catch (err) {
      setStitchState({ loading: false, videoUrl: null, error: err.message });
    }
  };

  const updateVideoState = (sceneId, patch) =>
    setVideoState(prev => ({ ...prev, [sceneId]: { ...(prev[sceneId] || {}), ...patch } }));

  const handleGenerateVideo = async (scene, imagePath) => {
    const sceneId = scene.scene_id;
    updateVideoState(sceneId, { status: 'STARTING', videoUrl: null, error: null });
    try {
      const res = await fetch(`${API_URL}/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imagePath, scene }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // If no taskId returned (e.g. backend is in prompt-testing mode), just clear the loading state
      if (!data.taskId) {
        updateVideoState(sceneId, { status: null });
        return;
      }
      const { taskId } = data;
      updateVideoState(sceneId, { taskId, status: 'PENDING' });
      // Poll until done
      const poll = async () => {
        const statusRes = await fetch(`${API_URL}/video-status/${taskId}?sceneId=${sceneId}`);
        const { status, videoUrl, error: taskError } = await statusRes.json();
        updateVideoState(sceneId, { status, videoUrl: videoUrl || null, error: taskError || null });
        if (status !== 'SUCCEEDED' && status !== 'FAILED') {
          setTimeout(poll, 5000);
        }
      };
      setTimeout(poll, 5000);
    } catch (err) {
      updateVideoState(sceneId, { status: 'FAILED', error: err.message });
    }
  };

  useEffect(() => {
    setTheme(results?.elements?.theme || '');
    setElements(results?.elements || {});
    setOriginalElements(results?.elements || {});
    setOriginalTheme(results?.elements?.theme || '');
    setScenes(results?.scenes || []);
    setOriginalScenes(results?.scenes || []);
  }, [results]);

  const handleRegenerateScenes = async () => {
    setRegeneratingScenes(true);
    try {
      const updatedElements = { ...elements, theme };
      const response = await fetch(`${API_URL}/regenerate-scenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elements: updatedElements }),
      });
      const data = await response.json();
      if (data.scenes) {
        setScenes(data.scenes);
        setOriginalScenes(data.scenes);
        setResults(prev => ({ ...prev, scenes: data.scenes, images: data.images }));
        setOriginalElements({ ...elements, theme });
        setOriginalTheme(theme);
      }
    } catch (err) {
      console.error('Regenerate scenes failed:', err);
    } finally {
      setRegeneratingScenes(false);
    }
  };

  const handleRegenerateImage = async (scene) => {
    setRegeneratingIds(ids => [...ids, scene.scene_id]);
    try {
      const response = await fetch(`${API_URL}/regenerate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene }),
      });
      const data = await response.json();
      if (data.image_path) {
        setResults(prev => ({
          ...prev,
          images: (prev.images || []).map(img =>
            img.scene_id === scene.scene_id ? { ...img, image_path: data.image_path } : img
          )
        }));
        setOriginalScenes(prev => prev.map(s => s.scene_id === scene.scene_id ? { ...scene } : s));
      }
    } catch (err) {
      console.error('Regenerate image failed:', err);
    } finally {
      setRegeneratingIds(ids => ids.filter(id => id !== scene.scene_id));
    }
  };

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
    <Box sx={{ minHeight: '100vh', background: '#f5f5f5', width: '100%' }}>
      <Container maxWidth={false} sx={{ py: 4 }}>
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
            <ElementsCard
              elements={{ ...elements, theme }}
              setTheme={setTheme}
              setElements={setElements}
              originalElements={originalElements}
              originalTheme={originalTheme}
              onRegenerateScenes={handleRegenerateScenes}
              regeneratingScenes={regeneratingScenes}
            />
            <ScenesCard 
              scenes={scenes} 
              setScenes={setScenes} 
              images={results.images} 
              elements={elements} 
              originalScenes={originalScenes} 
              onRegenerateImage={handleRegenerateImage} 
              regeneratingIds={regeneratingIds} 
              videoState={videoState} 
              onGenerateVideo={handleGenerateVideo} />
            {/* Stitch all scene videos into one */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={stitchState.loading ? <CircularProgress size={18} color="inherit" /> : <MovieFilterIcon />}
                onClick={handleStitchVideos}
                disabled={stitchState.loading}
              >
                {stitchState.loading ? 'Stitching Videos...' : '🎬 Create Vision Board Video'}
              </Button>
              {stitchState.error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {stitchState.error}
                </Typography>
              )}
              {stitchState.videoUrl && (
                <Box sx={{ mt: 2, mx: 'auto', maxWidth: 720 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    ✅ Your Vision Board Video
                  </Typography>
                  <video
                    key={stitchState.videoUrl}
                    src={stitchState.videoUrl}
                    controls
                    autoPlay
                    style={{ width: '100%', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
                  />
                  <Button
                    component="a"
                    href={stitchState.videoUrl}
                    download="vision-board.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  >
                    Download Vision Board Video
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}
