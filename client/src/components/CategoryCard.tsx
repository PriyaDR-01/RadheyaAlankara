import { Link } from 'wouter';
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
        <Card className="group overflow-hidden border-card-border hover-elevate transition-all duration-300">
          <div className="relative h-96 overflow-hidden">
            <img
              src={image}
              alt={name}
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
