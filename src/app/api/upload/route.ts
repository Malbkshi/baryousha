import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename using timestamp
    const ext = file.name.split('.').pop() || 'png';
    const filename = `upload-${Date.now()}.${ext}`;

    // Path to public/images
    const publicImagesDir = path.join(process.cwd(), 'public', 'images');
    
    // Ensure directory exists
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }

    const filePath = path.join(publicImagesDir, filename);

    // Save the file
    fs.writeFileSync(filePath, buffer);

    // Return the public URL
    return NextResponse.json({ url: `/images/${filename}` });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
