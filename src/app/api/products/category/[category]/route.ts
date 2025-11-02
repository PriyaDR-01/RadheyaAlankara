import { NextRequest, NextResponse } from 'next/server';
import { loadData } from '@/lib/data-loader';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const { products } = loadData();
    const categoryProducts = products.filter(p => p.category === params.category);
    return NextResponse.json(categoryProducts);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products by category' },
      { status: 500 }
    );
  }
}
