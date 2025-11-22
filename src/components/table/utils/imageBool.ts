export function isImage(val: any): boolean {
   // Case 1: Array of images
  if (Array.isArray(val)) {
    return val.length > 0 && val.every(isImage);
  }

  // Case 2: Curly-braced/comma-separated string (e.g., "{http://img1.jpg,http://img2.png}")
  if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
    const urls = val.replace(/[{}]/g, '').split(',').map(s => s.trim());
    return urls.length > 0 && urls.every(isImage);
  }

  // Case 3: Base64-encoded JSON array string
  if (typeof val === 'string' && /^[A-Za-z0-9+/=]+$/.test(val) && val.length % 4 === 0) {
    try {
      // Try to decode and parse as JSON array
      const decoded = atob(val);
      const arr = JSON.parse(decoded);
      return Array.isArray(arr) && arr.length > 0 && arr.every(isImage);
    } catch {
      // Not a valid base64-encoded JSON array
    }
  }

  // Case 4: Plain string image URL
  if (typeof val === 'string') {
    // Accept http(s) links with common image extensions, case-insensitive
    return /^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(val.trim());
  }

  return false;
}

export function extractImageUrls(val: any): string[] {
  // Array of URLs
  if (Array.isArray(val)) return val.filter(isUrl);

  // Curly-braced/comma-separated
  if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
    return val.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(isUrl);
  }

  // Base64-encoded JSON array string
  if (typeof val === 'string' && /^[A-Za-z0-9+/=]+$/.test(val) && val.length % 4 === 0) {
      const decoded = atob(val);
      const arr = JSON.parse(decoded);
      if (Array.isArray(arr)) return arr.filter(isUrl);
  }

  // Plain string image URL
  if (typeof val === 'string' && isUrl(val)) return [val.trim()];

  return [];
}

function isUrl(url: string) {
  return /^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(url.trim());
}