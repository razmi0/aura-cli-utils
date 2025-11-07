type Prefix = "https://github.com/1t21-aura-";
export type Feature = "module" | "library" | "template";
export type Name = `${Feature}-${string}` | `orchestrator`;
export type Repo = {
    path: string;
    url: string;
    branch: Branch;
};

export const REPOS: TargetUrl[] = [
    "https://github.com/1t21-aura-module-esd.git@main",
    "https://github.com/1t21-aura-module-default-content.git@main",
    "https://github.com/1t21-aura-orchestrator.git@main",
    "https://github.com/1t21-aura-module-sidebar.git@main",
    "https://github.com/1t21-aura-module-topbar.git@main",
    "https://github.com/1t21-aura-library-permission-manager.git@main",
    "https://github.com/1t21-aura-library-notification-manager.git@main",
    "https://github.com/1t21-aura-template-html.git@main",
    "https://github.com/1t21-aura-template-react-18.git@main",
] as const;

/**
 *
 *
 *
 *
 *
 */

type Extension = "git";
export type Branch = `@${string}`;

type AsUrl<N extends Name, B extends Branch> = `${Prefix}${N}.${Extension}${B}`;
export type TargetUrl = AsUrl<Name, Branch>;
