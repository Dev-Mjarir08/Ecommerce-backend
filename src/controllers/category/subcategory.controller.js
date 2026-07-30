import subcategoryService from '../../services/subcategory.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class SubCategoryController {
  create = asyncHandler(async (req, res) => {
    const subCategory = await subcategoryService.createSubCategory(req.body);
    res.status(201).json(new ApiResponse(201, subCategory, 'Subcategory created successfully.'));
  });

  bulkCreate = asyncHandler(async (req, res) => {
    const { subCategories } = req.body;
    const created = await subcategoryService.bulkCreateSubCategories(subCategories);
    res.status(201).json(new ApiResponse(201, created, `${created.length} subcategories created successfully.`));
  });

  list = asyncHandler(async (req, res) => {
    const { category } = req.query;
    const subCategories = await subcategoryService.getSubCategories(category);
    res.status(200).json(new ApiResponse(200, subCategories, 'Subcategories retrieved successfully.'));
  });

  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const subCategory = await subcategoryService.updateSubCategory(id, req.body);
    res.status(200).json(new ApiResponse(200, subCategory, 'Subcategory updated successfully.'));
  });

  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await subcategoryService.deleteSubCategory(id);
    res.status(200).json(new ApiResponse(200, null, 'Subcategory deleted successfully.'));
  });

  deleteAll = asyncHandler(async (req, res) => {
    const count = await subcategoryService.deleteAllSubCategories();
    res.status(200).json(new ApiResponse(200, { deletedCount: count }, `All ${count} subcategories deleted successfully.`));
  });
}

export default new SubCategoryController();
