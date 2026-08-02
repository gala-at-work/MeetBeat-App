import type { GoalId, Role } from '@/lib/types';

export interface LinkedInExperience {
  title: string;
  org: string;
  period: string;
  note: string;
}

/**
 * Result of a LinkedIn profile PDF import. In this POC the extraction step is
 * fed by bundled sample exports rather than a live PDF parser, but the shape is
 * exactly what the review screen and the profile merge expect.
 */
export interface LinkedInImport {
  fileName: string;
  fileSize: string;
  fullName: string;
  headline: string;
  company: string;
  role: Role;
  location: string;
  skills: string[];
  industries: string[];
  interests: string[];
  seeking: GoalId[];
  offering: GoalId[];
  experience: LinkedInExperience[];
  /** Extraction confidence, surfaced so the user knows to review. */
  confidence: number;
}

export const SAMPLE_LINKEDIN_FILES: LinkedInImport[] = [
  {
    fileName: 'Profile-JordanAvery.pdf',
    fileSize: '412 KB',
    fullName: 'Jordan Avery',
    headline: 'Founder & CEO at Continuum — ex-Platform Lead',
    company: 'Continuum',
    role: 'founder',
    location: 'Berlin',
    skills: ['Product management', 'Infrastructure', 'Enterprise sales'],
    industries: ['Developer tools', 'Enterprise SaaS'],
    interests: ['Long-distance running', 'Open source'],
    seeking: ['funding', 'customers'],
    offering: ['collaborate', 'mentee'],
    experience: [
      {
        title: 'Founder & CEO',
        org: 'Continuum',
        period: '2024 — now',
        note: 'Pre-seed. Deployment tooling for platform teams. Four design partners.',
      },
      {
        title: 'Platform Lead',
        org: 'Arclight',
        period: '2020 — 2024',
        note: 'Ran a 14-person platform group serving 200 engineers.',
      },
      {
        title: 'Senior Engineer',
        org: 'Northbound',
        period: '2017 — 2020',
        note: 'Built the internal deployment pipeline still in use today.',
      },
    ],
    confidence: 0.91,
  },
  {
    fileName: 'Profile-SamiKoivu.pdf',
    fileSize: '388 KB',
    fullName: 'Sami Koivu',
    headline: 'Senior ML Engineer at Vantage — open to founding',
    company: 'Vantage',
    role: 'engineer',
    location: 'Berlin',
    skills: ['Machine learning', 'Data engineering', 'Backend engineering'],
    industries: ['AI infrastructure', 'Health tech'],
    interests: ['Chess', 'Cycling'],
    seeking: ['cofounder', 'learn'],
    offering: ['cofounder', 'job', 'collaborate'],
    experience: [
      {
        title: 'Senior ML Engineer',
        org: 'Vantage',
        period: '2022 — now',
        note: 'Owns the ranking stack. Cut inference latency by 60%.',
      },
      {
        title: 'ML Engineer',
        org: 'Helios Health',
        period: '2019 — 2022',
        note: 'Shipped the first clinical decision model into production.',
      },
    ],
    confidence: 0.87,
  },
];

/** Fields a user can accept or reject on the review screen. */
export type LinkedInField = 'identity' | 'skills' | 'industries' | 'goals' | 'interests';

export const LINKEDIN_FIELD_LABEL: Record<LinkedInField, string> = {
  identity: 'Name, headline and location',
  skills: 'Skills',
  industries: 'Industries',
  goals: 'What you want and offer',
  interests: 'Interests',
};
