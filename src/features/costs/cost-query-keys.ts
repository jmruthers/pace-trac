export const TRAC_COSTS_QUERY_PREFIX = ['trac-costs'] as const;

export const costsQueryKeys = {
  all: TRAC_COSTS_QUERY_PREFIX,
  rollup: (eventId: string) => [...TRAC_COSTS_QUERY_PREFIX, 'rollup', eventId] as const,
  rates: (eventId: string) => [...TRAC_COSTS_QUERY_PREFIX, 'rates', eventId] as const,
  baseCurrency: (organisationId: string) =>
    [...TRAC_COSTS_QUERY_PREFIX, 'base-currency', organisationId] as const,
};
