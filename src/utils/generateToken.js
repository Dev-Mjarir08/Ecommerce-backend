/**
 * Generates Access and Refresh Tokens, stores the Refresh Token in the database,
 * and sets them as secure HTTP-Only cookies on the response object.
 *
 * @param {Object} user - User Mongoose Document
 * @param {Object} res - Express Response Object
 * @returns {Promise<Object>} Object containing accessToken and refreshToken
 */
const generateTokensAndSetCookies = async (user, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save the refresh token to the user document
  user.refreshToken = refreshToken;
  // Use save() but bypass standard validations since we are only modifying the token
  await user.save({ validateBeforeSave: false });

  // Cookie options
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: (parseInt(process.env.COOKIE_EXPIRE_DAYS) || 7) * 24 * 60 * 60 * 1000,
  };

  // Set HTTP-Only cookies
  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for refresh token
  });

  return { accessToken, refreshToken };
};

export default generateTokensAndSetCookies;
