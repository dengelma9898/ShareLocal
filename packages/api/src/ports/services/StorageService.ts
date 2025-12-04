// Port: Storage Service Interface
// Kann später durch verschiedene Implementierungen ersetzt werden (S3, Local, etc.)

export interface StorageService {
  /**
   * Uploads an image file to storage
   * @param file Buffer containing the image data
   * @param filename Original filename
   * @param mimetype MIME type of the file (e.g., 'image/jpeg')
   * @returns Promise resolving to the public URL of the uploaded image
   */
  uploadImage(file: Buffer, filename: string, mimetype: string): Promise<string>;

  /**
   * Deletes an image from storage
   * @param url The public URL of the image to delete
   * @returns Promise resolving when deletion is complete
   */
  deleteImage(url: string): Promise<void>;
}


