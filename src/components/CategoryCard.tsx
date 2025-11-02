import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';

interface CategoryCardProps {
  name: string;
  slug: string;
  image: string;
}

export function CategoryCard({ name, slug, image }: CategoryCardProps) {
  return (
    <Link href={`/category/${slug}`} data-testid={`link-category-${slug}`}>
      <div className="cursor-pointer">
        <Card className="group overflow-hidden border-2 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 hover-elevate transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="relative h-96 overflow-hidden">
            <Image
              src={image}
              alt={name}
              width={600}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              data-testid={`img-category-${slug}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h3 className="font-serif text-4xl font-light text-white mb-2">{name}</h3>
              <p className="text-white/80 text-sm">Explore Collection</p>
            </div>
          </div>
        </Card>
      </div>
    </Link>
  );
}
