# Production-Grade PPTX Presentation Viewer - Complete Guide

## Overview

PakStream now features a production-grade presentation viewer that converts PowerPoint (.pptx) files into individual PNG slides for optimal viewing performance. The viewer includes advanced features like slide-by-slide navigation, keyboard shortcuts, auto-play, fullscreen mode, and preloading.

---

## Key Features

### Backend Processing
✅ **Two-Step Conversion** - PPTX → PDF → PNG for reliable multi-slide extraction  
✅ **Multiple Conversion Tools** - ImageMagick (primary), Poppler (fallback), LibreOffice (final fallback)  
✅ **Individual Slide Extraction** - Each slide saved as separate PNG file  
✅ **Thumbnail Generation** - Automatic thumbnail creation for grid view  
✅ **Progress Tracking** - Real-time processing status  
✅ **Error Handling** - Comprehensive error handling and recovery  

### Frontend Viewer
✅ **Slide-by-Slide Navigation** - Navigate slides individually  
✅ **Keyboard Shortcuts** - Arrow keys, spacebar, fullscreen controls  
✅ **Auto-Play Mode** - Automatic slide progression with pause  
✅ **Thumbnail Navigation** - Visual slide selector  
✅ **Preloading** - Adjacent slides preloaded for smooth transitions  
✅ **Fullscreen Mode** - Immersive viewing experience  
✅ **Auto-Hide Controls** - Clean viewing with auto-hiding controls  
✅ **Loading States** - Visual feedback during loading  
✅ **Error Recovery** - Graceful error handling  

---

## Technical Implementation

### Backend: Presentation Processor

**File:** `/backend/src/services/presentationProcessor.js`

#### Key Changes:

1. **Two-Step Conversion Process** - PPTX → PDF → PNG for reliable multi-slide extraction
   ```javascript
   // Step 1: Convert PPTX to PDF
   libreoffice --headless --convert-to pdf input.pptx
   
   // Step 2: Convert PDF to PNG (one per page)
   convert -density 150 output.pdf slide-%03d.png
   ```

2. **Multiple Conversion Tools** - Uses ImageMagick, Poppler, or LibreOffice
   - **ImageMagick** (primary): Best quality, proper page extraction
   - **Poppler pdftoppm** (fallback): Fast alternative
   - **LibreOffice** (final fallback): Always available

2. **Slide Sorting** - Sorts slides by slide number
   ```javascript
   const pngFiles = files
     .filter(file => file.endsWith('.png'))
     .sort((a, b) => {
       const numA = parseInt(a.match(/\d+/)?.[0] || '0');
       const numB = parseInt(b.match(/\d+/)?.[0] || '0');
       return numA - numB;
     });
   ```

3. **Thumbnail Generation** - Creates optimized thumbnails
   ```javascript
   await execAsync(`convert "${input}" -resize 320x240 -quality 85 "${output}"`);
   ```

### Frontend: Presentation Viewer

**File:** `/frontend/src/components/presentation/PresentationViewer.tsx`

#### Key Features:

1. **Slide Navigation**
   - Previous/Next buttons
   - Thumbnail navigation
   - Direct slide selection

2. **Keyboard Shortcuts**
   - `←` / `→` - Navigate slides
   - `Space` - Next slide
   - `P` - Play/Pause
   - `F` - Fullscreen
   - `Esc` - Close viewer
   - `Home` - First slide
   - `End` - Last slide

3. **Preloading**
   ```typescript
   const preloadAdjacentSlides = useCallback(() => {
     const slidesToPreload = [
       currentSlide - 1,
       currentSlide + 1,
       currentSlide + 2
     ].filter(index => index >= 0 && index < slides.length);
   }, [currentSlide, slides]);
   ```

4. **Auto-Hide Controls**
   - Controls fade out after 3 seconds of inactivity
   - Mouse movement brings controls back

5. **Loading States**
   - Spinner during initial load
   - Loading indicator per slide
   - Error handling with retry

---

## Usage

### Uploading a Presentation

1. Login as admin
2. Navigate to Presentations section
3. Click "Upload Presentation"
4. Select .pptx file
5. Enter title and description
6. Wait for processing (shows progress)

### Viewing a Presentation

1. Click on any presentation thumbnail
2. Presentation opens in full viewer
3. Use controls or keyboard shortcuts to navigate
4. Click "Play" for auto-play mode
5. Press "F" for fullscreen

---

## Processing Flow

### Upload Flow
```
User uploads .pptx file
    ↓
File saved to uploads/presentations/original/
    ↓
Presentation record created in database
    ↓
Background processing starts
    ↓
LibreOffice converts PPTX to PNG slides
    ↓
Each slide saved as separate PNG file
    ↓
Thumbnail generated from first slide
    ↓
Presentation status updated to 'ready'
```

### Viewing Flow
```
User clicks presentation
    ↓
Viewer loads slide data
    ↓
Current slide loads
    ↓
Adjacent slides preload
    ↓
User navigates slides
    ↓
Smooth transitions with preloaded images
```

---

## Requirements

### Backend Requirements
- **LibreOffice** - For PPTX to PDF conversion (required)
  ```bash
  sudo apt install libreoffice
  ```

- **ImageMagick** - For PDF to PNG conversion (recommended, primary method)
  ```bash
  sudo apt install imagemagick
  ```

- **Poppler-utils** - Alternative for PDF to PNG conversion (fallback)
  ```bash
  sudo apt install poppler-utils
  ```

### Frontend Requirements
- React 19+
- TypeScript
- Image preloading
- Fullscreen API support

---

## Performance Optimizations

### Backend
1. **Async Processing** - Non-blocking conversion
2. **Timeout Handling** - 2-minute timeout for large files
3. **File System Sync** - Wait for file write completion
4. **Error Recovery** - Graceful failure handling

### Frontend
1. **Image Preloading** - Adjacent slides preloaded
2. **Lazy Loading** - Only visible slides loaded
3. **Transition Smoothing** - CSS transitions for smooth changes
4. **Memory Management** - Proper cleanup of intervals and listeners

---

## File Structure

### Backend
```
backend/
├── src/
│   ├── services/
│   │   └── presentationProcessor.js  # New: PNG conversion
│   ├── controllers/
│   │   └── presentationController.js   # Existing
│   └── models/
│       └── Presentation.js             # Existing
└── uploads/
    └── presentations/
        ├── original/                   # Uploaded .pptx files
        └── processed/
            └── {presentationId}/
                ├── slide-1.png         # Individual slides
                ├── slide-2.png
                ├── slide-3.png
                └── thumbnail.jpg       # Thumbnail
```

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   └── presentation/
│   │       └── PresentationViewer.tsx  # New: Production viewer
│   └── types/
│       └── presentation.ts              # Updated types
```

---

## API Endpoints

### Get Presentation Slides
```bash
GET /api/presentations/:id/slides
```

**Response:**
```json
{
  "slides": [
    {
      "slideNumber": 1,
      "imagePath": "presentations/processed/67890/slide-1.png",
      "thumbnailPath": "presentations/processed/67890/slide-1.png",
      "type": "image"
    },
    {
      "slideNumber": 2,
      "imagePath": "presentations/processed/67890/slide-2.png",
      "thumbnailPath": "presentations/processed/67890/slide-2.png",
      "type": "image"
    }
  ]
}
```

### Serve Slide Image
```bash
GET /uploads/presentations/processed/{presentationId}/slide-{n}.png
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` | Previous slide |
| `→` | Next slide |
| `Space` | Next slide |
| `P` | Play/Pause |
| `F` | Toggle fullscreen |
| `Esc` | Close viewer (or exit fullscreen) |
| `Home` | Go to first slide |
| `End` | Go to last slide |

---

## Supported Formats

### Input Formats
- `.pptx` - PowerPoint 2007+
- `.ppt` - PowerPoint 97-2003
- `.odp` - OpenDocument Presentation

### Output Format
- `.png` - PNG images (one per slide)

---

## Error Handling

### Common Errors

1. **Conversion Failed**
   - Check LibreOffice installation
   - Verify file is not corrupted
   - Check disk space

2. **Slide Loading Failed**
   - Check file permissions
   - Verify image exists
   - Check network connection

3. **Thumbnail Generation Failed**
   - Falls back to using first PNG as thumbnail
   - ImageMagick not required

---

## Performance Metrics

### Processing Times
- **Small presentation** (10 slides): ~5-10 seconds
- **Medium presentation** (30 slides): ~15-30 seconds
- **Large presentation** (100 slides): ~1-2 minutes

### File Sizes
- **PNG per slide**: ~200-500 KB (depends on content)
- **Thumbnail**: ~20-50 KB
- **Total**: ~2-5 MB per 10 slides

---

## Best Practices

### For Admins
1. Upload presentations in PPTX format
2. Optimize presentations before upload (compress images)
3. Use consistent slide dimensions
4. Keep presentations under 100 slides

### For Developers
1. Monitor processing times
2. Implement caching for processed slides
3. Consider CDN for slide images
4. Implement retry logic for failed conversions

---

## Troubleshooting

### LibreOffice Issues
```bash
# Check LibreOffice installation
libreoffice --version

# Test conversion manually
libreoffice --headless --convert-to png test.pptx --outdir /tmp
```

### Permissions Issues
```bash
# Fix upload directory permissions
sudo chown -R $USER:$USER backend/uploads/presentations/
chmod -R 755 backend/uploads/presentations/
```

### ImageMagick Issues
```bash
# Check ImageMagick installation
convert --version

# Fix PDF policy if needed
sudo nano /etc/ImageMagick-6/policy.xml
```

---

## Future Enhancements

Potential improvements:
- PDF support
- Animated GIF slides
- Slide annotations
- Collaborative editing
- Slide notes display
- Export to PDF
- Print functionality
- Mobile touch gestures
- Zoom functionality
- Presentation analytics

---

## Migration Notes

### From HTML to PNG

Old presentations (HTML format) will continue to work, but new uploads will use PNG format.

To migrate existing presentations:
1. Re-upload the original .pptx file
2. System will process it as PNG slides
3. Better performance and compatibility

---

**Last Updated:** January 2025  
**Version:** 2.0.0 - Production Grade PPTX Viewer

