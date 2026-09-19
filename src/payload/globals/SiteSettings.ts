import type { GlobalConfig } from 'payload';
import { imageUrlField } from '../fields';
import { revalidateSiteSettingsAfterChange } from '../revalidate';

// Site-wide branding, navigation, and default SEO. Read by the frontend layout
// and the page renderer. Logo/asset fields are text URL fields (Cloudinary).
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  // Display label only. The slug (and the seed manifest's `siteSettings` key)
  // is a contract — the seeder, the eval cms_check, and the frontend readers
  // all address the global by slug, so renames happen here, never on the slug.
  label: 'Brand & Navigation',
  hooks: {
    afterChange: [revalidateSiteSettingsAfterChange],
  },
  admin: {
    hideAPIURL: true,
    components: {
      // Same save controls as Pages so the global's header matches — an explicit
      // Save button plus a save-state badge. See src/admin/SaveControls.
      // The Back control that replaces the hidden breadcrumb is applied to
      // every collection and global centrally (`withKiteAdminGlobal` in
      // src/payload/kiteAdmin), so it is deliberately not repeated here.
      elements: { SaveButton: '/admin/SaveControls#SaveControls' },
    },
  },
  fields: [
    { name: 'brandName', type: 'text', required: true },
    imageUrlField('logoUrl', { label: 'Logo URL' }),
    {
      name: 'colors',
      type: 'group',
      fields: [
        { name: 'primary', type: 'text' },
        { name: 'accent', type: 'text' },
      ],
    },
    {
      name: 'fonts',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'body', type: 'text' },
        { name: 'display', type: 'text' },
        { name: 'mono', type: 'text' },
      ],
    },
    {
      name: 'navItems',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      fields: [
        { name: 'tagline', type: 'text' },
        { name: 'copyright', type: 'text' },
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        { name: 'platform', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      // The label stays "Contact", which a page's Contact block also uses; this
      // description is what tells an editor the two differ in scope.
      admin: {
        description:
          'Site-wide contact details, shown in the footer on every page.',
      },
      fields: [
        { name: 'email', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'address', type: 'textarea' },
      ],
    },
    {
      name: 'defaultSeo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        imageUrlField('ogImageUrl', { label: 'OG Image URL' }),
      ],
    },
  ],
};
