import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Email, Session } from '@/lib/api-email';
import { Link, linkApi, CreateLinkData } from '@/lib/api';

export type Status = 'ONLINE' | 'OFFLINE' | 'LOADING' | 'ERROR';

// By setting getOnInit: true, Jotai will read from localStorage on the first load.
// This makes the atom's initial state a Promise, so we must handle it with Suspense.
const storageOptions = { getOnInit: true };

// Atom to store the session data, persisted in localStorage
export const sessionAtom = atomWithStorage<Session | null>('session', null, undefined, storageOptions);

// Atom to store the list of emails
export const emailsAtom = atomWithStorage<Email[]>('emails', [], undefined, storageOptions);

// Atom to manage the current system status
export const statusAtom = atom<Status>('OFFLINE');

// Atom to store the currently selected email for viewing its body
export const selectedEmailAtom = atom<Email | null>(null);

// Atom for the search query in the email list
export const searchQueryAtom = atom('');

// Derived atom to filter emails based on the search query
// It's now async to handle the promise from emailsAtom on initial load.
export const filteredEmailsAtom = atom(async (get) => {
  const emails = await get(emailsAtom);
  const query = get(searchQueryAtom).toLowerCase();
  if (!query) {
    return emails;
  }
  return emails.filter(
    (email: Email) =>
      email.mail_from.toLowerCase().includes(query) ||
      email.mail_subject.toLowerCase().includes(query)
  );
});

// A write-only atom to update a single email in the emailsAtom list
export const updateEmailAtom = atom(
  null, // As a write-only atom, the read function is not needed
  (get, set, updatedEmail: Email) => {
    const emails = get(emailsAtom);
    const emailIndex = emails.findIndex(e => e.mail_id === updatedEmail.mail_id);

    if (emailIndex !== -1) {
      const newEmails = [...emails];
      newEmails[emailIndex] = updatedEmail;
      set(emailsAtom, newEmails);
      
      // Also update the selectedEmailAtom if the updated email is the currently selected one
      const selected = get(selectedEmailAtom);
      if (selected && selected.mail_id === updatedEmail.mail_id) {
        set(selectedEmailAtom, updatedEmail);
      }
    }
  }
);

// Atom for auto-refresh functionality
export const autoRefreshAtom = atom(true);
export const refreshIntervalAtom = atom(10000); // Default 10 seconds

// Atom to control the visibility of the captcha modal
export const captchaModalAtom = atom(false);

// Atom for guest links
export const guestLinksAtom = atomWithStorage<Link[]>('guestLinks', [], undefined, storageOptions);

// Atom for managing guest link expiration
export const guestLinkExpirationAtom = atom(
  (get) => {
    const links = get(guestLinksAtom);
    const now = new Date();
    return links.filter(link => {
      if (!link.expiresAt) return true;
      return new Date(link.expiresAt) > now;
    });
  }
);

// Atom for managing guest link count
export const guestLinkCountAtom = atom(
  (get) => get(guestLinkExpirationAtom).length
);

// Atom for managing guest link creation
export const createGuestLinkAtom = atom(
  null,
  async (get, set, linkData: CreateLinkData & { expiresAt?: string }) => {
    try {
      const newLink = await linkApi.createGuestLink({
        title: linkData.title,
        url: linkData.url,
        description: linkData.description,
        customSlug: linkData.customSlug,
        expiresAt: linkData.expiresAt,
      });
      const links = get(guestLinksAtom);
      set(guestLinksAtom, [...links, newLink]);
      return newLink;
    } catch (error) {
      console.error('Failed to create guest link via API:', error);
      throw error;
    }
  }
);

// Atom for managing guest link deletion
export const deleteGuestLinkAtom = atom(
  null,
  (get, set, linkId: string) => {
    const links = get(guestLinksAtom);
    set(guestLinksAtom, links.filter(link => link.id !== linkId));
  }
);
