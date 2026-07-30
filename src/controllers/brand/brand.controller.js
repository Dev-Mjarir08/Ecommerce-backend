import brandService from '../../services/brand.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class BrandController {
  create = asyncHandler(async (req, res) => {
    const logoFile = req.file;
    const brand = await brandService.createBrand(req.body, logoFile);
    res.status(201).json(new ApiResponse(201, brand, 'Brand created successfully.'));
  });

  bulkCreate = asyncHandler(async (req, res) => {
    const { brands } = req.body;
    const created = await brandService.bulkCreateBrands(brands);
    res.status(201).json(new ApiResponse(201, created, `${created.length} brands created successfully.`));
  });

  list = asyncHandler(async (req, res) => {
    const { category } = req.query;
    const brands = await brandService.getBrands(category);
    res.status(200).json(new ApiResponse(200, brands, 'Brands retrieved successfully.'));
  });

  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const logoFile = req.file;
    const brand = await brandService.updateBrand(id, req.body, logoFile);
    res.status(200).json(new ApiResponse(200, brand, 'Brand updated successfully.'));
  });

  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await brandService.deleteBrand(id);
    res.status(200).json(new ApiResponse(200, null, 'Brand deleted successfully.'));
  });

  deleteAll = asyncHandler(async (req, res) => {
    const count = await brandService.deleteAllBrands();
    res.status(200).json(new ApiResponse(200, { deletedCount: count }, `All ${count} brands deleted successfully.`));
  });
}

export default new BrandController();
