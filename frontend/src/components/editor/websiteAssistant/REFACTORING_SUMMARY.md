# Website Assistant Refactoring Summary

## Overview
Breaking down the 1480-line `websiteAssistant.tsx` into smaller, focused components with separate concerns.

## New File Structure

```
websiteAssistant/
├── types.ts                    # Types and interfaces
├── constants.ts                # MODE_OPTIONS and other constants
├── componentDetails.ts          # Component details map
├── MessageBubble.tsx            # Individual message rendering
├── ComponentSelector.tsx        # Component selection UI
├── ModeSelector.tsx            # Mode selection UI
├── EditTypeLegend.tsx          # Help legend
├── ChatInput.tsx               # Input area
├── useWebsiteAssistant.ts      # Business logic hook (API calls, state)
└── websiteAssistant.tsx        # Main orchestrator component
```

## Component Responsibilities

### 1. **types.ts**
- `ChatMode` type
- `Message` interface
- `ModeOption` interface

### 2. **constants.ts**
- `MODE_OPTIONS` array
- Other configuration constants

### 3. **componentDetails.ts**
- `COMPONENT_DETAILS_MAP`
- `convertToEditableComponent()` helper

### 4. **MessageBubble.tsx**
- Renders individual chat messages
- Shows metadata, sources, file changes
- Handles component selector display

### 5. **ComponentSelector.tsx**
- Component selection UI
- Sorts components by order
- Converts page components to EditableComponent

### 6. **ModeSelector.tsx**
- Mode selection buttons
- Only shows when no mode selected

### 7. **EditTypeLegend.tsx**
- Help text showing what assistant can do

### 8. **ChatInput.tsx**
- Text input area
- Send button
- Placeholder text based on mode

### 9. **useWebsiteAssistant.ts** (Hook)
- All business logic:
  - State management (messages, input, loading, mode)
  - API calls (colors, text, knowledge, structural)
  - Message handling
  - Component selection logic
  - Mode management

### 10. **websiteAssistant.tsx** (Main Component)
- Orchestrates all sub-components
- Uses `useWebsiteAssistant` hook
- Renders layout and UI structure

## Benefits

1. **Separation of Concerns**: UI components separate from business logic
2. **Reusability**: Components can be reused elsewhere
3. **Testability**: Each piece can be tested independently
4. **Maintainability**: Easier to find and fix issues
5. **Readability**: Smaller files are easier to understand

## Migration Notes

- All imports updated to use new file structure
- Types exported from `types.ts`
- Constants from `constants.ts`
- Component details from `componentDetails.ts`
- Business logic extracted to hook

