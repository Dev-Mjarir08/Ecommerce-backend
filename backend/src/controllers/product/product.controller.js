import productService from '../../services/product.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class ProductController {
  /**
   * Admin: Creates a new product catalog listing.
   */
  create = asyncHandler(async (req, res) => {
    const imageFiles = req.files; // Array of files populated by Multer
    const product = await productService.createProduct(req.body, imageFiles);

    res.status(201).json(
      new ApiResponse(201, product, 'Product created successfully.')
    );
  });

  /**
   * Admin: Creates multiple products in a single batch operation.
   */
  bulkCreate = asyncHandler(async (req, res) => {
    const { products } = req.body;
    const createdProducts = await productService.bulkCreateProducts(products);

    res.status(201).json(
      new ApiResponse(201, createdProducts, `${createdProducts.length} products created successfully.`)
    );
  });

  /**
   * Public: Lists catalog products matching filters, pagination, and search terms.
   */
  list = asyncHandler(async (req, res) => {
    const result = await productService.getProducts(req.query);
    res.status(200).json(
      new ApiResponse(200, result, 'Products retrieved successfully.')
    );
  });

  /**
   * Public: Live search suggestions API.
   */
  search = asyncHandler(async (req, res) => {
    const { q } = req.query;
    const result = await productService.searchProducts(q);
    res.status(200).json(
      new ApiResponse(200, result, 'Search suggestions retrieved successfully.')
    );
  });

  /**
   * Public: Retrieves a single product catalog item by slug.
   */
  read = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const product = await productService.getProductBySlug(slug);

    res.status(200).json(
      new ApiResponse(200, product, 'Product details retrieved successfully.')
    );
  });

  /**
   * Admin: Updates an existing product listing.
   */
  update = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const imageFiles = req.files;

    const product = await productService.updateProduct(slug, req.body, imageFiles);

    res.status(200).json(
      new ApiResponse(200, product, 'Product updated successfully.')
    );
  });

  /**
   * Admin: Deletes a product catalog listing.
   */
  delete = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    await productService.deleteProduct(slug);

    res.status(200).json(
      new ApiResponse(200, null, 'Product deleted successfully.')
    );
  });

  /**
   * Admin: Deletes all products in the store catalog.
   */
  deleteAll = asyncHandler(async (req, res) => {
    const count = await productService.deleteAllProducts();
    res.status(200).json(
      new ApiResponse(200, { deletedCount: count }, `All ${count} products deleted successfully.`)
    );
  });

  /**
   * Customer: Submits a review and rating for a product.
   */
  createReview = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    const userName = req.user.name;

    const product = await productService.createProductReview(
      slug,
      userId,
      userName,
      rating,
      comment
    );

    res.status(201).json(
      new ApiResponse(201, product, 'Review added successfully.')
    );
  });
}

export default new ProductController();
