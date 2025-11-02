import { NextRequest, NextResponse } from 'next/server';
import { loadData } from '@/lib/data-loader';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { products } = loadData();
    const product = products.find(p => p.id === params.id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
