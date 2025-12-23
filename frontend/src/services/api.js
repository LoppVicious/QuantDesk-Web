// frontend/src/services/api.js
import axios from 'axios';

// Apuntamos a tu servidor FastAPI
const API_URL = 'http://localhost:8000/api/v1';

// CORRECCIÓN: Renombrado de getAssetProfile a getAssetDetails para coincidir con SingleAsset.jsx
export const getAssetDetails = async (ticker) => {
  try {
    const response = await axios.get(`${API_URL}/asset/${ticker}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching asset:", error);
    return null;
  }
};

export const startScanner = async (config) => {
  const response = await axios.post(`${API_URL}/scanner/start`, config);
  return response.data;
};

export const getScannerStatus = async (taskId) => {
  const response = await axios.get(`${API_URL}/scanner/status/${taskId}`);
  return response.data;
};