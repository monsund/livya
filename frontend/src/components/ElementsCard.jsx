import { useState } from 'react';
import { Paper, Typography, Box, Chip, Divider, TextField, IconButton, InputBase, Button, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import {
  WorkOutline,
  FavoriteBorder,
  HomeOutlined,
  EmojiEmotionsOutlined,
  FlagOutlined
} from '@mui/icons-material';

export default function ElementsCard({ elements, setTheme, setElements, originalElements = {}, originalTheme = '', onRegenerateScenes, regeneratingScenes }) {
  const [newItems, setNewItems] = useState({});

  const isElementsDirty =
    elements.theme !== originalTheme ||
    JSON.stringify({ ...elements, theme: undefined }) !== JSON.stringify({ ...originalElements, theme: undefined });

  const handleDelete = (key, idx) => {
    const updated = { ...elements, [key]: elements[key].filter((_, i) => i !== idx) };
    setElements && setElements(updated);
  };

  const handleAdd = (key) => {
    const val = (newItems[key] || '').trim();
    if (!val) return;
    const updated = { ...elements, [key]: [...(elements[key] || []), val] };
    setElements && setElements(updated);
    setNewItems(prev => ({ ...prev, [key]: '' }));
  };

  const sectionColors = {
    career: { bg: '#eef2ff', border: '#667eea', chip: 'primary' },
    lifestyle: { bg: '#fdf2f8', border: '#ec4899', chip: 'secondary' },
    environment: { bg: '#ecfdf5', border: '#10b981', chip: 'success' },
    emotions: { bg: '#fffbeb', border: '#f59e0b', chip: 'warning' },
  };

  const sections = [
    { key: 'career', label: 'Career', icon: <WorkOutline sx={{ fontSize: 18 }} /> },
    { key: 'lifestyle', label: 'Lifestyle', icon: <FavoriteBorder sx={{ fontSize: 18 }} /> },
    { key: 'environment', label: 'Environment', icon: <HomeOutlined sx={{ fontSize: 18 }} /> },
    { key: 'emotions', label: 'Emotions', icon: <EmojiEmotionsOutlined sx={{ fontSize: 18 }} /> },
  ];

  return (
    <Paper sx={{ p: { xs: 2.5, sm: 3, md: 3.5 }, mb: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📋 Extracted Elements
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={regeneratingScenes ? <CircularProgress size={14} color="inherit" /> : <AutorenewIcon fontSize="small" />}
          onClick={() => onRegenerateScenes && onRegenerateScenes()}
          disabled={!isElementsDirty || regeneratingScenes}
        >
          {regeneratingScenes ? 'Regenerating...' : 'Regenerate Scenes'}
        </Button>
      </Box>

      {elements.theme && (
        <>
          <Box sx={{ mb: 2.5, p: 2, bgcolor: 'grey.50', borderRadius: 2, borderLeft: 3, borderColor: 'secondary.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <FlagOutlined color="secondary" sx={{ fontSize: 18 }} />
              <Typography variant="subtitle2" color="secondary">Theme</Typography>
            </Box>
            <TextField
              value={elements.theme}
              onChange={e => setTheme && setTheme(e.target.value)}
              variant="standard"
              size="small"
              fullWidth
              inputProps={{ style: { fontWeight: 600, fontSize: '1.05rem', color: '#667eea' } }}
              sx={{ '& .MuiInput-underline:before': { borderColor: 'transparent' } }}
            />
          </Box>
          <Divider sx={{ mb: 2.5 }} />
        </>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {sections.map((section) => {
          const colors = sectionColors[section.key];
          return elements[section.key]?.length > 0 ? (
            <Box
              key={section.key}
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: colors.bg,
                borderTop: 3,
                borderColor: colors.border,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                {section.icon}
                <Typography variant="subtitle2" sx={{ color: colors.border }}>
                  {section.label}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {elements[section.key].map((item, idx) => (
                  <Chip
                    key={idx}
                    label={item}
                    color={colors.chip}
                    variant="outlined"
                    size="small"
                    onDelete={() => handleDelete(section.key, idx)}
                    sx={{ fontSize: '0.78rem', height: 26, '& .MuiChip-label': { px: 1 } }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5, gap: 0.5 }}>
                <InputBase
                  value={newItems[section.key] || ''}
                  onChange={e => setNewItems(prev => ({ ...prev, [section.key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAdd(section.key)}
                  placeholder={`Add...`}
                  size="small"
                  sx={{
                    fontSize: '0.78rem',
                    bgcolor: 'white',
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 1.5,
                    px: 1.5,
                    py: 0.25,
                    flex: 1,
                    minWidth: 0,
                    '&:focus-within': { borderColor: colors.border },
                  }}
                />
                <IconButton size="small" onClick={() => handleAdd(section.key)} sx={{ color: colors.border }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ) : null;
        })}
      </Box>
    </Paper>
  );
}
