const isArrayBuffer = (value) => value && typeof value === 'object' && value.constructor && value.constructor.name === 'ArrayBuffer';

const isTypedArray = (value) => value && typeof value === 'object' && ArrayBuffer.isView(value);

const isPlainObject = (value) => value && typeof value === 'object' && value.constructor === Object;

const fromBsonBinary = (value) => {
  if (!value || typeof value !== 'object' || value._bsontype !== 'Binary') {
    return null;
  }

  if (typeof value.value === 'function') {
    const resolved = value.value(true);
    if (Buffer.isBuffer(resolved)) {
      return Buffer.from(resolved);
    }
    if (isTypedArray(resolved) || Array.isArray(resolved)) {
      return Buffer.from(resolved);
    }
  }

  if (Buffer.isBuffer(value.buffer)) {
    return Buffer.from(value.buffer);
  }

  if (isTypedArray(value.buffer)) {
    return Buffer.from(value.buffer.buffer, value.buffer.byteOffset, value.buffer.byteLength);
  }

  if (Array.isArray(value.buffer)) {
    return Buffer.from(value.buffer);
  }

  if (Array.isArray(value.bytes)) {
    return Buffer.from(value.bytes);
  }

  return null;
};

const toBuffer = (data) => {
  if (!data) return null;

  if (Buffer.isBuffer(data)) {
    return data;
  }

  if (typeof data === 'string') {
    const trimmed = data.startsWith('data:') ? data.split(',')[1] : data;
    try {
      return Buffer.from(trimmed, 'base64');
    } catch (error) {
      return null;
    }
  }

  if (isArrayBuffer(data)) {
    return Buffer.from(data);
  }

  if (isTypedArray(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }

  const bsonBuffer = fromBsonBinary(data);
  if (bsonBuffer) {
    return bsonBuffer;
  }

  if (data?.type === 'Buffer' && Array.isArray(data.data)) {
    return Buffer.from(data.data);
  }

  if (isPlainObject(data) && Array.isArray(data.bytes)) {
    return Buffer.from(data.bytes);
  }

  if (isPlainObject(data) && typeof data.buffer === 'string') {
    try {
      return Buffer.from(data.buffer, 'base64');
    } catch (error) {
      return null;
    }
  }

  return null;
};

const hasImageData = (image = {}) => {
  if (!image) return false;

  if (typeof image === 'string' && image.startsWith('data:')) {
    return true;
  }

  return Boolean(toBuffer(image.data ?? image));
};

const imageToDataUrl = (image = {}) => {
  if (!image) return null;

  if (typeof image === 'string' && image.startsWith('data:')) {
    return image;
  }

  const payload = image && (image.data ?? image);
  const buffer = toBuffer(payload);

  if (!buffer) {
    return null;
  }

  const mime = image.contentType || image.type || 'image/png';
  return `data:${mime};base64,${buffer.toString('base64')}`;
};

module.exports = {
  toBuffer,
  hasImageData,
  imageToDataUrl
};
