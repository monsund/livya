import { useState } from 'react';
import { Box } from '@mui/material';

import Home from './pages/HomeScreen';
import StoryboardScreen from './pages/StoryBoard';
import BottomNav from './components/BottomNav';
import CreateInputScreen from './pages/CreateInput';
import GeneratingScenes from './pages/GenerateScenes';
import ProfileScreen from './pages/ProfileScreen';
import VisionProvider from './context/VisionContext';

export default function MainApp() {
  const [navValue, setNavValue] = useState(0);

  return (
    <VisionProvider>
      <Box>
        {/* SCREEN RENDERING */}
        {navValue === 0 && <Home onNavigate={setNavValue} />}
        {navValue === 1 && <CreateInputScreen onNavigate={setNavValue} />}
        {navValue === 2 && <GeneratingScenes onNavigate={setNavValue} />}
        {navValue === 3 && <StoryboardScreen />}
        {navValue === 4 && <ProfileScreen />}

        {/* NAV */}
        <BottomNav value={navValue} setValue={setNavValue} />
      </Box>
    </VisionProvider>
  );
}
