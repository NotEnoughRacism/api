export interface Session {
    state: string;
    expires: number;
    uuid: string;
}

declare module "express-session" {
    export interface SessionData {
        state: string;
        expires: number;
        uuid: string;
    }
}

class SessionManager {
    sessions: Map<string, Session>;
    sessionLifetime: number;
    constructor() {
        this.sessions = new Map();
        this.sessionLifetime = 120000;
        setInterval(() => {
            this.sessions.forEach((session, key) => {
                if (Date.now() > session.expires) {
                    this.sessions.delete(key);
                }
            });
        }, 1000);
    }

    create(session: Session) {
        this.sessions.set(session.state, session);
    }

    get(state: string) {
        return this.sessions.get(state);
    }
}

export default new SessionManager();
