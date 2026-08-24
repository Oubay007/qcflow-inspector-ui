import type { Article } from "@/types";

const DEFAULT_CHECK_LABELS = [
  "Aspect",
  "Couleur",
  "Propreté",
  "Planéité",
  "Résistance / Tenue",
  "Barasivité",
  "Adaptation",
  "Étiquette traçabilité",
  "Étiquette code à barre",
];

function checks(articleId: string, labels: string[] = DEFAULT_CHECK_LABELS) {
  return labels.map((label, i) => ({
    id: `${articleId}-chk-${i + 1}`,
    articleId,
    label,
    order: i + 1,
    required: true,
  }));
}

export const mockArticles: Article[] = [
  {
    id: "art-001",
    code: "ART-001",
    name: "Product Alpha",
    description: "Boîtier injecté PP blanc, cadence haute, client Renault Tanger.",
    status: "active",
    checks: checks("art-001"),
    measurements: [
      { id: "art-001-m1", articleId: "art-001", label: "Hauteur", unit: "mm", min: 49.5, max: 50.5, order: 1 },
      { id: "art-001-m2", articleId: "art-001", label: "Largeur", unit: "mm", min: 24.5, max: 25.0, order: 2 },
      { id: "art-001-m3", articleId: "art-001", label: "Longueur", unit: "mm", min: 99.0, max: 101.0, order: 3 },
      { id: "art-001-m4", articleId: "art-001", label: "Épaisseur", unit: "mm", min: 2.0, max: 2.3, order: 4 },
    ],
  },
  {
    id: "art-002",
    code: "ART-002",
    name: "Product Beta",
    description: "Capot technique ABS noir avec insert métallique.",
    status: "active",
    checks: checks("art-002", [
      "Aspect",
      "Couleur",
      "Propreté",
      "Résistance / Tenue",
      "Adaptation",
      "Étiquette code à barre",
      "Serrage insert",
    ]),
    measurements: [
      { id: "art-002-m1", articleId: "art-002", label: "Diamètre", unit: "mm", min: 34.8, max: 35.2, order: 1 },
      { id: "art-002-m2", articleId: "art-002", label: "Hauteur", unit: "mm", min: 18.0, max: 18.6, order: 2 },
      { id: "art-002-m3", articleId: "art-002", label: "Poids unitaire", unit: "g", min: 42.0, max: 45.0, order: 3 },
    ],
  },
  {
    id: "art-003",
    code: "ART-003",
    name: "Product Gamma",
    description: "Joint d'étanchéité élastomère, tolérances serrées.",
    status: "active",
    checks: checks("art-003", [
      "Aspect",
      "Couleur",
      "Propreté",
      "Planéité",
      "Barasivité",
      "Étiquette traçabilité",
    ]),
    measurements: [
      { id: "art-003-m1", articleId: "art-003", label: "Épaisseur", unit: "mm", min: 1.45, max: 1.55, order: 1 },
      { id: "art-003-m2", articleId: "art-003", label: "Diamètre intérieur", unit: "mm", min: 62.0, max: 62.4, order: 2 },
      { id: "art-003-m3", articleId: "art-003", label: "Dureté", unit: "Sh A", min: 68, max: 74, order: 3 },
      { id: "art-003-m4", articleId: "art-003", label: "Allongement", unit: "%", min: 180, max: 240, order: 4 },
    ],
  },
];
