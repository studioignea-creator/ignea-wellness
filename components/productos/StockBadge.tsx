import { Badge } from "@/components/ui/badge";

interface Props {
  actual: number;
  minimo: number;
}

export default function StockBadge({ actual, minimo }: Props) {
  if (actual === 0) return <Badge variant="danger">Sin stock</Badge>;
  if (actual <= minimo) return <Badge variant="warning">Stock bajo</Badge>;
  return <Badge variant="success">OK</Badge>;
}
