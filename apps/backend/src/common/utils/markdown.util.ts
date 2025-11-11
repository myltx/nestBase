// src/common/utils/markdown.util.ts
/**
 * Markdown 解析工具
 * 负责将 Markdown 文本转换为 HTML
 */
import { marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
const hljs = require('highlight.js');

// 配置 marked 使用代码高亮和标题ID生成
marked.use(gfmHeadingId());
marked.use({
  renderer: {
    code(code, language) {
      if (language && hljs.getLanguage(language)) {
        try {
          return `<pre><code class="hljs language-${language}">${hljs.highlight(code, { language }).value}</code></pre>`;
        } catch (err) {
          console.error('代码高亮失败:', err);
        }
      }
      return `<pre><code>${code}</code></pre>`;
    },
  },
});

// 配置 marked 选项
marked.setOptions({
  gfm: true, // 启用 GitHub Flavored Markdown
  breaks: true, // 支持换行符转换为 <br>
});

/**
 * 将 Markdown 文本转换为 HTML
 * @param markdown Markdown 原始文本
 * @returns 转换后的 HTML 字符串
 */
export async function parseMarkdown(markdown: string): Promise<string> {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  try {
    const html = await marked.parse(markdown);
    return html;
  } catch (error) {
    console.error('Markdown 解析失败:', error);
    throw new Error('Markdown 解析失败');
  }
}

/**
 * 同步版本的 Markdown 解析（用于简单场景）
 * @param markdown Markdown 原始文本
 * @returns 转换后的 HTML 字符串
 */
export function parseMarkdownSync(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  try {
    return marked.parse(markdown) as string;
  } catch (error) {
    console.error('Markdown 解析失败:', error);
    throw new Error('Markdown 解析失败');
  }
}

/**
 * 从 HTML 中提取纯文本（用于生成摘要）
 * @param html HTML 文本
 * @param maxLength 最大长度（默认 200 字符）
 * @returns 纯文本摘要
 */
export function extractTextFromHtml(html: string, maxLength = 200): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // 移除 HTML 标签
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除 script 标签
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 移除 style 标签
    .replace(/<[^>]+>/g, '') // 移除所有 HTML 标签
    .replace(/\s+/g, ' ') // 合并空白字符
    .trim();

  // 截断到指定长度
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * 从 Markdown 中提取标题列表（用于生成目录）
 * @param markdown Markdown 原始文本
 * @returns 标题列表 [{ level: 1, text: 'Title', id: 'title' }]
 */
export function extractHeadings(
  markdown: string,
): Array<{ level: number; text: string; id: string }> {
  if (!markdown || typeof markdown !== 'string') {
    return [];
  }

  const headings: Array<{ level: number; text: string; id: string }> = [];
  const lines = markdown.split('\n');

  lines.forEach((line) => {
    // 匹配 # 标题格式
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, '-') // 替换非字母数字和中文字符为 -
        .replace(/^-+|-+$/g, ''); // 移除首尾的 -

      headings.push({ level, text, id });
    }
  });

  return headings;
}
