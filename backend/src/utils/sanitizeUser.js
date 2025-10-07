const { hasImageData, imageToDataUrl } = require('./image');

function sanitizeUser(userDoc, { includeImageData = false } = {}) {
  if (!userDoc) return null;

  const source = typeof userDoc.toObject === 'function'
    ? userDoc.toObject({ getters: true })
    : { ...userDoc };

  const { password, img, _id, id, __v, passwordResetToken, passwordResetExpires, ...safe } = source;
  const userId = _id?.toString?.() || id;

  if (userId && !safe.id) {
    safe.id = userId;
  }

  safe.hasAvatar = false;
  safe.avatarPath = safe.avatarPath ?? null;
  safe.avatarContentType = safe.avatarContentType ?? null;

  if (hasImageData(img)) {
    safe.hasAvatar = true;
    if (userId) {
      safe.avatarPath = `/users/${userId}/avatar`;
    }
    safe.avatarContentType = img?.contentType || safe.avatarContentType;

    if (includeImageData) {
      safe.image = imageToDataUrl(img);
    } else if (safe.image && typeof safe.image !== 'string') {
      delete safe.image;
    }
  } else if (!includeImageData && safe.image) {
    delete safe.image;
  }

  return safe;
}

module.exports = {
  sanitizeUser
};
