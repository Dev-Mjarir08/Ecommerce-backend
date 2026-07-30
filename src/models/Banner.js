import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required.'],
      trim: true,
    },
    image: {
      url: {
        type: String,
        required: [true, 'Banner image url is required.'],
      },
      publicId: {
        type: String,
        required: [true, 'Banner image publicId is required.'],
      },
    },
    link: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

const Banner = mongoose.model('Banner', BannerSchema);

export default Banner;
