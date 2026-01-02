
  
  // A full form



export type FormQuestion = {
  key: string;                 // Unique key for saving data (e.g. "headlineText", "ctaLabel")
  label: string;               // Human-readable label
  placeholder?: string;        // UI helper
  required?: boolean;          // Validation
  type?: 'text' | 'color' | 'select';  // Input type
  options?: { value: string; label: string }[]; // For dropdowns
  
  section?: string;            // e.g. "hero", "about", "contact"
  component?: string;          // e.g. "auroraImageHero", "modernAboutSection"
};

export type WebsiteFormAnswer = { answer: string; component?: string };


  
  // A full form
  export type Form = {

    questions: FormQuestion[];
    answers: Record<string, string>;
  };

