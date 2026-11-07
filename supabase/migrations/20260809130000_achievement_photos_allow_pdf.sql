-- Achievement attachments can be a photo or a PDF certificate. Without this the bucket (which may carry an
-- image-only mime list on the server) rejects PDF uploads.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif', 'application/pdf'],
    file_size_limit = 10485760
WHERE id = 'achievement-photos';
