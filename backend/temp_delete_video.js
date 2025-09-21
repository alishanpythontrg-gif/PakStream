const deleteVideo = async (req, res) => {
  try {
    // Find video - allow admin to delete any video, regular users can only delete their own
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user is admin or the video owner
    const isAdmin = req.user.role === 'admin';
    const isOwner = video.uploadedBy.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own videos.'
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
      message: 'Video deleted successfully'
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
