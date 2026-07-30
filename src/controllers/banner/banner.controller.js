import bannerService from '../../services/banner.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class BannerController {
  /**
   * Admin: Creates a new promotion banner.
   */
  create = asyncHandler(async (req, res) => {
    const { title, link, imageUrl, image } = req.body;
    const imageFile = req.file;

    const banner = await bannerService.createBanner({ title, link, imageUrl, image }, imageFile);

    res.status(201).json(
      new ApiResponse(201, banner, 'Banner created successfully.')
    );
  });

  /**
   * Admin: Creates multiple banners in a single batch.
   */
  bulkCreate = asyncHandler(async (req, res) => {
    const { banners } = req.body;
    const created = await bannerService.bulkCreateBanners(banners);
    res.status(201).json(
      new ApiResponse(201, created, `${created.length} banners created successfully.`)
    );
  });

  /**
   * Public: Lists active promo banners.
   */
  listActive = asyncHandler(async (req, res) => {
    const banners = await bannerService.getBanners(true);
    res.status(200).json(
      new ApiResponse(200, banners, 'Promo banners retrieved successfully.')
    );
  });

  /**
   * Admin: Lists all banners (including inactive).
   */
  listAll = asyncHandler(async (req, res) => {
    const banners = await bannerService.getBanners(false);
    res.status(200).json(
      new ApiResponse(200, banners, 'All banners retrieved successfully.')
    );
  });

  /**
   * Admin: Updates banner properties and image.
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, link, isActive, imageUrl, image } = req.body;
    const imageFile = req.file;

    const updatedBanner = await bannerService.updateBanner(
      id,
      { title, link, isActive, imageUrl, image },
      imageFile
    );

    res.status(200).json(
      new ApiResponse(200, updatedBanner, 'Banner updated successfully.')
    );
  });

  /**
   * Admin: Deletes promo banner.
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await bannerService.deleteBanner(id);

    res.status(200).json(
      new ApiResponse(200, null, 'Banner deleted successfully.')
    );
  });

  /**
   * Admin: Deletes all promotional banners.
   */
  deleteAll = asyncHandler(async (req, res) => {
    const count = await bannerService.deleteAllBanners();
    res.status(200).json(
      new ApiResponse(200, { deletedCount: count }, `All ${count} banners deleted successfully.`)
    );
  });
}

export default new BannerController();
