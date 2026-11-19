/** Demo data: example shelter locations. */
export interface ShelterSite {
  name: string;
  crisis: string;
  lat: number;
  lng: number;
  persons: number;
}

export const SHELTER_SITES: ShelterSite[] = [
  { name: "Sindhupalchok, Nepal", crisis: "Erdbeben", lat: 27.78, lng: 85.71, persons: 120 },
  { name: "Tawila, Darfur, Sudan", crisis: "Konflikt & Vertreibung", lat: 13.5, lng: 25.33, persons: 240 },
  { name: "Baidoa, Somalia", crisis: "Dürre & Vertreibung", lat: 3.12, lng: 43.65, persons: 180 },
  { name: "Port-au-Prince, Haiti", crisis: "Gewalt & Vertreibung", lat: 18.54, lng: -72.34, persons: 90 },
  { name: "Sukkur, Sindh, Pakistan", crisis: "Überschwemmung", lat: 27.7, lng: 68.86, persons: 160 },
  { name: "Mandalay, Myanmar", crisis: "Erdbeben", lat: 21.97, lng: 96.08, persons: 110 },
  { name: "Goma, DR Kongo", crisis: "Konflikt & Vertreibung", lat: -1.68, lng: 29.22, persons: 200 },
];
