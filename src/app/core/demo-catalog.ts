import { Categoria, Curso } from './academia.models';

const uuid = (n: number): string => '00000000-0000-4000-8000-' + n.toString().padStart(12, '0');

export const CATEGORIAS_DEMO: Categoria[] = [
  ['Programación', 'Desarrollo web, móvil y software'],
  ['Inteligencia artificial', 'Modelos de IA y automatización'],
  ['Ciberseguridad', 'Seguridad informática y redes'],
  ['Cloud y DevOps', 'Nube, contenedores y despliegue'],
  ['Datos y analítica', 'Análisis de datos e inteligencia empresarial'],
  ['Diseño digital', 'Diseño UX/UI y productos digitales'],
  ['Marketing digital', 'Comunicación, contenido y campañas'],
  ['Negocios', 'Gestión, finanzas y emprendimiento'],
  ['Productividad', 'Herramientas para el trabajo'],
  ['Idiomas', 'Comunicación internacional'],
  ['Tecnología aplicada', 'Tecnologías emergentes']
].map(([name, description], i) => ({
  id: uuid(100 + i), name, description, status: 'ACTIVE' as const
}));

type Ficha = [string, number, number, 'ONLINE' | 'IN_PERSON' | 'HYBRID', number, number];

const FICHAS: Ficha[] = [
 ['Java desde cero hasta Spring Boot',0,169,'ONLINE',40,90],
 ['Frontend moderno con Angular',0,189,'ONLINE',36,80],
 ['React y TypeScript profesional',0,179,'ONLINE',42,75],
 ['Python para principiantes',0,139,'ONLINE',32,100],
 ['Desarrollo web Full Stack',0,249,'HYBRID',60,60],
 ['Aplicaciones móviles con Flutter',0,219,'ONLINE',48,80],
 ['APIs REST con Spring Boot',0,199,'ONLINE',40,65],
 ['Bases de datos con PostgreSQL',0,159,'ONLINE',32,90],
 ['Introducción a la inteligencia artificial',1,169,'ONLINE',30,100],
 ['Machine Learning con Python',1,259,'HYBRID',52,50],
 ['Prompt Engineering aplicado',1,129,'ONLINE',20,120],
 ['Agentes inteligentes y automatización',1,269,'ONLINE',48,60],
 ['Fundamentos de ciberseguridad',2,159,'ONLINE',36,85],
 ['Hacking ético y pentesting',2,279,'IN_PERSON',48,35],
 ['Seguridad de redes empresariales',2,229,'HYBRID',40,50],
 ['Cloud Computing con AWS',3,229,'ONLINE',44,75],
 ['Docker y Kubernetes',3,259,'HYBRID',48,50],
 ['Azure para aplicaciones empresariales',3,249,'ONLINE',40,65],
 ['DevOps y CI/CD con GitHub Actions',3,199,'ONLINE',36,80],
 ['Power BI desde cero',4,159,'ONLINE',30,95],
 ['Excel avanzado y dashboards',4,139,'ONLINE',26,110],
 ['SQL para análisis de datos',4,169,'ONLINE',32,85],
 ['Ingeniería de datos con Python',4,269,'HYBRID',52,55],
 ['Diseño UX/UI en Figma',5,189,'ONLINE',38,80],
 ['Diseño gráfico digital',5,169,'HYBRID',40,65],
 ['Prototipado de productos digitales',5,179,'ONLINE',32,75],
 ['Marketing de contenidos y SEO',6,159,'ONLINE',30,90],
 ['Publicidad digital y Meta Ads',6,179,'ONLINE',30,85],
 ['Emprendimiento y modelo de negocio',7,179,'HYBRID',32,70],
 ['Gestión de proyectos ágiles Scrum',7,169,'ONLINE',30,90],
 ['Finanzas para emprendedores',7,159,'ONLINE',28,80],
 ['Notion y productividad profesional',8,99,'ONLINE',18,130],
 ['Inglés para tecnología',9,149,'ONLINE',30,100],
 ['Internet de las cosas con Arduino',10,229,'IN_PERSON',40,40],
 ['Robótica e innovación tecnológica',10,269,'HYBRID',46,45]
];

export const CURSOS_DEMO: Curso[] = FICHAS.map(([name, categoria, price, modality, durationHours, capacity], i) => {
  const code = 'MYA-' + String(i + 1).padStart(3, '0');
  const description = 'Aprende ' + name.toLowerCase() +
    ' mediante clases prácticas, proyectos guiados y materiales de apoyo.';
  const date = new Date(Date.UTC(2027, (i % 6) + 1, (i % 20) + 1)).toISOString().slice(0, 10);
  return {
    id: uuid(i + 1), code, name, description, modality, price, currency: 'PEN',
    startDate: date, durationHours, capacity,
    availableSlots: Math.max(0, capacity - (i * 7) % capacity),
    status: 'PUBLISHED', categoryId: CATEGORIAS_DEMO[categoria].id,
    categories: [CATEGORIAS_DEMO[categoria]],
    imageUrl: '/course-covers/area-' + categoria + '.svg',
    schedules: [{
      id: uuid(2000+i),courseId:uuid(i+1),dayOfWeek:['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'][i%5],
      startTime:i%2===0?'18:00':'09:00',endTime:i%2===0?'20:00':'11:00',
      room:modality==='ONLINE'?'Aula virtual':'Aula '+(101+i)
    }],
    locations:modality==='ONLINE'?[]:[{
      id:uuid(3000+i),courseId:uuid(i+1),name:'Sede de demostración',
      address:'Av. de ejemplo 100',city:'Ica',reference:'Referencia ficticia',
      capacity:capacity
    }]
  };
});
