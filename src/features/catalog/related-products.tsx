import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/features/catalog/product-card";
import { getRelatedProducts } from "@/features/catalog/data";

export async function RelatedProducts({
  productId,
  categoryId,
}: {
  productId: string;
  categoryId: string;
}) {
  let products;
  try {
    products = await getRelatedProducts(productId, categoryId);
  } catch {
    return null;
  }
  if (!products.length)
    return (
      <EmptyState
        title="Mais produtos a caminho"
        description="Estamos a preparar outras opções desta categoria."
      />
    );
  return (
    <div className="catalog-product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
