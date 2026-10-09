/**
 * Converts a File or Blob object to a Base64 encoded string.
 * @param file The File or Blob to convert.
 * @returns A promise that resolves with the Base64 string.
 */
export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the "data:image/jpeg;base64," prefix
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};
