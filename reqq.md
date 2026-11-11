# CYBERCAST — UI REDESIGN AND DEVELOPMENT INSTRUCTIONS

You are working on an existing project called CyberCast, originally developed for SIH Problem Statement 184.

I want to transform its existing SIH-oriented interface into a professional, standalone web application.

## MOST IMPORTANT REQUIREMENT

**DO NOT CHANGE THE ORIGINAL MOTIVE, PROBLEM STATEMENT OR FUNCTIONAL PURPOSE OF CYBERCAST.**

CyberCast must remain an AI-driven predictive cybercrime defence platform.

This is strictly a UI/UX and usability transformation, not a product transformation.

Do not:
- Turn it into a generic cybersecurity dashboard.
- Change its original cybercrime prediction objective.
- Remove existing prediction or risk-analysis functionality.
- Replace the ML model with another model.
- Invent new features or capabilities.
- Change the meaning of existing predictions.
- Remove useful maps, reporting, investigation or collaboration features.

The original GitHub repository is the source of truth.

## STEP 1: AUDIT THE PROJECT

Before modifying anything:

1. Inspect the complete repository.
2. Understand the existing frontend and backend.
3. Identify the ML models and prediction pipeline.
4. Understand the original SIH problem statement.
5. Identify every existing page and feature.
6. Identify static, simulated and genuinely functional components.
7. Read the supplied PRD.md carefully.

Prepare a feature-preservation checklist.

## STEP 2: REDESIGN THE WEBSITE

Convert the existing SIH-style interface into a conventional professional web application.

Design direction:
- Modern SaaS-style interface.
- Clean light theme.
- White/off-white backgrounds.
- Navy or dark text.
- Subtle blue accents.
- Professional typography.
- Consistent spacing.
- Clean cards and charts.
- Responsive layouts.
- Minimal and purposeful animations.

Remove excessive hackathon-style presentation elements, government-themed branding and unnecessary command-centre aesthetics.

However, retain cybersecurity-specific visualisations and terminology whenever they serve the original product.

## STEP 3: WEBSITE STRUCTURE

Redesign the existing pages around their current functionality.

The website should have an appropriate:
- Landing page explaining CyberCast's original purpose.
- Navigation system.
- Application dashboard.
- Existing cybercrime prediction workflow.
- Risk visualisation.
- Existing map functionality.
- Reports and investigation sections.
- About/project information page.

These are design suggestions, not permission to invent functionality. Inspect the repository and preserve its actual feature set.

## STEP 4: PRESERVE MACHINE LEARNING

This is a university Machine Learning project.

Preserve:
- Existing ML model.
- Dataset and preprocessing.
- Feature engineering.
- Prediction logic.
- Backend APIs.
- Model output format.
- Existing integrations.

The redesigned frontend must communicate with the actual backend.

Never hardcode ML predictions or display fabricated accuracy figures.

Clearly distinguish demonstration data from actual backend-generated results.

## STEP 5: TECHNICAL RESTRICTIONS

- Retain the existing framework and architecture.
- Retain Next.js, TypeScript and Tailwind CSS if confirmed by the repository.
- Do not introduce Docker.
- Avoid unnecessary dependencies.
- Keep the application lightweight.
- Do not unnecessarily rewrite backend code.
- Do not expose API keys or credentials.
- Back up existing code before substantial changes.

## STEP 6: IMPLEMENTATION ORDER

Work in this order:

1. Repository audit.
2. PRD review.
3. Feature-preservation checklist.
4. Landing page redesign.
5. Navigation redesign.
6. Dashboard redesign.
7. Prediction interface redesign.
8. Remaining existing pages.
9. Backend and ML integration verification.
10. Responsive testing.
11. Bug fixing and final build.

Do not modify everything simultaneously.

## STEP 7: FINAL VERIFICATION

Before completing the task, verify:

- Original CyberCast purpose is preserved.
- All existing core features remain available.
- ML predictions still use the original model.
- Backend integration works.
- Navigation works.
- Forms work.
- Charts and maps work where implemented.
- No fake metrics or unsupported claims are displayed.
- Website is responsive.
- Application builds successfully.

Finally, provide a summary of modifications, preserved functionality, outstanding issues and local setup instructions.

**FINAL RULE: Change the presentation, not the product. CyberCast must remain the same AI-driven predictive cybercrime defence platform, only with a more professional and user-friendly website.**