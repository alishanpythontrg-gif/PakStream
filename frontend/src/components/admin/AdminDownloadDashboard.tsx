import React, { useState, useEffect } from 'react';
import downloadService from '../../services/downloadService';
import { VideoDownload, DownloadStats } from '../../types/download';

const AdminDownloadDashboard: React.FC = () => {
  const [downloads, setDownloads] = useState<VideoDownload[]>([]);
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  
  // Filters
  const [userIdFilter, setUserIdFilter] = useState('');
  const [videoIdFilter, setVideoIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('downloadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchStats();
    fetchDownloads();
  }, [currentPage, limit, userIdFilter, videoIdFilter, startDate, endDate, sortBy, sortOrder]);

  const fetchStats = async () => {
    try {
      const response = await downloadService.getDownloadStats();
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      const response = await downloadService.getAllDownloads({
        page: currentPage,
        limit,
        userId: userIdFilter || undefined,
        videoId: videoIdFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder
      });
      setDownloads(response.data.downloads);
      setTotalPages(response.data.pagination.pages);
      setTotal(response.data.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch downloads');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setUserIdFilter('');
    setVideoIdFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-netflix-gray rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Total Downloads</div>
            <div className="text-3xl font-bold text-white">{stats.totalDownloads.toLocaleString()}</div>
          </div>
          
          <div className="bg-netflix-gray rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Top Video</div>
            <div className="text-lg font-semibold text-white truncate">
              {stats.downloadsPerVideo[0]?.videoTitle || 'N/A'}
            </div>
            <div className="text-sm text-gray-400">
              {stats.downloadsPerVideo[0]?.downloadCount || 0} downloads
            </div>
          </div>
          
          <div className="bg-netflix-gray rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Top User</div>
            <div className="text-lg font-semibold text-white truncate">
              {stats.downloadsPerUser[0]?.username || 'N/A'}
            </div>
            <div className="text-sm text-gray-400">
              {stats.downloadsPerUser[0]?.downloadCount || 0} downloads
            </div>
          </div>
          
          <div className="bg-netflix-gray rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Last 30 Days</div>
            <div className="text-3xl font-bold text-white">
              {stats.downloadsOverTime.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-netflix-gray rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">User ID</label>
            <input
              type="text"
              value={userIdFilter}
              onChange={(e) => {
                setUserIdFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by user ID"
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-red-600"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Video ID</label>
            <input
              type="text"
              value={videoIdFilter}
              onChange={(e) => {
                setVideoIdFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by video ID"
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-red-600"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-red-600"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-red-600"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Downloads Table */}
      <div className="bg-netflix-gray rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Download History</h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-400">Per page:</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 bg-black border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-red-600"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900 bg-opacity-50 text-red-200 border-l-4 border-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Loading downloads...</p>
          </div>
        ) : downloads.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No downloads found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black bg-opacity-50">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white"
                      onClick={() => handleSort('user')}
                    >
                      Name {sortBy === 'user' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Organization
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Contact Number
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white"
                      onClick={() => handleSort('video')}
                    >
                      Video {sortBy === 'video' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white"
                      onClick={() => handleSort('downloadedAt')}
                    >
                      Download Date {sortBy === 'downloadedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {downloads.map((download) => {
                    if (!download.user || !download.video) {
                      return (
                        <tr key={download._id} className="hover:bg-gray-800 transition-colors">
                          <td colSpan={7} className="px-4 py-3 text-sm text-gray-500 italic text-center">
                            {!download.user && !download.video 
                              ? 'User and video deleted' 
                              : !download.user 
                              ? 'User deleted' 
                              : 'Video deleted'}
                          </td>
                        </tr>
                      );
                    }

                    const fullName = download.user.profile?.firstName && download.user.profile?.lastName
                      ? `${download.user.profile.firstName} ${download.user.profile.lastName}`
                      : download.user.username;
                    
                    return (
                      <tr key={download._id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-3 text-sm text-white">
                          <div className="font-medium">{fullName}</div>
                          <div className="text-xs text-gray-400">{download.user.email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {download.user.organization || <span className="text-gray-500">-</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300 max-w-xs">
                          {download.user.address ? (
                            <div className="truncate" title={download.user.address}>
                              {download.user.address}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {download.user.contactNumber || <span className="text-gray-500">-</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {download.video ? (
                            <>
                              <div className="font-medium">{download.video.title}</div>
                              <div className="text-xs text-gray-400">ID: {download.video._id}</div>
                            </>
                          ) : (
                            <div className="text-gray-500 italic">Video deleted</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {formatDate(download.downloadedAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {download.ipAddress || 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of {total} downloads
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-white">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDownloadDashboard;

