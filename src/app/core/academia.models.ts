export type Modalidad = 'ONLINE' | 'PRESENTIAL' | 'HYBRID';
export type EstadoCurso = 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'INACTIVE';
export type EstadoCategoria = 'ACTIVE' | 'INACTIVE';

export interface Categoria {
  id: string;
  name: string;
  description?: string | null;
  status: EstadoCategoria;
}
export interface Horario {
  id: string;
  courseId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string | null;
}
export interface Sede {
  id: string;
  courseId: string;
  name: string;
  address?: string | null;
  city?: string | null;
  reference?: string | null;
  capacity?: number | null;
}
export interface Curso {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  modality: Modalidad;
  price: number;
  currency: string;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  durationHours?: number | null;
  capacity: number;
  availableSlots: number;
  status: EstadoCurso;
  categoryId?: string;
  categories?: Categoria[];
  schedules?: Horario[];
  locations?: Sede[];
  createdAt?: string;
  updatedAt?: string;
}
export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
export interface Sugerencia { id: string; code: string; name: string; }
export interface Pago {
  id: number;
  monto: number;
  estado: 'EN_PROCESO' | 'PAGADO' | 'CANCELADO';
}
export interface Matricula {
  id: string;
  courseId: string;
  courseName: string;
  nombre: string;
  correo: string;
  tipoDocumento: string;
  documento: string;
  telefono: string;
  fecha: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';
  importe: number;
  origen: 'DEMO';
}
export interface DiagnosticoApi {
  nombre: string;
  estado: 'online' | 'offline';
  detalle: string;
}
