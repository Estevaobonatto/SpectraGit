/** Deployment mode exposed at build time via Vite env vars. */
export const IS_SELF_HOSTED = import.meta.env.VITE_DEPLOYMENT_MODE === 'self-hosted';
