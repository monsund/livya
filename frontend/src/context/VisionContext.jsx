import { createContext, useContext, useState } from 'react';

const VisionContext = createContext();

const useVision = () => {
  const context = useContext(VisionContext);
  if (!context) {
    throw new Error('useVision must be used within a VisionProvider');
  }
  return context;
};

const VisionProvider = ({ children }) => {
  const [visionData, setVisionData] = useState({
    title: '',
    description: '',
    duration: 30,
    selectedImages: [],
    elements: null,
    scenes: null,
    images: null,
    videos: null,
    finalVideo: null,
    isLoading: false,
    error: null,
    protagonistGender: '',
    protagonistBase64: '',
  });

//   const updateVisionData = (updates) => {
//     setVisionData(prev => {
//         if (typeof updates === "function") {
//             return { ...prev, ...updates(prev) };
//         }
//         return ({ ...prev, ...updates })
//     });
//   };

  const updateVisionData = (updates) => {
    setVisionData(prev => {
        if (typeof updates === "function") {
            const result = { ...prev, ...updates(prev) };
            return result;
        }
        const result = { ...prev, ...updates };
        return result;
    });
  };

  const clearVisionData = () => {
    setVisionData({
      title: '',
      description: '',
      duration: 30,
      selectedImages: [],
      elements: null,
      scenes: null,
      images: null,
      videos: null,
      finalVideo: null,
      isLoading: false,
      error: null,
      protagonistGender: '',
      protagonistBase64: '',
    });
  };

  const createVisionText = () => {
    const parts = [];
    if (visionData.title.trim()) parts.push(`Title: ${visionData.title.trim()}`);
    if (visionData.description.trim()) parts.push(`Description: ${visionData.description.trim()}`);
    return parts.join('\n\n');
  };

  return (
    <VisionContext.Provider 
      value={{ 
        visionData, 
        updateVisionData, 
        clearVisionData,
        createVisionText 
      }}
    >
      {children}
    </VisionContext.Provider>
  );
};

// Export hook and provider together to satisfy fast refresh
VisionProvider.useVision = useVision;

export default VisionProvider;