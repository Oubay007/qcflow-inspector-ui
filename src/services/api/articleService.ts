import type { Article, ArticleCheck, ArticleMeasurement } from "@/types";
import { mockArticles } from "@/data/mock/articles";
import { delay } from "./client";

// Mutable in-memory store so the article spec editor feels real until the
// FastAPI backend is wired in.
let articles: Article[] = mockArticles.map((a) => ({
  ...a,
  checks: a.checks.map((c) => ({ ...c })),
  measurements: a.measurements.map((m) => ({ ...m })),
}));

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

/** GET/POST/PUT /articles, /articles/:id/checks, /articles/:id/measurements */
export const articleService = {
  async list(): Promise<Article[]> {
    return delay(articles);
  },
  async get(id: string): Promise<Article | null> {
    return delay(articles.find((a) => a.id === id) ?? null);
  },
  async getChecks(id: string): Promise<ArticleCheck[]> {
    return delay(articles.find((a) => a.id === id)?.checks ?? []);
  },
  async getMeasurements(id: string): Promise<ArticleMeasurement[]> {
    return delay(articles.find((a) => a.id === id)?.measurements ?? []);
  },
  async create(input: Pick<Article, "code" | "name" | "description">): Promise<Article> {
    const article: Article = { id: uid("art"), status: "active", checks: [], measurements: [], ...input };
    articles = [article, ...articles];
    return delay(article);
  },
  async update(id: string, patch: Partial<Article>): Promise<Article> {
    articles = articles.map((a) => (a.id === id ? { ...a, ...patch } : a));
    return delay(articles.find((a) => a.id === id)!);
  },
  async saveMeasurement(articleId: string, m: Omit<ArticleMeasurement, "articleId">): Promise<Article> {
    const article = articles.find((a) => a.id === articleId)!;
    const exists = article.measurements.some((x) => x.id === m.id);
    article.measurements = exists
      ? article.measurements.map((x) => (x.id === m.id ? { ...m, articleId } : x))
      : [...article.measurements, { ...m, id: m.id || uid("meas"), articleId, order: article.measurements.length + 1 }];
    return delay({ ...article });
  },
  async deleteMeasurement(articleId: string, measurementId: string): Promise<Article> {
    const article = articles.find((a) => a.id === articleId)!;
    article.measurements = article.measurements.filter((m) => m.id !== measurementId);
    return delay({ ...article });
  },
  async saveCheck(articleId: string, check: Omit<ArticleCheck, "articleId">): Promise<Article> {
    const article = articles.find((a) => a.id === articleId)!;
    const exists = article.checks.some((x) => x.id === check.id);
    article.checks = exists
      ? article.checks.map((x) => (x.id === check.id ? { ...check, articleId } : x))
      : [...article.checks, { ...check, id: check.id || uid("chk"), articleId, order: article.checks.length + 1 }];
    return delay({ ...article });
  },
  async deleteCheck(articleId: string, checkId: string): Promise<Article> {
    const article = articles.find((a) => a.id === articleId)!;
    article.checks = article.checks.filter((c) => c.id !== checkId);
    return delay({ ...article });
  },
  async reorderChecks(articleId: string, checkId: string, direction: -1 | 1): Promise<Article> {
    const article = articles.find((a) => a.id === articleId)!;
    const list = [...article.checks].sort((a, b) => a.order - b.order);
    const i = list.findIndex((c) => c.id === checkId);
    const j = i + direction;
    if (i >= 0 && j >= 0 && j < list.length) {
      const a = list[i]!;
      const b = list[j]!;
      list[i] = b;
      list[j] = a;
      list.forEach((c, idx) => (c.order = idx + 1));
      article.checks = list;
    }
    return delay({ ...article });
  },
};
