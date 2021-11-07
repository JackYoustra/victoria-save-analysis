export interface FocusFile {
    focus_tree?: FocusTree[] | FocusTree;
    shared_focus?: Focus[] | Focus;
}

export interface FocusTree {
    id: string;
    focus?: Focus[] | Focus;
    // References to other shared focuses
    shared_focus?: string[] | string;
}

export interface Focus {
    id: string;
    icon: string;
    prerequisite?: Prerequisite | Prerequisite[];
}

export interface Prerequisite {
    focus: string | string[];
}

