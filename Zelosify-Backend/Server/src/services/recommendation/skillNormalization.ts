/**
 * Deterministic skill normalization service.
 * Standardizes skill names across varied notations and aliases.
 */

export const SKILL_ALIASES: Record<string, string> = {
  // React
  react: "react",
  "react.js": "react",
  reactjs: "react",
  "react js": "react",
  "react native": "react native",
  "react-native": "react native",

  // Node.js
  node: "nodejs",
  "node.js": "nodejs",
  nodejs: "nodejs",
  "node js": "nodejs",

  // PostgreSQL
  postgres: "postgresql",
  postgresql: "postgresql",
  postgressql: "postgresql",
  "postgre sql": "postgresql",
  "postgres sql": "postgresql",
  psql: "postgresql",

  // TypeScript / JavaScript
  ts: "typescript",
  typescript: "typescript",
  "type script": "typescript",
  js: "javascript",
  javascript: "javascript",
  "java script": "javascript",

  // Python
  py: "python",
  python: "python",
  python3: "python",

  // Cloud & DevOps
  aws: "aws",
  "amazon web services": "aws",
  gcp: "gcp",
  "google cloud": "gcp",
  azure: "azure",
  docker: "docker",
  "docker container": "docker",
  k8s: "kubernetes",
  kubernetes: "kubernetes",
  cicd: "cicd",
  "ci/cd": "cicd",
  terraform: "terraform",

  // Frameworks & Libraries
  "next.js": "nextjs",
  nextjs: "nextjs",
  "next js": "nextjs",
  next: "nextjs",
  "express.js": "express",
  expressjs: "express",
  "express js": "express",
  express: "express",
  "vue.js": "vue",
  vuejs: "vue",
  "vue js": "vue",
  vue: "vue",
  angular: "angular",
  angularjs: "angular",
  "angular.js": "angular",
  tailwind: "tailwindcss",
  tailwindcss: "tailwindcss",
  "tailwind css": "tailwindcss",
  redux: "redux",

  // Databases & Caching
  mongodb: "mongodb",
  mongo: "mongodb",
  redis: "redis",
  mysql: "mysql",
  sqlite: "sqlite",
  dynamodb: "dynamodb",
  elasticsearch: "elasticsearch",

  // APIs & Messaging
  graphql: "graphql",
  gql: "graphql",
  rest: "rest",
  "rest api": "rest",
  "restful api": "rest",
  kafka: "kafka",
  "apache kafka": "kafka",
  rabbitmq: "rabbitmq",

  // Languages
  java: "java",
  "spring boot": "springboot",
  springboot: "springboot",
  spring: "springboot",
  go: "golang",
  golang: "golang",
  "c#": "csharp",
  csharp: "csharp",
  "c-sharp": "csharp",
  "c++": "cpp",
  cpp: "cpp",
  c: "c",
  ruby: "ruby",
  rust: "rust",
  php: "php",

  // Tools & Version Control
  git: "git",
  github: "git",
  gitlab: "git",
  linux: "linux",
};

/**
 * Normalizes a single skill string to a canonical token.
 */
export function normalizeSkill(skill: string): string {
  if (!skill || typeof skill !== "string") return "";

  const trimmed = skill.trim().toLowerCase();
  if (!trimmed) return "";

  // 1. Direct match in dictionary
  if (SKILL_ALIASES[trimmed]) {
    return SKILL_ALIASES[trimmed];
  }

  // 2. Simplified format (replace common separators with space, but preserve # and +)
  const simplified = trimmed
    .replace(/[.\-_/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (SKILL_ALIASES[simplified]) {
    return SKILL_ALIASES[simplified];
  }

  // 3. Fallback: normalized clean string
  return simplified;
}

/**
 * Normalizes a list of skills and returns a deduplicated array of canonical names.
 */
export function normalizeSkills(skills: (string | null | undefined)[]): string[] {
  if (!Array.isArray(skills)) return [];

  const unique = new Set<string>();
  for (const item of skills) {
    if (typeof item === "string") {
      const normalized = normalizeSkill(item);
      if (normalized) {
        unique.add(normalized);
      }
    }
  }

  return Array.from(unique);
}
