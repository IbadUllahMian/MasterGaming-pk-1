import type { CollectionConfig } from 'payload';
import { approveTournamentEntryFee } from '@/services/tournament-entry-fee';

const relationshipId = (value: unknown) => {
  const raw = typeof value === 'object' && value !== null && 'id' in value
    ? (value as { id?: unknown }).id
    : value;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const isAdmin = (user: unknown) => {
  const account = user as { collection?: string; role?: string } | null;
  return account?.collection === 'platform-users' && account.role === 'Admin';
};
const isPlayer = (user: unknown) => {
  const account = user as { collection?: string; role?: string } | null;
  return account?.collection === 'platform-users' && account.role === 'Player';
};

export const TournamentRegistrations: CollectionConfig = {
  slug: 'tournament-registrations',
  labels: { singular: 'Tournament registration', plural: 'Tournament registrations' },
  admin: { useAsTitle: 'id', hideAPIURL: true },
  indexes: [{ unique: true, fields: ['tournament', 'player'] }],
  access: {
    create: ({ req }) => isPlayer(req.user),
    read: ({ req }) => isAdmin(req.user) || (isPlayer(req.user) ? { player: { equals: req.user?.id } } : false),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  hooks: {
    beforeChange: [async ({ data, operation, req }) => {
      if (operation !== 'create' || !req.user) return data;
       const tournamentId = relationshipId(data.tournament);
       if (!tournamentId) throw new Error('Select a tournament to register.');
       const tournament = await req.payload.findByID({ collection: 'tournaments', id: tournamentId, depth: 0, overrideAccess: true });
      if (!['REGISTERING', 'ROOM READY'].includes(String(tournament.status))) throw new Error('Registration is not open for this tournament.');
      const existing = await req.payload.find({ collection: 'tournament-registrations', limit: 1, depth: 0, overrideAccess: true, where: { and: [{ tournament: { equals: tournamentId } }, { player: { equals: req.user.id } }] } });
      if (existing.totalDocs) throw new Error('You are already registered for this tournament.');
      const registrations = await req.payload.count({ collection: 'tournament-registrations', overrideAccess: true, where: { tournament: { equals: tournamentId } } });
      if (registrations.totalDocs >= Number(tournament.maxSlots)) throw new Error('This tournament is full.');
       data.player = req.user.id;
       data.status = 'REGISTERED';
       return data;
    }],
    afterChange: [async ({ doc, operation, req }) => {
      if (operation !== 'create') return doc;
       const tournamentId = relationshipId(doc.tournament);
       if (!tournamentId) throw new Error('Tournament registration is missing its tournament.');
       const tournament = await req.payload.findByID({ collection: 'tournaments', id: tournamentId, depth: 0, overrideAccess: true });
       // This hook runs in Payload's request transaction. Charging after the
       // registration has been persisted means any registration failure happens
       // before a debit is attempted; a failed debit rolls back the registration.
       if (String(tournament.entryType) === 'Paid') {
         const playerId = relationshipId(doc.player);
         if (!playerId) throw new Error('Tournament registration is missing its player.');
         await approveTournamentEntryFee({ payload: req.payload, player: playerId, tournament: tournamentId, entryFee: Number(tournament.entryFee) });
       }
       const registrations = await req.payload.count({ collection: 'tournament-registrations', overrideAccess: true, where: { tournament: { equals: tournamentId } } });
      await req.payload.update({ collection: 'tournaments', id: tournamentId, data: { registeredSlots: registrations.totalDocs }, overrideAccess: true });
      return doc;
    }],
  },
  fields: [
    { name: 'tournament', type: 'relationship', relationTo: 'tournaments', required: true },
    { name: 'player', type: 'relationship', relationTo: 'platform-users', required: true, admin: { readOnly: true } },
    { name: 'status', type: 'select', required: true, defaultValue: 'REGISTERED', options: ['REGISTERED', 'CANCELLED'], admin: { readOnly: true } },
  ],
};
