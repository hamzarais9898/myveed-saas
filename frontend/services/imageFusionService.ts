import axios from 'axios';
import { API_URL } from '@/lib/config';

export interface ImageFusionOrderMapItem {
  id: string; // Gallery Image ID or local filename
  source: 'gallery' | 'local';
  index: number;
}

export interface ImageFusionRequest {
  prompt: string;
  resolution?: string;
  style?: string;
  quality?: string;
  selectedGalleryIds: string[];
  localFileIds?: string[];
  orderMap: ImageFusionOrderMapItem[];
  uploadedLocalFiles: File[];
  model?: string;
}

export const generateFusedImage = async (data: ImageFusionRequest) => {
  const token = localStorage.getItem('token');
  
  const formData = new FormData();
  formData.append('prompt', data.prompt);
  
  if (data.resolution) formData.append('resolution', data.resolution);
  if (data.style) formData.append('style', data.style);
  if (data.quality) formData.append('quality', data.quality);
  if (data.model) formData.append('model', data.model);
  
  formData.append('selectedGalleryIds', JSON.stringify(data.selectedGalleryIds));
  if (data.localFileIds) {
    formData.append('localFileIds', JSON.stringify(data.localFileIds));
  }
  formData.append('orderMap', JSON.stringify(data.orderMap));

  if (data.uploadedLocalFiles && data.uploadedLocalFiles.length > 0) {
    data.uploadedLocalFiles.forEach(file => {
      formData.append('uploadedLocalFiles', file);
    });
  }

  const response = await axios.post(`${API_URL}/image-fusion/generate`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

export const getFusionHistory = async (page: number = 1, limit: number = 20) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/image-fusion?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
