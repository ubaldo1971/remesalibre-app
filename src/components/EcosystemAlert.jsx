import React from 'react';

/**
 * EcosystemAlert - Shows when user already has account in RAITE ecosystem
 */
export const EcosystemAlert = ({ userName, apps = [], onContinue }) => {
    const firstName = userName?.split(' ')[0] || 'amigo';

    return (
        <div className="ecosystem-alert" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15))',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            marginTop: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <span style={{ fontSize: '24px' }}>👋</span>
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{
                        fontWeight: 'bold',
                        color: '#22c55e',
                        fontSize: '18px',
                        margin: 0
                    }}>
                        ¡Hola de nuevo, {firstName}!
                    </h3>
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                    }}>
                        Ya tienes cuenta en el ecosistema RAITE
                    </p>
                    {apps.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginTop: '8px'
                        }}>
                            {apps.map((app) => (
                                <span
                                    key={app}
                                    style={{
                                        padding: '4px 10px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    {app === 'cooperativa' && '🏛️ Cooperativa'}
                                    {app === 'remesa' && '💸 RemesaLibre'}
                                    {app === 'chofer' && '🚗 Chofer'}
                                </span>
                            ))}
                        </div>
                    )}
                    {onContinue && (
                        <button
                            onClick={onContinue}
                            style={{
                                marginTop: '12px',
                                width: '100%',
                                padding: '10px',
                                background: '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            Continuar con mi cuenta
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Check if phone exists in RAITE ecosystem
 */
export const checkEcosystem = async (phone) => {
    try {
        // Normalize phone
        const normalizedPhone = phone.replace(/[\s\-\(\)\+]/g, '').slice(-10);

        // Call cooperativa backend (adjust URL as needed)
        const baseUrl = import.meta.env.VITE_ECOSYSTEM_API_URL || 'https://raitecoop.org/api';
        const response = await fetch(`${baseUrl}/ecosystem/check-phone/${normalizedPhone}`);

        if (!response.ok) {
            throw new Error('Failed to check ecosystem');
        }

        return await response.json();
    } catch (error) {
        console.error('Ecosystem check error:', error);
        return {
            exists: false,
            apps: [],
            user: null,
            message: 'Error al verificar ecosistema'
        };
    }
};

export default EcosystemAlert;
