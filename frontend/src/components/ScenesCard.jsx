import { Paper, Typography, Box, Card, CardContent, Grid, TextField, Select, MenuItem, Button, CircularProgress } from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Visibility,
  Landscape,
  DirectionsRun,
  Mood,
  Videocam
} from '@mui/icons-material';

export default function ScenesCard({ scenes, setScenes, images, elements, originalScenes = [], onRegenerateImage, regeneratingIds = [] }) {
  const getDetailIcon = (label) => {
    const icons = {
      Visual: <Visibility sx={{ fontSize: 16 }} />,
      Environment: <Landscape sx={{ fontSize: 16 }} />,
      Actions: <DirectionsRun sx={{ fontSize: 16 }} />,
      Mood: <Mood sx={{ fontSize: 16 }} />,
      Camera: <Videocam sx={{ fontSize: 16 }} />
    };
    return icons[label] || null;
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
      <Typography 
        variant="h6" 
        color="primary" 
        gutterBottom
        sx={{ 
          fontSize: { xs: '1.1rem', sm: '1.2rem' },
          fontWeight: 600,
          mb: 2
        }}
      >
        🎬 Generated Scenes
      </Typography>

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        {scenes.map((scene) => {
          let imagePath = null;
          if (images && Array.isArray(images)) {
            const found = images.find(img => img.scene_id === scene.scene_id);
            if (found && found.image_path) {
              // For local dev, serve from backend static if needed
              imagePath = found.image_path.startsWith('images/') ? `/${found.image_path}` : found.image_path;
            }
          }
          const original = originalScenes.find(s => s.scene_id === scene.scene_id);
          const isDirty = original && JSON.stringify(original) !== JSON.stringify(scene);
          const isRegenerating = regeneratingIds.includes(scene.scene_id);
          return (
          <Grid item xs={12} sm={6} lg={4} key={scene.scene_id}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                borderLeft: 3,
                borderColor: 'primary.main',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Typography 
                  variant="subtitle1" 
                  color="primary" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 600,
                    mb: 1.5
                  }}
                >
                  Scene {scene.scene_id}: {scene.title}
                </Typography>

                {[
                  { label: 'Visual', value: scene.visual, field: 'visual' },
                  { label: 'Environment', value: scene.environment, field: 'environment', select: true, selectKey: 'environment' },
                  { label: 'Actions', value: scene.actions, field: 'actions' },
                  { label: 'Mood', value: scene.mood, field: 'mood', select: true, selectKey: 'emotions' },
                  { label: 'Camera', value: scene.camera }
                ].map((detail, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      mb: 1,
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      minWidth: 90,
                      flexShrink: 0
                    }}>
                      {getDetailIcon(detail.label)}
                      <Typography 
                        variant="caption" 
                        fontWeight="bold" 
                        color="secondary"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        {detail.label}:
                      </Typography>
                    </Box>
                    {detail.field && detail.select ? (
                      <Select
                        value={detail.value || ''}
                        onChange={e => {
                          if (!setScenes) return;
                          setScenes(scenes.map(s =>
                            s.scene_id === scene.scene_id
                              ? { ...s, [detail.field]: e.target.value }
                              : s
                          ));
                        }}
                        variant="standard"
                        size="small"
                        sx={{ flex: 1, fontSize: '0.7rem' }}
                      >
                        {(elements?.[detail.selectKey] || []).map((opt, i) => (
                          <MenuItem key={i} value={opt} sx={{ fontSize: '0.7rem' }}>{opt}</MenuItem>
                        ))}
                        {detail.value && !(elements?.[detail.selectKey] || []).includes(detail.value) && (
                          <MenuItem value={detail.value} sx={{ fontSize: '0.7rem' }}>{detail.value}</MenuItem>
                        )}
                      </Select>
                    ) : detail.field ? (
                      <TextField
                        value={detail.value || ''}
                        onChange={e => {
                          if (!setScenes) return;
                          setScenes(scenes.map(s =>
                            s.scene_id === scene.scene_id
                              ? { ...s, [detail.field]: e.target.value }
                              : s
                          ));
                        }}
                        variant="standard"
                        size="small"
                        multiline
                        sx={{ flex: 1 }}
                        inputProps={{ style: { fontSize: '0.7rem', lineHeight: 1.4 } }}
                      />
                    ) : (
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          flex: 1,
                          fontSize: '0.7rem',
                          lineHeight: 1.4
                        }}
                      >
                        {detail.value}
                      </Typography>
                    )}
                  </Box>
                ))}

                {imagePath && (
                  <Box sx={{ mb: 1, textAlign: 'center' }}>
                    <img
                      src={imagePath}
                      alt={`Scene ${scene.scene_id}`}
                      style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    />
                  </Box>
                )}
                <Box sx={{ textAlign: 'center', mt: 1, display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={isRegenerating ? <CircularProgress size={14} color="inherit" /> : <AutorenewIcon fontSize="small" />}
                    onClick={() => onRegenerateImage && onRegenerateImage(scene)}
                    disabled={!isDirty || isRegenerating}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    {isRegenerating ? 'Regenerating...' : 'Regenerate Image'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RestartAltIcon fontSize="small" />}
                    onClick={() => {
                      if (!original || !setScenes) return;
                      setScenes(scenes.map(s => s.scene_id === scene.scene_id ? { ...original } : s));
                    }}
                    disabled={!isDirty}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Reset
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}
