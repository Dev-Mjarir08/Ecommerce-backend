import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

class DashboardService {
  /**
   * Admin: Aggregates system metrics (revenue, counts, stocks, recent activities).
   */
  async getDashboardAnalytics() {
    // Run ALL independent queries in parallel (was partially sequential)
    const [usersCount, productsCount, ordersCount, outOfStockCount, orderAggregation, recentOrders] = await Promise.all([
      User.countDocuments({ role: 'User' }),
      Product.countDocuments({}),
      Order.countDocuments({}),
      Product.countDocuments({ stock: 0 }),
      // Combined $facet pipeline: revenue + monthly stats in a single DB scan (was 2 separate aggregations)
      Order.aggregate([
        { $match: { isPaid: true } },
        {
          $facet: {
            revenue: [
              { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
            ],
            monthlySales: [
              {
                $group: {
                  _id: { $month: '$createdAt' },
                  totalSales: { $sum: '$totalPrice' },
                  orderCount: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ]),
      Order.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalRevenue = orderAggregation[0]?.revenue[0]?.totalRevenue || 0;
    const monthlySalesStats = orderAggregation[0]?.monthlySales || [];

    return {
      usersCount,
      productsCount,
      ordersCount,
      outOfStockCount,
      totalRevenue,
      monthlySalesStats,
      recentOrders,
    };
  }
}

export default new DashboardService();
