# Editorial Infrastructure Fixes - Analysis

## Critical Issues Found

### 1. **Missing Type Files** ❌
The template repo is missing these essential type files:
- `templateTypes.ts` - Contains `WebsiteComponent`, `EditorialComponentProps` (CRITICAL)
- `llmOutputs.ts` - Contains `LlmTextOutput`, `LlmColorOutput`
- `websiteDataTypes.ts` - Contains `WebsitePage`, `ComponentTextSnapshot`
- `forms.ts` - Contains `FormQuestion`, `Form`, `WebsiteFormAnswer`
- `user.ts` - Contains `UserAccount`, `SubscriptionStatus`
- `website.ts` - Contains `WebsiteMaster`, `WebsiteVersion`

### 2. **Incomplete Type Exports** ❌
`types/index.ts` in template repo only exports:
- `colors`
- `componentTypes`
- `navbar`

But easy-money exports:
- `colorTypes`
- `componentTypes`
- `templateTypes` ⚠️ MISSING
- `llmOutputs` ⚠️ MISSING
- `websiteDataTypes` ⚠️ MISSING
- `forms` ⚠️ MISSING
- `navbar`
- `website` ⚠️ MISSING
- `user` ⚠️ MISSING

### 3. **Broken `handleComponentClick`** ❌
Template repo's version is completely different:

**Template repo (WRONG):**
```typescript
interface ComponentDetails {
  name: string;
  editableFields?: string[]; // Just strings!
}
export function handleComponentClick({
  currentComponent,
  componentDetails, // Simple object
  setCurrentComponent,
  setAssistantMessage,
}: HandleComponentClickParams) {
  setCurrentComponent({
    ...currentComponent,
    name: componentDetails.name, // Only sets name!
  });
}
```

**Easy-money (CORRECT):**
```typescript
type HandleClickParams = {
  componentDetails: EditableComponent; // Full EditableComponent!
  setCurrentComponent: (comp: EditableComponent | null) => void;
  setAssistantMessage: React.Dispatch<React.SetStateAction<string>>;
  currentComponent: EditableComponent,
};

export const handleComponentClick = async ({
  componentDetails, // Full EditableComponent with editableFields!
  setCurrentComponent,
  setAssistantMessage,
  currentComponent,
}: HandleClickParams) => {
  setCurrentComponent(componentDetails); // Sets entire EditableComponent!
  // ... API call with editableFields
};
```

### 4. **Component Structure Mismatch** ⚠️
Components in template repo likely don't have proper `editableProps` structure. They need:
```typescript
export const experienceCardDetails: EditableComponent = {
  name: "ExperienceCard",
  details: "...",
  category: 'contentPiece',
  editableFields: [/* array of EditableField */]
};

export const experienceCardComponent: WebsiteComponent<...> = {
  editorial: ExperienceCardEdit,
  production: ExperienceCard,
  editableProps: experienceCardDetails // This is what gets passed to handleComponentClick
};
```

### 5. **API Route Issues** ⚠️
The error "The string did not match the expected pattern" suggests:
- Next.js route structure issues
- Missing API route files
- Incorrect route handlers

## Fix Priority

1. **CRITICAL:** Create `templateTypes.ts` - Required for `WebsiteComponent` export
2. **CRITICAL:** Fix `handleComponentClick` in `lib/hooks/hooks.ts` - This is why editableFields aren't set
3. **HIGH:** Create missing type files (`llmOutputs.ts`, `websiteDataTypes.ts`, `forms.ts`, `user.ts`, `website.ts`)
4. **HIGH:** Update `types/index.ts` to export all types
5. **MEDIUM:** Verify component structure has proper `editableProps`
6. **MEDIUM:** Check API routes structure

## Root Cause

The main issue is that `handleComponentClick` in the template repo doesn't properly set `currentComponent` with the full `EditableComponent` structure including `editableFields`. It only sets the `name`, which is why `editableFields` is undefined.

