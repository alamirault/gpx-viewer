# 🗺️ GPX Viewer

Visualiseur interactif de traces GPX avec carte 2D/3D, profil d'altitude et métriques.

---

> [!CAUTION]
> **Projet 100% vibe coded.**
> Aucun fichier de ce projet n'a été relu par un humain.
> Le code est généré intégralement par IA (Claude) sans revue manuelle.
> Utiliser à vos risques et périls.

---

## Fonctionnalités

- Import de fichier GPX par drag & drop ou sélection
- Carte 2D (Leaflet / OpenStreetMap) avec bascule Tracé / Dénivelé
- Carte 3D (MapLibre GL) avec relief 3D, satellite et terrain topographique
- Profil d'altitude interactif (Recharts)
- Hover bidirectionnel : survol carte ↔ indicateur sur le graphe
- Métriques : distance, dénivelé +/−, altitude min/moy/max, durée, vitesse moy/max
- Persistance de la dernière trace entre les sessions (localStorage)
- Interface bilingue 🇫🇷 / 🇬🇧

## Stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vitejs.dev)
- Carte 2D : [Leaflet](https://leafletjs.com) / [react-leaflet](https://react-leaflet.js.org)
- Carte 3D : [MapLibre GL JS](https://maplibre.org)
- Graphe : [Recharts](https://recharts.org)
- i18n : [i18next](https://www.i18next.com)
- Tuiles : [OpenStreetMap](https://www.openstreetmap.org) · [OpenTopoMap](https://opentopomap.org) · [ESRI Satellite](https://www.esri.com)
- Terrain DEM : [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles)

## Lancer en local

```bash
npm install
npm run dev
```
