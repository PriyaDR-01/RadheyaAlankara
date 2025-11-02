import { NextResponse } from 'next/server';
import { loadData } from '@/lib/data-loader';

export async function GET() {
  try {
    const { products } = loadData();
    const bestSellers = products.filter(p => p.isBestSeller === 1);
    return NextResponse.json(bestSellers);
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch best sellers' },
      { status: 500 }
    );
  }
}
