import type { TargetUrl } from "./services/GitRepository";

// Add new MFE url here :
// --
export const REPOS: TargetUrl[] = [
    "https://github.airbus.corp/Airbus/1t21-aura-module-esd.git@main",
    "https://github.airbus.corp/Airbus/1t21-aura-module-default-content.git@main",
    "https://github.airbus.corp/Airbus/1t21-aura-module-sidebar.git@main",
    "https://github.airbus.corp/Airbus/1t21-aura-module-topbar.git@main",
    "https://github.airbus.corp/Airbus/1t21-aura-orchestrator.git@main",
    "https://github.airbus.corp/Airbus/1t21-aura-library-permission-manager.git@main",
    "https://github.airbus.corp/Airbus/1t21-aura-library-notification-manager.git@main",
    "https://github.airbus.corp/Airbus/1t21-aura-template-html.git@main",
    "https://github.airbus.corp/Airbus/1t21-aura-template-react-18.git@main",
    "https://github.airbus.corp/Airbus/1t21-aura-module-dashboard.git@main",
] as const;
