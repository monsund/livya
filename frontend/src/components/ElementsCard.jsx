import { useState } from 'react';
import { Paper, Typography, Box, Chip, TextField, IconButton, InputBase, Button, CircularProgress, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import EditIcon from '@mui/icons-material/Edit';
import {
  WorkOutline,
  FavoriteBorder,
  HomeOutlined,
  EmojiEmotionsOutlined,
  FlagOutlined,
} from '@mui/icons-material';

const glassCard = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '20px',
};

const gradientBtn = {
  background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)',
  color: '#fff',
  fontWeight: 700,
  borderRadius: 3,
  textTransform: 'none',
  boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
  '&:hover': { background: 'linear-gradient(90deg,#5b5ff0,#7c3aed,#db2777)' },
  '&:disabled': { opacity: 0.45, color: '#fff' },
};

const sections = [
  {
    key: 'career',
    label: 'Career',
    emoji: '💼',
    icon: <WorkOutline sx={{ fontSize: 15 }} />,
    gradient: 'linear-gradient(135deg,#3730a3,#4f46e5)',
    glow: 'rgba(79,70,229,0.5)',
    chipBg: 'rgba(79,70,229,0.30)',
    chipBorder: 'rgba(99,102,241,0.70)',
    chipColor: '#000000',
    headerBg: 'rgba(79,70,229,0.25)',
  },
  {
    key: 'lifestyle',
    label: 'Lifestyle',
    emoji: '✨',
    icon: <FavoriteBorder sx={{ fontSize: 15 }} />,
    gradient: 'linear-gradient(135deg,#9d174d,#be185d)',
    glow: 'rgba(190,24,93,0.5)',
    chipBg: 'rgba(190,24,93,0.28)',
    chipBorder: 'rgba(236,72,153,0.70)',
    chipColor: '#030102',
    headerBg: 'rgba(190,24,93,0.23)',
  },
  {
    key: 'environment',
    label: 'Environment',
    emoji: '🌿',
    icon: <HomeOutlined sx={{ fontSize: 15 }} />,
    gradient: 'linear-gradient(135deg,#064e3b,#047857)',
    glow: 'rgba(4,120,87,0.5)',
    chipBg: 'rgba(4,120,87,0.30)',
    chipBorder: 'rgba(16,185,129,0.70)',
    chipColor: '#000000',
    headerBg: 'rgba(4,120,87,0.25)',
  },
  {
    key: 'emotions',
    label: 'Emotions',
    emoji: '🎭',
    icon: <EmojiEmotionsOutlined sx={{ fontSize: 15 }} />,
    gradient: 'linear-gradient(135deg,#78350f,#b45309)',
    glow: 'rgba(180,83,9,0.5)',
    chipBg: 'rgba(180,83,9,0.30)',
    chipBorder: 'rgba(245,158,11,0.70)',
    chipColor: '#000000',
    headerBg: 'rgba(180,83,9,0.25)',
  },
];

export default function ElementsCard({ elements, setTheme, setElements, originalElements = {}, originalTheme = '', onRegenerateScenes, regeneratingScenes }) {
  const [newItems, setNewItems] = useState({});
  const [focusedSection, setFocusedSection] = useState(null);

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

  const totalItems = sections.reduce((acc, s) => acc + (elements[s.key]?.length || 0), 0);

  return (
    <Paper sx={{ ...glassCard, p: { xs: 2, sm: 3 }, mb: { xs: 2, md: 3 }, overflow: 'hidden' }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            ✦ Story Elements
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            {totalItems} elements extracted across {sections.filter(s => (elements[s.key]?.length || 0) > 0).length} categories
          </Typography>
        </Box>
        <Tooltip title={!isElementsDirty ? 'Edit elements to unlock regeneration' : ''} placement="top">
          <span>
            <Button
              variant="contained"
              size="small"
              startIcon={regeneratingScenes ? <CircularProgress size={13} color="inherit" /> : <AutorenewIcon sx={{ fontSize: 15 }} />}
              onClick={() => onRegenerateScenes && onRegenerateScenes()}
              disabled={!isElementsDirty || regeneratingScenes}
              sx={gradientBtn}
            >
              {regeneratingScenes ? 'Regenerating…' : 'Regenerate Scenes'}
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* ── Theme banner ── */}
      {elements.theme && (
        <Box
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: 3,
            background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.12))',
            border: '1px solid rgba(139,92,246,0.25)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0, left: 0,
              width: 4, height: '100%',
              background: 'linear-gradient(180deg,#6366f1,#8b5cf6,#ec4899)',
              borderRadius: '3px 0 0 3px',
            },
          }}
        >
          <Box sx={{ pl: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <FlagOutlined sx={{ fontSize: 14, color: '#a78bfa' }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: '0.7rem', 
                  color: '#000000', 
                  letterSpacing: '0.08em', 
                  textTransform: 'uppercase' 
                }}>
                Narrative Theme
              </Typography>
              <EditIcon sx={{ fontSize: 12, color: 'rgba(167,139,250,0.5)', ml: 'auto' }} />
            </Box>
            <TextField
              value={elements.theme}
              onChange={e => setTheme && setTheme(e.target.value)}
              variant="standard"
              size="small"
              fullWidth
              inputProps={{ style: { fontWeight: 400, fontSize: '0.95rem', color: '#292828', lineHeight: 1.5 } }}
              sx={{
                '& .MuiInput-underline:before': { borderColor: 'rgba(139,92,246,0.2)' },
                '& .MuiInput-underline:hover:before': { borderColor: 'rgba(139,92,246,0.5)' },
                '& .MuiInput-underline:after': { borderColor: '#8b5cf6' },
              }}
            />
          </Box>
        </Box>
      )}

      {/* ── Section grid ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {sections.map((section) => {
          const items = elements[section.key] || [];
          if (items.length === 0) return null;
          const isFocused = focusedSection === section.key;
          return (
            <Box
              key={section.key}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.03)',
                border: isFocused
                  ? `1.5px solid ${section.chipColor}`
                  : `1px solid ${section.chipBorder}`,
                boxShadow: isFocused ? `0 0 20px ${section.glow}` : 'none',
                transition: 'box-shadow 0.25s, border-color 0.25s',
              }}
            >
              {/* Section header */}
              <Box
                sx={{
                  px: 1.75,
                  py: 1.25,
                  background: section.headerBg,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Box
                  sx={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: section.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 3px 10px ${section.glow}`,
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ color: '#fff', lineHeight: 0 }}>{section.icon}</Box>
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: section.chipColor }}>
                  {section.emoji} {section.label}
                </Typography>
                <Chip
                  label={items.length}
                  size="small"
                  sx={{
                    ml: 'auto',
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    background: section.chipBg,
                    color: section.chipColor,
                    border: `1px solid ${section.chipBorder}`,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Box>

              {/* Chips */}
              <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.65 }}>
                {items.map((item, idx) => (
                  <Chip
                    key={idx}
                    label={item}
                    size="small"
                    onDelete={() => handleDelete(section.key, idx)}
                    sx={{
                      height: 24,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: section.chipBg,
                      color: section.chipColor,
                      border: `1px solid ${section.chipBorder}`,
                      borderRadius: 2,
                      '& .MuiChip-label': { px: 0.9 },
                      '& .MuiChip-deleteIcon': { fontSize: 13, color: section.chipColor, opacity: 0.6, '&:hover': { opacity: 1 } },
                      '&:hover': { background: section.chipBorder, boxShadow: `0 2px 8px ${section.glow}` },
                      transition: 'all 0.15s',
                    }}
                  />
                ))}
              </Box>

              {/* Add input */}
              <Box
                sx={{
                  px: 1.25, pb: 1.25,
                  display: 'flex', alignItems: 'center', gap: 0.5,
                }}
              >
                <InputBase
                  value={newItems[section.key] || ''}
                  onChange={e => setNewItems(prev => ({ ...prev, [section.key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAdd(section.key)}
                  onFocus={() => setFocusedSection(section.key)}
                  onBlur={() => setFocusedSection(null)}
                  placeholder="Add item…"
                  size="small"
                  sx={{
                    fontSize: '0.72rem',
                    background: 'rgba(0,0,0,0.30)',
                    border: `1px solid ${section.chipBorder}`,
                    borderRadius: 2,
                    px: 1.25,
                    py: 0.3,
                    flex: 1,
                    minWidth: 0,
                    color: '#f1f5f9',
                    '& input': { background: 'transparent', color: '#000000' },
                    '&:focus-within': { borderColor: section.chipColor, background: section.chipBg, boxShadow: `0 0 8px ${section.glow}` },
                    transition: 'all 0.2s',
                    '& input::placeholder': { fontSize: '0.72rem', color: 'rgba(0,0,0,0.6)' },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleAdd(section.key)}
                  sx={{
                    width: 24, height: 24,
                    background: section.gradient,
                    color: '#fff',
                    boxShadow: `0 2px 8px ${section.glow}`,
                    '&:hover': { transform: 'scale(1.1)', boxShadow: `0 4px 14px ${section.glow}` },
                    transition: 'all 0.15s',
                  }}
                >
                  <AddIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
