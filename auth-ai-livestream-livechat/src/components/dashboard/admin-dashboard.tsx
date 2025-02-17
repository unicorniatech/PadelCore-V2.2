import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Activity,
  Trophy,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Bell,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// Importamos las funciones para aprobaciones y para CRUD de usuario/torneo/partido:
import {
  fetchAprobaciones,
  approveAprobacion,
  rejectAprobacion,
  createAprobacion,
  createUsuario,
  fetchTorneos,
  fetchUsuarios,
  fetchPartidos,
  fetchActividades
} from '@/lib/api';


// Importamos los tipos necesarios
import {
  Partido,
  Torneo,
  Usuario,
  Aprobacion,
  PartidoForm,
  UsuarioForm,
  TorneoForm,
  ActividadReciente,
} from '@/lib/types';

export function AdminDashboard() {
  const { toast } = useToast();

  // =========================================
  // Aprobaciones Reales (desde la base de datos)
  // =========================================
  const [pendingApprovals, setPendingApprovals] = useState<Aprobacion[]>([]);

  // =========================================
  // Actividad Reciente
  // =========================================
  const [actividades, setActividades] = useState<ActividadReciente[]>([]);
  //Para mostrar la cantidad:
  const [usuariosActivos, setUsuariosActivos] = useState<number>(0);
  const [partidosHoy, setPartidosHoy] = useState<number>(0);
  const [torneosActivos, setTorneosActivos] = useState<number>(0);

  // =========================================
  // Estados para formularios de Jugador, Torneo y Partido
  // =========================================
  const [playerData, setPlayerData] = useState<UsuarioForm>({
    nombre_completo: '',
    email: '',
    rating_inicial: 0,
    club: '',
    password: '',
    rol: 'usuario'
  });

  const [torneoData, setTorneoData] = useState<TorneoForm>({
    nombre: '',
    sede: '',
    fecha_inicio: '',
    fecha_fin: '',
    premio_dinero: 0,
    puntos: 0,
    imagen_url: '',
    tags: [''],
  });

  const [partidoData, setPartidoData] = useState<PartidoForm>({
    equipo_1: [],
    equipo_2: [],
    fecha_hora: '',
    resultado: '',
    torneo: '',
  });

  // Para búsqueda de jugadores (los checkboxes)
  const [searchEquipo1, setSearchEquipo1] = useState('');
  const [searchEquipo2, setSearchEquipo2] = useState('');

  // =========================================
  // Estados para listas reales del backend
  // =========================================
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);

  // =========================================
  // useEffect: cargar “Aprobaciones”
  // =========================================
  useEffect(() => {
    const loadAprobaciones = async () => {
      try {
        const data = await fetchAprobaciones(); // GET /aprobaciones/
        // Filtra las que están en estado 'pending'
        const pendientes = data.filter((item) => item.status === 'pending');
        setPendingApprovals(pendientes);
      } catch (error) {
        console.error('Error al cargar aprobaciones:', error);
      }
    };
    loadAprobaciones();
  }, []);
  /* 
      useEffect para Websocket
      Esto permitirá que, si otro admin crea o aprueba/rechaza,
      y que lo veas en vivo SIN refrescar.
      También te llegará el mensaje si tú mismo creas algo,  
  */
  // =========================================
  // WebSocket para “Aprobaciones”
  // =========================================
  useEffect(() => {
    // Abrimos el websocket
    const socket = new WebSocket('ws://127.0.0.1:8000/ws/aprobaciones/');
    // ^ Ajusta la URL a producción (wss://...) si corresponde
    socket.onopen = () => {
      console.log('WebSocket conectado a /ws/aprobaciones/');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as Aprobacion;
      console.log('Mensaje WS aprobaciones:', data);

      // Lógica para insertar o quitar de la lista:
      if (data.status === 'pending') {
        // Inserta en pendingApprovals si no existe
        setPendingApprovals((prev) => {
          const exists = prev.find((ap) => ap.id === data.id);
          if (!exists) return [data, ...prev];
          // Si existe, actualizamos:
          return prev.map((ap) => (ap.id === data.id ? data : ap));
        });
      } else {
        // 'approved' o 'rejected': lo quitamos de la lista
        setPendingApprovals((prev) => prev.filter((ap) => ap.id !== data.id));
      }
    };

    socket.onclose = (e) => {
      console.log('WebSocket de aprobaciones cerrado:', e);
    };

    socket.onerror = (err) => {
      console.error('Error WS aprobaciones:', err);
    };

    return () => {
      socket.close();
    };
  }, []);
  // =========================================
  // “Actividad Reciente”: re-fetch + WebSocket
  // =========================================

  //Cargar la actividad reciente
  useEffect(() => {
    const loadActividades = async () => {
      try {
        const data = await fetchActividades();
        setActividades(data); //Aquí se guarda la lista
      } catch (error) {
        console.error('Error al cargar actividades:', error);
      }
    };
    loadActividades();
  }, []);
  //Websockets para "actividad"
  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8000/ws/actividad/');
    socket.onopen = () => {
      console.log('WS Actividad conectado');
    };
    socket.onmessage = async (event) => {
      console.log('Mensaje WS actividad:', event.data);

      // Cada vez que llegue un mensaje, re-fetch para tener
      // la lista actualizada (en lugar de insertar local).
      try {
        const data = await fetchActividades();
        setActividades(data);
      } catch (error) {
        console.error('Error al recargar actividades tras WS:', error);
      }
    };
    socket.onclose = () => console.log('WS Actividad cerrado');
    socket.onerror = (err) => console.error('WS Actividad error:', err);

    return () => socket.close();
  }, []);
  // =======================
  // Cargar Usuarios, Torneos, Partidos => y calcular stats
  // =======================
  //Usuarios
  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        const data = await fetchUsuarios();
        setUsuarios(data);
        setUsuariosActivos(data.length); //Usuarios Activos BETA, será 0 por el momento
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      }
    };
    loadUsuarios();
  }, []);

  // Cargar torneos al montar
  useEffect(() => {
    const loadTorneos = async () => {
      try {
        const data = await fetchTorneos();
        setTorneos(data);
        //Torneos activos
        const hoy = new Date();
        let countActivos = 0;
        data.forEach((torneo: Torneo) => {
          const inicio = new Date(torneo.fecha_inicio);
          const fin = new Date(torneo.fecha_fin);

          if (hoy >= inicio && hoy <= fin) {
            countActivos++;
          }
        });
        setTorneosActivos(countActivos);
      } catch (error) {
        console.error('Error al cargar torneos:', error);
      }
    };
    loadTorneos();
  }, []);

  // Cargar partidos al montar
  useEffect(() => {
    const loadPartidos = async () => {
      try {
        const data = await fetchPartidos();
        setPartidos(data);
        // “Partidos Hoy”: filtra los que tengan fecha == hoy (YYYY-MM-DD)
        const hoyIso = new Date().toISOString().split('T')[0];
        const hoyCount = data.filter((partido) => partido.fecha_hora.split('T')[0] === hoyIso).length;

        // OJO: en tu “Partido” has 'fecha_hora'; verifica si es parted
        // Si usas 'fecha' y 'hora' separadas, hazlo distinto. Ajusta la lógica
        setPartidosHoy(hoyCount);
      } catch (error) {
        console.error('Error al cargar partidos:', error);
      }
    };
    loadPartidos();
  }, []);
  // =========================================
  // Funciones: Aprobación (Handlers)
  // =========================================
  const handleAprobacionDecision = async (id: number, isApproved: boolean) => {
    try {
      if (isApproved) {
        await approveAprobacion(id); // PATCH /aprobaciones/<id>/approve/
        toast({
          title: 'Aprobado',
          description: 'La solicitud ha sido aprobada exitosamente.',
        });
      } else {
        await rejectAprobacion(id); // PATCH /aprobaciones/<id>/reject/
        toast({
          title: 'Rechazado',
          description: 'La solicitud ha sido rechazada.',
          variant: 'destructive',
        });
      }
      // Quita el elemento aprobado/rechazado de la lista local
      setPendingApprovals((prev) => prev.filter((item) => item.id !== id));

      //Re-fetch 
      const updated = await fetchActividades();
      setActividades(updated);

    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar la aprobación/rechazo.',
        variant: 'destructive',
      });
    }
  };

  // =========================================
  // Handlers: Registrar Jugador, Torneo y Partido (directo al backend)
  // =========================================

  //Usuario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlayerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterPlayer = async () => {
    try {
      const payload = {
        ...playerData,
        rating_inicial: Number(playerData.rating_inicial) || 0,
      };
      // Llamamos createUsuario
      const response = await createUsuario(payload); // CAMBIO
      console.log('Jugador registrado:', response);

      toast({
        title: 'Jugador registrado con éxito',
        description: 'El jugador ha sido agregado correctamente.',
      });
      // Limpia el formulario
      setPlayerData({
        nombre_completo: '',
        email: '',
        rating_inicial: 0,
        club: '',
        password: '',
        rol: '',
      });

      // Re-fetch actividades
      const updated = await fetchActividades();
      setActividades(updated);

    } catch (error) {
      console.error('Error al registrar jugador:', error);
      toast({
        title: 'Error al registrar jugador',
        description: 'Hubo un problema al registrar al jugador. Intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };
  //Torneo
  const handleTorneoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTorneoData((prev) => ({ ...prev, [name]: value }));
  };
  function handleTagChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { value, checked } = e.target; // 'Open', 'Amateur', 'Veterano', 'Mixto'
    setTorneoData((prev) => {
      let newTags = [...prev.tags];

      if (checked) {
        // Se está agregando la categoría
        // Impedir Amateur + Veterano
        if (value === 'Amateur' && newTags.includes('Veterano')) {
          alert('No puedes seleccionar “Amateur” si ya tienes “Veterano”.');
          return prev; // no agregar nada
        }
        if (value === 'Veterano' && newTags.includes('Amateur')) {
          alert('No puedes seleccionar “Veterano” si ya tienes “Amateur”.');
          return prev; 
        }
        // Si pasa validación, agregar
        newTags.push(value);
      } else {
        // Se está quitando
        newTags = newTags.filter((t) => t !== value);
      }
      return { ...prev, tags: newTags };
    });
  }
  

  const handleRegisterTorneo = async () => {
    try {
      const dataForTorneo = {
        nombre: torneoData.nombre,
        sede: torneoData.sede,
        fecha_inicio: torneoData.fecha_inicio,
        fecha_fin: torneoData.fecha_fin,
        premio_dinero: Number(torneoData.premio_dinero),
        puntos: Number(torneoData.puntos),
        imagen_url: torneoData.imagen_url,
        tags: torneoData.tags
      };
  
      // En vez de llamar a createTorneo, llamamos a createAprobacion:
      await createAprobacion({
        tipo: 'tournament',
        data: dataForTorneo,
      }); 
      // ... no se crea el torneo real en la DB, solo la solicitud en 'aprobaciones'
  
      toast({
        title: 'Solicitud de Torneo enviada',
        description: 'El torneo requiere aprobación antes de crearse.',
      });

      // RE-FETCH Aprobaciones
      const data = await fetchAprobaciones();
      const pendientes = data.filter((item) => item.status === 'pending');
      setPendingApprovals(pendientes);
      //Re-fetch actividades
      const updated = await fetchActividades();
      setActividades(updated);

      // Limpia el formulario
      setTorneoData({
        nombre: '',
        sede: '',
        fecha_inicio: '',
        fecha_fin: '',
        premio_dinero: 0,
        puntos: 0,
        imagen_url: '',
        tags: [''],
      });
    } catch (error) {
      console.error('Error al registrar torneo:', error);
      toast({
        title: 'Error al registrar torneo',
        description: 'Hubo un problema al registrar el torneo. Intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };
  //partido
  const handleMatchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'equipo_1' || name === 'equipo_2') {
      const checkboxValue = (e.target as HTMLInputElement).value;
      const checked = (e.target as HTMLInputElement).checked;
      if (checked) {
        setPartidoData((prev) => ({
          ...prev,
          [name]: [...prev[name], checkboxValue],
        }));
      } else {
        setPartidoData((prev) => ({
          ...prev,
          [name]: prev[name].filter((id) => id !== checkboxValue),
        }));
      }
      return;
    }
    // Fecha y Hora por separado
    if (name === 'fecha') {
      setPartidoData((prev) => ({
        ...prev,
        fecha_hora: `${value}T${prev.fecha_hora.split('T')[1] || '00:00:00'}`,
      }));
      return;
    }
    if (name === 'hora') {
      setPartidoData((prev) => ({
        ...prev,
        fecha_hora: `${prev.fecha_hora.split('T')[0] || '1970-01-01'}T${value}`,
      }));
      return;
    }
    // Resto de campos
    setPartidoData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleRegisterMatch = async () => {
    try {
      // 1) De tu estado partidoData, extrae la fecha y la hora
      const [fecha, hora] = partidoData.fecha_hora.split('T');
    
      // 2) Construye un objeto que coincida con el serializer del backend
      const matchDataJson = {
        torneo: partidoData.torneo,          // El ID del torneo
        equipo_1_ids: partidoData.equipo_1,  // array de IDs de usuarios
        equipo_2_ids: partidoData.equipo_2,
        fecha,                               // "2025-02-15" p.ej
        hora,                                // "09:00"
        resultado: partidoData.resultado,
      };
  
      // 3) Llamar a createAprobacion (tipo: 'match')
      // En lugar de createPartido
      await createAprobacion({
        tipo: 'match',
        data: matchDataJson,
      });
  
      toast({
        title: 'Solicitud de Partido enviada',
        description: 'El partido requiere aprobación antes de crearse.',
      });
      
      // RE-FETCH Aprobaciones 
      const data = await fetchAprobaciones();
      const pendientes = data.filter((item) => item.status === 'pending');
      setPendingApprovals(pendientes);
      
      // Re-fetch Actividades
      const updated = await fetchActividades();
      setActividades(updated);
  
  
      // Limpia el formulario
      setPartidoData({
        equipo_1: [],
        equipo_2: [],
        fecha_hora: '',
        resultado: '',
        torneo: '',
      });
    } catch (error) {
      console.error('Error al registrar partido:', error);
      toast({
        title: 'Error al registrar partido',
        description: 'Hubo un problema al registrar el partido. Intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // =======================
  // Stats (usuariosActivos, partidosHoy, torneosActivos, ... )
  // =======================
  const stats = [
    { label: 'Usuarios Activos', value: usuariosActivos.toString(), icon: Users },
    { label: 'Partidos Hoy', value: partidosHoy.toString(), icon: Activity },
    { label: 'Torneos Activos', value: torneosActivos.toString(), icon: Trophy },
    { label: 'Eventos Próximos', value: '0', icon: Calendar }, // dummy
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
          <Input placeholder="Buscar..." className="max-w-xs" icon={Search} />
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Registro</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="match" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="match">Partido</TabsTrigger>
                  <TabsTrigger value="tournament">Torneo</TabsTrigger>
                  <TabsTrigger value="player">Jugador</TabsTrigger>
                </TabsList>
                {/* ===================== Partido ===================== */}
                <TabsContent value="match" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Selección del Torneo */}
                    <div className="space-y-2">
                      <Label>Torneo</Label>
                      <select
                        name="torneo"
                        value={partidoData.torneo}
                        onChange={(e) =>
                          setPartidoData((prev) => ({ ...prev, torneo: e.target.value }))
                        }
                        className="border rounded px-3 py-2 w-full"
                      >
                        <option value="">Selecciona un Torneo</option>
                        {torneos.map((torneo) => (
                          <option key={torneo.id} value={torneo.id}>
                            {torneo.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Fecha */}
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        name="fecha"
                        type="date"
                        value={partidoData.fecha_hora.split('T')[0] || ''}
                        onChange={handleMatchChange}
                      />
                    </div>
                    {/* Hora */}
                    <div className="space-y-2">
                      <Label>Hora</Label>
                      <Input
                        name="hora"
                        type="time"
                        value={partidoData.fecha_hora.split('T')[1] || ''}
                        onChange={handleMatchChange}
                      />
                    </div>
                    {/* Resultado */}
                    <div className="space-y-2">
                      <Label>Resultado</Label>
                      <Input
                        name="resultado"
                        value={partidoData.resultado}
                        onChange={handleMatchChange}
                        placeholder="Ej: 6-4, 7-5"
                      />
                    </div>
                    {/* Buscador de Jugadores para Equipo 1 */}
                    <div className="space-y-2 col-span-2">
                      <Label>Jugadores Equipo 1</Label>
                      <Input
                        type="text"
                        placeholder="Buscar por email"
                        value={searchEquipo1}
                        onChange={(e) => setSearchEquipo1(e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                      />
                      <div className="max-h-40 overflow-y-auto border rounded">
                        {usuarios
                          .filter((usuario) =>
                            usuario.email.toLowerCase().includes(searchEquipo1.toLowerCase())
                          )
                          .map((usuario) => (
                            <div key={usuario.id} className="flex items-center gap-2 p-2">
                              <input
                                type="checkbox"
                                name="equipo_1"
                                value={usuario.id}
                                checked={usuario.id ? partidoData.equipo_1.includes(usuario.id) : false}
                                onChange={handleMatchChange}
                              />
                              <span>{usuario.nombre_completo}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                    {/* Buscador de Jugadores para Equipo 2 */}
                    <div className="space-y-2 col-span-2">
                      <Label>Jugadores Equipo 2</Label>
                      <Input
                        type="text"
                        placeholder="Buscar por email"
                        value={searchEquipo2}
                        onChange={(e) => setSearchEquipo2(e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                      />
                      <div className="max-h-40 overflow-y-auto border rounded">
                        {usuarios
                          .filter((usuario) =>
                            usuario.email.toLowerCase().includes(searchEquipo2.toLowerCase())
                          )
                          .map((usuario) => (
                            <div key={usuario.id} className="flex items-center gap-2 p-2">
                              <input
                                type="checkbox"
                                name="equipo_2"
                                value={usuario.id}
                                checked={usuario.id ? partidoData.equipo_2.includes(usuario.id) : false}
                                onChange={handleMatchChange}
                              />
                              <span>{usuario.nombre_completo}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  {/* Botón para Registrar el Partido */}
                  <Button className="w-full" onClick={handleRegisterMatch}>
                    Registrar Partido
                  </Button>
                </TabsContent>
                {/* ===================== Torneo ===================== */}
                <TabsContent value="tournament" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre del Torneo</Label>
                      <Input
                        name="nombre"
                        value={torneoData.nombre}
                        onChange={handleTorneoChange}
                        placeholder="Ej: Torneo Nacional 2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sede</Label>
                      <Input
                        name="sede"
                        value={torneoData.sede}
                        onChange={handleTorneoChange}
                        placeholder="Ej: Club de Padel Cuernavaca"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Inicio</Label>
                      <Input
                        name="fecha_inicio"
                        type="date"
                        value={torneoData.fecha_inicio}
                        onChange={handleTorneoChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Fin</Label>
                      <Input
                        name="fecha_fin"
                        type="date"
                        value={torneoData.fecha_fin}
                        onChange={handleTorneoChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Premio en Dinero</Label>
                      <Input
                        name="premio_dinero"
                        type="number"
                        value={String(torneoData.premio_dinero)}
                        onChange={handleTorneoChange}
                        placeholder="Ej: 500000"
                      />
                    </div>
                    {/* Puntos */}
                    <div className="space-y-2">
                      <Label>Puntos para Ranking</Label>
                      <Input
                        name="puntos"
                        type="number"
                        value={String(torneoData.puntos)}
                        onChange={handleTorneoChange}
                        placeholder="Ej: 250"
                      />
                    </div>
                    {/* URL de Imagen */}
                    <div className="space-y-2">
                      <Label>URL de Imagen</Label>
                      <Input
                        name="imagen_url"
                        type="url"
                        value={torneoData.imagen_url}
                        onChange={handleTorneoChange}
                        placeholder="Ej: https://example.com/imagen.jpg"
                      />
                    </div>
                    {/*TAGS */}
                    <div className="space-y-2 col-span-2">
                      <Label>Categorías</Label>
                      <div className="flex flex-col gap-1">
                        {['Open', 'Amateur', 'Veterano', 'Mixto'].map((cat) => (
                          <div key={cat} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={cat}
                              value={cat}
                              checked={torneoData.tags.includes(cat)}
                              onChange={handleTagChange}
                              className="h-4 w-4"
                            />
                            <label htmlFor={cat} className="text-sm">
                              {cat}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleRegisterTorneo}>
                    Registrar Torneo
                  </Button>
                </TabsContent>
                {/* ===================== Jugador ===================== */}
                <TabsContent value="player" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre Completo</Label>
                      <Input
                        name="nombre_completo"
                        value={playerData.nombre_completo}
                        onChange={handleChange}
                        placeholder="Ej: Carlos Ramírez"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        name="email"
                        type="email"
                        value={playerData.email}
                        onChange={handleChange}
                        placeholder="ejemplo@correo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rating Inicial</Label>
                      <Input
                        name="rating_inicial"
                        type="number"
                        value={String(playerData.rating_inicial)}
                        onChange={handleChange}
                        placeholder="1000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Club</Label>
                      <Input
                        name="club"
                        value={playerData.club}
                        onChange={handleChange}
                        placeholder="Ej: Club de Padel Cuernavaca"
                      />
                    </div>
                    {/*Contraseña */}
                    <div className="space-y-2">
                      <Label>Contraseña</Label> 
                      <Input
                        name="password"
                        type="password"
                        value={playerData.password}
                        onChange={handleChange}
                        placeholder="Ingresa una contraseña"
                      />
                    </div>
                    {/* (B) Nuevo campo Rol */}
                    <div className="space-y-2">
                      <Label>Rol</Label> 
                      <select
                        name="rol"
                        value={playerData.rol}
                        onChange={(e) =>
                          setPlayerData((prev) => ({ ...prev, rol: e.target.value }))
                        }
                        className="border rounded px-3 py-2 w-full"
                      >
                        <option value="usuario">Usuario</option>
                        <option value="player">Player</option>
                        <option value="admin">Admin</option>
                        <option value="sponsor">Sponsor</option>
                      </select>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleRegisterPlayer}>
                    Registrar Jugador
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 lighting-card hover:shadow-lg hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4">
                <stat.icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ====================================== */}
        {/* Aprobaciones Pendientes (reales) */}
        {/* ====================================== */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Aprobaciones Pendientes
          </h2>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <motion.div
                  key={approval.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    approval.status === 'approved'
                      ? 'bg-green-50 dark:bg-green-900/10'
                      : approval.status === 'rejected'
                      ? 'bg-red-50 dark:bg-red-900/10'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {/* Título según el tipo de aprobación */}
                        <h3 className="font-semibold">
                          {approval.tipo === 'tournament'
                            ? 'Nuevo Torneo'
                            : approval.tipo === 'match'
                            ? 'Nuevo Partido'
                            : 'Solicitud Desconocida'}
                        </h3>
                        <Badge variant="outline">{approval.tipo}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {/* Ejemplo: mostrar algún campo de approval.data */}
                        {approval.tipo === 'tournament' && approval.data?.nombre
                          ? `Nombre: ${approval.data.nombre}`
                          : approval.tipo === 'match' && approval.data?.torneo
                          ? `Torneo ID: ${approval.data.torneo}`
                          : 'Sin datos'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(approval.created_at).toLocaleString()}
                      </p>
                    </div>
                    {approval.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleAprobacionDecision(approval.id, true)}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleAprobacionDecision(approval.id, false)}
                        >
                          <XCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        variant={
                          approval.status === 'approved'
                            ? 'success'
                            : 'destructive'
                        }
                      >
                        {approval.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* =========================== */}
        {/* Actividad Reciente          */}
        {/* =========================== */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actividades.map((actividad) => (
                  <TableRow
                    key={actividad.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    {/* Fecha */}
                    <TableCell>
                      {new Date(actividad.fecha).toLocaleString()}
                    </TableCell>
                    {/* Tipo */}
                    <TableCell>{actividad.tipo}</TableCell>
                    {/* Descripción */}
                    <TableCell>{actividad.descripcion}</TableCell>
                    {/* Estado */}
                    <TableCell>
                      {actividad.estado ? (
                        <Badge
                          variant={
                            actividad.estado === 'approved'
                              ? 'success'
                              : actividad.estado === 'pending'
                              ? 'warning'
                              : actividad.estado === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {actividad.estado}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">N/A</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}