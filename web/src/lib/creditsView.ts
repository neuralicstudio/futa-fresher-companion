// The photos Sabi ships, with the credit each one needs. One table, so the credits screen and any
// other screen that names a photo read the same facts (docs/design/CREDITS.md is the source).
//
// No Dexie or React imports, so Vitest can run this file. Author, licence and file page were read
// from Wikimedia Commons on 27 Oct 2026; alt text names a building only where its sign is readable.
// The five school photos the project team supplied have no recorded photographer or licence, so
// their rows say so and carry no file page. The night gate stays out of the app (written permission
// from FUTA's official Facebook page is still pending), so it has no row here.

export interface PhotoRecord {
  /** The file name in `web/public/photos`, without the size and extension. */
  id: string;
  /** What the photo shows, in the words of CREDITS.md. */
  alt: string;
  author: string;
  licence: string;
  /** The Commons file page, where the licence and author can be checked. Null for a supplied photo. */
  page: string | null;
  /** The screens that show it, in the app. */
  used: string;
}

const COMMONS = 'https://commons.wikimedia.org/wiki/File:';

// Photos the project team supplied. Nobody recorded who took them or under what licence, so the
// row says exactly that rather than guessing, and it carries no file-page link.
const SUPPLIED = {
  author: 'Not recorded',
  licence: 'Team-supplied, licence not recorded',
  page: null,
} as const;


export const PHOTOS: PhotoRecord[] = [
  {
    id: 'gate',
    alt: 'The main gate, with "The Federal University of Technology Akure" across the top',
    author: 'Kaizenify (Wikimedia User Group Nigeria)',
    licence: 'Public domain',
    page: COMMONS + 'Federal_University_of_Technology,_Akure.jpg',
    used: 'First sync, Welcome, Home, Map, Timetable',
  },
  {
    id: 'library',
    alt: 'The front of a building with a sign reading "Albert Ilemobade Library"',
    author: 'MediaMOF',
    licence: 'CC BY-SA 4.0',
    page:
      COMMONS +
      'Albert_Ilemobade_Library,_Federal_University_of_Technology,_Akure,_Ondo_State104.jpg',
    used: 'Home, Map, Place detail, Academics, Notices',
  },
  {
    id: 'computing',
    alt: 'A building entrance with a sign reading "School of Computing"',
    author: 'MediaMOF',
    licence: 'CC BY-SA 4.0',
    page:
      COMMONS +
      'School_of_Computing,_Federal_University_of_Technology,_Akure,_Ondo_State6.jpg',
    used: 'Home, Map, Place detail, Academics, School page',
  },
  {
    id: 'sese',
    alt: 'A long cream, two-storey building with a red roof and a domed entrance, across a dirt forecourt',
    ...SUPPLIED,
    used: 'Academics, School page',
  },
  {
    id: 'simme',
    alt: 'A three-storey yellow building with a red roof and a low red annexe, on a grassy slope',
    ...SUPPLIED,
    used: 'Academics, School page',
  },
  {
    id: 'sems',
    alt: 'A two-storey brick building with a red roof and a sign reading "School of Earth and Mineral Sciences"',
    ...SUPPLIED,
    used: 'Academics, School page',
  },
  {
    id: 'set',
    alt: 'A four-storey building with deep red columns and cream walls, under a bright sky',
    ...SUPPLIED,
    used: 'Academics, School page',
  },
  {
    id: 'sps',
    alt: 'A tall building with cream walls, red columns and blue glass, seen from the front',
    ...SUPPLIED,
    used: 'Academics, School page',
  },
  {
    id: 'physics',
    alt: 'A roadside sign reading "Department of Physics" in front of low buildings',
    author: 'Jesu-loba',
    licence: 'CC BY-SA 4.0',
    page:
      COMMONS +
      'Department_of_Physics,_Federal_University_of_Technology,_Akure,_Ondo_State.jpg',
    used: 'Home',
  },
  {
    id: 'hall',
    alt: 'A hall with red angled supports and a sign reading "Centre for Continuing Education, Multi-purpose Hall"',
    author: 'MediaMOF',
    licence: 'CC BY-SA 4.0',
    page:
      COMMONS +
      'CCE_Multipurpose_Hall,_Federal_University_of_Technology,_Akure,_Ondo_State4.jpg',
    used: 'Home, Map, Place detail',
  },
  {
    id: 'crc',
    alt: 'A red building with a sign reading "Chief (Dr) Joseph A. Sanusi Computer Resource Centre"',
    author: 'MediaMOF',
    licence: 'CC BY-SA 4.0',
    page:
      COMMONS +
      'Computer_Resource_Centre,_Federal_University_of_Technology,_Akure,_Ondo_State3.jpg',
    used: 'Home, Map, Place detail',
  },
  {
    id: 'studios',
    alt: 'A long building with a sign reading "Industrial Design Studios"',
    author: 'Jesu-loba',
    licence: 'CC BY-SA 4.0',
    page:
      COMMONS +
      'Industrial_Design_Studios,_Federal_University_of_Technology,_Akure2.jpg',
    used: 'Home',
  },
  {
    id: 'road',
    alt: 'A road lined with tall trees',
    author: 'Omaonu',
    licence: 'CC BY-SA 4.0',
    page: COMMONS + 'FUTA_farm_road.jpg',
    used: 'Register, Login',
  },
  {
    id: 'tree',
    alt: 'A flowering tree in front of a long yellow building',
    author: 'Omaonu',
    licence: 'CC BY-SA 4.0',
    page: COMMONS + 'School_of_Engineering_building_beside_ETF_FUTA.jpg',
    used: 'Settings',
  },
];

/** The 384 px file a row shows. The 768 px file is the hero (`-l`). */
export function photoSrc(id: string): string {
  return `/photos/${id}-s.webp`;
}
