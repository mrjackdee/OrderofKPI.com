export interface SupportFeature {
  title: string;
  description: string;
  iconName: 'Ticket' | 'Sparkles' | 'ShieldCheck';
}

export interface SupportCenterConfig {
  url: string;
  isLive: boolean;
  statusLabel: string;
  heading: string;
  subheading: string;
  description: string;
  supportingLine: string;
  buttonLabel: string;
  features: SupportFeature[];
}

export const SUPPORT_CENTER_CONFIG: SupportCenterConfig = {
  url: "https://support.orderofkpi.com/",
  isLive: false,
  statusLabel: "COMING SOON",
  heading: "KP Member Support Center",
  subheading: "Centralized Technical & Organizational Assistance",
  description: "A centralized support portal designed to streamline assistance for all members. Submit technical inquiries, track resolution milestones in real time, and request digital portal enhancements with complete transparency.",
  supportingLine: "One request. Clear updates. Zero friction.",
  buttonLabel: "PREVIEW SUPPORT CENTER",
  features: [
    {
      title: "Real-Time Ticket Tracking",
      description: "Receive a dedicated request ID and monitor resolution progress from submission to completion.",
      iconName: "Ticket"
    },
    {
      title: "Portal Enhancements",
      description: "Submit feature suggestions and technical bug reports directly to organizational engineering.",
      iconName: "Sparkles"
    },
    {
      title: "Account & Roster Help",
      description: "Get prompt assistance with member portal credentials, committee access, and account settings.",
      iconName: "ShieldCheck"
    }
  ]
};
