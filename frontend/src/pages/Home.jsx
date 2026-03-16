import { useState } from 'react';
import { Container, Typography, Box, Button, CircularProgress, Paper, Fade, Chip } from '@mui/material';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import DownloadIcon from '@mui/icons-material/Download';
import { mockData } from '../mockData/mockData';
import InputSection from '../components/InputSection';
import ElementsCard from '../components/ElementsCard';
import ScenesCard from '../components/ScenesCard';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'https://livya.onrender.com';


export default function Home() {
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(!!(mockData?.scenes?.length));
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(mockData?.elements?.theme || '');
  // Seed videoState from mockData.videos if present
  const initVideoState = () => {
    if (!mockData?.videos) return {};
    return Object.fromEntries(
      mockData.videos.map(v => [v.scene_id, { status: 'SUCCEEDED', videoUrl: v.videoUrl, error: null }])
    );
  };
  const [elements, setElements] = useState(mockData?.elements || {});
  const [originalElements, setOriginalElements] = useState(mockData?.elements || {});
  const [originalTheme, setOriginalTheme] = useState(mockData?.elements?.theme || '');
  const [scenes, setScenes] = useState(mockData?.scenes || []);
  const [originalScenes, setOriginalScenes] = useState(mockData?.scenes || []);
  const [images, setImages] = useState(mockData?.images || []);
  const [totalScenes, setTotalScenes] = useState(mockData?.scenes?.length || null);
  const [regeneratingIds, setRegeneratingIds] = useState([]);
  const [regeneratingScenes, setRegeneratingScenes] = useState(false);
  const [protagonistBase64, setProtagonistBase64] = useState(null);
  const [protagonistGender, setProtagonistGender] = useState(null);
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
        setImages(data.images || []);
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
        body: JSON.stringify({ scene, protagonistBase64: protagonistBase64 || null, protagonistGender: protagonistGender || null }),
      });
      const data = await response.json();
      if (data.image_path) {
        setImages(prev => prev.map(img =>
          img.scene_id === scene.scene_id ? { ...img, image_path: data.image_path } : img
        ));
        setOriginalScenes(prev => prev.map(s => s.scene_id === scene.scene_id ? { ...scene } : s));
      }
    } catch (err) {
      console.error('Regenerate image failed:', err);
    } finally {
      setRegeneratingIds(ids => ids.filter(id => id !== scene.scene_id));
    }
  };

  const handleSubmit = async (formData, activeTab, duration) => {
    const vision = formData.get('vision');
    const image = formData.get('image');
    const protagonistFile = formData.get('protagonist');
    const protagonistGenderVal = formData.get('protagonistGender') || null;
    formData.delete('protagonist'); // remove the File — we'll send it as base64 instead
    formData.delete('protagonistGender'); // will be re-appended as plain text after base64 conversion

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
    setShowResults(false);
    setScenes([]);
    setImages([]);
    setElements({});
    setTotalScenes(null);
    setVideoState({});
    setStitchState({ loading: false, videoUrl: null, error: null });
    setLoading(true);

    // Convert protagonist to base64 if provided
    let protagonistB64 = null;
    if (protagonistFile) {
      protagonistB64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]); // strip data:...;base64,
        reader.readAsDataURL(protagonistFile);
      });
      setProtagonistBase64(protagonistB64); // persist for regenerate calls
    } else {
      setProtagonistBase64(null);
    }
    setProtagonistGender(protagonistGenderVal); // persist for regenerate calls
    const protagonistBase64 = protagonistB64;

    const options = activeTab === 0
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vision, duration, protagonistBase64, protagonistGender: protagonistGenderVal }) }
      : (() => { formData.append('duration', duration); if (protagonistBase64) formData.append('protagonistBase64', protagonistBase64); if (protagonistGenderVal) formData.append('protagonistGender', protagonistGenderVal); return { method: 'POST', body: formData }; })();

    let response;
    try {
      response = await fetch(`${API_URL}/vision-stream`, options);
    } catch {
        // API unreachable — fall back to mock data
        setElements(mockData?.elements || {});
        setOriginalElements(mockData?.elements || {});
        setTheme(mockData?.elements?.theme || '');
        setOriginalTheme(mockData?.elements?.theme || '');
        setScenes(mockData?.scenes || []);
        setOriginalScenes(mockData?.scenes || []);
        setImages(mockData?.images || []);
        setTotalScenes(mockData?.scenes?.length || null);
        setShowResults(true);
        setLoading(false);
      return;
    }

    if (!response.ok) {
      setError(`Server error: ${response.status}`);
      setLoading(false);
      return;
    }

    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep any incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let parsed;
          try { parsed = JSON.parse(line.slice(6)); } catch { continue; }
          const { type, data } = parsed;

          if (type === 'elements') {
            setElements(data);
            setOriginalElements(data);
            setTheme(data.theme || '');
            setOriginalTheme(data.theme || '');
          } else if (type === 'scenes') {
            setScenes(data);
            setOriginalScenes(data);
            setTotalScenes(data.length);
            setShowResults(true);
            setLoading(false); // scenes are here — stop the spinner
          } else if (type === 'image') {
            setImages(prev => [...prev, data]); // images pop in one by one
          } else if (type === 'error') {
            throw new Error(data.message);
          }
        }
      }
    } catch (err) {
      console.error('Vision stream error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100%' }}>
      {/* Hero header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          pt: { xs: 5, md: 7 },
          pb: { xs: 8, md: 10 },
          px: 2,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 800,
              mb: 1,
              letterSpacing: '-0.02em',
            }}
          >
            Livya Vision
          </Typography>
          <Typography
            variant="h6"
            sx={{
              opacity: 0.85,
              fontWeight: 400,
              fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
              maxWidth: 500,
              mx: 'auto',
            }}
          >
            Transform your vision into cinematic scenes
          </Typography>
        </Box>
        {/* Decorative blur circles */}
        <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', top: -80, right: -60 }} />
        <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', bottom: -40, left: -30 }} />
      </Box>

      {/* Main content — overlaps hero */}
      <Container maxWidth="lg" sx={{ mt: { xs: -5, md: -6 }, pb: 6, position: 'relative', zIndex: 1 }}>
        <InputSection onSubmit={handleSubmit} loading={loading} />

        {loading && <LoadingSpinner />}
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {showResults && (
          <Fade in timeout={600}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
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
                images={images}
                elements={elements}
                originalScenes={originalScenes}
                onRegenerateImage={handleRegenerateImage}
                regeneratingIds={regeneratingIds}
                videoState={videoState}
                onGenerateVideo={handleGenerateVideo}
                totalScenes={totalScenes}
              />

              {/* Stitch section */}
              <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  🎥 Final Vision Board Video
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}>
                  Generate videos for each scene, then stitch them together into your complete vision board video.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={stitchState.loading ? <CircularProgress size={18} color="inherit" /> : <MovieFilterIcon />}
                  onClick={handleStitchVideos}
                  disabled={stitchState.loading}
                  sx={{ px: 4, py: 1.5 }}
                >
                  {stitchState.loading ? 'Stitching...' : 'Create Vision Board Video'}
                </Button>
                {stitchState.error && (
                  <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                    {stitchState.error}
                  </Typography>
                )}
                {stitchState.videoUrl && (
                  <Fade in timeout={500}>
                    <Box sx={{ mt: 3, mx: 'auto', maxWidth: 720 }}>
                      <Chip label="✅ Ready" color="success" size="small" sx={{ mb: 1.5, fontWeight: 600 }} />
                      <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                        <video
                          key={stitchState.videoUrl}
                          src={stitchState.videoUrl}
                          controls
                          style={{ width: '100%', display: 'block' }}
                        />
                      </Box>
                      <Button
                        component="a"
                        href={stitchState.videoUrl}
                        download="vision-board.mp4"
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        sx={{ mt: 2 }}
                      >
                        Download Video
                      </Button>
                    </Box>
                  </Fade>
                )}
              </Paper>
            </Box>
          </Fade>
        )}
      </Container>
    </Box>
  );
}
