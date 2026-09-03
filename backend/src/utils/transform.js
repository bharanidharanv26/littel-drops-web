/**
 * Transform a MongoDB document to include an `id` field derived from `_id`.
 * This ensures frontend consistency with the expected `id` property.
 * Also strips sensitive fields like passwordHash.
 */
export function transformDoc(doc) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  // Always set id from _id
  if (obj._id) {
    obj.id = typeof obj._id === 'string' ? obj._id : obj._id.toString();
  }
  // Safety: never return password hashes or version keys
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
}

/**
 * Transform an array of MongoDB documents.
 */
export function transformDocs(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.map(transformDoc);
}
