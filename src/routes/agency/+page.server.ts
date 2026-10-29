import { agencyLogin, agencyLogout, isAgencyAuthenticated } from '$lib/server/agencyAuth';

export const prerender = false;

// Agency dashboard: entry point to the agency tools
export const load = ({ cookies }) => ({ authenticated: isAgencyAuthenticated(cookies) });

export const actions = {
	login: ({ request, cookies }) => agencyLogin(request, cookies, '/agency'),
	logout: ({ cookies }) => agencyLogout(cookies, '/agency')
};
