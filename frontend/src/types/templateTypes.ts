import { FormQuestion } from "./forms";
import { EditableComponent } from "./componentTypes";
import { ComponentCategory, ComponentType } from "./registry/mainRegistry";


export type EditorialComponentProps = {
    id: string;
    context?: string;
  };
  
 
  export interface WebsiteComponent<
    EProps extends EditorialComponentProps = EditorialComponentProps, // editorial props
    PProps extends object = EProps // production props (can extend editorial)
  >  {
    editorial: React.FC<EProps>;
    production: React.FC<PProps>;
    editableProps:EditableComponent
  };

 

  export interface PageComponent {
    title: string;
    description: string;
    componentType: ComponentType;
    order?:number
    componentCategory:ComponentCategory
    sectionPurpose?:string


  }



// First, create the new type for a single page definition
  export interface TemplatePageDefinition {
    pageName: string;
    slug: string;
    components: PageComponent[];
    description?: string;
  }
  
  // WebsiteTemplate type
  export interface WebsiteTemplate {
    title: string;
    description: string;
    editLink?: string;
    demoLink: string;
    imageSrc: string;
    imageAlt: string;
  
    components?: PageComponent[];
    pages?: TemplatePageDefinition[]; 
    additionalQuestions?:FormQuestion[]
    price:number
  }

  // Add this helper function in your types file or a utils file

export function getTemplatePages(template: WebsiteTemplate): TemplatePageDefinition[] {
  // If template already has pages array, return it
  if (template.pages && template.pages.length > 0) {
    return template.pages;
  }
  
  // Otherwise, convert single components array to a single page
  if (template.components && template.components.length > 0) {
    return [{
      pageName: 'Home',
      slug: '/',
      components: template.components,
      description: 'Main page'
    }];
  }
  
  // Fallback: empty array
  return [];
}

