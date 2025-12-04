// API Client für Image Uploads
// Funktionen zum Hochladen von Bildern

import apiClient from './client';

export interface ImageUploadResponse {
  data: {
    url: string;
    filename: string;
    mimetype: string;
  };
}

/**
 * Lädt ein Bild hoch
 * @param file File-Objekt vom Input-Element
 * @returns Promise mit der URL des hochgeladenen Bildes
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post<ImageUploadResponse>(
    '/images/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data.url;
}


