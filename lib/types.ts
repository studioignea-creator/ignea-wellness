export type MetodoPago = "efectivo" | "tarjeta" | "transferencia";
export type Moneda = "MXN" | "USD";

export interface VentaItem {
  servicio: string;
  monto: number;
}

export interface Venta {
  id: string;
  created_at: string;
  cliente_nombre: string;
  servicio: string;
  es_paquete: boolean;
  monto: number;
  moneda: Moneda;
  metodo_pago: MetodoPago;
  notas: string | null;
  calendly_event_uuid: string | null;
  items: VentaItem[] | null;
  user_id: string;
}

export interface Producto {
  id: string;
  created_at: string;
  updated_at: string;
  marca: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  unidad: string;
  pedir: boolean;
  notas: string | null;
}

export interface CalendlyEvent {
  calendly_uuid: string;
  start_time: string;
  end_time: string;
  status: "active" | "canceled";
  invitee_name: string | null;
  invitee_email: string | null;
  event_type_name: string | null;
  location: string | null;
  synced_at: string;
  asistio?: boolean | null;
  tiene_venta?: boolean;
  monto_venta?: number | null;
  moneda_venta?: string | null;
}

export interface VentaFilters {
  from?: string;
  to?: string;
  metodo?: MetodoPago | "";
}

export type CategoriaGasto = "publicidad" | "renta" | "suministros" | "personal" | "servicios" | "otros";

export interface Gasto {
  id: string;
  fecha: string;
  categoria: CategoriaGasto;
  descripcion: string | null;
  monto: number;
  created_at: string;
}
