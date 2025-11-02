import { NextRequest, NextResponse } from 'next/server';
import { loadData } from '@/lib/data-loader';

export async function GET() {
  try {
    const { products } = loadData();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
