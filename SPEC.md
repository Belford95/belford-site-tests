# belford-site specification

## Conventions
- Sections with ids: #hero #about #skills #projects #repos #contact. All six must exist.
- Responsive: no horizontal scroll at a viewport width of 375px.
- #repos: when the GitHub API returns repos, each repo's name appears in #repos as a link to its page on github.com. When the API returns an empty list or an error, #repos shows a visible text message and no repo links.
- #hero, #contact contain links to email, GitHub and LinkedIn.

## Issue #1: dark-mode toggle
- A button in the nav toggles a 'dark' class on <body>.
- The choice is kept for the session.
