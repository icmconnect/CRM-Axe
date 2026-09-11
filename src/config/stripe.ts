export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  prices: {
    essencial: 'price_1UEag7BejuJh61udGrM5w6oo',
    comunidade: 'price_1UEahkBejuJh61udF758QtDQ',
    federacao: 'price_1UEaiWBejuJh61uduZGizvCM',
    anual: 'price_1UEajLBejuJh61udOqNGOrVQ',
  }
};
