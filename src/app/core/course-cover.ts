import { Curso } from './academia.models';

/** Resuelve la portada sin atribuir al backend un campo de imagen inexistente. */
export function portadaCurso(curso: Curso): string {
  const direct=curso.imageUrl?.trim();
  if(direct && (direct.startsWith('/course-covers/') || /^https:\/\//.test(direct))) return direct;
  const asociada=curso.categories?.[0];
  const nombre=(asociada?.name || curso.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const grupos: [RegExp,number][]=[
    [/program|angular|react|java|python|desarrollo|flutter|sql|software/,0],
    [/inteligencia|machine|agente|automatiz|prompt|ia generativa/,1],
    [/seguridad|hacking|pentest/,2],
    [/cloud|devops|docker|aws|azure|kubernetes|nube/,3],
    [/datos|analit|excel|power bi|ingenieria de datos/,4],
    [/diseno|ux|ui|figma|prototip/,5],
    [/marketing|publicidad|seo/,6],
    [/negocio|finanzas|emprend|scrum|gestion/,7],
    [/productividad|notion/,8],
    [/idiomas|ingles|comunicacion/,9],
    [/robotica|arduino|tecnologia aplicada|internet de las cosas/,10]
  ];
  const index=grupos.find(([pattern])=>pattern.test(nombre))?.[1] ?? 10;
  return '/course-covers/area-'+index+'.svg';
}
