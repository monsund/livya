import {
  BottomNavigation,
  BottomNavigationAction,
  Paper
} from '@mui/material';

import HomeIcon from '@mui/icons-material/Home';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import PersonIcon from '@mui/icons-material/Person';

export default function BottomNav({ value, setValue }) {
  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backdropFilter: 'blur(20px)',
        background: 'rgba(255,255,255,0.8)',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        zIndex: 1000,
      }}
      elevation={0}
    >
      <BottomNavigation
        value={value}
        onChange={(e, newValue) => setValue(newValue)}
        showLabels
        sx={{
          bgcolor: 'transparent',

          '& .MuiBottomNavigationAction-root': {
            color: '#9ca3af',
            fontSize: '11px',
          },

          '& .Mui-selected': {
            color: '#8b5cf6',
          },

          '& .MuiBottomNavigationAction-label': {
            fontSize: '11px',
            marginTop: '2px',
          },

          '& .MuiSvgIcon-root': {
            fontSize: 22,
          },
        }}
      >
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction label="Create" icon={<AutoAwesomeIcon />} />
        <BottomNavigationAction label="Creating" icon={<ViewCarouselIcon />} />
        <BottomNavigationAction label="Scenes" icon={<ViewCarouselIcon />} />
        <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
      </BottomNavigation>
    </Paper>
  );
}