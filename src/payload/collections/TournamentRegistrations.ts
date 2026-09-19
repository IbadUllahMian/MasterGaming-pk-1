import type { CollectionConfig } from 'payload';
import { approveTournamentEntryFee } from '@/services/tournament-entry-fee';

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
       const tournamentId = Number(data.tournament);
       if (!Number.isSafeInteger(tournamentId) || tournamentId < 1) throw new Error('Select a tournament to register.');
      const tournament = await req.payload.findByID({ collection: 'tournaments', id: tournamentId, depth: 0, overrideAccess: true });
      if (!['REGISTERING', 'ROOM READY'].includes(String(tournament.status))) throw new Error('Registration is not open for this tournament.');
      const existing = await req.payload.find({ collection: 'tournament-registrations', limit: 1, depth: 0, overrideAccess: true, where: { and: [{ tournament: { equals: tournamentId } }, { player: { equals: req.user.id } }] } });
      if (existing.totalDocs) throw new Error('You are already registered for this tournament.');
      const registrations = await req.payload.count({ collection: 'tournament-registrations', overrideAccess: true, where: { tournament: { equals: tournamentId } } });
      if (registrations.totalDocs >= Number(tournament.maxSlots)) throw new Error('This tournament is full.');
       if (String(tournament.entryType) === 'Paid') await approveTournamentEntryFee({ payload: req.payload, player: req.user.id, tournament: tournamentId, entryFee: Number(tournament.entryFee) });
      data.player = req.user.id;
      data.status = 'REGISTERED';
      return data;
    }],
    afterChange: [async ({ doc, operation, req }) => {
      if (operation !== 'create') return doc;
      const tournamentId = typeof doc.tournament === 'object' ? doc.tournament.id : doc.tournament;
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
