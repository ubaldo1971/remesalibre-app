const DEMO_ADMIN = {
    id: 'demo-admin',
    first_name: 'Admin',
    last_name: 'Demo',
    email: 'admin.demo@remesalibre.local',
    role: 'admin',
    status: 'active',
};

export const authenticateDemoAdmin = (credentials, env = process.env) => {
    const enabled = env.DEMO_ADMIN_ENABLED === 'true' && env.NODE_ENV !== 'production';
    if (!enabled) return null;

    const { phoneNumber, pin } = credentials;
    if (phoneNumber !== env.DEMO_ADMIN_PHONE || pin !== env.DEMO_ADMIN_PIN) {
        return null;
    }

    return {
        ...DEMO_ADMIN,
        phone_number: env.DEMO_ADMIN_PHONE,
    };
};
