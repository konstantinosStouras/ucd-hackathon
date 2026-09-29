# UCD AI Hackathon — website

The public page for the UCD AI Hackathon, inspired by the INSEAD AI Hackathon
site. Plain HTML, CSS and a little JavaScript. No build step, no framework,
nothing to install: GitHub Pages serves the files exactly as they are here.

Live at **https://www.stouras.com/ucd-hackathon/** (also reachable at
https://konstantinosstouras.github.io/ucd-hackathon/).

## Editing the site

Almost everything an organiser needs to change lives in **`config.js`**:
the date, the venue, the registration link, the prize pool and the other
numbers, the partner logos, the contact address. Edit the value, commit, and
the site republishes on its own within a minute or two.

| To change | Edit |
| --- | --- |
| Date, venue, city | `dateLabel`, `venueLabel`, `venueFull`, `city` in `config.js` |
| Countdown | `start` in `config.js` (ISO date with the Irish offset). Empty = hidden |
| Register button | `registerUrl` in `config.js`. Empty = "Registration opens soon" |
| The four number tiles | `stats` in `config.js` |
| Partner logos | drop the file in `partners/`, add a line to `partners` in `config.js` |
| Contact e-mail, social links | `contactEmail`, `linkedinUrl`, `instagramUrl` in `config.js` |
| Wording of a section, the programme, the FAQs | the matching section of `index.html` (each is marked with a banner comment) |
| Colours | the variables at the top of `styles.css` (`--navy`, `--gold`) |
| The share card people see when the link is pasted | run `node tools/make-share-images.mjs` after changing the date or venue |

Before launch run `node tools/check.mjs`. It verifies the in-page links, the
share-card tags against the real image sizes, and the partner files, and it
lists every placeholder still marked TODO in `config.js`.

## Files

    index.html              the whole page
    styles.css              the stylesheet
    script.js               fills the page from config.js; tabs, FAQ, countdown, menu
    config.js               the facts that change every year (edit this one)
    partners/               partner logos
    og-image.jpg            1200x630 link-preview card
    share-square.jpg        800x800 square thumbnail for clients that crop
    favicon.svg             the tab icon
    tools/check.mjs         offline checks
    tools/make-share-images.mjs  redraws the two pictures from config.js

## Hosting

The site is published by GitHub Pages through the workflow in
`.github/workflows/pages.yml`, which runs on every push to `main` (repository
Settings, Pages, Source: "GitHub Actions"). Because the owner's user site
carries the custom domain `www.stouras.com`, this project site is served
under it automatically at `/ucd-hackathon/`.

To move the site to its own domain later (for example `ucdhackathon.ie`):
add a file named `CNAME` containing the bare domain, point the domain's DNS at
GitHub Pages (a `CNAME` record for `www`, the four `A` records for the apex),
enter the domain under Settings, Pages, and change `siteUrl` in `config.js`
and the `og:url` / canonical tags at the top of `index.html` to match. Then
run `node tools/check.mjs`; it fails while the two disagree.

## Registration

The Register button links to whatever `registerUrl` says. A Microsoft Form
(UCD's own tool), a Google Form or an Eventbrite page all work. The page
itself stores nothing and needs no backend.
