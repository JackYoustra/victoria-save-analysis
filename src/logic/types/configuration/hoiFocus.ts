export interface FocusFile {
    focus_tree?: FocusTree[] | FocusTree;
    shared_focus?: Focus[] | Focus;
}

export interface FocusTree {
    focus?: Focus[] | Focus;
}

export interface Focus {
    id: string;
    icon: string;
    prerequisite?: Prerequisite | Prerequisite[];
}

export interface Prerequisite {
    focus: string | string[];
}

