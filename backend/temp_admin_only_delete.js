const deleteVideo = async (req, res) => {
  try {
    // Find video
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // ONLY admins can delete videos - no exceptions
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can delete videos.'
      });
    }

    // Delete files
    try {
      if (video.originalFile?.path) {
        await fs.unlink(video.originalFile.path);
        console.log(`Deleted original file: ${video.originalFile.path}`);
      }
      
      const processedDir = path.join(__dirname, '../../uploads/videos/processed', video._id.toString());
      try {
        await fs.rmdir(processedDir, { recursive: true });
        console.log(`Deleted processed directory: ${processedDir}`);
      } catch (dirError) {
        console.log(`Processed directory not found or already deleted: ${processedDir}`);
      }
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    await Video.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Video deleted successfully by administrator'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video',
      error: error.message
    });
  }
};
