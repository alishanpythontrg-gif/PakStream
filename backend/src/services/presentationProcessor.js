const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class PresentationProcessor {
  constructor() {
    this.processedDir = path.join(__dirname, '../../uploads/presentations/processed');
  }

  async processPresentation(presentationId, originalPath) {
    try {
      console.log(`Processing presentation ${presentationId} from ${originalPath}`);
      
      // Create presentation-specific directory
      const presentationDir = path.join(this.processedDir, presentationId);
      if (!fs.existsSync(presentationDir)) {
        fs.mkdirSync(presentationDir, { recursive: true });
      }

      // Convert PowerPoint to images using LibreOffice
      const imagesDir = path.join(presentationDir, 'slides');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      const thumbnailsDir = path.join(presentationDir, 'thumbnails');
      if (!fs.existsSync(thumbnailsDir)) {
        fs.mkdirSync(thumbnailsDir, { recursive: true });
      }

      // Convert to PDF first, then to images
      const pdfPath = path.join(presentationDir, 'presentation.pdf');
      
      // Convert to PDF using LibreOffice
      await this.convertToPDF(originalPath, pdfPath);
      
      // Convert PDF to images using ImageMagick
      const slides = await this.convertPDFToImages(pdfPath, imagesDir, thumbnailsDir);
      
      // Generate presentation thumbnail (first slide)
      const thumbnailPath = path.join(presentationDir, 'thumbnail.jpg');
      if (slides.length > 0) {
        await this.generateThumbnail(slides[0].imagePath, thumbnailPath);
      }

      return {
        slides,
        thumbnail: `presentations/processed/${presentationId}/thumbnail.jpg`,
        totalSlides: slides.length
      };

    } catch (error) {
      console.error('Error processing presentation:', error);
      throw error;
    }
  }

  async convertToPDF(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      const command = `libreoffice --headless --convert-to pdf --outdir "${path.dirname(outputPath)}" "${inputPath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('LibreOffice conversion error:', error);
          reject(new Error(`Failed to convert presentation to PDF: ${error.message}`));
          return;
        }
        
        // Check if PDF was created
        if (fs.existsSync(outputPath)) {
          resolve(outputPath);
        } else {
          reject(new Error('PDF conversion failed - output file not found'));
        }
      });
    });
  }

  async convertPDFToImages(pdfPath, imagesDir, thumbnailsDir) {
    return new Promise((resolve, reject) => {
      const command = `convert -density 150 "${pdfPath}" -quality 90 "${path.join(imagesDir, 'slide_%d.jpg')}"`;
      
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error('ImageMagick conversion error:', error);
          reject(new Error(`Failed to convert PDF to images: ${error.message}`));
          return;
        }

        try {
          // Get list of generated images
          const files = fs.readdirSync(imagesDir);
          const slideImages = files
            .filter(file => file.startsWith('slide_') && file.endsWith('.jpg'))
            .sort((a, b) => {
              const aNum = parseInt(a.match(/\d+/)[0]);
              const bNum = parseInt(b.match(/\d+/)[0]);
              return aNum - bNum;
            });

          const slides = [];
          
          for (let i = 0; i < slideImages.length; i++) {
            const imageFile = slideImages[i];
            const imagePath = path.join(imagesDir, imageFile);
            const thumbnailFile = `thumb_${imageFile}`;
            const thumbnailPath = path.join(thumbnailsDir, thumbnailFile);
            
            // Create thumbnail using ImageMagick
            await this.createThumbnail(imagePath, thumbnailPath, 300, 200);
            
            slides.push({
              slideNumber: i + 1,
              imagePath: `presentations/processed/${path.basename(path.dirname(imagesDir))}/slides/${imageFile}`,
              thumbnailPath: `presentations/processed/${path.basename(path.dirname(imagesDir))}/thumbnails/${thumbnailFile}`
            });
          }

          resolve(slides);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  async createThumbnail(inputPath, outputPath, width, height) {
    return new Promise((resolve, reject) => {
      const command = `convert "${inputPath}" -resize ${width}x${height} -quality 80 "${outputPath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Thumbnail creation error:', error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async generateThumbnail(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      const command = `convert "${inputPath}" -resize 400x300 -quality 85 "${outputPath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Thumbnail generation error:', error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async cleanupTempFiles(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up temp file: ${filePath}`);
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }
}

module.exports = PresentationProcessor;
