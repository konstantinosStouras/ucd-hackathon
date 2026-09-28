/* UCD AI Hackathon — the facts that change from year to year.
 *
 * Everything on the page that is a DATE, a PLACE, a NUMBER or a LINK is read
 * from this one file, so an organiser can update the site without touching
 * the HTML. Edit the values, commit, and GitHub Pages republishes in about a
 * minute.
 *
 * Anything still marked TODO is a placeholder to replace before launch.
 * `node tools/check.mjs` lists what is still left.
 */
window.HACKATHON = {
  name: 'UCD AI Hackathon',
  edition: '2027',

  /* Shown in the hero and the share card. Keep them short. */
  dateLabel: 'Spring 2027',           // TODO e.g. '6 & 7 March'
  yearLabel: '2027',
  venueLabel: 'UCD Smurfit School',    // TODO confirm the building
  venueFull: 'UCD Michael Smurfit Graduate Business School, Carysfort Avenue, Blackrock, Co. Dublin',
  city: 'Dublin',

  /* The countdown reads `start`. ISO 8601 with the Irish offset
     (+00:00 in winter, +01:00 in summer). Leave `start` empty to hide the
     countdown until the date is fixed. */
  start: '',                           // TODO e.g. '2027-03-06T08:30:00+00:00'
  end: '',                             // TODO e.g. '2027-03-07T18:00:00+00:00'

  /* Where "Register now" goes. A Microsoft Form (UCD's own tool), a Google
     Form or Eventbrite link all work. While it is empty the buttons read
     "Registration opens soon" and do nothing. */
  registerUrl: '',                     // TODO

  /* The four tiles under "About". */
  stats: [
    { value: '€5,000', label: 'Prize pool' },          // TODO confirm
    { value: '24',     label: 'Hours of building' },
    { value: '50+',    label: 'Participants' },        // TODO confirm
    { value: '10+',    label: 'Mentors & judges' },    // TODO confirm
  ],

  /* Partner logos. Drop the image into partners/ and add a line here.
     Empty list = the section says partners are to be announced. */
  partners: [
    // { name: 'Example AI', file: 'partners/example.svg', url: 'https://example.com' },
  ],

  /* Who to write to. Used for the "Become a partner" and "Questions?" links. */
  contactEmail: 'kostas.stouras@ucd.ie',

  /* Optional social links for the footer. Leave empty to hide. */
  linkedinUrl: '',
  instagramUrl: '',

  /* The canonical address the site is served from. Change it when the site
     moves to its own domain. It feeds the share-card tags in the HTML too. */
  siteUrl: 'https://www.stouras.com/ucd-hackathon/',
};
