/**
 * Lightweight API helper built on jQuery.ajax.
 *
 * Features:
 * - Simple request(options) that returns a Promise
 * - Optional CORS proxy support (e.g., https://api.corsfix.com/)
 * - Dynamic HTTP method, headers, query params, and body data
 * - Sensible defaults and small footprint
 *
 * Usage:
 * import { request } from './API.mjs';
 *
 * // Basic GET
 * const data = await request({ url: 'https://api.example.com/items' });
 *
 * // POST JSON
 * const created = await request({
 *   url: 'https://api.example.com/items',
 *   method: 'POST',
 *   data: { name: 'Widget' },
 *   headers: { 'Content-Type': 'application/json' }
 * });
 *
 * // Using a CORS proxy (e.g., corsfix)
 * const res = await request({
 *   url: 'https://api.example.com/items',
 *   proxy: { enabled: true, baseUrl: 'https://api.corsfix.com/' }
 * });
 */

// Tiny internal util to ensure jQuery is available in different environments
function getJQuery() {
	// Prefer imported jQuery if present; otherwise try global
	// eslint-disable-next-line no-undef
	if (typeof $ !== 'undefined' && typeof $.ajax === 'function') return $;
	// Try "window.jQuery" in browser contexts
	// eslint-disable-next-line no-undef
	if (typeof window !== 'undefined' && window.jQuery) return window.jQuery;
	throw new Error('jQuery is required: load jQuery before using API.mjs');
}

function encodeQuery(query) {
	if (!query) return '';
	const entries = Object.entries(query).filter(([, v]) => v !== undefined && v !== null);
	if (!entries.length) return '';
	return entries
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
		.join('&');
}

function appendQueryToUrl(url, query) {
	const qs = encodeQuery(query);
	if (!qs) return url;
	const sep = url.includes('?') ? '&' : '?';
	return `${url}${sep}${qs}`;
}

// Build proxy URL for services like corsfix.com
// corsfix expects: https://api.corsfix.com/<encoded original url>
function buildUrlWithProxy(url, proxy) {
	if (!proxy || proxy.enabled !== true) return url;
	const base = (proxy.baseUrl || 'https://api.corsfix.com/').replace(/\/+$/, '/');
	// Some proxies accept raw URL, others require encoding. corsfix uses path passthrough.
	// To be safe, only encode characters that could break paths.
	const encoded = encodeURI(url);
	return `${base}${encoded}`;
}

/**
 * Perform an HTTP request using jQuery.ajax.
 *
 * options:
 * - url: string (required)
 * - method: string = 'GET'
 * - headers: Record<string,string>
 * - query: Record<string,string|number|boolean>
 * - data: any (object for JSON or FormData or plain string)
 * - timeout: number (ms)
 * - proxy: { enabled?: boolean, baseUrl?: string }
 * - responseType: 'json' | 'text' | 'xml' | undefined -> maps to jQuery dataType
 * - withCredentials: boolean (for cross-domain cookies; requires proper CORS)
 */
export function request(options) {
	const $ = getJQuery();

	if (!options || !options.url) {
		return Promise.reject(new Error('options.url is required'));
	}

	const {
		url,
		method = 'GET',
		headers,
		query,
		data,
		timeout,
		proxy,
		responseType,
		withCredentials,
	} = options;

	// Compose final URL with query and proxy
	const urlWithQuery = appendQueryToUrl(url, query);
	const finalUrl = buildUrlWithProxy(urlWithQuery, proxy);

	// Decide content type and processData for jQuery
	let contentType = headers?.['Content-Type'];
	let processData = true;
	let payload = data;

	// If payload is FormData, let jQuery handle it
	if (typeof FormData !== 'undefined' && data instanceof FormData) {
		contentType = false; // jQuery will set boundary
		processData = false; // prevent serialization
	} else if (data && (contentType?.includes('application/json') || typeof data === 'object')) {
		// Default to JSON if content-type says so or data is plain object
		contentType = contentType || 'application/json; charset=UTF-8';
		payload = contentType.includes('application/json') ? JSON.stringify(data) : data;
		processData = !contentType.includes('application/json');
	}

	const ajaxOpts = {
		url: finalUrl,
		type: method,
		headers,
		data: payload,
		timeout,
		contentType,
		processData,
		dataType: responseType, // 'json' maps to automatic JSON parsing
		xhrFields: withCredentials ? { withCredentials: true } : undefined,
		crossDomain: true,
	};

	return new Promise((resolve, reject) => {
		$.ajax({
			...ajaxOpts,
			success: (resp, textStatus, jqXHR) => {
				resolve({ data: resp, status: jqXHR.status, headers: parseResponseHeaders(jqXHR), raw: jqXHR });
			},
			error: (jqXHR, textStatus, errorThrown) => {
				const err = new Error(errorThrown || textStatus || 'Request failed');
				err.status = jqXHR?.status;
				err.response = jqXHR?.responseJSON ?? jqXHR?.responseText;
				err.headers = parseResponseHeaders(jqXHR);
				reject(err);
			},
		});
	});
}

function parseResponseHeaders(jqXHR) {
	try {
		const all = jqXHR?.getAllResponseHeaders?.();
		if (!all) return {};
		return all
			.trim()
			.split(/\r?\n/)
			.filter(Boolean)
			.reduce((acc, line) => {
				const idx = line.indexOf(':');
				if (idx > -1) {
					const key = line.slice(0, idx).trim().toLowerCase();
					const val = line.slice(idx + 1).trim();
					acc[key] = val;
				}
				return acc;
			}, {});
	} catch (_) {
		return {};
	}
}

export default { request };

