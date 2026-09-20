import type { CollectionConfig, Payload } from 'payload';

const isPlatformAdmin = (user: unknown) => {
  const candidate = user as { collection?: string; role?: string } | null;
  return candidate?.collection === 'platform-users' && candidate.role === 'Admin';
};
const isPlatformPlayer = (user: unknown) => {
  const candidate = user as { collection?: string; role?: string } | null;
  return candidate?.collection === 'platform-users' && candidate.role === 'Player';
};
const canReadRoomCredentials = async (user: unknown, payload: Payload, tournamentId: number | string) => {
  if (isPlatformAdmin(user)) return true;
  const candidate = user as { collection?: string; role?: string; id?: number | string } | null;
  if (candidate?.collection !== 'platform-users' || candidate.role !== 'Player' || !candidate.id) return false;
  const registration = await payload.find({
    collection: 'tournament-registrations',
    limit: 1,
    depth: 0,
    overrideAccess: true,
    where: { and: [{ tournament: { equals: tournamentId } }, { player: { equals: candidate.id } }] },
  });
  return registration.totalDocs > 0;
};

export const Tournaments: CollectionConfig = {
  slug: 'tournaments',
  labels: { singular: 'Tournament', plural: 'Tournaments' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'game', 'status', 'schedule', 'updatedAt'],
    hideAPIURL: true,
  },
  access: {
    create: ({ req }) => isPlatformAdmin(req.user),
    // Tournament discovery is public, while writes remain Admin-only and
    // registration remains Player-only in the registrations collection.
    read: ({ req }) => isPlatformAdmin(req.user) || { status: { in: ['REGISTERING', 'ROOM READY', 'LIVE'] } },
    update: ({ req }) => isPlatformAdmin(req.user),
    delete: ({ req }) => isPlatformAdmin(req.user),
  },
  hooks: {
    beforeChange: [({ data, req, operation }) => {
      if (operation === 'create' && req.user) data.createdBy = req.user.id;
      return data;
    }],
    beforeDelete: [async ({ id, req }) => {
      await req.payload.delete({
        collection: 'reward-awards',
        where: { tournament: { equals: id } },
        overrideAccess: true,
      });
      await req.payload.delete({
        collection: 'tournament-registrations',
        where: { tournament: { equals: id } },
        overrideAccess: true,
      });
    }],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Tournament name' },
    { name: 'game', type: 'text', required: true },
    { name: 'gameMode', type: 'text', required: true, label: 'Game mode' },
    { name: 'format', type: 'text', required: true, label: 'Format' },
    { name: 'schedule', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'entryFee', type: 'number', required: true, min: 0, label: 'Entry fee' },
    { name: 'prizePool', type: 'number', required: true, min: 0, label: 'Prize pool' },
    { name: 'maxSlots', type: 'number', required: true, min: 2, label: 'Max slots' },
    { name: 'registeredSlots', type: 'number', required: true, defaultValue: 0, min: 0, admin: { readOnly: true } },
    { name: 'status', type: 'select', required: true, defaultValue: 'REGISTERING', options: ['REGISTERING', 'ROOM READY', 'LIVE', 'COMPLETED', 'CANCELLED'] },
    { name: 'entryType', type: 'select', required: true, defaultValue: 'Free', options: ['Free', 'Paid'] },
    { name: 'rules', type: 'textarea', required: true },
    { name: 'participation', type: 'select', options: ['Solo', 'Duo', 'Squad'] },
    {
      name: 'matchRoom',
      type: 'group',
      label: 'Match room settings',
      admin: { description: 'Room access is managed by Admin accounts only.' },
      fields: [
        // Room credentials are returned only to an Admin or a registered Player.
        { name: 'roomId', type: 'text', label: 'Room ID', access: { read: async ({ req, id }) => id !== undefined && canReadRoomCredentials(req.user, req.payload, id) } },
        { name: 'roomPassword', type: 'text', label: 'Room password', access: { read: async ({ req, id }) => id !== undefined && canReadRoomCredentials(req.user, req.payload, id) } },
        { name: 'matchStartTime', type: 'date', label: 'Match start time', admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'roomUnlockTime', type: 'date', label: 'Room unlock time', admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'status', type: 'select', label: 'Match status', defaultValue: 'Upcoming', options: ['Upcoming', 'Room Ready', 'Live', 'Completed'] },
      ],
    },
    { name: 'createdBy', type: 'relationship', relationTo: 'platform-users', required: true, admin: { readOnly: true } },
  ],
};
