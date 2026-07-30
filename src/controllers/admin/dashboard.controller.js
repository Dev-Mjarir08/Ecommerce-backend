import dashboardService from '../../services/dashboard.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class DashboardController {
  /**
   * Admin: Retrieves stats for the store dashboard.
   */
  getStats = asyncHandler(async (req, res) => {
    const stats = await dashboardService.getDashboardAnalytics();
    res.status(200).json(
      new ApiResponse(200, stats, 'Dashboard analytics retrieved successfully.')
    );
  });
}

export default new DashboardController();
