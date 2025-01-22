// types.ts
export interface Usuario {
    id?: string;
    nombre_completo: string;
    email: string;
    rating_inicial?: number;
    club?: string | null;
}

export interface Torneo {
    id?: string;
    nombre: string;
    sede: string;
    fecha_inicio: string;
    fecha_fin: string;
    premio_dinero: number;
    puntos: number;
    imagen_url: string;
    tags: string[];
}

export interface Partido {
    id?: string;
    equipo_1: string[];
    equipo_2: string[];
    fecha_hora: string;
    resultado?: string;
    torneo: string;
}

export interface PendingApproval {
    id: string;
    type: 'ranking' | 'match' | 'tournament';
    title: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: string;
  }
  
export interface PartidoForm {
    equipo_1: string[];
    equipo_2: string[];
    fecha_hora: string;
    resultado?: string;
    torneo: string;
  }

  export interface UsuarioForm {
    nombre_completo: string;
    email: string;
    rating_inicial: number;
    club: string;
  }
  
  export interface TorneoForm {
    nombre: string;
    sede: string;
    fecha_inicio: string;
    fecha_fin: string;
    premio_dinero: number;
    puntos: number;
    imagen_url: string;
    tags: string[];
  }
  export interface PartidoCreate {
    torneo: string;
    equipo_1_ids: string[];
    equipo_2_ids: string[];
    fecha: string;
    hora: string;
    resultado?: string;
  }
  // src/lib/types.ts

export interface Aprobacion {
  id: number;
  tipo: 'tournament' | 'match';
  status: 'pending' | 'approved' | 'rejected';
  data: Record<string, any>;  // Aquí viene la info para crear Torneo o Partido
  created_at: string;         // Fecha de creación
}
