// API route for image upload to Cloudinary
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'edge';

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  // Only allow image types
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image uploads allowed' }, { status: 400 });
  }
  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;
  try {
    const uploadRes = await cloudinary.uploader.upload(dataUri, {
      folder: 'unilife_uploads',
      resource_type: 'image',
    });
    return NextResponse.json({ url: uploadRes.secure_url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
