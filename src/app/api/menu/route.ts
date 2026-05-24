import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const filePath = path.join(process.cwd(), 'src', 'data', 'menu.json');
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read menu data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const filePath = path.join(process.cwd(), 'src', 'data', 'menu.json');
  try {
    const newData = await request.json();
    if (!newData.categories) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to write menu data' }, { status: 500 });
  }
}
