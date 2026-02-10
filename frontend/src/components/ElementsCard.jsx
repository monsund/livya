import { Paper, Typography, Box, Chip, Divider } from '@mui/material';
import {
  WorkOutline,
  FavoriteBorder,
  HomeOutlined,
  EmojiEmotionsOutlined,
  FlagOutlined
} from '@mui/icons-material';

export default function ElementsCard({ elements }) {
  const sections = [
    { key: 'career', label: 'Career', icon: <WorkOutline fontSize="small" />, color: 'primary' },
    { key: 'lifestyle', label: 'Lifestyle', icon: <FavoriteBorder fontSize="small" />, color: 'secondary' },
    { key: 'environment', label: 'Environment', icon: <HomeOutlined fontSize="small" />, color: 'success' },
    { key: 'emotions', label: 'Emotions', icon: <EmojiEmotionsOutlined fontSize="small" />, color: 'warning' }
  ];

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 2.5, md: 3 }, mb: { xs: 2, md: 3 } }}>
      <Typography 
        variant="h6" 
        color="primary" 
        gutterBottom 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          fontSize: { xs: '1.1rem', sm: '1.2rem' },
          fontWeight: 600,
          mb: 2
        }}
      >
        📋 Extracted Elements
      </Typography>

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
            <Typography 
              variant="body1" 
              color="primary" 
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.95rem', sm: '1rem' },
                pl: 3.5
              }}
            >
              {elements.theme}
            </Typography>
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
                      sx={{ 
                        fontSize: '0.75rem',
                        height: 24,
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )
        )}
      </Box>
    </Paper>
  );
}
