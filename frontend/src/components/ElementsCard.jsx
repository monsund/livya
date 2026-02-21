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

  const sections = [
    { key: 'career', label: 'Career', icon: <WorkOutline fontSize="small" />, color: 'primary' },
    { key: 'lifestyle', label: 'Lifestyle', icon: <FavoriteBorder fontSize="small" />, color: 'secondary' },
    { key: 'environment', label: 'Environment', icon: <HomeOutlined fontSize="small" />, color: 'success' },
    { key: 'emotions', label: 'Emotions', icon: <EmojiEmotionsOutlined fontSize="small" />, color: 'warning' }
  ];

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 2.5, md: 3 }, mb: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="h6"
          color="primary"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: { xs: '1.1rem', sm: '1.2rem' },
            fontWeight: 600,
          }}
        >
          📋 Extracted Elements
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={regeneratingScenes ? <CircularProgress size={14} color="inherit" /> : <AutorenewIcon fontSize="small" />}
          onClick={() => onRegenerateScenes && onRegenerateScenes()}
          disabled={!isElementsDirty || regeneratingScenes}
          sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
        >
          {regeneratingScenes ? 'Regenerating...' : 'Regenerate Scenes'}
        </Button>
      </Box>

      {elements.theme && (
        <>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <FlagOutlined color="secondary" fontSize="small" />
              <Typography 
                variant="subtitle2" 
                color="secondary"
                sx={{ 
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                Theme
              </Typography>
            </Box>
            <TextField
              value={elements.theme}
              onChange={e => setTheme && setTheme(e.target.value)}
              variant="standard"
              size="small"
              sx={{ pl: 3.5, width: '80%' }}
              inputProps={{
                style: { fontWeight: 500, fontSize: '1rem', color: '#1976d2' }
              }}
            />
          </Box>
          <Divider sx={{ mb: 2 }} />
        </>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {sections.map(
          (section) =>
            elements[section.key]?.length > 0 && (
              <Box 
                key={section.key} 
                sx={{ 
                  flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' },
                  minWidth: 0
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5, 
                  mb: 1
                }}>
                  {section.icon}
                  <Typography 
                    variant="subtitle2" 
                    color={section.color}
                    sx={{ 
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}
                  >
                    {section.label}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {elements[section.key].map((item, idx) => (
                    <Chip
                      key={idx}
                      label={item}
                      color={section.color}
                      variant="outlined"
                      size="small"
                      onDelete={() => handleDelete(section.key, idx)}
                      sx={{ 
                        fontSize: '0.75rem',
                        height: 24,
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
                  <InputBase
                    value={newItems[section.key] || ''}
                    onChange={e => setNewItems(prev => ({ ...prev, [section.key]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAdd(section.key)}
                    placeholder={`Add ${section.label}...`}
                    size="small"
                    sx={{ fontSize: '0.75rem', border: '1px solid #ccc', borderRadius: 1, px: 1, flex: 1, minWidth: 0 }}
                  />
                  <IconButton size="small" onClick={() => handleAdd(section.key)} color={section.color}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )
        )}
      </Box>
    </Paper>
  );
}
