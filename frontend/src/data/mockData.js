export const initialWorkspaces = [];
export const initialActivities = [];
export const mockDashboardStats = [
    {
        id: "active-workspaces",
        label: "Active Workspaces",
        value: 4,
        change: "+2 this week",
        changeType: "positive",
        iconName: "FolderKanban"
    },
    {
        id: "total-collaborators",
        label: "Collaborators",
        value: 12,
        change: "+3 active today",
        changeType: "positive",
        iconName: "Users"
    },
    {
        id: "recent-sessions",
        label: "Recent Sessions",
        value: 8,
        change: "5 completed",
        changeType: "neutral",
        iconName: "Clock"
    },
    {
        id: "active-now",
        label: "Active Now",
        value: 3,
        change: "Live sync connected",
        changeType: "positive",
        iconName: "Zap"
    }
];
