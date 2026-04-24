/* 站点配置数据结构 */
export interface SiteConfig {
  site: {
    brand: string;
    slogan: string;
    about: {
      name: string;
      bio: string;
      avatar: string;
      location: string;
      email: string;
      github: string;
      skills: SkillCategory[];
      education: Education[];
    };
  };
}

/* 技能分类 */
export interface SkillCategory {
  category: string;
  items: string[];
}

/* 教育经历 */
export interface Education {
  school: string;
  degree: string;
  period: string;
}

/* 项目数据 */
export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  thumbnailUrl: string;
  demoUrl: string;
  repoUrl: string;
  tags: string;
  category: string;
  featured: boolean;
  sortOrder: number;
  embeddedEnabled: boolean;
  githubRepoUrl: string;
  projectPath: string;
  backendPort: number;
  backendStartCmd: string;
  healthCheckUrl: string;
  frontendBuildDir: string;
  createdAt: string;
  updatedAt: string;
}

/* 博客文章数据 */
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImageUrl: string;
  tags: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED';
  author?: { id: number; username: string };
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

/* 留言板消息数据 */
export interface GuestbookMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  approved: boolean;
  createdAt: string;
}

/* 通用分页响应结构 */
export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
