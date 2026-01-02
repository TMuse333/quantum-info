# Design Components

This folder is where your design components will be added.

## Structure

Components should be organized by category:

```
designs/
├── herobanners/
│   └── yourHero/
│       ├── yourHero.tsx          # Production component
│       └── yourHeroEdit.tsx       # Editorial component (for editing)
├── contentPieces/
├── textComponents/
└── ...
```

## Adding Components

Components are added via Claude Code. Each component should have:
- Production version (e.g., `yourHero.tsx`)
- Editorial version (e.g., `yourHeroEdit.tsx`)

The editorial version is used in the editor, the production version is used in the live site.
