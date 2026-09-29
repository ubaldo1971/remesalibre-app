const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1'];

export const createAllowedOrigins = (frontendUrl = 'http://localhost:5173') => {
    const origins = new Set([frontendUrl]);
    const url = new URL(frontendUrl);

    if (LOCAL_HOSTNAMES.includes(url.hostname)) {
        LOCAL_HOSTNAMES.forEach(hostname => {
            origins.add(`${url.protocol}//${hostname}${url.port ? `:${url.port}` : ''}`);
        });
    }

    return origins;
};
