import categoryService from '../../services/category.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class CategoryController {
  /**
   * Admin: Creates a new category.
   */
  create = asyncHandler(async (req, res) => {
    const { name, description, imageUrl, image } = req.body;
    const imageFile = req.file;

    const category = await categoryService.createCategory({ name, description, imageUrl, image }, imageFile);

    res.status(201).json(
      new ApiResponse(201, category, 'Category created successfully.')
    );
  });

  /**
   * Admin: Creates multiple categories in a single batch.
   */
  bulkCreate = asyncHandler(async (req, res) => {
    const { categories } = req.body;
    const created = await categoryService.bulkCreateCategories(categories);
    res.status(201).json(
      new ApiResponse(201, created, `${created.length} categories created successfully.`)
    );
  });

  /**
   * Public: Lists all categories.
   */
  list = asyncHandler(async (req, res) => {
    const categories = await categoryService.getCategories();
    res.status(200).json(
      new ApiResponse(200, categories, 'Categories retrieved successfully.')
    );
  });

  /**
   * Public: Retrieves a single category by slug.
   */
  read = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);

    res.status(200).json(
      new ApiResponse(200, category, 'Category details retrieved successfully.')
    );
  });

  /**
   * Admin: Updates an existing category.
   */
  update = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { name, description, imageUrl, image } = req.body;
    const imageFile = req.file;

    const updatedCategory = await categoryService.updateCategory(
      slug,
      { name, description, imageUrl, image },
      imageFile
    );

    res.status(200).json(
      new ApiResponse(200, updatedCategory, 'Category updated successfully.')
    );
  });

  /**
   * Admin: Deletes a category.
   */
  delete = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    await categoryService.deleteCategory(slug);

    res.status(200).json(
      new ApiResponse(200, null, 'Category deleted successfully.')
    );
  });

  /**
   * Admin: Deletes all categories.
   */
  deleteAll = asyncHandler(async (req, res) => {
    const count = await categoryService.deleteAllCategories();
    res.status(200).json(
      new ApiResponse(200, { deletedCount: count }, `All ${count} categories deleted successfully.`)
    );
  });
}

export default new CategoryController();
