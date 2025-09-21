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
      
      // Verify input file exists
      if (!fs.existsSync(originalPath)) {
        throw new Error(`Input file not found: ${originalPath}`);
      }

      // Create presentation-specific directory
      const presentationDir = path.join(this.processedDir, presentationId);
      if (!fs.existsSync(presentationDir)) {
        fs.mkdirSync(presentationDir, { recursive: true });
        console.log(`Created presentation directory: ${presentationDir}`);
      }

      // Convert PowerPoint to HTML using LibreOffice
      const htmlPath = path.join(presentationDir, 'presentation.html');
      console.log(`Converting to HTML: ${originalPath} -> ${htmlPath}`);
      
      await this.convertToHTML(originalPath, htmlPath);
      
      // Generate a simple thumbnail from the first slide
      const thumbnailPath = path.join(presentationDir, 'thumbnail.jpg');
      await this.generateThumbnail(originalPath, thumbnailPath);

      console.log(`Presentation processing completed successfully`);

      return {
        slides: [{
          slideNumber: 1,
          imagePath: `presentations/processed/${presentationId}/presentation.html`,
          thumbnailPath: `presentations/processed/${presentationId}/thumbnail.jpg`,
          type: 'html'
        }],
        thumbnail: `presentations/processed/${presentationId}/thumbnail.jpg`,
        totalSlides: 1,
        htmlPath: `presentations/processed/${presentationId}/presentation.html`
      };

    } catch (error) {
      console.error('Error processing presentation:', error);
      throw error;
    }
  }

  async convertToHTML(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
      }

      const command = `libreoffice --headless --convert-to html --outdir "${outputDir}" "${inputPath}"`;
      console.log(`Executing LibreOffice command: ${command}`);
      
      exec(command, { 
        timeout: 60000,
        cwd: process.cwd()
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('LibreOffice conversion error:', error);
          console.error('LibreOffice stderr:', stderr);
          reject(new Error(`Failed to convert presentation to HTML: ${error.message}`));
          return;
        }
        
        console.log('LibreOffice stdout:', stdout);
        if (stderr) {
          console.log('LibreOffice stderr:', stderr);
        }
        
        // Wait for file system sync
        setTimeout(() => {
          // Check if HTML was created
          if (fs.existsSync(outputPath)) {
            console.log(`HTML created successfully: ${outputPath}`);
            resolve(outputPath);
          } else {
            // Check if HTML was created with a different name
            const dir = path.dirname(outputPath);
            const files = fs.readdirSync(dir);
            const htmlFiles = files.filter(file => file.endsWith('.html'));
            
            console.log(`Files in output directory: ${files}`);
            console.log(`HTML files found: ${htmlFiles}`);
            
            if (htmlFiles.length > 0) {
              const actualHtmlPath = path.join(dir, htmlFiles[0]);
              console.log(`HTML created with different name: ${actualHtmlPath}`);
              // Rename to expected name
              try {
                fs.renameSync(actualHtmlPath, outputPath);
                console.log(`Renamed HTML to: ${outputPath}`);
                resolve(outputPath);
              } catch (renameError) {
                console.error('Error renaming HTML:', renameError);
                reject(new Error(`Failed to rename HTML file: ${renameError.message}`));
              }
            } else {
              console.error('No HTML files found in directory:', dir);
              console.error('Files in directory:', files);
              reject(new Error('HTML conversion failed - output file not found'));
            }
          }
        }, 2000); // Wait 2 seconds for file system sync
      });
    });
  }

  async generateThumbnail(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      // Use LibreOffice to generate a thumbnail
      const command = `libreoffice --headless --convert-to png --outdir "${path.dirname(outputPath)}" "${inputPath}"`;
      console.log(`Generating thumbnail: ${command}`);
      
      exec(command, { 
        timeout: 30000,
        cwd: process.cwd()
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('Thumbnail generation error:', error);
          console.error('Thumbnail stderr:', stderr);
          // Don't fail the entire process if thumbnail generation fails
          console.log('Thumbnail generation failed, but continuing...');
          resolve();
          return;
        }

        console.log('Thumbnail stdout:', stdout);
        if (stderr) {
          console.log('Thumbnail stderr:', stderr);
        }

        // Wait for file system sync
        setTimeout(() => {
          const dir = path.dirname(outputPath);
          const files = fs.readdirSync(dir);
          const pngFiles = files.filter(file => file.endsWith('.png'));
          
          if (pngFiles.length > 0) {
            const actualPngPath = path.join(dir, pngFiles[0]);
            try {
              fs.renameSync(actualPngPath, outputPath);
              console.log(`Thumbnail generated: ${outputPath}`);
              resolve();
            } catch (renameError) {
              console.error('Error renaming thumbnail:', renameError);
              resolve(); // Don't fail the process
            }
          } else {
            console.log('No PNG files found for thumbnail, but continuing...');
            resolve(); // Don't fail the process
          }
        }, 1000);
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
