/**
 * The one column of the app on desktop: the header and every page use it, so the logo, the
 * avatar and the content line up (960px wide with 32px sides = 896px of content from `md`,
 * a 16px gutter below). Narrow forms (sign in, onboarding, invitation) are 440px on purpose
 * and do not use it. Combine with `cn(PAGE_COLUMN, 'flex flex-col gap-8 pb-10 pt-6 …')`.
 */
export const PAGE_COLUMN = 'mx-auto w-full max-w-[960px] px-4 md:px-8';
