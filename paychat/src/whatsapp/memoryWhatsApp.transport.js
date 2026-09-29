export const createMemoryWhatsAppTransport = ({ now = () => new Date() } = {}) => {
    const messages = [];

    return {
        async send(message) {
            messages.push({
                ...structuredClone(message),
                sentAt: now().toISOString(),
                simulation: true,
            });
        },
        list() {
            return structuredClone(messages);
        },
        clear() {
            messages.length = 0;
        },
    };
};
