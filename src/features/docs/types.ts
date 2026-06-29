export interface DocPage {
  slug: string;
  title: string;
  href: string;
}

export interface DocSection {
  title: string;
  pages: DocPage[];
}

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}